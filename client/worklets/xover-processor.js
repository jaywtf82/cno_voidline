/**
 * Crossover Processor - Linear Phase FIR / Minimum Phase Fallback
 * C/No Voidline Phase 2 Audio Worklet
 */

class CrossoverProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.bufferSize = 128;
    this.taps = 512; // Default FIR taps, adjustable 64-2048
    this.type = 'linear'; // 'linear' or 'minimum'
    this.frequencies = [250, 2500]; // [lowMid, midHigh] Hz
    
    // FIR filter buffers
    this.lowBuffer = new Float32Array(this.taps);
    this.midBuffer = new Float32Array(this.taps);
    this.highBuffer = new Float32Array(this.taps);
    
    // Output buffers for each band
    this.lowOutput = new Float32Array(this.bufferSize);
    this.midOutput = new Float32Array(this.bufferSize);
    this.highOutput = new Float32Array(this.bufferSize);
    
    // Generate initial filter coefficients
    this.updateFilters();
    
    // Handle parameter changes
    this.port.onmessage = (event) => {
      const { type: msgType, data } = event.data;
      
      switch (msgType) {
        case 'setType':
          this.type = data.type;
          this.updateFilters();
          break;
        case 'setFrequencies':
          this.frequencies = data.frequencies;
          this.updateFilters();
          break;
        case 'setTaps':
          this.taps = Math.max(64, Math.min(2048, data.taps));
          this.resizeBuffers();
          this.updateFilters();
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'lowMidFreq',
        defaultValue: 250,
        minValue: 80,
        maxValue: 800
      },
      {
        name: 'midHighFreq',
        defaultValue: 2500,
        minValue: 1000,
        maxValue: 8000
      },
      {
        name: 'bypass',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1
      }
    ];
  }

  resizeBuffers() {
    this.lowBuffer = new Float32Array(this.taps);
    this.midBuffer = new Float32Array(this.taps);
    this.highBuffer = new Float32Array(this.taps);
  }

  updateFilters() {
    if (this.type === 'linear') {
      this.generateLinearPhaseFilters();
    } else {
      this.generateMinimumPhaseFilters();
    }
  }

  generateLinearPhaseFilters() {
    // Linear phase FIR filters using windowed sinc method
    const nyquist = this.sampleRate / 2;
    const lowCutoff = this.frequencies[0] / nyquist;
    const highCutoff = this.frequencies[1] / nyquist;
    
    // Low-pass filter (low band)
    this.lowCoeffs = this.generateLowPassFIR(lowCutoff);
    
    // Band-pass filter (mid band)
    this.midCoeffs = this.generateBandPassFIR(lowCutoff, highCutoff);
    
    // High-pass filter (high band)
    this.highCoeffs = this.generateHighPassFIR(highCutoff);
  }

  generateMinimumPhaseFilters() {
    // Simplified minimum phase using IIR approximation
    // In practice, this would use more sophisticated algorithms
    const nyquist = this.sampleRate / 2;
    const lowCutoff = this.frequencies[0] / nyquist;
    const highCutoff = this.frequencies[1] / nyquist;
    
    // For minimum phase, we use simplified coefficients
    // Real implementation would use Hilbert transform or other methods
    this.lowCoeffs = this.generateLowPassFIR(lowCutoff);
    this.midCoeffs = this.generateBandPassFIR(lowCutoff, highCutoff);
    this.highCoeffs = this.generateHighPassFIR(highCutoff);
  }

  generateLowPassFIR(cutoff) {
    const coeffs = new Float32Array(this.taps);
    const center = (this.taps - 1) / 2;
    
    for (let i = 0; i < this.taps; i++) {
      const t = i - center;
      
      if (t === 0) {
        coeffs[i] = 2 * cutoff;
      } else {
        coeffs[i] = Math.sin(2 * Math.PI * cutoff * t) / (Math.PI * t);
      }
      
      // Apply Hamming window
      coeffs[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.taps - 1));
    }
    
    return coeffs;
  }

  generateBandPassFIR(lowCutoff, highCutoff) {
    const coeffs = new Float32Array(this.taps);
    const center = (this.taps - 1) / 2;
    
    for (let i = 0; i < this.taps; i++) {
      const t = i - center;
      
      if (t === 0) {
        coeffs[i] = 2 * (highCutoff - lowCutoff);
      } else {
        coeffs[i] = (Math.sin(2 * Math.PI * highCutoff * t) - 
                    Math.sin(2 * Math.PI * lowCutoff * t)) / (Math.PI * t);
      }
      
      // Apply Hamming window
      coeffs[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.taps - 1));
    }
    
    return coeffs;
  }

  generateHighPassFIR(cutoff) {
    const coeffs = new Float32Array(this.taps);
    const center = (this.taps - 1) / 2;
    
    for (let i = 0; i < this.taps; i++) {
      const t = i - center;
      
      if (t === 0) {
        coeffs[i] = 1 - 2 * cutoff;
      } else {
        coeffs[i] = -Math.sin(2 * Math.PI * cutoff * t) / (Math.PI * t);
      }
      
      // Apply Hamming window
      coeffs[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.taps - 1));
    }
    
    return coeffs;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const frameCount = inputChannel.length;
    
    // Update frequencies from parameters
    if (parameters.lowMidFreq && parameters.midHighFreq) {
      const newLowMid = parameters.lowMidFreq[0];
      const newMidHigh = parameters.midHighFreq[0];
      
      if (newLowMid !== this.frequencies[0] || newMidHigh !== this.frequencies[1]) {
        this.frequencies = [newLowMid, newMidHigh];
        this.updateFilters();
      }
    }

    // Check bypass
    const bypass = parameters.bypass ? parameters.bypass[0] > 0.5 : false;
    
    if (bypass) {
      // Bypass mode - copy input to first output
      for (let i = 0; i < frameCount; i++) {
        output[0][i] = inputChannel[i];
        if (output[1]) output[1][i] = 0;
        if (output[2]) output[2][i] = 0;
      }
      return true;
    }

    // Process through crossover filters
    for (let i = 0; i < frameCount; i++) {
      const sample = inputChannel[i];
      
      // Shift buffers and add new sample
      for (let j = this.taps - 1; j > 0; j--) {
        this.lowBuffer[j] = this.lowBuffer[j - 1];
        this.midBuffer[j] = this.midBuffer[j - 1];
        this.highBuffer[j] = this.highBuffer[j - 1];
      }
      
      this.lowBuffer[0] = sample;
      this.midBuffer[0] = sample;
      this.highBuffer[0] = sample;
      
      // Apply filters
      let lowSum = 0, midSum = 0, highSum = 0;
      
      for (let j = 0; j < this.taps; j++) {
        lowSum += this.lowBuffer[j] * this.lowCoeffs[j];
        midSum += this.midBuffer[j] * this.midCoeffs[j];
        highSum += this.highBuffer[j] * this.highCoeffs[j];
      }
      
      // Output to separate channels
      output[0][i] = lowSum;   // Low band
      if (output[1]) output[1][i] = midSum;   // Mid band
      if (output[2]) output[2][i] = highSum;  // High band
    }

    // Send latency compensation info
    this.port.postMessage({
      type: 'latencyInfo',
      data: {
        latencyFrames: Math.floor(this.taps / 2),
        latencyMs: (this.taps / 2) / this.sampleRate * 1000
      }
    });

    return true;
  }
}

registerProcessor('xover-processor', CrossoverProcessor);