// lufs-processor.js - ITU-R BS.1770-4 compliant LUFS measurement

class LufsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.updateRate = Math.floor(sampleRate / 50);
    this.blockSize = Math.floor(sampleRate * 0.4); // 400ms
    
    const maxBlocks = Math.floor(sampleRate * 30 / this.blockSize); // 30 seconds max
    const shortTermBlocks = Math.ceil(3.0 / 0.4); // 3 seconds / 400ms
    const lraBlocks = Math.floor(sampleRate * 10 / this.blockSize); // 10 seconds for LRA
    
    this.state = {
      hp_z1_l: 0, hp_z1_r: 0,
      hp_z2_l: 0, hp_z2_r: 0,
      hf_z1_l: 0, hf_z1_r: 0,
      hf_z2_l: 0, hf_z2_r: 0,
      
      blockBuffer: new Float32Array(this.blockSize),
      blockIndex: 0,
      blockFull: false,
      
      loudnessBlocks: new Float32Array(maxBlocks),
      blockWriteIndex: 0,
      numBlocks: 0,
      
      shortTermBlocks: new Float32Array(shortTermBlocks),
      shortTermIndex: 0,
      shortTermFull: false,
      
      lraBlocks: new Float32Array(lraBlocks),
      lraIndex: 0,
      lraFull: false,
    };
    
    // K-weighting coefficients
    this.kWeightingCoeffs = {
      hp: {
        b0: 1.53512485958697,
        b1: -2.69169618940638,
        b2: 1.19839281085285,
        a1: -1.69065929318241,
        a2: 0.73248077421585,
      },
      hf: {
        b0: 1.0,
        b1: -2.0,
        b2: 1.0,
        a1: -1.99004745483398,
        a2: 0.99007225036621,
      }
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
    
    // Process each sample with K-weighting and accumulate
    for (let i = 0; i < blockSize; i++) {
      const l = leftChannel[i];
      const r = rightChannel[i];
      
      // Apply K-weighting filters
      const lWeighted = this.applyKWeighting(l, 'L');
      const rWeighted = this.applyKWeighting(r, 'R');
      
      // Mean square for this sample pair
      const meanSquare = (lWeighted * lWeighted + rWeighted * rWeighted) * 0.5;
      
      // Accumulate in 400ms block
      this.state.blockBuffer[this.state.blockIndex] = meanSquare;
      this.state.blockIndex++;
      
      // Check if 400ms block is complete
      if (this.state.blockIndex >= this.blockSize) {
        this.processBlock();
        this.state.blockIndex = 0;
      }
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
  
  applyKWeighting(sample, channel) {
    const { hp, hf } = this.kWeightingCoeffs;
    
    // Get channel-specific filter states
    const isLeft = channel === 'L';
    let hp_z1 = isLeft ? this.state.hp_z1_l : this.state.hp_z1_r;
    let hp_z2 = isLeft ? this.state.hp_z2_l : this.state.hp_z2_r;
    let hf_z1 = isLeft ? this.state.hf_z1_l : this.state.hf_z1_r;
    let hf_z2 = isLeft ? this.state.hf_z2_l : this.state.hf_z2_r;
    
    // High-pass filter (K1)
    const hp_out = hp.b0 * sample + hp.b1 * hp_z1 + hp.b2 * hp_z2;
    hp_z2 = hp_z1;
    hp_z1 = sample - hp.a1 * hp_z1 - hp.a2 * hp_z2;
    
    // High-frequency shelf (K2)
    const hf_out = hf.b0 * hp_out + hf.b1 * hf_z1 + hf.b2 * hf_z2;
    hf_z2 = hf_z1;
    hf_z1 = hp_out - hf.a1 * hf_z1 - hf.a2 * hf_z2;
    
    // Update states
    if (isLeft) {
      this.state.hp_z1_l = hp_z1;
      this.state.hp_z2_l = hp_z2;
      this.state.hf_z1_l = hf_z1;
      this.state.hf_z2_l = hf_z2;
    } else {
      this.state.hp_z1_r = hp_z1;
      this.state.hp_z2_r = hp_z2;
      this.state.hf_z1_r = hf_z1;
      this.state.hf_z2_r = hf_z2;
    }
    
    return hf_out;
  }
  
  processBlock() {
    // Calculate mean square for this 400ms block
    let blockSum = 0;
    for (let i = 0; i < this.blockSize; i++) {
      blockSum += this.state.blockBuffer[i];
    }
    
    const blockMeanSquare = blockSum / this.blockSize;
    
    // Convert to loudness units
    const blockLoudness = blockMeanSquare > 0 ? 
      -0.691 + 10 * Math.log10(blockMeanSquare) : -70;
    
    // Store block for integrated measurement (if above absolute gate)
    if (blockLoudness > -70) {
      if (this.state.numBlocks < this.state.loudnessBlocks.length) {
        this.state.loudnessBlocks[this.state.blockWriteIndex] = blockLoudness;
        this.state.blockWriteIndex = (this.state.blockWriteIndex + 1) % this.state.loudnessBlocks.length;
        this.state.numBlocks++;
      } else {
        // Overwrite oldest block
        this.state.loudnessBlocks[this.state.blockWriteIndex] = blockLoudness;
        this.state.blockWriteIndex = (this.state.blockWriteIndex + 1) % this.state.loudnessBlocks.length;
      }
    }
    
    // Store for short-term measurement
    this.state.shortTermBlocks[this.state.shortTermIndex] = blockLoudness;
    this.state.shortTermIndex = (this.state.shortTermIndex + 1) % this.state.shortTermBlocks.length;
    if (this.state.shortTermIndex === 0) {
      this.state.shortTermFull = true;
    }
    
    // Store for LRA calculation
    this.state.lraBlocks[this.state.lraIndex] = blockLoudness;
    this.state.lraIndex = (this.state.lraIndex + 1) % this.state.lraBlocks.length;
    if (this.state.lraIndex === 0) {
      this.state.lraFull = true;
    }
  }
  
  sendMetrics() {
    const lufsIntegrated = this.calculateIntegratedLoudness();
    const lufsShort = this.calculateShortTermLoudness();
    const lufsRange = this.calculateLRA();
    
    this.port.postMessage({
      lufsIntegrated,
      lufsShort,
      lufsRange,
    });
  }
  
  calculateIntegratedLoudness() {
    if (this.state.numBlocks === 0) return -70;
    
    // Get valid blocks (above absolute gate)
    const validBlocks = [];
    const count = Math.min(this.state.numBlocks, this.state.loudnessBlocks.length);
    
    for (let i = 0; i < count; i++) {
      const loudness = this.state.loudnessBlocks[i];
      if (loudness > -70) {
        validBlocks.push(loudness);
      }
    }
    
    if (validBlocks.length === 0) return -70;
    
    // Calculate relative gate
    const meanLoudness = validBlocks.reduce((sum, l) => sum + Math.pow(10, l / 10), 0) / validBlocks.length;
    const meanLoudnessDb = 10 * Math.log10(meanLoudness);
    const relativeGate = meanLoudnessDb - 10;
    
    // Apply relative gate
    const gatedBlocks = validBlocks.filter(l => l >= relativeGate);
    
    if (gatedBlocks.length === 0) return -70;
    
    const finalMean = gatedBlocks.reduce((sum, l) => sum + Math.pow(10, l / 10), 0) / gatedBlocks.length;
    return -0.691 + 10 * Math.log10(finalMean);
  }
  
  calculateShortTermLoudness() {
    if (!this.state.shortTermFull && this.state.shortTermIndex < 3) return -70;
    
    const blocksToUse = this.state.shortTermFull ? 
      this.state.shortTermBlocks.length : this.state.shortTermIndex;
    
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < blocksToUse; i++) {
      const loudness = this.state.shortTermBlocks[i];
      if (loudness > -70) {
        sum += Math.pow(10, loudness / 10);
        count++;
      }
    }
    
    return count > 0 ? -0.691 + 10 * Math.log10(sum / count) : -70;
  }
  
  calculateLRA() {
    if (!this.state.lraFull && this.state.lraIndex < 5) return 0;
    
    const validBlocks = [];
    const blocksToUse = this.state.lraFull ? 
      this.state.lraBlocks.length : this.state.lraIndex;
    
    for (let i = 0; i < blocksToUse; i++) {
      const loudness = this.state.lraBlocks[i];
      if (loudness > -70) {
        validBlocks.push(loudness);
      }
    }
    
    if (validBlocks.length < 2) return 0;
    
    validBlocks.sort((a, b) => a - b);
    
    const p10Index = Math.floor(validBlocks.length * 0.10);
    const p95Index = Math.floor(validBlocks.length * 0.95);
    
    const p10 = validBlocks[p10Index];
    const p95 = validBlocks[Math.min(p95Index, validBlocks.length - 1)];
    
    return Math.max(0, p95 - p10);
  }
}

registerProcessor('lufs-processor', LufsProcessor);