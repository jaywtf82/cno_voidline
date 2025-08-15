/**
 * Multiband Compressor Processor
 * 3-5 band compression with soft-knee, lookahead, M/S option
 */

class MultibandCompressorProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.numBands = 3;
    this.lookAheadSamples = Math.floor(0.005 * this.sampleRate); // 5ms default
    
    // Initialize compressor states for each band
    this.compressors = [];
    for (let i = 0; i < this.numBands; i++) {
      this.compressors.push({
        threshold: -20,
        ratio: 2,
        attack: 0.010,  // 10ms
        release: 0.100, // 100ms
        knee: 2,        // 2dB knee
        makeup: 0,      // dB
        envelope: 0,
        gain: 1
      });
    }
    
    // Lookahead delay buffers
    this.delayBuffers = [];
    for (let i = 0; i < this.numBands; i++) {
      this.delayBuffers.push({
        buffer: new Float32Array(this.lookAheadSamples),
        index: 0
      });
    }
    
    // Envelope detection
    this.envelopeBuffers = [];
    for (let i = 0; i < this.numBands; i++) {
      this.envelopeBuffers.push(new Float32Array(this.lookAheadSamples));
    }
    
    this.msMode = false;
    
    // Handle parameter changes
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setBandParams':
          if (data.band >= 0 && data.band < this.numBands) {
            const comp = this.compressors[data.band];
            if (data.threshold !== undefined) comp.threshold = data.threshold;
            if (data.ratio !== undefined) comp.ratio = data.ratio;
            if (data.attack !== undefined) comp.attack = data.attack / 1000; // ms to seconds
            if (data.release !== undefined) comp.release = data.release / 1000;
            if (data.knee !== undefined) comp.knee = data.knee;
            if (data.makeup !== undefined) comp.makeup = data.makeup;
          }
          break;
        case 'setMSMode':
          this.msMode = data.enabled;
          break;
        case 'setLookahead':
          this.setLookahead(data.ms);
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      // Band 0 (Low)
      { name: 'threshold0', defaultValue: -20, minValue: -40, maxValue: 0 },
      { name: 'ratio0', defaultValue: 2, minValue: 1, maxValue: 10 },
      { name: 'attack0', defaultValue: 10, minValue: 0.1, maxValue: 100 },
      { name: 'release0', defaultValue: 100, minValue: 10, maxValue: 500 },
      { name: 'makeup0', defaultValue: 0, minValue: -6, maxValue: 6 },
      
      // Band 1 (Mid)
      { name: 'threshold1', defaultValue: -18, minValue: -40, maxValue: 0 },
      { name: 'ratio1', defaultValue: 2.5, minValue: 1, maxValue: 10 },
      { name: 'attack1', defaultValue: 5, minValue: 0.1, maxValue: 100 },
      { name: 'release1', defaultValue: 50, minValue: 10, maxValue: 500 },
      { name: 'makeup1', defaultValue: 0, minValue: -6, maxValue: 6 },
      
      // Band 2 (High)
      { name: 'threshold2', defaultValue: -16, minValue: -40, maxValue: 0 },
      { name: 'ratio2', defaultValue: 2, minValue: 1, maxValue: 10 },
      { name: 'attack2', defaultValue: 3, minValue: 0.1, maxValue: 100 },
      { name: 'release2', defaultValue: 30, minValue: 10, maxValue: 500 },
      { name: 'makeup2', defaultValue: 0, minValue: -6, maxValue: 6 },
      
      // Global controls
      { name: 'bypass', defaultValue: 0, minValue: 0, maxValue: 1 }
    ];
  }

  setLookahead(ms) {
    const newSamples = Math.floor(ms / 1000 * this.sampleRate);
    this.lookAheadSamples = Math.max(0, Math.min(newSamples, this.sampleRate * 0.02)); // Max 20ms
    
    // Resize buffers
    for (let i = 0; i < this.numBands; i++) {
      this.delayBuffers[i].buffer = new Float32Array(this.lookAheadSamples);
      this.delayBuffers[i].index = 0;
      this.envelopeBuffers[i] = new Float32Array(this.lookAheadSamples);
    }
  }

  dbToLinear(db) {
    return Math.pow(10, db / 20);
  }

  linearToDb(linear) {
    return 20 * Math.log10(Math.max(linear, 1e-10));
  }

  processSoftKneeCompression(inputLevel, comp) {
    const { threshold, ratio, knee } = comp;
    
    if (inputLevel <= threshold - knee / 2) {
      return inputLevel; // Below knee, no compression
    } else if (inputLevel >= threshold + knee / 2) {
      // Above knee, full compression
      return threshold + (inputLevel - threshold) / ratio;
    } else {
      // Within knee range, smooth transition
      const kneeRatio = (inputLevel - threshold + knee / 2) / knee;
      const compressionAmount = kneeRatio * kneeRatio * (1 - 1 / ratio);
      return inputLevel - compressionAmount * (inputLevel - threshold);
    }
  }

  processCompressor(band, inputSamples, parameters) {
    const comp = this.compressors[band];
    const delayBuffer = this.delayBuffers[band];
    const envelopeBuffer = this.envelopeBuffers[band];
    const outputSamples = new Float32Array(inputSamples.length);
    
    // Update parameters from automation
    const paramPrefix = band.toString();
    if (parameters[`threshold${paramPrefix}`]) {
      comp.threshold = parameters[`threshold${paramPrefix}`][0];
    }
    if (parameters[`ratio${paramPrefix}`]) {
      comp.ratio = parameters[`ratio${paramPrefix}`][0];
    }
    if (parameters[`attack${paramPrefix}`]) {
      comp.attack = parameters[`attack${paramPrefix}`][0] / 1000;
    }
    if (parameters[`release${paramPrefix}`]) {
      comp.release = parameters[`release${paramPrefix}`][0] / 1000;
    }
    if (parameters[`makeup${paramPrefix}`]) {
      comp.makeup = parameters[`makeup${paramPrefix}`][0];
    }

    const attackCoeff = Math.exp(-1 / (comp.attack * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (comp.release * this.sampleRate));
    const makeupGain = this.dbToLinear(comp.makeup);

    for (let i = 0; i < inputSamples.length; i++) {
      const inputSample = inputSamples[i];
      
      // Store input in delay buffer
      delayBuffer.buffer[delayBuffer.index] = inputSample;
      
      // Calculate envelope for lookahead
      const inputLevel = this.linearToDb(Math.abs(inputSample));
      envelopeBuffer[delayBuffer.index] = inputLevel;
      
      // Find peak in lookahead window
      let peakLevel = -Infinity;
      for (let j = 0; j < this.lookAheadSamples; j++) {
        peakLevel = Math.max(peakLevel, envelopeBuffer[j]);
      }
      
      // Apply soft-knee compression to peak level
      const targetLevel = this.processSoftKneeCompression(peakLevel, comp);
      const gainReductionDb = targetLevel - peakLevel;
      const targetGain = this.dbToLinear(gainReductionDb);
      
      // Smooth envelope following
      const envelope = comp.envelope;
      if (targetGain < envelope) {
        comp.envelope = targetGain + (envelope - targetGain) * attackCoeff;
      } else {
        comp.envelope = targetGain + (envelope - targetGain) * releaseCoeff;
      }
      
      // Get delayed sample and apply compression + makeup
      const delayedSample = delayBuffer.buffer[delayBuffer.index];
      outputSamples[i] = delayedSample * comp.envelope * makeupGain;
      
      // Advance delay buffer index
      delayBuffer.index = (delayBuffer.index + 1) % this.lookAheadSamples;
    }
    
    return outputSamples;
  }

  convertToMS(left, right) {
    const mid = new Float32Array(left.length);
    const side = new Float32Array(left.length);
    
    for (let i = 0; i < left.length; i++) {
      mid[i] = (left[i] + right[i]) * 0.5;
      side[i] = (left[i] - right[i]) * 0.5;
    }
    
    return { mid, side };
  }

  convertFromMS(mid, side) {
    const left = new Float32Array(mid.length);
    const right = new Float32Array(mid.length);
    
    for (let i = 0; i < mid.length; i++) {
      left[i] = mid[i] + side[i];
      right[i] = mid[i] - side[i];
    }
    
    return { left, right };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    // Check bypass
    const bypass = parameters.bypass ? parameters.bypass[0] > 0.5 : false;
    
    if (bypass) {
      // Copy input to output
      for (let channel = 0; channel < input.length; channel++) {
        if (output[channel]) {
          output[channel].set(input[channel]);
        }
      }
      return true;
    }

    // Assume 3-band processing with inputs from crossover:
    // input[0] = low band, input[1] = mid band, input[2] = high band
    
    for (let band = 0; band < Math.min(this.numBands, input.length); band++) {
      if (input[band] && output[band]) {
        const processedSamples = this.processCompressor(band, input[band], parameters);
        output[band].set(processedSamples);
      }
    }

    // Send gain reduction info for metering
    this.port.postMessage({
      type: 'gainReduction',
      data: {
        band0: this.linearToDb(this.compressors[0].envelope),
        band1: this.linearToDb(this.compressors[1].envelope),
        band2: this.linearToDb(this.compressors[2].envelope)
      }
    });

    return true;
  }
}

registerProcessor('mbcomp-processor', MultibandCompressorProcessor);