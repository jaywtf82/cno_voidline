// FFT processor with 4096-point Hann windowed FFT and K-weighting
export class FFTProcessor extends AudioWorkletProcessor {
  private fftSize = 4096;
  private bufferL = new Float32Array(this.fftSize);
  private bufferR = new Float32Array(this.fftSize);
  private bufferIndex = 0;
  private hannWindow = new Float32Array(this.fftSize);
  private fftOutput = new Float32Array(this.fftSize / 2);
  
  // K-weighting response for frequency domain
  private kWeightResponse = new Float32Array(this.fftSize / 2);
  
  // Double buffer for transfer
  private outputBuffer1 = new Float32Array(this.fftSize / 2);
  private outputBuffer2 = new Float32Array(this.fftSize / 2);
  private currentBuffer = 0;

  constructor() {
    super();
    this.initializeWindow();
    this.initializeKWeighting();
  }

  private initializeWindow() {
    // Generate Hann window
    for (let i = 0; i < this.fftSize; i++) {
      this.hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
    }
  }

  private initializeKWeighting() {
    // Approximate K-weighting frequency response
    const sampleRate = 48000;
    for (let i = 0; i < this.fftSize / 2; i++) {
      const freq = (i * sampleRate) / this.fftSize;
      
      // High-shelf at ~1500Hz with +4dB boost
      const highShelf = Math.sqrt(1 + Math.pow(freq / 1500, 2));
      
      // High-pass at ~38Hz
      const highPass = freq / Math.sqrt(freq * freq + 38 * 38);
      
      this.kWeightResponse[i] = highShelf * highPass;
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    if (!input || input.length < 2) return true;

    const left = input[0];
    const right = input[1];
    const frameLength = left.length;

    // Accumulate samples in buffer
    for (let i = 0; i < frameLength; i++) {
      if (this.bufferIndex < this.fftSize) {
        this.bufferL[this.bufferIndex] = left[i];
        this.bufferR[this.bufferIndex] = right[i];
        this.bufferIndex++;

        if (this.bufferIndex === this.fftSize) {
          this.computeFFT();
          this.bufferIndex = 0;
        }
      }
    }

    // Pass through
    if (outputs[0]) {
      outputs[0][0].set(left);
      outputs[0][1].set(right);
    }

    return true;
  }

  private computeFFT() {
    // Simple magnitude spectrum calculation (simplified FFT)
    const outputBuffer = this.currentBuffer === 0 ? this.outputBuffer1 : this.outputBuffer2;
    
    for (let k = 0; k < this.fftSize / 2; k++) {
      let realSum = 0;
      let imagSum = 0;
      
      for (let n = 0; n < this.fftSize; n++) {
        const windowedSample = (this.bufferL[n] + this.bufferR[n]) * 0.5 * this.hannWindow[n];
        const angle = -2 * Math.PI * k * n / this.fftSize;
        realSum += windowedSample * Math.cos(angle);
        imagSum += windowedSample * Math.sin(angle);
      }
      
      // Magnitude with K-weighting
      const magnitude = Math.sqrt(realSum * realSum + imagSum * imagSum);
      const kWeightedMagnitude = magnitude * this.kWeightResponse[k];
      
      // Convert to dB
      outputBuffer[k] = Math.max(-120, 20 * Math.log10(kWeightedMagnitude + 1e-10));
    }

    // Send FFT data
    this.port.postMessage({
      type: 'fft',
      fft: outputBuffer,
      transferList: [outputBuffer.buffer]
    });

    // Switch buffers
    this.currentBuffer = 1 - this.currentBuffer;
  }
}

registerProcessor('fft-processor', FFTProcessor);