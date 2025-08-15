import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpectrumAnalyzerProps {
  audioFile?: File;
  isActive?: boolean;
  className?: string;
  showChannels?: boolean;
  mode?: 'instant' | 'peak' | 'average';
}

export function SpectrumAnalyzer({ 
  audioFile, 
  isActive = false, 
  className = '', 
  showChannels = true,
  mode = 'instant'
}: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserLeftRef = useRef<AnalyserNode>();
  const analyserRightRef = useRef<AnalyserNode>();
  const sourceRef = useRef<AudioBufferSourceNode>();
  const splitterRef = useRef<ChannelSplitterNode>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [leftChannelData, setLeftChannelData] = useState<Uint8Array>(new Uint8Array(512));
  const [rightChannelData, setRightChannelData] = useState<Uint8Array>(new Uint8Array(512));
  const [peakData, setPeakData] = useState<Float32Array>(new Float32Array(512));

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
      
      // Create analysers for stereo channels
      analyserLeftRef.current = audioContext.createAnalyser();
      analyserRightRef.current = audioContext.createAnalyser();
      
      analyserLeftRef.current.fftSize = 1024;
      analyserRightRef.current.fftSize = 1024;
      analyserLeftRef.current.smoothingTimeConstant = 0.3;
      analyserRightRef.current.smoothingTimeConstant = 0.3;
      
      // Create channel splitter
      splitterRef.current = audioContext.createChannelSplitter(2);
      
      // Load and decode audio file
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create source and connect
      sourceRef.current = audioContext.createBufferSource();
      sourceRef.current.buffer = audioBuffer;
      
      // Connect audio graph
      sourceRef.current.connect(splitterRef.current);
      splitterRef.current.connect(analyserLeftRef.current, 0);
      splitterRef.current.connect(analyserRightRef.current, 1);
      
      // Connect to destination for playback
      sourceRef.current.connect(audioContext.destination);
      
      // Start analysis loop
      startVisualization();
      
    } catch (error) {
      console.error('Error initializing audio:', error);
      setIsAnalyzing(false);
    }
  };

  const startVisualization = () => {
    if (!analyserLeftRef.current || !analyserRightRef.current) return;
    
    const bufferLength = analyserLeftRef.current.frequencyBinCount;
    const leftData = new Uint8Array(bufferLength);
    const rightData = new Uint8Array(bufferLength);
    
    const animate = () => {
      if (!analyserLeftRef.current || !analyserRightRef.current || !canvasRef.current) return;
      
      analyserLeftRef.current.getByteFrequencyData(leftData);
      analyserRightRef.current.getByteFrequencyData(rightData);
      
      setLeftChannelData(new Uint8Array(leftData));
      setRightChannelData(new Uint8Array(rightData));
      
      drawProfessionalSpectrum(leftData, rightData);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const drawProfessionalSpectrum = (leftData: Uint8Array, rightData: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw professional grid
    drawProfessionalGrid(ctx, width, height);
    
    // Draw frequency response curves
    if (showChannels) {
      drawFrequencyResponse(ctx, leftData, width, height, '#00ffff', 'Left'); // Cyan for left
      drawFrequencyResponse(ctx, rightData, width, height, '#ff8c00', 'Right'); // Orange for right
    } else {
      // Combine channels for mono display
      const combinedData = new Uint8Array(leftData.length);
      for (let i = 0; i < leftData.length; i++) {
        combinedData[i] = Math.max(leftData[i], rightData[i]);
      }
      drawFrequencyResponse(ctx, combinedData, width, height, '#00ff7f', 'Average');
    }
    
    // Draw frequency and dB labels
    drawFrequencyLabels(ctx, width, height);
  };
  
  const drawProfessionalGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(0, 255, 127, 0.15)';
    ctx.lineWidth = 1;
    
    // Horizontal dB lines (-90, -60, -30, 0 dB)
    const dbLevels = [-90, -60, -30, 0];
    dbLevels.forEach(db => {
      const y = height - ((db + 90) / 90) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // dB labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`${db} dB`, 5, y - 2);
    });
    
    // Vertical frequency lines (logarithmic scale)
    const freqMarkers = [10, 22, 47, 100, 220, 470, 1000, 2200, 4700, 10000, 22000];
    const logScale = (freq: number) => {
      const minLog = Math.log10(10);
      const maxLog = Math.log10(22000);
      return (Math.log10(freq) - minLog) / (maxLog - minLog) * width;
    };
    
    freqMarkers.forEach(freq => {
      const x = logScale(freq);
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    });
  };
  
  const drawFrequencyResponse = (
    ctx: CanvasRenderingContext2D, 
    data: Uint8Array, 
    width: number, 
    height: number, 
    color: string,
    label: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;
    
    // Use logarithmic frequency scale
    const logScale = (index: number) => {
      const freq = (index / data.length) * 22050; // Assuming 44.1kHz sample rate
      const minLog = Math.log10(10);
      const maxLog = Math.log10(22000);
      return Math.max(0, (Math.log10(Math.max(10, freq)) - minLog) / (maxLog - minLog) * width);
    };
    
    ctx.beginPath();
    
    for (let i = 1; i < data.length / 2; i++) { // Only use first half (up to Nyquist)
      const x = logScale(i);
      const dbValue = data[i] > 0 ? 20 * Math.log10(data[i] / 255) : -90;
      const y = height - ((dbValue + 90) / 90) * height;
      
      if (i === 1) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Add filled area under curve with transparency
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = color;
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  
  const drawFrequencyLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '10px "Fira Code", monospace';
    
    const freqLabels = [10, 22, 47, 100, 220, 470, 1000, 2200, 4700, 10000, 22000];
    const logScale = (freq: number) => {
      const minLog = Math.log10(10);
      const maxLog = Math.log10(22000);
      return (Math.log10(freq) - minLog) / (maxLog - minLog) * width;
    };
    
    freqLabels.forEach(freq => {
      const x = logScale(freq);
      if (x >= 30 && x <= width - 30) {
        const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillText(label, x - textWidth / 2, height - 5);
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

  // Professional fallback visualization
  const generateProfessionalFallbackData = () => {
    const time = Date.now() * 0.001;
    return Array.from({ length: 512 }, (_, i) => {
      const freq = (i / 512) * 22050;
      let amplitude = 0;
      
      // Simulate realistic frequency response
      if (freq < 60) {
        amplitude = 30 + Math.sin(time + i * 0.1) * 15; // Low frequencies
      } else if (freq < 250) {
        amplitude = 60 + Math.sin(time * 0.8 + i * 0.05) * 20; // Low-mid
      } else if (freq < 2000) {
        amplitude = 80 + Math.sin(time * 1.2 + i * 0.03) * 25; // Mid frequencies
      } else if (freq < 8000) {
        amplitude = 65 + Math.sin(time * 0.6 + i * 0.02) * 20; // High-mid
      } else {
        amplitude = 40 + Math.sin(time * 0.4 + i * 0.01) * 15; // High frequencies
      }
      
      return Math.max(5, Math.min(255, amplitude + Math.random() * 10));
    });
  };

  const fallbackLeftData = generateProfessionalFallbackData();
  const fallbackRightData = generateProfessionalFallbackData().map(v => v * 0.9 + Math.random() * 10);

  // Update canvas when data changes
  useEffect(() => {
    if (!isAnalyzing) {
      // Draw fallback data
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawProfessionalSpectrum(
            new Uint8Array(fallbackLeftData), 
            new Uint8Array(fallbackRightData)
          );
        }
      }
    }
  }, [isAnalyzing]);

  return (
    <div className={`relative ${className}`}>
      <div className="bg-black/90 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h4 className="font-mono text-sm text-cyan-400 font-bold tracking-wider">SPECTRUM ANALYZER</h4>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <button 
                className={`px-2 py-1 rounded text-xs ${
                  mode === 'instant' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'
                }`}
              >
                Instant
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${
                  mode === 'peak' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'
                }`}
              >
                Peak
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${
                  mode === 'average' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'
                }`}
              >
                Average
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {showChannels && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-cyan-400">Left</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-orange-400">Right</span>
                </div>
              </div>
            )}
            <div className="text-xs font-mono text-cyan-400/60">
              {isAnalyzing ? 'LIVE' : 'DEMO'}
            </div>
          </div>
        </div>
        
        {/* Professional spectrum canvas */}
        <div className="bg-black border border-cyan-500/20 rounded relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full"
            style={{ 
              height: '300px',
              imageRendering: 'crisp-edges'
            }}
          />
          
          {/* Channel display controls */}
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            <button 
              className="text-xs font-mono text-cyan-400/60 hover:text-cyan-400"
              onClick={() => {}}
            >
              ⊡ Left
            </button>
            <button 
              className="text-xs font-mono text-orange-400/60 hover:text-orange-400"
              onClick={() => {}}
            >
              ⊡ Right
            </button>
            <button 
              className="text-xs font-mono text-emerald-400/60 hover:text-emerald-400"
              onClick={() => {}}
            >
              ⊡ Max
            </button>
            <button 
              className="text-xs font-mono text-yellow-400/60 hover:text-yellow-400"
              onClick={() => {}}
            >
              ⊡ Average
            </button>
          </div>
        </div>
        
        {/* Analysis status */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-cyan-400">FFT: 1024</span>
            <span className="text-cyan-400">Window: Hann</span>
            <span className="text-cyan-400">Overlap: 75%</span>
          </div>
          <div className="text-xs font-mono text-cyan-400/60">
            {isAnalyzing ? 'Real-time Analysis' : 'Demo Mode'}
          </div>
        </div>
      </div>
    </div>
  );
}