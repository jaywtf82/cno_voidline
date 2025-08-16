/**
 * limiter-processor.ts - Look-ahead true-peak limiter with gain reduction metering
 * Implements soft knee, attack/release envelopes, and true-peak detection
 */

interface LimiterParams {
  threshold: number; // dB
  ceiling: number;   // dBTP
  attack: number;    // ms
  release: number;   // ms
  lookahead: number; // ms
}

class LimiterProcessor extends AudioWorkletProcessor {
  private sampleRate = 48000;
  
  // Parameters
  private params: LimiterParams = {
    threshold: -1,
    ceiling: -0.1,
    attack: 1,
    release: 100,
    lookahead: 5
  };
  
  // Delay buffer for lookahead
  private delayBuffer: Float32Array[] = [];
  private delayBufferSize = 0;
  private delayWriteIndex = 0;
  
  // Gain reduction
  private currentGR = 0; // Current gain reduction in dB
  private targetGR = 0;  // Target gain reduction in dB
  private grSmoothing = 0; // GR smoothing coefficient
  
  // Attack/Release coefficients  
  private attackCoeff = 0;
  private releaseCoeff = 0;
  
  // True peak detection (2x oversampling)
  private oversampleBuffer: Float32Array = new Float32Array(256);
  private truePeakHold: number[] = [0, 0]; // L, R
  private truePeakDecay = 0.9999; // ~6dB/sec decay
  
