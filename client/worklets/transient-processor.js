/**
 * Transient Processor - Attack/Sustain Shaper
 * Pre/post processing for transient enhancement
 */

class TransientProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.attackGain = 0;    // -10 to +10 dB
    this.sustainGain = 0;   // -10 to +10 dB
    
    // Analysis window size
    this.windowSize = 1024;
    this.hopSize = 256;
    
    // Circular buffers
    this.inputBuffer = new Float32Array(this.windowSize);
    this.bufferIndex = 0;
    
    // Envelope followers
    this.fastEnvelope = 0;
    this.slowEnvelope = 0;
    this.transientRatio = 0;
    
    // Filter coefficients for envelope detection
    this.fastAttack = Math.exp(-1 / (0.001 * this.sampleRate));  // 1ms
    this.fastRelease = Math.exp(-1 / (0.005 * this.sampleRate)); // 5ms
    this.slowAttack = Math.exp(-1 / (0.050 * this.sampleRate));  // 50ms
    this.slowRelease = Math.exp(-1 / (0.200 * this.sampleRate)); // 200ms
    
    // Delay compensation
    this.delayBuffer = new Float32Array(this.hopSize);
    this.delayIndex = 0;
    
    // Smoothing for gain changes
    this.currentAttackGain = 1;
    this.currentSustainGain = 1;
    this.gainSmoothingCoeff = Math.exp(-1 / (0.010 * this.sampleRate)); // 10ms
    
    // Handle parameter changes
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setAttack':
          this.attackGain = Math.max(-10, Math.min(10, data.attack));
          break;
        case 'setSustain':
          this.sustainGain = Math.max(-10, Math.min(10, data.sustain));
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'attack',
        defaultValue: 0,
        minValue: -10,
        maxValue: 10
      },
      {
        name: 'sustain',
        defaultValue: 0,
        minValue: -10,
        maxValue: 10
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

  // Detect transients using dual envelope followers
  detectTransient(sample) {
    const absSample = Math.abs(sample);
    
    // Fast envelope follower (captures transients)
    if (absSample > this.fastEnvelope) {
      this.fastEnvelope = absSample + (this.fastEnvelope - absSample) * this.fastAttack;
    } else {
      this.fastEnvelope = absSample + (this.fastEnvelope - absSample) * this.fastRelease;
    }
    
    // Slow envelope follower (captures sustain)
    if (absSample > this.slowEnvelope) {
      this.slowEnvelope = absSample + (this.slowEnvelope - absSample) * this.slowAttack;
    } else {
      this.slowEnvelope = absSample + (this.slowEnvelope - absSample) * this.slowRelease;
    }
    
    // Calculate transient ratio
    const minEnvelope = Math.max(this.slowEnvelope, 1e-10);
    this.transientRatio = Math.min(this.fastEnvelope / minEnvelope, 10);
    
    // Normalize ratio to 0-1 range for processing
    return Math.max(0, Math.min(1, (this.transientRatio - 1) / 3));
  }

  // Apply frequency-dependent transient shaping
  processSpectralTransients(samples) {
    // Simple spectral processing using overlap-add
    // In a full implementation, this would use FFT
    
    const processed = new Float32Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      // Store in circular buffer
      this.inputBuffer[this.bufferIndex] = samples[i];
      
      // Simple high-frequency emphasis for attack enhancement
      let attackComponent = 0;
      if (this.bufferIndex > 0) {
        // High-frequency difference (simple HPF approximation)
        attackComponent = samples[i] - this.inputBuffer[(this.bufferIndex - 1 + this.windowSize) % this.windowSize];
      }
      
      // Low-frequency component for sustain
      const sustainComponent = samples[i] - attackComponent;
      
      // Detect transient content
      const transientAmount = this.detectTransient(samples[i]);
      
      // Apply gain based on transient detection
      const attackGainLinear = this.dbToLinear(this.attackGain * transientAmount);
      const sustainGainLinear = this.dbToLinear(this.sustainGain * (1 - transientAmount * 0.5));
      
      // Smooth gain changes to avoid clicks
      this.currentAttackGain = attackGainLinear + (this.currentAttackGain - attackGainLinear) * this.gainSmoothingCoeff;
      this.currentSustainGain = sustainGainLinear + (this.currentSustainGain - sustainGainLinear) * this.gainSmoothingCoeff;
      
      // Combine processed components
      processed[i] = (attackComponent * this.currentAttackGain) + 
                     (sustainComponent * this.currentSustainGain);
      
      this.bufferIndex = (this.bufferIndex + 1) % this.windowSize;
    }
    
    return processed;
  }

  // Multi-band transient processing
  processMultiband(samples) {
    const processed = new Float32Array(samples.length);
    
    // Simple 3-band split using basic filters
    const lowCutoff = 250 / (this.sampleRate / 2);
    const highCutoff = 2500 / (this.sampleRate / 2);
    
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      
      // Detect transient for this sample
      const transientAmount = this.detectTransient(sample);
      
      // Different processing for different frequency content
      // In a real implementation, this would use proper crossover filters
      
      // Low band - less attack enhancement, more sustain control
      const lowGain = this.dbToLinear(this.attackGain * 0.3 * transientAmount + 
                                     this.sustainGain * 0.8);
      
      // Mid band - full processing
      const midGain = this.dbToLinear(this.attackGain * transientAmount + 
                                     this.sustainGain * (1 - transientAmount * 0.3));
      
      // High band - more attack enhancement
      const highGain = this.dbToLinear(this.attackGain * 1.5 * transientAmount + 
                                      this.sustainGain * 0.5);
      
      // Simple frequency weighting (approximation)
      const weightedGain = lowGain * 0.3 + midGain * 0.5 + highGain * 0.2;
      
      // Smooth the gain
      this.currentAttackGain = weightedGain + (this.currentAttackGain - weightedGain) * this.gainSmoothingCoeff;
      
      processed[i] = sample * this.currentAttackGain;
    }
    
    return processed;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    // Update parameters
    if (parameters.attack) {
      this.attackGain = parameters.attack[0];
    }
    if (parameters.sustain) {
      this.sustainGain = parameters.sustain[0];
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
        let processed;
        
        // Choose processing method based on gain settings
        if (Math.abs(this.attackGain) > 0.1 || Math.abs(this.sustainGain) > 0.1) {
          // Use multi-band processing for better results
          processed = this.processMultiband(input[channel]);
        } else {
          // Bypass processing if gains are minimal
          processed = input[channel];
        }
        
        output[channel].set(processed);
      }
    }

    // Send analysis data for visualization
    this.port.postMessage({
      type: 'transientData',
      data: {
        transientRatio: this.transientRatio,
        fastEnvelope: this.fastEnvelope,
        slowEnvelope: this.slowEnvelope,
        attackGain: this.currentAttackGain,
        sustainGain: this.currentSustainGain
      }
    });

    return true;
  }
}

registerProcessor('transient-processor', TransientProcessor);