import React, { useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSessionStore } from '@/state/useSessionStore';

interface MasteringSpectrumProps {
  fftA: Float32Array | null;
  fftB: Float32Array | null;
  monitor: 'A' | 'B';
  sampleRate: number;
}

export function MasteringSpectrum({ fftA, fftB, monitor, sampleRate }: MasteringSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase2Source = useSessionStore(s => s.phase2Source);
  const isProcessed = phase2Source === 'post';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const nyquist = sampleRate / 2;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#0a4d2a';
    ctx.lineWidth = 1;
    
    // Frequency grid (octaves: 100Hz, 200Hz, 500Hz, 1kHz, 2kHz, 5kHz, 10kHz, 20kHz)
    const freqMarkers = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqMarkers.forEach(freq => {
      if (freq < nyquist) {
        const x = Math.log10(freq / 20) / Math.log10(nyquist / 20) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#10b981';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        let label = freq >= 1000 ? `${freq/1000}k` : `${freq}`;
        ctx.fillText(label, x, height - 5);
      }
    });

    // dB grid (-60, -40, -20, 0 dB)
    ctx.strokeStyle = '#0a4d2a';
    [-60, -40, -20, 0].forEach(db => {
      const y = height - (db + 60) / 60 * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${db}dB`, width - 5, y - 2);
    });

    // Draw spectrum data
    const currentFFT = monitor === 'A' ? fftA : fftB;
    const otherFFT = monitor === 'A' ? fftB : fftA;
    
    if (currentFFT && currentFFT.length > 0) {
      // Draw background spectrum (other channel) in darker color
      if (otherFFT && otherFFT.length > 0) {
        ctx.strokeStyle = isProcessed ? '#7c2d12' : '#064e3b';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        drawSpectrum(ctx, otherFFT, width, height, nyquist);
      }

      // Draw main spectrum (current monitor)
      ctx.strokeStyle = isProcessed ? '#fb923c' : '#10b981';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1.0;
      drawSpectrum(ctx, currentFFT, width, height, nyquist);
    }

  }, [fftA, fftB, monitor, sampleRate, isProcessed]);

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D, 
    fft: Float32Array, 
    width: number, 
    height: number, 
    nyquist: number
  ) => {
    ctx.beginPath();
    
    for (let i = 1; i < fft.length; i++) {
      const freq = (i / fft.length) * nyquist;
      const magnitude = fft[i];
      
      // Convert to log frequency scale
      const x = Math.log10(Math.max(freq, 20) / 20) / Math.log10(nyquist / 20) * width;
      
      // Convert magnitude to dB and map to canvas height
      const db = Math.max(-60, 20 * Math.log10(Math.max(magnitude, 1e-6)));
      const y = height - (db + 60) / 60 * height;
      
      if (i === 1) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  return (
    <div className="relative">
      {isProcessed && (
        <div className="absolute top-2 left-2">
          <Badge className="bg-orange-600 text-white">PROCESSED</Badge>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={512}
        height={256}
        className="w-full h-64 bg-black border border-green-800 rounded"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Monitor indicator */}
      <div className="absolute top-2 right-2 bg-gray-900 px-2 py-1 rounded text-xs font-mono">
        <span className="text-green-300">MONITOR:</span>
        <span className={`ml-1 font-bold ${monitor === 'A' ? 'text-blue-400' : 'text-orange-400'}`}>
          {monitor}
        </span>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-2 left-2 text-xs font-mono text-green-300">
        {(fftA || fftB) ? 'ACTIVE' : 'NO SIGNAL'}
      </div>
    </div>
  );
}