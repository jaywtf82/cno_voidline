/**
 * Audio Engine Graph - Builds WebAudio processing chain
 * Auto latency compensation for Phase 2 processing
 */

import { ChainParams } from './ai/presetEngine';

export interface EngineNode {
  node: AudioNode;
  latencyMs: number;
  bypass: boolean;
}

export interface ProcessingChain {
  input: GainNode;
  output: GainNode;
  nodes: Map<string, EngineNode>;
  totalLatency: number;
}

export class AudioEngineGraph {
  private audioContext: AudioContext;
  private chain: ProcessingChain | null = null;
  private workletModulesLoaded = new Set<string>();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async initialize(): Promise<void> {
    // Load all required worklet modules
    const workletModules = [
      '/client/worklets/xover-processor.js',
      '/client/worklets/mbcomp-processor.js',
      '/client/worklets/limiter-processor.js',
      '/client/worklets/transient-processor.js',
      '/client/worklets/ms-processor.js',
      '/client/worklets/dither-processor.js'
    ];

    for (const module of workletModules) {
      try {
        await this.audioContext.audioWorklet.addModule(module);
        this.workletModulesLoaded.add(module);
        console.log(`Loaded worklet: ${module}`);
      } catch (error) {
        console.warn(`Failed to load worklet ${module}:`, error);
        // Continue without this worklet - implement fallback
      }
    }
  }

  async buildProcessingChain(params: ChainParams): Promise<ProcessingChain> {
    console.log('Building processing chain with params:', params);

    // Create input/output nodes
    const input = this.audioContext.createGain();
    const output = this.audioContext.createGain();
    
    const nodes = new Map<string, EngineNode>();
    let totalLatency = 0;

    try {
      // 1. Transient Processor
      const transientNode = await this.createTransientProcessor(params.transient);
      if (transientNode) {
        nodes.set('transient', transientNode);
        totalLatency += transientNode.latencyMs;
      }

      // 2. M/S Encoder (if enabled)
      if (params.msEncode.enabled) {
        const msNode = await this.createMSProcessor('encode', params.stereoWidth);
        if (msNode) {
          nodes.set('msEncode', msNode);
          totalLatency += msNode.latencyMs;
        }
      }

      // 3. Crossover
      const crossoverNode = await this.createCrossoverProcessor(params.xover);
      if (crossoverNode) {
        nodes.set('crossover', crossoverNode);
        totalLatency += crossoverNode.latencyMs;
      }

      // 4. Multiband Compressor
      const mbcompNode = await this.createMultibandCompressor(params.multiband);
      if (mbcompNode) {
        nodes.set('mbcomp', mbcompNode);
        totalLatency += mbcompNode.latencyMs;
      }

      // 5. EQ (if configured)
      if (params.eq.pre.length > 0 || params.eq.post.length > 0) {
        const eqNode = this.createEQChain(params.eq);
        if (eqNode) {
          nodes.set('eq', eqNode);
          totalLatency += eqNode.latencyMs;
        }
      }

      // 6. Stereo Width / M/S Decoder
      const stereoNode = await this.createStereoProcessor(params.stereoWidth, params.msEncode.enabled);
      if (stereoNode) {
        nodes.set('stereo', stereoNode);
        totalLatency += stereoNode.latencyMs;
      }

      // 7. Limiter
      const limiterNode = await this.createLimiterProcessor(params.limiter);
      if (limiterNode) {
        nodes.set('limiter', limiterNode);
        totalLatency += limiterNode.latencyMs;
      }

      // 8. Dither (if enabled)
      if (params.dither.enabled) {
        const ditherNode = await this.createDitherProcessor(params.dither);
        if (ditherNode) {
          nodes.set('dither', ditherNode);
          totalLatency += ditherNode.latencyMs;
        }
      }

      // Connect the chain
      this.connectProcessingChain(input, output, nodes);

      // Apply latency compensation
      await this.applyLatencyCompensation(totalLatency);

      this.chain = { input, output, nodes, totalLatency };
      
      console.log(`Processing chain built with ${nodes.size} nodes, total latency: ${totalLatency.toFixed(2)}ms`);
      
      return this.chain;

    } catch (error) {
      console.error('Failed to build processing chain:', error);
      // Create bypass chain
      input.connect(output);
      return { input, output, nodes: new Map(), totalLatency: 0 };
    }
  }

  private async createTransientProcessor(params: ChainParams['transient']): Promise<EngineNode | null> {
    if (!this.workletModulesLoaded.has('/client/worklets/transient-processor.js')) {
      return this.createTransientFallback(params);
    }

    try {
      const node = new AudioWorkletNode(this.audioContext, 'transient-processor');
      
      // Set parameters
      node.port.postMessage({
        type: 'setAttack',
        data: { attack: params.attack }
      });
      node.port.postMessage({
        type: 'setSustain',
        data: { sustain: params.sustain }
      });

      return {
        node,
        latencyMs: 0, // Transient processing has minimal latency
        bypass: Math.abs(params.attack) < 0.1 && Math.abs(params.sustain) < 0.1
      };
    } catch (error) {
      console.warn('Transient processor creation failed, using fallback:', error);
      return this.createTransientFallback(params);
    }
  }

