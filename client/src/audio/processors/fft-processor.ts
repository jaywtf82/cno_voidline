/**
 * fft-processor.ts - Real-time FFT analysis with K-weighting
 * Provides 4K/8K windowed FFT with transferable arrays for visualization
 */

interface FFTParams {
  fftSize: 4096 | 8192;
  windowType: 'hann' | 'blackman-harris';
  kWeighting: boolean;
  smoothing: number; // [0,1] for spectral smoothing
}

class FFTProcessor extends AudioWorkletProcessor {
  private sampleRate = 48000;
  private fftSize = 4096;
  private hopSize = 2048; // 50% overlap
  
  // Buffers
  private inputBuffer: Float32Array[] = [];
  private windowFunction: Float32Array;
  private fftReal: Float32Array;
  private fftImag: Float32Array;
  private magnitude: Float32Array;
  private smoothedMagnitude: Float32Array;
  
  // K-weighting filter
  private kWeightFilter: any;
  
  // Parameters
  private params: FFTParams = {
    fftSize: 4096,
    windowType: 'hann',
    kWeighting: true,
    smoothing: 0.8
  };
  
  // Buffer management
  private bufferWriteIndex = 0;
  private frameCount = 0;
  private reportInterval = 20; // ~20Hz update rate

  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.initializeBuffers();
    this.createWindow();
    this.initializeKWeighting();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, params } = event.data;
    
    switch (type) {
      case 'updateParams':
        this.params = { ...this.params, ...params };
        if (this.params.fftSize !== this.fftSize) {
          this.fftSize = this.params.fftSize;
          this.hopSize = this.fftSize / 2;
          this.initializeBuffers();
          this.createWindow();
        }
        break;
      case 'reset':
        this.resetProcessor();
        break;
    }
  }

  private initializeBuffers(): void {
    // Initialize stereo input buffers
    for (let ch = 0; ch < 2; ch++) {
      this.inputBuffer[ch] = new Float32Array(this.fftSize);
    }
    
    // FFT arrays
    this.fftReal = new Float32Array(this.fftSize);
    this.fftImag = new Float32Array(this.fftSize);
    this.magnitude = new Float32Array(this.fftSize / 2 + 1);
    this.smoothedMagnitude = new Float32Array(this.fftSize / 2 + 1);
    
    this.bufferWriteIndex = 0;
  }

  private createWindow(): void {
    this.windowFunction = new Float32Array(this.fftSize);
    
    if (this.params.windowType === 'hann') {
      // Hann window
      for (let i = 0; i < this.fftSize; i++) {
        this.windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
      }
    } else if (this.params.windowType === 'blackman-harris') {
      // Blackman-Harris window (better for spectral analysis)
      const a0 = 0.35875;
      const a1 = 0.48829;
      const a2 = 0.14128;
      const a3 = 0.01168;
      
      for (let i = 0; i < this.fftSize; i++) {
        const x = 2 * Math.PI * i / (this.fftSize - 1);
        this.windowFunction[i] = a0 - a1 * Math.cos(x) + a2 * Math.cos(2 * x) - a3 * Math.cos(3 * x);
      }
    }
  }

  private initializeKWeighting(): void {
    // K-weighting filter coefficients for spectral analysis
    this.kWeightFilter = {
      // Pre-filter (high-pass ~38Hz)
      preFilter: {
        b0: 1.53512485958697,
        b1: -2.69169618940638,
        b2: 1.19839281085285,
        a1: -1.69065929318241,
        a2: 0.73248077421585,
        x1: 0, x2: 0, y1: 0, y2: 0
      },
      // RLB filter (shelf ~1.5kHz, +4dB)
      rlbFilter: {
        b0: 1.0,
        b1: -2.0,
        b2: 1.0,
        a1: -1.99004745483398,
        a2: 0.99007225036621,
        x1: 0, x2: 0, y1: 0, y2: 0
      }
    };
  }

  private applyKWeighting(samples: Float32Array): Float32Array {
    if (!this.params.kWeighting) return samples;
    
    const output = new Float32Array(samples.length);
    const pre = this.kWeightFilter.preFilter;
    const rlb = this.kWeightFilter.rlbFilter;
    
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i];
      
      // Apply pre-filter
      const preOut = pre.b0 * x + pre.b1 * pre.x1 + pre.b2 * pre.x2 - pre.a1 * pre.y1 - pre.a2 * pre.y2;
      pre.x2 = pre.x1; pre.x1 = x;
      pre.y2 = pre.y1; pre.y1 = preOut;
      
      // Apply RLB filter
      const rlbOut = rlb.b0 * preOut + rlb.b1 * rlb.x1 + rlb.b2 * rlb.x2 - rlb.a1 * rlb.y1 - rlb.a2 * rlb.y2;
      rlb.x2 = rlb.x1; rlb.x1 = preOut;
      rlb.y2 = rlb.y1; rlb.y1 = rlbOut;
      
      output[i] = rlbOut;
    }
    
    return output;
  }

  private resetProcessor(): void {
    this.inputBuffer.forEach(buffer => buffer.fill(0));
    this.fftReal.fill(0);
    this.fftImag.fill(0);
    this.magnitude.fill(0);
    this.smoothedMagnitude.fill(0);
    this.bufferWriteIndex = 0;
    this.frameCount = 0;
    
    // Reset K-weighting filter state
    const filters = [this.kWeightFilter.preFilter, this.kWeightFilter.rlbFilter];
    filters.forEach(filter => {
      filter.x1 = filter.x2 = filter.y1 = filter.y2 = 0;
    });
  }

  private fft(real: Float32Array, imag: Float32Array, size: number): void {
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
    
    // Cooley-Tukey FFT
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

  private calculateMagnitude(): void {
    const bins = this.fftSize / 2 + 1;
    
    for (let i = 0; i < bins; i++) {
      const re = this.fftReal[i];
      const im = this.fftImag[i];
      this.magnitude[i] = Math.sqrt(re * re + im * im);
    }
  }

  private applySmoothing(): void {
    const alpha = this.params.smoothing;
    
    for (let i = 0; i < this.magnitude.length; i++) {
      this.smoothedMagnitude[i] = alpha * this.smoothedMagnitude[i] + (1 - alpha) * this.magnitude[i];
    }
  }

  private processFFT(): void {
    // Mix stereo to mono for analysis
    for (let i = 0; i < this.fftSize; i++) {
      const mono = (this.inputBuffer[0][i] + this.inputBuffer[1][i]) * 0.5;
      this.fftReal[i] = mono * this.windowFunction[i];
      this.fftImag[i] = 0;
    }
    
    // Apply K-weighting if enabled
    if (this.params.kWeighting) {
      const weighted = this.applyKWeighting(this.fftReal);
      this.fftReal.set(weighted);
    }
    
    // Perform FFT
    this.fft(this.fftReal, this.fftImag, this.fftSize);
    
    // Calculate magnitude spectrum
    this.calculateMagnitude();
    
    // Apply temporal smoothing
    this.applySmoothing();
  }

  private sendFFTData(): void {
    // Convert to dB scale
    const magnitudeDb = new Float32Array(this.smoothedMagnitude.length);
    for (let i = 0; i < this.smoothedMagnitude.length; i++) {
      magnitudeDb[i] = 20 * Math.log10(this.smoothedMagnitude[i] + 1e-10);
    }
    
    // Create frequency bins
    const nyquist = this.sampleRate / 2;
    const freqBins = new Float32Array(this.smoothedMagnitude.length);
    for (let i = 0; i < freqBins.length; i++) {
      freqBins[i] = (i / (freqBins.length - 1)) * nyquist;
    }
    
    // Send as transferable (if supported)
    try {
      this.port.postMessage({
        type: 'fft-data',
        magnitudeDb: magnitudeDb,
        freqBins: freqBins,
        fftSize: this.fftSize,
        sampleRate: this.sampleRate,
        timestamp: currentTime
      }, [magnitudeDb.buffer, freqBins.buffer]);
    } catch (e) {
      // Fallback without transferable
      this.port.postMessage({
        type: 'fft-data',
        magnitudeDb: Array.from(magnitudeDb),
        freqBins: Array.from(freqBins),
        fftSize: this.fftSize,
        sampleRate: this.sampleRate,
        timestamp: currentTime
      });
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) return true;
    
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    
    if (!leftChannel) return true;
    
    // Accumulate samples into buffer
    for (let i = 0; i < leftChannel.length; i++) {
      this.inputBuffer[0][this.bufferWriteIndex] = leftChannel[i];
      this.inputBuffer[1][this.bufferWriteIndex] = rightChannel[i];
      
      this.bufferWriteIndex++;
      
      // Process when buffer is full
      if (this.bufferWriteIndex >= this.fftSize) {
        this.processFFT();
        
        // Shift buffer for overlap
        const shift = this.hopSize;
        for (let ch = 0; ch < 2; ch++) {
          for (let j = 0; j < this.fftSize - shift; j++) {
            this.inputBuffer[ch][j] = this.inputBuffer[ch][j + shift];
          }
        }
        this.bufferWriteIndex = this.fftSize - shift;
        
        // Send FFT data at report interval
        this.frameCount++;
        if (this.frameCount % this.reportInterval === 0) {
          this.sendFFTData();
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

registerProcessor('fft-processor', FFTProcessor);