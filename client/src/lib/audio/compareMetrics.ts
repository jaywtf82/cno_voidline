/**
 * Compare Metrics - Analysis for A/B overlay visualization
 * Hardness (PSR/crest), peaks, ISP markers
 */

export interface ComparisonMetrics {
  hardness: {
    psr: number;        // Peak to Short-term Ratio
    crest: number;      // Crest Factor
    hardnessIndex: number; // Combined hardness metric 0-100
  };
  peaks: {
    samplePeaks: number[];    // Sample peak locations
    truePeaks: number[];      // True peak locations (oversampled)
    clipCount: number;        // Number of clipped samples
    ispMarkers: number[];     // Inter-sample peak markers
  };
  dynamics: {
    lufsS: number[];          // Short-term LUFS over time
    lra: number;              // Loudness Range
    dynamicComplexity: number; // Dynamic variation metric
  };
  spectral: {
    spectralCentroid: number; // Brightness indicator
    spectralSpread: number;   // Frequency distribution
    harshness: number;        // High-frequency content metric
    mudiness: number;         // Low-mid frequency buildup
  };
}

export class CompareMetrics {
  private sampleRate: number;
  private blockSize: number;
  
  constructor(sampleRate: number = 44100, blockSize: number = 1024) {
    this.sampleRate = sampleRate;
    this.blockSize = blockSize;
  }

  /**
   * Analyze audio buffer and generate comparison metrics
   */
  async analyzeBuffer(
    audioBuffer: AudioBuffer,
    windowSizeMs: number = 3000 // 3 second windows for short-term analysis
  ): Promise<ComparisonMetrics> {
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 ? 
      audioBuffer.getChannelData(1) : leftChannel;
    
    console.log('Analyzing buffer for comparison metrics...');
    
    // Calculate windowed analysis
    const windowSamples = Math.floor(windowSizeMs / 1000 * this.sampleRate);
    const numWindows = Math.floor(audioBuffer.length / windowSamples);
    
    // Hardness analysis
    const hardness = this.analyzeHardness(leftChannel, rightChannel);
    
    // Peak detection
    const peaks = this.detectPeaks(leftChannel, rightChannel);
    
    // Dynamic analysis
    const dynamics = await this.analyzeDynamics(leftChannel, rightChannel, windowSamples);
    
    // Spectral analysis
    const spectral = this.analyzeSpectral(leftChannel, rightChannel);
    
    return {
      hardness,
      peaks,
      dynamics,
      spectral
    };
  }

  /**
   * Analyze hardness characteristics (PSR, crest factor)
   */
  private analyzeHardness(leftChannel: Float32Array, rightChannel: Float32Array) {
    console.log('Analyzing hardness metrics...');
    
    // Calculate RMS in 400ms windows (momentary)
    const windowSize = Math.floor(0.4 * this.sampleRate); // 400ms
    const hopSize = Math.floor(windowSize / 4); // 75% overlap
    
    let totalPSR = 0;
    let totalCrest = 0;
    let windowCount = 0;
    
    for (let start = 0; start < leftChannel.length - windowSize; start += hopSize) {
      const end = start + windowSize;
      
      // Calculate RMS for this window
      let sumSquares = 0;
      let peak = 0;
      
      for (let i = start; i < end; i++) {
        const sample = (leftChannel[i] + rightChannel[i]) / 2; // Mono sum
        const abs = Math.abs(sample);
        
        sumSquares += sample * sample;
        if (abs > peak) peak = abs;
      }
      
      const rms = Math.sqrt(sumSquares / windowSize);
      
      if (rms > 1e-10 && peak > 1e-10) {
        // Peak to RMS ratio (crest factor)
        const crest = peak / rms;
        totalCrest += crest;
        
        // PSR calculation (peak to short-term loudness approximation)
        const lufsApprox = -0.691 + 10 * Math.log10(sumSquares / windowSize); // Simplified LUFS
        const peakDb = 20 * Math.log10(peak);
        const psr = peakDb - lufsApprox;
        totalPSR += psr;
        
        windowCount++;
      }
    }
    
    const avgPSR = windowCount > 0 ? totalPSR / windowCount : 0;
    const avgCrest = windowCount > 0 ? totalCrest / windowCount : 0;
    
    // Hardness index (0-100 scale)
    // High PSR and low crest = hard/compressed sound
    const hardnessIndex = Math.max(0, Math.min(100, 
      (avgPSR - 5) * 3 + (15 - avgCrest) * 2
    ));
    
    console.log(`Hardness analysis complete: PSR=${avgPSR.toFixed(2)}dB, Crest=${avgCrest.toFixed(2)}, Index=${hardnessIndex.toFixed(1)}`);
    
    return {
      psr: avgPSR,
      crest: avgCrest,
      hardnessIndex
    };
  }

