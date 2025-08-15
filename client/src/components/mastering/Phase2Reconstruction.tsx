import React, { useState, useEffect } from 'react';
import { useMasteringStore } from '@/state/masteringStore';
import { ABTransport } from './playback/ABTransport';
import { DualWaveCompare } from './playback/DualWaveCompare';
import { MeterBridge } from './vis/MeterBridge';
import { RealtimeSpectrum } from './vis/RealtimeSpectrum';
import { CorrelationPanel } from './vis/CorrelationPanel';
import { ManualRackControls } from './ManualRackControls';
import { AIPresetPanel } from './AIPresetPanel';
import { LiveSystemFeed } from '@/components/system/LiveSystemFeed';
import { ChainParams } from '@/lib/audio/ai/presetEngine';

export interface Phase2ReconstructionProps {
  sessionId: string;
}

export default function Phase2Reconstruction({ sessionId }: Phase2ReconstructionProps): JSX.Element {
  const { currentSession, setSessionPhase } = useMasteringStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [chainParams, setChainParams] = useState<ChainParams | null>(null);
  const [abState, setAbState] = useState<'A' | 'B' | 'bypass' | 'delta' | 'null'>('A');
  const [matchGain, setMatchGain] = useState(false);
  const [systemFeedMessages, setSystemFeedMessages] = useState<string[]>([]);

  useEffect(() => {
    if (currentSession) {
      setSessionPhase('phase2');
    }
  }, [currentSession, setSessionPhase]);

  const handlePresetGenerated = (params: ChainParams) => {
    setChainParams(params);
    addSystemMessage(`Preset generated for ${params.target} target`);
  };

  const handlePresetApplied = (params: ChainParams) => {
    setIsProcessing(true);
    addSystemMessage('Applying preset to audio chain...');
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      addSystemMessage('Preset applied successfully');
    }, 2000);
  };

  const addSystemMessage = (message: string) => {
    setSystemFeedMessages(prev => [...prev.slice(-4), message]);
  };

  if (!currentSession) {
    return (
      <div className="terminal-window p-8 text-center">
        <div className="text-gray-400">No active session. Please return to upload.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase 2 Header */}
      <div className="terminal-window">
        <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
              Phase 2: Intelligent Reconstruction
            </div>
            <div className="text-white font-bold text-sm">CORE: REBUILD</div>
            <div className="text-xs font-mono text-gray-400">
              neural module v9.4.1
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="status-indicator status-indicator--active" />
            <span className="text-xs font-mono text-gray-400">ACTIVE</span>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-400 mb-6 text-sm">
            AI rebuilds the audio, applying precise, calculated enhancements for optimal signal reconstruction.
          </p>
          
          {/* A/B Transport */}
          <ABTransport
            sessionId={sessionId}
            onStateChange={setAbState}
            onMatchGainToggle={setMatchGain}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Dual Waveform Comparison */}
      <DualWaveCompare
        sessionId={sessionId}
        abState={abState}
        showOverlays={true}
      />

      {/* Main Processing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Rack Controls */}
        <div className="lg:col-span-1">
          <ManualRackControls
            sessionId={sessionId}
            onParamsChange={setChainParams}
            isProcessing={isProcessing}
          />
        </div>

        {/* AI Presets Panel */}
        <div className="lg:col-span-1">
          <AIPresetPanel
            sessionId={sessionId}
            onPresetGenerated={handlePresetGenerated}
            onPresetApplied={handlePresetApplied}
            isProcessing={isProcessing}
          />
        </div>

        {/* Live System Feed */}
        <div className="lg:col-span-1">
          <LiveSystemFeed 
            isActive={true}
            className="h-full"
          />
        </div>
      </div>

      {/* Real-time Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MeterBridge sessionId={sessionId} />
        <RealtimeSpectrum sessionId={sessionId} />
        <CorrelationPanel sessionId={sessionId} />
      </div>
    </div>
  );
}