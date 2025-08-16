
export type Metrics = {
  peakDb: number;
  truePeakDb: number;
  rmsDb: number;
  lufsI: number;
  lufsS: number;
  lra: number;
  corr: number;
  widthPct: number;
  noiseFloorDb: number;
  headroomDb: number;
};

export type EngineParams = {
  msEq: {
    m: { low: number; mid: number; high: number };
    s: { low: number; mid: number; high: number };
  };
  denoise: { amount: number };
  limiter: { threshold: number; ceiling: number; lookaheadMs: number; knee: number };
  macros?: {
    harmonicBoost: number;
    subweight: number;
    transientPunch: number;
    airlift: number;
    spatialFlux: number;
  };
};

export type FramePayload = {
  src: 'pre' | 'post';
  metrics: Metrics;
  fft: Float32Array;
  time?: Float32Array;
};

export interface ProcessorParams {
  midGains: [number, number, number];
  sideGains: [number, number, number];
  midFreqs: [number, number, number];
  sideFreqs: [number, number, number];
  midQs: [number, number, number];
  sideQs: [number, number, number];
  denoiseAmount: number;
  noiseGateThreshold: number;
  threshold: number;
  ceiling: number;
  lookAheadSamples: number;
  attack: number;
  release: number;
}
