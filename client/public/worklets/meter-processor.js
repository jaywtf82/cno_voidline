/**
 * meter-processor.js - Real-time audio metering worklet
 * Calculates peak, RMS, true-peak, correlation, stereo width, noise floor
 */

class MeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.peakL = 0;
    this.peakR = 0;
    this.rmsL = 0;
    this.rmsR = 0;
    this.truePeakL = 0;
    this.truePeakR = 0;
    this.correlation = 0;
    this.stereoWidth = 0;
    this.noiseFloor = -60;
    
    this.rmsBuffer = [];
    this.correlationBuffer = [];
    this.noiseBuffer = [];
    this.bufferSize = 2400; // 50ms at 48kHz
    this.frameCount = 0;
    this.reportInterval = 50; // 50Hz reporting
    
    // True peak detection (simplified 2x oversampling)
    this.truePeakBuffer = new Float32Array(256);
    this.truePeakIndex = 0;

    this.port.onmessage = this.handleMessage.bind(this);
  }

  static get parameterDescriptors() {
    return [];
  }

  handleMessage(event) {
    const { type } = event.data;
    
    switch (type) {
      case 'reset':
        this.resetMeters();
        break;
    }
  }

  resetMeters() {
    this.peakL = this.peakR = 0;
    this.rmsL = this.rmsR = 0;
    this.truePeakL = this.truePeakR = 0;
    this.correlation = 0;
    this.stereoWidth = 0;
    this.rmsBuffer.length = 0;
    this.correlationBuffer.length = 0;
    this.noiseBuffer.length = 0;
    this.frameCount = 0;
  }

  calculateTruePeak(samples) {
    // Simplified 2x oversampling for true peak
    let peak = 0;
    
    for (let i = 0; i < samples.length; i++) {
      // Store in circular buffer
      this.truePeakBuffer[this.truePeakIndex] = samples[i];
      this.truePeakIndex = (this.truePeakIndex + 1) % this.truePeakBuffer.length;
      
      // Linear interpolation for 2x oversampling
      if (i > 0) {
        const interpolated = (samples[i] + samples[i - 1]) * 0.5;
        peak = Math.max(peak, Math.abs(interpolated));
      }
      
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    
    return peak;
  }

  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  calculateCorrelation(left, right) {
    let correlation = 0;
    let leftSum = 0;
    let rightSum = 0;
    let leftSqSum = 0;
    let rightSqSum = 0;
    
    const length = Math.min(left.length, right.length);
    
    for (let i = 0; i < length; i++) {
      const l = left[i];
      const r = right[i];
      
      correlation += l * r;
      leftSum += l;
      rightSum += r;
      leftSqSum += l * l;
      rightSqSum += r * r;
    }
    
    // Pearson correlation coefficient
    const numerator = length * correlation - leftSum * rightSum;
    const denominator = Math.sqrt((length * leftSqSum - leftSum * leftSum) * (length * rightSqSum - rightSum * rightSum));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  updateBuffers(rms, correlation) {
    // Update RMS buffer
    this.rmsBuffer.push(rms);
    if (this.rmsBuffer.length > this.bufferSize) {
      this.rmsBuffer.shift();
    }
    
    // Update correlation buffer
    this.correlationBuffer.push(correlation);
    if (this.correlationBuffer.length > this.bufferSize) {
      this.correlationBuffer.shift();
    }
    
    // Update noise buffer (for noise floor calculation)
    this.noiseBuffer.push(rms);
    if (this.noiseBuffer.length > this.bufferSize) {
      this.noiseBuffer.shift();
    }
  }

  calculateNoiseFloor() {
    if (this.noiseBuffer.length === 0) return -60;
    
    // Calculate 10th percentile for noise floor estimation
    const sorted = [...this.noiseBuffer].sort((a, b) => a - b);
    const p10Index = Math.floor(sorted.length * 0.1);
    const p10Value = sorted[p10Index];
    
    return 20 * Math.log10(p10Value + 1e-10);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) return true;
    
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    
    if (!leftChannel || leftChannel.length === 0) return true;
    
    // Update peak meters with decay
    const currentPeakL = Math.max(...leftChannel.map(Math.abs));
    const currentPeakR = Math.max(...rightChannel.map(Math.abs));
    
    this.peakL = Math.max(this.peakL * 0.9995, currentPeakL); // ~3dB/sec decay
    this.peakR = Math.max(this.peakR * 0.9995, currentPeakR);
    
    // Update true peak
    this.truePeakL = Math.max(this.truePeakL * 0.9995, this.calculateTruePeak(leftChannel));
    this.truePeakR = Math.max(this.truePeakR * 0.9995, this.calculateTruePeak(rightChannel));
    
    // Update RMS
    this.rmsL = this.calculateRMS(leftChannel);
    this.rmsR = this.calculateRMS(rightChannel);
    
    // Calculate correlation and stereo width
    const frameCorrelation = this.calculateCorrelation(leftChannel, rightChannel);
    this.correlation = frameCorrelation;
    this.stereoWidth = 1 - Math.abs(frameCorrelation);
    
    // Update buffers
    const avgRMS = (this.rmsL + this.rmsR) * 0.5;
    this.updateBuffers(avgRMS, frameCorrelation);
    
    // Update noise floor
    this.noiseFloor = this.calculateNoiseFloor();
    
    // Report metrics at specified interval
    this.frameCount++;
    if (this.frameCount % this.reportInterval === 0) {
      this.port.postMessage({
        type: 'metrics',
        metrics: {
          peak: Math.max(
            20 * Math.log10(this.peakL + 1e-10),
            20 * Math.log10(this.peakR + 1e-10)
          ),
          rms: 20 * Math.log10(avgRMS + 1e-10),
          truePeak: Math.max(
            20 * Math.log10(this.truePeakL + 1e-10),
            20 * Math.log10(this.truePeakR + 1e-10)
          ),
          correlation: this.correlation,
          stereoWidth: this.stereoWidth,
          noiseFloor: this.noiseFloor
        },
        timestamp: currentTime
      });
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

registerProcessor('meter-processor', MeterProcessor);