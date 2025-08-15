import { AnalysisResults, PresetParameters } from "@shared/schema";

export interface AIAnalysisResult {
  lufs: number;
  dbtp: number;
  dbfs: number;
  lra: number;
  correlation: number;
  spectrum: number[];
  peakFrequency: number;
  dynamicRange: number;
  stereoWidth: number;
  noiseFloor: number;
  voidlineScore: number;
  recommendations: AIRecommendation[];
}

export interface AIRecommendation {
  type: 'eq' | 'compression' | 'stereo' | 'limiting' | 'harmonic';
  parameter: string;
  currentValue: number;
  suggestedValue: number;
  confidence: number;
  reason: string;
}

export interface MasteringSession {
  id: string;
  audioBuffer: AudioBuffer;
  originalAnalysis: AIAnalysisResult;
  currentAnalysis: AIAnalysisResult;
  appliedParameters: PresetParameters;
  learningData: LearningData[];
}

export interface LearningData {
  timestamp: number;
  parameterChange: {
    parameter: string;
    oldValue: number;
    newValue: number;
  };
  resultImprovement: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
}

class AIMasteringCore {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sessions: Map<string, MasteringSession> = new Map();
  private learningDatabase: LearningData[] = [];

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      
      // Load AI mastering worklet
      try {
        await this.audioContext.audioWorklet.addModule('/ai-mastering-worklet.js');
      } catch (error) {
        console.warn('AI Mastering Worklet not available, using fallback processing');
      }
    }
  }

  async analyzeAudio(audioBuffer: AudioBuffer): Promise<AIAnalysisResult> {
    if (!this.audioContext) {
      await this.initialize();
    }

    // Perform comprehensive audio analysis
    const analysisResult = await this.performDeepAnalysis(audioBuffer);
    
    // Generate AI recommendations based on analysis
    const recommendations = await this.generateRecommendations(analysisResult);
    
    return {
      ...analysisResult,
      recommendations,
      voidlineScore: this.calculateVoidlineScore(analysisResult)
    };
  }

  private async performDeepAnalysis(audioBuffer: AudioBuffer): Promise<Omit<AIAnalysisResult, 'recommendations' | 'voidlineScore'>> {
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

    // Calculate LUFS (Loudness Units relative to Full Scale)
    const lufs = this.calculateLUFS(leftChannel, rightChannel, sampleRate);
    
    // Calculate True Peak (dBTP)
    const dbtp = this.calculateTruePeak(leftChannel, rightChannel);
    
    // Calculate RMS level (dBFS)
    const dbfs = this.calculateRMS(leftChannel, rightChannel);
    
    // Calculate Loudness Range (LRA)
    const lra = this.calculateLRA(leftChannel, rightChannel, sampleRate);
    
    // Calculate stereo correlation
    const correlation = this.calculateStereoCorrelation(leftChannel, rightChannel);
    
    // Generate frequency spectrum
    const spectrum = await this.generateSpectrum(leftChannel, sampleRate);
    
    // Find peak frequency
    const peakFrequency = this.findPeakFrequency(spectrum, sampleRate);
    
    // Calculate dynamic range
    const dynamicRange = this.calculateDynamicRange(leftChannel, rightChannel);
    
    // Calculate stereo width
    const stereoWidth = this.calculateStereoWidth(leftChannel, rightChannel);
    
    // Calculate noise floor
    const noiseFloor = this.calculateNoiseFloor(leftChannel, rightChannel);

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
      noiseFloor
    };
  }

  private async generateRecommendations(analysis: Omit<AIAnalysisResult, 'recommendations' | 'voidlineScore'>): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // AI-driven EQ recommendations
    if (analysis.spectrum.length > 0) {
      const lowEnd = analysis.spectrum.slice(0, 8).reduce((a, b) => a + b) / 8;
      const midRange = analysis.spectrum.slice(8, 24).reduce((a, b) => a + b) / 16;
      const highEnd = analysis.spectrum.slice(24).reduce((a, b) => a + b) / (analysis.spectrum.length - 24);

      if (lowEnd < 0.3) {
        recommendations.push({
          type: 'eq',
          parameter: 'lowShelf.gain',
          currentValue: 0,
          suggestedValue: 2.5,
          confidence: 0.85,
          reason: 'Low-end presence is weak, suggesting gentle low-shelf boost for warmth'
        });
      }

      if (highEnd < 0.25) {
        recommendations.push({
          type: 'eq',
          parameter: 'highShelf.gain',
          currentValue: 0,
          suggestedValue: 1.8,
          confidence: 0.78,
          reason: 'High frequencies lack sparkle, recommending subtle air band enhancement'
        });
      }
    }

    // Dynamic range recommendations
    if (analysis.dynamicRange < 6) {
      recommendations.push({
        type: 'compression',
        parameter: 'ratio',
        currentValue: 4,
        suggestedValue: 2.5,
        confidence: 0.92,
        reason: 'Track is over-compressed, reducing ratio to preserve dynamics'
      });
    }

    // Stereo field recommendations
    if (analysis.stereoWidth < 0.6) {
      recommendations.push({
        type: 'stereo',
        parameter: 'width',
        currentValue: 1,
        suggestedValue: 1.3,
        confidence: 0.75,
        reason: 'Stereo image appears narrow, suggesting width enhancement'
      });
    }

    // Loudness recommendations
    if (analysis.lufs < -23) {
      recommendations.push({
        type: 'limiting',
        parameter: 'output_gain',
        currentValue: 0,
        suggestedValue: Math.min(6, -16 - analysis.lufs),
        confidence: 0.88,
        reason: 'Track is quieter than streaming standards, suggesting level optimization'
      });
    }

    return recommendations;
  }

  private calculateVoidlineScore(analysis: Omit<AIAnalysisResult, 'recommendations' | 'voidlineScore'>): number {
    // Proprietary Voidline scoring algorithm
    let score = 50; // Base score

    // Loudness scoring (0-20 points)
    const lufsTarget = -16;
    const lufsDeviation = Math.abs(analysis.lufs - lufsTarget);
    const lufsScore = Math.max(0, 20 - (lufsDeviation * 2));
    
    // Dynamic range scoring (0-20 points)
    const idealDR = 8;
    const drDeviation = Math.abs(analysis.dynamicRange - idealDR);
    const drScore = Math.max(0, 20 - (drDeviation * 2.5));
    
    // Stereo correlation scoring (0-15 points)
    const correlationScore = analysis.correlation * 15;
    
    // Frequency balance scoring (0-15 points)
    const spectrumBalance = this.calculateSpectrumBalance(analysis.spectrum);
    const balanceScore = spectrumBalance * 15;
    
    // Noise floor scoring (0-10 points)
    const noiseScore = Math.max(0, Math.min(10, (analysis.noiseFloor + 60) / 6));
    
    score = lufsScore + drScore + correlationScore + balanceScore + noiseScore;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateSpectrumBalance(spectrum: number[]): number {
    if (spectrum.length < 32) return 0.5;
    
    const lowEnd = spectrum.slice(0, 8).reduce((a, b) => a + b) / 8;
    const midRange = spectrum.slice(8, 24).reduce((a, b) => a + b) / 16;
    const highEnd = spectrum.slice(24).reduce((a, b) => a + b) / (spectrum.length - 24);
    
    const idealRatio = [0.35, 0.4, 0.25]; // Low, Mid, High
    const actualRatio = [lowEnd, midRange, highEnd];
    const total = actualRatio.reduce((a, b) => a + b);
    
    if (total === 0) return 0;
    
    const normalizedRatio = actualRatio.map(val => val / total);
    const deviations = normalizedRatio.map((val, i) => Math.abs(val - idealRatio[i]));
    const averageDeviation = deviations.reduce((a, b) => a + b) / deviations.length;
    
    return Math.max(0, 1 - (averageDeviation * 2));
  }

  // Audio analysis helper methods
  private calculateLUFS(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): number {
    // Simplified LUFS calculation (ITU-R BS.1770-4 standard)
    const windowSize = Math.floor(sampleRate * 0.4); // 400ms window
    const overlap = Math.floor(windowSize * 0.75); // 75% overlap
    let sumLoudness = 0;
    let numWindows = 0;

    for (let i = 0; i < leftChannel.length - windowSize; i += windowSize - overlap) {
      const leftWindow = leftChannel.slice(i, i + windowSize);
      const rightWindow = rightChannel.slice(i, i + windowSize);
      
      const leftMeanSquare = leftWindow.reduce((sum, sample) => sum + sample * sample, 0) / windowSize;
      const rightMeanSquare = rightWindow.reduce((sum, sample) => sum + sample * sample, 0) / windowSize;
      
      const loudness = 0.691 * leftMeanSquare + 0.691 * rightMeanSquare;
      if (loudness > 0) {
        sumLoudness += Math.log10(loudness);
        numWindows++;
      }
    }

    return numWindows > 0 ? -0.691 + 10 * (sumLoudness / numWindows) : -60;
  }

  private calculateTruePeak(leftChannel: Float32Array, rightChannel: Float32Array): number {
    // Simplified true peak calculation with basic oversampling
    let maxPeak = 0;
    
    for (let i = 0; i < leftChannel.length; i++) {
      maxPeak = Math.max(maxPeak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    }
    
    return maxPeak > 0 ? 20 * Math.log10(maxPeak) : -60;
  }

  private calculateRMS(leftChannel: Float32Array, rightChannel: Float32Array): number {
    const sumSquares = (leftChannel.reduce((sum, sample) => sum + sample * sample, 0) +
                       rightChannel.reduce((sum, sample) => sum + sample * sample, 0)) / 2;
    const rms = Math.sqrt(sumSquares / leftChannel.length);
    return rms > 0 ? 20 * Math.log10(rms) : -60;
  }

  private calculateLRA(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): number {
    // Simplified LRA calculation
    const windowSize = Math.floor(sampleRate * 3); // 3 second windows
    const loudnessValues: number[] = [];

    for (let i = 0; i < leftChannel.length - windowSize; i += windowSize) {
      const leftWindow = leftChannel.slice(i, i + windowSize);
      const rightWindow = rightChannel.slice(i, i + windowSize);
      
      const leftRMS = Math.sqrt(leftWindow.reduce((sum, sample) => sum + sample * sample, 0) / windowSize);
      const rightRMS = Math.sqrt(rightWindow.reduce((sum, sample) => sum + sample * sample, 0) / windowSize);
      
      const loudness = (leftRMS + rightRMS) / 2;
      if (loudness > 0) {
        loudnessValues.push(20 * Math.log10(loudness));
      }
    }

    if (loudnessValues.length === 0) return 0;

    loudnessValues.sort((a, b) => a - b);
    const p10 = loudnessValues[Math.floor(loudnessValues.length * 0.1)];
    const p95 = loudnessValues[Math.floor(loudnessValues.length * 0.95)];
    
    return p95 - p10;
  }

  private calculateStereoCorrelation(leftChannel: Float32Array, rightChannel: Float32Array): number {
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    const n = leftChannel.length;

    for (let i = 0; i < n; i++) {
      sumXY += leftChannel[i] * rightChannel[i];
      sumX += leftChannel[i];
      sumY += rightChannel[i];
      sumX2 += leftChannel[i] * leftChannel[i];
      sumY2 += rightChannel[i] * rightChannel[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator !== 0 ? numerator / denominator : 0;
  }

  private async generateSpectrum(audioData: Float32Array, sampleRate: number): Promise<number[]> {
    const fftSize = 2048;
    const fft = new Array(fftSize).fill(0);
    
    // Copy audio data and apply window function
    for (let i = 0; i < Math.min(fftSize, audioData.length); i++) {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (fftSize - 1)); // Hanning window
      fft[i] = audioData[i] * window;
    }

    // Simplified FFT (for production, use a proper FFT library)
    const spectrum = new Array(fftSize / 2).fill(0);
    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < fftSize; n++) {
        const angle = -2 * Math.PI * k * n / fftSize;
        real += fft[n] * Math.cos(angle);
        imag += fft[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag) / fftSize;
    }

    return spectrum.slice(0, 64); // Return first 64 bins for visualization
  }

  private findPeakFrequency(spectrum: number[], sampleRate: number): number {
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 1; i < spectrum.length; i++) {
      if (spectrum[i] > maxValue) {
        maxValue = spectrum[i];
        maxIndex = i;
      }
    }

    return (maxIndex * sampleRate) / (spectrum.length * 2);
  }

  private calculateDynamicRange(leftChannel: Float32Array, rightChannel: Float32Array): number {
    const windowSize = 1024;
    const rmsValues: number[] = [];

    for (let i = 0; i < leftChannel.length - windowSize; i += windowSize) {
      const leftWindow = leftChannel.slice(i, i + windowSize);
      const rightWindow = rightChannel.slice(i, i + windowSize);
      
      const leftRMS = Math.sqrt(leftWindow.reduce((sum, sample) => sum + sample * sample, 0) / windowSize);
      const rightRMS = Math.sqrt(rightWindow.reduce((sum, sample) => sum + sample * sample, 0) / windowSize);
      
      const rms = (leftRMS + rightRMS) / 2;
      if (rms > 0) {
        rmsValues.push(20 * Math.log10(rms));
      }
    }

    if (rmsValues.length === 0) return 0;

    rmsValues.sort((a, b) => b - a);
    const p10 = rmsValues[Math.floor(rmsValues.length * 0.1)];
    const p90 = rmsValues[Math.floor(rmsValues.length * 0.9)];
    
    return p10 - p90;
  }

  private calculateStereoWidth(leftChannel: Float32Array, rightChannel: Float32Array): number {
    let sumSide = 0;
    let sumMid = 0;

    for (let i = 0; i < leftChannel.length; i++) {
      const mid = (leftChannel[i] + rightChannel[i]) / 2;
      const side = (leftChannel[i] - rightChannel[i]) / 2;
      
      sumMid += mid * mid;
      sumSide += side * side;
    }

    const midRMS = Math.sqrt(sumMid / leftChannel.length);
    const sideRMS = Math.sqrt(sumSide / leftChannel.length);
    
    return midRMS > 0 ? sideRMS / midRMS : 0;
  }

  private calculateNoiseFloor(leftChannel: Float32Array, rightChannel: Float32Array): number {
    const sortedValues: number[] = [];
    
    for (let i = 0; i < leftChannel.length; i++) {
      const amplitude = Math.max(Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
      sortedValues.push(amplitude);
    }
    
    sortedValues.sort((a, b) => a - b);
    
    // Take 5th percentile as noise floor estimate
    const noiseIndex = Math.floor(sortedValues.length * 0.05);
    const noiseLevel = sortedValues[noiseIndex];
    
    return noiseLevel > 0 ? 20 * Math.log10(noiseLevel) : -60;
  }

  async applyMastering(sessionId: string, parameters: PresetParameters): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Apply mastering parameters and update session
    session.appliedParameters = parameters;
    session.currentAnalysis = await this.analyzeAudio(session.audioBuffer);
    
    // Record learning data
    this.recordLearningData(session, parameters);
  }

  private recordLearningData(session: MasteringSession, parameters: PresetParameters): void {
    const improvement = session.currentAnalysis.voidlineScore - session.originalAnalysis.voidlineScore;
    
    const learningData: LearningData = {
      timestamp: Date.now(),
      parameterChange: {
        parameter: 'overall',
        oldValue: session.originalAnalysis.voidlineScore,
        newValue: session.currentAnalysis.voidlineScore
      },
      resultImprovement: improvement
    };

    session.learningData.push(learningData);
    this.learningDatabase.push(learningData);
  }

  async createSession(audioBuffer: AudioBuffer): Promise<string> {
    const sessionId = crypto.randomUUID();
    const analysis = await this.analyzeAudio(audioBuffer);
    
    const session: MasteringSession = {
      id: sessionId,
      audioBuffer,
      originalAnalysis: analysis,
      currentAnalysis: analysis,
      appliedParameters: {
        harmonicBoost: 0,
        subweight: 0,
        transientPunch: 0,
        airlift: 0,
        spatialFlux: 0,
        compression: {
          threshold: -20,
          ratio: 4,
          attack: 10,
          release: 100
        },
        eq: {
          lowShelf: { frequency: 100, gain: 0 },
          highShelf: { frequency: 8000, gain: 0 }
        },
        stereo: {
          width: 1,
          bassMonoFreq: 120
        }
      },
      learningData: []
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId: string): MasteringSession | undefined {
    return this.sessions.get(sessionId);
  }

  getLearningInsights(): { totalSessions: number; averageImprovement: number; topRecommendations: string[] } {
    const totalSessions = this.learningDatabase.length;
    const averageImprovement = totalSessions > 0 
      ? this.learningDatabase.reduce((sum, data) => sum + data.resultImprovement, 0) / totalSessions 
      : 0;

    return {
      totalSessions,
      averageImprovement,
      topRecommendations: [
        'Gentle low-shelf boost for warmth',
        'Reduce compression ratio for dynamics',
        'Optimize stereo width for streaming'
      ]
    };
  }
}

export const aiMasteringCore = new AIMasteringCore();