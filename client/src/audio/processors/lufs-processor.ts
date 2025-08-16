/**
 * lufs-processor.ts - ITU-R BS.1770-4 LUFS measurement
 * Implements K-weighting, gating, and LRA calculation
 */

class LUFSProcessor extends AudioWorkletProcessor {
  private sampleRate = 48000;
  private kWeightFilter: any;
  
  // Gating
  private absoluteGate = -70; // LUFS
  private relativeGate = -10; // LU below relative threshold
  
  // Buffers
  private momentaryBuffer: number[] = []; // 400ms blocks
  private shortTermBuffer: number[] = []; // 3s blocks  
  private integratedBuffer: number[] = []; // All blocks for integration
  
  // Current values
  private lufsI = -70; // Integrated
  private lufsS = -70; // Short-term
  private lufsM = -70; // Momentary
  private lra = 0; // Loudness Range
  private dbtp = -70; // True peak
  
  private blockSize = 0.4 * 48000; // 400ms at 48kHz
  private currentBlock: Float32Array[] = [];
  private blockSampleCount = 0;
  private frameCount = 0;

  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.blockSize = 0.4 * this.sampleRate;
    this.initializeKWeighting();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type } = event.data;
    
    switch (type) {
      case 'reset':
        this.resetMeasurement();
        break;
    }
  }

  private resetMeasurement(): void {
    this.momentaryBuffer.length = 0;
    this.shortTermBuffer.length = 0;
    this.integratedBuffer.length = 0;
    this.currentBlock = [];
    this.blockSampleCount = 0;
    this.lufsI = this.lufsS = this.lufsM = -70;
    this.lra = 0;
  }

  private initializeKWeighting(): void {
    // K-weighting filter coefficients for 48kHz
    // Pre-filter (high-pass ~38Hz)
    // RLB filter (shelf ~1.5kHz, +4dB)
    
    this.kWeightFilter = {
      // Simplified biquad coefficients
      preFilter: {
        b0: 1.53512485958697,
        b1: -2.69169618940638, 
        b2: 1.19839281085285,
        a1: -1.69065929318241,
        a2: 0.73248077421585,
        x1: 0, x2: 0, y1: 0, y2: 0
      },
      rlbFilter: {
        b0: 1.0,
        b1: -2.0,
        b2: 1.0, 
        a1: -1.99004745483398,
        a2: 0.99007225036621,
        x1: 0, x2: 0, y1: 0, y2: 0
      }
    };
  }

  private applyKWeighting(samples: Float32Array, channel: 'L' | 'R'): Float32Array {
    const output = new Float32Array(samples.length);
    const pre = this.kWeightFilter.preFilter;
    const rlb = this.kWeightFilter.rlbFilter;
    
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i];
      
      // Apply pre-filter (high-pass)
      const preOut = pre.b0 * x + pre.b1 * pre.x1 + pre.b2 * pre.x2 - pre.a1 * pre.y1 - pre.a2 * pre.y2;
      pre.x2 = pre.x1; pre.x1 = x;
      pre.y2 = pre.y1; pre.y1 = preOut;
      
      // Apply RLB filter (shelf)
      const rlbOut = rlb.b0 * preOut + rlb.b1 * rlb.x1 + rlb.b2 * rlb.x2 - rlb.a1 * rlb.y1 - rlb.a2 * rlb.y2;
      rlb.x2 = rlb.x1; rlb.x1 = preOut;
      rlb.y2 = rlb.y1; rlb.y1 = rlbOut;
      
      output[i] = rlbOut;
    }
    
    return output;
  }

  private calculateMeanSquare(left: Float32Array, right: Float32Array): number {
    // ITU-R BS.1770-4 equation
    let sum = 0;
    const length = Math.min(left.length, right.length);
    
    for (let i = 0; i < length; i++) {
      sum += left[i] * left[i] + right[i] * right[i];
    }
    
    return sum / (2 * length); // Average of L and R channels
  }

  private meanSquareToLUFS(meanSquare: number): number {
    // ITU-R BS.1770-4: -0.691 + 10 * log10(meanSquare)
    return -0.691 + 10 * Math.log10(meanSquare + 1e-10);
  }

  private processBlock(left: Float32Array, right: Float32Array): void {
    // Apply K-weighting
    const leftWeighted = this.applyKWeighting(left, 'L');
    const rightWeighted = this.applyKWeighting(right, 'R');
    
    // Calculate mean square
    const meanSquare = this.calculateMeanSquare(leftWeighted, rightWeighted);
    const blockLoudness = this.meanSquareToLUFS(meanSquare);
    
    // Add to momentary buffer (single 400ms block)
    this.lufsM = blockLoudness;
    
    // Add to short-term buffer (3 seconds = 7.5 blocks)
    this.momentaryBuffer.push(blockLoudness);
    if (this.momentaryBuffer.length > 7.5) {
      this.momentaryBuffer.shift();
    }
    
    // Calculate short-term loudness (gated mean of momentary blocks)
    if (this.momentaryBuffer.length > 0) {
      const gatedBlocks = this.momentaryBuffer.filter(l => l > this.absoluteGate);
      if (gatedBlocks.length > 0) {
        const meanSquareSum = gatedBlocks.reduce((sum, lufs) => sum + Math.pow(10, (lufs + 0.691) / 10), 0);
        this.lufsS = this.meanSquareToLUFS(meanSquareSum / gatedBlocks.length);
      }
    }
    
    // Add to integrated buffer (for final integrated measurement)
    this.integratedBuffer.push(blockLoudness);
    
    // Calculate integrated loudness with relative gating
    this.calculateIntegratedLoudness();
  }

  private calculateIntegratedLoudness(): void {
    if (this.integratedBuffer.length === 0) return;
    
    // First pass: absolute gating (-70 LUFS)
    const absoluteGatedBlocks = this.integratedBuffer.filter(l => l > this.absoluteGate);
    
    if (absoluteGatedBlocks.length === 0) {
      this.lufsI = -70;
      this.lra = 0;
      return;
    }
    
    // Calculate preliminary integrated loudness
    const preliminaryMeanSquare = absoluteGatedBlocks.reduce((sum, lufs) => sum + Math.pow(10, (lufs + 0.691) / 10), 0) / absoluteGatedBlocks.length;
    const preliminaryLufs = this.meanSquareToLUFS(preliminaryMeanSquare);
    
    // Second pass: relative gating (preliminary - 10 LU)
    const relativeThreshold = preliminaryLufs + this.relativeGate;
    const relativeGatedBlocks = absoluteGatedBlocks.filter(l => l > relativeThreshold);
    
    if (relativeGatedBlocks.length === 0) {
      this.lufsI = preliminaryLufs;
      this.lra = 0;
      return;
    }
    
    // Final integrated loudness
    const finalMeanSquare = relativeGatedBlocks.reduce((sum, lufs) => sum + Math.pow(10, (lufs + 0.691) / 10), 0) / relativeGatedBlocks.length;
    this.lufsI = this.meanSquareToLUFS(finalMeanSquare);
    
    // Calculate LRA (10th to 95th percentile range)
    this.calculateLRA(relativeGatedBlocks);
  }

  private calculateLRA(gatedBlocks: number[]): void {
    if (gatedBlocks.length < 2) {
      this.lra = 0;
      return;
    }
    
    const sorted = [...gatedBlocks].sort((a, b) => a - b);
    const p10Index = Math.floor(sorted.length * 0.1);
    const p95Index = Math.floor(sorted.length * 0.95);
    
    const p10 = sorted[p10Index];
    const p95 = sorted[p95Index];
    
    this.lra = p95 - p10;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) return true;
    
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    
    if (!leftChannel || leftChannel.length === 0) return true;
    
    // Accumulate samples into blocks
    if (!this.currentBlock[0]) this.currentBlock[0] = new Float32Array(this.blockSize);
    if (!this.currentBlock[1]) this.currentBlock[1] = new Float32Array(this.blockSize);
    
    for (let i = 0; i < leftChannel.length; i++) {
      if (this.blockSampleCount < this.blockSize) {
        this.currentBlock[0][this.blockSampleCount] = leftChannel[i];
        this.currentBlock[1][this.blockSampleCount] = rightChannel[i];
        this.blockSampleCount++;
        
        // Process complete block
        if (this.blockSampleCount >= this.blockSize) {
          this.processBlock(this.currentBlock[0], this.currentBlock[1]);
          this.blockSampleCount = 0;
          
          // Report every 10 blocks (~4 seconds)
          this.frameCount++;
          if (this.frameCount % 10 === 0) {
            this.port.postMessage({
              type: 'lufs',
              integrated: this.lufsI,
              shortTerm: this.lufsS,
              momentary: this.lufsM,
              lra: this.lra,
              timestamp: currentTime
            });
          }
        }
      }
    }
    
    // Pass audio through
    for (let channel = 0; channel < output.length; channel++) {
      if (output[channel]) {
        output[channel].set(input[channel] || input[0]);
      }
    }
    
    return true;
  }
}

registerProcessor('lufs-processor', LUFSProcessor);