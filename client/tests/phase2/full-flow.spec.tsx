// @vitest-environment jsdom
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AudioEngine, ProcessorParams } from '@/audio/AudioEngine';
import { useSessionStore, initialMetrics } from '@/state/useSessionStore';

function MetricsView() {
  const peak = useSessionStore(s => (s.phase2Source === 'post' ? s.metricsB.peak : s.metricsA.peak));
  const fft = useSessionStore(s => (s.phase2Source === 'post' ? s.fftB : s.fftA));
  return (
    <>
      <div data-testid="peak">{peak}</div>
      <div data-testid="fft">{fft ? fft[0] : 'none'}</div>
    </>
  );
}

describe('phase2 full flow', () => {
  const params: ProcessorParams = {
    midGains: [0, 0, 0],
    sideGains: [0, 0, 0],
    midFreqs: [200, 1000, 5000],
    sideFreqs: [200, 1000, 5000],
    midQs: [1, 1, 1],
    sideQs: [1, 1, 1],
    denoiseAmount: 0,
    noiseGateThreshold: -60,
    threshold: -6,
    ceiling: -1,
    lookAheadSamples: 0,
    attack: 5,
    release: 50,
  };

  beforeEach(() => {
    useSessionStore.setState({
      metricsA: { ...initialMetrics, peak: 1 },
      metricsB: { ...initialMetrics, peak: 2 },
      fftA: new Float32Array([10]),
      fftB: new Float32Array([20]),
      phase2Source: 'pre',
      processedReady: false,
      lastProcessedSnapshot: undefined,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('activates processed preview via engine and exposes processed data', async () => {
    const engine = new AudioEngine({ bufferSize: 4096, sampleRate: 48000, lookAheadMs: 5 });
    render(<MetricsView />);
    await act(async () => {
      await engine.prepareProcessedPreview(params);
      useSessionStore.getState().setPhase2Source('post');
    });
    expect(useSessionStore.getState().processedReady).toBe(true);
    expect(screen.getByTestId('peak').textContent).toBe('2');
    expect(screen.getByTestId('fft').textContent).toBe('20');
  });
});
