import React, { useState } from 'react';
import { ChainParams } from '@/lib/audio/ai/presetEngine';

export interface ManualRackControlsProps {
  sessionId: string;
  onParamsChange: (params: ChainParams | null) => void;
  isProcessing: boolean;
}

export function ManualRackControls({ 
  sessionId, 
  onParamsChange, 
  isProcessing 
}: ManualRackControlsProps) {
  const [params, setParams] = useState<ChainParams>({
    target: 'streaming',
    transient: { attack: 0, sustain: 0 },
    msEncode: { enabled: false },
    xover: { frequencies: [250, 2500], type: 'linear' },
    multiband: {
      bands: [
        { threshold: -20, ratio: 3, attack: 10, release: 100, knee: 2, makeup: 0 },
        { threshold: -18, ratio: 2.5, attack: 5, release: 50, knee: 2, makeup: 0 },
        { threshold: -16, ratio: 2, attack: 3, release: 30, knee: 1, makeup: 0 }
      ]
    },
    eq: { pre: [], post: [] },
    stereoWidth: { width: 100, monoBelow: 120 },
    limiter: { ceiling: -1.0, lookahead: 5, release: 50, style: 'transparent' },
    dither: { enabled: false, noise: 'tpdf', shaping: false }
  });

  const updateParams = (newParams: Partial<ChainParams>) => {
    const updated = { ...params, ...newParams };
    setParams(updated);
    onParamsChange(updated);
  };

  const resetToDefaults = () => {
    const defaults: ChainParams = {
      target: 'streaming',
      transient: { attack: 0, sustain: 0 },
      msEncode: { enabled: false },
      xover: { frequencies: [250, 2500], type: 'linear' },
      multiband: {
        bands: [
          { threshold: -20, ratio: 3, attack: 10, release: 100, knee: 2, makeup: 0 },
          { threshold: -18, ratio: 2.5, attack: 5, release: 50, knee: 2, makeup: 0 },
          { threshold: -16, ratio: 2, attack: 3, release: 30, knee: 1, makeup: 0 }
        ]
      },
      eq: { pre: [], post: [] },
      stereoWidth: { width: 100, monoBelow: 120 },
      limiter: { ceiling: -1.0, lookahead: 5, release: 50, style: 'transparent' },
      dither: { enabled: false, noise: 'tpdf', shaping: false }
    };
    setParams(defaults);
    onParamsChange(defaults);
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          Manual Rack
        </div>
        <button
          onClick={resetToDefaults}
          className="text-xs font-mono px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
          data-testid="reset-controls"
        >
          RESET
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Transient Shaper */}
        <div className="control-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Transient Shaper</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-400">Attack</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={params.transient.attack}
                onChange={(e) => updateParams({
                  transient: { ...params.transient, attack: parseFloat(e.target.value) }
                })}
                className="w-full"
                disabled={isProcessing}
                data-testid="transient-attack"
              />
              <div className="text-xs font-mono text-gray-500 text-center">
                {params.transient.attack.toFixed(1)}dB
              </div>
            </div>
            
            <div>
              <label className="text-xs font-mono text-gray-400">Sustain</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={params.transient.sustain}
                onChange={(e) => updateParams({
                  transient: { ...params.transient, sustain: parseFloat(e.target.value) }
                })}
                className="w-full"
                disabled={isProcessing}
                data-testid="transient-sustain"
              />
              <div className="text-xs font-mono text-gray-500 text-center">
                {params.transient.sustain.toFixed(1)}dB
              </div>
            </div>
          </div>
        </div>

        {/* M/S Encoding */}
        <div className="control-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">M/S Processing</h4>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={params.msEncode.enabled}
                onChange={(e) => updateParams({
                  msEncode: { enabled: e.target.checked }
                })}
                disabled={isProcessing}
                data-testid="ms-enable"
              />
              <span className="text-xs font-mono text-gray-400">Enable M/S</span>
            </label>
          </div>
        </div>

        {/* Crossover */}
        <div className="control-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Crossover</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="text-xs font-mono text-gray-400 w-16">Type</label>
              <select
                value={params.xover.type}
                onChange={(e) => updateParams({
                  xover: { ...params.xover, type: e.target.value as 'linear' | 'minimum' }
                })}
                className="bg-gray-800 text-white text-xs font-mono px-2 py-1 rounded"
                disabled={isProcessing}
                data-testid="xover-type"
              >
                <option value="linear">Linear Phase</option>
                <option value="minimum">Minimum Phase</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-gray-400">Low/Mid</label>
                <input
                  type="range"
                  min="80"
                  max="800"
                  value={params.xover.frequencies[0]}
                  onChange={(e) => updateParams({
                    xover: { 
                      ...params.xover, 
                      frequencies: [parseInt(e.target.value), params.xover.frequencies[1]] 
                    }
                  })}
                  className="w-full"
                  disabled={isProcessing}
                  data-testid="xover-low-mid"
                />
                <div className="text-xs font-mono text-gray-500 text-center">
                  {params.xover.frequencies[0]}Hz
                </div>
              </div>
              
              <div>
                <label className="text-xs font-mono text-gray-400">Mid/High</label>
                <input
                  type="range"
                  min="1000"
                  max="8000"
                  value={params.xover.frequencies[1]}
                  onChange={(e) => updateParams({
                    xover: { 
                      ...params.xover, 
                      frequencies: [params.xover.frequencies[0], parseInt(e.target.value)] 
                    }
                  })}
                  className="w-full"
                  disabled={isProcessing}
                  data-testid="xover-mid-high"
                />
                <div className="text-xs font-mono text-gray-500 text-center">
                  {params.xover.frequencies[1]}Hz
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multiband Compressor */}
        <div className="control-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Multiband Compressor</h4>
          {params.multiband.bands.map((band, index) => (
            <div key={index} className="mb-4 p-3 bg-gray-900 rounded">
              <div className="text-xs font-mono text-gray-400 mb-2">
                Band {index + 1} ({index === 0 ? 'Low' : index === 1 ? 'Mid' : 'High'})
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-mono text-gray-500">Thresh</label>
                  <input
                    type="range"
                    min="-40"
                    max="0"
                    value={band.threshold}
                    onChange={(e) => {
                      const newBands = [...params.multiband.bands];
                      newBands[index] = { ...band, threshold: parseFloat(e.target.value) };
                      updateParams({ multiband: { bands: newBands } });
                    }}
                    className="w-full"
                    disabled={isProcessing}
                    data-testid={`comp-threshold-${index}`}
                  />
                  <div className="text-xs font-mono text-gray-600 text-center">
                    {band.threshold}dB
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-mono text-gray-500">Ratio</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={band.ratio}
                    onChange={(e) => {
                      const newBands = [...params.multiband.bands];
                      newBands[index] = { ...band, ratio: parseFloat(e.target.value) };
                      updateParams({ multiband: { bands: newBands } });
                    }}
                    className="w-full"
                    disabled={isProcessing}
                    data-testid={`comp-ratio-${index}`}
                  />
                  <div className="text-xs font-mono text-gray-600 text-center">
                    {band.ratio.toFixed(1)}:1
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-mono text-gray-500">Attack</label>
                  <input
                    type="range"
                    min="0.1"
                    max="100"
                    value={band.attack}
                    onChange={(e) => {
                      const newBands = [...params.multiband.bands];
                      newBands[index] = { ...band, attack: parseFloat(e.target.value) };
                      updateParams({ multiband: { bands: newBands } });
                    }}
                    className="w-full"
                    disabled={isProcessing}
                    data-testid={`comp-attack-${index}`}
                  />
                  <div className="text-xs font-mono text-gray-600 text-center">
                    {band.attack}ms
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stereo Width */}
        <div className="control-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Stereo Processing</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-400">Width</label>
              <input
                type="range"
                min="0"
                max="200"
                value={params.stereoWidth.width}
                onChange={(e) => updateParams({
                  stereoWidth: { ...params.stereoWidth, width: parseInt(e.target.value) }
                })}
                className="w-full"
                disabled={isProcessing}
                data-testid="stereo-width"
              />
              <div className="text-xs font-mono text-gray-500 text-center">
                {params.stereoWidth.width}%
              </div>
            </div>
            
            <div>
              <label className="text-xs font-mono text-gray-400">Mono Below</label>
              <input
                type="range"
                min="60"
                max="300"
                value={params.stereoWidth.monoBelow}
                onChange={(e) => updateParams({
                  stereoWidth: { ...params.stereoWidth, monoBelow: parseInt(e.target.value) }
                })}
                className="w-full"
                disabled={isProcessing}
                data-testid="mono-below"
              />
              <div className="text-xs font-mono text-gray-500 text-center">
                {params.stereoWidth.monoBelow}Hz
              </div>
            </div>
          </div>
        </div>

        {/* Limiter */}
        <div className="control-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Limiter</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-400">Ceiling</label>
              <input
                type="range"
                min="-3"
                max="0"
                step="0.1"
                value={params.limiter.ceiling}
                onChange={(e) => updateParams({
                  limiter: { ...params.limiter, ceiling: parseFloat(e.target.value) }
                })}
                className="w-full"
                disabled={isProcessing}
                data-testid="limiter-ceiling"
              />
              <div className="text-xs font-mono text-gray-500 text-center">
                {params.limiter.ceiling.toFixed(1)}dBTP
              </div>
            </div>
            
            <div>
              <label className="text-xs font-mono text-gray-400">Release</label>
              <input
                type="range"
                min="10"
                max="200"
                value={params.limiter.release}
                onChange={(e) => updateParams({
                  limiter: { ...params.limiter, release: parseInt(e.target.value) }
                })}
                className="w-full"
                disabled={isProcessing}
                data-testid="limiter-release"
              />
              <div className="text-xs font-mono text-gray-500 text-center">
                {params.limiter.release}ms
              </div>
            </div>
          </div>
        </div>

        {/* Apply Controls */}
        <div className="flex space-x-2 pt-4 border-t border-gray-800">
          <button
            onClick={() => {/* Apply logic */}}
            disabled={isProcessing}
            className="btn btn-primary flex-1"
            data-testid="apply-manual"
          >
            {isProcessing ? 'Processing...' : 'Apply Manual Chain'}
          </button>
        </div>
      </div>
    </div>
  );
}