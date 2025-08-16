import React, { useRef, useEffect } from 'react';

interface StereoCorrelationMeterProps {
  correlationA: number;
  correlationB: number;
  widthA: number;
  widthB: number;
  monitor: 'A' | 'B';
}

export function StereoCorrelationMeter({ 
  correlationA, 
  correlationB, 
  widthA, 
  widthB, 
  monitor 
}: StereoCorrelationMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw correlation meter background
    ctx.strokeStyle = '#0a4d2a';
    ctx.lineWidth = 1;
    
    // Draw correlation scale (-1 to +1)
    const scaleRadius = radius * 0.8;
    for (let i = -1; i <= 1; i += 0.5) {
      const angle = (i + 1) * Math.PI / 2 - Math.PI / 2; // -90° to +90°
      const x1 = centerX + Math.cos(angle) * (scaleRadius - 10);
      const y1 = centerY + Math.sin(angle) * (scaleRadius - 10);
      const x2 = centerX + Math.cos(angle) * scaleRadius;
      const y2 = centerY + Math.sin(angle) * scaleRadius;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const labelX = centerX + Math.cos(angle) * (scaleRadius + 15);
      const labelY = centerY + Math.sin(angle) * (scaleRadius + 15);
      ctx.fillText(i.toFixed(1), labelX, labelY + 3);
    }

    // Draw correlation indicators
    const currentCorr = monitor === 'A' ? correlationA : correlationB;
    const otherCorr = monitor === 'A' ? correlationB : correlationA;
    
    // Background indicator (other channel)
    if (otherCorr !== undefined) {
      const angle = (otherCorr + 1) * Math.PI / 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius * 0.6);
      const y = centerY + Math.sin(angle) * (radius * 0.6);
      
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Main indicator (current monitor)
    if (currentCorr !== undefined) {
      const angle = (currentCorr + 1) * Math.PI / 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius * 0.6);
      const y = centerY + Math.sin(angle) * (radius * 0.6);
      
      // Color based on correlation value
      let color = '#10b981'; // Green (good)
      if (currentCorr < 0.2) color = '#ef4444'; // Red (bad)
      else if (currentCorr < 0.5) color = '#f59e0b'; // Yellow (warning)
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw center reference
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
    ctx.fill();

  }, [correlationA, correlationB, monitor]);

  const currentWidth = monitor === 'A' ? widthA : widthB;
  const otherWidth = monitor === 'A' ? widthB : widthA;
  const currentCorr = monitor === 'A' ? correlationA : correlationB;

  const getCorrelationStatus = (corr: number) => {
    if (corr >= 0.8) return { text: 'EXCELLENT', color: 'text-green-400' };
    if (corr >= 0.5) return { text: 'GOOD', color: 'text-green-400' };
    if (corr >= 0.2) return { text: 'WARNING', color: 'text-yellow-400' };
    return { text: 'POOR', color: 'text-red-400' };
  };

  const corrStatus = getCorrelationStatus(currentCorr);

  return (
    <div className="space-y-3">
      
      {/* Correlation meter */}
      <div>
        <div className="text-xs font-mono text-green-300 mb-2">PHASE CORRELATION</div>
        <canvas
          ref={canvasRef}
          width={120}
          height={120}
          className="w-full h-24 bg-black border border-green-800 rounded"
        />
      </div>

      {/* Numerical values */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-blue-400">Channel A</div>
          <div className="font-mono text-green-400">
            {correlationA.toFixed(3)}
          </div>
          <div className="text-gray-400">
            Width: {widthA.toFixed(0)}%
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-orange-400">Channel B</div>
          <div className="font-mono text-green-400">
            {correlationB.toFixed(3)}
          </div>
          <div className="text-gray-400">
            Width: {widthB.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Current monitor status */}
      <div className="pt-2 border-t border-green-800">
        <div className="text-xs font-mono text-green-300 mb-1">
          MONITOR {monitor}
        </div>
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <span className={`font-mono ${corrStatus.color}`}>
              {corrStatus.text}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400">Correlation:</span>
            <span className="font-mono text-green-400">
              {currentCorr.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400">Stereo Width:</span>
            <span className="font-mono text-green-400">
              {currentWidth.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="text-xs text-gray-500 border-t border-green-800 pt-2">
        <div>+1.0: Perfect correlation (mono)</div>
        <div> 0.0: No correlation</div>
        <div>-1.0: Perfect anti-correlation</div>
        <div className="text-yellow-400 mt-1">
          Keep &gt; 0.2 for mono compatibility
        </div>
      </div>
    </div>
  );
}