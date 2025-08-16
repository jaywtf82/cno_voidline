// @vitest-environment jsdom
import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useSessionStore, initialMetrics } from '@/state/useSessionStore';

function PeakLabel() {
  const peak = useSessionStore(s =>
    s.phase2Source === 'post' ? s.metricsB.peak : s.metricsA.peak
  );
  return <div data-testid="peak">{peak}</div>;
}

describe('phase2 source switching', () => {
  beforeEach(() => {
    useSessionStore.setState({
      phase2Source: 'pre',
      processedReady: false,
      metricsA: { ...initialMetrics, peak: 1 },
      metricsB: { ...initialMetrics, peak: 2 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('reads processed metrics after activation', () => {
    render(<PeakLabel />);
    expect(screen.getByTestId('peak').textContent).toBe('1');
    const snap = { metrics: useSessionStore.getState().metricsB, fft: new Float32Array() };
    act(() => {
      useSessionStore.getState().activateProcessedPreview(snap);
      useSessionStore.getState().setPhase2Source('post');
    });
    expect(screen.getByTestId('peak').textContent).toBe('2');
  });
});
