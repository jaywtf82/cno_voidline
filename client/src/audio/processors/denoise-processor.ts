// denoise-processor.ts - Spectral subtraction noise reduction
declare const sampleRate: number;

interface DenoiseState {
  // FFT buffers
  inputBuffer: Float32Array;
  outputBuffer: Float32Array;
  bufferIndex: number;
  
  // FFT working arrays
  fftReal: Float32Array;
  fftImag: Float32Array;
  ifftReal: Float32Array;
  ifftImag: Float32Array;
  magnitudes: Float32Array;
  phases: Float32Array;
  
  // Noise estimation
  noiseProfile: Float32Array;
  noiseFrameCount: number;
  isLearning: boolean;
  
  // Windowing
  windowFunction: Float32Array;
  overlapBuffer: Float32Array;
  
  // Sweep state
  sweepIndex: number;
}

class DenoiseProcessor extends AudioWorkletProcessor {
  private state: DenoiseState;
  private fftSize = 1024;
  private hopSize = 512; // 50% overlap
  private frameCount = 0;
  
  // Parameters
  private params = {
    amount: 0, // 0-100 noise reduction amount
    threshold: -60, // dB threshold for noise gate
  };
  
  constructor(options?: AudioWorkletNodeOptions) {
    super();
    
    const bufferSize = options?.processorOptions?.bufferSize || 1024;
    this.fftSize = Math.max(256, Math.min(2048, bufferSize));
    this.hopSize = this.fftSize / 2;
    
    this.initializeState();
    this.precomputeWindow();
    
    // Message handler for parameter updates
    this.port.onmessage = (event) => {
      const { type, ...params } = event.data;
      if (type === 'updateParams') {
        this.updateParameters(params);
      }
    };
  }
  
  private initializeState(): void {
    this.state = {
      inputBuffer: new Float32Array(this.fftSize),
      outputBuffer: new Float32Array(this.fftSize),
      bufferIndex: 0,
      
      fftReal: new Float32Array(this.fftSize),
      fftImag: new Float32Array(this.fftSize),
      ifftReal: new Float32Array(this.fftSize),
      ifftImag: new Float32Array(this.fftSize),
      magnitudes: new Float32Array(this.fftSize / 2),
      phases: new Float32Array(this.fftSize / 2),
      
      noiseProfile: new Float32Array(this.fftSize / 2),
      noiseFrameCount: 0,
      isLearning: true, // Learn noise profile initially
      
      windowFunction: new Float32Array(this.fftSize),
      overlapBuffer: new Float32Array(this.fftSize),
      
      sweepIndex: 0,
    };
  }
  
  private precomputeWindow(): void {
    // Hann window
    for (let i = 0; i < this.fftSize; i++) {
      this.state.windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
    }
  }
  
