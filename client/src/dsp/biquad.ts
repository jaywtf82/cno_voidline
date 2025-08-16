/**
 * biquad.ts - High-performance biquad filter implementations
 * Transposed Direct Form II with double precision accumulators
 */

export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export class BiquadFilter {
  private coeffs: BiquadCoefficients = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
  private state: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  
  constructor(coeffs?: BiquadCoefficients) {
    if (coeffs) {
      this.coeffs = { ...coeffs };
    }
  }

  setCoefficients(coeffs: BiquadCoefficients): void {
    this.coeffs = { ...coeffs };
  }

  reset(): void {
    this.state = { x1: 0, x2: 0, y1: 0, y2: 0 };
  }

  process(input: number): number {
    // Transposed Direct Form II
    const output = this.coeffs.b0 * input + this.coeffs.b1 * this.state.x1 + this.coeffs.b2 * this.state.x2 
                 - this.coeffs.a1 * this.state.y1 - this.coeffs.a2 * this.state.y2;
    
    // Update delay line
    this.state.x2 = this.state.x1;
    this.state.x1 = input;
    this.state.y2 = this.state.y1;
    this.state.y1 = output;
    
    return output;
  }

  processBlock(input: Float32Array, output: Float32Array): void {
    for (let i = 0; i < input.length; i++) {
      output[i] = this.process(input[i]);
    }
  }
}

// Filter design functions
export class FilterDesign {
  static lowpass(freq: number, q: number, sampleRate: number): BiquadCoefficients {
    const omega = 2 * Math.PI * freq / sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * q);

    const b0 = (1 - cos) / 2;
    const b1 = 1 - cos;
    const b2 = (1 - cos) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }

  static highpass(freq: number, q: number, sampleRate: number): BiquadCoefficients {
    const omega = 2 * Math.PI * freq / sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * q);

    const b0 = (1 + cos) / 2;
    const b1 = -(1 + cos);
    const b2 = (1 + cos) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }

  static peaking(freq: number, gain: number, q: number, sampleRate: number): BiquadCoefficients {
    const A = Math.pow(10, gain / 40);
    const omega = 2 * Math.PI * freq / sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * q);

    const b0 = 1 + alpha * A;
    const b1 = -2 * cos;
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * cos;
    const a2 = 1 - alpha / A;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }

  static lowShelf(freq: number, gain: number, q: number, sampleRate: number): BiquadCoefficients {
    const A = Math.pow(10, gain / 40);
    const omega = 2 * Math.PI * freq / sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const beta = Math.sqrt(A) / q;

    const b0 = A * ((A + 1) - (A - 1) * cos + beta * sin);
    const b1 = 2 * A * ((A - 1) - (A + 1) * cos);
    const b2 = A * ((A + 1) - (A - 1) * cos - beta * sin);
    const a0 = (A + 1) + (A - 1) * cos + beta * sin;
    const a1 = -2 * ((A - 1) + (A + 1) * cos);
    const a2 = (A + 1) + (A - 1) * cos - beta * sin;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }

  static highShelf(freq: number, gain: number, q: number, sampleRate: number): BiquadCoefficients {
    const A = Math.pow(10, gain / 40);
    const omega = 2 * Math.PI * freq / sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const beta = Math.sqrt(A) / q;

    const b0 = A * ((A + 1) + (A - 1) * cos + beta * sin);
    const b1 = -2 * A * ((A - 1) + (A + 1) * cos);
    const b2 = A * ((A + 1) + (A - 1) * cos - beta * sin);
    const a0 = (A + 1) - (A - 1) * cos + beta * sin;
    const a1 = 2 * ((A - 1) - (A + 1) * cos);
    const a2 = (A + 1) - (A - 1) * cos - beta * sin;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }
}

// K-weighting filters for LUFS measurement
export class KWeightingFilter {
  private preFilter: BiquadFilter;
  private rlbFilter: BiquadFilter;

  constructor(sampleRate: number) {
    // ITU-R BS.1770-4 K-weighting filters
    this.preFilter = new BiquadFilter(this.getPreFilterCoeffs(sampleRate));
    this.rlbFilter = new BiquadFilter(this.getRLBFilterCoeffs(sampleRate));
  }

  private getPreFilterCoeffs(sampleRate: number): BiquadCoefficients {
    // High-pass filter at ~38Hz
    return FilterDesign.highpass(38, 0.5, sampleRate);
  }

  private getRLBFilterCoeffs(sampleRate: number): BiquadCoefficients {
    // High-frequency shelf filter at ~1681Hz, +4dB
    return FilterDesign.highShelf(1681, 4, 0.5, sampleRate);
  }

  process(input: number): number {
    const preFiltered = this.preFilter.process(input);
    return this.rlbFilter.process(preFiltered);
  }

  processBlock(input: Float32Array, output: Float32Array): void {
    const temp = new Float32Array(input.length);
    this.preFilter.processBlock(input, temp);
    this.rlbFilter.processBlock(temp, output);
  }

  reset(): void {
    this.preFilter.reset();
    this.rlbFilter.reset();
  }
}