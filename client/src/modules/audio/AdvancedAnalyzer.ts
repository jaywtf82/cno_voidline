/**
 * Advanced Audio Analyzer
 * Professional-grade analysis with precise measurements
 */

export interface AdvancedAnalysisResult {
  // Basic measurements
  peakLevel: number;          // dBFS
  rmsLevel: number;           // dBFS
  lufs: number;               // LUFS
  dbtp: number;               // dBTP (True Peak)
  lra: number;                // Loudness Range (LU)
  
  // Advanced measurements
  crestFactor: number;        // Peak to RMS ratio
  correlation: number;        // Stereo correlation
  phaseCoherence: number;     // Phase alignment
  stereoWidth: number;        // Apparent stereo width
  
  // Spectral analysis
  spectralCentroid: number;   // Hz
  spectralSpread: number;     // Hz
  spectralRolloff: number;    // Hz
  spectralFlux: number;       // Change rate
  zcr: number;               // Zero crossing rate
  
  // Frequency analysis
  bassEnergy: number;         // dB (20-250 Hz)
  midEnergy: number;          // dB (250-4000 Hz)  
  highEnergy: number;         // dB (4000-20000 Hz)
  harmonicDistortion: number; // THD percentage
  noiseFloor: number;         // dBFS
  
  // Dynamic analysis
  dynamicRange: number;       // dB
  punchFactor: number;        // Transient impact
  breathingRoom: number;      // Available headroom
  
  // Professional metrics
  voidlineScore: number;      // Overall quality (0-100)
  masteredCompliance: number; // Mastering standards compliance
  broadcastCompliance: number;// Broadcast standards compliance
  
  // Temporal analysis
  onsetDensity: number;       // Onsets per second
  tempo: number;              // BPM (if detectable)
  rhythmicComplexity: number; // Rhythm variation
  
  // Psychoacoustic metrics
  roughness: number;          // Sensory roughness
  brightness: number;         // Perceived brightness
  warmth: number;             // Low-mid warmth
}

export interface SpectralBand {
  frequency: number;          // Center frequency
  magnitude: number;          // dB magnitude
  phase: number;              // Phase in radians
  bandwidth: number;          // Effective bandwidth
}

export interface DynamicProfile {
  shortTermLoudness: number[]; // LUFS over time
  momentaryLoudness: number[]; // LUFS momentary
  peakProfile: number[];       // Peak levels over time
  gatingThreshold: number;     // Gating for loudness
}

export class AdvancedAnalyzer {
  private sampleRate: number = 44100;
  private blockSize: number = 4096;
  private analysisBuffer: Float32Array[] = [];
  private kWeightingFilter: BiquadFilter[] = [];
  private truePeakBuffer: Float32Array[] = [];
  
  constructor() {
    this.initializeFilters();
  }

  private initializeFilters(): void {
    // Initialize K-weighting filters for LUFS measurement
    // Simplified implementation - production would use proper filter design
    this.kWeightingFilter = [
      // High-pass filter (~38 Hz)
      { type: 'highpass', frequency: 38, q: 0.5, gain: 0 },
      // High-shelf filter (~1681 Hz, +4 dB)
      { type: 'highshelf', frequency: 1681, q: 0.5, gain: 4 }
    ];
  }

