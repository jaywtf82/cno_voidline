/**
 * Dither Processor - TPDF + Noise Shaping
 * Final stage dithering for bit depth reduction
 */

class DitherProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.enabled = false;
    this.noiseType = 'tpdf'; // 'tpdf', 'rpdf'
    this.noiseShaping = false;
    this.targetBitDepth = 16; // Target bit depth
    this.ditherAmount = 1.0; // Dither amplitude scaling
    
    // Noise shaping filter state (simple first-order)
    this.shapingState = { x1: 0, y1: 0 };
    
    // PRNG state for consistent dither
    this.rngState = Math.floor(Math.random() * 0xFFFFFFFF);
    
    // Handle parameter changes
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setEnabled':
          this.enabled = data.enabled;
          break;
        case 'setNoiseType':
          this.noiseType = data.type;
          break;
        case 'setNoiseShaping':
          this.noiseShaping = data.enabled;
          break;
        case 'setBitDepth':
          this.targetBitDepth = Math.max(8, Math.min(24, data.bitDepth));
          break;
        case 'setDitherAmount':
          this.ditherAmount = Math.max(0, Math.min(2, data.amount));
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'enabled',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1
      },
      {
        name: 'bitDepth',
        defaultValue: 16,
        minValue: 8,
        maxValue: 24
      },
      {
        name: 'ditherAmount',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 2.0
      },
      {
        name: 'bypass',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1
      }
    ];
  }

  // Linear congruential generator for consistent random numbers
  random() {
    this.rngState = (this.rngState * 1664525 + 1013904223) & 0xFFFFFFFF;
    return this.rngState / 0xFFFFFFFF;
  }

  // Generate TPDF (Triangular Probability Density Function) noise
  generateTPDF() {
    // Sum of two uniform random numbers creates triangular distribution
    const r1 = this.random();
    const r2 = this.random();
    return (r1 + r2) - 1.0; // Range: -1 to +1
  }

  // Generate RPDF (Rectangular Probability Density Function) noise
  generateRPDF() {
    return (this.random() * 2.0) - 1.0; // Range: -1 to +1
  }

  // Calculate quantization step size for target bit depth
  getQuantizationStep() {
    const maxLevel = Math.pow(2, this.targetBitDepth - 1);
    return 1.0 / maxLevel;
  }

  // Apply noise shaping filter
  applyNoiseShaping(sample, quantError) {
    if (!this.noiseShaping) {
      return sample;
    }
    
    // Simple first-order noise shaping (1 - z^-1)
    // This pushes quantization noise to higher frequencies
    const shaped = sample + (quantError - this.shapingState.y1);
    this.shapingState.y1 = quantError;
    
    return shaped;
  }

  // Quantize sample to target bit depth
  quantize(sample) {
    const step = this.getQuantizationStep();
    const scaled = sample / step;
    const quantized = Math.round(scaled) * step;
    
    // Calculate quantization error
    const error = sample - quantized;
    
    return { quantized, error };
  }

  // Apply dithering to a sample
  ditherSample(sample) {
    if (!this.enabled) {
      return sample;
    }
    
    // Generate dither noise
    let ditherNoise;
    switch (this.noiseType) {
      case 'tpdf':
        ditherNoise = this.generateTPDF();
        break;
      case 'rpdf':
      default:
        ditherNoise = this.generateRPDF();
        break;
    }
    
    // Scale dither noise
    const step = this.getQuantizationStep();
    const scaledNoise = ditherNoise * step * this.ditherAmount;
    
    // Add dither before quantization
    const ditheredSample = sample + scaledNoise;
    
    // Quantize the dithered sample
    const { quantized, error } = this.quantize(ditheredSample);
    
    // Apply noise shaping if enabled
    const finalSample = this.applyNoiseShaping(quantized, error);
    
    return finalSample;
  }

  // Process a buffer of samples
  processBuffer(inputSamples) {
    if (!this.enabled) {
      return inputSamples;
    }
    
    const outputSamples = new Float32Array(inputSamples.length);
    
    for (let i = 0; i < inputSamples.length; i++) {
      outputSamples[i] = this.ditherSample(inputSamples[i]);
    }
    
    return outputSamples;
  }

  // Calculate RMS of dither noise for monitoring
  calculateDitherRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    // Update parameters
    if (parameters.enabled) {
      this.enabled = parameters.enabled[0] > 0.5;
    }
    if (parameters.bitDepth) {
      this.targetBitDepth = Math.round(parameters.bitDepth[0]);
    }
    if (parameters.ditherAmount) {
      this.ditherAmount = parameters.ditherAmount[0];
    }

    // Check bypass
    const bypass = parameters.bypass ? parameters.bypass[0] > 0.5 : false;
    
    if (bypass || !this.enabled) {
      // Copy input to output without processing
      for (let channel = 0; channel < input.length; channel++) {
        if (output[channel]) {
          output[channel].set(input[channel]);
        }
      }
      return true;
    }

    // Process each channel
    for (let channel = 0; channel < Math.min(input.length, output.length); channel++) {
      if (input[channel] && output[channel]) {
        const processed = this.processBuffer(input[channel]);
        output[channel].set(processed);
      }
    }

    // Calculate and send monitoring information
    if (this.enabled && input[0].length > 0) {
      const step = this.getQuantizationStep();
      const ditherRMS = this.calculateDitherRMS(input[0]) * step * this.ditherAmount;
      
      this.port.postMessage({
        type: 'ditherData',
        data: {
          enabled: this.enabled,
          bitDepth: this.targetBitDepth,
          noiseType: this.noiseType,
          noiseShaping: this.noiseShaping,
          ditherRMS: ditherRMS,
          quantizationStep: step
        }
      });
    }

    return true;
  }
}

registerProcessor('dither-processor', DitherProcessor);