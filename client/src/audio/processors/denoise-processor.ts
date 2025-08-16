/**
 * denoise-processor.ts - Spectral subtraction denoising processor
 * Implements short-time spectral gating and Wiener filtering for artifact cleanup
 */

interface DenoiseParams {
  enabled: boolean;
  alpha: number;     // Spectral gate strength [0,1]
  mode: 'spectral' | 'wiener';
}

class DenoiseProcessor extends AudioWorkletProcessor {
  private sampleRate = 48000;
  private fftSize = 1024;
  private hopSize = 512; // 50% overlap
  private windowSize = 1024;
  
  // Buffers
  private inputBuffer: Float32Array[] = [];
  private outputBuffer: Float32Array[] = [];
  private overlapBuffer: Float32Array[] = [];
  private windowFunction: Float32Array;
  
  // Noise profile
  private noiseProfile: Float32Array = new Float32Array(this.fftSize / 2 + 1);
  private noiseFrameCount = 0;
  private noiseThreshold = -60; // dBFS threshold for noise detection
  private noiseUpdateRate = 0.01; // Exponential averaging rate
  
  // Parameters
  private params: DenoiseParams = {
    enabled: false,
    alpha: 0.1,
    mode: 'spectral'
  };
  
  // FFT processing
  private fftReal: Float32Array = new Float32Array(this.fftSize);
  private fftImag: Float32Array = new Float32Array(this.fftSize);
  private magnitude: Float32Array = new Float32Array(this.fftSize / 2 + 1);
  private phase: Float32Array = new Float32Array(this.fftSize / 2 + 1);
  