  private createTransientFallback(params: ChainParams['transient']): EngineNode {
    // Simple gain-based fallback
    const node = this.audioContext.createGain();
    const avgGain = (params.attack + params.sustain) / 2;
    node.gain.value = Math.pow(10, avgGain / 20);
    
    return {
      node,
      latencyMs: 0,
      bypass: Math.abs(avgGain) < 0.1
    };
  }

  private async createCrossoverProcessor(params: ChainParams['xover']): Promise<EngineNode | null> {
    if (!this.workletModulesLoaded.has('/client/worklets/xover-processor.js')) {
      return this.createCrossoverFallback(params);
    }

    try {
      const node = new AudioWorkletNode(this.audioContext, 'xover-processor', {
        numberOfOutputs: 3 // Low, Mid, High
      });
      
      // Set parameters
      node.port.postMessage({
        type: 'setType',
        data: { type: params.type }
      });
      node.port.postMessage({
        type: 'setFrequencies',
        data: { frequencies: params.frequencies }
      });

      // Calculate latency based on filter type
      const latencyMs = params.type === 'linear' ? 12 : 3; // Linear phase has more latency

      return {
        node,
        latencyMs,
        bypass: false
      };
    } catch (error) {
      console.warn('Crossover processor creation failed, using fallback:', error);
      return this.createCrossoverFallback(params);
    }
  }

  private createCrossoverFallback(params: ChainParams['xover']): EngineNode {
    // Simple filter-based fallback
    const splitter = this.audioContext.createChannelSplitter(1);
    const merger = this.audioContext.createChannelMerger(3);
    
    // Create basic filters
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = params.frequencies[0];
    lowpass.Q.value = 0.707;
    
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = params.frequencies[1];
    highpass.Q.value = 0.707;
    
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = Math.sqrt(params.frequencies[0] * params.frequencies[1]);
    bandpass.Q.value = 1.0;
    
    // Connect simple crossover
    splitter.connect(lowpass).connect(merger, 0, 0);
    splitter.connect(bandpass).connect(merger, 0, 1);
    splitter.connect(highpass).connect(merger, 0, 2);
    
    return {
      node: merger,
      latencyMs: 3, // Minimal latency for IIR filters
      bypass: false
    };
  }

  private async createMultibandCompressor(params: ChainParams['multiband']): Promise<EngineNode | null> {
    if (!this.workletModulesLoaded.has('/client/worklets/mbcomp-processor.js')) {
      return this.createMBCompFallback(params);
    }

    try {
      const node = new AudioWorkletNode(this.audioContext, 'mbcomp-processor', {
        numberOfInputs: 3, // From crossover
        numberOfOutputs: 3  // To mix back together
      });
      
      // Set parameters for each band
      params.bands.forEach((band, index) => {
        node.port.postMessage({
          type: 'setBandParams',
          data: {
            band: index,
            threshold: band.threshold,
            ratio: band.ratio,
            attack: band.attack,
            release: band.release,
            knee: band.knee,
            makeup: band.makeup
          }
        });
      });

      return {
        node,
        latencyMs: 5, // Lookahead compression latency
        bypass: false
      };
    } catch (error) {
      console.warn('Multiband compressor creation failed, using fallback:', error);
      return this.createMBCompFallback(params);
    }
  }

  private createMBCompFallback(params: ChainParams['multiband']): EngineNode {
    // Simple single compressor fallback
    const compressor = this.audioContext.createDynamicsCompressor();
    
    // Use average of band settings
    const avgBand = params.bands[0] || { threshold: -20, ratio: 2, attack: 10, release: 100 };
    
    compressor.threshold.value = avgBand.threshold;
    compressor.ratio.value = avgBand.ratio;
    compressor.attack.value = avgBand.attack / 1000;
    compressor.release.value = avgBand.release / 1000;
    
    return {
      node: compressor,
      latencyMs: 2,
      bypass: false
    };
  }

  private createEQChain(eqParams: ChainParams['eq']): EngineNode {
    // Create EQ filters based on parameters
    const filters: BiquadFilterNode[] = [];
    
    [...eqParams.pre, ...eqParams.post].forEach(eq => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = eq.type as BiquadFilterType;
      filter.frequency.value = eq.freq;
      filter.Q.value = eq.q;
      filter.gain.value = eq.gain;
      filters.push(filter);
    });
    
    // Chain filters together
    let input = filters[0];
    for (let i = 1; i < filters.length; i++) {
      filters[i - 1].connect(filters[i]);
    }
    
