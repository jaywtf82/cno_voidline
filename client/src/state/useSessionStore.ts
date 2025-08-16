import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface AudioMetrics {
  peak: number;
  rms: number;
  truePeak: number;
  correlation: number;
  width: number;
  noiseFloor: number;
  lufsIntegrated: number;
  lufsShort: number;
  lufsRange: number;
}

export interface ExportStatus {
  phase: 'idle' | 'render' | 'encode' | 'zip' | 'done' | 'error';
  progress: number;
  message?: string;
}

export type Phase2Source = 'pre' | 'post';

export interface ProcessedSnapshot {
  metrics: AudioMetrics;
  fft: Float32Array;
}

export interface FramePayload {
  src: Phase2Source;
  metrics: AudioMetrics;
  fft: Float32Array;
}

export interface SessionState {
  playing: boolean;
  monitor: 'A' | 'B';
  metricsA: AudioMetrics;
  metricsB: AudioMetrics;
  fftA: Float32Array | null;
  fftB: Float32Array | null;
  voidlineScore: number;
  exportStatus: ExportStatus;
  phase2Source: Phase2Source;
  processedReady: boolean;
  lastProcessedSnapshot?: ProcessedSnapshot;
}

export interface SessionActions {
  setPlaying(playing: boolean): void;
  setMonitor(monitor: 'A' | 'B'): void;
  updateMetricsA(metrics: Partial<AudioMetrics>): void;
  updateMetricsB(metrics: Partial<AudioMetrics>): void;
  updateFFTA(fft: Float32Array): void;
  updateFFTB(fft: Float32Array): void;
  setVoidlineScore(score: number): void;
  updateExportStatus(status: Partial<ExportStatus>): void;
  resetExportStatus(): void;
  updateProcessorParams?(params: any): void;
  setPhase2Source(src: Phase2Source): void;
  activateProcessedPreview(snap: ProcessedSnapshot): void;
  pushFrameFromEngine(f: FramePayload): void;
}

export type SessionStore = SessionState & SessionActions;

const initialMetrics: AudioMetrics = {
  peak: -Infinity,
  rms: -Infinity,
  truePeak: -Infinity,
  correlation: 0,
  width: 0,
  noiseFloor: -Infinity,
  lufsIntegrated: -70,
  lufsShort: -70,
  lufsRange: 0,
};

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set, get) => ({
    playing: false,
    monitor: 'A',
    metricsA: { ...initialMetrics },
    metricsB: { ...initialMetrics },
    fftA: null,
    fftB: null,
    voidlineScore: 0,
    exportStatus: {
      phase: 'idle',
      progress: 0,
    },
    phase2Source: 'pre',
    processedReady: false,
    lastProcessedSnapshot: undefined,
    
    setPlaying: (playing: boolean) => set({ playing }),
    
    setMonitor: (monitor: 'A' | 'B') => set({ monitor }),
    
    updateMetricsA: (metrics: Partial<AudioMetrics>) =>
      set((state) => ({
        metricsA: { ...state.metricsA, ...metrics },
      })),
      
    updateMetricsB: (metrics: Partial<AudioMetrics>) =>
      set((state) => ({
        metricsB: { ...state.metricsB, ...metrics },
      })),
      
    updateFFTA: (fft: Float32Array) => {
      // Copy to avoid reference issues
      const fftCopy = new Float32Array(fft);
      set({ fftA: fftCopy });
    },
    
    updateFFTB: (fft: Float32Array) => {
      // Copy to avoid reference issues
      const fftCopy = new Float32Array(fft);
      set({ fftB: fftCopy });
    },
    
    setVoidlineScore: (voidlineScore: number) => set({ voidlineScore }),
    
    updateExportStatus: (status: Partial<ExportStatus>) =>
      set((state) => ({
        exportStatus: { ...state.exportStatus, ...status },
      })),
      
    resetExportStatus: () =>
      set({
        exportStatus: {
          phase: 'idle',
          progress: 0,
          message: undefined,
        },
      }),

    updateProcessorParams: (params: any) => {
      // Optional method for storing processor parameters
      // Can be expanded later if needed
    },

    setPhase2Source: (src: Phase2Source) => set({ phase2Source: src }),

    activateProcessedPreview: (snap: ProcessedSnapshot) =>
      set({
        lastProcessedSnapshot: snap,
        processedReady: true,
      }),

    pushFrameFromEngine: (f: FramePayload) => {
      if (f.src === 'pre') {
        set({ metricsA: f.metrics, fftA: f.fft });
      } else {
        set({ metricsB: f.metrics, fftB: f.fft, processedReady: true });
      }
    },
  }))
);

// Optimized selectors - use direct selectors instead to prevent getSnapshot issues
export const useSessionMetrics = () => {
  const metricsA = useSessionStore(s => s.metricsA);
  const metricsB = useSessionStore(s => s.metricsB);
  const voidlineScore = useSessionStore(s => s.voidlineScore);
  return { metricsA, metricsB, voidlineScore };
};

export const useSessionFFT = () => {
  const fftA = useSessionStore(s => s.fftA);
  const fftB = useSessionStore(s => s.fftB);
  return { fftA, fftB };
};

export const useSessionPlayback = () => {
  const playing = useSessionStore(s => s.playing);
  const monitor = useSessionStore(s => s.monitor);
  return { playing, monitor };
};

export const useExportStatus = () => useSessionStore(
  (state) => state.exportStatus
);

export const usePhase2Metrics = () => {
  const source = useSessionStore(s => s.phase2Source);
  return useSessionStore(
    s => (source === 'post' ? s.metricsB : s.metricsA)
  );
};

export const usePhase2FFT = () => {
  const source = useSessionStore(s => s.phase2Source);
  return useSessionStore(
    s => (source === 'post' ? s.fftB : s.fftA)
  );
};

export { initialMetrics };