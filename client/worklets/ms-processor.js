/**
 * M/S (Mid/Side) Processor
 * Encode/decode + low-end mono fold
 */

class MSProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.mode = 'encode'; // 'encode', 'decode', 'bypass'
    this.monoBelow = 120; // Hz - frequency below which to fold to mono
    this.stereoWidth = 100; // 0-200% stereo width
    
    // High-pass filter for side channel (removes low frequency stereo)
    this.sideHPF = {
      x1: 0, x2: 0,
      y1: 0, y2: 0,
      a0: 1, a1: 0, a2: 0,
      b1: 0, b2: 0
    };
    
    this.calculateFilterCoeffs();
    
    // Handle parameter changes
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setMode':
          this.mode = data.mode;
          break;
        case 'setMonoBelow':
          this.monoBelow = Math.max(60, Math.min(300, data.frequency));
          this.calculateFilterCoeffs();
          break;
        case 'setStereoWidth':
          this.stereoWidth = Math.max(0, Math.min(200, data.width));
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'monoBelow',
        defaultValue: 120,
        minValue: 60,
        maxValue: 300
      },
      {
        name: 'stereoWidth',
        defaultValue: 100,
        minValue: 0,
        maxValue: 200
      },
      {
        name: 'bypass',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1
      }
    ];
  }

  calculateFilterCoeffs() {
    // Calculate high-pass filter coefficients for side channel
    const freq = this.monoBelow;
    const omega = 2 * Math.PI * freq / this.sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * 0.707); // Q = 0.707 for Butterworth response
    
    const b0 = (1 + cos) / 2;
    const b1 = -(1 + cos);
    const b2 = (1 + cos) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;
    
    // Normalize coefficients
    this.sideHPF.a0 = b0 / a0;
    this.sideHPF.a1 = b1 / a0;
    this.sideHPF.a2 = b2 / a0;
    this.sideHPF.b1 = a1 / a0;
    this.sideHPF.b2 = a2 / a0;
  }

  applyHighPassFilter(sample) {
    // Biquad filter implementation
    const output = this.sideHPF.a0 * sample + 
                   this.sideHPF.a1 * this.sideHPF.x1 + 
                   this.sideHPF.a2 * this.sideHPF.x2 - 
                   this.sideHPF.b1 * this.sideHPF.y1 - 
                   this.sideHPF.b2 * this.sideHPF.y2;
    
    // Update delay line
    this.sideHPF.x2 = this.sideHPF.x1;
    this.sideHPF.x1 = sample;
    this.sideHPF.y2 = this.sideHPF.y1;
    this.sideHPF.y1 = output;
    
    return output;
  }

  encodeMS(left, right) {
    // Convert L/R to M/S
    const mid = (left + right) * 0.5;
    const side = (left - right) * 0.5;
    return { mid, side };
  }

  decodeMS(mid, side) {
    // Convert M/S to L/R
    const left = mid + side;
    const right = mid - side;
    return { left, right };
  }

  processMonoFold(leftSamples, rightSamples) {
    // Apply low-end mono folding
    const processedLeft = new Float32Array(leftSamples.length);
    const processedRight = new Float32Array(rightSamples.length);
    
    for (let i = 0; i < leftSamples.length; i++) {
      const left = leftSamples[i];
      const right = rightSamples[i];
      
      // Encode to M/S
      const { mid, side } = this.encodeMS(left, right);
      
      // Apply high-pass filter to side channel (removes low-end stereo)
      const filteredSide = this.applyHighPassFilter(side);
      
      // Apply stereo width adjustment
      const widthMultiplier = this.stereoWidth / 100;
      const adjustedSide = filteredSide * widthMultiplier;
      
      // Decode back to L/R
      const { left: newLeft, right: newRight } = this.decodeMS(mid, adjustedSide);
      
      processedLeft[i] = newLeft;
      processedRight[i] = newRight;
    }
    
    return { left: processedLeft, right: processedRight };
  }

  processStereoWidth(leftSamples, rightSamples) {
    // Apply stereo width adjustment without frequency splitting
    const processedLeft = new Float32Array(leftSamples.length);
    const processedRight = new Float32Array(rightSamples.length);
    
    const widthMultiplier = this.stereoWidth / 100;
    
    for (let i = 0; i < leftSamples.length; i++) {
      const left = leftSamples[i];
      const right = rightSamples[i];
      
      // Encode to M/S
      const { mid, side } = this.encodeMS(left, right);
      
      // Adjust side channel width
      const adjustedSide = side * widthMultiplier;
      
      // Decode back to L/R
      const { left: newLeft, right: newRight } = this.decodeMS(mid, adjustedSide);
      
      processedLeft[i] = newLeft;
      processedRight[i] = newRight;
    }
    
    return { left: processedLeft, right: processedRight };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2 || !input[0] || !input[1] || 
        !output || output.length < 2 || !output[0] || !output[1]) {
      return true;
    }

    // Update parameters
    if (parameters.monoBelow) {
      const newFreq = parameters.monoBelow[0];
      if (newFreq !== this.monoBelow) {
        this.monoBelow = newFreq;
        this.calculateFilterCoeffs();
      }
    }
    if (parameters.stereoWidth) {
      this.stereoWidth = parameters.stereoWidth[0];
    }

    // Check bypass
    const bypass = parameters.bypass ? parameters.bypass[0] > 0.5 : false;
    
    if (bypass) {
      output[0].set(input[0]);
      output[1].set(input[1]);
      return true;
    }

    const leftInput = input[0];
    const rightInput = input[1];

    let processedLeft, processedRight;

    switch (this.mode) {
      case 'encode':
        // Encode L/R to M/S and output M/S
        processedLeft = new Float32Array(leftInput.length);
        processedRight = new Float32Array(rightInput.length);
        
        for (let i = 0; i < leftInput.length; i++) {
          const { mid, side } = this.encodeMS(leftInput[i], rightInput[i]);
          processedLeft[i] = mid;   // Mid to left output
          processedRight[i] = side; // Side to right output
        }
        break;
        
      case 'decode':
        // Decode M/S input to L/R
        processedLeft = new Float32Array(leftInput.length);
        processedRight = new Float32Array(rightInput.length);
        
        for (let i = 0; i < leftInput.length; i++) {
          const mid = leftInput[i];
          const side = rightInput[i];
          const { left, right } = this.decodeMS(mid, side);
          processedLeft[i] = left;
          processedRight[i] = right;
        }
        break;
        
      default: // Process mode - apply mono fold and stereo width
        if (this.monoBelow > 60) {
          // Apply low-end mono folding
          const result = this.processMonoFold(leftInput, rightInput);
          processedLeft = result.left;
          processedRight = result.right;
        } else {
          // Simple stereo width adjustment
          const result = this.processStereoWidth(leftInput, rightInput);
          processedLeft = result.left;
          processedRight = result.right;
        }
        break;
    }

    // Output processed audio
    output[0].set(processedLeft);
    output[1].set(processedRight);

    // Send correlation analysis for metering
    let correlation = 0;
    let energy = 0;
    
    for (let i = 0; i < leftInput.length; i++) {
      const left = processedLeft[i];
      const right = processedRight[i];
      correlation += left * right;
      energy += (left * left + right * right) * 0.5;
    }
    
    const normalizedCorrelation = energy > 0 ? correlation / energy : 0;
    
    this.port.postMessage({
      type: 'analysisData',
      data: {
        correlation: normalizedCorrelation,
        stereoWidth: this.stereoWidth,
        monoBelow: this.monoBelow,
        mode: this.mode
      }
    });

    return true;
  }
}

registerProcessor('ms-processor', MSProcessor);