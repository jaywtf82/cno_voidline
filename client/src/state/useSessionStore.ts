
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Metrics, FramePayload } from '@/types/audio';

export type Phase2Source = 'pre' | 'post';

export interface ProcessedSnapshot {
  metrics: Metrics;
  fft: Float32Array;
}

export interface ExportStatus {
  phase: 'idle' | 'render' | 'encode' | 'zip' | 'done' | 'error';
  progress: number;
  message?: string;
}

export interface SessionState {
  playing: boolean;
  monitor: 'A' | 'B';
  metricsA: Metrics;
  metricsB: Metrics;
  fftA: Float32Array | null;
  fftB: Float32Array | null;
  timeA: Float32Array | null;
  timeB: Float32Array | null;
  voidlineScore: number;
  exportStatus: ExportStatus;
  phase2Source: Phase2Source;
  processedReady: boolean;
  lastProcessedSnapshot?: ProcessedSnapshot;
}

export interface SessionActions {
  setPlaying(playing: boolean): void;
  setMonitor(monitor: 'A' | 'B'): void;
  updateMetricsA(metrics: Partial<Metrics>): void;
  updateMetricsB(metrics: Partial<Metrics>): void;
  updateFFTA(fft: Float32Array): void;
  updateFFTB(fft: Float32Array): void;
  setVoidlineScore(score: number): void;
  updateExportStatus(status: Partial<ExportStatus>): void;
  resetExportStatus(): void;
  setPhase2Source(src: Phase2Source): void;
  activateProcessedPreview(snap: ProcessedSnapshot): void;
  pushFrameFromEngine(f: FramePayload): void;
}

export type SessionStore = SessionState & SessionActions;

const initialMetrics: Metrics = {
  peakDb: -Infinity,
  truePeakDb: -Infinity,
  rmsDb: -Infinity,
  lufsI: -70,
  lufsS: -70,
  lra: 0,
  corr: 0,
  widthPct: 0,
  noiseFloorDb: -Infinity,
  headroomDb: 0,
};

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set, get) => ({
    playing: false,
    monitor: 'A',
    metricsA: { ...initialMetrics },
    metricsB: { ...initialMetrics },
    fftA: null,
    fftB: null,
    timeA: null,
    timeB: null,
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
    
    updateMetricsA: (metrics: Partial<Metrics>) =>
      set((state) => ({
        metricsA: { ...state.metricsA, ...metrics },
      })),
      
    updateMetricsB: (metrics: Partial<Metrics>) =>
      set((state) => ({
        metricsB: { ...state.metricsB, ...metrics },
      })),
      
    updateFFTA: (fft: Float32Array) => {
      const fftCopy = new Float32Array(fft);
      set({ fftA: fftCopy });
    },
    
    updateFFTB: (fft: Float32Array) => {
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

    setPhase2Source: (src: Phase2Source) => set({ phase2Source: src }),

    activateProcessedPreview: (snap: ProcessedSnapshot) =>
      set({
        lastProcessedSnapshot: snap,
        processedReady: true,
        phase2Source: 'post',
      }),

    pushFrameFromEngine: (f: FramePayload) => {
      if (f.src === 'pre') {
        set({ metricsA: f.metrics, fftA: f.fft, timeA: f.time ?? null });
      } else {
        set({ metricsB: f.metrics, fftB: f.fft, timeB: f.time ?? null, processedReady: true });
      }
    },
  }))
);

// Phase-2 source-aware selectors
export const usePhase2Source = () => useSessionStore(s => s.phase2Source);
export const usePhase2Metrics = () => {
  const phase2Source = useSessionStore(s => s.phase2Source);
  const metricsA = useSessionStore(s => s.metricsA);
  const metricsB = useSessionStore(s => s.metricsB);
  return phase2Source === 'pre' ? metricsA : metricsB;
};
export const usePhase2Fft = () => {
  const phase2Source = useSessionStore(s => s.phase2Source);
  const fftA = useSessionStore(s => s.fftA);
  const fftB = useSessionStore(s => s.fftB);
  return phase2Source === 'pre' ? fftA : fftB;
};
export const usePhase2Time = () => {
  const phase2Source = useSessionStore(s => s.phase2Source);
  const timeA = useSessionStore(s => s.timeA);
  const timeB = useSessionStore(s => s.timeB);
  return phase2Source === 'pre' ? timeA : timeB;
};
export const useProcessedSnapshot = () => useSessionStore(s => s.lastProcessedSnapshot);

export { initialMetrics };
