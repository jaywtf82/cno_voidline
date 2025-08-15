import create from 'zustand';

export const useAudioStore = create((set) => ({
  processingParams: {
    harmonic: 45,
    subweight: 32,
    transient: 78,
    airlift: 56,
    spatial: 63,
    // ...
  },
  play: () => {},
  pause: () => {},
  stop: () => {},
  updateParams: (params) => set((state) => ({
    processingParams: { ...state.processingParams, ...params }
  })),
  // ...other mock data
}));