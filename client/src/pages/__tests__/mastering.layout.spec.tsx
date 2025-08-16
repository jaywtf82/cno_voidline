// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import MasteringProcess from '../MasteringProcess';
import { useMasteringStore, MasteringSession } from '@/state/masteringStore';

vi.mock('@/components/mastering/Phase1DeepSignal', () => ({
  Phase1DeepSignal: () => <div>Phase1</div>,
}));
vi.mock('@/components/mastering/phase1/Phase1VisualDeck', () => ({
  Phase1VisualDeck: () => <div>Deck</div>,
}));
vi.mock('@/components/mastering/Phase2Reconstruction', () => ({
  default: () => <div>Phase2</div>,
}));
vi.mock('@/components/ExportPanelMock', () => ({
  ExportPanelMock: () => <div>Export</div>,
}));
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const baseSession: MasteringSession = {
  id: '1',
  fileMeta: { name: 'test', duration: 0, sr: 44100, channels: 2 },
  buffer: null,
  analysis: null,
  audioMetrics: null,
  currentPhase: 'phase1',
  settings: { fftSize: 2048, smoothing: 0.8, corridor: 'streaming', scopeMode: 'polar' },
};

describe('MasteringProcess layout', () => {
  beforeEach(() => {
    useMasteringStore.setState({ currentSession: baseSession });
  });

  it('hides Phase-2 and Phase-3 when Phase-1 incomplete', () => {
    render(<MasteringProcess />);
    expect(document.querySelector('#phase-2')).toBeNull();
    expect(document.querySelector('#phase-3')).toBeNull();
  });

  it('shows Phase-2 and Phase-3 after Phase-1 complete', () => {
    useMasteringStore.setState({ currentSession: { ...baseSession, currentPhase: 'phase2' } });
    render(<MasteringProcess />);
    expect(document.querySelector('#phase-2')).not.toBeNull();
    expect(document.querySelector('#phase-3')).not.toBeNull();
  });
});