  /**
   * Detect peaks and ISP markers
   */
  private detectPeaks(leftChannel: Float32Array, rightChannel: Float32Array) {
    console.log('Detecting peaks and ISP markers...');
    
    const samplePeaks: number[] = [];
    const truePeaks: number[] = [];
    const ispMarkers: number[] = [];
    let clipCount = 0;
    
    const clipThreshold = 0.99; // -0.1dBFS
    const peakThreshold = 0.8;  // -2dBFS
    
    // Sample peak detection
    for (let i = 1; i < leftChannel.length - 1; i++) {
      const leftSample = Math.abs(leftChannel[i]);
      const rightSample = Math.abs(rightChannel[i]);
      const maxSample = Math.max(leftSample, rightSample);
      
      // Check for clipping
      if (maxSample >= clipThreshold) {
        clipCount++;
        if (i % 100 === 0) { // Thin out clip markers
          ispMarkers.push(i);
        }
      }
      
      // Peak detection (local maxima)
      if (maxSample > peakThreshold) {
        const prevMax = Math.max(Math.abs(leftChannel[i-1]), Math.abs(rightChannel[i-1]));
        const nextMax = Math.max(Math.abs(leftChannel[i+1]), Math.abs(rightChannel[i+1]));
        
        if (maxSample > prevMax && maxSample > nextMax) {
          samplePeaks.push(i);
        }
      }
    }
    
    // True peak detection with 4x oversampling (simplified)
    const oversampleFactor = 4;
    for (let i = 0; i < leftChannel.length - 1; i += oversampleFactor) {
      const end = Math.min(i + oversampleFactor, leftChannel.length - 1);
      
      // Linear interpolation for oversampling
      for (let j = 0; j < oversampleFactor && i + j < end; j++) {
        const t = j / oversampleFactor;
        const leftInterp = leftChannel[i] * (1 - t) + leftChannel[i + 1] * t;
        const rightInterp = rightChannel[i] * (1 - t) + rightChannel[i + 1] * t;
        const maxInterp = Math.max(Math.abs(leftInterp), Math.abs(rightInterp));
        
        if (maxInterp > clipThreshold) {
          truePeaks.push(i + j / oversampleFactor);
        }
      }
    }
    
    console.log(`Peak detection complete: ${samplePeaks.length} sample peaks, ${truePeaks.length} true peaks, ${clipCount} clips`);
    
    return {
      samplePeaks,
      truePeaks,
      clipCount,
      ispMarkers
    };
  }

  /**
   * Analyze dynamic characteristics
   */
  private async analyzeDynamics(
    leftChannel: Float32Array, 
    rightChannel: Float32Array,
    windowSamples: number
  ) {
    console.log('Analyzing dynamics...');
    
    const lufsS: number[] = [];
    let minLufs = 0;
    let maxLufs = -100;
    
    // Short-term LUFS calculation (3 second windows)
    for (let start = 0; start < leftChannel.length - windowSamples; start += windowSamples / 4) {
      const end = start + windowSamples;
      
      // K-weighted power calculation (simplified)
      let sumSquares = 0;
      for (let i = start; i < end; i++) {
        const mono = (leftChannel[i] + rightChannel[i]) / 2;
        sumSquares += mono * mono;
      }
      
      const meanSquare = sumSquares / windowSamples;
      const lufs = -0.691 + 10 * Math.log10(Math.max(meanSquare, 1e-10));
      
      lufsS.push(lufs);
      if (lufs > maxLufs) maxLufs = lufs;
      if (lufs < minLufs && lufs > -100) minLufs = lufs;
    }
    
    // Loudness Range (LRA) - difference between 95th and 10th percentile
    const sortedLufs = [...lufsS].sort((a, b) => a - b);
    const p10 = sortedLufs[Math.floor(sortedLufs.length * 0.1)];
    const p95 = sortedLufs[Math.floor(sortedLufs.length * 0.95)];
    const lra = p95 - p10;
    
    // Dynamic complexity - standard deviation of short-term LUFS
    const meanLufs = lufsS.reduce((sum, val) => sum + val, 0) / lufsS.length;
    const variance = lufsS.reduce((sum, val) => sum + Math.pow(val - meanLufs, 2), 0) / lufsS.length;
    const dynamicComplexity = Math.sqrt(variance);
    
    console.log(`Dynamics analysis complete: LRA=${lra.toFixed(2)}LU, Complexity=${dynamicComplexity.toFixed(2)}`);
    
    return {
      lufsS,
      lra,
      dynamicComplexity
    };
  }

