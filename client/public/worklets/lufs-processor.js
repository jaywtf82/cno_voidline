
/**
 * lufs-processor.js - Real-time LUFS calculation with K-weighting
 * Implements ITU-R BS.1770 specification
 */

class LUFSProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = 48000; // Will be updated
    this.bufferSize = 4800; // 100ms at 48kHz
    this.buffer = [];
    this.kWeightFilter = this.createKWeightFilter();
    this.gatingBuffer = [];
    this.gatingBufferSize = 300; // 3 seconds for short-term
    
    this.lufsI = -70;
    this.lufsS = -70;
    this.lufsM = -70;
    this.dbtp = -70;
    
    this.frameCount = 0;
  }

  static get parameterDescriptors() {
    return [];
  }

  createKWeightFilter() {
    // Simplified K-weighting filter coefficients
    // In production, implement proper shelf and high-pass filters
    return {
      // Pre-filter (high-pass around 38Hz)
      preFilter: {
        a: [1, -1.69065929318241, 0.73248077421585],
        b: [1.53512485958697, -2.69169618940638, 1.19839281085285]
      },
      // RLB filter (shelf around 1.5kHz)
      rlbFilter: {
        a: [1, -1.99004745483398, 0.99007225036621],
        b: [1.0, -2.0, 1.0]
      }
    };
  }

  applyKWeighting(samples) {
    // Simplified K-weighting application
    // In production, implement proper IIR filtering
    return samples.map(sample => sample * 0.85); // Rough approximation
  }

  calculateTruePeak(samples) {
    // Simplified true peak estimation
    // In production, implement 4x oversampling
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    return 20 * Math.log10(peak + 1e-10);
  }

  calculateLoudness(samples) {
    // Mean square calculation
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const meanSquare = sum / samples.length;
    return -0.691 + 10 * Math.log10(meanSquare + 1e-10);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length === 0) return true;

    // Get stereo channels
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : input[0];

    // Apply K-weighting
    const leftWeighted = this.applyKWeighting(leftChannel);
    const rightWeighted = this.applyKWeighting(rightChannel);

    // Combine channels for mono loudness
    const monoSamples = [];
    for (let i = 0; i < leftWeighted.length; i++) {
      monoSamples[i] = (leftWeighted[i] + rightWeighted[i]) / 2;
    }

    // Add to buffer
    this.buffer = this.buffer.concat(monoSamples);

    // Calculate true peak
    this.dbtp = Math.max(
      this.calculateTruePeak(leftChannel),
      this.calculateTruePeak(rightChannel)
    );

    // Process when buffer is full (100ms blocks)
    if (this.buffer.length >= this.bufferSize) {
      const blockSamples = this.buffer.splice(0, this.bufferSize);
      
      // Momentary loudness (400ms)
      this.lufsM = this.calculateLoudness(blockSamples);
      
      // Add to gating buffer for short-term
      this.gatingBuffer.push(this.lufsM);
      if (this.gatingBuffer.length > this.gatingBufferSize) {
        this.gatingBuffer.shift();
      }
      
      // Short-term loudness (3s)
      if (this.gatingBuffer.length >= 30) { // 30 blocks = 3 seconds
        const recentBlocks = this.gatingBuffer.slice(-30);
        let sum = 0;
        for (let i = 0; i < recentBlocks.length; i++) {
          sum += Math.pow(10, recentBlocks[i] / 10);
        }
        this.lufsS = 10 * Math.log10(sum / recentBlocks.length);
      }
      
      // Integrated loudness (simplified gating)
      if (this.gatingBuffer.length > 0) {
        const gatedBlocks = this.gatingBuffer.filter(block => block > -70);
        if (gatedBlocks.length > 0) {
          let sum = 0;
          for (let i = 0; i < gatedBlocks.length; i++) {
            sum += Math.pow(10, gatedBlocks[i] / 10);
          }
          this.lufsI = 10 * Math.log10(sum / gatedBlocks.length);
        }
      }
      
      // Send metrics to main thread every 10 frames (~1 second)
      if (this.frameCount % 10 === 0) {
        this.port.postMessage({
          type: 'lufs',
          lufsI: this.lufsI,
          lufsS: this.lufsS,
          lufsM: this.lufsM,
          dbtp: this.dbtp,
          timestamp: currentTime
        });
      }
      
      this.frameCount++;
    }

    // Pass audio through
    for (let channel = 0; channel < output.length; channel++) {
      output[channel].set(input[channel] || input[0]);
    }

    return true;
  }
}

registerProcessor('lufs-processor', LUFSProcessor);
