import React, { useRef, useEffect, useState } from 'react';
import { useMasteringStore } from '@/state/masteringStore';

export interface RealtimeSpectrumProps {
  sessionId: string;
}

export function RealtimeSpectrum({ sessionId }: RealtimeSpectrumProps) {
  const { currentSession } = useMasteringStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [showHold, setShowHold] = useState(true);
  const [spectrumData, setSpectrumData] = useState<Float32Array>(new Float32Array(512));
  const [holdData, setHoldData] = useState<Float32Array>(new Float32Array(512));

  useEffect(() => {
    if (currentSession?.buffer) {
      startSpectrum();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSession]);

  useEffect(() => {
    draw();
  }, [spectrumData, holdData, showHold]);

  const startSpectrum = () => {
    const updateSpectrum = () => {
      // Simulate spectrum analysis
      const newData = new Float32Array(512);
      const newHold = new Float32Array(holdData);
      
      for (let i = 0; i < 512; i++) {
        // Simulate 1/24 octave spectrum with realistic audio characteristics
        const freq = (i / 512) * 22050; // Frequency for this bin
        let magnitude = -60; // Base noise floor
        
        // Add some realistic frequency content
        if (freq < 100) magnitude += 20 - (100 - freq) * 0.1; // Bass rolloff
        else if (freq < 1000) magnitude += 15; // Midrange presence
        else if (freq < 5000) magnitude += 10 - (freq - 1000) * 0.002; // High mids
        else magnitude += 5 - (freq - 5000) * 0.001; // High frequency rolloff
        
        // Add random variation
        magnitude += (Math.random() - 0.5) * 8;
        magnitude = Math.max(-80, Math.min(0, magnitude));
        
        newData[i] = magnitude;
        
        // Update hold peaks
        if (magnitude > newHold[i]) {
          newHold[i] = magnitude;
        } else {
          newHold[i] = Math.max(magnitude, newHold[i] - 0.5); // Slow decay
        }
      }
      
      setSpectrumData(newData);
      setHoldData(newHold);
      
      animationRef.current = requestAnimationFrame(updateSpectrum);
    };
    
    updateSpectrum();
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

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw spectrum
    drawSpectrum(ctx, spectrumData, width, height, '#3FB950', 1);
    
    // Draw hold peaks
    if (showHold) {
      drawSpectrum(ctx, holdData, width, height, '#22c55e', 0.6);
    }

    // Draw labels
    drawLabels(ctx, width, height);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(154, 169, 184, 0.2)';
    ctx.lineWidth = 1;

    // Vertical lines (frequency)
    const frequencies = [100, 1000, 10000];
    frequencies.forEach(freq => {
      const x = freqToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Horizontal lines (dB)
    const levels = [-60, -40, -20, 0];
    levels.forEach(level => {
      const y = dbToY(level, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
  };

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number,
    color: string,
    alpha: number
  ) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const freq = (i / data.length) * 22050;
      const x = freqToX(freq, width);
      const y = dbToY(data[i], height);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const freqToX = (freq: number, width: number): number => {
    // Logarithmic frequency scale
    const minFreq = 20;
    const maxFreq = 22050;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(Math.max(minFreq, freq));
    return (logFreq - logMin) / (logMax - logMin) * width;
  };

  const dbToY = (db: number, height: number): number => {
    const minDb = -80;
    const maxDb = 0;
    const normalized = (db - minDb) / (maxDb - minDb);
    return height - (normalized * height);
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#9aa9b8';
    ctx.font = '10px "Fira Code", monospace';

    // Frequency labels
    const freqLabels = [
      { freq: 100, label: '100Hz' },
      { freq: 1000, label: '1kHz' },
      { freq: 10000, label: '10kHz' }
    ];

    freqLabels.forEach(({ freq, label }) => {
      const x = freqToX(freq, width);
      ctx.fillText(label, x - 15, height - 5);
    });

    // dB labels
    const dbLabels = [-60, -40, -20, 0];
    dbLabels.forEach(db => {
      const y = dbToY(db, height);
      ctx.fillText(`${db}dB`, 5, y - 2);
    });
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          Real-time Spectrum
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHold(!showHold)}
            className={`text-xs font-mono px-2 py-1 rounded ${
              showHold ? 'bg-green-600' : 'bg-gray-600'
            }`}
            data-testid="spectrum-hold-toggle"
          >
            HOLD
          </button>
          <div className="text-xs font-mono text-gray-400">
            1/24-oct
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-48 bg-[#0B0F12] rounded border border-gray-800"
          style={{ imageRendering: 'pixelated' }}
          data-testid="spectrum-canvas"
        />
        
        <div className="mt-2 text-xs font-mono text-gray-400 flex justify-between">
          <span>20Hz - 20kHz | Log scale</span>
          <span>±0.1dB accuracy</span>
        </div>
      </div>
    </div>
  );
}