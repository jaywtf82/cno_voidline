import React, { useState, useEffect } from 'react';

interface MeterStacksProps {
  isActive: boolean;
}

interface MeterValue {
  current: number;
  peak: number;
  hold: number;
  lufs: number;
}

/**
 * MeterStacks - Professional-grade audio meters
 * LUFS, dBTP, LRA, RMS with peak hold and proper ballistics
 */
export function MeterStacks({ isActive }: MeterStacksProps) {
  const [meters, setMeters] = useState<{
    left: MeterValue;
    right: MeterValue;
    lufs: number;
    lra: number;
  }>({
    left: { current: -60, peak: -60, hold: -60, lufs: -23 },
    right: { current: -60, peak: -60, hold: -60, lufs: -23 },
    lufs: -23,
    lra: 0
  });
  
  // Generate realistic meter readings
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setMeters(prev => {
        const time = Date.now() * 0.001;
        
        // Realistic audio levels with some variation
        const baseLevel = -18 + Math.sin(time * 0.5) * 8;
        const leftCurrent = baseLevel + (Math.random() - 0.5) * 6;
        const rightCurrent = baseLevel + (Math.random() - 0.5) * 6;
        
        // Peak hold logic (decays slowly)
        const leftPeak = Math.max(leftCurrent, prev.left.peak - 0.5);
        const rightPeak = Math.max(rightCurrent, prev.right.peak - 0.5);
        
        // Hold peaks for visualization
        const leftHold = leftCurrent > prev.left.hold - 1 ? leftCurrent : prev.left.hold - 0.1;
        const rightHold = rightCurrent > prev.right.hold - 1 ? rightCurrent : prev.right.hold - 0.1;
        
        // LUFS integration (slower ballistics)
        const targetLufs = -14.2 + Math.sin(time * 0.3) * 2;
        const lufs = prev.lufs + (targetLufs - prev.lufs) * 0.1;
        
        // LRA calculation
        const lra = 6.5 + Math.sin(time * 0.2) * 2;
        
        return {
          left: {
            current: Math.max(-60, Math.min(6, leftCurrent)),
            peak: Math.max(-60, Math.min(6, leftPeak)),
            hold: Math.max(-60, Math.min(6, leftHold)),
            lufs: Math.max(-60, Math.min(0, lufs))
          },
          right: {
            current: Math.max(-60, Math.min(6, rightCurrent)),
            peak: Math.max(-60, Math.min(6, rightPeak)),
            hold: Math.max(-60, Math.min(6, rightHold)),
            lufs: Math.max(-60, Math.min(0, lufs))
          },
          lufs,
          lra: Math.max(0, Math.min(20, lra))
        };
      });
    }, 50); // 20Hz update rate
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  const renderMeter = (label: string, value: MeterValue, isLufs = false) => {
    const range = isLufs ? 60 : 66; // -60 to 0 dB, or -60 to +6 dB
    const offset = isLufs ? 60 : 60;
    
    const currentPercent = ((value.current + offset) / range) * 100;
    const peakPercent = ((value.peak + offset) / range) * 100;
    const holdPercent = ((value.hold + offset) / range) * 100;
    
    return (
      <div key={label} className="flex flex-col items-center gap-2">
        <div className="text-terminal-xs font-mono text-terminal-text-muted">
          {label}
        </div>
        
        <div className="relative w-8 h-48 bg-terminal-bg border border-terminal-border rounded">
          {/* Scale markers */}
          {[-60, -40, -20, -12, -6, 0].map(db => {
            const percent = ((db + offset) / range) * 100;
            return (
              <div
                key={db}
                className="absolute left-0 w-full h-px bg-terminal-text-dim"
                style={{ bottom: `${percent}%` }}
              />
            );
          })}
          
          {/* Current level */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-75"
            style={{
              height: `${Math.max(0, Math.min(100, currentPercent))}%`,
              background: currentPercent > 90 ? '#ef4444' : 
                         currentPercent > 75 ? '#f59e0b' : 
                         '#22c55e'
            }}
          />
          
          {/* Peak indicator */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-400"
            style={{ bottom: `${Math.max(0, Math.min(100, peakPercent))}%` }}
          />
          
          {/* Hold indicator */}
          <div
            className="absolute left-0 right-0 h-px bg-yellow-400"
            style={{ bottom: `${Math.max(0, Math.min(100, holdPercent))}%` }}
          />
        </div>
        
        {/* Digital readout */}
        <div className="text-terminal-xs font-mono text-color-primary text-center">
          <div>{value.current.toFixed(1)}</div>
          <div className="text-terminal-text-dim">dB</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Level meters */}
      <div className="flex justify-center gap-4">
        {renderMeter('L', meters.left)}
        {renderMeter('R', meters.right)}
      </div>
      
      {/* LUFS meter */}
      <div className="border-t border-terminal-border pt-4">
        <div className="text-center mb-3">
          <div className="text-terminal-sm font-semibold text-color-primary">
            LUFS Integration
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="relative w-12 h-32 bg-terminal-bg border border-terminal-border rounded">
            {/* LUFS scale */}
            {[-30, -23, -16, -12, -9].map(lufs => {
              const percent = ((lufs + 35) / 35) * 100;
              return (
                <div
                  key={lufs}
                  className="absolute left-0 w-full h-px bg-terminal-text-dim"
                  style={{ bottom: `${percent}%` }}
                />
              );
            })}
            
            {/* LUFS level */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-300"
              style={{
                height: `${Math.max(0, Math.min(100, ((meters.lufs + 35) / 35) * 100))}%`
              }}
            />
            
            {/* Target zone indicator (-16 to -12 LUFS for streaming) */}
            <div
              className="absolute left-0 right-0 bg-green-500 opacity-20"
              style={{
                bottom: '65.7%', // -16 LUFS
                height: '11.4%'   // -12 to -16 LUFS range
              }}
            />
          </div>
        </div>
        
        <div className="text-center mt-2">
          <div className="text-terminal-sm font-mono text-color-primary">
            {meters.lufs.toFixed(1)} LUFS
          </div>
        </div>
      </div>
      
      {/* Additional metrics */}
      <div className="grid grid-cols-2 gap-3 text-terminal-xs">
        <div className="text-center">
          <div className="text-terminal-text-muted">LRA</div>
          <div className="text-color-primary font-mono">
            {meters.lra.toFixed(1)} LU
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-terminal-text-muted">dBTP</div>
          <div className="text-color-primary font-mono">
            {Math.max(meters.left.peak, meters.right.peak).toFixed(1)}
          </div>
        </div>
      </div>
      
      {/* Compliance indicators */}
      <div className="border-t border-terminal-border pt-4">
        <div className="text-terminal-xs space-y-1">
          <div className="flex justify-between items-center">
            <span>Streaming Target:</span>
            <span className={`status-indicator ${
              meters.lufs >= -16 && meters.lufs <= -9 ? 'status-indicator--active' : 'status-indicator--warning'
            }`}>
              {meters.lufs >= -16 && meters.lufs <= -9 ? 'PASS' : 'CHECK'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>True Peak:</span>
            <span className={`status-indicator ${
              Math.max(meters.left.peak, meters.right.peak) <= -1.0 ? 'status-indicator--active' : 'status-indicator--error'
            }`}>
              {Math.max(meters.left.peak, meters.right.peak) <= -1.0 ? 'PASS' : 'LIMIT'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>LRA Range:</span>
            <span className={`status-indicator ${
              meters.lra >= 4 && meters.lra <= 8 ? 'status-indicator--active' : 'status-indicator--warning'
            }`}>
              {meters.lra >= 4 && meters.lra <= 8 ? 'PASS' : 'CHECK'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}