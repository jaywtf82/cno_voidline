import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore, initialMetrics } from '@/state/useSessionStore';

const metricsPre = { ...initialMetrics, peak: 0.5 };
const metricsPost = { ...initialMetrics, peak: 1.0 };
const fftPre = new Float32Array([1, 2]);
const fftPost = new Float32Array([3, 4]);

describe('pushFrameFromEngine routing', () => {
  beforeEach(() => {
    useSessionStore.setState({
      metricsA: { ...initialMetrics },
      metricsB: { ...initialMetrics },
      fftA: null,
      fftB: null,
      processedReady: false,
    });
  });

  it('routes frames and flags processed readiness', () => {
    useSessionStore.getState().pushFrameFromEngine({ src: 'pre', metrics: metricsPre, fft: fftPre });
    expect(useSessionStore.getState().metricsA).toEqual(metricsPre);
    expect(useSessionStore.getState().fftA).toEqual(fftPre);
    expect(useSessionStore.getState().processedReady).toBe(false);

    useSessionStore.getState().pushFrameFromEngine({ src: 'post', metrics: metricsPost, fft: fftPost });
    expect(useSessionStore.getState().metricsB).toEqual(metricsPost);
    expect(useSessionStore.getState().fftB).toEqual(fftPost);
    expect(useSessionStore.getState().processedReady).toBe(true);
  });
});
