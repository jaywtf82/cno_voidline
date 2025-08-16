// ms-eq-processor.ts - Mid/Side EQ processor with 3 peaking bands each
declare const sampleRate: number;

interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface MSEQState {
  // M/S encoding/decoding
  msDecoded: boolean;
  
  // Biquad states for each band (3 mid + 3 side = 6 total)
  midBands: [BiquadState, BiquadState, BiquadState];
  sideBands: [BiquadState, BiquadState, BiquadState];
  
  // Parameter smoothing states
  smoothedGains: {
    mid: [number, number, number];
    side: [number, number, number];
  };
  
  // Current biquad coefficients
  coefficients: {
    mid: Array<{ b0: number; b1: number; b2: number; a1: number; a2: number }>;
    side: Array<{ b0: number; b1: number; b2: number; a1: number; a2: number }>;
  };
}

class MSEQProcessor extends AudioWorkletProcessor {
  private state: MSEQState;
  
  // Current parameters
  private params = {
    midGains: [0, 0, 0] as [number, number, number],
    sideGains: [0, 0, 0] as [number, number, number],
    midFreqs: [200, 1000, 5000] as [number, number, number],
    sideFreqs: [200, 1000, 5000] as [number, number, number],
    midQs: [1, 1, 1] as [number, number, number],
    sideQs: [1, 1, 1] as [number, number, number],
  };
  
  // Smoothing time constants (α = exp(-1/(τ·sr)))
  private readonly smoothingAlpha = Math.exp(-1 / (0.05 * sampleRate)); // 50ms smoothing
  
  constructor() {
    super();
    
    this.state = {
      msDecoded: false,
      
      midBands: [
        { x1: 0, x2: 0, y1: 0, y2: 0 },
        { x1: 0, x2: 0, y1: 0, y2: 0 },
        { x1: 0, x2: 0, y1: 0, y2: 0 },
      ],
      sideBands: [
        { x1: 0, x2: 0, y1: 0, y2: 0 },
        { x1: 0, x2: 0, y1: 0, y2: 0 },
        { x1: 0, x2: 0, y1: 0, y2: 0 },
      ],
      
      smoothedGains: {
        mid: [0, 0, 0],
        side: [0, 0, 0],
      },
      
      coefficients: {
        mid: [],
        side: [],
      },
    };
    
    // Initialize coefficients
    this.updateAllCoefficients();
    
    // Set up message handler
    this.port.onmessage = (event) => {
      const { type, ...params } = event.data;
      if (type === 'updateParams') {
        this.updateParameters(params);
      }
    };
  }
  
  private updateParameters(newParams: any): void {
    // Update parameters with new values
    Object.assign(this.params, newParams);
    this.updateAllCoefficients();
  }
  
  private updateAllCoefficients(): void {
    this.state.coefficients.mid = [];
    this.state.coefficients.side = [];
    
    // Compute coefficients for mid bands
    for (let i = 0; i < 3; i++) {
      this.state.coefficients.mid.push(
        this.computePeakingCoefficients(
          this.params.midFreqs[i],
          this.params.midGains[i],
          this.params.midQs[i]
        )
      );
    }
    
    // Compute coefficients for side bands
    for (let i = 0; i < 3; i++) {
      this.state.coefficients.side.push(
        this.computePeakingCoefficients(
          this.params.sideFreqs[i],
          this.params.sideGains[i],
          this.params.sideQs[i]
        )
      );
    }
  }
  
  private computePeakingCoefficients(freq: number, gainDb: number, Q: number) {
    const A = Math.pow(10, gainDb / 40); // sqrt of linear gain
    const omega = 2 * Math.PI * freq / sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * Q);
    
    // Peaking EQ coefficients
    const b0 = 1 + alpha * A;
    const b1 = -2 * cos;
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * cos;
    const a2 = 1 - alpha / A;
    
    // Normalize by a0
    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
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
    
    // Process each sample
    for (let i = 0; i < blockSize; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      
      // Convert L/R to M/S
      let mid = (left + right) * 0.5;
      let side = (left - right) * 0.5;
      
      // Apply smoothed gain parameters
      this.updateSmoothedGains();
      
      // Process mid channel through 3 peaking bands
      for (let band = 0; band < 3; band++) {
        mid = this.processBiquad(mid, this.state.midBands[band], this.state.coefficients.mid[band]);
      }
      
      // Process side channel through 3 peaking bands
      for (let band = 0; band < 3; band++) {
        side = this.processBiquad(side, this.state.sideBands[band], this.state.coefficients.side[band]);
      }
      
      // Convert M/S back to L/R
      outLeft[i] = mid + side;
      outRight[i] = mid - side;
    }
    
    return true;
  }
  
  private updateSmoothedGains(): void {
    // Smooth gain parameters to avoid clicks
    for (let i = 0; i < 3; i++) {
      this.state.smoothedGains.mid[i] += 
        this.smoothingAlpha * (this.params.midGains[i] - this.state.smoothedGains.mid[i]);
      
      this.state.smoothedGains.side[i] += 
        this.smoothingAlpha * (this.params.sideGains[i] - this.state.smoothedGains.side[i]);
    }
  }
  
  private processBiquad(
    input: number, 
    state: BiquadState, 
    coeffs: { b0: number; b1: number; b2: number; a1: number; a2: number }
  ): number {
    // Transposed Direct Form II
    const output = coeffs.b0 * input + state.x1;
    
    state.x1 = coeffs.b1 * input - coeffs.a1 * output + state.x2;
    state.x2 = coeffs.b2 * input - coeffs.a2 * output;
    
    return output;
  }
}

// Register both encoder and decoder as separate processors
class MSEncoder extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2 || !output || output.length < 2) {
      return true;
    }
    
    const leftChannel = input[0];
    const rightChannel = input[1];
    const outMid = output[0];
    const outSide = output[1];
    const blockSize = leftChannel.length;
    
    // Convert L/R to M/S
    for (let i = 0; i < blockSize; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      
      outMid[i] = (left + right) * 0.5;   // Mid
      outSide[i] = (left - right) * 0.5;  // Side
    }
    
    return true;
  }
}

class MSDecoder extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2 || !output || output.length < 2) {
      return true;
    }
    
    const midChannel = input[0];
    const sideChannel = input[1];
    const outLeft = output[0];
    const outRight = output[1];
    const blockSize = midChannel.length;
    
    // Convert M/S back to L/R
    for (let i = 0; i < blockSize; i++) {
      const mid = midChannel[i];
      const side = sideChannel[i];
      
      outLeft[i] = mid + side;   // Left
      outRight[i] = mid - side;  // Right
    }
    
    return true;
  }
}

registerProcessor('ms-eq-processor', MSEQProcessor);
registerProcessor('ms-encoder', MSEncoder);
registerProcessor('ms-decoder', MSDecoder);