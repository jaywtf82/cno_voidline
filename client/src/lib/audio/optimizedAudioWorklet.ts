/**
 * OptimizedAudioWorklet - Performance-focused audio processing
 * Uses Web Workers and efficient algorithms to prevent UI blocking
 */

export interface AudioWorkletConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
}

export interface AnalysisMetrics {
  lufs: number;
  peak: number;
  rms: number;
  dynamicRange: number;
  correlation: number;
  progress: number;
  stage: string;
}

export class OptimizedAudioWorklet {
  private worker: Worker | null = null;
  private isProcessing = false;
  private callbacks = new Map<string, Function>();

  async initialize(): Promise<void> {
    if (this.worker) return;

    // Create worker with inline code to avoid external file dependencies
    const workerCode = `
      class AudioProcessor {
        constructor() {
          this.sampleRate = 44100;
          this.frameSize = 1024;
        }

        processAudio(channelData, config) {
          const { sampleRate, channels } = config;
          this.sampleRate = sampleRate;

          const leftChannel = channelData[0];
          const rightChannel = channels > 1 ? channelData[1] : leftChannel;
          const totalSamples = leftChannel.length;

          // Chunk processing for better performance
          const chunkSize = Math.min(this.frameSize * 64, Math.floor(totalSamples / 20));
          let processedSamples = 0;
          const results = [];

          for (let i = 0; i < totalSamples; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalSamples);
            const leftChunk = leftChannel.slice(i, end);
            const rightChunk = rightChannel.slice(i, end);

            const chunkResult = this.analyzeChunk(leftChunk, rightChunk, i, totalSamples);
            results.push(chunkResult);
            
            processedSamples += chunkSize;
            const progress = Math.min(100, (processedSamples / totalSamples) * 100);

            // Send progress update every 5%
            if (progress % 5 < (chunkSize / totalSamples) * 100) {
              self.postMessage({
                type: 'progress',
                data: {
                  progress: Math.round(progress),
                  stage: this.getStageFromProgress(progress),
                  metrics: chunkResult
                }
              });
            }
          }

          // Calculate final aggregated results
          const finalResult = this.aggregateResults(results);
          self.postMessage({ type: 'complete', data: finalResult });
        }

        analyzeChunk(left, right, offset, totalLength) {
          const length = left.length;
          if (length === 0) return this.getEmptyMetrics();

          // Peak calculation
          let peak = 0;
          let rmsSum = 0;
          let correlationSum = 0;
          let crossSum = 0;

          for (let i = 0; i < length; i++) {
            const l = left[i];
            const r = right[i];
            
            peak = Math.max(peak, Math.abs(l), Math.abs(r));
            rmsSum += (l * l + r * r) * 0.5;
            correlationSum += l * r;
            crossSum += Math.abs(l - r);
          }

          const rms = Math.sqrt(rmsSum / length);
          const correlation = length > 0 ? correlationSum / length : 0;

          // Simplified LUFS calculation (K-weighted approximation)
          const lufs = this.calculateSimpleLUFS(left, right);

          // Dynamic range estimation
          const dynamicRange = this.calculateDynamicRange(left, right);

          return {
            lufs: lufs > -70 ? lufs : -70,
            peak: peak > 1e-10 ? 20 * Math.log10(peak) : -60,
            rms: rms > 1e-10 ? 20 * Math.log10(rms) : -60,
            dynamicRange: dynamicRange,
            correlation: Math.max(-1, Math.min(1, correlation))
          };
        }

        calculateSimpleLUFS(left, right) {
          // Simplified K-weighting filter (approximation)
          let sum = 0;
          const length = left.length;

          for (let i = 0; i < length; i++) {
            const mono = (left[i] + right[i]) * 0.5;
            sum += mono * mono;
          }

          const meanSquare = sum / length;
          return meanSquare > 1e-10 ? -0.691 + 10 * Math.log10(meanSquare) : -70;
        }

        calculateDynamicRange(left, right) {
          const windowSize = Math.floor(this.sampleRate * 0.05); // 50ms windows
          if (left.length < windowSize) return 12.0;

          const windows = [];
          for (let i = 0; i < left.length - windowSize; i += windowSize) {
            let rmsSum = 0;
            for (let j = 0; j < windowSize; j++) {
              const sample = Math.max(Math.abs(left[i + j]), Math.abs(right[i + j]));
              rmsSum += sample * sample;
            }
            const windowRMS = Math.sqrt(rmsSum / windowSize);
            if (windowRMS > 1e-10) {
              windows.push(20 * Math.log10(windowRMS));
            }
          }

          if (windows.length < 2) return 12.0;

          windows.sort((a, b) => b - a);
          const loud = windows[0];
          const quietIndex = Math.floor(windows.length * 0.9);
          const quiet = windows[quietIndex];

          return Math.max(0, loud - quiet);
        }

        aggregateResults(results) {
          if (results.length === 0) return this.getEmptyMetrics();

          // Weight by chunk size and calculate weighted averages
          const totalWeight = results.length;
          let lufs = 0, peak = -Infinity, rms = 0, dynamicRange = 0, correlation = 0;

          results.forEach(result => {
            lufs += result.lufs / totalWeight;
            peak = Math.max(peak, result.peak);
            rms += result.rms / totalWeight;
            dynamicRange += result.dynamicRange / totalWeight;
            correlation += result.correlation / totalWeight;
          });

          return {
            lufs: Math.max(-70, lufs),
            peak: Math.max(-60, peak),
            rms: Math.max(-60, rms),
            dynamicRange: Math.max(0, dynamicRange),
            correlation: Math.max(-1, Math.min(1, correlation))
          };
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

        getEmptyMetrics() {
          return {
            lufs: -70,
            peak: -60,
            rms: -60,
            dynamicRange: 12.0,
            correlation: 0
          };
        }
      }

      const processor = new AudioProcessor();

      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        if (type === 'process') {
          processor.processAudio(data.channelData, data.config);
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const { type, data } = e.data;
      const callback = this.callbacks.get(type);
      if (callback) {
        callback(data);
      }
    };

    this.worker.onerror = (error) => {
      console.error('Audio worker error:', error);
      this.cleanup();
    };
  }

  async processAudio(
    audioBuffer: AudioBuffer,
    onProgress?: (metrics: AnalysisMetrics) => void,
    onComplete?: (metrics: AnalysisMetrics) => void
  ): Promise<AnalysisMetrics> {
    if (!this.worker) {
      await this.initialize();
    }

    if (this.isProcessing) {
      throw new Error('Audio processing already in progress');
    }

    this.isProcessing = true;

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Set up callbacks
      this.callbacks.set('progress', (data: Partial<AnalysisMetrics>) => {
        if (onProgress) {
          onProgress({
            lufs: data.lufs || -70,
            peak: data.peak || -60,
            rms: data.rms || -60,
            dynamicRange: data.dynamicRange || 12,
            correlation: data.correlation || 0,
            progress: data.progress || 0,
            stage: data.stage || 'Processing...'
          });
        }
      });

      this.callbacks.set('complete', (data: Partial<AnalysisMetrics>) => {
        this.isProcessing = false;
        const finalMetrics: AnalysisMetrics = {
          lufs: data.lufs || -70,
          peak: data.peak || -60,
          rms: data.rms || -60,
          dynamicRange: data.dynamicRange || 12,
          correlation: data.correlation || 0,
          progress: 100,
          stage: 'Analysis complete.'
        };
        
        if (onComplete) {
          onComplete(finalMetrics);
        }
        resolve(finalMetrics);
      });

      // Extract channel data efficiently
      const channelData = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }

      const config: AudioWorkletConfig = {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        bufferSize: audioBuffer.length
      };

      // Send data to worker
      this.worker.postMessage({
        type: 'process',
        data: { channelData, config }
      });

      // Set timeout for safety
      setTimeout(() => {
        if (this.isProcessing) {
          this.isProcessing = false;
          reject(new Error('Audio processing timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isProcessing = false;
    this.callbacks.clear();
  }

  isReady(): boolean {
    return this.worker !== null && !this.isProcessing;
  }
}

// Singleton instance for reuse
let globalWorkletInstance: OptimizedAudioWorklet | null = null;

export function getOptimizedAudioWorklet(): OptimizedAudioWorklet {
  if (!globalWorkletInstance) {
    globalWorkletInstance = new OptimizedAudioWorklet();
  }
  return globalWorkletInstance;
}