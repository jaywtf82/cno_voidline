import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpectrumAnalyzerProps {
  audioFile?: File;
  isActive?: boolean;
  className?: string;
}

export function SpectrumAnalyzer({ audioFile, isActive = false, className = '' }: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const sourceRef = useRef<AudioBufferSourceNode>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(256));

  useEffect(() => {
    if (audioFile && isActive) {
      initializeAudio();
    }
    
    return () => {
      cleanup();
    };
  }, [audioFile, isActive]);

  const initializeAudio = async () => {
    try {
      if (!audioFile) return;
      
      setIsAnalyzing(true);
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.85;
      
      // Load and decode audio file
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create source and connect
      sourceRef.current = audioContext.createBufferSource();
      sourceRef.current.buffer = audioBuffer;
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
      
      // Start analysis loop
      startVisualization();
      
    } catch (error) {
      console.error('Error initializing audio:', error);
      setIsAnalyzing(false);
    }
  };

  const startVisualization = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const animate = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray));
      drawSpectrum(dataArray);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const drawSpectrum = (dataArray: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw spectrum bars
    const barWidth = width / dataArray.length;
    const barGap = 1;
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.8;
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Color based on frequency range
      let hue = 120; // Green for low frequencies
      if (i > dataArray.length * 0.3) hue = 60; // Yellow for mid
      if (i > dataArray.length * 0.7) hue = 0; // Red for high
      
      const alpha = 0.3 + (dataArray[i] / 255) * 0.7;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
      
      // Draw bar with glow effect
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 5;
      ctx.fillRect(x, y, barWidth - barGap, barHeight);
      ctx.shadowBlur = 0;
    }
    
    // Draw frequency grid lines
    ctx.strokeStyle = 'rgba(0, 255, 127, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal lines (dB levels)
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical lines (frequency markers)
    const freqMarkers = [100, 1000, 10000]; // Hz
    const nyquist = 22050; // Assuming 44.1kHz sample rate
    
    freqMarkers.forEach(freq => {
      const x = (freq / nyquist) * width;
      if (x < width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    });
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsAnalyzing(false);
  };

  // Fallback visualization when no audio
  const generateFallbackData = () => {
    return Array.from({ length: 32 }, (_, i) => {
      const base = Math.sin(Date.now() * 0.001 + i * 0.2) * 50 + 50;
      const noise = Math.random() * 20;
      return Math.max(10, Math.min(90, base + noise));
    });
  };

  const fallbackData = generateFallbackData();

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-black/50 border border-accent-primary/30 rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-mono text-sm text-accent-primary">Spectrum Analyzer</h4>
          <div className="text-xs font-mono text-text-muted">
            {isAnalyzing ? 'LIVE' : 'DEMO'}
          </div>
        </div>
        
        {/* Real-time canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full h-full"
          style={{ 
            background: 'transparent',
            imageRendering: 'pixelated'
          }}
        />
        
        {/* Fallback visualization */}
        {!isAnalyzing && (
          <div className="absolute inset-4 top-8 flex items-end space-x-1">
            {fallbackData.map((height, i) => (
              <motion.div
                key={i}
                className="bg-accent-primary/60 flex-1 rounded-t"
                style={{ height: `${height}%` }}
                animate={{ 
                  height: `${height + Math.sin(Date.now() * 0.002 + i * 0.3) * 10}%`,
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        )}
        
        {/* Frequency labels */}
        <div className="absolute bottom-1 left-4 right-4 flex justify-between text-xs font-mono text-text-muted">
          <span>20Hz</span>
          <span>1kHz</span>
          <span>20kHz</span>
        </div>
      </div>
    </div>
  );
}