// meter-processor.js - Real-time audio metering with peak, RMS, correlation, and width

class MeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.updateRate = Math.floor(sampleRate / 50); // 50Hz updates
    
    const bufferSize = Math.floor(sampleRate * 0.1); // 100ms buffers
    
    this.state = {
      peakL: 0,
      peakR: 0,
      truePeakL: 0,
      truePeakR: 0,
      
      rmsBufferL: new Float32Array(bufferSize),
      rmsBufferR: new Float32Array(bufferSize),
      rmsIndex: 0,
      rmsSumL: 0,
      rmsSumR: 0,
      
      correlationBuffer: new Float32Array(bufferSize),
      correlationIndex: 0,
      correlationSum: 0,
      
      widthBufferM: new Float32Array(bufferSize),
      widthBufferS: new Float32Array(bufferSize), 
      widthIndex: 0,
      widthSumM: 0,
      widthSumS: 0,
      
      noiseBuffer: new Float32Array(bufferSize),
      noiseIndex: 0,
      
      tpStateL1: 0,
      tpStateL2: 0,
      tpStateR1: 0,
      tpStateR2: 0,
    };
    
    this.frameCount = 0;
  }
  
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2) return true;
    
    const leftChannel = input[0];
    const rightChannel = input[1];
    const blockSize = leftChannel.length;
    
    // Process each sample
    for (let i = 0; i < blockSize; i++) {
      const l = leftChannel[i];
      const r = rightChannel[i];
      
      // Update peaks
      this.state.peakL = Math.max(this.state.peakL, Math.abs(l));
      this.state.peakR = Math.max(this.state.peakR, Math.abs(r));
      
      // True-peak estimation
      const tpL = this.updateTruePeak(l, 'L');
      const tpR = this.updateTruePeak(r, 'R');
      this.state.truePeakL = Math.max(this.state.truePeakL, Math.abs(tpL));
      this.state.truePeakR = Math.max(this.state.truePeakR, Math.abs(tpR));
      
      // RMS calculation
      this.updateRMS(l, r);
      
      // Correlation calculation
      this.updateCorrelation(l, r);
      
      // Stereo width calculation
      this.updateWidth(l, r);
      
      // Noise floor estimation
      this.updateNoiseFloor(l, r);
    }
    
    // Pass through audio
    if (output.length >= 2) {
      output[0].set(leftChannel);
      output[1].set(rightChannel);
    }
    
    this.frameCount += blockSize;
    
    // Send metrics at 50Hz
    if (this.frameCount >= this.updateRate) {
      this.sendMetrics();
      this.frameCount = 0;
    }
    
    return true;
  }
  
  updateTruePeak(sample, channel) {
    const a = 0.15;
    const b = 1 - a;
    
    if (channel === 'L') {
      const filtered = a * sample + b * this.state.tpStateL1;
      this.state.tpStateL2 = this.state.tpStateL1;
      this.state.tpStateL1 = filtered;
      return (filtered + this.state.tpStateL2) * 0.5;
    } else {
      const filtered = a * sample + b * this.state.tpStateR1;
      this.state.tpStateR2 = this.state.tpStateR1;
      this.state.tpStateR1 = filtered;
      return (filtered + this.state.tpStateR2) * 0.5;
    }
  }
  
  updateRMS(l, r) {
    const bufferSize = this.state.rmsBufferL.length;
    
    // Remove old samples from sum
    this.state.rmsSumL -= this.state.rmsBufferL[this.state.rmsIndex];
    this.state.rmsSumR -= this.state.rmsBufferR[this.state.rmsIndex];
    
    // Add new samples
    const lSquared = l * l;
    const rSquared = r * r;
    this.state.rmsBufferL[this.state.rmsIndex] = lSquared;
    this.state.rmsBufferR[this.state.rmsIndex] = rSquared;
    this.state.rmsSumL += lSquared;
    this.state.rmsSumR += rSquared;
    
    this.state.rmsIndex = (this.state.rmsIndex + 1) % bufferSize;
  }
  
  updateCorrelation(l, r) {
    const bufferSize = this.state.correlationBuffer.length;
    
    // Remove old correlation product
    this.state.correlationSum -= this.state.correlationBuffer[this.state.correlationIndex];
    
    // Add new correlation product
    const product = l * r;
    this.state.correlationBuffer[this.state.correlationIndex] = product;
    this.state.correlationSum += product;
    
    this.state.correlationIndex = (this.state.correlationIndex + 1) % bufferSize;
  }
  
  updateWidth(l, r) {
    // Convert to M/S
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5;
    
    const bufferSize = this.state.widthBufferM.length;
    
    // Remove old M/S energy
    this.state.widthSumM -= this.state.widthBufferM[this.state.widthIndex];
    this.state.widthSumS -= this.state.widthBufferS[this.state.widthIndex];
    
    // Add new M/S energy
    const midSquared = mid * mid;
    const sideSquared = side * side;
    this.state.widthBufferM[this.state.widthIndex] = midSquared;
    this.state.widthBufferS[this.state.widthIndex] = sideSquared;
    this.state.widthSumM += midSquared;
    this.state.widthSumS += sideSquared;
    
    this.state.widthIndex = (this.state.widthIndex + 1) % bufferSize;
  }
  
  updateNoiseFloor(l, r) {
    // RMS of current sample pair
    const rms = Math.sqrt((l * l + r * r) * 0.5);
    
    // Add to circular buffer
    const bufferSize = this.state.noiseBuffer.length;
    this.state.noiseBuffer[this.state.noiseIndex] = rms;
    this.state.noiseIndex = (this.state.noiseIndex + 1) % bufferSize;
  }
  
  sendMetrics() {
    const bufferSize = this.state.rmsBufferL.length;
    
    // Calculate RMS
    const rmsL = Math.sqrt(Math.max(0, this.state.rmsSumL / bufferSize));
    const rmsR = Math.sqrt(Math.max(0, this.state.rmsSumR / bufferSize));
    const rms = Math.max(rmsL, rmsR);
    
    // Calculate peak
    const peak = Math.max(this.state.peakL, this.state.peakR);
    const truePeak = Math.max(this.state.truePeakL, this.state.truePeakR);
    
    // Calculate correlation
    const rmsProductSum = Math.sqrt(this.state.rmsSumL * this.state.rmsSumR);
    const correlation = rmsProductSum > 0 ? 
      Math.max(-1, Math.min(1, this.state.correlationSum / (bufferSize * rmsProductSum))) : 1;
    
    // Calculate stereo width (0-100%)
    const totalEnergy = this.state.widthSumM + this.state.widthSumS;
    const width = totalEnergy > 0 ? 
      Math.min(100, (this.state.widthSumS / totalEnergy) * 200) : 0;
    
    // Calculate noise floor (10th percentile)
    const noiseFloor = this.calculateNoiseFloor();
    
    // Convert to dB
    const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
    const truePeakDb = truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity;
    const noiseFloorDb = noiseFloor > 0 ? 20 * Math.log10(noiseFloor) : -Infinity;
    
    // Send metrics to main thread
    this.port.postMessage({
      peak: peakDb,
      rms: rmsDb,
      truePeak: truePeakDb,
      correlation,
      width,
      noiseFloor: noiseFloorDb,
    });
    
    // Reset peaks for next measurement
    this.state.peakL = 0;
    this.state.peakR = 0;
    this.state.truePeakL = 0;
    this.state.truePeakR = 0;
  }
  
  calculateNoiseFloor() {
    // Copy buffer and sort to find 10th percentile
    const sorted = Array.from(this.state.noiseBuffer).sort((a, b) => a - b);
    const p10Index = Math.floor(sorted.length * 0.1);
    return sorted[p10Index] || 0;
  }
}

registerProcessor('meter-processor', MeterProcessor);