  /**
   * Analyze spectral characteristics
   */
  private analyzeSpectral(leftChannel: Float32Array, rightChannel: Float32Array) {
    console.log('Analyzing spectral characteristics...');
    
    // Simple spectral analysis using energy distribution
    const fftSize = 2048;
    const numBins = fftSize / 2;
    const binWidth = this.sampleRate / fftSize;
    
    let totalEnergy = 0;
    let weightedFreqSum = 0;
    let highFreqEnergy = 0;
    let lowMidEnergy = 0;
    
    // Process overlapping windows
    const hopSize = fftSize / 4;
    let windowCount = 0;
    
    for (let start = 0; start < leftChannel.length - fftSize; start += hopSize) {
      // Simple energy-based spectral analysis (no actual FFT for simplicity)
      let bassEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;
      
      // Divide frequency range into bands
      const bassEnd = Math.floor(250 / binWidth);
      const midEnd = Math.floor(4000 / binWidth);
      
      for (let i = start; i < start + fftSize; i++) {
        const sample = (leftChannel[i] + rightChannel[i]) / 2;
        const energy = sample * sample;
        totalEnergy += energy;
        
        // Frequency weighting (approximation)
        const binIndex = Math.floor((i - start) / fftSize * numBins);
        const freq = binIndex * binWidth;
        
        if (freq < 250) {
          bassEnergy += energy;
        } else if (freq < 4000) {
          midEnergy += energy;
          weightedFreqSum += freq * energy;
        } else {
          highEnergy += energy;
          highFreqEnergy += energy;
        }
        
        if (freq >= 200 && freq <= 800) {
          lowMidEnergy += energy;
        }
      }
      
      windowCount++;
    }
    
    // Calculate metrics
    const spectralCentroid = totalEnergy > 0 ? weightedFreqSum / totalEnergy : 1000;
    const spectralSpread = 2000; // Simplified - would need proper calculation
    const harshness = Math.min(100, (highFreqEnergy / totalEnergy) * 1000);
    const mudiness = Math.min(100, (lowMidEnergy / totalEnergy) * 500);
    
    console.log(`Spectral analysis complete: Centroid=${spectralCentroid.toFixed(0)}Hz, Harshness=${harshness.toFixed(1)}, Mudiness=${mudiness.toFixed(1)}`);
    
    return {
      spectralCentroid,
      spectralSpread,
      harshness,
      mudiness
    };
  }

  /**
   * Generate overlay data for waveform visualization
   */
  generateOverlayData(
    metrics: ComparisonMetrics,
    audioLength: number,
    displayWidth: number
  ): {
    peakMarkers: { x: number, type: 'sample' | 'true' | 'isp' }[];
    hardnessOverlay: { x: number, intensity: number }[];
    dynamicOverlay: { x: number, lufs: number }[];
  } {
    const peakMarkers = [];
    const hardnessOverlay = [];
    const dynamicOverlay = [];
    
    // Convert sample positions to display coordinates
    const sampleToX = (sample: number) => (sample / audioLength) * displayWidth;
    
    // Peak markers
    metrics.peaks.samplePeaks.forEach(sample => {
      peakMarkers.push({ x: sampleToX(sample), type: 'sample' as const });
    });
    
    metrics.peaks.truePeaks.forEach(sample => {
      peakMarkers.push({ x: sampleToX(sample), type: 'true' as const });
    });
    
    metrics.peaks.ispMarkers.forEach(sample => {
      peakMarkers.push({ x: sampleToX(sample), type: 'isp' as const });
    });
    
    // Hardness overlay (based on PSR/crest analysis)
    const intensity = Math.min(1, metrics.hardness.hardnessIndex / 100);
    for (let x = 0; x < displayWidth; x += 10) {
      hardnessOverlay.push({ x, intensity });
    }
    
    // Dynamic overlay (LUFS-S over time)
    metrics.dynamics.lufsS.forEach((lufs, index) => {
      const x = (index / metrics.dynamics.lufsS.length) * displayWidth;
      dynamicOverlay.push({ x, lufs });
    });
    
    return {
      peakMarkers,
      hardnessOverlay,
      dynamicOverlay
    };
  }
}

/**
 * Factory function to create compare metrics analyzer
 */
export function createCompareMetrics(sampleRate: number = 44100): CompareMetrics {
  return new CompareMetrics(sampleRate);
}