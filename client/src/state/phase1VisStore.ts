import { create } from 'zustand';
import { ViewTransform, defaultTransform } from '@/lib/vis/interactions';

interface Phase1VisState {
  freeze: boolean;
  transforms: Record<string, ViewTransform>;
  setTransform: (panel: string, tx: Partial<ViewTransform>) => void;
  toggleFreeze: () => void;
}

export const usePhase1VisStore = create<Phase1VisState>((set) => ({
  freeze: false,
  transforms: {
    nuance: { ...defaultTransform },
    dynamics: { ...defaultTransform },
    frequencies: { ...defaultTransform },
    stereo: { ...defaultTransform },
  },
  setTransform: (panel, tx) =>
    set((state) => ({
      transforms: {
        ...state.transforms,
        [panel]: { ...state.transforms[panel], ...tx },
      },
    })),
  toggleFreeze: () => set((s) => ({ freeze: !s.freeze })),
}));
