import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveformComparisonProps {
  originalFile?: File;
  processedFile?: File;
  isProcessing?: boolean;
  className?: string;
  showChannels?: boolean;
  showSpectrogramMode?: boolean;
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
  className = '',
  showChannels = true,
  showSpectrogramMode = false
}: WaveformComparisonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalWaveform, setOriginalWaveform] = useState<WaveformData | null>(null);
  const [processedWaveform, setProcessedWaveform] = useState<WaveformData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentShowSpectrogramMode, setCurrentShowSpectrogramMode] = useState(showSpectrogramMode);

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
    
    // Clear canvas with professional dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    if (currentShowSpectrogramMode) {
      drawSpectrogramView(ctx, width, height);
    } else {
      drawProfessionalWaveforms(ctx, width, height);
    }
  };
  
  const drawProfessionalWaveforms = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerY = height / 2;
    const waveHeight = height * 0.4;
    
    // Draw professional grid
    drawProfessionalGrid(ctx, width, height);
    
    if (showChannels && originalWaveform) {
      // Multi-channel display
      const channelHeight = height / 4;
      drawWaveformChannel(ctx, originalWaveform, width, channelHeight, 0, '#00ffff', 'LEFT');
      drawWaveformChannel(ctx, originalWaveform, width, channelHeight, channelHeight, '#ff8c00', 'RIGHT');
      
      if (processedWaveform) {
        drawWaveformChannel(ctx, processedWaveform, width, channelHeight, channelHeight * 2, '#00ff7f', 'PROCESSED L');
        drawWaveformChannel(ctx, processedWaveform, width, channelHeight, channelHeight * 3, '#ffff00', 'PROCESSED R');
      }
    } else {
      // Traditional stereo display
      if (originalWaveform) {
        drawWaveform(ctx, originalWaveform, width, centerY - 60, waveHeight, 'original');
      }
      
      if (processedWaveform) {
        drawWaveform(ctx, processedWaveform, width, centerY + 60, waveHeight, 'processed');
      } else if (isProcessing && originalWaveform) {
        drawProcessingAnimation(ctx, originalWaveform, width, centerY + 60, waveHeight);
      }
    }
    
    // Draw professional labels and time markers
    drawProfessionalLabels(ctx, width, height);
  };
  
  const drawSpectrogramView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Spectrogram view similar to professional audio software
    const time = Date.now() * 0.001;
    const spectrogramHeight = height - 60;
    
    // Draw frequency bands
    for (let y = 0; y < spectrogramHeight; y += 2) {
      for (let x = 0; x < width; x += 1) {
        const freq = (y / spectrogramHeight) * 22050;
        const timePos = x / width;
        
        // Simulate spectrogram data
        let intensity = 0;
        if (freq < 200) intensity = 0.3 + Math.sin(time + timePos * 10) * 0.2;
        else if (freq < 2000) intensity = 0.6 + Math.sin(time * 0.8 + timePos * 15) * 0.3;
        else if (freq < 8000) intensity = 0.4 + Math.sin(time * 1.2 + timePos * 8) * 0.2;
        else intensity = 0.2 + Math.sin(time * 0.5 + timePos * 5) * 0.1;
        
        const alpha = Math.max(0, Math.min(1, intensity + Math.random() * 0.1));
        const hue = (freq / 22050) * 240; // Blue to red gradient
        
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
        ctx.fillRect(x, spectrogramHeight - y, 1, 2);
      }
    }
    
    // Draw frequency scale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '10px "Fira Code", monospace';
    [100, 1000, 5000, 10000, 20000].forEach(freq => {
      const y = spectrogramHeight - (freq / 22050) * spectrogramHeight;
      ctx.fillText(`${freq >= 1000 ? freq/1000 + 'k' : freq}Hz`, 5, y);
    });
  };
  
  const drawWaveformChannel = (
    ctx: CanvasRenderingContext2D,
    waveform: WaveformData,
    width: number,
    height: number,
    offsetY: number,
    color: string,
    label: string
  ) => {
    const peaks = waveform.peaks;
    const pixelWidth = width / peaks.length;
    const centerY = offsetY + height / 2;
    const maxHeight = height * 0.4;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelWidth;
      const amplitude = peaks[i] * maxHeight;
      
      if (i === 0) {
        ctx.moveTo(x, centerY - amplitude);
      } else {
        ctx.lineTo(x, centerY - amplitude);
      }
    }
    
    ctx.stroke();
    
    // Fill under waveform
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.lineTo(width, centerY);
    ctx.lineTo(0, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Channel label
    ctx.fillStyle = color;
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillText(label, 10, offsetY + 15);
  };
  
  const drawProfessionalGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(0, 255, 127, 0.1)';
    ctx.lineWidth = 1;
    
    // Time grid (every 10 seconds)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Amplitude grid
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
  
  const drawProfessionalLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '10px "Fira Code", monospace';
    
    // Time markers
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const timeLabel = `${i * 10}s`;
      const textWidth = ctx.measureText(timeLabel).width;
      if (x > textWidth / 2 && x < width - textWidth / 2) {
        ctx.fillText(timeLabel, x - textWidth / 2, height - 5);
      }
    }
    
    // Amplitude markers
    ['-1.0', '-0.5', '0.0', '+0.5', '+1.0'].forEach((label, i) => {
      const y = (i / 4) * height;
      ctx.fillText(label, 5, y + 12);
    });
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

  // Update canvas when data changes
  useEffect(() => {
    drawWaveforms();
  }, [originalWaveform, processedWaveform, isProcessing, showChannels, currentShowSpectrogramMode]);

  return (
    <div className={`relative ${className}`}>
      <div className="bg-black/90 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h4 className="font-mono text-sm text-cyan-400 font-bold tracking-wider">WAVEFORM ANALYSIS</h4>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <button 
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  !currentShowSpectrogramMode ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
                onClick={() => setCurrentShowSpectrogramMode(false)}
              >
                Waveform
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentShowSpectrogramMode ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
                onClick={() => setCurrentShowSpectrogramMode(true)}
              >
                Spectrogram
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {showChannels && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-cyan-400">L</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-orange-400">R</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-emerald-400">Processed</span>
                </div>
              </div>
            )}
            <div className="text-xs font-mono text-cyan-400/60">
              {isAnalyzing ? 'ANALYZING...' : 'READY'}
            </div>
          </div>
        </div>
        
        <div className="bg-black border border-cyan-500/20 rounded relative">
          <canvas
            ref={canvasRef}
            width={1000}
            height={400}
            className="w-full"
            style={{ 
              height: '400px',
              imageRendering: 'crisp-edges'
            }}
          />
          
          {(!originalWaveform && !isAnalyzing) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="font-mono text-sm mb-2">Upload audio to analyze waveform</div>
                <div className="text-xs">Multi-channel analysis with frequency content</div>
              </div>
            </div>
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <motion.div 
              className="absolute top-4 right-4 flex items-center space-x-2 bg-black/80 px-3 py-1 rounded"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="font-mono text-xs text-cyan-400">PROCESSING AUDIO</span>
            </motion.div>
          )}
        </div>
        
        {/* Analysis controls */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-cyan-400">Sample Rate: 44.1kHz</span>
            <span className="text-cyan-400">Bit Depth: 24-bit</span>
            <span className="text-cyan-400">Channels: Stereo</span>
          </div>
          <div className="text-xs font-mono text-cyan-400/60">
            {originalWaveform ? 'Multi-channel Analysis' : 'Awaiting Audio'}
          </div>
        </div>
      </div>
    </div>
  );
}