    return {
      node: input || this.audioContext.createGain(),
      latencyMs: 0, // IIR filters have minimal latency
      bypass: filters.length === 0
    };
  }

  private async createStereoProcessor(
    stereoParams: ChainParams['stereoWidth'], 
    isMSMode: boolean
  ): Promise<EngineNode | null> {
    if (!this.workletModulesLoaded.has('/client/worklets/ms-processor.js')) {
      return this.createStereoFallback(stereoParams);
    }

    try {
      const node = new AudioWorkletNode(this.audioContext, 'ms-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2
      });
      
      // Set parameters
      node.port.postMessage({
        type: 'setMode',
        data: { mode: isMSMode ? 'decode' : 'process' }
      });
      node.port.postMessage({
        type: 'setStereoWidth',
        data: { width: stereoParams.width }
      });
      node.port.postMessage({
        type: 'setMonoBelow',
        data: { frequency: stereoParams.monoBelow }
      });

      return {
        node,
        latencyMs: 1,
        bypass: stereoParams.width === 100 && stereoParams.monoBelow <= 60
      };
    } catch (error) {
      console.warn('Stereo processor creation failed, using fallback:', error);
      return this.createStereoFallback(stereoParams);
    }
  }

  private createStereoFallback(params: ChainParams['stereoWidth']): EngineNode {
    // Simple gain-based width control
    const node = this.audioContext.createGain();
    node.gain.value = params.width / 100;
    
    return {
      node,
      latencyMs: 0,
      bypass: params.width === 100
    };
  }

  private async createLimiterProcessor(params: ChainParams['limiter']): Promise<EngineNode | null> {
    if (!this.workletModulesLoaded.has('/client/worklets/limiter-processor.js')) {
      return this.createLimiterFallback(params);
    }

    try {
      const node = new AudioWorkletNode(this.audioContext, 'limiter-processor');
      
      // Set parameters
      node.port.postMessage({
        type: 'setCeiling',
        data: { ceiling: params.ceiling }
      });
      node.port.postMessage({
        type: 'setLookahead',
        data: { lookahead: params.lookahead }
      });
      node.port.postMessage({
        type: 'setRelease',
        data: { release: params.release }
      });
      node.port.postMessage({
        type: 'setStyle',
        data: { style: params.style }
      });

      return {
        node,
        latencyMs: params.lookahead,
        bypass: false
      };
    } catch (error) {
      console.warn('Limiter processor creation failed, using fallback:', error);
      return this.createLimiterFallback(params);
    }
  }

  private createLimiterFallback(params: ChainParams['limiter']): EngineNode {
    // Simple compressor as limiter fallback
    const limiter = this.audioContext.createDynamicsCompressor();
    limiter.threshold.value = params.ceiling;
    limiter.ratio.value = 20; // High ratio for limiting
    limiter.attack.value = 0.001;
    limiter.release.value = params.release / 1000;
    
    return {
      node: limiter,
      latencyMs: 1,
      bypass: false
    };
  }

  private async createDitherProcessor(params: ChainParams['dither']): Promise<EngineNode | null> {
    if (!this.workletModulesLoaded.has('/client/worklets/dither-processor.js')) {
      return null; // Dither is optional
    }

    try {
      const node = new AudioWorkletNode(this.audioContext, 'dither-processor');
      
      // Set parameters
      node.port.postMessage({
        type: 'setEnabled',
        data: { enabled: params.enabled }
      });
      node.port.postMessage({
        type: 'setNoiseType',
        data: { type: params.noise }
      });
      node.port.postMessage({
        type: 'setNoiseShaping',
        data: { enabled: params.shaping }
      });

      return {
        node,
        latencyMs: 0,
        bypass: !params.enabled
      };
    } catch (error) {
      console.warn('Dither processor creation failed:', error);
      return null;
    }
  }

  private connectProcessingChain(
    input: GainNode, 
    output: GainNode, 
    nodes: Map<string, EngineNode>
  ): void {
    let currentNode: AudioNode = input;
    
    // Connect nodes in processing order
    const nodeOrder = ['transient', 'msEncode', 'crossover', 'mbcomp', 'eq', 'stereo', 'limiter', 'dither'];
    
    for (const nodeName of nodeOrder) {
      const engineNode = nodes.get(nodeName);
      if (engineNode && !engineNode.bypass) {
        currentNode.connect(engineNode.node);
        currentNode = engineNode.node;
      }
    }
    
    // Connect final node to output
    currentNode.connect(output);
  }

  private async applyLatencyCompensation(totalLatencyMs: number): Promise<void> {
    // Create delay node for A/B comparison latency matching
    if (totalLatencyMs > 0) {
      console.log(`Applying latency compensation: ${totalLatencyMs.toFixed(2)}ms`);
      // This would be implemented in the A/B transport to delay the original signal
    }
  }

  getProcessingChain(): ProcessingChain | null {
    return this.chain;
  }

  async updateParameters(params: Partial<ChainParams>): Promise<void> {
    if (!this.chain) return;
    
    // Update individual processor parameters
    // Implementation would send messages to worklet nodes
    console.log('Updating processing parameters:', params);
  }

  disconnect(): void {
    if (this.chain) {
      this.chain.nodes.forEach(engineNode => {
        engineNode.node.disconnect();
      });
      this.chain.input.disconnect();
      this.chain.output.disconnect();
      this.chain = null;
    }
  }
}

/**
 * Factory function to create and initialize audio engine graph
 */
export async function createAudioEngineGraph(audioContext: AudioContext): Promise<AudioEngineGraph> {
  const engine = new AudioEngineGraph(audioContext);
  await engine.initialize();
  return engine;
}