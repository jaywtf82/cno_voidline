import React, { useRef, useEffect, useState } from 'react';
import { useMasteringStore } from '@/state/masteringStore';

export interface CorrelationPanelProps {
  sessionId: string;
}

export function CorrelationPanel({ sessionId }: CorrelationPanelProps) {
  const { currentSession } = useMasteringStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [viewMode, setViewMode] = useState<'correlation' | 'vectorscope'>('correlation');
  const [correlationData, setCorrelationData] = useState<Float32Array>(new Float32Array(256));
  const [vectorData, setVectorData] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });

  useEffect(() => {
    if (currentSession?.buffer) {
      startAnalysis();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSession]);

  useEffect(() => {
    draw();
  }, [correlationData, vectorData, viewMode]);

  const startAnalysis = () => {
    const updateAnalysis = () => {
      if (viewMode === 'correlation') {
        updateCorrelationData();
      } else {
        updateVectorData();
      }
      
      animationRef.current = requestAnimationFrame(updateAnalysis);
    };
    
    updateAnalysis();
  };

  const updateCorrelationData = () => {
    const newData = new Float32Array(256);
    
    for (let i = 0; i < 256; i++) {
      const freq = (i / 256) * 22050;
      let correlation = 0.9; // Base correlation
      
      // Simulate frequency-dependent correlation
      if (freq < 100) correlation = 0.95 + Math.random() * 0.05; // High correlation in bass
      else if (freq < 1000) correlation = 0.85 + Math.random() * 0.15; // Mid correlation
      else if (freq < 10000) correlation = 0.7 + Math.random() * 0.25; // Variable in highs
      else correlation = 0.6 + Math.random() * 0.3; // More decorrelated at top
      
      newData[i] = Math.max(-1, Math.min(1, correlation));
    }
    
    setCorrelationData(newData);
  };

  const updateVectorData = () => {
    const numPoints = 500;
    const x: number[] = [];
    const y: number[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      // Simulate stereo field samples
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.6; // Vary radius for realistic spread
      const scatter = (Math.random() - 0.5) * 0.2; // Add some scatter
      
      x.push(Math.cos(angle + scatter) * radius);
      y.push(Math.sin(angle + scatter) * radius);
    }
    
    setVectorData({ x, y });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear
    ctx.fillStyle = 'rgb(11, 15, 18)';
    ctx.fillRect(0, 0, width, height);

    if (viewMode === 'correlation') {
      drawCorrelation(ctx, width, height);
    } else {
      drawVectorscope(ctx, width, height);
    }
  };

  const drawCorrelation = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw grid
    ctx.strokeStyle = 'rgba(154, 169, 184, 0.2)';
    ctx.lineWidth = 1;

    // Zero line
    const zeroY = height / 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    // +1 and -1 lines
    ctx.beginPath();
    ctx.moveTo(0, height * 0.1);
    ctx.lineTo(width, height * 0.1);
    ctx.moveTo(0, height * 0.9);
    ctx.lineTo(width, height * 0.9);
    ctx.stroke();

    // Draw correlation vs frequency
    ctx.strokeStyle = '#3FB950';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < correlationData.length; i++) {
      const x = (i / correlationData.length) * width;
      const y = height * (1 - (correlationData[i] + 1) / 2); // Map -1..1 to height..0

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw frequency labels
    ctx.fillStyle = '#9aa9b8';
    ctx.font = '10px "Fira Code", monospace';
    
    const freqLabels = [
      { pos: 0.1, label: '100Hz' },
      { pos: 0.3, label: '1kHz' },
      { pos: 0.7, label: '10kHz' }
    ];

    freqLabels.forEach(({ pos, label }) => {
      ctx.fillText(label, pos * width - 15, height - 5);
    });

    // Draw correlation labels
    ctx.fillText('+1.0', 5, height * 0.1 + 10);
    ctx.fillText('0.0', 5, zeroY + 10);
    ctx.fillText('-1.0', 5, height * 0.9 + 10);
  };

  const drawVectorscope = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Draw grid circles
    ctx.strokeStyle = 'rgba(154, 169, 184, 0.2)';
    ctx.lineWidth = 1;

    for (let r = 0.25; r <= 1; r += 0.25) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    // Draw vector points
    ctx.fillStyle = '#3FB950';
    ctx.globalAlpha = 0.6;

    vectorData.x.forEach((x, i) => {
      const y = vectorData.y[i];
      const pixelX = centerX + x * radius;
      const pixelY = centerY + y * radius;
      
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Draw labels
    ctx.fillStyle = '#9aa9b8';
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillText('L', centerX - radius - 15, centerY + 5);
    ctx.fillText('R', centerX + radius + 5, centerY + 5);
    ctx.fillText('M', centerX - 5, centerY - radius - 5);
    ctx.fillText('S', centerX - 5, centerY + radius + 15);
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          Correlation Analysis
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('correlation')}
            className={`text-xs font-mono px-2 py-1 rounded ${
              viewMode === 'correlation' ? 'bg-green-600' : 'bg-gray-600'
            }`}
            data-testid="correlation-mode"
          >
            CORR
          </button>
          <button
            onClick={() => setViewMode('vectorscope')}
            className={`text-xs font-mono px-2 py-1 rounded ${
              viewMode === 'vectorscope' ? 'bg-green-600' : 'bg-gray-600'
            }`}
            data-testid="vectorscope-mode"
          >
            VECTOR
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-48 bg-[#0B0F12] rounded border border-gray-800"
          style={{ imageRendering: 'pixelated' }}
          data-testid="correlation-canvas"
        />
        
        <div className="mt-2 text-xs font-mono text-gray-400 flex justify-between">
          {viewMode === 'correlation' ? (
            <>
              <span>Correlation vs Frequency</span>
              <span>-1.0 (out) to +1.0 (mono)</span>
            </>
          ) : (
            <>
              <span>Stereo Vector Display</span>
              <span>L/R phase relationship</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}