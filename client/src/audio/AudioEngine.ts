import { useSessionStore } from '@/state/useSessionStore';

export interface AudioEngineConfig {
  bufferSize: number;
  sampleRate: number;
  lookAheadMs: number;
}

export interface ProcessorParams {
  // MS EQ parameters
  midGains: [number, number, number]; // 3 bands
  sideGains: [number, number, number];
  midFreqs: [number, number, number];
  sideFreqs: [number, number, number];
  midQs: [number, number, number];
  sideQs: [number, number, number];
  
  // Denoise parameters  
  denoiseAmount: number;
  noiseGateThreshold: number;
  
  // Limiter parameters
  threshold: number;
  ceiling: number;
  lookAheadSamples: number;
  attack: number;
  release: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isPlaying = false;
  private workletSupported = true;
  
  // Audio graph nodes
  private splitterA: ChannelSplitterNode | null = null;
  private mergerA: ChannelMergerNode | null = null;
  private meterA: AudioWorkletNode | AnalyserNode | null = null;
  private lufsA: AudioWorkletNode | AnalyserNode | null = null;
  private fftA: AudioWorkletNode | AnalyserNode | null = null;
  private delayA: DelayNode | null = null;
  private gainA: GainNode | null = null;
  
  private splitterB: ChannelSplitterNode | null = null;
  private msEncoder: AudioWorkletNode | null = null;
  private msEQ: AudioWorkletNode | null = null;
  private denoise: AudioWorkletNode | null = null;
  private limiter: AudioWorkletNode | null = null;
  private msDecoder: AudioWorkletNode | null = null;
  private mergerB: ChannelMergerNode | null = null;
  private meterB: AudioWorkletNode | AnalyserNode | null = null;
  private lufsB: AudioWorkletNode | AnalyserNode | null = null;
  private fftB: AudioWorkletNode | AnalyserNode | null = null;
  private gainB: GainNode | null = null;
  
  private destinationA: GainNode | null = null;
  private destinationB: GainNode | null = null;
  private mainOutput: GainNode | null = null;
  
  private rafId: number | null = null;
  private updateCallback: ((deltaTime: number) => void) | null = null;
  private lastTime = 0;
  
  private currentParams: ProcessorParams = {
    midGains: [0, 0, 0],
    sideGains: [0, 0, 0],
    midFreqs: [200, 1000, 5000],
    sideFreqs: [200, 1000, 5000],
    midQs: [1, 1, 1],
    sideQs: [1, 1, 1],
    denoiseAmount: 0,
    noiseGateThreshold: -60,
    threshold: -6,
    ceiling: -1,
    lookAheadSamples: 0,
    attack: 5,
    release: 50,
  };
  
  constructor(private config: AudioEngineConfig = {
    bufferSize: 4096,
    sampleRate: 48000,
    lookAheadMs: 5.0,
  }) {}
  
