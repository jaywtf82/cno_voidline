
/**
 * visualBus.ts - PostMessage bridge for Worklet → UI communication
 */

export interface WorkletMessage {
  type: 'lufs' | 'peaks-rms' | 'correlation';
  timestamp: number;
  [key: string]: any;
}

export class VisualBus {
  private subscribers: Map<string, ((data: any) => void)[]> = new Map();
  private latestData: Map<string, any> = new Map();

  constructor() {
    // Initialize subscriber maps
    this.subscribers.set('lufs', []);
    this.subscribers.set('peaks-rms', []);
    this.subscribers.set('correlation', []);
    this.subscribers.set('metrics', []); // Combined metrics
  }

  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }
    
    const callbacks = this.subscribers.get(type)!;
    callbacks.push(callback);

    // Send latest data immediately if available
    const latestData = this.latestData.get(type);
    if (latestData) {
      callback(latestData);
    }

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  handleWorkletMessage(message: WorkletMessage): void {
    const { type, ...data } = message;
    
    // Store latest data
    this.latestData.set(type, data);
    
    // Notify type-specific subscribers
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }

    // Update combined metrics
    this.updateCombinedMetrics();
  }

  private updateCombinedMetrics(): void {
    const lufs = this.latestData.get('lufs');
    const peaks = this.latestData.get('peaks-rms');
    const correlation = this.latestData.get('correlation');

    if (lufs && peaks && correlation) {
      const combined = {
        // LUFS metrics
        lufsI: lufs.lufsI,
        lufsS: lufs.lufsS,
        lufsM: lufs.lufsM,
        dbtp: lufs.dbtp,
        
        // Peak/RMS metrics
        peakL: peaks.peakL,
        peakR: peaks.peakR,
        rmsL: peaks.rmsL,
        rmsR: peaks.rmsR,
        fastRMS: peaks.fastRMS,
        slowRMS: peaks.slowRMS,
        crest: peaks.crest,
        
        // Correlation metrics
        correlation: correlation.correlation,
        xyBuffer: correlation.xyBuffer,
        
        // Derived metrics
        plr: Math.max(peaks.peakL, peaks.peakR) - lufs.lufsI,
        psr: lufs.lufsS - lufs.lufsI,
        stereoWidth: Math.abs(correlation.correlation) * 100,
        
        // AI-relevant features
        spectralCentroid: this.estimateSpectralCentroid(peaks),
        spectralBalance: this.estimateSpectralBalance(peaks),
        transients: this.estimateTransientDensity(peaks),
        
        timestamp: Math.max(
          lufs.timestamp || 0,
          peaks.timestamp || 0,
          correlation.timestamp || 0
        )
      };

      // Store and notify combined metrics subscribers
      this.latestData.set('metrics', combined);
      const callbacks = this.subscribers.get('metrics');
      if (callbacks) {
        callbacks.forEach(callback => callback(combined));
      }
    }
  }

  private estimateSpectralCentroid(peaks: any): number {
    // Rough estimation based on RMS characteristics
    const rmsRatio = peaks.fastRMS / peaks.slowRMS;
    return 1000 + (rmsRatio * 2000); // Mock centroid in Hz
  }

  private estimateSpectralBalance(peaks: any): number {
    // Balance based on crest factor
    return Math.max(0, Math.min(100, 50 + (peaks.crest - 10) * 5));
  }

  private estimateTransientDensity(peaks: any): number {
    // Transient density based on RMS delta
    const rmsDelta = Math.abs(peaks.fastRMS - peaks.slowRMS);
    return Math.min(100, rmsDelta * 10);
  }

  getLatestData(type: string): any {
    return this.latestData.get(type);
  }

  clear(): void {
    this.latestData.clear();
    this.subscribers.forEach(callbacks => callbacks.length = 0);
  }
}
