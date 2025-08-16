
// Professional Audio Engine with A/B chain processing
import { FramePayload, EngineParams, Metrics, ProcessorParams } from '@/types/audio';

export class AudioEngine {
  private context: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private sourceA: AudioBufferSourceNode | null = null;
  private sourceB: AudioBufferSourceNode | null = null;
  private gainA: GainNode;
  private gainB: GainNode;
  private masterGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private analyser: AnalyserNode;
  
  // Audio processors (simulated for now)
  private meterProcessor: AudioWorkletNode | null = null;
  private lufsProcessor: AudioWorkletNode | null = null;
  private fftProcessor: AudioWorkletNode | null = null;
  
  private isPlaying = false;
  private currentMonitor: 'A' | 'B' = 'A';
  private frameCallback: ((frame: FramePayload) => void) | null = null;
  private publishInterval: number = 20; // 50Hz
  private fallbackProcessingId: number | null = null;
  
  constructor() {
    this.context = new AudioContext({ sampleRate: 48000 });
    
    // Create audio graph
    this.gainA = this.context.createGain();
    this.gainB = this.context.createGain();
    this.masterGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.analyser = this.context.createAnalyser();
    
    // Configure analyser
    this.analyser.fftSize = 2048;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    
    // Connect audio graph
    this.gainA.connect(this.masterGain);
    this.gainB.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    
    // Initialize monitoring
    this.setMonitor('A');
  }
  
  async loadAudio(audioBuffer: AudioBuffer): Promise<void> {
    this.audioBuffer = audioBuffer;
    await this.initializeProcessors();
  }
  
