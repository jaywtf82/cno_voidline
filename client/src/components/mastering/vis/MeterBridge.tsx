import React, { useRef, useEffect, useState } from 'react';
import { useMasteringStore } from '@/state/masteringStore';

export interface MeterBridgeProps {
  sessionId: string;
}

interface MeterReadings {
  lufsI: number;
  lufsS: number;
  lufsM: number;
  lra: number;
  dbtp: number;
  rms: number;
  peak: number;
  correlation: number;
}

export function MeterBridge({ sessionId }: MeterBridgeProps) {
  const { currentSession } = useMasteringStore();
  const [readings, setReadings] = useState<MeterReadings>({
    lufsI: -23.0,
    lufsS: -20.5,
    lufsM: -18.2,
    lra: 7.3,
    dbtp: -1.2,
    rms: -16.8,
    peak: -0.8,
    correlation: 0.92
  });
  
  const animationRef = useRef<number>();

  useEffect(() => {
    if (currentSession?.buffer) {
      startMetering();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSession]);

  const startMetering = () => {
    const updateMeters = () => {
      // Simulate real-time meter updates
      setReadings(prev => ({
        lufsI: prev.lufsI + (Math.random() - 0.5) * 0.1,
        lufsS: prev.lufsS + (Math.random() - 0.5) * 0.3,
        lufsM: prev.lufsM + (Math.random() - 0.5) * 0.5,
        lra: Math.max(0, prev.lra + (Math.random() - 0.5) * 0.1),
        dbtp: Math.min(0, prev.dbtp + (Math.random() - 0.5) * 0.2),
        rms: prev.rms + (Math.random() - 0.5) * 0.3,
        peak: Math.min(0, prev.peak + (Math.random() - 0.5) * 0.2),
        correlation: Math.max(-1, Math.min(1, prev.correlation + (Math.random() - 0.5) * 0.02))
      }));
      
      animationRef.current = requestAnimationFrame(updateMeters);
    };
    
    updateMeters();
  };

  const getMeterColor = (value: number, min: number, max: number, warningZone: number = 0.8) => {
    const normalized = (value - min) / (max - min);
    if (normalized > warningZone) return '#ff5f56';
    if (normalized > 0.6) return '#ffbd2e';
    return '#3FB950';
  };

  const renderMeter = (
    label: string,
    value: number,
    unit: string,
    min: number,
    max: number,
    target?: number
  ) => {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const color = getMeterColor(value, min, max);
    
    return (
      <div className="meter-group" key={label}>
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-gray-400">{label}</span>
          <span style={{ color }}>{value.toFixed(1)}{unit}</span>
        </div>
        
        <div className="meter-bar bg-gray-900 h-2 rounded-sm overflow-hidden">
          <div 
            className="meter-fill h-full transition-all duration-100"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color,
              boxShadow: `0 0 4px ${color}40`
            }}
          />
          
          {target && (
            <div 
              className="meter-target absolute w-0.5 h-2 bg-white opacity-60"
              style={{ left: `${((target - min) / (max - min)) * 100}%` }}
            />
          )}
        </div>
        
        {target && (
          <div className="text-xs font-mono text-gray-500 mt-1">
            Target: {target}{unit}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          Meter Bridge
        </div>
        <div className="text-xs font-mono text-gray-400">
          ITU-R BS.1770-4
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* LUFS Metering */}
        <div className="meter-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Loudness (LUFS)</h4>
          <div className="space-y-3">
            {renderMeter('Integrated', readings.lufsI, '', -40, 0, -14)}
            {renderMeter('Short-term', readings.lufsS, '', -40, 0)}
            {renderMeter('Momentary', readings.lufsM, '', -40, 0)}
            {renderMeter('Range (LRA)', readings.lra, ' LU', 0, 20)}
          </div>
        </div>

        {/* Peak & RMS */}
        <div className="meter-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Dynamics</h4>
          <div className="space-y-3">
            {renderMeter('True Peak', readings.dbtp, ' dBTP', -20, 0, -1)}
            {renderMeter('Sample Peak', readings.peak, ' dBFS', -20, 0)}
            {renderMeter('RMS Level', readings.rms, ' dBFS', -40, 0)}
          </div>
        </div>

        {/* Stereo Analysis */}
        <div className="meter-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Stereo</h4>
          <div className="space-y-3">
            {renderMeter('Correlation', readings.correlation, '', -1, 1, 0.5)}
          </div>
        </div>

        {/* Compliance Indicators */}
        <div className="compliance-section">
          <h4 className="text-sm font-mono text-gray-300 mb-3">Compliance</h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className={`compliance-indicator ${readings.lufsI >= -16 && readings.lufsI <= -8 ? 'compliant' : 'non-compliant'}`}>
              <span>Streaming</span>
              <span className={readings.lufsI >= -16 && readings.lufsI <= -8 ? 'text-green-400' : 'text-red-400'}>
                {readings.lufsI >= -16 && readings.lufsI <= -8 ? '✓' : '✗'}
              </span>
            </div>
            
            <div className={`compliance-indicator ${readings.dbtp <= -1.0 ? 'compliant' : 'non-compliant'}`}>
              <span>True Peak</span>
              <span className={readings.dbtp <= -1.0 ? 'text-green-400' : 'text-red-400'}>
                {readings.dbtp <= -1.0 ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}