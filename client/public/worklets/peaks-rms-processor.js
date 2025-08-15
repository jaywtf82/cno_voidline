
/**
 * peaks-rms-processor.js - Real-time peak and RMS analysis
 */

class PeaksRMSProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.peakL = 0;
    this.peakR = 0;
    this.rmsL = 0;
    this.rmsR = 0;
    this.fastRMS = 0;
    this.slowRMS = 0;
    
    this.rmsBufferFast = [];
    this.rmsBufferSlow = [];
    this.fastBufferSize = 480; // ~10ms at 48kHz
    this.slowBufferSize = 2400; // ~50ms at 48kHz
    
    this.frameCount = 0;
  }

  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length === 0) return true;

    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : input[0];

    // Calculate peak values
    for (let i = 0; i < leftChannel.length; i++) {
      this.peakL = Math.max(this.peakL * 0.999, Math.abs(leftChannel[i]));
      this.peakR = Math.max(this.peakR * 0.999, Math.abs(rightChannel[i]));
    }

    // Calculate RMS values
    this.rmsL = this.calculateRMS(leftChannel);
    this.rmsR = this.calculateRMS(rightChannel);

    // Add to RMS buffers
    this.rmsBufferFast.push((this.rmsL + this.rmsR) / 2);
    this.rmsBufferSlow.push((this.rmsL + this.rmsR) / 2);

    // Maintain buffer sizes
    if (this.rmsBufferFast.length > this.fastBufferSize) {
      this.rmsBufferFast.shift();
    }
    if (this.rmsBufferSlow.length > this.slowBufferSize) {
      this.rmsBufferSlow.shift();
    }

    // Calculate fast and slow RMS
    this.fastRMS = this.calculateRMS(this.rmsBufferFast);
    this.slowRMS = this.calculateRMS(this.rmsBufferSlow);

    // Send data every 5 frames
    if (this.frameCount % 5 === 0) {
      this.port.postMessage({
        type: 'peaks-rms',
        peakL: 20 * Math.log10(this.peakL + 1e-10),
        peakR: 20 * Math.log10(this.peakR + 1e-10),
        rmsL: 20 * Math.log10(this.rmsL + 1e-10),
        rmsR: 20 * Math.log10(this.rmsR + 1e-10),
        fastRMS: 20 * Math.log10(this.fastRMS + 1e-10),
        slowRMS: 20 * Math.log10(this.slowRMS + 1e-10),
        crest: 20 * Math.log10(Math.max(this.peakL, this.peakR) / ((this.rmsL + this.rmsR) / 2) + 1e-10),
        timestamp: currentTime
      });
    }

    this.frameCount++;

    // Pass audio through
    for (let channel = 0; channel < output.length; channel++) {
      output[channel].set(input[channel] || input[0]);
    }

    return true;
  }
}

registerProcessor('peaks-rms-processor', PeaksRMSProcessor);
