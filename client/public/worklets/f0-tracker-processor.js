/**
 * f0-tracker-processor.js - Fundamental frequency tracker using YIN algorithm
 */

class F0TrackerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.sampleRate = 48000;
    this.bufferSize = 2048;
    this.hopSize = 512;
    
    // Buffers
    this.inputBuffer = new Float32Array(this.bufferSize);
    this.bufferWriteIndex = 0;
    
    // YIN algorithm buffers
    this.yinBuffer = new Float32Array(this.bufferSize / 2);
    this.cumulativeMean = new Float32Array(this.bufferSize / 2);
    
    // Parameters
    this.params = {
      enabled: true,
      minFreq: 50,   // 50 Hz minimum
      maxFreq: 2000, // 2 kHz maximum  
      threshold: 0.15 // YIN threshold for pitch detection
    };
    
    // Results
    this.currentF0 = 0;
    this.confidence = 0;
    this.harmonics = [];
    
    // Frame counting
    this.frameCount = 0;
    this.reportInterval = 20; // ~20Hz update rate

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
        break;
      case 'reset':
        this.resetTracker();
        break;
    }
  }

  resetTracker() {
    this.inputBuffer.fill(0);
    this.yinBuffer.fill(0);
    this.cumulativeMean.fill(0);
    this.bufferWriteIndex = 0;
    this.currentF0 = 0;
    this.confidence = 0;
    this.harmonics = [];
    this.frameCount = 0;
  }

  calculateDifference(buffer) {
    // YIN step 1: Calculate difference function
    const halfSize = this.bufferSize / 2;
    
    for (let tau = 0; tau < halfSize; tau++) {
      let sum = 0;
      for (let i = 0; i < halfSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      this.yinBuffer[tau] = sum;
    }
  }

  calculateCumulativeMean() {
    // YIN step 2: Calculate cumulative mean normalized difference
    this.cumulativeMean[0] = 1;
    let runningSum = this.yinBuffer[0];
    
    for (let tau = 1; tau < this.yinBuffer.length; tau++) {
      runningSum += this.yinBuffer[tau];
      this.cumulativeMean[tau] = this.yinBuffer[tau] / (runningSum / (tau + 1));
    }
  }

  findMinimum() {
    // YIN step 3: Find absolute minimum below threshold
    const minTau = Math.floor(this.sampleRate / this.params.maxFreq);
    const maxTau = Math.floor(this.sampleRate / this.params.minFreq);
    
    let bestTau = minTau;
    let bestValue = this.cumulativeMean[minTau];
    
    // Find first minimum below threshold
    for (let tau = minTau; tau < Math.min(maxTau, this.cumulativeMean.length - 1); tau++) {
      const current = this.cumulativeMean[tau];
      
      if (current < this.params.threshold) {
        // Check if it's a local minimum
        if (tau > 0 && tau < this.cumulativeMean.length - 1) {
          const prev = this.cumulativeMean[tau - 1];
          const next = this.cumulativeMean[tau + 1];
          
          if (current <= prev && current <= next) {
            bestTau = tau;
            bestValue = current;
            break;
          }
        }
      }
      
      // Keep track of absolute minimum anyway
      if (current < bestValue) {
        bestTau = tau;
        bestValue = current;
      }
    }
    
    return { tau: bestTau, confidence: 1 - bestValue };
  }

  interpolateParabolic(tau) {
    // YIN step 4: Parabolic interpolation for sub-sample precision
    if (tau === 0 || tau >= this.cumulativeMean.length - 1) {
      return tau;
    }
    
    const y1 = this.cumulativeMean[tau - 1];
    const y2 = this.cumulativeMean[tau];
    const y3 = this.cumulativeMean[tau + 1];
    
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    if (Math.abs(a) < 1e-10) {
      return tau;
    }
    
    const offset = -b / (2 * a);
    return tau + offset;
  }

  detectHarmonics(f0, buffer) {
    if (f0 <= 0) return [];
    
    const harmonics = [];
    const nyquist = this.sampleRate / 2;
    const fftSize = 1024;
    
    // Simple DFT at harmonic frequencies
    for (let h = 1; h <= 10; h++) { // Check first 10 harmonics
      const freq = f0 * h;
      if (freq > nyquist) break;
      
      // Calculate amplitude at harmonic frequency using Goertzel algorithm
      const omega = 2 * Math.PI * freq / this.sampleRate;
      const cosine = Math.cos(omega);
      const sine = Math.sin(omega);
      const coeff = 2 * cosine;
      
      let q0 = 0, q1 = 0, q2 = 0;
      
      for (let i = 0; i < Math.min(fftSize, buffer.length); i++) {
        q0 = coeff * q1 - q2 + buffer[i];
        q2 = q1;
        q1 = q0;
      }
      
      const real = q1 - q2 * cosine;
      const imag = q2 * sine;
      const amplitude = Math.sqrt(real * real + imag * imag) / fftSize;
      
      if (amplitude > 0.01) { // Threshold for significant harmonics
        harmonics.push({ freq, amplitude });
      }
    }
    
    return harmonics;
  }

  processYIN(buffer) {
    if (!this.params.enabled) {
      this.currentF0 = 0;
      this.confidence = 0;
      this.harmonics = [];
      return;
    }
    
    // Apply simple window to reduce edge effects
    const windowed = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (buffer.length - 1))); // Hann window
      windowed[i] = buffer[i] * window;
    }
    
    // YIN algorithm
    this.calculateDifference(windowed);
    this.calculateCumulativeMean();
    
    const result = this.findMinimum();
    
    if (result.confidence > 0.5) { // Confidence threshold
      const interpolatedTau = this.interpolateParabolic(result.tau);
      this.currentF0 = this.sampleRate / interpolatedTau;
      this.confidence = result.confidence;
      
      // Detect harmonics
      this.harmonics = this.detectHarmonics(this.currentF0, windowed);
    } else {
      this.currentF0 = 0;
      this.confidence = 0;
      this.harmonics = [];
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) return true;
    
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    
    if (!leftChannel) return true;
    
    // Mix to mono for pitch detection
    for (let i = 0; i < leftChannel.length; i++) {
      const mono = (leftChannel[i] + rightChannel[i]) * 0.5;
      this.inputBuffer[this.bufferWriteIndex] = mono;
      this.bufferWriteIndex++;
      
      // Process when buffer is full
      if (this.bufferWriteIndex >= this.bufferSize) {
        this.processYIN(this.inputBuffer);
        
        // Shift buffer for overlap
        for (let j = 0; j < this.bufferSize - this.hopSize; j++) {
          this.inputBuffer[j] = this.inputBuffer[j + this.hopSize];
        }
        this.bufferWriteIndex = this.bufferSize - this.hopSize;
        
        // Report results
        this.frameCount++;
        if (this.frameCount % this.reportInterval === 0) {
          this.port.postMessage({
            type: 'f0-data',
            fundamental: this.currentF0,
            harmonics: this.harmonics,
            confidence: this.confidence,
            timestamp: currentTime
          });
        }
      }
    }
    
    // Pass audio through
    if (output && output.length > 0) {
      for (let channel = 0; channel < output.length; channel++) {
        if (output[channel] && input[channel]) {
          output[channel].set(input[channel]);
        }
      }
    }
    
    return true;
  }
}

registerProcessor('f0-tracker-processor', F0TrackerProcessor);