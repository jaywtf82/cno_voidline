import { useEffect, useRef, useState } from "react";
import { attachHiDPICanvas } from "@/lib/ui/resizeCanvas";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

interface WaveDNAProps {
  audioData?: Float32Array[];
  isPlaying?: boolean;
  mode?: "spectrum" | "wave" | "3d";
  className?: string;
}

export function WaveDNA({ 
  audioData, 
  isPlaying = false, 
  mode = "spectrum",
  className = "" 
}: WaveDNAProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [currentMode, setCurrentMode] = useState(mode);
  const [orbitMode, setOrbitMode] = useState(false);
  const { theme } = useTheme();

  // Generate mock spectrum data if none provided
  const generateMockSpectrum = () => {
    const spectrum = new Array(64);
    for (let i = 0; i < spectrum.length; i++) {
      const freq = (i / spectrum.length) * 0.5;
      const decay = Math.exp(-freq * 3);
      const noise = Math.random() * 0.3;
      spectrum[i] = (Math.sin(Date.now() * 0.001 + i * 0.1) * 0.5 + 0.5) * decay + noise;
    }
    return spectrum;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Get theme colors
    const themeColors = {
      classic: { primary: "#3FB950", secondary: "#2EA043" },
      matrix: { primary: "#00FF41", secondary: "#00CC33" },
      cyberpunk: { primary: "#00D4FF", secondary: "#B794F6" },
      retro: { primary: "#FF8C42", secondary: "#17A2B8" },
    };

    const colors = themeColors[theme];

    if (currentMode === "spectrum") {
      const spectrum = audioData?.[0] || generateMockSpectrum();
      const barWidth = width / spectrum.length;

      for (let i = 0; i < spectrum.length; i++) {
        const barHeight = spectrum[i] * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, height, 0, y);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        // Add glow effect
        if (isPlaying) {
          ctx.shadowColor = colors.primary;
          ctx.shadowBlur = 5;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
          ctx.shadowBlur = 0;
        }
      }

      // Frequency labels
      ctx.fillStyle = "rgba(110, 118, 129, 0.7)";
      ctx.font = "10px 'Fira Code', monospace";
      ctx.fillText("20Hz", 5, height - 5);
      ctx.fillText("200Hz", width * 0.25, height - 5);
      ctx.fillText("2kHz", width * 0.5, height - 5);
      ctx.fillText("20kHz", width * 0.75, height - 5);

    } else if (currentMode === "wave") {
      const waveData = audioData?.[0] || generateMockSpectrum();
      
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < waveData.length; i++) {
        const x = (i / waveData.length) * width;
        const y = height / 2 + (waveData[i] - 0.5) * height * 0.8;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Add glow effect
      if (isPlaying) {
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

    } else if (currentMode === "3d" || orbitMode) {
      // 3D orbital visualization
      const spectrum = audioData?.[0] || generateMockSpectrum();
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3;
      const time = Date.now() * 0.001;

      // Draw orbital rings
      for (let ring = 1; ring <= 3; ring++) {
        ctx.strokeStyle = `rgba(${colors.primary.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(", ")}, ${0.2 * ring})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * ring * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw frequency data as orbital points
      for (let i = 0; i < spectrum.length; i++) {
        const angle = (i / spectrum.length) * Math.PI * 2 + time * 0.5;
        const r = radius + spectrum[i] * radius * 0.5;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        const intensity = spectrum[i];
        const size = 2 + intensity * 3;

        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow
        if (isPlaying) {
          ctx.shadowColor = colors.primary;
          ctx.shadowBlur = size * 2;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Central indicator
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const detach = attachHiDPICanvas(canvasRef.current);
    draw();
    return () => {
      detach();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isPlaying, currentMode, orbitMode, theme]);

  return (
    <div className={`bg-black/50 rounded relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-4 p-4">
        <h3 className="font-mono text-accent-primary text-lg">WAVEDNA VISUALIZER</h3>
        <div className="flex space-x-2 text-xs">
          <Button
            variant={currentMode === "spectrum" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentMode("spectrum")}
            className="font-mono px-2 py-1"
            data-testid="button-spectrum-mode"
          >
            SPECTRUM
          </Button>
          <Button
            variant={currentMode === "wave" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentMode("wave")}
            className="font-mono px-2 py-1"
            data-testid="button-wave-mode"
          >
            WAVE
          </Button>
          <Button
            variant={currentMode === "3d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentMode("3d")}
            className="font-mono px-2 py-1"
            data-testid="button-3d-mode"
          >
            3D
          </Button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-48"
        style={{ width: "100%", height: "192px" }}
        data-testid="canvas-wavedna"
      />

      <div className="flex justify-between items-center mt-4 px-4 pb-4">
        <div className="flex space-x-4">
          <Button
            variant={orbitMode ? "default" : "outline"}
            size="sm"
            onClick={() => setOrbitMode(!orbitMode)}
            className="font-mono text-sm"
            data-testid="button-orbit-mode"
          >
            ORBIT MODE
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-sm"
            data-testid="button-isolate"
          >
            ISOLATE
          </Button>
        </div>
        <div className="font-mono text-sm text-text-muted" data-testid="text-peak-info">
          Peak: -3.2dB @ 4.2kHz
        </div>
      </div>
    </div>
  );
}
