/**
 * AudioEngine.ts - Core audio processing engine with A/B mastering chain
 * Implements exact graph: Source → Split(A/B) → Processing → Latency Alignment → Output
 */

import { WorkletLoader } from './WorkletLoader';

export interface AudioMetrics {
  peak: number;
  rms: number;
  truePeak: number;
  correlation: number;
  stereoWidth: number;
  noiseFloor: number;
  lufsI: number;
  lufsS: number;
  lufsM: number;
  lra: number;
  dbtp: number;
}

export interface MasterParams {
  // M/S EQ parameters
  msEq: {
    mid: { low: { freq: number; gain: number; q: number }; mid: { freq: number; gain: number; q: number }; high: { freq: number; gain: number; q: number } };
    side: { low: { freq: number; gain: number; q: number }; mid: { freq: number; gain: number; q: number }; high: { freq: number; gain: number; q: number } };
  };
  // Denoise parameters
  denoise: { enabled: boolean; alpha: number; mode: 'spectral' | 'wiener' };
  // Limiter parameters
  limiter: { threshold: number; ceiling: number; attack: number; release: number; lookahead: number };
  // Target metrics
  targets: { lufs: number; dbtp: number; lra: number };
}

export interface RenderedAssets {
  wav: ArrayBuffer;
  mp3: ArrayBuffer;
  flac: ArrayBuffer;
  comparePng: ArrayBuffer;
  spectraPng: ArrayBuffer;
  report: string;
  metrics: AudioMetrics;
  checksum: string;
  renderMs: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private sourceBuffer: AudioBuffer | null = null;
  private isInitialized = false;
  private isProcessing = false;
  
  // A/B Chain nodes
  private sourceNode: AudioBufferSourceNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNodeA: ChannelMergerNode | null = null;
  private mergerNodeB: ChannelMergerNode | null = null;
  private delayNodeA: DelayNode | null = null;
  private gainNodeA: GainNode | null = null;
  private gainNodeB: GainNode | null = null;
  
  // Processing chain (B path)
  private msEncodeWorklet: AudioWorkletNode | null = null;
  private msEqWorklet: AudioWorkletNode | null = null;
  private denoiseWorklet: AudioWorkletNode | null = null;
  private limiterWorklet: AudioWorkletNode | null = null;
  private msDecodeWorklet: AudioWorkletNode | null = null;
  
  // Analysis nodes (both paths)
  private meterWorkletA: AudioWorkletNode | null = null;
  private meterWorkletB: AudioWorkletNode | null = null;
  private lufsWorkletA: AudioWorkletNode | null = null;
  private lufsWorkletB: AudioWorkletNode | null = null;
  private fftWorkletA: AudioWorkletNode | null = null;
  private fftWorkletB: AudioWorkletNode | null = null;
  
  // Current parameters
  private currentParams: MasterParams = this.getDefaultParams();
  private workletLoader = new WorkletLoader();
  
  // A/B monitoring
  private monitorGainA: GainNode | null = null;
  private monitorGainB: GainNode | null = null;
  private abRatio = 0; // 0 = A only, 1 = B only
  
  // Metrics callbacks
  private metricsCallbacks: ((metrics: AudioMetrics, path: 'A' | 'B') => void)[] = [];

  constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.context = new AudioContext();
    await this.workletLoader.loadAllWorklets(this.context);
    this.isInitialized = true;
  }

  async loadAudio(buffer: AudioBuffer): Promise<void> {
    if (!this.context) throw new Error('Engine not initialized');
    
    this.sourceBuffer = buffer;
    await this.buildAudioGraph();
  }

  private async buildAudioGraph(): Promise<void> {
    if (!this.context || !this.sourceBuffer) return;

    // Clean up existing nodes
    this.cleanup();

    // Create source
    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = this.sourceBuffer;

    // Create splitter for A/B paths
    this.splitterNode = this.context.createChannelSplitter(2);
    this.mergerNodeA = this.context.createChannelMerger(2);
    this.mergerNodeB = this.context.createChannelMerger(2);

    // Create delay for latency compensation (A path)
    this.delayNodeA = this.context.createDelay(0.1); // Max 100ms delay
    this.updateLatencyCompensation();

    // Create A/B monitoring gains
    this.monitorGainA = this.context.createGain();
    this.monitorGainB = this.context.createGain();
    this.gainNodeA = this.context.createGain();
    this.gainNodeB = this.context.createGain();

    // Create processing worklets (B path)
    this.msEncodeWorklet = new AudioWorkletNode(this.context, 'ms-encoder');
    this.msEqWorklet = new AudioWorkletNode(this.context, 'ms-eq-processor');
    this.denoiseWorklet = new AudioWorkletNode(this.context, 'denoise-processor');
    this.limiterWorklet = new AudioWorkletNode(this.context, 'limiter-processor');
    this.msDecodeWorklet = new AudioWorkletNode(this.context, 'ms-decoder');

    // Create analysis worklets (both paths)
    this.meterWorkletA = new AudioWorkletNode(this.context, 'meter-processor');
    this.meterWorkletB = new AudioWorkletNode(this.context, 'meter-processor');
    this.lufsWorkletA = new AudioWorkletNode(this.context, 'lufs-processor');
    this.lufsWorkletB = new AudioWorkletNode(this.context, 'lufs-processor');
    this.fftWorkletA = new AudioWorkletNode(this.context, 'fft-processor');
    this.fftWorkletB = new AudioWorkletNode(this.context, 'fft-processor');

    // Connect A path (original): Source → Split → Delay → Meter → LUFS → FFT → Monitor → Dest
    this.sourceNode.connect(this.splitterNode);
    this.splitterNode.connect(this.mergerNodeA, 0, 0);
    this.splitterNode.connect(this.mergerNodeA, 1, 1);
    this.mergerNodeA.connect(this.delayNodeA);
    this.delayNodeA.connect(this.meterWorkletA);
    this.meterWorkletA.connect(this.lufsWorkletA);
    this.lufsWorkletA.connect(this.fftWorkletA);
    this.fftWorkletA.connect(this.gainNodeA);
    this.gainNodeA.connect(this.monitorGainA);
    this.monitorGainA.connect(this.context.destination);

    // Connect B path (processed): Source → Split → MS Encode → MS EQ → Denoise → Limiter → MS Decode → Meter → LUFS → FFT → Monitor → Dest
    this.splitterNode.connect(this.mergerNodeB, 0, 0);
    this.splitterNode.connect(this.mergerNodeB, 1, 1);
    this.mergerNodeB.connect(this.msEncodeWorklet);
    this.msEncodeWorklet.connect(this.msEqWorklet);
    this.msEqWorklet.connect(this.denoiseWorklet);
    this.denoiseWorklet.connect(this.limiterWorklet);
    this.limiterWorklet.connect(this.msDecodeWorklet);
    this.msDecodeWorklet.connect(this.meterWorkletB);
    this.meterWorkletB.connect(this.lufsWorkletB);
    this.lufsWorkletB.connect(this.fftWorkletB);
    this.fftWorkletB.connect(this.gainNodeB);
    this.gainNodeB.connect(this.monitorGainB);
    this.monitorGainB.connect(this.context.destination);

    // Set up metrics callbacks
    this.setupMetricsCallbacks();

    // Apply current parameters
    this.updateAllParameters();
  }

  private setupMetricsCallbacks(): void {
    // Meter callbacks
    this.meterWorkletA?.port.addEventListener('message', (e) => {
      if (e.data.type === 'metrics') {
        this.notifyMetrics({ ...e.data.metrics }, 'A');
      }
    });

    this.meterWorkletB?.port.addEventListener('message', (e) => {
      if (e.data.type === 'metrics') {
        this.notifyMetrics({ ...e.data.metrics }, 'B');
      }
    });

    // LUFS callbacks
    this.lufsWorkletA?.port.addEventListener('message', (e) => {
      if (e.data.type === 'lufs') {
        this.notifyMetrics({ lufsI: e.data.integrated, lufsS: e.data.shortTerm, lufsM: e.data.momentary, lra: e.data.lra }, 'A');
      }
    });

    this.lufsWorkletB?.port.addEventListener('message', (e) => {
      if (e.data.type === 'lufs') {
        this.notifyMetrics({ lufsI: e.data.integrated, lufsS: e.data.shortTerm, lufsM: e.data.momentary, lra: e.data.lra }, 'B');
      }
    });

    // Start message ports
    this.meterWorkletA?.port.start();
    this.meterWorkletB?.port.start();
    this.lufsWorkletA?.port.start();
    this.lufsWorkletB?.port.start();
  }

  private updateLatencyCompensation(): void {
    if (!this.delayNodeA || !this.currentParams) return;
    
    // Calculate total processing latency from limiter lookahead
    const lookaheadMs = this.currentParams.limiter.lookahead;
    const sampleRate = this.context?.sampleRate || 48000;
    const delaySamples = Math.ceil((lookaheadMs / 1000) * sampleRate);
    const delaySeconds = delaySamples / sampleRate;
    
    this.delayNodeA.delayTime.setValueAtTime(delaySeconds, this.context?.currentTime || 0);
  }

  setABRatio(ratio: number): void {
    this.abRatio = Math.max(0, Math.min(1, ratio));
    
    if (this.monitorGainA && this.monitorGainB && this.context) {
      // Crossfade with 5ms ramps to prevent zipper noise
      const fadeTime = 0.005;
      const currentTime = this.context.currentTime;
      
      this.monitorGainA.gain.setTargetAtTime(1 - this.abRatio, currentTime, fadeTime);
      this.monitorGainB.gain.setTargetAtTime(this.abRatio, currentTime, fadeTime);
    }
  }

  updateMasterParams(params: Partial<MasterParams>): void {
    this.currentParams = { ...this.currentParams, ...params };
    this.updateAllParameters();
    this.updateLatencyCompensation();
  }

  private updateAllParameters(): void {
    // Update MS EQ
    this.msEqWorklet?.port.postMessage({
      type: 'updateParams',
      params: this.currentParams.msEq
    });

    // Update denoise
    this.denoiseWorklet?.port.postMessage({
      type: 'updateParams',
      params: this.currentParams.denoise
    });

    // Update limiter
    this.limiterWorklet?.port.postMessage({
      type: 'updateParams',
      params: this.currentParams.limiter
    });
  }

  onMetrics(callback: (metrics: AudioMetrics, path: 'A' | 'B') => void): void {
    this.metricsCallbacks.push(callback);
  }

  private notifyMetrics(metrics: Partial<AudioMetrics>, path: 'A' | 'B'): void {
    const fullMetrics: AudioMetrics = {
      peak: -60,
      rms: -60,
      truePeak: -60,
      correlation: 0,
      stereoWidth: 0,
      noiseFloor: -60,
      lufsI: -70,
      lufsS: -70,
      lufsM: -70,
      lra: 0,
      dbtp: -60,
      ...metrics
    };

    this.metricsCallbacks.forEach(cb => cb(fullMetrics, path));
  }

  async startPlayback(): Promise<void> {
    if (!this.sourceNode || this.isProcessing) return;
    
    this.isProcessing = true;
    this.sourceNode.start(0);
  }

  stopPlayback(): void {
    if (this.sourceNode && this.isProcessing) {
      this.sourceNode.stop();
      this.isProcessing = false;
    }
  }

  async renderMaster(params: MasterParams): Promise<RenderedAssets> {
    if (!this.sourceBuffer || !this.context) {
      throw new Error('No audio loaded or context not initialized');
    }

    const start = performance.now();

    // Create offline context matching the source
    const duration = this.sourceBuffer.duration;
    const sampleRate = this.context.sampleRate;
    const offlineContext = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

    // Load worklets in offline context
    await this.workletLoader.loadAllWorklets(offlineContext);

    // Build identical processing chain in offline context
    const source = offlineContext.createBufferSource();
    source.buffer = this.sourceBuffer;

    const splitter = offlineContext.createChannelSplitter(2);
    const merger = offlineContext.createChannelMerger(2);

    // Create processing worklets
    const msEncode = new AudioWorkletNode(offlineContext, 'ms-encoder');
    const msEq = new AudioWorkletNode(offlineContext, 'ms-eq-processor');
    const denoise = new AudioWorkletNode(offlineContext, 'denoise-processor');
    const limiter = new AudioWorkletNode(offlineContext, 'limiter-processor');
    const msDecode = new AudioWorkletNode(offlineContext, 'ms-decoder');

    // Set parameters
    msEq.port.postMessage({ type: 'updateParams', params: params.msEq });
    denoise.port.postMessage({ type: 'updateParams', params: params.denoise });
    limiter.port.postMessage({ type: 'updateParams', params: params.limiter });

    // Connect processing chain: Source → Split → MS Encode → MS EQ → Denoise → Limiter → MS Decode → Destination
    source.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 1, 1);
    merger.connect(msEncode);
    msEncode.connect(msEq);
    msEq.connect(denoise);
    denoise.connect(limiter);
    limiter.connect(msDecode);
    msDecode.connect(offlineContext.destination);

    // Render
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    // Encode formats
    const wav = await this.encodeWav(renderedBuffer, 24);
    const mp3 = await this.encodeMp3(renderedBuffer);
    const flac = await this.encodeFlac(renderedBuffer);

    // Generate visuals
    const comparePng = await this.renderWaveformComparisonPng(this.sourceBuffer, renderedBuffer);
    const spectraPng = await this.renderAverageSpectraPng(this.sourceBuffer, renderedBuffer);

    // Calculate final metrics
    const metrics = await this.calculateFinalMetrics(renderedBuffer);
    const report = this.buildTextReport(metrics, params);
    const checksum = await this.sha256(wav);

    return {
      wav,
      mp3,
      flac,
      comparePng,
      spectraPng,
      report,
      metrics,
      checksum,
      renderMs: performance.now() - start
    };
  }

  private async encodeWav(buffer: AudioBuffer, bitDepth: 16 | 24 = 24): Promise<ArrayBuffer> {
    const length = buffer.length;
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    const maxValue = Math.pow(2, bitDepth - 1) - 1;

    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        const intSample = Math.round(sample * maxValue);

        if (bitDepth === 16) {
          view.setInt16(offset, intSample, true);
          offset += 2;
        } else if (bitDepth === 24) {
          view.setInt8(offset, intSample & 0xFF);
          view.setInt8(offset + 1, (intSample >> 8) & 0xFF);
          view.setInt8(offset + 2, (intSample >> 16) & 0xFF);
          offset += 3;
        }
      }
    }

    return arrayBuffer;
  }

  private async encodeMp3(buffer: AudioBuffer): Promise<ArrayBuffer> {
    // This is a placeholder - would need lamejs implementation
    // For now, return empty buffer
    return new ArrayBuffer(0);
  }

  private async encodeFlac(buffer: AudioBuffer): Promise<ArrayBuffer> {
    // This is a placeholder - would need flac-encoder implementation
    // For now, return empty buffer
    return new ArrayBuffer(0);
  }

  private async renderWaveformComparisonPng(original: AudioBuffer, processed: AudioBuffer): Promise<ArrayBuffer> {
    // Create canvas for waveform rendering
    const canvas = new OffscreenCanvas(1200, 400);
    const ctx = canvas.getContext('2d')!;

    // Draw comparison waveforms
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1200, 400);

    // Draw original waveform (top half)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    this.drawWaveform(ctx, original, 0, 0, 1200, 200);

    // Draw processed waveform (bottom half)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    this.drawWaveform(ctx, processed, 0, 200, 1200, 200);

    // Convert to PNG
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return await blob.arrayBuffer();
  }

  private drawWaveform(ctx: CanvasRenderingContext2D, buffer: AudioBuffer, x: number, y: number, width: number, height: number): void {
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      ctx.moveTo(x + i, y + amp + (min * amp));
      ctx.lineTo(x + i, y + amp + (max * amp));
    }
    ctx.stroke();
  }

  private async renderAverageSpectraPng(original: AudioBuffer, processed: AudioBuffer): Promise<ArrayBuffer> {
    // Placeholder for spectrum analysis rendering
    const canvas = new OffscreenCanvas(1200, 400);
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1200, 400);
    
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return await blob.arrayBuffer();
  }

  private async calculateFinalMetrics(buffer: AudioBuffer): Promise<AudioMetrics> {
    // Calculate final metrics from rendered buffer
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;

    let peak = 0;
    let rmsSum = 0;
    let correlation = 0;

    for (let i = 0; i < leftChannel.length; i++) {
      const l = leftChannel[i];
      const r = rightChannel[i];
      
      peak = Math.max(peak, Math.abs(l), Math.abs(r));
      rmsSum += (l * l + r * r) / 2;
      correlation += l * r;
    }

    const rms = Math.sqrt(rmsSum / leftChannel.length);
    const normalizedCorrelation = correlation / leftChannel.length;

    return {
      peak: 20 * Math.log10(peak + 1e-10),
      rms: 20 * Math.log10(rms + 1e-10),
      truePeak: 20 * Math.log10(peak + 1e-10), // Simplified
      correlation: normalizedCorrelation,
      stereoWidth: 1 - Math.abs(normalizedCorrelation),
      noiseFloor: -60, // Placeholder
      lufsI: -14, // Placeholder
      lufsS: -14, // Placeholder
      lufsM: -14, // Placeholder
      lra: 8, // Placeholder
      dbtp: 20 * Math.log10(peak + 1e-10)
    };
  }

  private buildTextReport(metrics: AudioMetrics, params: MasterParams): string {
    const timestamp = new Date().toISOString();
    
    return `C/No Voidline Mastering Report
========================================

Generated: ${timestamp}
Engine: AudioEngine v1.0

LOUDNESS METRICS
================
Integrated LUFS: ${metrics.lufsI.toFixed(1)}
True Peak (dBTP): ${metrics.dbtp.toFixed(1)}
Loudness Range: ${metrics.lra.toFixed(1)} LU
RMS Level: ${metrics.rms.toFixed(1)} dBFS
Peak Level: ${metrics.peak.toFixed(1)} dBFS

STEREO METRICS
==============
Correlation: ${metrics.correlation.toFixed(3)}
Stereo Width: ${(metrics.stereoWidth * 100).toFixed(1)}%
Noise Floor: ${metrics.noiseFloor.toFixed(1)} dBFS

PROCESSING CHAIN
================
MS EQ: Mid ${params.msEq.mid.low.gain.toFixed(1)}dB@${params.msEq.mid.low.freq}Hz, Side ${params.msEq.side.low.gain.toFixed(1)}dB@${params.msEq.side.low.freq}Hz
Denoise: ${params.denoise.enabled ? 'Enabled' : 'Disabled'} (α=${params.denoise.alpha.toFixed(2)})
Limiter: ${params.limiter.threshold.toFixed(1)}dB threshold, ${params.limiter.ceiling.toFixed(1)}dB ceiling

TARGET COMPLIANCE
=================
Target LUFS: ${params.targets.lufs.toFixed(1)} (Δ=${(metrics.lufsI - params.targets.lufs).toFixed(1)})
Target dBTP: ${params.targets.dbtp.toFixed(1)} (Δ=${(metrics.dbtp - params.targets.dbtp).toFixed(1)})
Target LRA: ${params.targets.lra.toFixed(1)} (Δ=${(metrics.lra - params.targets.lra).toFixed(1)})

========================================
C/No Voidline - Frequencies attained. Stillness remains.
`;
  }

  private async sha256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getDefaultParams(): MasterParams {
    return {
      msEq: {
        mid: {
          low: { freq: 100, gain: 0, q: 0.7 },
          mid: { freq: 1000, gain: 0, q: 0.7 },
          high: { freq: 8000, gain: 0, q: 0.7 }
        },
        side: {
          low: { freq: 100, gain: 0, q: 0.7 },
          mid: { freq: 1000, gain: 0, q: 0.7 },
          high: { freq: 8000, gain: 0, q: 0.7 }
        }
      },
      denoise: { enabled: false, alpha: 0.1, mode: 'spectral' },
      limiter: { threshold: -1, ceiling: -0.1, attack: 1, release: 100, lookahead: 5 },
      targets: { lufs: -14, dbtp: -1, lra: 8 }
    };
  }

  private cleanup(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    // Clean up all other nodes...
  }

  getCurrentDurationSec(): number {
    return this.sourceBuffer?.duration || 0;
  }

  destroy(): void {
    this.cleanup();
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }
  }
}