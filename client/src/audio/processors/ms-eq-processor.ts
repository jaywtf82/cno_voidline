/**
 * ms-eq-processor.ts - Mid/Side EQ with 3-band parametric filtering
 * Encodes to M/S, applies separate EQ to mid and side, then decodes back to L/R
 */

interface BiquadState {
  x1: number;
  x2: number; 
  y1: number;
  y2: number;
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

interface EQBand {
  freq: number;
  gain: number;
  q: number;
}

interface MSEQParams {
  mid: {
    low: EQBand;
    mid: EQBand;
    high: EQBand;
  };
  side: {
    low: EQBand;
    mid: EQBand;
    high: EQBand;
  };
}

class MSEQProcessor extends AudioWorkletProcessor {
  private sampleRate = 48000;
  
  // Biquad filters for mid channel
  private midLowFilter: BiquadState;
  private midMidFilter: BiquadState;
  private midHighFilter: BiquadState;
  
  // Biquad filters for side channel
  private sideLowFilter: BiquadState;
  private sideMidFilter: BiquadState;
  private sideHighFilter: BiquadState;
  
  // Current parameters
  private params: MSEQParams;
  
  // Parameter smoothing
  private paramSmoothingCoeff = 0.01; // ~1ms time constant

  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this.sampleRate = sampleRate;
    
    // Initialize default parameters
    this.params = {
      mid: {
        low: { freq: 100, gain: 0, q: 0.7 },
        mid: { freq: 1000, gain: 0, q: 0.7 },
        high: { freq: 8000, gain: 0, q: 0.7 }
      },
      side: {
        low: { freq: 100, gain: 0, q: 0.7 },
        mid: { freq: 1000, gain: 0, q: 0.7 },
        high: { freq: 8000, gain: 0, q: 0.7 }
      }
    };
    
    // Initialize biquad filters
    this.midLowFilter = this.createBiquadState();
    this.midMidFilter = this.createBiquadState();
    this.midHighFilter = this.createBiquadState();
    this.sideLowFilter = this.createBiquadState();
    this.sideMidFilter = this.createBiquadState();
    this.sideHighFilter = this.createBiquadState();
    
    // Update filter coefficients
    this.updateAllFilters();
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, params } = event.data;
    
    switch (type) {
      case 'updateParams':
        this.params = { ...this.params, ...params };
        this.updateAllFilters();
        break;
    }
  }

  private createBiquadState(): BiquadState {
    return {
      x1: 0, x2: 0, y1: 0, y2: 0,
      b0: 1, b1: 0, b2: 0, a1: 0, a2: 0
    };
  }

  private updateAllFilters(): void {
    // Update mid channel filters
    this.updatePeakingFilter(this.midLowFilter, this.params.mid.low);
    this.updatePeakingFilter(this.midMidFilter, this.params.mid.mid);
    this.updatePeakingFilter(this.midHighFilter, this.params.mid.high);
    
    // Update side channel filters
    this.updatePeakingFilter(this.sideLowFilter, this.params.side.low);
    this.updatePeakingFilter(this.sideMidFilter, this.params.side.mid);
    this.updatePeakingFilter(this.sideHighFilter, this.params.side.high);
  }

  private updatePeakingFilter(filter: BiquadState, band: EQBand): void {
    // Peaking EQ biquad coefficients
    const A = Math.pow(10, band.gain / 40); // dB to linear
    const omega = 2 * Math.PI * band.freq / this.sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * band.q);
    
    // Peaking filter coefficients
    const b0 = 1 + alpha * A;
    const b1 = -2 * cos;
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * cos;
    const a2 = 1 - alpha / A;
    
    // Normalize by a0
    filter.b0 = b0 / a0;
    filter.b1 = b1 / a0;
    filter.b2 = b2 / a0;
    filter.a1 = a1 / a0;
    filter.a2 = a2 / a0;
  }

  private processBiquad(filter: BiquadState, input: number): number {
    // Transposed Direct Form II
    const output = filter.b0 * input + filter.b1 * filter.x1 + filter.b2 * filter.x2 - filter.a1 * filter.y1 - filter.a2 * filter.y2;
    
    // Update delay line
    filter.x2 = filter.x1;
    filter.x1 = input;
    filter.y2 = filter.y1;
    filter.y1 = output;
    
    return output;
  }

  private processChannel(filters: BiquadState[], input: number): number {
    // Process through all three bands in series
    let output = input;
    for (const filter of filters) {
      output = this.processBiquad(filter, output);
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
    
    const frameSize = leftChannel.length;
    const sqrt2 = Math.SQRT2;
    
    for (let i = 0; i < frameSize; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      
      // Encode to Mid/Side
      const mid = (left + right) / sqrt2;
      const side = (left - right) / sqrt2;
      
      // Process mid channel through mid EQ chain
      const processedMid = this.processChannel([
        this.midLowFilter,
        this.midMidFilter, 
        this.midHighFilter
      ], mid);
      
      // Process side channel through side EQ chain
      const processedSide = this.processChannel([
        this.sideLowFilter,
        this.sideMidFilter,
        this.sideHighFilter
      ], side);
      
      // Decode back to Left/Right
      const decodedLeft = (processedMid + processedSide) / sqrt2;
      const decodedRight = (processedMid - processedSide) / sqrt2;
      
      // Output
      outputLeft[i] = decodedLeft;
      if (outputRight && outputRight !== outputLeft) {
        outputRight[i] = decodedRight;
      }
    }
    
    return true;
  }
}

// MS Encoder worklet (standalone for modular graph)
class MSEncoderProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0 || !output || output.length === 0) return true;
    
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    const outputMid = output[0];
    const outputSide = output.length > 1 ? output[1] : output[0];
    
    if (!leftChannel || !outputMid) return true;
    
    const sqrt2 = Math.SQRT2;
    
    for (let i = 0; i < leftChannel.length; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      
      // Encode to Mid/Side
      outputMid[i] = (left + right) / sqrt2;
      if (outputSide && outputSide !== outputMid) {
        outputSide[i] = (left - right) / sqrt2;
      }
    }
    
    return true;
  }
}

// MS Decoder worklet (standalone for modular graph)
class MSDecoderProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0 || !output || output.length === 0) return true;
    
    const midChannel = input[0];
    const sideChannel = input.length > 1 ? input[1] : new Float32Array(midChannel.length);
    const outputLeft = output[0];
    const outputRight = output.length > 1 ? output[1] : output[0];
    
    if (!midChannel || !outputLeft) return true;
    
    const sqrt2 = Math.SQRT2;
    
    for (let i = 0; i < midChannel.length; i++) {
      const mid = midChannel[i];
      const side = sideChannel[i];
      
      // Decode to Left/Right
      outputLeft[i] = (mid + side) / sqrt2;
      if (outputRight && outputRight !== outputLeft) {
        outputRight[i] = (mid - side) / sqrt2;
      }
    }
    
    return true;
  }
}

registerProcessor('ms-eq-processor', MSEQProcessor);
registerProcessor('ms-encoder', MSEncoderProcessor);
registerProcessor('ms-decoder', MSDecoderProcessor);