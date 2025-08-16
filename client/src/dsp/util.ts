/**
 * util.ts - DSP utility functions
 * High-performance utilities for audio processing
 */

export class DSPUtils {
  // Fast math approximations
  static fastLog10(x: number): number {
    return Math.log(x) * 0.4342944819032518; // 1/ln(10)
  }

  static fastPow10(x: number): number {
    return Math.exp(x * 2.302585092994046); // ln(10)
  }

  static dbToLinear(db: number): number {
    return this.fastPow10(db * 0.05); // 10^(db/20)
  }

  static linearToDb(linear: number): number {
    return 20 * this.fastLog10(Math.abs(linear) + 1e-10);
  }

  // Smooth parameter updates
  static smoothParameter(current: number, target: number, smoothing: number): number {
    return current + (target - current) * smoothing;
  }

  static onePoleLPF(input: number, output: number, cutoff: number, sampleRate: number): number {
    const rc = 1 / (2 * Math.PI * cutoff);
    const dt = 1 / sampleRate;
    const alpha = dt / (rc + dt);
    return output + alpha * (input - output);
  }

  // RMS calculation with SIMD-like optimization
  static calculateRMS(samples: Float32Array, startIndex = 0, length?: number): number {
    const len = length || samples.length;
    const end = Math.min(startIndex + len, samples.length);
    let sum = 0;
    
    // Process in chunks of 4 for better cache performance
    let i = startIndex;
    for (; i < end - 3; i += 4) {
      const s0 = samples[i];
      const s1 = samples[i + 1];
      const s2 = samples[i + 2];
      const s3 = samples[i + 3];
      sum += s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3;
    }
    
    // Handle remaining samples
    for (; i < end; i++) {
      const s = samples[i];
      sum += s * s;
    }
    
    return Math.sqrt(sum / len);
  }

  // Peak detection with interpolation
  static findPeak(samples: Float32Array, startIndex = 0, length?: number): { index: number; value: number } {
    const len = length || samples.length;
    const end = Math.min(startIndex + len, samples.length);
    
    let peakIndex = startIndex;
    let peakValue = Math.abs(samples[startIndex]);
    
    for (let i = startIndex + 1; i < end; i++) {
      const absValue = Math.abs(samples[i]);
      if (absValue > peakValue) {
        peakValue = absValue;
        peakIndex = i;
      }
    }
    
    return { index: peakIndex, value: peakValue };
  }

  // Cubic interpolation for sub-sample accuracy
  static cubicInterpolate(y0: number, y1: number, y2: number, y3: number, mu: number): number {
    const a0 = y3 - y2 - y0 + y1;
    const a1 = y0 - y1 - a0;
    const a2 = y2 - y0;
    const a3 = y1;
    
    return a0 * mu * mu * mu + a1 * mu * mu + a2 * mu + a3;
  }

  // Crossfade between two values
  static crossfade(a: number, b: number, ratio: number): number {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return a * (1 - clampedRatio) + b * clampedRatio;
  }

  // Soft clip for gentle limiting
  static softClip(input: number, threshold = 0.8): number {
    const absInput = Math.abs(input);
    
    if (absInput <= threshold) {
      return input;
    }
    
    const sign = input >= 0 ? 1 : -1;
    const excess = absInput - threshold;
    const maxExcess = 1 - threshold;
    
    // Hyperbolic tangent soft clip
    const clipped = threshold + maxExcess * Math.tanh(excess / maxExcess);
    return sign * clipped;
  }

  // Ring buffer utilities
  static createRingBuffer(size: number): { buffer: Float32Array; writeIndex: number } {
    return {
      buffer: new Float32Array(size),
      writeIndex: 0
    };
  }

  static writeToRingBuffer(ringBuffer: { buffer: Float32Array; writeIndex: number }, value: number): void {
    ringBuffer.buffer[ringBuffer.writeIndex] = value;
    ringBuffer.writeIndex = (ringBuffer.writeIndex + 1) % ringBuffer.buffer.length;
  }

  static readFromRingBuffer(ringBuffer: { buffer: Float32Array; writeIndex: number }, offset: number): number {
    const index = (ringBuffer.writeIndex - offset - 1 + ringBuffer.buffer.length) % ringBuffer.buffer.length;
    return ringBuffer.buffer[index];
  }

  // Frequency domain utilities
  static binToFrequency(bin: number, fftSize: number, sampleRate: number): number {
    return (bin * sampleRate) / fftSize;
  }

  static frequencyToBin(frequency: number, fftSize: number, sampleRate: number): number {
    return Math.round((frequency * fftSize) / sampleRate);
  }

  // Mel scale conversions
  static hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  static melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  // Bark scale conversions  
  static hzToBark(hz: number): number {
    return 13 * Math.atan(0.00076 * hz) + 3.5 * Math.atan((hz / 7500) ** 2);
  }

  // Zero-crossing rate
  static zeroCrossingRate(samples: Float32Array): number {
    let crossings = 0;
    
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    
    return crossings / (samples.length - 1);
  }

  // Spectral centroid
  static spectralCentroid(magnitudes: Float32Array, sampleRate: number): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < magnitudes.length; i++) {
      const frequency = this.binToFrequency(i, (magnitudes.length - 1) * 2, sampleRate);
      const magnitude = magnitudes[i];
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  // Clamp value to range
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // Linear interpolation
  static lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  // Exponential moving average
  static ema(current: number, target: number, alpha: number): number {
    return alpha * target + (1 - alpha) * current;
  }
}