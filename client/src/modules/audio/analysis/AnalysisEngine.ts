import type { AnalysisResults } from "@shared/schema";

export class AnalysisEngine {
  private audioContext: AudioContext | OfflineAudioContext;
  private analyser: AnalyserNode;
  private scriptProcessor: ScriptProcessorNode | null = null;

  constructor(audioContext: AudioContext | OfflineAudioContext) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  async analyze(audioBuffer: AudioBuffer): Promise<AnalysisResults> {
    // Create offline context for analysis
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Get audio data for analysis
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 
      ? audioBuffer.getChannelData(1) 
      : leftChannel;

    // Perform analysis
    const lufs = this.calculateLUFS(leftChannel, rightChannel, audioBuffer.sampleRate);
    const dbtp = this.calculateTruePeak(leftChannel, rightChannel);
    const dbfs = this.calculateRMS(leftChannel, rightChannel);
    const lra = this.calculateLoudnessRange(leftChannel, rightChannel, audioBuffer.sampleRate);
    const correlation = this.calculateCorrelation(leftChannel, rightChannel);
    const spectrum = this.calculateSpectrum(leftChannel, audioBuffer.sampleRate);
    const peakFrequency = this.findPeakFrequency(spectrum, audioBuffer.sampleRate);
    const dynamicRange = this.calculateDynamicRange(leftChannel, rightChannel);
    const stereoWidth = this.calculateStereoWidth(leftChannel, rightChannel);
    const noiseFloor = this.calculateNoiseFloor(leftChannel, rightChannel);
    const voidlineScore = this.calculateVoidlineScore({
      lufs,
      dbtp,
      lra,
      correlation,
      dynamicRange,
      noiseFloor,
    });

    return {
      lufs,
      dbtp,
      dbfs,
      lra,
      correlation,
      spectrum,
      peakFrequency,
      dynamicRange,
      stereoWidth,
      noiseFloor,
      voidlineScore,
    };
  }

  private calculateLUFS(left: Float32Array, right: Float32Array, sampleRate: number): number {
    // Simplified LUFS calculation based on ITU-R BS.1770-4
    // Apply K-weighting filter (simplified version)
    const kWeightedLeft = this.applyKWeighting(left, sampleRate);
    const kWeightedRight = this.applyKWeighting(right, sampleRate);
    
    // Calculate mean square
    let sum = 0;
    for (let i = 0; i < kWeightedLeft.length; i++) {
      sum += kWeightedLeft[i] * kWeightedLeft[i] + kWeightedRight[i] * kWeightedRight[i];
    }
    
    const meanSquare = sum / (kWeightedLeft.length * 2);
    const loudness = -0.691 + 10 * Math.log10(meanSquare);
    
    return Math.max(-70, Math.min(0, loudness));
  }

  private applyKWeighting(signal: Float32Array, sampleRate: number): Float32Array {
    // Simplified K-weighting filter implementation
    // This is a basic approximation - real implementation would use proper filter coefficients
    const filtered = new Float32Array(signal.length);
    
    // Simple high-shelf filter approximation
    let prev = 0;
    const alpha = 0.1;
    
    for (let i = 0; i < signal.length; i++) {
      filtered[i] = signal[i] + alpha * (signal[i] - prev);
      prev = signal[i];
    }
    
    return filtered;
  }

  private calculateTruePeak(left: Float32Array, right: Float32Array): number {
    // True peak estimation using 4x oversampling
    const oversampledLeft = this.oversample(left, 4);
    const oversampledRight = this.oversample(right, 4);
    
    let maxPeak = 0;
    
    for (let i = 0; i < oversampledLeft.length; i++) {
      const peak = Math.max(Math.abs(oversampledLeft[i]), Math.abs(oversampledRight[i]));
      if (peak > maxPeak) {
        maxPeak = peak;
      }
    }
    
    return 20 * Math.log10(maxPeak);
  }

  private oversample(signal: Float32Array, factor: number): Float32Array {
    // Simple linear interpolation oversampling
    const oversampled = new Float32Array(signal.length * factor);
    
    for (let i = 0; i < signal.length - 1; i++) {
      for (let j = 0; j < factor; j++) {
        const t = j / factor;
        oversampled[i * factor + j] = signal[i] * (1 - t) + signal[i + 1] * t;
      }
    }
    
    return oversampled;
  }

  private calculateRMS(left: Float32Array, right: Float32Array): number {
    let sum = 0;
    const length = Math.min(left.length, right.length);
    
    for (let i = 0; i < length; i++) {
      sum += left[i] * left[i] + right[i] * right[i];
    }
    
    const rms = Math.sqrt(sum / (length * 2));
    return 20 * Math.log10(rms);
  }

  private calculateLoudnessRange(left: Float32Array, right: Float32Array, sampleRate: number): number {
    // Simplified LRA calculation
    const blockSize = Math.floor(sampleRate * 0.4); // 400ms blocks
    const blocks: number[] = [];
    
    for (let i = 0; i < left.length - blockSize; i += blockSize) {
      const blockLeft = left.slice(i, i + blockSize);
      const blockRight = right.slice(i, i + blockSize);
      const blockLUFS = this.calculateLUFS(blockLeft, blockRight, sampleRate);
      blocks.push(blockLUFS);
    }
    
    blocks.sort((a, b) => a - b);
    
    if (blocks.length < 2) return 0;
    
    const p10 = blocks[Math.floor(blocks.length * 0.1)];
    const p95 = blocks[Math.floor(blocks.length * 0.95)];
    
    return Math.max(0, p95 - p10);
  }