  async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive',
      });
      
      // Calculate look-ahead delay in samples
      this.currentParams.lookAheadSamples = Math.floor(
        this.config.lookAheadMs * this.audioContext.sampleRate / 1000
      );
      
      // Try to load audio worklets
      try {
        await this.loadAudioWorklets();
        console.log('AudioWorklets loaded successfully');
      } catch (error) {
        console.warn('AudioWorklets failed to load, using fallback:', error);
        this.workletSupported = false;
      }
      
      // Create the audio graph
      await this.createAudioGraph();
      
      // Start the update loop
      this.startUpdateLoop();
      
    } catch (error) {
      console.error('AudioEngine initialization failed:', error);
      throw error;
    }
  }
  
  private async loadAudioWorklets(): Promise<void> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const workletModules = [
      '/src/audio/processors/meter-processor.js',
      '/src/audio/processors/lufs-processor.js', 
      '/src/audio/processors/fft-processor.js',
      '/src/audio/processors/ms-eq-processor.js',
      '/src/audio/processors/denoise-processor.js',
      '/src/audio/processors/limiter-processor.js',
    ];
    
    for (const module of workletModules) {
      await this.audioContext.audioWorklet.addModule(module);
    }
  }
  
  private async createAudioGraph(): Promise<void> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    // Channel A (original signal with delay compensation)
    this.splitterA = this.audioContext.createChannelSplitter(2);
    this.mergerA = this.audioContext.createChannelMerger(2);
    
    if (this.workletSupported) {
      this.meterA = new AudioWorkletNode(this.audioContext, 'meter-processor');
      this.lufsA = new AudioWorkletNode(this.audioContext, 'lufs-processor');  
      this.fftA = new AudioWorkletNode(this.audioContext, 'fft-processor', {
        processorOptions: { fftSize: this.config.bufferSize }
      });
      
      // Set up message handlers for channel A
      this.setupWorkletHandlers('A', this.meterA, this.lufsA, this.fftA);
    } else {
      // Fallback to AnalyserNodes
      this.meterA = this.audioContext.createAnalyser();
      this.lufsA = this.audioContext.createAnalyser();
      this.fftA = this.audioContext.createAnalyser();
      this.setupAnalyserFallback('A');
    }
    
    // Delay compensation for channel A (matches limiter look-ahead)
    this.delayA = this.audioContext.createDelay(0.1); // Max 100ms
    this.delayA.delayTime.value = this.currentParams.lookAheadSamples / this.audioContext.sampleRate;
    
    this.gainA = this.audioContext.createGain();
    
    // Channel B (processed signal)
    this.splitterB = this.audioContext.createChannelSplitter(2);
    
    if (this.workletSupported) {
      // M/S processing chain
      this.msEncoder = new AudioWorkletNode(this.audioContext, 'ms-encoder');
      this.msEQ = new AudioWorkletNode(this.audioContext, 'ms-eq-processor');
      this.denoise = new AudioWorkletNode(this.audioContext, 'denoise-processor', {
        processorOptions: { bufferSize: 1024 }
      });
      this.limiter = new AudioWorkletNode(this.audioContext, 'limiter-processor', {
        processorOptions: { lookAheadSamples: this.currentParams.lookAheadSamples }
      });
      this.msDecoder = new AudioWorkletNode(this.audioContext, 'ms-decoder');
      
      this.meterB = new AudioWorkletNode(this.audioContext, 'meter-processor');
      this.lufsB = new AudioWorkletNode(this.audioContext, 'lufs-processor');
      this.fftB = new AudioWorkletNode(this.audioContext, 'fft-processor', {
        processorOptions: { fftSize: this.config.bufferSize }
      });
      
      // Set up message handlers for channel B  
      this.setupWorkletHandlers('B', this.meterB, this.lufsB, this.fftB);
      this.setupProcessorHandlers();
    } else {
      // Simplified fallback processing
      this.meterB = this.audioContext.createAnalyser();
      this.lufsB = this.audioContext.createAnalyser(); 
      this.fftB = this.audioContext.createAnalyser();
      this.setupAnalyserFallback('B');
    }
    
    this.mergerB = this.audioContext.createChannelMerger(2);
    this.gainB = this.audioContext.createGain();
    
    // Output routing
    this.destinationA = this.audioContext.createGain();
    this.destinationB = this.audioContext.createGain();
    this.mainOutput = this.audioContext.createGain();
    
    // Connect Channel A (original with delay)
    this.connectChannelA();
    
    // Connect Channel B (processed)
    this.connectChannelB();
    
    // Connect outputs  
    this.destinationA.connect(this.mainOutput);
    this.destinationB.connect(this.mainOutput);
    this.mainOutput.connect(this.audioContext.destination);
    
    // Initialize monitor routing (A by default)
    this.setMonitor('A');
  }
  
  private connectChannelA(): void {
    if (!this.splitterA || !this.meterA || !this.lufsA || !this.fftA || 
        !this.delayA || !this.mergerA || !this.gainA || !this.destinationA) {
      return;
    }
    
    // Split -> Meter -> LUFS -> FFT -> Delay -> Merge -> Gain -> Output
    this.splitterA.connect(this.mergerA);
    this.mergerA.connect(this.meterA as AudioNode);
    (this.meterA as AudioNode).connect(this.lufsA as AudioNode);
    (this.lufsA as AudioNode).connect(this.fftA as AudioNode);
    (this.fftA as AudioNode).connect(this.delayA);
    this.delayA.connect(this.gainA);
    this.gainA.connect(this.destinationA);
  }
  
  private connectChannelB(): void {
    if (!this.workletSupported) {
      // Simple fallback routing
      if (this.splitterB && this.mergerB && this.meterB && this.lufsB && 
          this.fftB && this.gainB && this.destinationB) {
        this.splitterB.connect(this.mergerB);
        this.mergerB.connect(this.meterB as AudioNode);
        (this.meterB as AudioNode).connect(this.lufsB as AudioNode);
        (this.lufsB as AudioNode).connect(this.fftB as AudioNode);
        (this.fftB as AudioNode).connect(this.gainB);
        this.gainB.connect(this.destinationB);
      }
      return;
    }
    
    if (!this.splitterB || !this.msEncoder || !this.msEQ || !this.denoise ||
        !this.limiter || !this.msDecoder || !this.mergerB || !this.meterB ||
        !this.lufsB || !this.fftB || !this.gainB || !this.destinationB) {
      return;
    }
    
    // Split -> MS Encode -> EQ -> Denoise -> Limiter -> MS Decode -> Merge -> Meter -> LUFS -> FFT -> Gain -> Output
    this.splitterB.connect(this.msEncoder);
    this.msEncoder.connect(this.msEQ);
    this.msEQ.connect(this.denoise);
    this.denoise.connect(this.limiter);
    this.limiter.connect(this.msDecoder);
    this.msDecoder.connect(this.mergerB);
    this.mergerB.connect(this.meterB as AudioNode);
    (this.meterB as AudioNode).connect(this.lufsB as AudioNode);
    (this.lufsB as AudioNode).connect(this.fftB as AudioNode);
    (this.fftB as AudioNode).connect(this.gainB);
    this.gainB.connect(this.destinationB);
  }
  
  private setupWorkletHandlers(
    channel: 'A' | 'B',
    meter: AudioWorkletNode,
    lufs: AudioWorkletNode, 
    fft: AudioWorkletNode
  ): void {
    const store = useSessionStore.getState();
    
    meter.port.onmessage = (event) => {
      const { peak, rms, truePeak, correlation, width, noiseFloor } = event.data;
      if (channel === 'A') {
        store.updateMetricsA({ peak, rms, truePeak, correlation, width, noiseFloor });
      } else {
        store.updateMetricsB({ peak, rms, truePeak, correlation, width, noiseFloor });
      }
    };
    
    lufs.port.onmessage = (event) => {
      const { lufsIntegrated, lufsShort, lufsRange } = event.data;
      if (channel === 'A') {
        store.updateMetricsA({ lufsIntegrated, lufsShort, lufsRange });
      } else {
        store.updateMetricsB({ lufsIntegrated, lufsShort, lufsRange });
      }
    };
    
    fft.port.onmessage = (event) => {
      const { fftData } = event.data;
      if (fftData instanceof Float32Array) {
        if (channel === 'A') {
          store.updateFFTA(fftData);
        } else {
          store.updateFFTB(fftData);
        }
      }
    };
  }
  
  private setupProcessorHandlers(): void {
    if (!this.denoise || !this.limiter) return;
    
    const store = useSessionStore.getState();
    
    this.denoise.port.onmessage = (event) => {
      const { sweepIndex } = event.data;
      // Could update a sweep visualization here
    };
    
    this.limiter.port.onmessage = (event) => {
      const { gainReduction, truePeak } = event.data;
      // Update limiter-specific metrics
      store.updateMetricsB({ truePeak });
    };
  }
  
  private setupAnalyserFallback(channel: 'A' | 'B'): void {
    // Fallback using AnalyserNode when worklets fail
    const analyser = channel === 'A' ? this.meterA as AnalyserNode : this.meterB as AnalyserNode;
    if (!analyser) return;
    
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    
    // We'll update these in the RAF loop since AnalyserNodes don't send messages
  }
  
  private startUpdateLoop(): void {
    const update = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      // Update fallback analysers if needed
      if (!this.workletSupported) {
        this.updateAnalyserFallback();
      }
      
      // Call external update callback
      if (this.updateCallback) {
        this.updateCallback(deltaTime);
      }
      
      this.rafId = requestAnimationFrame(update);
    };
    
    this.rafId = requestAnimationFrame(update);
  }
  
  private updateAnalyserFallback(): void {
    if (!this.workletSupported) return;
    
    const store = useSessionStore.getState();
    
    // Update Channel A fallback
    if (this.meterA instanceof AnalyserNode) {
      const dataArray = new Float32Array(this.meterA.frequencyBinCount);
      this.meterA.getFloatFrequencyData(dataArray);
      
      // Simple peak estimation
      let peak = -Infinity;
      for (let i = 0; i < dataArray.length; i++) {
        peak = Math.max(peak, dataArray[i]);
      }
      
      store.updateMetricsA({ peak, rms: peak - 6 }); // Rough RMS estimate
      store.updateFFTA(dataArray);
    }
    
    // Update Channel B fallback  
    if (this.meterB instanceof AnalyserNode) {
      const dataArray = new Float32Array(this.meterB.frequencyBinCount);
      this.meterB.getFloatFrequencyData(dataArray);
      
      let peak = -Infinity;
      for (let i = 0; i < dataArray.length; i++) {
        peak = Math.max(peak, dataArray[i]);
      }
      
      store.updateMetricsB({ peak, rms: peak - 6 });
      store.updateFFTB(dataArray);
    }
  }
  
  async loadAudio(buffer: AudioBuffer): Promise<void> {
    if (!this.audioContext) throw new Error('AudioEngine not initialized');
    
    this.audioBuffer = buffer;
    
    // Ensure audio context is running
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error('Audio not loaded');
    }
    
    if (this.isPlaying) {
      this.stop();
    }
    
    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    
    // Connect to both channels
    if (this.splitterA) {
      this.sourceNode.connect(this.splitterA);
    }
    if (this.splitterB) {
      this.sourceNode.connect(this.splitterB);
    }
    
    this.sourceNode.start();
    this.isPlaying = true;
    
    useSessionStore.getState().setPlaying(true);
    
    this.sourceNode.onended = () => {
      this.isPlaying = false;
      useSessionStore.getState().setPlaying(false);
    };
  }
  
  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    this.isPlaying = false;
    useSessionStore.getState().setPlaying(false);
  }
  
  setMonitor(monitor: 'A' | 'B'): void {
    if (!this.destinationA || !this.destinationB) return;
    
    if (monitor === 'A') {
      this.destinationA.gain.value = 1;
      this.destinationB.gain.value = 0;
    } else {
      this.destinationA.gain.value = 0; 
      this.destinationB.gain.value = 1;
    }
    
    useSessionStore.getState().setMonitor(monitor);
  }
  
  updateProcessorParams(params: Partial<ProcessorParams>): void {
    this.currentParams = { ...this.currentParams, ...params };
    
    // Update delay compensation if look-ahead changed
    if (params.lookAheadSamples !== undefined && this.delayA) {
      this.delayA.delayTime.value = params.lookAheadSamples / (this.audioContext?.sampleRate || 48000);
    }
    
    // Send parameter updates to worklet processors
    if (this.workletSupported) {
      if (this.msEQ && (params.midGains || params.sideGains || params.midFreqs || params.sideFreqs)) {
        this.msEQ.port.postMessage({
          type: 'updateParams',
          midGains: this.currentParams.midGains,
          sideGains: this.currentParams.sideGains,
          midFreqs: this.currentParams.midFreqs,
          sideFreqs: this.currentParams.sideFreqs,
          midQs: this.currentParams.midQs,
          sideQs: this.currentParams.sideQs,
        });
      }
      
      if (this.denoise && (params.denoiseAmount !== undefined || params.noiseGateThreshold !== undefined)) {
        this.denoise.port.postMessage({
          type: 'updateParams',
          amount: this.currentParams.denoiseAmount,
          threshold: this.currentParams.noiseGateThreshold,
        });
      }
      
      if (this.limiter && (params.threshold !== undefined || params.ceiling !== undefined || 
          params.attack !== undefined || params.release !== undefined)) {
        this.limiter.port.postMessage({
          type: 'updateParams',
          threshold: this.currentParams.threshold,
          ceiling: this.currentParams.ceiling,
          attack: this.currentParams.attack,
          release: this.currentParams.release,
        });
      }
    }
  }
  
  onUpdate(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }
  
  getWorkletStatus(): { supported: boolean; badge?: string } {
    return {
      supported: this.workletSupported,
      badge: this.workletSupported ? undefined : 'worklet off'
    };
  }
  
  destroy(): void {
    this.stop();
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Global audio engine instance
export let audioEngine: AudioEngine | null = null;

export async function initializeAudioEngine(config?: Partial<AudioEngineConfig>): Promise<AudioEngine> {
  if (audioEngine) {
    audioEngine.destroy();
  }
  
  const fullConfig = {
    bufferSize: 4096,
    sampleRate: 48000,
    lookAheadMs: 5.0,
    ...config
  };
  
  audioEngine = new AudioEngine(fullConfig);
  await audioEngine.initialize();
  
  return audioEngine;
}

export function getAudioEngine(): AudioEngine | null {
  return audioEngine;
}