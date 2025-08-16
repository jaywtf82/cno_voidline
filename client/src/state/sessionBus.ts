import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type PreMasterMeta = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  objectUrl: string; // URL.createObjectURL(file)
  hash?: string;
};

export type PreMasterAnalysis = {
  peakDb: number;
  rmsDb: number;
  lufsShort?: number;
  lufsIntegrated?: number;
  noiseFloorDb?: number;
  corr?: number;
  spectrumSnapshot?: Float32Array; // 2048 linear 0..1
  sampleRate?: number;
  durationSec?: number;
};

export type SessionBusState = {
  file?: PreMasterMeta;
  analysis?: PreMasterAnalysis;
};

export type SessionBusActions = {
  setPreMaster(file: PreMasterMeta, analysis: PreMasterAnalysis): void;
  clearPreMaster(): void;
};

export type SessionBus = SessionBusState & SessionBusActions;

export const useSessionBus = create<SessionBus>()(
  subscribeWithSelector((set, get) => ({
    file: undefined,
    analysis: undefined,
    
    setPreMaster: (file: PreMasterMeta, analysis: PreMasterAnalysis) => {
      set({ file, analysis });
    },
    
    clearPreMaster: () => {
      const { file } = get();
      if (file?.objectUrl) {
        URL.revokeObjectURL(file.objectUrl);
      }
      set({ file: undefined, analysis: undefined });
    },
  }))
);