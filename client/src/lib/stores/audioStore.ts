import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalysisData {
  id: string;
  sr: number;
  ch: number;
  dur_s: number;
  peak_dbfs: number;
  rms_mono_dbfs: number;
  crest_db: number;
  lufs_i: number | null;
  bands: {
    sub_20_40: number;
    low_40_120: number;
    lowmid_120_300: number;
    mid_300_1500: number;
    highmid_1p5k_6k: number;
    high_6k_12k: number;
    air_12k_20k: number;
  };
  mix_notes: string[];
  targets: {
    club: { lufs_i_min: number; lufs_i_max: number; tp_max_dbTP: number };
    stream: { lufs_i_min: number; lufs_i_max: number; tp_max_dbTP: number };
  };
}

interface AudioState {
  currentFile: File | null;
  isPlaying: boolean;
  analysisResults: any;
  persistentAnalysis: Record<string, AnalysisData>;
  setCurrentFile: (file: File | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setAnalysisResults: (results: any) => void;
  getAnalysis: (id: string) => AnalysisData | null;
  setAnalysis: (id: string, data: AnalysisData) => void;
  ensureAnalysisSeed: (id: string, data: AnalysisData) => void;
}

const SEED_888_PREMASTER: AnalysisData = {
  id: "888_premaster",
  sr: 48000,
  ch: 2,
  dur_s: 620.7,
  peak_dbfs: -5.6,
  rms_mono_dbfs: -17.19,
  crest_db: 11.59,
  lufs_i: null,
  bands: {
    sub_20_40: -12.4,
    low_40_120: 0.0,
    lowmid_120_300: -8.3,
    mid_300_1500: -4.9,
    highmid_1p5k_6k: -6.1,
    high_6k_12k: -15.4,
    air_12k_20k: -27.3
  },
  mix_notes: [
    "Tighten lows: Ozone Low End Focus (40–120 Hz) Contrast 25–35, Amount 20–30; or Pro-MB low band 1.5:1, 30–50 ms attack, 120–200 ms release, ~1–2 dB GR.",
    "Highs look controlled; minimal de-essing.",
    "Optional +0.5 dB shelf @ 11–12 kHz for air if needed."
  ],
  targets: {
    club: { lufs_i_min: -7.5, lufs_i_max: -6.5, tp_max_dbTP: -0.8 },
    stream: { lufs_i_min: -10.0, lufs_i_max: -9.0, tp_max_dbTP: -1.0 }
  }
};

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      currentFile: null,
      isPlaying: false,
      analysisResults: null,
      persistentAnalysis: {},
      setCurrentFile: (file) => set({ currentFile: file }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setAnalysisResults: (results) => set({ analysisResults: results }),
      getAnalysis: (id) => {
        const state = get();
        return state.persistentAnalysis[id] || null;
      },
      setAnalysis: (id, data) => {
        set((state) => ({
          persistentAnalysis: {
            ...state.persistentAnalysis,
            [id]: data
          }
        }));
      },
      ensureAnalysisSeed: (id, data) => {
        const state = get();
        if (!state.persistentAnalysis[id]) {
          set((state) => ({
            persistentAnalysis: {
              ...state.persistentAnalysis,
              [id]: data
            }
          }));
        }
      }
    }),
    {
      name: 'voidline-audio-store',
    }
  )
);

// Initialize seed data
export const initializeAnalysisData = () => {
  const store = useAudioStore.getState();
  store.ensureAnalysisSeed('888_premaster', SEED_888_PREMASTER);
};