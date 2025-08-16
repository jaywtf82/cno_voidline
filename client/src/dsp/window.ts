/**
 * window.ts - Window functions for spectral analysis
 * High-quality window functions with exact coefficients
 */

export class WindowFunctions {
  static hann(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  static hamming(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1));
    }
    return window;
  }

  static blackman(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const x = 2 * Math.PI * i / (size - 1);
      window[i] = 0.42 - 0.5 * Math.cos(x) + 0.08 * Math.cos(2 * x);
    }
    return window;
  }

  static blackmanHarris(size: number): Float32Array {
    const window = new Float32Array(size);
    const a0 = 0.35875;
    const a1 = 0.48829;
    const a2 = 0.14128;
    const a3 = 0.01168;
    
    for (let i = 0; i < size; i++) {
      const x = 2 * Math.PI * i / (size - 1);
      window[i] = a0 - a1 * Math.cos(x) + a2 * Math.cos(2 * x) - a3 * Math.cos(3 * x);
    }
    return window;
  }

  static kaiser(size: number, beta: number): Float32Array {
    const window = new Float32Array(size);
    const iBeta = 1 / this.modifiedBesselI0(beta);
    const mid = (size - 1) / 2;
    
    for (let i = 0; i < size; i++) {
      const x = (i - mid) / mid;
      window[i] = this.modifiedBesselI0(beta * Math.sqrt(1 - x * x)) * iBeta;
    }
    return window;
  }

  static tukey(size: number, alpha: number): Float32Array {
    const window = new Float32Array(size);
    const taperLength = Math.floor(alpha * (size - 1) / 2);
    
    for (let i = 0; i < size; i++) {
      if (i < taperLength) {
        // Rising taper
        window[i] = 0.5 * (1 - Math.cos(Math.PI * i / taperLength));
      } else if (i >= size - taperLength) {
        // Falling taper
        window[i] = 0.5 * (1 - Math.cos(Math.PI * (size - 1 - i) / taperLength));
      } else {
        // Flat top
        window[i] = 1;
      }
    }
    return window;
  }

  private static modifiedBesselI0(x: number): number {
    // Approximation of modified Bessel function of the first kind, order 0
    let sum = 1;
    let term = 1;
    let k = 1;
    
    while (term > 1e-12) {
      term *= (x * x) / (4 * k * k);
      sum += term;
      k++;
    }
    
    return sum;
  }

  static getWindowGain(windowType: string, size: number): number {
    // Calculate coherent gain for amplitude correction
    let window: Float32Array;
    
    switch (windowType) {
      case 'hann':
        window = this.hann(size);
        break;
      case 'hamming':
        window = this.hamming(size);
        break;
      case 'blackman':
        window = this.blackman(size);
        break;
      case 'blackman-harris':
        window = this.blackmanHarris(size);
        break;
      default:
        return 1;
    }
    
    const sum = window.reduce((acc, val) => acc + val, 0);
    return sum / size;
  }

  static getNoiseBandwidth(windowType: string): number {
    // Equivalent noise bandwidth for different windows
    switch (windowType) {
      case 'hann':
        return 1.5;
      case 'hamming':
        return 1.36;
      case 'blackman':
        return 1.73;
      case 'blackman-harris':
        return 2.0;
      case 'kaiser':
        return 1.8; // Approximate for typical beta
      default:
        return 1.0; // Rectangular
    }
  }
}