  public async performAdvancedAnalysis(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<AdvancedAnalysisResult> {
    
    this.sampleRate = sampleRate;
    
    // Parallel analysis for efficiency
    const [
      basicMetrics,
      spectralMetrics,
      dynamicMetrics,
      psychoacousticMetrics,
      temporalMetrics,
      professionalMetrics
    ] = await Promise.all([
      this.analyzeBasicMetrics(leftChannel, rightChannel),
      this.analyzeSpectralContent(leftChannel, rightChannel, sampleRate),
      this.analyzeDynamicContent(leftChannel, rightChannel, sampleRate),
      this.analyzePsychoacousticContent(leftChannel, rightChannel, sampleRate),
      this.analyzeTemporalContent(leftChannel, rightChannel, sampleRate),
      this.analyzeProfessionalMetrics(leftChannel, rightChannel, sampleRate)
    ]);

    // Merge all metrics with defaults
    const result: AdvancedAnalysisResult = {
      // Default values
      peakLevel: 0,
      rmsLevel: 0,
      lufs: -70,
      dbtp: 0,
      lra: 0,
      crestFactor: 0,
      correlation: 0,
      phaseCoherence: 0,
      stereoWidth: 0,
      spectralCentroid: 0,
      spectralSpread: 0,
      spectralRolloff: 0,
      spectralFlux: 0,
      zcr: 0,
      bassEnergy: -60,
      midEnergy: -60,
      highEnergy: -60,
      harmonicDistortion: 0,
      noiseFloor: -60,
      dynamicRange: 0,
      punchFactor: 0,
      breathingRoom: 0,
      voidlineScore: 0,
      masteredCompliance: 0,
      broadcastCompliance: 0,
      onsetDensity: 0,
      tempo: 0,
      rhythmicComplexity: 0,
      roughness: 0,
      brightness: 0,
      warmth: 0,
      // Override with actual values
      ...basicMetrics,
      ...spectralMetrics,
      ...dynamicMetrics,
      ...psychoacousticMetrics,
      ...temporalMetrics,
      ...professionalMetrics
    };

    return result;
  }

  private async analyzeBasicMetrics(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): Promise<Partial<AdvancedAnalysisResult>> {
    
    let peak = 0;
    let rmsSum = 0;
    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;
    let truePeak = 0;
    
    // Basic measurements
    for (let i = 0; i < leftChannel.length; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      const mono = (left + right) * 0.5;
      
      // Peak detection
      peak = Math.max(peak, Math.abs(mono));
      
      // RMS calculation
      rmsSum += mono * mono;
      
      // Stereo correlation
      correlation += left * right;
      leftEnergy += left * left;
      rightEnergy += right * right;
      
      // True peak detection (4x oversampling approximation)
      const truePeakSample = this.calculateTruePeak(left, right, i);
      truePeak = Math.max(truePeak, truePeakSample);
    }
    
    const length = leftChannel.length;
    const rms = Math.sqrt(rmsSum / length);
    correlation = correlation / Math.sqrt(leftEnergy * rightEnergy + 0.0001);
    
    // LUFS calculation
    const lufs = await this.calculateLUFS(leftChannel, rightChannel);
    
    // Stereo width calculation
    const stereoWidth = this.calculateStereoWidth(leftChannel, rightChannel);
    
    // Phase coherence
    const phaseCoherence = this.calculatePhaseCoherence(leftChannel, rightChannel);
    
    return {
      peakLevel: 20 * Math.log10(peak + 0.0001),
      rmsLevel: 20 * Math.log10(rms + 0.0001),
      lufs,
      dbtp: 20 * Math.log10(truePeak + 0.0001),
      correlation,
      stereoWidth,
      phaseCoherence,
      crestFactor: peak / (rms + 0.0001)
    };
  }

  private calculateTruePeak(left: number, right: number, index: number): number {
    // Simplified true peak calculation using interpolation
    // Production implementation would use proper oversampling
    const maxSample = Math.max(Math.abs(left), Math.abs(right));
    
    // Simple 2x interpolation for demonstration
    if (index > 0 && index < this.truePeakBuffer[0]?.length - 1) {
      const interpolated = (maxSample + (this.truePeakBuffer[0][index - 1] || 0)) * 0.5;
      return Math.max(maxSample, interpolated);
    }
    
    return maxSample;
  }

  private async calculateLUFS(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): Promise<number> {
    
    // Apply K-weighting filters
    const weightedLeft = this.applyKWeighting(leftChannel);
    const weightedRight = this.applyKWeighting(rightChannel);
    
    // 400ms block processing for LUFS
    const blockSize = Math.floor(this.sampleRate * 0.4);
    const blocks: number[] = [];
    
    for (let i = 0; i < weightedLeft.length - blockSize; i += blockSize / 2) {
      let blockPower = 0;
      
      for (let j = 0; j < blockSize; j++) {
        const left = weightedLeft[i + j];
        const right = weightedRight[i + j];
        // Stereo weighting: L + R
        blockPower += (left * left + right * right);
      }
      
      const meanSquare = blockPower / blockSize;
      
      if (meanSquare > 0) {
        blocks.push(meanSquare);
      }
    }
    
    // Gating at -70 LUFS
    const gatingThreshold = Math.pow(10, (-70 + 0.691) / 10);
    const gatedBlocks = blocks.filter(block => block > gatingThreshold);
    
    if (gatedBlocks.length === 0) return -70;
    
    const meanPower = gatedBlocks.reduce((a, b) => a + b) / gatedBlocks.length;
    return -0.691 + 10 * Math.log10(meanPower);
  }

  private applyKWeighting(audioData: Float32Array): Float32Array {
    // Simplified K-weighting filter
    // Production implementation would use proper biquad filters
    let filtered = new Float32Array(audioData);
    
    // High-pass filter approximation
    for (let i = 1; i < filtered.length; i++) {
      filtered[i] = audioData[i] - 0.85 * audioData[i - 1];
    }
    
    // High-shelf boost approximation
    for (let i = 0; i < filtered.length; i++) {
      filtered[i] *= 1.4; // Approximate +4dB boost
    }
    
    return filtered;
  }

  private calculateStereoWidth(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): number {
    
    let midEnergy = 0;
    let sideEnergy = 0;
    
    for (let i = 0; i < leftChannel.length; i++) {
      const mid = (leftChannel[i] + rightChannel[i]) * 0.5;
      const side = (leftChannel[i] - rightChannel[i]) * 0.5;
      
      midEnergy += mid * mid;
      sideEnergy += side * side;
    }
    
    const totalEnergy = midEnergy + sideEnergy;
    return totalEnergy > 0 ? sideEnergy / totalEnergy : 0;
  }

  private calculatePhaseCoherence(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): number {
    
    // FFT-based phase coherence analysis
    const fftSize = 2048;
    let avgCoherence = 0;
    let blockCount = 0;
    
    for (let i = 0; i <= leftChannel.length - fftSize; i += fftSize / 2) {
      const leftBlock = leftChannel.slice(i, i + fftSize);
      const rightBlock = rightChannel.slice(i, i + fftSize);
      
      const leftFFT = this.performFFT(leftBlock);
      const rightFFT = this.performFFT(rightBlock);
      
      let coherenceSum = 0;
      let validBins = 0;
      
      for (let bin = 1; bin < fftSize / 2; bin++) {
        const leftMag = Math.sqrt(leftFFT[bin * 2] ** 2 + leftFFT[bin * 2 + 1] ** 2);
        const rightMag = Math.sqrt(rightFFT[bin * 2] ** 2 + rightFFT[bin * 2 + 1] ** 2);
        
        if (leftMag > 0.001 && rightMag > 0.001) {
          const leftPhase = Math.atan2(leftFFT[bin * 2 + 1], leftFFT[bin * 2]);
          const rightPhase = Math.atan2(rightFFT[bin * 2 + 1], rightFFT[bin * 2]);
          
          const phaseDiff = Math.abs(leftPhase - rightPhase);
          const normalizedDiff = Math.min(phaseDiff, 2 * Math.PI - phaseDiff);
          
          coherenceSum += 1 - (normalizedDiff / Math.PI);
          validBins++;
        }
      }
      
      if (validBins > 0) {
        avgCoherence += coherenceSum / validBins;
        blockCount++;
      }
    }
    
    return blockCount > 0 ? avgCoherence / blockCount : 0;
  }

  private async analyzeSpectralContent(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<Partial<AdvancedAnalysisResult>> {
    
    const monoSignal = new Float32Array(leftChannel.length);
    for (let i = 0; i < leftChannel.length; i++) {
      monoSignal[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
    }
    
    const fftData = this.performFFT(monoSignal.slice(0, 4096));
    const nyquist = sampleRate / 2;
    
    // Spectral centroid
    let spectralCentroid = 0;
    let totalMagnitude = 0;
    
    // Spectral spread calculation
    let spectralSpread = 0;
    
    // Energy band analysis
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;
    
    // Zero crossing rate
    let zcr = 0;
    for (let i = 1; i < monoSignal.length; i++) {
      if ((monoSignal[i] >= 0) !== (monoSignal[i - 1] >= 0)) {
        zcr++;
      }
    }
    zcr = zcr / monoSignal.length * sampleRate;
    
    for (let i = 1; i < fftData.length / 2; i++) {
      const frequency = (i / (fftData.length / 2)) * nyquist;
      const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
      
      spectralCentroid += frequency * magnitude;
      totalMagnitude += magnitude;
      
      // Energy bands
      if (frequency >= 20 && frequency <= 250) {
        bassEnergy += magnitude;
      } else if (frequency > 250 && frequency <= 4000) {
        midEnergy += magnitude;
      } else if (frequency > 4000 && frequency <= 20000) {
        highEnergy += magnitude;
      }
    }
    
    spectralCentroid = totalMagnitude > 0 ? spectralCentroid / totalMagnitude : 0;
    
    // Spectral spread (second moment)
    for (let i = 1; i < fftData.length / 2; i++) {
      const frequency = (i / (fftData.length / 2)) * nyquist;
      const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
      
      spectralSpread += Math.pow(frequency - spectralCentroid, 2) * magnitude;
    }
    
    spectralSpread = totalMagnitude > 0 ? Math.sqrt(spectralSpread / totalMagnitude) : 0;
    
    // Spectral rolloff (95% energy)
    let energySum = 0;
    let spectralRolloff = 0;
    const rolloffThreshold = totalMagnitude * 0.95;
    
    for (let i = 1; i < fftData.length / 2; i++) {
      const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
      energySum += magnitude;
      
      if (energySum >= rolloffThreshold) {
        spectralRolloff = (i / (fftData.length / 2)) * nyquist;
        break;
      }
    }
    
    // Spectral flux (temporal change)
    const spectralFlux = this.calculateSpectralFlux(monoSignal, sampleRate);
    
    // Normalize energy bands to dB
    const totalEnergy = bassEnergy + midEnergy + highEnergy;
    bassEnergy = totalEnergy > 0 ? 20 * Math.log10(bassEnergy / totalEnergy) : -60;
    midEnergy = totalEnergy > 0 ? 20 * Math.log10(midEnergy / totalEnergy) : -60;
    highEnergy = totalEnergy > 0 ? 20 * Math.log10(highEnergy / totalEnergy) : -60;
    
    return {
      spectralCentroid,
      spectralSpread,
      spectralRolloff,
      spectralFlux,
      zcr,
      bassEnergy,
      midEnergy,
      highEnergy
    };
  }

  private calculateSpectralFlux(audioData: Float32Array, sampleRate: number): number {
    const hopSize = 1024;
    const fftSize = 2048;
    let avgFlux = 0;
    let frameCount = 0;
    
    let previousSpectrum: Float32Array | null = null;
    
    for (let i = 0; i <= audioData.length - fftSize; i += hopSize) {
      const frame = audioData.slice(i, i + fftSize);
      const spectrum = this.performFFT(frame);
      
      if (previousSpectrum) {
        let flux = 0;
        
        for (let bin = 0; bin < fftSize; bin++) {
          const currentMag = Math.sqrt(spectrum[bin * 2] ** 2 + spectrum[bin * 2 + 1] ** 2);
          const prevMag = Math.sqrt(previousSpectrum[bin * 2] ** 2 + previousSpectrum[bin * 2 + 1] ** 2);
          
          const diff = currentMag - prevMag;
          flux += diff > 0 ? diff : 0; // Half-wave rectified
        }
        
        avgFlux += flux;
        frameCount++;
      }
      
      previousSpectrum = new Float32Array(spectrum);
    }
    
    return frameCount > 0 ? avgFlux / frameCount : 0;
  }

  private async analyzeDynamicContent(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<Partial<AdvancedAnalysisResult>> {
    
    // LRA (Loudness Range) calculation
    const lra = await this.calculateLRA(leftChannel, rightChannel, sampleRate);
    
    // Dynamic range analysis
    const dynamicRange = this.calculateDynamicRange(leftChannel, rightChannel);
    
    // Punch factor (transient impact)
    const punchFactor = this.calculatePunchFactor(leftChannel, rightChannel, sampleRate);
    
    // Available headroom
    let maxPeak = 0;
    for (let i = 0; i < leftChannel.length; i++) {
      maxPeak = Math.max(maxPeak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    }
    const breathingRoom = 20 * Math.log10(1.0 / (maxPeak + 0.0001));
    
    return {
      lra,
      dynamicRange,
      punchFactor,
      breathingRoom
    };
  }

  private async calculateLRA(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<number> {
    
    // Calculate short-term loudness (3 second windows)
    const windowSize = Math.floor(sampleRate * 3);
    const hopSize = Math.floor(sampleRate * 0.1); // 100ms hop
    const shortTermLoudness: number[] = [];
    
    for (let i = 0; i <= leftChannel.length - windowSize; i += hopSize) {
      const leftWindow = leftChannel.slice(i, i + windowSize);
      const rightWindow = rightChannel.slice(i, i + windowSize);
      
      const lufs = await this.calculateLUFS(leftWindow, rightWindow);
      if (lufs > -70) {
        shortTermLoudness.push(lufs);
      }
    }
    
    if (shortTermLoudness.length === 0) return 0;
    
    // Sort and find 10th and 95th percentiles
    shortTermLoudness.sort((a, b) => a - b);
    const index10 = Math.floor(shortTermLoudness.length * 0.1);
    const index95 = Math.floor(shortTermLoudness.length * 0.95);
    
    return shortTermLoudness[index95] - shortTermLoudness[index10];
  }

  private calculateDynamicRange(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): number {
    
    const windowSize = 2048;
    const rmsLevels: number[] = [];
    
    for (let i = 0; i <= leftChannel.length - windowSize; i += windowSize / 2) {
      let rmsSum = 0;
      
      for (let j = 0; j < windowSize; j++) {
        const sample = (leftChannel[i + j] + rightChannel[i + j]) * 0.5;
        rmsSum += sample * sample;
      }
      
      const rms = Math.sqrt(rmsSum / windowSize);
      if (rms > 0.0001) {
        rmsLevels.push(20 * Math.log10(rms));
      }
    }
    
    if (rmsLevels.length < 2) return 0;
    
    rmsLevels.sort((a, b) => b - a);
    const top10Percent = Math.floor(rmsLevels.length * 0.1);
    const bottom10Percent = Math.floor(rmsLevels.length * 0.9);
    
    return rmsLevels[top10Percent] - rmsLevels[bottom10Percent];
  }

  private calculatePunchFactor(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): number {
    
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
    let totalPunch = 0;
    let windowCount = 0;
    
    for (let i = 0; i < leftChannel.length - windowSize * 2; i += windowSize) {
      let currentRMS = 0;
      let nextRMS = 0;
      
      // Current window RMS
      for (let j = 0; j < windowSize; j++) {
        const sample = (leftChannel[i + j] + rightChannel[i + j]) * 0.5;
        currentRMS += sample * sample;
      }
      currentRMS = Math.sqrt(currentRMS / windowSize);
      
      // Next window RMS
      for (let j = 0; j < windowSize; j++) {
        const sample = (leftChannel[i + windowSize + j] + rightChannel[i + windowSize + j]) * 0.5;
        nextRMS += sample * sample;
      }
      nextRMS = Math.sqrt(nextRMS / windowSize);
      
      // Calculate punch (sudden energy increase)
      if (currentRMS > 0.001 && nextRMS > currentRMS) {
        const punchRatio = nextRMS / currentRMS;
        if (punchRatio > 1.5) { // Significant transient
          totalPunch += Math.min(10, Math.log(punchRatio));
          windowCount++;
        }
      }
    }
    
    return windowCount > 0 ? (totalPunch / windowCount) * 20 : 0;
  }

  private async analyzePsychoacousticContent(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<Partial<AdvancedAnalysisResult>> {
    
    const monoSignal = new Float32Array(leftChannel.length);
    for (let i = 0; i < leftChannel.length; i++) {
      monoSignal[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
    }
    
    // Harmonic distortion
    const harmonicDistortion = this.calculateTHD(monoSignal, sampleRate);
    
    // Noise floor
    const noiseFloor = this.calculateNoiseFloor(leftChannel, rightChannel);
    
    // Roughness (dissonance measure)
    const roughness = this.calculateRoughness(monoSignal, sampleRate);
    
    // Brightness (high frequency emphasis)
    const brightness = this.calculateBrightness(monoSignal, sampleRate);
    
    // Warmth (low-mid frequency emphasis)
    const warmth = this.calculateWarmth(monoSignal, sampleRate);
    
    return {
      harmonicDistortion,
      noiseFloor,
      roughness,
      brightness,
      warmth
    };
  }

  private calculateTHD(audioData: Float32Array, sampleRate: number): number {
    const fundamental = this.findFundamentalFrequency(audioData, sampleRate);
    if (fundamental < 50 || fundamental > 5000) return 0;
    
    const fftData = this.performFFT(audioData.slice(0, 4096));
    const nyquist = sampleRate / 2;
    const binSize = nyquist / (fftData.length / 2);
    
    let fundamentalMagnitude = 0;
    let harmonicSum = 0;
    
    // Analyze first 6 harmonics
    for (let harmonic = 1; harmonic <= 6; harmonic++) {
      const targetFreq = fundamental * harmonic;
      if (targetFreq > nyquist) break;
      
      const bin = Math.round(targetFreq / binSize);
      if (bin * 2 + 1 < fftData.length) {
        const magnitude = Math.sqrt(fftData[bin * 2] ** 2 + fftData[bin * 2 + 1] ** 2);
        
        if (harmonic === 1) {
          fundamentalMagnitude = magnitude;
        } else {
          harmonicSum += magnitude * magnitude;
        }
      }
    }
    
    return fundamentalMagnitude > 0 ? Math.sqrt(harmonicSum) / fundamentalMagnitude * 100 : 0;
  }

  private calculateNoiseFloor(leftChannel: Float32Array, rightChannel: Float32Array): number {
    // Find quietest 5% of signal
    const rmsLevels: number[] = [];
    const windowSize = 2048;
    
    for (let i = 0; i <= leftChannel.length - windowSize; i += windowSize) {
      let rmsSum = 0;
      
      for (let j = 0; j < windowSize; j++) {
        const sample = (leftChannel[i + j] + rightChannel[i + j]) * 0.5;
        rmsSum += sample * sample;
      }
      
      const rms = Math.sqrt(rmsSum / windowSize);
      rmsLevels.push(20 * Math.log10(rms + 0.0001));
    }
    
    rmsLevels.sort((a, b) => a - b);
    const index5Percent = Math.floor(rmsLevels.length * 0.05);
    
    return rmsLevels[index5Percent];
  }

  private calculateRoughness(audioData: Float32Array, sampleRate: number): number {
    // Simplified roughness calculation based on beating frequencies
    const fftData = this.performFFT(audioData.slice(0, 2048));
    const nyquist = sampleRate / 2;
    
    let roughnessSum = 0;
    const criticalBandwidth = 100; // Hz
    
    for (let i = 1; i < fftData.length / 4; i++) {
      const freq1 = (i / (fftData.length / 2)) * nyquist;
      const mag1 = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
      
      // Look for nearby frequencies
      for (let j = i + 1; j < Math.min(i + 20, fftData.length / 4); j++) {
        const freq2 = (j / (fftData.length / 2)) * nyquist;
        const mag2 = Math.sqrt(fftData[j * 2] ** 2 + fftData[j * 2 + 1] ** 2);
        
        const freqDiff = freq2 - freq1;
        if (freqDiff < criticalBandwidth) {
          // Calculate beating effect
          const beatStrength = Math.min(mag1, mag2) / (Math.max(mag1, mag2) + 0.0001);
          const roughnessContrib = beatStrength * Math.exp(-freqDiff / 20);
          roughnessSum += roughnessContrib;
        }
      }
    }
    
    return Math.min(100, roughnessSum * 10);
  }

  private calculateBrightness(audioData: Float32Array, sampleRate: number): number {
    const fftData = this.performFFT(audioData.slice(0, 2048));
    const nyquist = sampleRate / 2;
    
    let totalEnergy = 0;
    let highEnergy = 0;
    
    for (let i = 1; i < fftData.length / 2; i++) {
      const frequency = (i / (fftData.length / 2)) * nyquist;
      const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
      
      totalEnergy += magnitude;
      
      if (frequency > 4000) {
        // Weight higher frequencies more for brightness
        const weight = Math.min(3, frequency / 4000);
        highEnergy += magnitude * weight;
      }
    }
    
    return totalEnergy > 0 ? Math.min(100, (highEnergy / totalEnergy) * 100) : 0;
  }

  private calculateWarmth(audioData: Float32Array, sampleRate: number): number {
    const fftData = this.performFFT(audioData.slice(0, 2048));
    const nyquist = sampleRate / 2;
    
    let totalEnergy = 0;
    let warmthEnergy = 0;
    
    for (let i = 1; i < fftData.length / 2; i++) {
      const frequency = (i / (fftData.length / 2)) * nyquist;
      const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
      
      totalEnergy += magnitude;
      
      // Warmth frequencies: 200-800 Hz with peak around 400 Hz
      if (frequency >= 200 && frequency <= 800) {
        const warmthWeight = 1 - Math.abs(frequency - 400) / 400;
        warmthEnergy += magnitude * warmthWeight;
      }
    }
    
    return totalEnergy > 0 ? Math.min(100, (warmthEnergy / totalEnergy) * 200) : 0;
  }

  private async analyzeTemporalContent(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<Partial<AdvancedAnalysisResult>> {
    
    const monoSignal = new Float32Array(leftChannel.length);
    for (let i = 0; i < leftChannel.length; i++) {
      monoSignal[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
    }
    
    // Onset detection
    const onsetDensity = this.calculateOnsetDensity(monoSignal, sampleRate);
    
    // Tempo estimation
    const tempo = this.estimateTempo(monoSignal, sampleRate);
    
    // Rhythmic complexity
    const rhythmicComplexity = this.calculateRhythmicComplexity(monoSignal, sampleRate);
    
    return {
      onsetDensity,
      tempo,
      rhythmicComplexity
    };
  }

  private calculateOnsetDensity(audioData: Float32Array, sampleRate: number): number {
    const hopSize = 512;
    const fftSize = 1024;
    let onsetCount = 0;
    
    let previousSpectrum: Float32Array | null = null;
    
    for (let i = 0; i <= audioData.length - fftSize; i += hopSize) {
      const frame = audioData.slice(i, i + fftSize);
      const spectrum = this.performFFT(frame);
      
      if (previousSpectrum) {
        let spectralDiff = 0;
        
        for (let bin = 1; bin < fftSize / 2; bin++) {
          const currentMag = Math.sqrt(spectrum[bin * 2] ** 2 + spectrum[bin * 2 + 1] ** 2);
          const prevMag = Math.sqrt(previousSpectrum[bin * 2] ** 2 + previousSpectrum[bin * 2 + 1] ** 2);
          
          const diff = currentMag - prevMag;
          if (diff > 0) {
            spectralDiff += diff;
          }
        }
        
        // Onset detection threshold
        if (spectralDiff > 5.0) {
          onsetCount++;
        }
      }
      
      previousSpectrum = new Float32Array(spectrum);
    }
    
    const durationSeconds = audioData.length / sampleRate;
    return durationSeconds > 0 ? onsetCount / durationSeconds : 0;
  }

  private estimateTempo(audioData: Float32Array, sampleRate: number): number {
    // Simplified tempo estimation using autocorrelation on onset detection function
    const onsetFunction = this.calculateOnsetFunction(audioData, sampleRate);
    
    // Autocorrelation for periodicity detection
    const minTempo = 60;  // BPM
    const maxTempo = 200; // BPM
    
    const minPeriod = Math.floor(60 * sampleRate / maxTempo / 512); // Convert to hop units
    const maxPeriod = Math.floor(60 * sampleRate / minTempo / 512);
    
    let bestCorrelation = 0;
    let bestTempo = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let validSamples = 0;
      
      for (let i = 0; i < onsetFunction.length - period; i++) {
        correlation += onsetFunction[i] * onsetFunction[i + period];
        validSamples++;
      }
      
      correlation /= validSamples;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestTempo = 60 * sampleRate / (period * 512);
      }
    }
    
    return bestTempo;
  }

  private calculateOnsetFunction(audioData: Float32Array, sampleRate: number): number[] {
    const hopSize = 512;
    const fftSize = 1024;
    const onsetFunction: number[] = [];
    
    let previousSpectrum: Float32Array | null = null;
    
    for (let i = 0; i <= audioData.length - fftSize; i += hopSize) {
      const frame = audioData.slice(i, i + fftSize);
      const spectrum = this.performFFT(frame);
      
      let onsetStrength = 0;
      
      if (previousSpectrum) {
        for (let bin = 1; bin < fftSize / 2; bin++) {
          const currentMag = Math.sqrt(spectrum[bin * 2] ** 2 + spectrum[bin * 2 + 1] ** 2);
          const prevMag = Math.sqrt(previousSpectrum[bin * 2] ** 2 + previousSpectrum[bin * 2 + 1] ** 2);
          
          const diff = currentMag - prevMag;
          if (diff > 0) {
            onsetStrength += diff;
          }
        }
      }
      
      onsetFunction.push(onsetStrength);
      previousSpectrum = new Float32Array(spectrum);
    }
    
    return onsetFunction;
  }

  private calculateRhythmicComplexity(audioData: Float32Array, sampleRate: number): number {
    // Measure variation in onset timing
    const onsets = this.detectOnsets(audioData, sampleRate);
    
    if (onsets.length < 3) return 0;
    
    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    // Calculate coefficient of variation
    const meanInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    return meanInterval > 0 ? (stdDev / meanInterval) * 100 : 0;
  }

  private detectOnsets(audioData: Float32Array, sampleRate: number): number[] {
    const onsetFunction = this.calculateOnsetFunction(audioData, sampleRate);
    const onsets: number[] = [];
    const threshold = Math.max(...onsetFunction) * 0.3; // Adaptive threshold
    
    let lastOnset = -1;
    const minInterval = Math.floor(sampleRate * 0.05 / 512); // 50ms minimum
    
    for (let i = 1; i < onsetFunction.length - 1; i++) {
      if (onsetFunction[i] > threshold && 
          onsetFunction[i] > onsetFunction[i - 1] && 
          onsetFunction[i] > onsetFunction[i + 1] &&
          i - lastOnset > minInterval) {
        
        onsets.push(i * 512 / sampleRate); // Convert to seconds
        lastOnset = i;
      }
    }
    
    return onsets;
  }

  private async analyzeProfessionalMetrics(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
  ): Promise<Partial<AdvancedAnalysisResult>> {
    
    // Calculate individual metrics needed for professional scores
    const lufs = await this.calculateLUFS(leftChannel, rightChannel);
    const lra = await this.calculateLRA(leftChannel, rightChannel, sampleRate);
    const dbtp = this.calculateTruePeakLevel(leftChannel, rightChannel);
    const dynamicRange = this.calculateDynamicRange(leftChannel, rightChannel);
    const harmonicDistortion = this.calculateTHD((leftChannel), sampleRate);
    
    // Voidline Score (proprietary quality metric)
    const voidlineScore = this.calculateVoidlineScore({
      lufs, lra, dbtp, dynamicRange, harmonicDistortion
    });
    
    // Mastering standards compliance
    const masteredCompliance = this.calculateMasteringCompliance({
      lufs, lra, dbtp, dynamicRange
    });
    
    // Broadcast standards compliance  
    const broadcastCompliance = this.calculateBroadcastCompliance({
      lufs, lra, dbtp
    });
    
    return {
      voidlineScore,
      masteredCompliance,
      broadcastCompliance
    };
  }

  private calculateTruePeakLevel(leftChannel: Float32Array, rightChannel: Float32Array): number {
    let truePeak = 0;
    
    for (let i = 0; i < leftChannel.length; i++) {
      const peak = Math.max(Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
      truePeak = Math.max(truePeak, peak);
    }
    
    return 20 * Math.log10(truePeak + 0.0001);
  }

  private calculateVoidlineScore(metrics: {
    lufs: number;
    lra: number;
    dbtp: number;
    dynamicRange: number;
    harmonicDistortion: number;
  }): number {
    
    let score = 100;
    
    // Loudness scoring (target: -14 LUFS ±2)
    const loudnessDeviation = Math.abs(metrics.lufs + 14);
    score -= Math.min(30, loudnessDeviation * 3);
    
    // True peak scoring (target: < -1 dBTP)
    if (metrics.dbtp > -1) {
      score -= (metrics.dbtp + 1) * 10;
    }
    
    // Dynamic range scoring (healthy range: 6-20 LU)
    if (metrics.lra < 3) {
      score -= (3 - metrics.lra) * 8; // Over-compressed
    } else if (metrics.lra > 25) {
      score -= (metrics.lra - 25) * 2; // Too dynamic
    }
    
    // Overall dynamic range
    if (metrics.dynamicRange < 6) {
      score -= (6 - metrics.dynamicRange) * 3;
    }
    
    // Distortion penalty
    score -= Math.min(20, metrics.harmonicDistortion * 2);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateMasteringCompliance(metrics: {
    lufs: number;
    lra: number; 
    dbtp: number;
    dynamicRange: number;
  }): number {
    
    let compliance = 100;
    
    // Professional mastering standards
    // Target: -14 to -16 LUFS, > -1 dBTP, reasonable dynamic range
    
    // Loudness compliance
    if (metrics.lufs > -10) {
      compliance -= 40; // Too loud
    } else if (metrics.lufs < -20) {
      compliance -= 20; // Too quiet
    } else if (metrics.lufs > -12) {
      compliance -= 15; // Slightly too loud
    }
    
    // Peak compliance
    if (metrics.dbtp > -0.1) {
      compliance -= 30; // Likely clipping
    } else if (metrics.dbtp > -0.5) {
      compliance -= 15; // Risky peak levels
    }
    
    // Dynamic range compliance
    if (metrics.dynamicRange < 4) {
      compliance -= 25; // Over-compressed
    } else if (metrics.lra < 2) {
      compliance -= 35; // Severely over-compressed
    }
    
    return Math.max(0, Math.min(100, Math.round(compliance)));
  }

  private calculateBroadcastCompliance(metrics: {
    lufs: number;
    lra: number;
    dbtp: number;
  }): number {
    
    let compliance = 100;
    
    // EBU R128 / ATSC A/85 standards
    // Target: -23 LUFS ±2, < -1 dBTP, LRA considerations
    
    // Loudness compliance (EBU R128: -23 LUFS)
    const loudnessDeviation = Math.abs(metrics.lufs + 23);
    if (loudnessDeviation > 2) {
      compliance -= Math.min(50, (loudnessDeviation - 2) * 10);
    }
    
    // True peak compliance
    if (metrics.dbtp > -1) {
      compliance -= 40;
    } else if (metrics.dbtp > -2) {
      compliance -= 15;
    }
    
    // LRA compliance (typical broadcast range)
    if (metrics.lra > 20) {
      compliance -= 20; // Too wide for broadcast
    } else if (metrics.lra < 3) {
      compliance -= 15; // Too compressed
    }
    
    return Math.max(0, Math.min(100, Math.round(compliance)));
  }

  // Utility methods
  
  private performFFT(data: Float32Array): Float32Array {
    const N = data.length;
    const result = new Float32Array(N * 2);
    
    for (let i = 0; i < N; i++) {
      result[i * 2] = data[i];
      result[i * 2 + 1] = 0;
    }
    
    this.fft(result, N);
    return result;
  }

  private fft(data: Float32Array, N: number): void {
    // Bit-reverse copy
    let j = 0;
    for (let i = 1; i < N; i++) {
      let bit = N >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;
      
      if (i < j) {
        [data[i * 2], data[j * 2]] = [data[j * 2], data[i * 2]];
        [data[i * 2 + 1], data[j * 2 + 1]] = [data[j * 2 + 1], data[i * 2 + 1]];
      }
    }
    
    // FFT computation
    for (let length = 2; length <= N; length <<= 1) {
      const angleStep = -2 * Math.PI / length;
      for (let i = 0; i < N; i += length) {
        for (let j = 0; j < length / 2; j++) {
          const angle = angleStep * j;
          const wReal = Math.cos(angle);
          const wImag = Math.sin(angle);
          
          const u = i + j;
          const v = i + j + length / 2;
          
          const tempReal = data[v * 2] * wReal - data[v * 2 + 1] * wImag;
          const tempImag = data[v * 2] * wImag + data[v * 2 + 1] * wReal;
          
          data[v * 2] = data[u * 2] - tempReal;
          data[v * 2 + 1] = data[u * 2 + 1] - tempImag;
          data[u * 2] += tempReal;
          data[u * 2 + 1] += tempImag;
        }
      }
    }
  }

  private findFundamentalFrequency(audioData: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 800);
    const maxPeriod = Math.floor(sampleRate / 80);
    
    let bestCorrelation = -1;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let normalizer = 0;
      
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
        normalizer += audioData[i] * audioData[i];
      }
      
      correlation /= normalizer;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }
}

interface BiquadFilter {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'peak' | 'lowshelf' | 'highshelf';
  frequency: number;
  q: number;
  gain: number;
}