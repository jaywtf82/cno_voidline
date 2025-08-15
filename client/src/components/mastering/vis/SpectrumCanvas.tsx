
import React, { useRef, useEffect, useState } from 'react';

interface SpectrumCanvasProps {
  audioContext: AudioContext | null;
  session: any;
  activePhase: string;
  targetCorridor: string;
}

export function SpectrumCanvas({ 
  audioContext, 
  session, 
  activePhase, 
  targetCorridor 
}: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!audioContext || !session?.buffer) return;

    // Create analyzer
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 4096;
    analyzer.smoothingTimeConstant = 0.8;
    analyzerRef.current = analyzer;

    // Create source and connect
    const source = audioContext.createBufferSource();
    source.buffer = session.buffer;
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    
    setIsActive(true);
    startVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsActive(false);
    };
  }, [audioContext, session]);

  const startVisualization = () => {
    const canvas = canvasRef.current;
    const analyzer = analyzerRef.current;
    
    if (!canvas || !analyzer) return;

    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyzer.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency grid
      drawFrequencyGrid(ctx, canvas);

      // Draw 1/24-octave bars
      drawOctaveBars(ctx, canvas, dataArray, analyzer.context.sampleRate);

      // Draw log frequency line
      drawLogLine(ctx, canvas, dataArray, analyzer.context.sampleRate);

      // Draw HOLD overlay if enabled
      drawHoldOverlay(ctx, canvas);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const drawFrequencyGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const frequencies = [55, 110, 220, 440, 880, 1760, 3520, 7040];
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    frequencies.forEach(freq => {
      const x = (Math.log(freq / 20) / Math.log(20000 / 20)) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();

      // Frequency labels
      ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`, x, canvas.height - 5);
    });

    // Level grid
    const levels = [-60, -40, -20, 0];
    levels.forEach(level => {
      const y = canvas.height - ((level + 60) / 60) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();

      ctx.fillText(`${level}dB`, 10, y - 5);
    });
  };

  const drawOctaveBars = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array,
    sampleRate: number
  ) => {
    const octaveBands = generate24thOctaveBands();
    const barWidth = canvas.width / octaveBands.length;

    ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';

    octaveBands.forEach((band, index) => {
      const binStart = Math.floor((band.low * dataArray.length * 2) / sampleRate);
      const binEnd = Math.floor((band.high * dataArray.length * 2) / sampleRate);
      
      let sum = 0;
      let count = 0;
      for (let i = binStart; i <= binEnd && i < dataArray.length; i++) {
        sum += dataArray[i];
        count++;
      }
      
      const average = count > 0 ? sum / count : 0;
      const normalizedValue = average / 255;
      const barHeight = normalizedValue * canvas.height;

      const x = index * barWidth;
      const y = canvas.height - barHeight;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  };

  const drawLogLine = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dataArray: Uint8Array,
    sampleRate: number
  ) => {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < canvas.width; i++) {
      const freq = 20 * Math.pow(20000 / 20, i / canvas.width);
      const bin = Math.floor((freq * dataArray.length * 2) / sampleRate);
      
      if (bin < dataArray.length) {
        const normalizedValue = dataArray[bin] / 255;
        const y = canvas.height - (normalizedValue * canvas.height);
        
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
    }

    ctx.stroke();
  };

  const drawHoldOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Simplified HOLD overlay
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Draw hold line at -20dB
    const holdY = canvas.height - ((20 + 60) / 60) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, holdY);
    ctx.lineTo(canvas.width, holdY);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  const generate24thOctaveBands = () => {
    const bands = [];
    const startFreq = 20;
    const ratio = Math.pow(2, 1/24); // 24th octave ratio
    
    for (let i = 0; i < 240; i++) { // Cover 20Hz to 20kHz
      const centerFreq = startFreq * Math.pow(ratio, i);
      if (centerFreq > 20000) break;
      
      const low = centerFreq / Math.sqrt(ratio);
      const high = centerFreq * Math.sqrt(ratio);
      
      bands.push({ low, center: centerFreq, high });
    }
    
    return bands;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full h-64 bg-black border border-cyan-500/30 rounded"
        style={{
          filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)'
        }}
      />
      
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex space-x-2">
        <div className="bg-black/70 px-2 py-1 rounded text-xs font-mono text-cyan-400">
          FFT: 4096
        </div>
        <div className="bg-black/70 px-2 py-1 rounded text-xs font-mono text-cyan-400">
          {activePhase.toUpperCase()}
        </div>
      </div>
      
      {/* Phase-specific frequency markers */}
      {activePhase === 'frequencies' && (
        <div className="absolute bottom-2 left-2 text-xs font-mono text-yellow-400">
          EQ Focus: 2.8kHz (-1.2dB) • 12kHz (+0.8dB)
        </div>
      )}
    </div>
  );
}