  // Progress reporting
  private frameCount = 0;
  private totalFrames = 0;

  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.initializeBuffers();
    this.createWindow();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, params } = event.data;
    
    switch (type) {
      case 'updateParams':
        this.params = { ...this.params, ...params };
        break;
      case 'reset':
        this.resetProcessor();
        break;
      case 'captureNoiseProfile':
        this.captureNoiseProfile();
        break;
    }
  }

  private initializeBuffers(): void {
    // Initialize stereo buffers
    for (let ch = 0; ch < 2; ch++) {
      this.inputBuffer[ch] = new Float32Array(this.windowSize);
      this.outputBuffer[ch] = new Float32Array(this.windowSize);
      this.overlapBuffer[ch] = new Float32Array(this.hopSize);
    }
  }

  private createWindow(): void {
    // Hann window for STFT
    this.windowFunction = new Float32Array(this.windowSize);
    for (let i = 0; i < this.windowSize; i++) {
      this.windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.windowSize - 1)));
    }
  }

  private resetProcessor(): void {
    this.inputBuffer.forEach(buffer => buffer.fill(0));
    this.outputBuffer.forEach(buffer => buffer.fill(0));
    this.overlapBuffer.forEach(buffer => buffer.fill(0));
    this.noiseProfile.fill(0);
    this.noiseFrameCount = 0;
    this.frameCount = 0;
  }

  private captureNoiseProfile(): void {
    // Reset noise profile for new capture
    this.noiseProfile.fill(0);
    this.noiseFrameCount = 0;
    
    this.port.postMessage({
      type: 'noise-profile-reset',
      message: 'Noise profile capture started'
    });
  }

  private fft(real: Float32Array, imag: Float32Array, size: number): void {
    // Simple Cooley-Tukey FFT implementation
    // Bit-reverse ordering
    let j = 0;
    for (let i = 1; i < size; i++) {
      let bit = size >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;
      
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }
    
    // FFT computation
    for (let len = 2; len <= size; len <<= 1) {
      const wlen = 2 * Math.PI / len;
      const wpr = Math.cos(wlen);
      const wpi = -Math.sin(wlen);
      
      for (let i = 0; i < size; i += len) {
        let wr = 1;
        let wi = 0;
        
        for (let j = 0; j < len / 2; j++) {
          const u = i + j;
          const v = i + j + len / 2;
          
          const tr = real[v] * wr - imag[v] * wi;
          const ti = real[v] * wi + imag[v] * wr;
          
          real[v] = real[u] - tr;
          imag[v] = imag[u] - ti;
          real[u] += tr;
          imag[u] += ti;
          
          const temp = wr * wpr - wi * wpi;
          wi = wi * wpr + wr * wpi;
          wr = temp;
        }
      }
    }
  }

  private ifft(real: Float32Array, imag: Float32Array, size: number): void {
    // Inverse FFT: conjugate, FFT, conjugate, scale
    for (let i = 0; i < size; i++) {
      imag[i] = -imag[i];
    }
    
    this.fft(real, imag, size);
    
    for (let i = 0; i < size; i++) {
      real[i] /= size;
      imag[i] = -imag[i] / size;
    }
  }

  private calculateMagnitudePhase(real: Float32Array, imag: Float32Array): void {
    const bins = this.fftSize / 2 + 1;
    
    for (let i = 0; i < bins; i++) {
      this.magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      this.phase[i] = Math.atan2(imag[i], real[i]);
    }
  }

  private reconstructFromMagnitudePhase(real: Float32Array, imag: Float32Array, magnitude: Float32Array, phase: Float32Array): void {
    const bins = this.fftSize / 2 + 1;
    
    // Fill positive frequencies
    for (let i = 0; i < bins; i++) {
      real[i] = magnitude[i] * Math.cos(phase[i]);
      imag[i] = magnitude[i] * Math.sin(phase[i]);
    }
    
    // Mirror for negative frequencies (real FFT)
    for (let i = bins; i < this.fftSize; i++) {
      const mirrorIdx = this.fftSize - i;
      real[i] = real[mirrorIdx];
      imag[i] = -imag[mirrorIdx];
    }
  }

  private updateNoiseProfile(magnitude: Float32Array, rmsLevel: number): void {
    // Update noise profile if signal is below threshold
    const rmsDb = 20 * Math.log10(rmsLevel + 1e-10);
    
    if (rmsDb < this.noiseThreshold) {
      for (let i = 0; i < magnitude.length; i++) {
        // Exponential averaging
        this.noiseProfile[i] = this.noiseProfile[i] * (1 - this.noiseUpdateRate) + magnitude[i] * this.noiseUpdateRate;
      }
      this.noiseFrameCount++;
      
      // Report noise profile update every 10 frames
      if (this.noiseFrameCount % 10 === 0) {
        this.port.postMessage({
          type: 'noise-profile-update',
          frameCount: this.noiseFrameCount,
          rmsLevel: rmsDb
        });
      }
    }
  }

  private applySpectralGate(magnitude: Float32Array): Float32Array {
    const processedMagnitude = new Float32Array(magnitude.length);
    const epsilon = 1e-10;
    
    for (let i = 0; i < magnitude.length; i++) {
      const signal = magnitude[i];
      const noise = this.noiseProfile[i] + epsilon;
      
      if (this.params.mode === 'spectral') {
        // Spectral subtraction with over-subtraction factor
        const gain = Math.max(epsilon, 1 - this.params.alpha * (noise / signal));
        processedMagnitude[i] = signal * gain;
      } else if (this.params.mode === 'wiener') {
        // Wiener filter
        const signalPower = signal * signal;
        const noisePower = noise * noise;
        const gain = signalPower / (signalPower + this.params.alpha * noisePower);
        processedMagnitude[i] = signal * gain;
      }
    }
    
    return processedMagnitude;
  }

  private processFrame(channel: number, samples: Float32Array): Float32Array {
    const output = new Float32Array(samples.length);
    
    if (!this.params.enabled) {
      output.set(samples);
      return output;
    }
    
    // Apply window
    for (let i = 0; i < this.windowSize; i++) {
      this.fftReal[i] = samples[i] * this.windowFunction[i];
      this.fftImag[i] = 0;
    }
    
    // Forward FFT
    this.fft(this.fftReal, this.fftImag, this.fftSize);
    
    // Calculate magnitude and phase
    this.calculateMagnitudePhase(this.fftReal, this.fftImag);
    
    // Update noise profile during quiet periods
    const rmsLevel = Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / samples.length);
    this.updateNoiseProfile(this.magnitude, rmsLevel);
    
    // Apply denoising
    const processedMagnitude = this.applySpectralGate(this.magnitude);
    
    // Reconstruct complex spectrum
    this.reconstructFromMagnitudePhase(this.fftReal, this.fftImag, processedMagnitude, this.phase);
    
    // Inverse FFT
    this.ifft(this.fftReal, this.fftImag, this.fftSize);
    
    // Apply window and overlap-add
    for (let i = 0; i < this.windowSize; i++) {
      output[i] = this.fftReal[i] * this.windowFunction[i];
    }
    
    // Add overlap from previous frame
    for (let i = 0; i < this.hopSize; i++) {
      output[i] += this.overlapBuffer[channel][i];
    }
    
    // Store overlap for next frame
    for (let i = 0; i < this.hopSize; i++) {
      this.overlapBuffer[channel][i] = output[i + this.hopSize];
    }
    
    return output;
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
    
    // Process if we have enough samples for a frame
    if (leftChannel.length >= this.hopSize) {
      const leftOutput = this.processFrame(0, leftChannel);
      const rightOutput = this.processFrame(1, rightChannel);
      
      outputLeft.set(leftOutput.subarray(0, leftChannel.length));
      if (outputRight && outputRight !== outputLeft) {
        outputRight.set(rightOutput.subarray(0, rightChannel.length));
      }
      
      // Report sweeper progress
      this.frameCount++;
      if (this.frameCount % 20 === 0) {
        const progress = this.params.enabled ? 
          (this.frameCount % 100) / 100 : 0;
        
        this.port.postMessage({
          type: 'sweeper-progress',
          progress: progress,
          stage: this.params.enabled ? 'Processing spectral frames...' : 'Bypassed',
          noiseFrames: this.noiseFrameCount
        });
      }
    } else {
      // Pass through if frame too small
      outputLeft.set(leftChannel);
      if (outputRight && outputRight !== outputLeft) {
        outputRight.set(rightChannel);
      }
    }
    
    return true;
  }
}

registerProcessor('denoise-processor', DenoiseProcessor);