  private updateParameters(newParams: any): void {
    Object.assign(this.params, newParams);
    
    // Reset learning if amount changed significantly
    if (Math.abs(newParams.amount - this.params.amount) > 10) {
      this.state.noiseFrameCount = 0;
      this.state.isLearning = true;
    }
  }
  
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2 || !output || output.length < 2) {
      return true;
    }
    
    const leftChannel = input[0];
    const rightChannel = input[1];
    const outLeft = output[0];
    const outRight = output[1];
    const blockSize = leftChannel.length;
    
    // Process stereo (apply same processing to both channels)
    this.processChannel(leftChannel, outLeft);
    this.processChannel(rightChannel, outRight);
    
    this.frameCount += blockSize;
    
    // Send sweep index for visualization
    if (this.frameCount % 512 === 0) {
      this.port.postMessage({
        sweepIndex: this.state.sweepIndex,
        isLearning: this.state.isLearning,
      });
    }
    
    return true;
  }
  
  private processChannel(input: Float32Array, output: Float32Array): void {
    const blockSize = input.length;
    
    for (let i = 0; i < blockSize; i++) {
      // Store input sample
      this.state.inputBuffer[this.state.bufferIndex] = input[i];
      this.state.bufferIndex++;
      
      // Process when buffer is full
      if (this.state.bufferIndex >= this.fftSize) {
        this.processFrame();
        this.state.bufferIndex = this.hopSize; // Maintain overlap
      }
      
      // Output from output buffer
      output[i] = this.state.outputBuffer[i];
    }
    
    // Shift output buffer
    for (let i = 0; i < this.fftSize - blockSize; i++) {
      this.state.outputBuffer[i] = this.state.outputBuffer[i + blockSize];
    }
    
    // Clear the end
    for (let i = this.fftSize - blockSize; i < this.fftSize; i++) {
      this.state.outputBuffer[i] = 0;
    }
  }
  
  private processFrame(): void {
    // Skip processing if amount is 0
    if (this.params.amount <= 0) {
      // Just copy input to output with windowing
      for (let i = 0; i < this.fftSize; i++) {
        this.state.outputBuffer[i] += this.state.inputBuffer[i] * this.state.windowFunction[i];
      }
      return;
    }
    
    // Apply window to input
    for (let i = 0; i < this.fftSize; i++) {
      this.state.fftReal[i] = this.state.inputBuffer[i] * this.state.windowFunction[i];
      this.state.fftImag[i] = 0;
    }
    
    // Forward FFT
    this.fft(this.state.fftReal, this.state.fftImag, false);
    
    // Extract magnitudes and phases
    for (let i = 0; i < this.fftSize / 2; i++) {
      const real = this.state.fftReal[i];
      const imag = this.state.fftImag[i];
      this.state.magnitudes[i] = Math.sqrt(real * real + imag * imag);
      this.state.phases[i] = Math.atan2(imag, real);
    }
    
    // Update noise profile during learning phase
    if (this.state.isLearning) {
      this.updateNoiseProfile();
    }
    
    // Apply spectral subtraction
    this.applySpectralSubtraction();
    
    // Reconstruct complex spectrum
    for (let i = 0; i < this.fftSize / 2; i++) {
      const mag = this.state.magnitudes[i];
      const phase = this.state.phases[i];
      this.state.ifftReal[i] = mag * Math.cos(phase);
      this.state.ifftImag[i] = mag * Math.sin(phase);
    }
    
    // Mirror for negative frequencies
    for (let i = 1; i < this.fftSize / 2; i++) {
      this.state.ifftReal[this.fftSize - i] = this.state.ifftReal[i];
      this.state.ifftImag[this.fftSize - i] = -this.state.ifftImag[i];
    }
    
    // Inverse FFT
    this.fft(this.state.ifftReal, this.state.ifftImag, true);
    
    // Overlap-add to output buffer with windowing
    for (let i = 0; i < this.fftSize; i++) {
      this.state.outputBuffer[i] += this.state.ifftReal[i] * this.state.windowFunction[i];
    }
    
    // Shift input buffer for next frame
    for (let i = 0; i < this.hopSize; i++) {
      this.state.inputBuffer[i] = this.state.inputBuffer[i + this.hopSize];
    }
    
    this.state.sweepIndex++;
  }
  
  private updateNoiseProfile(): void {
    // Average noise profile over initial frames
    const alpha = 1.0 / (this.state.noiseFrameCount + 1);
    
    for (let i = 0; i < this.fftSize / 2; i++) {
      this.state.noiseProfile[i] = 
        (1 - alpha) * this.state.noiseProfile[i] + 
        alpha * this.state.magnitudes[i];
    }
    
    this.state.noiseFrameCount++;
    
    // Stop learning after enough frames
    if (this.state.noiseFrameCount >= 10) {
      this.state.isLearning = false;
    }
  }
  
  private applySpectralSubtraction(): void {
    const alpha = this.params.amount / 100; // 0-1 scaling
    const threshold = Math.pow(10, this.params.threshold / 20); // Convert dB to linear
    
    for (let i = 0; i < this.fftSize / 2; i++) {
      const signal = this.state.magnitudes[i];
      const noise = this.state.noiseProfile[i];
      
      if (signal < threshold) {
        // Apply noise gate
        this.state.magnitudes[i] *= 0.1; // Reduce by 20dB
        continue;
      }
      
      // Spectral subtraction
      const snr = noise > 0 ? signal / noise : 1;
      let gain = 1 - alpha * (1 / snr);
      
      // Over-subtraction factor for better noise reduction
      const overSubtraction = 2.0;
      if (snr < overSubtraction) {
        gain = 1 - alpha * overSubtraction / snr;
      }
      
      // Limit gain reduction and apply smoothing
      gain = Math.max(0.1, Math.min(1, gain)); // -20dB to 0dB
      
      this.state.magnitudes[i] *= gain;
    }
  }
  
  private fft(real: Float32Array, imag: Float32Array, inverse: boolean): void {
    const N = this.fftSize;
    const direction = inverse ? 1 : -1;
    
    // Bit-reversal
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
      const wlen = direction * 2 * Math.PI / len;
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
    
    // Normalize for inverse transform
    if (inverse) {
      for (let i = 0; i < N; i++) {
        real[i] /= N;
        imag[i] /= N;
      }
    }
  }
}

registerProcessor('denoise-processor', DenoiseProcessor);