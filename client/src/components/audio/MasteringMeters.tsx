import React from 'react';
import { AudioMetrics, useSessionStore } from '@/state/useSessionStore';
import { Badge } from '@/components/ui/badge';

interface MasteringMetersProps {
  metricsA: AudioMetrics;
  metricsB: AudioMetrics;
  monitor: 'A' | 'B';
}

export function MasteringMeters({ metricsA, metricsB, monitor }: MasteringMetersProps) {
  const phase2Source = useSessionStore(s => s.phase2Source);
  const isProcessed = phase2Source === 'post';
  const formatDb = (value: number) => {
    if (value === -Infinity) return '-∞';
    return value.toFixed(1);
  };

  const formatLufs = (value: number) => {
    if (value <= -70) return '-∞';
    return value.toFixed(1);
  };

  const getMeterColor = (value: number, type: 'peak' | 'lufs' | 'correlation') => {
    if (type === 'peak') {
      if (value > -1) return 'text-red-400';
      if (value > -6) return 'text-yellow-400';
      return 'text-green-400';
    } else if (type === 'lufs') {
      if (value > -6) return 'text-red-400';
      if (value > -14) return 'text-yellow-400';
      return 'text-green-400';
    } else { // correlation
      if (value < 0.2) return 'text-red-400';
      if (value < 0.5) return 'text-yellow-400';
      return 'text-green-400';
    }
  };

  const currentMetrics = monitor === 'A' ? metricsA : metricsB;
  const otherMetrics = monitor === 'A' ? metricsB : metricsA;

  return (
    <div className="space-y-4">

      <div className="flex justify-end">
        {isProcessed && <Badge className="bg-orange-600 text-white">PROCESSED</Badge>}
      </div>
      
      {/* Peak Meters */}
      <div>
        <div className="text-xs font-mono text-green-300 mb-2">PEAK LEVELS</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`space-y-1 ${isProcessed ? 'opacity-50' : ''}`}>
            <div className="text-blue-400">Channel A</div>
            <div className={`font-mono ${getMeterColor(metricsA.peak, 'peak')}`}>
              {formatDb(metricsA.peak)} dB
            </div>
            <div className="text-gray-400">
              TP: {formatDb(metricsA.truePeak)} dB
            </div>
          </div>
          <div className={`space-y-1 ${isProcessed ? '' : 'opacity-50'}`}>
            <div className="text-orange-400">Channel B</div>
            <div className={`font-mono ${getMeterColor(metricsB.peak, 'peak')}`}>
              {formatDb(metricsB.peak)} dB
            </div>
            <div className="text-gray-400">
              TP: {formatDb(metricsB.truePeak)} dB
            </div>
          </div>
        </div>
      </div>

      {/* LUFS Meters */}
      <div>
        <div className="text-xs font-mono text-green-300 mb-2">LOUDNESS (LUFS)</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`space-y-1 ${isProcessed ? 'opacity-50' : ''}`}>
            <div className="text-blue-400">Channel A</div>
            <div className={`font-mono ${getMeterColor(metricsA.lufsIntegrated, 'lufs')}`}>
              I: {formatLufs(metricsA.lufsIntegrated)}
            </div>
            <div className="text-gray-400">
              S: {formatLufs(metricsA.lufsShort)}
            </div>
            <div className="text-gray-400">
              LRA: {metricsA.lufsRange.toFixed(1)} LU
            </div>
          </div>
          <div className={`space-y-1 ${isProcessed ? '' : 'opacity-50'}`}>
            <div className="text-orange-400">Channel B</div>
            <div className={`font-mono ${getMeterColor(metricsB.lufsIntegrated, 'lufs')}`}>
              I: {formatLufs(metricsB.lufsIntegrated)}
            </div>
            <div className="text-gray-400">
              S: {formatLufs(metricsB.lufsShort)}
            </div>
            <div className="text-gray-400">
              LRA: {metricsB.lufsRange.toFixed(1)} LU
            </div>
          </div>
        </div>
      </div>

      {/* RMS and Noise Floor */}
      <div>
        <div className="text-xs font-mono text-green-300 mb-2">DYNAMICS</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`space-y-1 ${isProcessed ? 'opacity-50' : ''}`}>
            <div className="text-blue-400">Channel A</div>
            <div className="font-mono text-green-400">
              RMS: {formatDb(metricsA.rms)} dB
            </div>
            <div className="text-gray-400">
              Noise: {formatDb(metricsA.noiseFloor)} dB
            </div>
          </div>
          <div className={`space-y-1 ${isProcessed ? '' : 'opacity-50'}`}>
            <div className="text-orange-400">Channel B</div>
            <div className="font-mono text-green-400">
              RMS: {formatDb(metricsB.rms)} dB
            </div>
            <div className="text-gray-400">
              Noise: {formatDb(metricsB.noiseFloor)} dB
            </div>
          </div>
        </div>
      </div>

      {/* Current monitor highlight */}
      <div className="pt-2 border-t border-green-800">
        <div className="text-xs font-mono text-green-300 mb-1 flex items-center">
          MONITORING: <span className={monitor === 'A' ? 'text-blue-400' : 'text-orange-400'}>
            CHANNEL {monitor}
          </span>
          {isProcessed && <Badge className="ml-2 bg-orange-600 text-white">PROCESSED</Badge>}
        </div>
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-gray-400">Peak</div>
              <div className={`font-mono ${getMeterColor(currentMetrics.peak, 'peak')}`}>
                {formatDb(currentMetrics.peak)} dB
              </div>
            </div>
            <div>
              <div className="text-gray-400">LUFS-I</div>
              <div className={`font-mono ${getMeterColor(currentMetrics.lufsIntegrated, 'lufs')}`}>
                {formatLufs(currentMetrics.lufsIntegrated)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}