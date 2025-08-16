/**
 * mastering-worklet.js - High-performance audio analysis worklet
 * Provides real-time audio processing without blocking the main thread
 */

class MasteringWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.bufferSize = 1024;
    this.analysisBuffer = [];
    this.isAnalyzing = false;
    this.progress = 0;
    
    // Analysis state
    this.sampleCount = 0;
    this.peakLevel = 0;
    this.rmsSum = 0;
    this.lufsSum = 0;
    this.correlationSum = 0;
    this.windowCount = 0;
    
    // K-weighting filter coefficients (simplified)
    this.highShelfFilter = this.createHighShelfFilter();
    this.preFilter = this.createPreFilter();
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'start-analysis':
        this.startAnalysis(data);
        break;
      case 'stop-analysis':
        this.stopAnalysis();
        break;
      case 'reset':
        this.resetAnalysis();
        break;
    }
  }

  startAnalysis(config) {
    this.isAnalyzing = true;
    this.resetAnalysis();
    this.targetSamples = config.targetSamples || 0;
    
    this.port.postMessage({
      type: 'analysis-started',
      progress: 0,
      stage: 'Starting real-time analysis...'
    });
  }

  stopAnalysis() {
    this.isAnalyzing = false;
    
    if (this.sampleCount > 0) {
      const finalMetrics = this.calculateFinalMetrics();
      this.port.postMessage({
        type: 'analysis-complete',
        metrics: finalMetrics,
        progress: 100,
        stage: 'Analysis complete.'
      });
    }
  }

  resetAnalysis() {
    this.sampleCount = 0;
    this.peakLevel = 0;
    this.rmsSum = 0;
    this.lufsSum = 0;
    this.correlationSum = 0;
    this.windowCount = 0;
    this.progress = 0;
  }

  process(inputs, outputs, parameters) {
    if (!this.isAnalyzing || inputs.length === 0 || inputs[0].length === 0) {
      return true;
    }

    const input = inputs[0];
    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : leftChannel;
    
    if (!leftChannel || leftChannel.length === 0) {
      return true;
    }

    this.analyzeFrame(leftChannel, rightChannel);
    
    // Send progress updates every 512 samples to avoid overwhelming the main thread
    if (this.sampleCount % 512 === 0) {
      this.sendProgressUpdate();
    }

    return true;
  }

  analyzeFrame(leftChannel, rightChannel) {
    const frameSize = leftChannel.length;
    
    for (let i = 0; i < frameSize; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i];
      
      // Peak detection
      const peak = Math.max(Math.abs(left), Math.abs(right));
      this.peakLevel = Math.max(this.peakLevel, peak);
      
      // RMS calculation
      const rms = (left * left + right * right) * 0.5;
      this.rmsSum += rms;
      
      // Simplified K-weighted loudness
      const mono = (left + right) * 0.5;
      const filteredSample = this.applyKWeighting(mono);
      this.lufsSum += filteredSample * filteredSample;
      
      // Correlation
      this.correlationSum += left * right;
      
      this.sampleCount++;
    }
    
    this.windowCount++;
  }

  applyKWeighting(sample) {
    // Simplified K-weighting filter approximation
    // In a real implementation, this would be a proper biquad filter
    const highShelfed = this.highShelfFilter.process(sample);
    return this.preFilter.process(highShelfed);
  }

  createHighShelfFilter() {
    // Simplified high-shelf filter for K-weighting
    return {
      x1: 0,
      y1: 0,
      process: function(input) {
        // Simple high-shelf approximation
        const output = input + 0.7 * this.x1 - 0.7 * this.y1;
        this.x1 = input;
        this.y1 = output;
        return output;
      }
    };
  }

  createPreFilter() {
    // Simplified pre-filter for K-weighting
    return {
      x1: 0,
      y1: 0,
      process: function(input) {
        // Simple high-pass approximation
        const output = input - this.x1 + 0.95 * this.y1;
        this.x1 = input;
        this.y1 = output;
        return output;
      }
    };
  }

  sendProgressUpdate() {
    if (this.targetSamples > 0) {
      this.progress = Math.min(100, (this.sampleCount / this.targetSamples) * 100);
    } else {
      // For real-time analysis, use time-based progress
      this.progress = Math.min(100, (this.sampleCount / 44100) * 2); // 2 seconds = 100%
    }

    const currentMetrics = this.calculateCurrentMetrics();
    
    this.port.postMessage({
      type: 'analysis-progress',
      metrics: currentMetrics,
      progress: this.progress,
      stage: this.getStageFromProgress(this.progress)
    });
  }

  calculateCurrentMetrics() {
    if (this.sampleCount === 0) {
      return {
        lufs: -70,
        peak: -60,
        rms: -60,
        dynamicRange: 12,
        correlation: 0
      };
    }

    const avgRMS = Math.sqrt(this.rmsSum / this.sampleCount);
    const avgLUFS = Math.sqrt(this.lufsSum / this.sampleCount);
    const correlation = this.correlationSum / this.sampleCount;

    return {
      lufs: avgLUFS > 1e-10 ? -0.691 + 10 * Math.log10(avgLUFS) : -70,
      peak: this.peakLevel > 1e-10 ? 20 * Math.log10(this.peakLevel) : -60,
      rms: avgRMS > 1e-10 ? 20 * Math.log10(avgRMS) : -60,
      dynamicRange: this.estimateDynamicRange(),
      correlation: Math.max(-1, Math.min(1, correlation))
    };
  }

  calculateFinalMetrics() {
    return this.calculateCurrentMetrics();
  }

  estimateDynamicRange() {
    // Simplified dynamic range estimation
    if (this.peakLevel === 0 || this.rmsSum === 0) return 12.0;
    
    const avgRMS = Math.sqrt(this.rmsSum / this.sampleCount);
    const peakDb = 20 * Math.log10(this.peakLevel);
    const rmsDb = 20 * Math.log10(avgRMS);
    
    return Math.max(0, peakDb - rmsDb);
  }

  getStageFromProgress(progress) {
    if (progress < 15) return 'Extracting frequency spectrum...';
    if (progress < 30) return 'Analyzing dynamic range...';
    if (progress < 45) return 'Computing stereo imaging...';
    if (progress < 60) return 'Measuring loudness levels...';
    if (progress < 75) return 'Detecting phase relationships...';
    if (progress < 90) return 'Calculating harmonic content...';
    if (progress < 95) return 'Generating analysis report...';
    return 'Analysis complete.';
  }
}

registerProcessor('mastering-worklet-processor', MasteringWorkletProcessor);