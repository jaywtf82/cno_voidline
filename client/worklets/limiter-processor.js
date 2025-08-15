/**
 * True Peak Limiter Processor
 * 4-8x oversampling, peak-hold, ISP detection
 */

class LimiterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.oversampleRate = 4; // 4x or 8x oversampling
    this.ceiling = -1.0;     // dBTP
    this.lookahead = 0.005;  // 5ms default
    this.release = 0.050;    // 50ms default
    this.style = 'transparent'; // 'transparent', 'punchy', 'warm'
    
    this.lookaheadSamples = Math.floor(this.lookahead * this.sampleRate);
    this.maxLookahead = Math.floor(0.010 * this.sampleRate); // 10ms max
    
    // Delay buffers for lookahead
    this.delayBuffers = [
      new Float32Array(this.maxLookahead),
      new Float32Array(this.maxLookahead)
    ];
    this.delayIndex = 0;
    
    // Envelope follower
    this.envelope = 1.0;
    this.peakHold = 0;
    this.peakHoldTime = 0;
    this.peakHoldDecay = 0.999; // Peak hold decay rate
    
    // ISP (Inter-Sample Peak) detection
    this.ispCount = 0;
    this.ispThreshold = this.dbToLinear(this.ceiling);
    
    // Oversampling buffers
    this.oversampleBuffer = new Float32Array(128 * this.oversampleRate);
    this.processedBuffer = new Float32Array(128 * this.oversampleRate);
    
    // Simple anti-aliasing filter for oversampling
    this.filterState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    // Handle parameter changes
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setCeiling':
          this.ceiling = Math.max(-3, Math.min(0, data.ceiling));
          this.ispThreshold = this.dbToLinear(this.ceiling);
          break;
        case 'setLookahead':
          this.lookahead = Math.max(0.001, Math.min(0.010, data.lookahead / 1000));
          this.lookaheadSamples = Math.floor(this.lookahead * this.sampleRate);
          break;
        case 'setRelease':
          this.release = Math.max(0.010, Math.min(0.200, data.release / 1000));
          break;
        case 'setStyle':
          this.style = data.style;
          break;
        case 'setOversample':
          this.oversampleRate = data.rate === 8 ? 8 : 4;
          this.oversampleBuffer = new Float32Array(128 * this.oversampleRate);
          this.processedBuffer = new Float32Array(128 * this.oversampleRate);
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'ceiling',
        defaultValue: -1.0,
        minValue: -3.0,
        maxValue: 0.0
      },
      {
        name: 'lookahead',
        defaultValue: 5.0,
        minValue: 1.0,
        maxValue: 10.0
      },
      {
        name: 'release',
        defaultValue: 50.0,
        minValue: 10.0,
        maxValue: 200.0
      },
      {
        name: 'bypass',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1
      }
    ];
  }

  dbToLinear(db) {
    return Math.pow(10, db / 20);
  }

  linearToDb(linear) {
    return 20 * Math.log10(Math.max(linear, 1e-10));
  }

  // Simple oversampling using linear interpolation
  oversample(input) {
    const output = new Float32Array(input.length * this.oversampleRate);
    
    for (let i = 0; i < input.length; i++) {
      const baseIndex = i * this.oversampleRate;
      
      // Insert original sample
      output[baseIndex] = input[i];
      
      // Interpolate intermediate samples
      const nextSample = i < input.length - 1 ? input[i + 1] : input[i];
      const step = (nextSample - input[i]) / this.oversampleRate;
      
      for (let j = 1; j < this.oversampleRate; j++) {
        output[baseIndex + j] = input[i] + step * j;
      }
    }
    
    return output;
  }

  // Simple decimation with anti-aliasing
  decimate(input) {
    const output = new Float32Array(input.length / this.oversampleRate);
    
    // Simple low-pass filter coefficients for anti-aliasing
    const a0 = 0.2, a1 = 0.5, a2 = 0.2;
    const b1 = -0.5, b2 = 0.1;
    
    for (let i = 0; i < output.length; i++) {
      const sourceIndex = i * this.oversampleRate;
      
      if (sourceIndex < input.length) {
        const x0 = input[sourceIndex];
        const x1 = this.filterState.x1;
        const x2 = this.filterState.x2;
        const y1 = this.filterState.y1;
        const y2 = this.filterState.y2;
        
        // Apply anti-aliasing filter
        const y0 = a0 * x0 + a1 * x1 + a2 * x2 - b1 * y1 - b2 * y2;
        
        output[i] = y0;
        
        // Update filter state
        this.filterState.x2 = x1;
        this.filterState.x1 = x0;
        this.filterState.y2 = y1;
        this.filterState.y1 = y0;
      }
    }
    
    return output;
  }

  detectTruePeaks(samples) {
    // Oversample to detect inter-sample peaks
    const oversampled = this.oversample(samples);
    let maxPeak = 0;
    let ispDetected = false;
    
    for (let i = 0; i < oversampled.length; i++) {
      const absSample = Math.abs(oversampled[i]);
      
      if (absSample > maxPeak) {
        maxPeak = absSample;
      }
      
      // Check for ISP violations
      if (absSample > this.ispThreshold) {
        ispDetected = true;
        this.ispCount++;
      }
    }
    
    if (ispDetected) {
      this.port.postMessage({
        type: 'ispDetected',
        data: {
          peak: this.linearToDb(maxPeak),
          count: this.ispCount
        }
      });
    }
    
    return maxPeak;
  }

  applyLimiting(samples, ceiling) {
    const ceilingLinear = this.dbToLinear(ceiling);
    const releaseCoeff = Math.exp(-1 / (this.release * this.sampleRate));
    const attackCoeff = 0.0; // Instant attack for limiting
    
    const limited = new Float32Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      // Store in delay buffer
      this.delayBuffers[0][this.delayIndex] = samples[i];
      
      // Look ahead for peaks
      let peakAhead = 0;
      for (let j = 0; j < this.lookaheadSamples; j++) {
        const index = (this.delayIndex + j) % this.maxLookahead;
        const sample = Math.abs(this.delayBuffers[0][index]);
        if (sample > peakAhead) {
          peakAhead = sample;
        }
      }
      
      // Calculate required gain reduction
      let targetGain = 1.0;
      if (peakAhead > ceilingLinear) {
        targetGain = ceilingLinear / peakAhead;
      }
      
      // Apply envelope smoothing
      if (targetGain < this.envelope) {
        this.envelope = targetGain; // Instant attack
      } else {
        this.envelope = targetGain + (this.envelope - targetGain) * releaseCoeff;
      }
      
      // Apply limiting based on style
      const delayedSample = this.delayBuffers[0][this.delayIndex];
      
      switch (this.style) {
        case 'punchy':
          // Add some harmonic saturation for punch
          limited[i] = this.applySaturation(delayedSample * this.envelope, 0.1);
          break;
        case 'warm':
          // Add subtle tube-style warmth
          limited[i] = this.applyWarmth(delayedSample * this.envelope);
          break;
        default: // transparent
          limited[i] = delayedSample * this.envelope;
          break;
      }
      
      this.delayIndex = (this.delayIndex + 1) % this.maxLookahead;
    }
    
    return limited;
  }

  applySaturation(sample, amount) {
    const drive = 1 + amount;
    const driven = sample * drive;
    return Math.tanh(driven) / drive;
  }

  applyWarmth(sample) {
    // Simple tube-style soft clipping
    const threshold = 0.8;
    const abs = Math.abs(sample);
    
    if (abs < threshold) {
      return sample;
    } else {
      const sign = sample < 0 ? -1 : 1;
      const excess = abs - threshold;
      const compressed = threshold + excess * 0.3;
      return sign * compressed;
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    // Update parameters
    if (parameters.ceiling) {
      this.ceiling = parameters.ceiling[0];
      this.ispThreshold = this.dbToLinear(this.ceiling);
    }
    if (parameters.lookahead) {
      const newLookahead = parameters.lookahead[0] / 1000;
      if (newLookahead !== this.lookahead) {
        this.lookahead = newLookahead;
        this.lookaheadSamples = Math.floor(this.lookahead * this.sampleRate);
      }
    }
    if (parameters.release) {
      this.release = parameters.release[0] / 1000;
    }

    // Check bypass
    const bypass = parameters.bypass ? parameters.bypass[0] > 0.5 : false;
    
    if (bypass) {
      for (let channel = 0; channel < input.length; channel++) {
        if (output[channel]) {
          output[channel].set(input[channel]);
        }
      }
      return true;
    }

    // Process each channel
    for (let channel = 0; channel < Math.min(input.length, output.length); channel++) {
      if (input[channel] && output[channel]) {
        // Detect true peaks with oversampling
        const truePeak = this.detectTruePeaks(input[channel]);
        
        // Apply limiting
        const limited = this.applyLimiting(input[channel], this.ceiling);
        output[channel].set(limited);
        
        // Update peak hold for meters
        if (truePeak > this.peakHold) {
          this.peakHold = truePeak;
          this.peakHoldTime = Math.floor(0.5 * this.sampleRate); // Hold for 500ms
        } else if (this.peakHoldTime > 0) {
          this.peakHoldTime--;
        } else {
          this.peakHold *= this.peakHoldDecay;
        }
      }
    }

    // Send metering info
    this.port.postMessage({
      type: 'meterData',
      data: {
        gainReduction: this.linearToDb(this.envelope),
        truePeak: this.linearToDb(this.peakHold),
        ceiling: this.ceiling,
        ispCount: this.ispCount
      }
    });

    return true;
  }
}

registerProcessor('limiter-processor', LimiterProcessor);