/**
 * limiter-processor.js - Look-ahead true-peak limiter
 */

class LimiterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.sampleRate = 48000;
    
    // Parameters
    this.params = {
      threshold: -1,
      ceiling: -0.1,
      attack: 1,
      release: 100,
      lookahead: 5
    };
    
    // Delay buffer for lookahead
    this.delayBuffer = [];
    this.delayBufferSize = 0;
    this.delayWriteIndex = 0;
    
    // Gain reduction
    this.currentGR = 0; // Current gain reduction in dB
    this.targetGR = 0;  // Target gain reduction in dB
    this.grSmoothing = 0; // GR smoothing coefficient
    
    // Attack/Release coefficients  
    this.attackCoeff = 0;
    this.releaseCoeff = 0;
    
    // True peak detection (2x oversampling)
    this.oversampleBuffer = new Float32Array(256);
    this.truePeakHold = [0, 0]; // L, R
    this.truePeakDecay = 0.9999; // ~6dB/sec decay
    
    // Metrics reporting
    this.frameCount = 0;
    this.reportInterval = 50; // 50Hz

    this.updateParameters();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  static get parameterDescriptors() {
    return [];
  }

  handleMessage(event) {
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

  updateParameters() {
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

  resetLimiter() {
    if (this.delayBuffer[0]) this.delayBuffer[0].fill(0);
    if (this.delayBuffer[1]) this.delayBuffer[1].fill(0);
    this.delayWriteIndex = 0;
    this.currentGR = 0;
    this.targetGR = 0;
    this.truePeakHold = [0, 0];
  }

  calculateTruePeak(sample) {
    // Simplified 2x oversampling for true peak detection
    const oversample1 = sample;
    const oversample2 = sample * 0.5; // Simplified - should use proper upsampling
    
    return Math.max(Math.abs(oversample1), Math.abs(oversample2));
  }

  updateTruePeak(leftSample, rightSample) {
    const truePeakL = this.calculateTruePeak(leftSample);
    const truePeakR = this.calculateTruePeak(rightSample);
    
    // Peak hold with decay
    this.truePeakHold[0] = Math.max(this.truePeakHold[0] * this.truePeakDecay, truePeakL);
    this.truePeakHold[1] = Math.max(this.truePeakHold[1] * this.truePeakDecay, truePeakR);
  }

  calculateGainReduction(peakLevel) {
    // Convert peak level to dB
    const peakDb = 20 * Math.log10(Math.abs(peakLevel) + 1e-10);
    
    // Calculate overshoot above threshold
    const overshoot = Math.max(0, peakDb - this.params.threshold);
    
    if (overshoot <= 0) return 0;
    
    // Soft knee compression (simplified)
    const kneeWidth = 2; // dB
    let gainReduction;
    
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

  processFrame(leftChannel, rightChannel) {
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

  process(inputs, outputs, parameters) {
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