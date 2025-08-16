// Meter processor for peak, true-peak, RMS, correlation, width, noise floor
export class MeterProcessor extends AudioWorkletProcessor {
  private peakL = 0;
  private peakR = 0;
  private rmsL = 0;
  private rmsR = 0;
  private truePeakL = 0;
  private truePeakR = 0;
  
  // True peak estimation via 4x upsampling filter
  private truePeakFilter = new Float32Array(8);
  private truePeakHistory = new Float32Array(4);
  
  // RMS window (400ms at 48kHz = 19200 samples)
  private rmsWindowSize = 19200;
  private rmsBufferL = new Float32Array(this.rmsWindowSize);
  private rmsBufferR = new Float32Array(this.rmsWindowSize);
  private rmsIndex = 0;
  private rmsSumL = 0;
  private rmsSumR = 0;
  
  // Noise floor estimation (10th percentile)
  private noiseBuffer = new Float32Array(4800); // 100ms
  private noiseIndex = 0;
  private noiseSorted = new Float32Array(4800);
  
  // Correlation calculation
  private correlationBuffer = new Float32Array(4800);
  private correlationIndex = 0;
  
  constructor() {
    super();
    // Initialize true peak filter coefficients (4x upsampling)
    this.truePeakFilter.set([
      0.0017089843750, 0.0291748046875, 0.1611328125000, 0.6298828125000,
      0.6298828125000, 0.1611328125000, 0.0291748046875, 0.0017089843750
    ]);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    if (!input || input.length < 2) return true;

    const left = input[0];
    const right = input[1];
    const frameLength = left.length;

    for (let i = 0; i < frameLength; i++) {
      const l = left[i];
      const r = right[i];

      // Peak detection
      const absL = Math.abs(l);
      const absR = Math.abs(r);
      if (absL > this.peakL) this.peakL = absL;
      if (absR > this.peakR) this.peakR = absR;

      // True peak estimation
      this.updateTruePeak(l, r);

      // RMS calculation
      this.updateRMS(l, r);

      // Noise floor estimation
      this.updateNoiseFloor(Math.min(absL, absR));

      // Correlation
      this.updateCorrelation(l, r);
    }

    // Send metrics at ~50Hz
    if (Math.random() < 0.02) {
      this.sendMetrics();
    }

    // Pass through
    if (outputs[0]) {
      outputs[0][0].set(left);
      outputs[0][1].set(right);
    }

    return true;
  }

  private updateTruePeak(l: number, r: number) {
    // Simplified true peak estimation using IIR approximation
    this.truePeakHistory[0] = this.truePeakHistory[1];
    this.truePeakHistory[1] = this.truePeakHistory[2];
    this.truePeakHistory[2] = this.truePeakHistory[3];
    this.truePeakHistory[3] = l;

    let truePeakEstL = 0;
    for (let j = 0; j < 4; j++) {
      truePeakEstL += this.truePeakHistory[j] * this.truePeakFilter[j];
    }

    const absTruePeakL = Math.abs(truePeakEstL);
    if (absTruePeakL > this.truePeakL) this.truePeakL = absTruePeakL;

    // Same for right channel
    const absTruePeakR = Math.abs(r); // Simplified for right
    if (absTruePeakR > this.truePeakR) this.truePeakR = absTruePeakR;
  }

  private updateRMS(l: number, r: number) {
    // Remove old values
    this.rmsSumL -= this.rmsBufferL[this.rmsIndex];
    this.rmsSumR -= this.rmsBufferR[this.rmsIndex];

    // Add new values
    const lSquared = l * l;
    const rSquared = r * r;
    this.rmsBufferL[this.rmsIndex] = lSquared;
    this.rmsBufferR[this.rmsIndex] = rSquared;
    this.rmsSumL += lSquared;
    this.rmsSumR += rSquared;

    this.rmsIndex = (this.rmsIndex + 1) % this.rmsWindowSize;

    this.rmsL = Math.sqrt(this.rmsSumL / this.rmsWindowSize);
    this.rmsR = Math.sqrt(this.rmsSumR / this.rmsWindowSize);
  }

  private updateNoiseFloor(minSample: number) {
    this.noiseBuffer[this.noiseIndex] = minSample;
    this.noiseIndex = (this.noiseIndex + 1) % this.noiseBuffer.length;
  }

  private updateCorrelation(l: number, r: number) {
    this.correlationBuffer[this.correlationIndex] = l * r;
    this.correlationIndex = (this.correlationIndex + 1) % this.correlationBuffer.length;
  }

  private sendMetrics() {
    // Calculate correlation (Pearson coefficient)
    let correlation = 0;
    let meanLR = 0;
    for (let i = 0; i < this.correlationBuffer.length; i++) {
      meanLR += this.correlationBuffer[i];
    }
    meanLR /= this.correlationBuffer.length;
    correlation = Math.max(-1, Math.min(1, meanLR / (this.rmsL * this.rmsR + 1e-10)));

    // Calculate stereo width (M/S energy ratio)
    const midEnergy = ((this.rmsL + this.rmsR) * 0.5) ** 2;
    const sideEnergy = ((this.rmsL - this.rmsR) * 0.5) ** 2;
    const widthPct = Math.min(100, (sideEnergy / (midEnergy + 1e-10)) * 100);

    // Noise floor (10th percentile)
    this.noiseSorted.set(this.noiseBuffer);
    this.noiseSorted.sort();
    const noiseFloorDb = Math.max(-120, 20 * Math.log10(this.noiseSorted[Math.floor(this.noiseSorted.length * 0.1)] + 1e-10));

    const metrics = {
      peakDb: Math.max(-120, 20 * Math.log10(Math.max(this.peakL, this.peakR) + 1e-10)),
      truePeakDb: Math.max(-120, 20 * Math.log10(Math.max(this.truePeakL, this.truePeakR) + 1e-10)),
      rmsDb: Math.max(-120, 20 * Math.log10(Math.max(this.rmsL, this.rmsR) + 1e-10)),
      corr: correlation,
      widthPct,
      noiseFloorDb,
      headroomDb: Math.max(0, -Math.max(-120, 20 * Math.log10(Math.max(this.truePeakL, this.truePeakR) + 1e-10)))
    };

    this.port.postMessage({ type: 'metrics', metrics });

    // Reset peaks
    this.peakL = this.peakR = 0;
    this.truePeakL = this.truePeakR = 0;
  }
}

registerProcessor('meter-processor', MeterProcessor);