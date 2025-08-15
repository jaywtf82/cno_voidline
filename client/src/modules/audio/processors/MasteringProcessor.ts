import type { PresetParameters } from "@shared/schema";

export class MasteringProcessor {
  private audioContext: AudioContext | OfflineAudioContext;
  private _inputNode: GainNode;
  private _outputNode: GainNode;
  
  // Processing nodes
  private preGain: GainNode;
  private lowShelfFilter: BiquadFilterNode;
  private highShelfFilter: BiquadFilterNode;
  private compressor: DynamicsCompressorNode;
  private postGain: GainNode;
  private limiter: DynamicsCompressorNode;
  private stereoProcessor: AudioWorkletNode | null = null;
  
  // Parameters
  private currentParams: PresetParameters;

  constructor(audioContext: AudioContext | OfflineAudioContext) {
    this.audioContext = audioContext;
    this.currentParams = this.getDefaultParameters();
    
    // Create nodes
    this._inputNode = audioContext.createGain();
    this._outputNode = audioContext.createGain();
    this.preGain = audioContext.createGain();
    this.postGain = audioContext.createGain();
    
    // EQ filters
    this.lowShelfFilter = audioContext.createBiquadFilter();
    this.lowShelfFilter.type = "lowshelf";
    
    this.highShelfFilter = audioContext.createBiquadFilter();
    this.highShelfFilter.type = "highshelf";
    
    // Compressor
    this.compressor = audioContext.createDynamicsCompressor();
    
    // Limiter
    this.limiter = audioContext.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.01;
    
    this.connectNodes();
  }

  async initialize(): Promise<void> {
    try {
      // Load and register the mastering worklet
      await this.audioContext.audioWorklet.addModule("/src/lib/audio/worklets/mastering-worklet.js");
      
      // Create stereo processor worklet
      this.stereoProcessor = new AudioWorkletNode(this.audioContext, "mastering-processor");
      
      // Reconnect with worklet
      this.connectNodes();
      
      // Apply default parameters
      this.updateParameters(this.currentParams);
    } catch (error) {
      console.warn("Audio worklet not available, using fallback processing:", error);
      // Continue without worklet - basic processing will still work
    }
  }

  private connectNodes(): void {
    // Disconnect existing connections
    this._inputNode.disconnect();
    
    if (this.stereoProcessor) {
      // With worklet: input -> preGain -> EQ -> compressor -> worklet -> limiter -> postGain -> output
      this._inputNode.connect(this.preGain);
      this.preGain.connect(this.lowShelfFilter);
      this.lowShelfFilter.connect(this.highShelfFilter);
      this.highShelfFilter.connect(this.compressor);
      this.compressor.connect(this.stereoProcessor);
      this.stereoProcessor.connect(this.limiter);
      this.limiter.connect(this.postGain);
      this.postGain.connect(this._outputNode);
    } else {
      // Without worklet: input -> preGain -> EQ -> compressor -> limiter -> postGain -> output
      this._inputNode.connect(this.preGain);
      this.preGain.connect(this.lowShelfFilter);
      this.lowShelfFilter.connect(this.highShelfFilter);
      this.highShelfFilter.connect(this.compressor);
      this.compressor.connect(this.limiter);
      this.limiter.connect(this.postGain);
      this.postGain.connect(this._outputNode);
    }
  }

  updateParameters(params: PresetParameters): void {
    this.currentParams = { ...params };
    
    // Update pre-gain (harmonic boost)
    this.preGain.gain.value = this.dbToLinear(params.harmonicBoost * 0.5);
    
    // Update EQ
    this.lowShelfFilter.frequency.value = params.eq.lowShelf.frequency;
    this.lowShelfFilter.gain.value = params.eq.lowShelf.gain + params.subweight;
    
    this.highShelfFilter.frequency.value = params.eq.highShelf.frequency;
    this.highShelfFilter.gain.value = params.eq.highShelf.gain + params.airlift;
    
    // Update compressor
    this.compressor.threshold.value = params.compression.threshold;
    this.compressor.ratio.value = params.compression.ratio;
    this.compressor.attack.value = params.compression.attack / 1000; // ms to seconds
    this.compressor.release.value = params.compression.release / 1000;
    
    // Update post-gain
    const postGainDb = params.transientPunch * 0.3; // Subtle transient enhancement
    this.postGain.gain.value = this.dbToLinear(postGainDb);
    
    // Update worklet parameters if available
    if (this.stereoProcessor) {
      this.stereoProcessor.port.postMessage({
        type: "updateParameters",
        parameters: {
          stereoWidth: params.stereo.width,
          spatialFlux: params.spatialFlux,
          bassMonoFreq: params.stereo.bassMonoFreq,
        },
      });
    }
  }

  private getDefaultParameters(): PresetParameters {
    return {
      harmonicBoost: 0,
      subweight: 0,
      transientPunch: 0,
      airlift: 0,
      spatialFlux: 0,
      compression: {
        threshold: -20,
        ratio: 4,
        attack: 10,
        release: 100,
      },
      eq: {
        lowShelf: { frequency: 100, gain: 0 },
        highShelf: { frequency: 8000, gain: 0 },
      },
      stereo: {
        width: 1,
        bassMonoFreq: 120,
      },
    };
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  get inputNode(): AudioNode {
    return this._inputNode;
  }

  get outputNode(): AudioNode {
    return this._outputNode;
  }

  dispose(): void {
    // Disconnect all nodes
    this._inputNode.disconnect();
    this.preGain.disconnect();
    this.lowShelfFilter.disconnect();
    this.highShelfFilter.disconnect();
    this.compressor.disconnect();
    this.limiter.disconnect();
    this.postGain.disconnect();
    this._outputNode.disconnect();
    
    if (this.stereoProcessor) {
      this.stereoProcessor.disconnect();
    }
  }
}
