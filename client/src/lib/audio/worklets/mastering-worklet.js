// AudioWorkletProcessor for advanced mastering effects
class MasteringProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Parameters
    this.stereoWidth = 1.0;
    this.spatialFlux = 0.0;
    this.bassMonoFreq = 120.0;
    
    // Filter state for bass mono processing
    this.bassFilterL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.bassFilterR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    // Spatial processing state
    this.spatialDelayL = new Array(128).fill(0);
    this.spatialDelayR = new Array(128).fill(0);
    this.spatialIndex = 0;
    
    // Listen for parameter updates
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParameters') {
        const params = event.data.parameters;
        this.stereoWidth = params.stereoWidth || 1.0;
        this.spatialFlux = params.spatialFlux || 0.0;
        this.bassMonoFreq = params.bassMonoFreq || 120.0;
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) {
      return true;
    }
    
    const leftInput = input[0];
    const rightInput = input.length > 1 ? input[1] : input[0];
    const leftOutput = output[0];
    const rightOutput = output.length > 1 ? output[1] : output[0];
    
    if (!leftInput || !rightInput || !leftOutput || !rightOutput) {
      return true;
    }
    
    const sampleRate = 44100; // Assume 44.1kHz
    const frameLength = leftInput.length;
    
    // Calculate filter coefficients for bass mono processing
    const bassFilterCoeffs = this.calculateLowPassCoeffs(this.bassMonoFreq, sampleRate);
    
    for (let i = 0; i < frameLength; i++) {
      let leftSample = leftInput[i];
      let rightSample = rightInput[i];
      
      // Bass mono processing
      if (this.bassMonoFreq > 0) {
        const leftBass = this.processBiquad(leftSample, this.bassFilterL, bassFilterCoeffs);
        const rightBass = this.processBiquad(rightSample, this.bassFilterR, bassFilterCoeffs);
        const bassSum = (leftBass + rightBass) * 0.5;
        
        // Replace bass frequencies with mono sum
        const leftHigh = leftSample - leftBass;
        const rightHigh = rightSample - rightBass;
        
        leftSample = bassSum + leftHigh;
        rightSample = bassSum + rightHigh;
      }
      
      // Stereo width processing
      if (this.stereoWidth !== 1.0) {
        const mid = (leftSample + rightSample) * 0.5;
        const side = (leftSample - rightSample) * 0.5;
        
        const wideSide = side * this.stereoWidth;
        
        leftSample = mid + wideSide;
        rightSample = mid - wideSide;
      }
      
      // Spatial flux processing (adds subtle movement)
      if (this.spatialFlux > 0) {
        const delayOffset = Math.floor(64 + Math.sin(this.spatialIndex * 0.001) * 32);
        const delayIndex = (this.spatialIndex - delayOffset + 128) % 128;
        
        const delayedL = this.spatialDelayL[delayIndex];
        const delayedR = this.spatialDelayR[delayIndex];
        
        leftSample += delayedR * this.spatialFlux * 0.1;
        rightSample += delayedL * this.spatialFlux * 0.1;
        
        this.spatialDelayL[this.spatialIndex % 128] = leftSample;
        this.spatialDelayR[this.spatialIndex % 128] = rightSample;
        this.spatialIndex++;
      }
      
      // Soft clipping
      leftSample = this.softClip(leftSample);
      rightSample = this.softClip(rightSample);
      
      // Output
      leftOutput[i] = leftSample;
      rightOutput[i] = rightSample;
    }
    
    return true;
  }
  
  calculateLowPassCoeffs(frequency, sampleRate) {
    const omega = 2 * Math.PI * frequency / sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * 0.707); // Q = 0.707
    
    const b0 = (1 - cosOmega) / 2;
    const b1 = 1 - cosOmega;
    const b2 = (1 - cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;
    
    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
  }
  
  processBiquad(input, state, coeffs) {
    const output = coeffs.b0 * input + coeffs.b1 * state.x1 + coeffs.b2 * state.x2
                   - coeffs.a1 * state.y1 - coeffs.a2 * state.y2;
    
    // Update state
    state.x2 = state.x1;
    state.x1 = input;
    state.y2 = state.y1;
    state.y1 = output;
    
    return output;
  }
  
  softClip(sample) {
    // Tanh-style soft clipping
    if (Math.abs(sample) <= 0.7) {
      return sample;
    } else {
      const sign = sample >= 0 ? 1 : -1;
      return sign * (0.7 + 0.3 * Math.tanh((Math.abs(sample) - 0.7) * 3));
    }
  }
  
  static get parameterDescriptors() {
    return [
      {
        name: 'stereoWidth',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'spatialFlux',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 10.0,
      },
      {
        name: 'bassMonoFreq',
        defaultValue: 120.0,
        minValue: 50.0,
        maxValue: 500.0,
      },
    ];
  }
}

registerProcessor('mastering-processor', MasteringProcessor);
