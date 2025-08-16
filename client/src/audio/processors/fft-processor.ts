// High-performance FFT processor with pre-allocated arrays
export class FftProcessor extends AudioWorkletProcessor {
  private fftSize: number = 2048;
  private hopSize: number = 512;
  private window: Float32Array;
  private bufferL: Float32Array;
  private bufferR: Float32Array;
  private bufferIndex: number = 0;
  private frameCount: number = 0;
  private publishRate: number = 50; // Hz
  private framesToSkip: number;
  
  // Pre-allocated arrays to avoid GC pressure
  private realL: Float32Array;
  private imagL: Float32Array;
  private realR: Float32Array;
  private imagR: Float32Array;
  private magnitudeL: Float32Array;
  private magnitudeR: Float32Array;
  private combinedMagnitude: Float32Array;
  
  constructor(options?: AudioWorkletNodeOptions) {
    super();
    
    const sampleRate = options?.processorOptions?.sampleRate || 48000;
    this.framesToSkip = Math.floor(sampleRate / (this.hopSize * this.publishRate));
    
    // Pre-allocate all arrays
    this.window = new Float32Array(this.fftSize);
    this.bufferL = new Float32Array(this.fftSize);
    this.bufferR = new Float32Array(this.fftSize);
    this.realL = new Float32Array(this.fftSize);
    this.imagL = new Float32Array(this.fftSize);
    this.realR = new Float32Array(this.fftSize);
    this.imagR = new Float32Array(this.fftSize);
    this.magnitudeL = new Float32Array(this.fftSize / 2);
    this.magnitudeR = new Float32Array(this.fftSize / 2);
    this.combinedMagnitude = new Float32Array(this.fftSize / 2);
    
    // Generate Hann window
    for (let i = 0; i < this.fftSize; i++) {
      this.window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
    }
  }
  
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) return true;
    
    const blockSize = input[0].length;
    const numChannels = Math.min(input.length, 2);
    
    // Pass through audio
    for (let channel = 0; channel < numChannels; channel++) {
      if (output[channel]) {
        output[channel].set(input[channel]);
      }
    }
    
    // Buffer audio for FFT
    for (let sample = 0; sample < blockSize; sample++) {
      this.bufferL[this.bufferIndex] = input[0] ? input[0][sample] : 0;
      this.bufferR[this.bufferIndex] = input[1] ? input[1][sample] : input[0] ? input[0][sample] : 0;
      
      this.bufferIndex = (this.bufferIndex + 1) % this.fftSize;
      
      if (this.bufferIndex === 0) {
        this.frameCount++;
        if (this.frameCount >= this.framesToSkip) {
          this.performFFT();
          this.frameCount = 0;
        }
      }
    }
    
    return true;
  }
  
  private performFFT() {
    // Apply window and copy to FFT arrays
    for (let i = 0; i < this.fftSize; i++) {
      const windowedL = this.bufferL[i] * this.window[i];
      const windowedR = this.bufferR[i] * this.window[i];
      
      this.realL[i] = windowedL;
      this.imagL[i] = 0;
      this.realR[i] = windowedR;
      this.imagR[i] = 0;
    }
    
    // Perform FFT (using Cooley-Tukey algorithm)
    this.fft(this.realL, this.imagL);
    this.fft(this.realR, this.imagR);
    
    // Calculate magnitudes
    for (let i = 0; i < this.fftSize / 2; i++) {
      this.magnitudeL[i] = Math.sqrt(this.realL[i] * this.realL[i] + this.imagL[i] * this.imagL[i]);
      this.magnitudeR[i] = Math.sqrt(this.realR[i] * this.realR[i] + this.imagR[i] * this.imagR[i]);
      this.combinedMagnitude[i] = (this.magnitudeL[i] + this.magnitudeR[i]) * 0.5;
    }
    
    // Send FFT data (transferable arrays)
    this.port.postMessage({
      type: 'fft',
      magnitudeL: this.magnitudeL.slice(),
      magnitudeR: this.magnitudeR.slice(),
      combined: this.combinedMagnitude.slice()
    });
  }
  
  private fft(real: Float32Array, imag: Float32Array) {
    const N = real.length;
    if (N <= 1) return;
    
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
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }
    
    // Cooley-Tukey FFT
    for (let length = 2; length <= N; length <<= 1) {
      const halfLength = length >> 1;
      const w = -2 * Math.PI / length;
      const wReal = Math.cos(w);
      const wImag = Math.sin(w);
      
      for (let i = 0; i < N; i += length) {
        let uReal = 1;
        let uImag = 0;
        
        for (let j = 0; j < halfLength; j++) {
          const evenIndex = i + j;
          const oddIndex = i + j + halfLength;
          
          const evenReal = real[evenIndex];
          const evenImag = imag[evenIndex];
          const oddReal = real[oddIndex];
          const oddImag = imag[oddIndex];
          
          const tempReal = oddReal * uReal - oddImag * uImag;
          const tempImag = oddReal * uImag + oddImag * uReal;
          
          real[evenIndex] = evenReal + tempReal;
          imag[evenIndex] = evenImag + tempImag;
          real[oddIndex] = evenReal - tempReal;
          imag[oddIndex] = evenImag - tempImag;
          
          const nextUReal = uReal * wReal - uImag * wImag;
          const nextUImag = uReal * wImag + uImag * wReal;
          uReal = nextUReal;
          uImag = nextUImag;
        }
      }
    }
  }
}

registerProcessor('fft-processor', FftProcessor);