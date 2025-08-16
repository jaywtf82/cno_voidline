// fft-processor.js - Real-time FFT analysis with efficient transfer

class FFTProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.fftSize = options?.processorOptions?.fftSize || 4096;
    this.overlap = 0.75; // 75% overlap
    this.hopSize = Math.floor(this.fftSize * (1 - this.overlap));
    this.updateRate = Math.floor(sampleRate / 25); // 25Hz FFT updates
    
    this.initializeState();
    this.precomputeWindow();
    
    this.frameCount = 0;
  }
  
  initializeState() {
    this.state = {
      inputBuffer: new Float32Array(this.fftSize),
      outputBuffer: new Float32Array(this.fftSize),
      bufferIndex: 0,
      
      fftReal: new Float32Array(this.fftSize),
      fftImag: new Float32Array(this.fftSize),
      magnitudes: new Float32Array(this.fftSize / 2),
      
      windowFunction: new Float32Array(this.fftSize),
      
      transferBuffer: new ArrayBuffer(this.fftSize / 2 * 4), // Float32 = 4 bytes
      transferView: new Float32Array(0), // Will be set properly
    };
    
    // Initialize transfer view
    this.state.transferView = new Float32Array(this.state.transferBuffer);
  }
  
  precomputeWindow() {
    // Blackman-Harris window
    for (let i = 0; i < this.fftSize; i++) {
      const n = i / (this.fftSize - 1);
      this.state.windowFunction[i] = 
        0.35875 - 
        0.48829 * Math.cos(2 * Math.PI * n) +
        0.14128 * Math.cos(4 * Math.PI * n) -
        0.01168 * Math.cos(6 * Math.PI * n);
    }
  }
  
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 1) return true;
    
    // Mix to mono for spectrum analysis
    const inputChannel = input[0];
    const rightChannel = input[1] || inputChannel;
    const blockSize = inputChannel.length;
    
    // Accumulate samples
    for (let i = 0; i < blockSize; i++) {
      // Convert stereo to mono
      const monoSample = (inputChannel[i] + rightChannel[i]) * 0.5;
      
      this.state.inputBuffer[this.state.bufferIndex] = monoSample;
      this.state.bufferIndex++;
      
      // Check if we have enough samples for FFT
      if (this.state.bufferIndex >= this.fftSize) {
        this.computeFFT();
        
        // Shift buffer for overlap
        this.shiftBuffer();
      }
    }
    
    // Pass through audio
    if (output.length >= 1) {
      output[0].set(inputChannel);
      if (output.length >= 2) {
        output[1].set(rightChannel);
      }
    }
    
    this.frameCount += blockSize;
    
    return true;
  }
  
  shiftBuffer() {
    // Shift buffer by hop size to create overlap
    const remainingSize = this.fftSize - this.hopSize;
    
    for (let i = 0; i < remainingSize; i++) {
      this.state.inputBuffer[i] = this.state.inputBuffer[i + this.hopSize];
    }
    
    this.state.bufferIndex = remainingSize;
  }
  
  computeFFT() {
    // Apply window function
    for (let i = 0; i < this.fftSize; i++) {
      this.state.fftReal[i] = this.state.inputBuffer[i] * this.state.windowFunction[i];
      this.state.fftImag[i] = 0;
    }
    
    // Perform FFT
    this.fftRadix2();
    
    // Compute magnitudes
    for (let i = 0; i < this.fftSize / 2; i++) {
      const real = this.state.fftReal[i];
      const imag = this.state.fftImag[i];
      this.state.magnitudes[i] = Math.sqrt(real * real + imag * imag);
    }
    
    // Apply K-weighting approximation
    this.applyKWeighting();
    
    // Prepare for transfer
    this.prepareTransfer();
  }
  
  fftRadix2() {
    const N = this.fftSize;
    const real = this.state.fftReal;
    const imag = this.state.fftImag;
    
    // Bit-reversal permutation
    let j = 0;
    for (let i = 1; i < N; i++) {
      let bit = N >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;
      
      if (i < j) {
        // Swap real parts
        let temp = real[i];
        real[i] = real[j];
        real[j] = temp;
        
        // Swap imaginary parts
        temp = imag[i];
        imag[i] = imag[j];
        imag[j] = temp;
      }
    }
    
    // Cooley-Tukey FFT
    for (let len = 2; len <= N; len *= 2) {
      const wlen = -2 * Math.PI / len;
      const wlen_real = Math.cos(wlen);
      const wlen_imag = Math.sin(wlen);
      
      for (let i = 0; i < N; i += len) {
        let w_real = 1;
        let w_imag = 0;
        
        for (let j = 0; j < len / 2; j++) {
          const u_real = real[i + j];
          const u_imag = imag[i + j];
          const v_real = real[i + j + len / 2] * w_real - imag[i + j + len / 2] * w_imag;
          const v_imag = real[i + j + len / 2] * w_imag + imag[i + j + len / 2] * w_real;
          
          real[i + j] = u_real + v_real;
          imag[i + j] = u_imag + v_imag;
          real[i + j + len / 2] = u_real - v_real;
          imag[i + j + len / 2] = u_imag - v_imag;
          
          const temp_w_real = w_real * wlen_real - w_imag * wlen_imag;
          w_imag = w_real * wlen_imag + w_imag * wlen_real;
          w_real = temp_w_real;
        }
      }
    }
  }
  
  applyKWeighting() {
    // Approximate K-weighting frequency response
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / (this.fftSize / 2);
    
    for (let i = 0; i < this.fftSize / 2; i++) {
      const frequency = i * binWidth;
      
      let weight = 1;
      
      if (frequency < 100) {
        // High-pass characteristic below 100Hz
        weight = frequency / 100;
      } else if (frequency > 2000) {
        // High-frequency shelf boost above 2kHz
        weight = 1 + 0.2 * Math.log10(frequency / 2000);
      }
      
      weight = Math.max(0.1, Math.min(2, weight));
      this.state.magnitudes[i] *= weight;
    }
  }
  
  prepareTransfer() {
    // Normalize magnitudes to 0-1 range
    let maxMagnitude = 0;
    for (let i = 0; i < this.state.magnitudes.length; i++) {
      maxMagnitude = Math.max(maxMagnitude, this.state.magnitudes[i]);
    }
    
    // Copy normalized magnitudes to transfer buffer
    if (maxMagnitude > 0) {
      for (let i = 0; i < this.state.magnitudes.length; i++) {
        this.state.transferView[i] = this.state.magnitudes[i] / maxMagnitude;
      }
    } else {
      this.state.transferView.fill(0);
    }
    
    // Send with transferable buffer
    this.port.postMessage({
      fftData: this.state.transferView,
      maxMagnitude,
      sampleRate,
      fftSize: this.fftSize,
    }, [this.state.transferBuffer]);
    
    // Recreate transfer buffer for next use
    this.state.transferBuffer = new ArrayBuffer(this.fftSize / 2 * 4);
    this.state.transferView = new Float32Array(this.state.transferBuffer);
  }
}

registerProcessor('fft-processor', FFTProcessor);