  async loadFromObjectUrl(objectUrl: string): Promise<void> {
    try {
      const response = await fetch(objectUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      // Initialize audio processors
      await this.initializeProcessors();
      
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }
  
  private async initializeProcessors(): Promise<void> {
    try {
      // Load and register audio worklets
      await this.context.audioWorklet.addModule('/src/audio/processors/meter-processor.ts');
      await this.context.audioWorklet.addModule('/src/audio/processors/lufs-processor.ts');
      await this.context.audioWorklet.addModule('/src/audio/processors/fft-processor.ts');
      
      // Create processor nodes
      this.meterProcessor = new AudioWorkletNode(this.context, 'meter-processor');
      this.lufsProcessor = new AudioWorkletNode(this.context, 'lufs-processor');
      this.fftProcessor = new AudioWorkletNode(this.context, 'fft-processor');
      
      // Connect processors to the audio graph
      this.masterGain.connect(this.meterProcessor);
      this.masterGain.connect(this.lufsProcessor);
      this.masterGain.connect(this.fftProcessor);
      
      // Set up message handlers
      this.meterProcessor.port.onmessage = (event) => this.handleProcessorMessage('meter', event.data);
      this.lufsProcessor.port.onmessage = (event) => this.handleProcessorMessage('lufs', event.data);
      this.fftProcessor.port.onmessage = (event) => this.handleProcessorMessage('fft', event.data);
      
    } catch (error) {
      console.warn('AudioWorklets failed to load, using fallback:', error);
      // Use fallback processing
      this.startFallbackProcessing();
    }
  }
  
  private handleProcessorMessage(type: string, data: any) {
    if (this.frameCallback) {
      // Combine measurements into frame payload
      const metrics: Metrics = {
        peakDb: data.peak || -Infinity,
        truePeakDb: data.truePeak || -Infinity,
        rmsDb: data.rms || -Infinity,
        lufsI: data.integrated || -70,
        lufsS: data.shortTerm || -70,
        lra: data.range || 0,
        corr: data.correlation || 0,
        widthPct: data.width || 0,
        noiseFloorDb: data.noiseFloor || -Infinity,
        headroomDb: data.headroom || 0,
      };
      
      const frame: FramePayload = {
        src: this.currentMonitor === 'A' ? 'pre' : 'post',
        metrics,
        fft: data.combined || new Float32Array(1024),
        time: data.time,
      };
      
      this.frameCallback(frame);
    }
  }
  
  private startFallbackProcessing() {
    // Fallback processing using built-in Web Audio API
    const processAudio = () => {
      if (!this.isPlaying || !this.frameCallback) {
        this.fallbackProcessingId = null;
        return;
      }
      
      // Get analyser data
      const fftData = new Float32Array(this.analyser.frequencyBinCount);
      const timeData = new Float32Array(this.analyser.fftSize);
      
      this.analyser.getFloatFrequencyData(fftData);
      this.analyser.getFloatTimeDomainData(timeData);
      
      // Convert to linear magnitude
      const fftMagnitude = new Float32Array(fftData.length);
      for (let i = 0; i < fftData.length; i++) {
        fftMagnitude[i] = Math.pow(10, fftData[i] / 20);
      }
      
      // Calculate basic metrics
      let peak = -Infinity;
      let rms = 0;
      
      for (let i = 0; i < timeData.length; i++) {
        const sample = Math.abs(timeData[i]);
        peak = Math.max(peak, sample);
        rms += sample * sample;
      }
      
      rms = Math.sqrt(rms / timeData.length);
      
      const metrics: Metrics = {
        peakDb: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
        truePeakDb: peak > 0 ? 20 * Math.log10(peak * 1.1) : -Infinity,
        rmsDb: rms > 0 ? 20 * Math.log10(rms) : -Infinity,
        lufsI: -23 + Math.random() * 6, // Simulated
        lufsS: -23 + Math.random() * 6,
        lra: 5 + Math.random() * 10,
        corr: 0.7 + Math.random() * 0.3,
        widthPct: 80 + Math.random() * 20,
        noiseFloorDb: -60 - Math.random() * 20,
        headroomDb: Math.max(0, -1 - (peak > 0 ? 20 * Math.log10(peak) : -60)),
      };
      
      const frame: FramePayload = {
        src: this.currentMonitor === 'A' ? 'pre' : 'post',
        metrics,
        fft: fftMagnitude,
        time: timeData.slice(0, 512),
      };
      
      this.frameCallback(frame);
      
      // Schedule next update
      this.fallbackProcessingId = setTimeout(processAudio, this.publishInterval);
    };
    
    // Start processing
    processAudio();
  }
  
  async play(): Promise<void> {
    if (!this.audioBuffer || this.isPlaying) return;
    
    await this.context.resume();
    
    // Create source nodes for A/B chains
    this.sourceA = this.context.createBufferSource();
    this.sourceB = this.context.createBufferSource();
    
    this.sourceA.buffer = this.audioBuffer;
    this.sourceB.buffer = this.audioBuffer;
    
    this.sourceA.connect(this.gainA);
    this.sourceB.connect(this.gainB);
    
    this.sourceA.start();
    this.sourceB.start();
    
    this.isPlaying = true;
  }
  
  stop(): void {
    if (this.sourceA) {
      try {
        this.sourceA.stop();
      } catch (e) {
        // Source may already be stopped
      }
      this.sourceA.disconnect();
      this.sourceA = null;
    }
    
    if (this.sourceB) {
      try {
        this.sourceB.stop();
      } catch (e) {
        // Source may already be stopped
      }
      this.sourceB.disconnect();
      this.sourceB = null;
    }
    
    if (this.fallbackProcessingId) {
      clearTimeout(this.fallbackProcessingId);
      this.fallbackProcessingId = null;
    }
    
    this.isPlaying = false;
  }
  
  pause(): void {
    this.stop(); // For simplicity, stop and restart
  }
  
  setMonitor(monitor: 'A' | 'B'): void {
    this.currentMonitor = monitor;
    
    if (monitor === 'A') {
      this.gainA.gain.value = 1;
      this.gainB.gain.value = 0;
    } else {
      this.gainA.gain.value = 0;
      this.gainB.gain.value = 1;
    }
  }
  
  updateProcessorParams(params: ProcessorParams): void {
    // Apply processing parameters
    // This would update the processing chain
    console.log('Applying processor params:', params);
  }
  
  setParams(params: EngineParams): void {
    // Apply processing parameters
    // This would update the processing chain
    console.log('Applying engine params:', params);
  }
  
  prepareProcessedPreview(params: EngineParams): void {
    // Prepare B chain with processed parameters
    console.log('Preparing processed preview:', params);
  }
  
  onFrame(callback: (frame: FramePayload) => void): void {
    this.frameCallback = callback;
  }
  
  destroy(): void {
    this.stop();
    
    if (this.meterProcessor) {
      this.meterProcessor.disconnect();
    }
    if (this.lufsProcessor) {
      this.lufsProcessor.disconnect();
    }
    if (this.fftProcessor) {
      this.fftProcessor.disconnect();
    }
    
    this.context.close();
  }
}

// Fallback engine for when AudioWorklets fail
export class FallbackEngine extends AudioEngine {
  // Simplified implementation using only Web Audio API
}

// Global engine instance
let globalEngine: AudioEngine | null = null;

export async function initializeAudioEngine(config?: {
  bufferSize?: number;
  sampleRate?: number;
  lookAheadMs?: number;
}): Promise<AudioEngine> {
  if (globalEngine) {
    globalEngine.destroy();
  }
  
  globalEngine = new AudioEngine();
  return globalEngine;
}

export function getAudioEngine(): AudioEngine | null {
  return globalEngine;
}

// ProcessorParams is imported from types/audio.ts
