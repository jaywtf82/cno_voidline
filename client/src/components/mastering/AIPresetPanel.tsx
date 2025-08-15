import React, { useState } from 'react';
import { ChainParams, generatePreset } from '@/lib/audio/ai/presetEngine';
import { useMasteringStore } from '@/state/masteringStore';

export interface AIPresetPanelProps {
  sessionId: string;
  onPresetGenerated: (params: ChainParams) => void;
  onPresetApplied: (params: ChainParams) => void;
  isProcessing: boolean;
}

export function AIPresetPanel({ 
  sessionId, 
  onPresetGenerated, 
  onPresetApplied, 
  isProcessing 
}: AIPresetPanelProps) {
  const { currentSession } = useMasteringStore();
  const [selectedTarget, setSelectedTarget] = useState<'streaming' | 'club' | 'vinyl'>('streaming');
  const [generatedPreset, setGeneratedPreset] = useState<ChainParams | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePreset = async () => {
    if (!currentSession?.analysis) return;

    setIsGenerating(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const preset = generatePreset(selectedTarget, currentSession.analysis);
      setGeneratedPreset(preset);
      onPresetGenerated(preset);
    } catch (error) {
      console.error('Failed to generate preset:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPreset = () => {
    if (generatedPreset) {
      onPresetApplied(generatedPreset);
    }
  };

  const targetDescriptions = {
    streaming: {
      lufs: '-14 to -9 LUFS-I',
      ceiling: '≤ -1.0 dBTP',
      description: 'Optimized for Spotify, Apple Music, YouTube'
    },
    club: {
      lufs: '-7 to -6 LUFS-I',
      ceiling: '-0.9 to -1.0 dBTP',
      description: 'High energy for DJ sets and clubs'
    },
    vinyl: {
      lufs: '-16 to -12 LUFS-I',
      ceiling: '≤ -2.0 dBTP',
      description: 'Wide dynamics for vinyl pressing'
    }
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          AI Presets
        </div>
        <div className="text-xs font-mono text-gray-400">
          Neural v9.4.1
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Target Selection */}
        <div className="target-selection">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Target Platform</h4>
          <div className="space-y-3">
            {(Object.keys(targetDescriptions) as Array<keyof typeof targetDescriptions>).map((target) => {
              const info = targetDescriptions[target];
              return (
                <label key={target} className="block">
                  <div className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedTarget === target 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="target"
                        value={target}
                        checked={selectedTarget === target}
                        onChange={(e) => setSelectedTarget(e.target.value as typeof selectedTarget)}
                        className="text-green-500"
                        data-testid={`target-${target}`}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-mono text-white capitalize">
                          {target}
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                          {info.description}
                        </div>
                        <div className="text-xs font-mono text-gray-500 mt-1">
                          {info.lufs} • {info.ceiling}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Generation Controls */}
        <div className="generation-section">
          <button
            onClick={handleGeneratePreset}
            disabled={isGenerating || isProcessing || !currentSession?.analysis}
            className="btn btn-primary w-full mb-4"
            data-testid="generate-preset"
          >
            {isGenerating ? 'Analyzing & Generating...' : 'Generate from Analysis'}
          </button>

          {isGenerating && (
            <div className="loading-indicator">
              <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <span>Neural processing...</span>
              </div>
              <div className="mt-2 space-y-1 text-xs font-mono text-gray-500">
                <div>• Analyzing LUFS, LRA, PSR metrics</div>
                <div>• Detecting harshness/mud flags</div>
                <div>• Calculating optimal chain parameters</div>
                <div>• Validating against target corridor</div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Preset Display */}
        {generatedPreset && (
          <div className="preset-display">
            <h4 className="text-sm font-mono text-gray-300 mb-3">Generated Preset</h4>
            <div className="bg-gray-900 p-3 rounded space-y-2">
              <div className="text-xs font-mono text-gray-400">
                Target: <span className="text-green-400 capitalize">{generatedPreset.target}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-gray-500">Transient</div>
                  <div className="text-gray-300">
                    A: {generatedPreset.transient.attack.toFixed(1)}dB
                  </div>
                  <div className="text-gray-300">
                    S: {generatedPreset.transient.sustain.toFixed(1)}dB
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">Limiter</div>
                  <div className="text-gray-300">
                    Ceiling: {generatedPreset.limiter.ceiling.toFixed(1)}dBTP
                  </div>
                  <div className="text-gray-300">
                    Release: {generatedPreset.limiter.release}ms
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-gray-500 mt-2">
                Crossover: {generatedPreset.xover.frequencies.join('Hz, ')}Hz ({generatedPreset.xover.type})
              </div>
              
              <div className="text-xs font-mono text-gray-500">
                Stereo: {generatedPreset.stereoWidth.width}% width, 
                mono &lt;{generatedPreset.stereoWidth.monoBelow}Hz
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleApplyPreset}
                disabled={isProcessing}
                className="btn btn-primary flex-1"
                data-testid="apply-preset"
              >
                Apply Preset
              </button>
              
              <button
                onClick={() => {/* A/B Compare logic */}}
                disabled={isProcessing}
                className="btn btn-secondary"
                data-testid="ab-compare"
              >
                A/B vs Manual
              </button>
              
              <button
                onClick={() => {/* Save preset logic */}}
                disabled={isProcessing}
                className="btn btn-secondary"
                data-testid="save-preset"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Analysis Features Display */}
        {currentSession?.analysis && (
          <div className="analysis-features">
            <h4 className="text-sm font-mono text-gray-300 mb-3">Analysis Features</h4>
            <div className="bg-gray-900 p-3 rounded">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-gray-500">LUFS-I</div>
                  <div className="text-gray-300">{currentSession.analysis.lufsI?.toFixed(1) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">LRA</div>
                  <div className="text-gray-300">{currentSession.analysis.lra?.toFixed(1) || 'N/A'} LU</div>
                </div>
                <div>
                  <div className="text-gray-500">PSR</div>
                  <div className="text-gray-300">{currentSession.analysis.psr?.toFixed(1) || 'N/A'} dB</div>
                </div>
                <div>
                  <div className="text-gray-500">Correlation</div>
                  <div className="text-gray-300">{currentSession.analysis.corr?.toFixed(2) || 'N/A'}</div>
                </div>
              </div>
              
              {currentSession.analysis.flags && (
                <div className="mt-2 text-xs font-mono text-yellow-400">
                  Flags: {currentSession.analysis.flags.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}