/**
 * DynamicEQGraph.tsx - Interactive EQ visualization with musical center snapping
 * Real-time frequency response with draggable nodes
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface EQBand {
  id: string;
  type: 'peaking' | 'highpass' | 'lowpass' | 'highshelf' | 'lowshelf';
  freq: number;
  gain: number;
  q: number;
  enabled: boolean;
}

interface DynamicEQGraphProps {
  bands: EQBand[];
  onBandChange: (bandId: string, changes: Partial<EQBand>) => void;
  onBandAdd?: (freq: number) => void;
  fftData?: Float32Array;
  theme?: 'classic' | 'terminal' | 'glass';
  showMusicalCenters?: boolean;
  autoAdjust?: boolean;
}

export const DynamicEQGraph: React.FC<DynamicEQGraphProps> = ({
  bands,
  onBandChange,
  onBandAdd,
  fftData,
  theme = 'classic',
  showMusicalCenters = true,
  autoAdjust = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<{
    bandId: string | null;
    isDragging: boolean;
    startX: number;
    startY: number;
  }>({
    bandId: null,
    isDragging: false,
    startX: 0,
    startY: 0
  });

  const themeColors = {
    classic: {
      background: 'rgba(0, 0, 0, 0.8)',
      grid: '#374151',
      curve: '#22c55e',
      node: '#16a34a',
      nodeActive: '#fbbf24',
      nodeAuto: '#f87171',
      spectrum: '#6b7280',
      musical: '#8b5cf6'
    },
    terminal: {
      background: 'rgba(0, 0, 0, 0.9)',
      grid: '#003300',
      curve: '#00ff00',
      node: '#00cc00',
      nodeActive: '#ffff00',
      nodeAuto: '#ff0000',
      spectrum: '#666666',
      musical: '#00aaff'
    },
    glass: {
      background: 'rgba(0, 0, 0, 0.6)',
      grid: '#1e40af',
      curve: '#60a5fa',
      node: '#3b82f6',
      nodeActive: '#fbbf24',
      nodeAuto: '#f87171',
      spectrum: '#6b7280',
      musical: '#8b5cf6'
    }
  };

  const colors = themeColors[theme];

  // Musical note frequencies (A4 = 440Hz)
  const musicalCenters = [
    { freq: 55, note: 'A1' },
    { freq: 110, note: 'A2' },
    { freq: 220, note: 'A3' },
    { freq: 440, note: 'A4' },
    { freq: 880, note: 'A5' },
    { freq: 1760, note: 'A6' },
    { freq: 3520, note: 'A7' },
    { freq: 82.4, note: 'E2' },
    { freq: 164.8, note: 'E3' },
    { freq: 329.6, note: 'E4' },
    { freq: 659.3, note: 'E5' },
    { freq: 1318.5, note: 'E6' },
    { freq: 146.8, note: 'D3' },
    { freq: 293.7, note: 'D4' },
    { freq: 587.3, note: 'D5' },
    { freq: 1174.7, note: 'D6' }
  ].sort((a, b) => a.freq - b.freq);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    drawEQGraph(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
  }, [bands, fftData, theme, showMusicalCenters, dragState]);

  const drawEQGraph = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Draw grid
    drawGrid(ctx, padding, padding, graphWidth, graphHeight);

    // Draw spectrum (if available)
    if (fftData) {
      drawSpectrum(ctx, padding, padding, graphWidth, graphHeight);
    }

    // Draw musical centers
    if (showMusicalCenters) {
      drawMusicalCenters(ctx, padding, padding, graphWidth, graphHeight);
    }

    // Draw frequency response curve
    drawFrequencyResponse(ctx, padding, padding, graphWidth, graphHeight);

    // Draw EQ nodes
    drawEQNodes(ctx, padding, padding, graphWidth, graphHeight);

    // Draw labels
    drawLabels(ctx, padding, padding, graphWidth, graphHeight);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // Frequency grid (logarithmic)
    const freqLines = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqLines.forEach(freq => {
      const xPos = x + freqToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(xPos, y);
      ctx.lineTo(xPos, y + height);
      ctx.stroke();
    });

    // Gain grid (linear)
    for (let gain = -20; gain <= 20; gain += 5) {
      const yPos = y + gainToY(gain, height);
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      ctx.lineTo(x + width, yPos);
      ctx.stroke();
    }

    // Center line (0dB)
    ctx.strokeStyle = colors.grid;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    const centerY = y + gainToY(0, height);
    ctx.beginPath();
    ctx.moveTo(x, centerY);
    ctx.lineTo(x + width, centerY);
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    if (!fftData || fftData.length === 0) return;

    ctx.strokeStyle = colors.spectrum;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;

    ctx.beginPath();
    for (let i = 0; i < fftData.length / 2; i++) {
      const freq = (i / (fftData.length / 2)) * 22050; // Nyquist frequency
      const magnitude = fftData[i];
      
      if (freq >= 20 && freq <= 20000) {
        const xPos = x + freqToX(freq, width);
        const yPos = y + gainToY(magnitude + 60, height); // Offset for display
        
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
    }
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawMusicalCenters = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.strokeStyle = colors.musical;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;

    musicalCenters.forEach(center => {
      if (center.freq >= 20 && center.freq <= 20000) {
        const xPos = x + freqToX(center.freq, width);
        
        ctx.beginPath();
        ctx.moveTo(xPos, y);
        ctx.lineTo(xPos, y + height);
        ctx.stroke();

        // Note label
        ctx.fillStyle = colors.musical;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(center.note, xPos, y - 5);
      }
    });

    ctx.globalAlpha = 1;
  };

  const drawFrequencyResponse = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.strokeStyle = colors.curve;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    for (let i = 0; i <= width; i++) {
      const freq = xToFreq(i, width);
      const totalGain = calculateFrequencyResponse(freq);
      const yPos = y + gainToY(totalGain, height);
      
      if (i === 0) {
        ctx.moveTo(x + i, yPos);
      } else {
        ctx.lineTo(x + i, yPos);
      }
    }
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawEQNodes = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    bands.forEach(band => {
      if (!band.enabled) return;

      const xPos = x + freqToX(band.freq, width);
      const yPos = y + gainToY(band.gain, height);
      
      // Node color based on state
      let nodeColor = colors.node;
      if (autoAdjust) {
        nodeColor = colors.nodeAuto;
      }
      if (dragState.bandId === band.id) {
        nodeColor = colors.nodeActive;
      }

      // Node size based on Q factor
      const nodeSize = Math.max(6, Math.min(20, 15 - band.q));

      // Glow effect
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(xPos, yPos, nodeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Q indicator (circle around node)
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      const qRadius = nodeSize + band.q * 3;
      ctx.beginPath();
      ctx.arc(xPos, yPos, qRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Frequency label
      ctx.fillStyle = nodeColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 1;
      ctx.fillText(
        `${formatFrequency(band.freq)}`,
        xPos,
        yPos - nodeSize - 15
      );

      // Gain label
      ctx.fillText(
        `${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)}dB`,
        xPos,
        yPos + nodeSize + 20
      );
    });
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = colors.grid;
    ctx.font = '12px monospace';

    // Frequency labels
    ctx.textAlign = 'center';
    const freqLabels = [100, 1000, 10000];
    freqLabels.forEach(freq => {
      const xPos = x + freqToX(freq, width);
      ctx.fillText(formatFrequency(freq), xPos, y + height + 25);
    });

    // Gain labels
    ctx.textAlign = 'right';
    const gainLabels = [-15, -10, -5, 0, 5, 10, 15];
    gainLabels.forEach(gain => {
      const yPos = y + gainToY(gain, height);
      ctx.fillText(`${gain > 0 ? '+' : ''}${gain}`, x - 10, yPos + 4);
    });

    // Axis labels
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz)', x + width / 2, y + height + 40);
    
    ctx.save();
    ctx.translate(15, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Gain (dB)', 0, 0);
    ctx.restore();
  };

  const freqToX = (freq: number, width: number): number => {
    const logMin = Math.log10(20);
    const logMax = Math.log10(20000);
    const logFreq = Math.log10(freq);
    return ((logFreq - logMin) / (logMax - logMin)) * width;
  };

  const xToFreq = (x: number, width: number): number => {
    const logMin = Math.log10(20);
    const logMax = Math.log10(20000);
    const logFreq = logMin + (x / width) * (logMax - logMin);
    return Math.pow(10, logFreq);
  };

  const gainToY = (gain: number, height: number): number => {
    const minGain = -20;
    const maxGain = 20;
    return height - ((gain - minGain) / (maxGain - minGain)) * height;
  };

  const yToGain = (y: number, height: number): number => {
    const minGain = -20;
    const maxGain = 20;
    return minGain + ((height - y) / height) * (maxGain - minGain);
  };

  const calculateFrequencyResponse = (freq: number): number => {
    let totalGain = 0;
    
    bands.forEach(band => {
      if (!band.enabled) return;
      
      // Simplified biquad response calculation
      const omega = 2 * Math.PI * freq / 48000;
      const freqRatio = freq / band.freq;
      
      if (band.type === 'peaking') {
        const q = band.q;
        const gain = band.gain;
        
        // Approximate peaking filter response
        const bandwidth = 1 / q;
        const distance = Math.abs(Math.log2(freqRatio));
        
        if (distance < bandwidth) {
          const factor = Math.cos((distance / bandwidth) * Math.PI / 2);
          totalGain += gain * factor * factor;
        }
      }
    });
    
    return totalGain;
  };

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq >= 10000 ? 0 : 1)}k`;
    }
    return `${Math.round(freq)}`;
  };

  const findNearestMusicalCenter = (freq: number): number => {
    let nearest = musicalCenters[0];
    let minDistance = Math.abs(freq - nearest.freq);
    
    musicalCenters.forEach(center => {
      const distance = Math.abs(freq - center.freq);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = center;
      }
    });
    
    // Snap if within 10% of the musical center
    if (minDistance / freq < 0.1) {
      return nearest.freq;
    }
    
    return freq;
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - 40; // Account for padding
    const y = event.clientY - rect.top - 40;
    const width = rect.width - 80;
    const height = rect.height - 80;

    // Check if clicking on an existing node
    for (const band of bands) {
      const nodeX = freqToX(band.freq, width);
      const nodeY = gainToY(band.gain, height);
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      
      if (distance < 20) {
        setDragState({
          bandId: band.id,
          isDragging: true,
          startX: x,
          startY: y
        });
        return;
      }
    }

    // Add new band if not clicking on existing node
    if (onBandAdd) {
      const freq = xToFreq(x, width);
      const snappedFreq = showMusicalCenters ? findNearestMusicalCenter(freq) : freq;
      onBandAdd(snappedFreq);
    }
  }, [bands, onBandAdd, showMusicalCenters]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !dragState.bandId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - 40;
    const y = event.clientY - rect.top - 40;
    const width = rect.width - 80;
    const height = rect.height - 80;

    const freq = Math.max(20, Math.min(20000, xToFreq(x, width)));
    const gain = Math.max(-20, Math.min(20, yToGain(y, height)));
    
    const snappedFreq = showMusicalCenters ? findNearestMusicalCenter(freq) : freq;

    onBandChange(dragState.bandId, {
      freq: snappedFreq,
      gain: Math.round(gain * 10) / 10 // Round to 0.1dB
    });
  }, [dragState, onBandChange, showMusicalCenters]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      bandId: null,
      isDragging: false,
      startX: 0,
      startY: 0
    });
  }, []);

  return (
    <div className="relative w-full h-80 bg-black/20 rounded-lg overflow-hidden border border-gray-700">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 text-xs font-mono text-green-400">
        <div>Dynamic EQ Graph</div>
        <div className="text-gray-400">
          {bands.filter(b => b.enabled).length} active bands
        </div>
      </div>

      {/* Helper lines toggle */}
      <div className="absolute top-4 right-4 text-xs font-mono">
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={showMusicalCenters}
            onChange={(e) => {/* Update parent state */}}
            className="w-3 h-3"
          />
          Musical Centers
        </label>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-gray-600 space-y-1">
        <div>• Click to add EQ band</div>
        <div>• Drag nodes to adjust</div>
        <div>• Scroll wheel to change Q</div>
      </div>
    </div>
  );
};