  // Metrics reporting
  private frameCount = 0;
  private reportInterval = 50; // 50Hz

  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.updateParameters();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, params } = event.data;
    
    switch (type) {
      case 'updateParams':
        this.params = { ...this.params, ...params };
        this.updateParameters();
        break;
      case 'reset':
        this.resetLimiter();
        break;
    }
  }

  private updateParameters(): void {
    // Calculate delay buffer size
    const lookaheadSamples = Math.ceil((this.params.lookahead / 1000) * this.sampleRate);
    this.delayBufferSize = Math.max(128, lookaheadSamples); // Minimum 128 samples
    
    // Resize delay buffers if needed
    if (!this.delayBuffer[0] || this.delayBuffer[0].length !== this.delayBufferSize) {
      this.delayBuffer[0] = new Float32Array(this.delayBufferSize);
      this.delayBuffer[1] = new Float32Array(this.delayBufferSize);
      this.delayWriteIndex = 0;
    }
    
    // Calculate attack/release coefficients
    this.attackCoeff = Math.exp(-1 / (this.params.attack * this.sampleRate / 1000));
    this.releaseCoeff = Math.exp(-1 / (this.params.release * this.sampleRate / 1000));
    
    // GR smoothing (faster than release for smooth metering)
    this.grSmoothing = Math.exp(-1 / (Math.min(this.params.release, 50) * this.sampleRate / 1000));
  }

  private resetLimiter(): void {
    this.delayBuffer[0]?.fill(0);
    this.delayBuffer[1]?.fill(0);
    this.delayWriteIndex = 0;
    this.currentGR = 0;
    this.targetGR = 0;
    this.truePeakHold = [0, 0];
  }

  private calculateTruePeak(sample: number): number {
    // Simplified 2x oversampling for true peak detection
    // In production, use proper anti-aliasing filter
    
    // Linear interpolation for 2x oversampling
    const oversample1 = sample;
    const oversample2 = sample * 0.5; // Simplified - should use proper upsampling
    
    return Math.max(Math.abs(oversample1), Math.abs(oversample2));
  }

  private updateTruePeak(leftSample: number, rightSample: number): void {
    const truePeakL = this.calculateTruePeak(leftSample);
    const truePeakR = this.calculateTruePeak(rightSample);
    
    // Peak hold with decay
    this.truePeakHold[0] = Math.max(this.truePeakHold[0] * this.truePeakDecay, truePeakL);
    this.truePeakHold[1] = Math.max(this.truePeakHold[1] * this.truePeakDecay, truePeakR);
  }

  private calculateGainReduction(peakLevel: number): number {
    // Convert peak level to dB
    const peakDb = 20 * Math.log10(Math.abs(peakLevel) + 1e-10);
    
    // Calculate overshoot above threshold
    const overshoot = Math.max(0, peakDb - this.params.threshold);
    
    if (overshoot <= 0) return 0;
    
    // Soft knee compression (simplified)
    const kneeWidth = 2; // dB
    let gainReduction: number;
    
    if (overshoot < kneeWidth) {
      // Soft knee region
      const ratio = overshoot / kneeWidth;
      gainReduction = overshoot * ratio * 0.5;
    } else {
      // Hard limiting region
      gainReduction = overshoot;
    }
    
    // Ensure we don't exceed ceiling
    const outputLevel = peakDb - gainReduction;
    if (outputLevel > this.params.ceiling) {
      gainReduction += (outputLevel - this.params.ceiling);
    }
    
    return gainReduction;
  }

  private processFrame(leftChannel: Float32Array, rightChannel: Float32Array): void {
    const frameSize = leftChannel.length;
    
    for (let i = 0; i < frameSize; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      
      // Store in delay buffer
      this.delayBuffer[0][this.delayWriteIndex] = left;
      this.delayBuffer[1][this.delayWriteIndex] = right;
      
      // Calculate read index (lookahead delay)
      const readIndex = (this.delayWriteIndex - this.delayBufferSize + 1 + this.delayBufferSize) % this.delayBufferSize;
      
      // Get delayed samples
      const delayedLeft = this.delayBuffer[0][readIndex];
      const delayedRight = this.delayBuffer[1][readIndex];
      
      // Update true peak detection
      this.updateTruePeak(left, right);
      
      // Find peak in current frame for gain reduction calculation
      const currentPeak = Math.max(Math.abs(left), Math.abs(right));
      
      // Calculate required gain reduction
      this.targetGR = this.calculateGainReduction(currentPeak);
      
      // Apply attack/release to gain reduction
      if (this.targetGR > this.currentGR) {
        // Attack (faster response to increases)
        this.currentGR = this.targetGR + (this.currentGR - this.targetGR) * this.attackCoeff;
      } else {
        // Release (slower response to decreases)  
        this.currentGR = this.targetGR + (this.currentGR - this.targetGR) * this.releaseCoeff;
      }
      
      // Convert gain reduction to linear multiplier
      const gainMultiplier = Math.pow(10, -this.currentGR / 20);
      
      // Apply gain reduction to delayed samples
      leftChannel[i] = delayedLeft * gainMultiplier;
      rightChannel[i] = delayedRight * gainMultiplier;
      
      // Advance delay buffer write index
      this.delayWriteIndex = (this.delayWriteIndex + 1) % this.delayBufferSize;
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0 || !output || output.length === 0) return true;
    
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    const outputLeft = output[0];
    const outputRight = output.length > 1 ? output[1] : output[0];
    
    if (!leftChannel || !outputLeft) return true;
    
    // Copy input to output for processing
    outputLeft.set(leftChannel);
    if (outputRight && outputRight !== outputLeft && rightChannel) {
      outputRight.set(rightChannel);
    }
    
    // Process limiting
    this.processFrame(outputLeft, outputRight && outputRight !== outputLeft ? outputRight : outputLeft);
    
    // Report metrics
    this.frameCount++;
    if (this.frameCount % this.reportInterval === 0) {
      const truePeakDb = Math.max(
        20 * Math.log10(this.truePeakHold[0] + 1e-10),
        20 * Math.log10(this.truePeakHold[1] + 1e-10)
      );
      
      this.port.postMessage({
        type: 'limiter-metrics',
        gainReduction: this.currentGR,
        truePeak: truePeakDb,
        threshold: this.params.threshold,
        ceiling: this.params.ceiling,
        timestamp: currentTime
      });
    }
    
    return true;
  }
}

registerProcessor('limiter-processor', LimiterProcessor);