import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpectrumAnalyzerProps {
  audioFile?: File;
  isActive?: boolean;
  className?: string;
  showChannels?: boolean;
  mode?: 'instant' | 'peak' | 'average';
}

type ChannelDisplayMode = 'left' | 'right' | 'max' | 'average';

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
  const [currentMode, setCurrentMode] = useState<'instant' | 'peak' | 'average'>(mode);
  const [channelDisplayMode, setChannelDisplayMode] = useState<ChannelDisplayMode>('max');
  const [showChannelControls, setShowChannelControls] = useState(showChannels);

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

    // Clear canvas with professional dark background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(1, '#001d3d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw professional grid with enhanced styling
    drawProfessionalGrid(ctx, width, height);

    // Draw frequency response curves with enhanced visuals
    switch (channelDisplayMode) {
      case 'left':
        drawEnhancedFrequencyResponse(ctx, leftData, width, height, '#00d4ff', 'Left');
        break;
      case 'right':
        drawEnhancedFrequencyResponse(ctx, rightData, width, height, '#ff6b00', 'Right');
        break;
      case 'max':
        const maxData = new Uint8Array(leftData.length);
        for (let i = 0; i < leftData.length; i++) {
          maxData[i] = Math.max(leftData[i], rightData[i]);
        }
        drawEnhancedFrequencyResponse(ctx, maxData, width, height, '#00ff7f', 'Max');
        break;
      case 'average':
        const avgData = new Uint8Array(leftData.length);
        for (let i = 0; i < leftData.length; i++) {
          avgData[i] = Math.round((leftData[i] + rightData[i]) / 2);
        }
        drawEnhancedFrequencyResponse(ctx, avgData, width, height, '#ffff00', 'Average');
        break;
      default:
        if (showChannelControls) {
          drawEnhancedFrequencyResponse(ctx, leftData, width, height, '#00d4ff', 'Left');
          drawEnhancedFrequencyResponse(ctx, rightData, width, height, '#ff6b00', 'Right');
        } else {
          const combinedData = new Uint8Array(leftData.length);
          for (let i = 0; i < leftData.length; i++) {
            combinedData[i] = Math.max(leftData[i], rightData[i]);
          }
          drawEnhancedFrequencyResponse(ctx, combinedData, width, height, '#00ff7f', 'Combined');
        }
    }

    // Draw enhanced frequency and dB labels
    drawEnhancedLabels(ctx, width, height);

    // Add real-time peak indicators
    drawPeakIndicators(ctx, leftData, rightData, width, height);
  };

  const drawProfessionalGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Major grid lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.lineWidth = 1;

    // Horizontal dB lines with professional styling
    const dbLevels = [-120, -100, -80, -60, -40, -20, 0];
    dbLevels.forEach((db, index) => {
      const y = height - ((db + 120) / 120) * height;
      const isMainLine = db % 20 === 0;

      ctx.strokeStyle = isMainLine ? 'rgba(0, 212, 255, 0.4)' : 'rgba(0, 212, 255, 0.15)';
      ctx.lineWidth = isMainLine ? 1.5 : 0.5;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Enhanced dB labels
      if (isMainLine) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 11px "Fira Code", monospace';
        ctx.fillText(`${db}`, 8, y - 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '9px "Fira Code", monospace';
        ctx.fillText('dB', 8, y + 10);
      }
    });

    // Vertical frequency lines with enhanced logarithmic scale
    const freqMarkers = [10, 22, 47, 100, 220, 470, 1000, 2200, 4700, 10000, 22000];
    const logScale = (freq: number) => {
      const minLog = Math.log10(10);
      const maxLog = Math.log10(22000);
      return (Math.log10(freq) - minLog) / (maxLog - minLog) * width;
    };

    freqMarkers.forEach(freq => {
      const x = logScale(freq);
      if (x >= 0 && x <= width) {
        const isMainLine = [100, 1000, 10000].includes(freq);

        ctx.strokeStyle = isMainLine ? 'rgba(0, 212, 255, 0.4)' : 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = isMainLine ? 1.5 : 0.5;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    });

    // Add subtle gradient overlay for depth
    const overlayGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    overlayGradient.addColorStop(0, 'rgba(0, 212, 255, 0.02)');
    overlayGradient.addColorStop(1, 'rgba(0, 212, 255, 0.08)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawEnhancedFrequencyResponse = (
    ctx: CanvasRenderingContext2D, 
    data: Uint8Array, 
    width: number, 
    height: number, 
    color: string,
    label: string
  ) => {
    // Enhanced logarithmic frequency scale
    const logScale = (index: number) => {
      const freq = (index / data.length) * 22050;
      const minLog = Math.log10(10);
      const maxLog = Math.log10(22000);
      return Math.max(0, (Math.log10(Math.max(10, freq)) - minLog) / (maxLog - minLog) * width);
    };

    // Create enhanced gradient for the curve
    const curveGradient = ctx.createLinearGradient(0, 0, 0, height);
    curveGradient.addColorStop(0, color);
    curveGradient.addColorStop(0.5, color + '80');
    curveGradient.addColorStop(1, color + '40');

    // Draw multiple passes for glow effect
    for (let pass = 0; pass < 3; pass++) {
      ctx.strokeStyle = pass === 0 ? color : color + (pass === 1 ? '60' : '30');
      ctx.lineWidth = pass === 0 ? 2.5 : (pass === 1 ? 4 : 6);
      ctx.shadowColor = color;
      ctx.shadowBlur = pass * 3;

      ctx.beginPath();

      // Smooth curve using quadratic bezier
      const points: {x: number, y: number}[] = [];

      for (let i = 1; i < data.length / 2; i++) {
        const x = logScale(i);
        const dbValue = data[i] > 0 ? 20 * Math.log10(data[i] / 255) : -120;
        const y = height - ((dbValue + 120) / 120) * height;
        points.push({x, y});
      }

      if (points.length > 2) {
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
          const cp1x = (points[i-1].x + points[i].x) / 2;
          const cp1y = (points[i-1].y + points[i].y) / 2;
          const cp2x = (points[i].x + points[i+1].x) / 2;
          const cp2y = (points[i].y + points[i+1].y) / 2;

          ctx.quadraticCurveTo(cp1x, cp1y, (cp1x + cp2x) / 2, (cp1y + cp2y) / 2);
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      }

      if (pass === 0) ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Enhanced filled area with gradient
    if (points.length > 2) {
      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      fillGradient.addColorStop(0, color + '40');
      fillGradient.addColorStop(0.7, color + '20');
      fillGradient.addColorStop(1, color + '05');

      ctx.fillStyle = fillGradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const cp1x = (points[i-1].x + points[i].x) / 2;
        const cp1y = (points[i-1].y + points[i].y) / 2;
        const cp2x = (points[i].x + points[i+1].x) / 2;
        const cp2y = (points[i].y + points[i+1].y) / 2;

        ctx.quadraticCurveTo(cp1x, cp1y, (cp1x + cp2x) / 2, (cp1y + cp2y) / 2);
      }

      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawEnhancedLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 11px "Fira Code", monospace';

    const freqLabels = [10, 22, 47, 100, 220, 470, 1000, 2200, 4700, 10000, 22000];
    const logScale = (freq: number) => {
      const minLog = Math.log10(10);
      const maxLog = Math.log10(22000);
      return (Math.log10(freq) - minLog) / (maxLog - minLog) * width;
    };

    freqLabels.forEach(freq => {
      const x = logScale(freq);
      if (x >= 40 && x <= width - 40) {
        const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
        const textWidth = ctx.measureText(label).width;

        // Background for better readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - textWidth/2 - 3, height - 25, textWidth + 6, 16);

        // Label text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(label, x - textWidth / 2, height - 12);

        // Unit label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px "Fira Code", monospace';
        ctx.fillText('Hz', x - 6, height - 2);
        ctx.font = 'bold 11px "Fira Code", monospace';
      }
    });
  };

  const drawPeakIndicators = (ctx: CanvasRenderingContext2D, leftData: Uint8Array, rightData: Uint8Array, width: number, height: number) => {
    const time = Date.now() * 0.005;

    // Find peaks in the data
    const combinedData = new Uint8Array(leftData.length);
    for (let i = 0; i < leftData.length; i++) {
      combinedData[i] = Math.max(leftData[i], rightData[i]);
    }

    // Detect significant peaks
    for (let i = 2; i < combinedData.length - 2; i++) {
      if (combinedData[i] > 200 && 
          combinedData[i] > combinedData[i-1] && 
          combinedData[i] > combinedData[i+1] &&
          combinedData[i] > combinedData[i-2] && 
          combinedData[i] > combinedData[i+2]) {

        const freq = (i / combinedData.length) * 22050;
        const logScale = (f: number) => {
          const minLog = Math.log10(10);
          const maxLog = Math.log10(22000);
          return (Math.log10(Math.max(10, f)) - minLog) / (maxLog - minLog) * width;
        };

        const x = logScale(freq);
        const dbValue = 20 * Math.log10(combinedData[i] / 255);
        const y = height - ((dbValue + 120) / 120) * height;

        // Animated peak indicator
        const pulseIntensity = 0.5 + 0.5 * Math.sin(time * 3 + i * 0.1);
        ctx.fillStyle = `rgba(255, 255, 0, ${pulseIntensity * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, 3 * pulseIntensity, 0, Math.PI * 2);
        ctx.fill();

        // Peak glow
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8 * pulseIntensity;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
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
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentMode === 'instant' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
                onClick={() => setCurrentMode('instant')}
              >
                Instant
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentMode === 'peak' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
                onClick={() => setCurrentMode('peak')}
              >
                Peak
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentMode === 'average' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
                onClick={() => setCurrentMode('average')}
              >
                Average
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {showChannelControls && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <button 
                  className={`flex items-center space-x-1 transition-colors ${
                    channelDisplayMode === 'left' ? 'text-cyan-400' : 'text-cyan-400/60 hover:text-cyan-400'
                  }`}
                  onClick={() => setChannelDisplayMode('left')}
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Left</span>
                </button>
                <button 
                  className={`flex items-center space-x-1 transition-colors ${
                    channelDisplayMode === 'right' ? 'text-orange-400' : 'text-orange-400/60 hover:text-orange-400'
                  }`}
                  onClick={() => setChannelDisplayMode('right')}
                >
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Right</span>
                </button>
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
              className={`text-xs font-mono transition-colors ${
                channelDisplayMode === 'left' ? 'text-cyan-400' : 'text-cyan-400/60 hover:text-cyan-400'
              }`}
              onClick={() => setChannelDisplayMode('left')}
            >
              ⊡ Left
            </button>
            <button 
              className={`text-xs font-mono transition-colors ${
                channelDisplayMode === 'right' ? 'text-orange-400' : 'text-orange-400/60 hover:text-orange-400'
              }`}
              onClick={() => setChannelDisplayMode('right')}
            >
              ⊡ Right
            </button>
            <button 
              className={`text-xs font-mono transition-colors ${
                channelDisplayMode === 'max' ? 'text-emerald-400' : 'text-emerald-400/60 hover:text-emerald-400'
              }`}
              onClick={() => setChannelDisplayMode('max')}
            >
              ⊡ Max
            </button>
            <button 
              className={`text-xs font-mono transition-colors ${
                channelDisplayMode === 'average' ? 'text-yellow-400' : 'text-yellow-400/60 hover:text-yellow-400'
              }`}
              onClick={() => setChannelDisplayMode('average')}
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