  private calculateCorrelation(left: Float32Array, right: Float32Array): number {
    const length = Math.min(left.length, right.length);
    
    // Calculate means
    let leftMean = 0, rightMean = 0;
    for (let i = 0; i < length; i++) {
      leftMean += left[i];
      rightMean += right[i];
    }
    leftMean /= length;
    rightMean /= length;
    
    // Calculate correlation coefficient
    let numerator = 0, leftVar = 0, rightVar = 0;
    
    for (let i = 0; i < length; i++) {
      const leftDiff = left[i] - leftMean;
      const rightDiff = right[i] - rightMean;
      
      numerator += leftDiff * rightDiff;
      leftVar += leftDiff * leftDiff;
      rightVar += rightDiff * rightDiff;
    }
    
    const denominator = Math.sqrt(leftVar * rightVar);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateSpectrum(signal: Float32Array, sampleRate: number): number[] {
    // Perform FFT analysis
    const fftSize = 1024;
    const spectrum: number[] = [];
    
    for (let i = 0; i < fftSize / 2; i++) {
      // Simple DFT implementation for demonstration
      let real = 0, imag = 0;
      
      for (let j = 0; j < Math.min(fftSize, signal.length); j++) {
        const angle = -2 * Math.PI * i * j / fftSize;
        real += signal[j] * Math.cos(angle);
        imag += signal[j] * Math.sin(angle);
      }
      
      const magnitude = Math.sqrt(real * real + imag * imag);
      spectrum.push(magnitude);
    }
    
    // Normalize
    const maxMag = Math.max(...spectrum);
    return spectrum.map(mag => mag / maxMag);
  }

  private findPeakFrequency(spectrum: number[], sampleRate: number): number {
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] > maxValue) {
        maxValue = spectrum[i];
        maxIndex = i;
      }
    }
    
    return (maxIndex * sampleRate) / (spectrum.length * 2);
  }

  private calculateDynamicRange(left: Float32Array, right: Float32Array): number {
    // Calculate crest factor
    let sum = 0, maxPeak = 0;
    const length = Math.min(left.length, right.length);
    
    for (let i = 0; i < length; i++) {
      const sample = Math.max(Math.abs(left[i]), Math.abs(right[i]));
      sum += sample * sample;
      if (sample > maxPeak) {
        maxPeak = sample;
      }
    }
    
    const rms = Math.sqrt(sum / length);
    const crestFactor = maxPeak / rms;
    
    return 20 * Math.log10(crestFactor);
  }

  private calculateStereoWidth(left: Float32Array, right: Float32Array): number {
    // Calculate stereo width based on mid/side analysis
    let midEnergy = 0, sideEnergy = 0;
    const length = Math.min(left.length, right.length);
    
    for (let i = 0; i < length; i++) {
      const mid = (left[i] + right[i]) / 2;
      const side = (left[i] - right[i]) / 2;
      
      midEnergy += mid * mid;
      sideEnergy += side * side;
    }
    
    const ratio = sideEnergy / (midEnergy + sideEnergy);
    return Math.min(1, Math.max(0, ratio * 2));
  }

  private calculateNoiseFloor(left: Float32Array, right: Float32Array): number {
    // Find the quietest 10% of samples
    const samples: number[] = [];
    const length = Math.min(left.length, right.length);
    
    for (let i = 0; i < length; i++) {
      const sample = Math.max(Math.abs(left[i]), Math.abs(right[i]));
      samples.push(sample);
    }
    
    samples.sort((a, b) => a - b);
    const noiseFloorSample = samples[Math.floor(samples.length * 0.1)];
    
    return 20 * Math.log10(noiseFloorSample + 1e-10); // Add small value to avoid log(0)
  }

  private calculateVoidlineScore(metrics: {
    lufs: number;
    dbtp: number;
    lra: number;
    correlation: number;
    dynamicRange: number;
    noiseFloor: number;
  }): number {
    // Proprietary Voidline scoring algorithm
    let score = 50; // Base score
    
    // LUFS target scoring (-14 LUFS target)
    const lufsDistance = Math.abs(metrics.lufs + 14);
    score += Math.max(0, 20 - lufsDistance * 2);
    
    // True peak headroom scoring
    const headroom = Math.abs(metrics.dbtp + 1);
    score += Math.max(0, 10 - headroom * 5);
    
    // Dynamic range scoring
    if (metrics.lra > 4 && metrics.lra < 12) {
      score += 15;
    } else {
      score -= Math.abs(metrics.lra - 8);
    }
    
    // Stereo correlation scoring
    if (metrics.correlation > 0.8) {
      score += 10;
    } else {
      score -= (0.8 - metrics.correlation) * 20;
    }
    
    // Noise floor scoring
    if (metrics.noiseFloor < -50) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getSpectrum(): Uint8Array {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  dispose(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    this.analyser.disconnect();
  }
}
