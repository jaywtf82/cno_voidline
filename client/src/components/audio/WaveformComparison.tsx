import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveformComparisonProps {
  originalFile?: File;
  processedFile?: File;
  isProcessing?: boolean;
  className?: string;
}

interface WaveformData {
  peaks: Float32Array;
  length: number;
  sampleRate: number;
  hardness: number[];
  harshness: number[];
}

export function WaveformComparison({ 
  originalFile, 
  processedFile, 
  isProcessing = false,
  className = '' 
}: WaveformComparisonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalWaveform, setOriginalWaveform] = useState<WaveformData | null>(null);
  const [processedWaveform, setProcessedWaveform] = useState<WaveformData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (originalFile) {
      analyzeAudioFile(originalFile, 'original');
    }
  }, [originalFile]);

  useEffect(() => {
    if (processedFile) {
      analyzeAudioFile(processedFile, 'processed');
    }
  }, [processedFile]);

  useEffect(() => {
    drawWaveforms();
  }, [originalWaveform, processedWaveform, isProcessing]);

  const analyzeAudioFile = async (file: File, type: 'original' | 'processed') => {
    try {
      setIsAnalyzing(true);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract peaks and analyze hardness/harshness
      const waveformData = extractWaveformData(audioBuffer);
      
      if (type === 'original') {
        setOriginalWaveform(waveformData);
      } else {
        setProcessedWaveform(waveformData);
      }
      
      await audioContext.close();
      
    } catch (error) {
      console.error(`Error analyzing ${type} audio:`, error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractWaveformData = (audioBuffer: AudioBuffer): WaveformData => {
    const samples = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(samples.length / 800); // 800 pixels wide
    const peaks = new Float32Array(800);
    const hardness: number[] = [];
    const harshness: number[] = [];
    
    for (let i = 0; i < 800; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, samples.length);
      
      let max = 0;
      let rms = 0;
      let highFreqEnergy = 0;
      
      for (let j = start; j < end; j++) {
        const sample = Math.abs(samples[j]);
        max = Math.max(max, sample);
        rms += sample * sample;
        
        // Detect high frequency content (simplified)
        if (j > start) {
          const diff = Math.abs(samples[j] - samples[j - 1]);
          highFreqEnergy += diff;
        }
      }
      
      peaks[i] = max;
      rms = Math.sqrt(rms / (end - start));
      
      // Calculate hardness (dynamic range compression)
      const dynamicRange = max > 0 ? rms / max : 0;
      hardness[i] = 1 - dynamicRange; // 0 = natural, 1 = heavily compressed
      
      // Calculate harshness (high frequency distortion)
      const avgHighFreq = highFreqEnergy / (end - start);
      harshness[i] = Math.min(1, avgHighFreq * 10); // Scaled harshness
    }
    
    return {
      peaks,
      length: audioBuffer.length,
      sampleRate: audioBuffer.sampleRate,
      hardness,
      harshness
    };
  };

  const drawWaveforms = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const waveHeight = height * 0.35;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw original waveform (top half)
    if (originalWaveform) {
      drawWaveform(ctx, originalWaveform, width, centerY - 10, waveHeight, 'original');
    }
    
    // Draw processed waveform (bottom half)
    if (processedWaveform) {
      drawWaveform(ctx, processedWaveform, width, centerY + 10, waveHeight, 'processed');
    } else if (isProcessing && originalWaveform) {
      // Show processing animation
      drawProcessingAnimation(ctx, originalWaveform, width, centerY + 10, waveHeight);
    }
    
    // Draw labels
    drawLabels(ctx, width, height);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(0, 255, 127, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Time markers (every 10 seconds)
    const timeMarkers = [10, 20, 30, 60, 120]; // seconds
    timeMarkers.forEach(time => {
      if (originalWaveform) {
        const x = (time * originalWaveform.sampleRate) / originalWaveform.length * width;
        if (x < width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
    });
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    waveform: WaveformData,
    width: number,
    centerY: number,
    maxHeight: number,
    type: 'original' | 'processed'
  ) => {
    const peaks = waveform.peaks;
    const pixelWidth = width / peaks.length;
    
    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelWidth;
      const amplitude = peaks[i] * maxHeight;
      
      // Base waveform color
      let baseColor = type === 'original' ? 'rgba(0, 255, 127, 0.8)' : 'rgba(255, 215, 0, 0.8)';
      
      // Highlight hardness (red overlay)
      if (waveform.hardness[i] > 0.7) {
        baseColor = 'rgba(255, 100, 100, 0.9)'; // Hard/compressed sections
      }
      
      // Highlight harshness (orange overlay)
      if (waveform.harshness[i] > 0.6) {
        baseColor = 'rgba(255, 150, 50, 0.9)'; // Harsh/distorted sections
      }
      
      ctx.fillStyle = baseColor;
      
      // Draw positive amplitude
      ctx.fillRect(x, centerY - amplitude, Math.max(1, pixelWidth), amplitude);
      
      // Draw negative amplitude
      ctx.fillRect(x, centerY, Math.max(1, pixelWidth), amplitude);
      
      // Add glow effect for problematic areas
      if (waveform.hardness[i] > 0.7 || waveform.harshness[i] > 0.6) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 3;
        ctx.fillRect(x, centerY - amplitude, Math.max(1, pixelWidth), amplitude * 2);
        ctx.shadowBlur = 0;
      }
    }
  };

  const drawProcessingAnimation = (
    ctx: CanvasRenderingContext2D,
    originalWaveform: WaveformData,
    width: number,
    centerY: number,
    maxHeight: number
  ) => {
    const peaks = originalWaveform.peaks;
    const pixelWidth = width / peaks.length;
    const time = Date.now() * 0.005;
    
    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelWidth;
      const amplitude = peaks[i] * maxHeight;
      
      // Processing wave effect
      const progress = (Math.sin(time + i * 0.1) + 1) / 2;
      const alpha = 0.3 + progress * 0.5;
      
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fillRect(x, centerY - amplitude, Math.max(1, pixelWidth), amplitude * 2);
    }
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 255, 127, 0.8)';
    ctx.font = '12px "Fira Code", monospace';
    
    // Waveform labels
    ctx.fillText('ORIGINAL', 10, 20);
    ctx.fillText('PROCESSED', 10, height - 10);
    
    // Legend
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.fillRect(width - 150, 10, 12, 12);
    ctx.fillStyle = 'rgba(0, 255, 127, 0.8)';
    ctx.fillText('Hard/Compressed', width - 130, 20);
    
    ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
    ctx.fillRect(width - 150, 30, 12, 12);
    ctx.fillStyle = 'rgba(0, 255, 127, 0.8)';
    ctx.fillText('Harsh/Distorted', width - 130, 40);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="bg-black/50 border border-accent-primary/30 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-mono text-sm text-accent-primary">Waveform Comparison</h4>
          <div className="text-xs font-mono text-text-muted">
            {isAnalyzing ? 'ANALYZING...' : 'READY'}
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full bg-black/30 rounded"
          style={{ 
            height: '200px',
            imageRendering: 'pixelated'
          }}
        />
        
        {(!originalWaveform && !isAnalyzing) && (
          <div className="absolute inset-4 top-12 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <div className="font-mono text-sm mb-2">Upload audio to see waveform</div>
              <div className="text-xs">Original vs Processed comparison</div>
            </div>
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <motion.div 
            className="absolute top-4 right-4 flex items-center space-x-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
            <span className="font-mono text-xs text-accent-primary">PROCESSING</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}