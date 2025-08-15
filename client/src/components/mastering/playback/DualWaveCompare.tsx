import React, { useRef, useEffect, useState } from 'react';
import { useMasteringStore } from '@/state/masteringStore';

export interface DualWaveCompareProps {
  sessionId: string;
  abState: 'A' | 'B' | 'bypass' | 'delta' | 'null';
  showOverlays: boolean;
}

export function DualWaveCompare({ sessionId, abState, showOverlays }: DualWaveCompareProps) {
  const { currentSession } = useMasteringStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    drawWaveforms();
  }, [currentSession, abState, showOverlays, dimensions]);

  const drawWaveforms = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentSession?.buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = 'rgb(11, 15, 18)';
    ctx.fillRect(0, 0, width, height);

    const buffer = currentSession.buffer;
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;

    // Draw original waveform (A)
    drawWaveform(ctx, leftChannel, 0, height / 2 - 20, width, height / 2 - 40, '#3FB950', 0.6);
    
    // Draw processed waveform (B) - simulate processing for now
    const processedLeft = simulateProcessing(leftChannel, abState);
    drawWaveform(ctx, processedLeft, 0, height / 2 + 20, width, height / 2 - 40, '#22c55e', 0.8);

    // Draw labels
    ctx.fillStyle = '#9aa9b8';
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillText('Original (A)', 10, 20);
    ctx.fillText('Processed (B)', 10, height / 2 + 40);

    // Draw overlays if enabled
    if (showOverlays) {
      drawOverlays(ctx, leftChannel, processedLeft, width, height);
    }

    // Draw current state indicator
    drawStateIndicator(ctx, abState, width, height);
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    alpha: number
  ) => {
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const yMin = y + (1 + min) * amp;
      const yMax = y + (1 + max) * amp;

      if (i === 0) {
        ctx.moveTo(x + i, yMin);
      } else {
        ctx.lineTo(x + i, yMin);
      }
      ctx.lineTo(x + i, yMax);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const simulateProcessing = (input: Float32Array, state: string): Float32Array => {
    if (state === 'A' || state === 'bypass') return input;
    
    const output = new Float32Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      let sample = input[i];
      
      switch (state) {
        case 'B':
          // Simulate light compression and EQ
          sample *= 0.95; // Slight gain reduction
          sample = Math.tanh(sample * 1.1); // Soft saturation
          break;
        case 'delta':
          // Show difference
          sample = (sample - input[i]) * 10; // Amplify difference
          break;
        case 'null':
          // Should be near-silence when perfectly matched
          sample = (sample - input[i]) * 100; // Show any mismatch
          break;
      }
      
      output[i] = Math.max(-1, Math.min(1, sample));
    }
    
    return output;
  };

  const drawOverlays = (
    ctx: CanvasRenderingContext2D,
    original: Float32Array,
    processed: Float32Array,
    width: number,
    height: number
  ) => {
    // Draw peak indicators
    const peaks = findPeaks(processed, 0.9);
    ctx.fillStyle = '#ff5f56';
    peaks.forEach(peak => {
      const x = (peak / processed.length) * width;
      ctx.fillRect(x - 1, 0, 2, height);
    });

    // Draw hardness/PSR overlay (simplified)
    const psr = calculatePSR(processed);
    ctx.fillStyle = `rgba(255, 189, 46, ${Math.min(psr / 20, 0.5)})`;
    ctx.fillRect(width - 100, 10, 80, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillText(`PSR: ${psr.toFixed(1)}`, width - 95, 25);
  };

  const findPeaks = (data: Float32Array, threshold: number): number[] => {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (Math.abs(data[i]) > threshold && 
          Math.abs(data[i]) > Math.abs(data[i-1]) && 
          Math.abs(data[i]) > Math.abs(data[i+1])) {
        peaks.push(i);
      }
    }
    return peaks;
  };

  const calculatePSR = (data: Float32Array): number => {
    let sumSquares = 0;
    let peak = 0;
    
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
      sumSquares += data[i] * data[i];
    }
    
    const rms = Math.sqrt(sumSquares / data.length);
    return 20 * Math.log10(peak / (rms + 1e-10));
  };

  const drawStateIndicator = (
    ctx: CanvasRenderingContext2D,
    state: string,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width - 80, height - 30, 70, 20);
    
    ctx.fillStyle = '#3FB950';
    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.fillText(state.toUpperCase(), width - 75, height - 15);
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          Dual Waveform Comparison
        </div>
        <div className="text-xs font-mono text-gray-400">
          {abState.toUpperCase()} Mode
        </div>
      </div>
      
      <div className="p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-48 bg-[#0B0F12] rounded border border-gray-800"
          style={{ imageRendering: 'pixelated' }}
          data-testid="dual-wave-canvas"
        />
        
        {showOverlays && (
          <div className="mt-2 text-xs font-mono text-gray-400 flex justify-between">
            <span>Peak indicators (red) | PSR overlay (yellow)</span>
            <span>ISP markers enabled</span>
          </div>
        )}
      </div>
    </div>
  );
}