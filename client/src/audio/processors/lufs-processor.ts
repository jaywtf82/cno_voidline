// LUFS processor implementing ITU-R BS.1770-4
export class LufsProcessor extends AudioWorkletProcessor {
  // K-weighting filter coefficients (pre-filter + RLB filter)
  private kWeightStage1 = {
    // High-shelf at ~1500Hz
    b: new Float32Array([1.53512485958697, -2.69169618940638, 1.19839281085285]),
    a: new Float32Array([1.0, -1.69065929318241, 0.73248077421585]),
    xL: new Float32Array(3),
    xR: new Float32Array(3),
    yL: new Float32Array(3),
    yR: new Float32Array(3)
  };

  private kWeightStage2 = {
    // High-pass at ~38Hz
    b: new Float32Array([1.0, -2.0, 1.0]),
    a: new Float32Array([1.0, -1.99004745483398, 0.99007225036621]),
    xL: new Float32Array(3),
    xR: new Float32Array(3),
    yL: new Float32Array(3),
    yR: new Float32Array(3)
  };

  // Momentary loudness (400ms blocks)
  private momentarySize = Math.floor(0.4 * 48000); // 400ms at 48kHz
  private momentaryBuffer = new Float32Array(this.momentarySize);
  private momentaryIndex = 0;
  private momentarySum = 0;

  // Short-term loudness (3s blocks)
  private shortTermSize = Math.floor(3.0 * 48000); // 3s at 48kHz
  private shortTermBuffer = new Float32Array(this.shortTermSize);
  private shortTermIndex = 0;
  private shortTermSum = 0;

  // Integrated loudness (with gating)
  private integratedBlocks: number[] = [];
  private blockDuration = 0.4; // 400ms blocks
  private blockSamples = this.momentarySize;

  // LRA calculation
  private lraBlocks: number[] = [];

  constructor() {
    super();
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    if (!input || input.length < 2) return true;

    const left = input[0];
    const right = input[1];
    const frameLength = left.length;

    for (let i = 0; i < frameLength; i++) {
      // Apply K-weighting filters
      const kLeft = this.applyKWeighting(left[i], 'L');
      const kRight = this.applyKWeighting(right[i], 'R');

      // Mean square (power)
      const meanSquare = (kLeft * kLeft + kRight * kRight) / 2.0;

      // Update momentary loudness
      this.updateMomentary(meanSquare);

      // Update short-term loudness
      this.updateShortTerm(meanSquare);
    }

    // Send LUFS measurements periodically
    if (Math.random() < 0.02) {
      this.sendLufs();
    }

    // Pass through
    if (outputs[0]) {
      outputs[0][0].set(left);
      outputs[0][1].set(right);
    }

    return true;
  }

  private applyKWeighting(sample: number, channel: 'L' | 'R'): number {
    const stage1 = channel === 'L' ? this.kWeightStage1 : this.kWeightStage1;
    const stage2 = channel === 'L' ? this.kWeightStage2 : this.kWeightStage2;
    const x1 = channel === 'L' ? stage1.xL : stage1.xR;
    const y1 = channel === 'L' ? stage1.yL : stage1.yR;
    const x2 = channel === 'L' ? stage2.xL : stage2.xR;
    const y2 = channel === 'L' ? stage2.yL : stage2.yR;

    // Stage 1: High-shelf
    x1[2] = x1[1];
    x1[1] = x1[0];
    x1[0] = sample;

    y1[2] = y1[1];
    y1[1] = y1[0];
    y1[0] = (stage1.b[0] * x1[0] + stage1.b[1] * x1[1] + stage1.b[2] * x1[2]
           - stage1.a[1] * y1[1] - stage1.a[2] * y1[2]);

    // Stage 2: High-pass
    x2[2] = x2[1];
    x2[1] = x2[0];
    x2[0] = y1[0];

    y2[2] = y2[1];
    y2[1] = y2[0];
    y2[0] = (stage2.b[0] * x2[0] + stage2.b[1] * x2[1] + stage2.b[2] * x2[2]
           - stage2.a[1] * y2[1] - stage2.a[2] * y2[2]);

    return y2[0];
  }

  private updateMomentary(meanSquare: number) {
    this.momentarySum -= this.momentaryBuffer[this.momentaryIndex];
    this.momentaryBuffer[this.momentaryIndex] = meanSquare;
    this.momentarySum += meanSquare;
    this.momentaryIndex = (this.momentaryIndex + 1) % this.momentarySize;
  }

  private updateShortTerm(meanSquare: number) {
    this.shortTermSum -= this.shortTermBuffer[this.shortTermIndex];
    this.shortTermBuffer[this.shortTermIndex] = meanSquare;
    this.shortTermSum += meanSquare;
    this.shortTermIndex = (this.shortTermIndex + 1) % this.shortTermSize;
  }

  private sendLufs() {
    // Momentary loudness (400ms)
    const momentaryMean = this.momentarySum / this.momentarySize;
    const lufsM = momentaryMean > 0 ? -0.691 + 10 * Math.log10(momentaryMean) : -70;

    // Short-term loudness (3s)
    const shortTermMean = this.shortTermSum / this.shortTermSize;
    const lufsS = shortTermMean > 0 ? -0.691 + 10 * Math.log10(shortTermMean) : -70;

    // Update integrated loudness blocks
    if (momentaryMean > 0) {
      this.integratedBlocks.push(momentaryMean);
      this.lraBlocks.push(lufsS);

      // Keep only recent blocks (10 minutes max)
      const maxBlocks = Math.floor(10 * 60 / this.blockDuration);
      if (this.integratedBlocks.length > maxBlocks) {
        this.integratedBlocks.shift();
        this.lraBlocks.shift();
      }
    }

    // Calculate integrated loudness with gating
    let lufsI = -70;
    let lra = 0;
    
    if (this.integratedBlocks.length > 0) {
      // Absolute gate at -70 LUFS
      const absoluteGatedBlocks = this.integratedBlocks.filter(block => {
        const blockLufs = -0.691 + 10 * Math.log10(block);
        return blockLufs > -70;
      });

      if (absoluteGatedBlocks.length > 0) {
        // Calculate mean
        const mean = absoluteGatedBlocks.reduce((sum, block) => sum + block, 0) / absoluteGatedBlocks.length;
        const relativeGate = mean * Math.pow(10, -10/10); // -10 LU relative gate

        // Relative gate
        const relativeGatedBlocks = absoluteGatedBlocks.filter(block => block >= relativeGate);

        if (relativeGatedBlocks.length > 0) {
          const finalMean = relativeGatedBlocks.reduce((sum, block) => sum + block, 0) / relativeGatedBlocks.length;
          lufsI = -0.691 + 10 * Math.log10(finalMean);
        }
      }

      // LRA calculation (10th to 95th percentile of short-term values)
      if (this.lraBlocks.length > 10) {
        const sortedLRA = [...this.lraBlocks].sort((a, b) => a - b);
        const p10 = sortedLRA[Math.floor(sortedLRA.length * 0.1)];
        const p95 = sortedLRA[Math.floor(sortedLRA.length * 0.95)];
        lra = Math.max(0, p95 - p10);
      }
    }

    this.port.postMessage({
      type: 'lufs',
      lufsI: Math.max(-70, Math.min(0, lufsI)),
      lufsS: Math.max(-70, Math.min(0, lufsS)),
      lra: Math.max(0, Math.min(50, lra))
    });
  }
}

registerProcessor('lufs-processor', LufsProcessor);