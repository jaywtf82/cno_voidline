// limiter-processor.ts - Look-ahead limiter with true-peak detection
declare const sampleRate: number;

interface LimiterState {
  // Look-ahead delay line
  delayBufferL: Float32Array;
  delayBufferR: Float32Array;
  delayIndex: number;
  
  // Gain reduction envelope
  envelope: Float32Array;
  envelopeIndex: number;
  
  // Peak detection history
  peakHistory: Float32Array;
  peakIndex: number;
  currentPeak: number;
  
  // True-peak oversampling (simple approximation)
  oversampleStateL: { x1: number; x2: number };
  oversampleStateR: { x1: number; x2: number };
  
  // Envelope follower
  gainReduction: number;
  releaseCoeff: number;
  attackCoeff: number;
}

class LimiterProcessor extends AudioWorkletProcessor {
  private state: LimiterState;
  private lookAheadSamples: number;
  private frameCount = 0;
  
  // Parameters
  private params = {
    threshold: -6,    // dB
    ceiling: -1,      // dB  
    attack: 5,        // ms
    release: 50,      // ms
  };
  
  constructor(options?: AudioWorkletNodeOptions) {
    super();
    
    this.lookAheadSamples = options?.processorOptions?.lookAheadSamples || 
                           Math.floor(sampleRate * 0.005); // 5ms default
    
    this.initializeState();
    
    // Message handler
    this.port.onmessage = (event) => {
      const { type, ...params } = event.data;
      if (type === 'updateParams') {
        this.updateParameters(params);
      }
    };
  }
  
  private initializeState(): void {
    // Ensure minimum look-ahead
    this.lookAheadSamples = Math.max(64, this.lookAheadSamples);
    
    this.state = {
      delayBufferL: new Float32Array(this.lookAheadSamples),
      delayBufferR: new Float32Array(this.lookAheadSamples),
      delayIndex: 0,
      
      envelope: new Float32Array(this.lookAheadSamples),
      envelopeIndex: 0,
      
      peakHistory: new Float32Array(this.lookAheadSamples),
      peakIndex: 0,
      currentPeak: 0,
      
      oversampleStateL: { x1: 0, x2: 0 },
      oversampleStateR: { x1: 0, x2: 0 },
      
      gainReduction: 1,
      releaseCoeff: 0,
      attackCoeff: 0,
    };
    
    this.updateEnvelopeCoefficients();
  }
  
  private updateParameters(newParams: any): void {
    Object.assign(this.params, newParams);
    this.updateEnvelopeCoefficients();
  }
  
  private updateEnvelopeCoefficients(): void {
    // Calculate attack and release coefficients
    const attackTime = Math.max(0.1, this.params.attack) / 1000; // Convert to seconds
    const releaseTime = Math.max(1, this.params.release) / 1000;
    
    this.state.attackCoeff = Math.exp(-1 / (attackTime * sampleRate));
    this.state.releaseCoeff = Math.exp(-1 / (releaseTime * sampleRate));
  }
  
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2 || !output || output.length < 2) {
      return true;
    }
    
    const leftChannel = input[0];
    const rightChannel = input[1];
    const outLeft = output[0];
    const outRight = output[1];
    const blockSize = leftChannel.length;
    
    // Process each sample
    for (let i = 0; i < blockSize; i++) {
      const inL = leftChannel[i];
      const inR = rightChannel[i];
      
      // Store input in delay buffer
      this.state.delayBufferL[this.state.delayIndex] = inL;
      this.state.delayBufferR[this.state.delayIndex] = inR;
      
      // Compute true-peak estimation for current sample
      const truePeakL = this.computeTruePeak(inL, this.state.oversampleStateL);
      const truePeakR = this.computeTruePeak(inR, this.state.oversampleStateR);
      const truePeak = Math.max(Math.abs(truePeakL), Math.abs(truePeakR));
      
      // Update peak history
      this.state.peakHistory[this.state.peakIndex] = truePeak;
      
      // Find maximum peak in look-ahead window
      let maxPeak = 0;
      for (let j = 0; j < this.lookAheadSamples; j++) {
        maxPeak = Math.max(maxPeak, this.state.peakHistory[j]);
      }
      
      // Calculate required gain reduction
      const thresholdLinear = Math.pow(10, this.params.threshold / 20);
      const ceilingLinear = Math.pow(10, this.params.ceiling / 20);
      
      let targetGain = 1;
      if (maxPeak > thresholdLinear) {
        // Calculate gain to keep peak at ceiling
        targetGain = ceilingLinear / maxPeak;
        targetGain = Math.max(0.1, Math.min(1, targetGain)); // Limit to -20dB max reduction
      }
      
      // Smooth gain changes with envelope follower
      const coeff = targetGain < this.state.gainReduction ? 
                   this.state.attackCoeff : this.state.releaseCoeff;
      
      this.state.gainReduction = 
        coeff * this.state.gainReduction + (1 - coeff) * targetGain;
      
      // Store gain in envelope buffer
      this.state.envelope[this.state.envelopeIndex] = this.state.gainReduction;
      
      // Apply delayed gain to delayed audio
      const delayedL = this.state.delayBufferL[this.state.delayIndex];
      const delayedR = this.state.delayBufferR[this.state.delayIndex];
      const gain = this.state.envelope[this.state.envelopeIndex];
      
      outLeft[i] = delayedL * gain;
      outRight[i] = delayedR * gain;
      
      // Advance circular buffer indices
      this.state.delayIndex = (this.state.delayIndex + 1) % this.lookAheadSamples;
      this.state.envelopeIndex = (this.state.envelopeIndex + 1) % this.lookAheadSamples;
      this.state.peakIndex = (this.state.peakIndex + 1) % this.lookAheadSamples;
    }
    
    this.frameCount += blockSize;
    
    // Send metrics periodically
    if (this.frameCount % 256 === 0) {
      const gainReductionDb = 20 * Math.log10(this.state.gainReduction);
      const truePeakDb = 20 * Math.log10(this.state.currentPeak);
      
      this.port.postMessage({
        gainReduction: gainReductionDb,
        truePeak: truePeakDb,
      });
    }
    
    return true;
  }
  
  private computeTruePeak(sample: number, state: { x1: number; x2: number }): number {
    // Simple true-peak approximation using linear interpolation
    // This approximates 2x oversampling for true-peak detection
    
    // IIR filter coefficients for anti-aliasing
    const a = 0.15;
    const b = 1 - a;
    
    // Filter the input
    const filtered = a * sample + b * state.x1;
    state.x2 = state.x1;
    state.x1 = filtered;
    
    // Estimate interpolated peak between samples
    const interpolated = (filtered + state.x2) * 0.5;
    
    // Return maximum of current sample and interpolated value
    return Math.abs(interpolated) > Math.abs(sample) ? interpolated : sample;
  }
}

registerProcessor('limiter-processor', LimiterProcessor);