/**
 * HarmonicSpiral.tsx - Concentric spiral from detected harmonics
 * Displays harmonic content with interactive frequency rings
 */

import React, { useRef, useEffect } from 'react';

interface HarmonicData {
  fundamental: number;
  harmonics: { freq: number; amplitude: number }[];
  confidence: number;
}

interface HarmonicSpiralProps {
  harmonicData?: HarmonicData;
  eqState?: {
    bands: { freq: number; gain: number; q: number; type: string }[];
  };
  theme?: 'classic' | 'terminal' | 'glass';
  onHarmonicHover?: (freq: number, suggested: { q: number; delta: number }) => void;
}

export const HarmonicSpiral: React.FC<HarmonicSpiralProps> = ({
  harmonicData,
  eqState,
  theme = 'classic',
  onHarmonicHover
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  const themeColors = {
    classic: {
      background: 'rgba(0, 0, 0, 0.8)',
      primary: '#22c55e',
      secondary: '#16a34a',
      accent: '#15803d',
      boost: '#fbbf24',
      cut: '#f87171',
      grid: '#374151'
    },
    terminal: {
      background: 'rgba(0, 0, 0, 0.9)',
      primary: '#00ff00',
      secondary: '#00cc00',
      accent: '#00aa00',
      boost: '#ffff00',
      cut: '#ff0000',
      grid: '#003300'
    },
    glass: {
      background: 'rgba(0, 0, 0, 0.6)',
      primary: '#60a5fa',
      secondary: '#3b82f6',
      accent: '#2563eb',
      boost: '#fbbf24',
      cut: '#f87171',
      grid: '#1e40af'
    }
  };

  const colors = themeColors[theme];

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

    const animate = () => {
      timeRef.current += 0.016;
      drawSpiral(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [harmonicData, eqState, theme]);

  const drawSpiral = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;

    // Draw base spiral grid
    drawSpiralGrid(ctx, centerX, centerY, maxRadius);

    // Draw harmonic rings
    if (harmonicData && harmonicData.harmonics.length > 0) {
      drawHarmonicRings(ctx, centerX, centerY, maxRadius);
    }

    // Draw fundamental frequency indicator
    if (harmonicData && harmonicData.fundamental > 0) {
      drawFundamental(ctx, centerX, centerY, maxRadius);
    }

    // Draw confidence indicator
    if (harmonicData) {
      drawConfidenceIndicator(ctx, width, height);
    }
  };

  const drawSpiralGrid = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, maxRadius: number) => {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // Draw logarithmic spiral grid
    for (let harmonic = 1; harmonic <= 10; harmonic++) {
      const radius = Math.log(harmonic + 1) / Math.log(11) * maxRadius;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Label harmonic number
      ctx.fillStyle = colors.grid;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `H${harmonic}`,
        centerX + radius - 15,
        centerY - 5
      );
    }

    // Draw radial lines for frequency divisions
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * maxRadius,
        centerY + Math.sin(angle) * maxRadius
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const drawHarmonicRings = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, maxRadius: number) => {
    if (!harmonicData?.harmonics) return;

    harmonicData.harmonics.forEach((harmonic, index) => {
      const harmonicOrder = harmonic.freq / harmonicData.fundamental;
      const radius = Math.log(harmonicOrder + 1) / Math.log(11) * maxRadius;
      
      // Ring color based on EQ state
      const eqGain = getEQGainAtFrequency(harmonic.freq);
      let ringColor = colors.primary;
      
      if (eqGain > 0.5) {
        ringColor = colors.boost; // Boosted
      } else if (eqGain < -0.5) {
        ringColor = colors.cut; // Cut
      }

      // Ring thickness based on amplitude
      const thickness = Math.max(2, harmonic.amplitude * 20);
      
      // Animate ring based on time and amplitude
      const pulseScale = 1 + Math.sin(timeRef.current * 2 + index * 0.5) * harmonic.amplitude * 0.1;
      const animatedRadius = radius * pulseScale;

      // Draw ring
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.7 + harmonic.amplitude * 0.3;

      ctx.beginPath();
      ctx.arc(centerX, centerY, animatedRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw frequency label
      if (harmonic.amplitude > 0.1) {
        ctx.fillStyle = ringColor;
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        const labelX = centerX + animatedRadius * Math.cos(index * 0.5);
        const labelY = centerY + animatedRadius * Math.sin(index * 0.5);
        
        ctx.fillText(
          `${Math.round(harmonic.freq)}Hz`,
          labelX + 5,
          labelY
        );
      }

      // Glow effect for strong harmonics
      if (harmonic.amplitude > 0.5) {
        ctx.shadowColor = ringColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, animatedRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    ctx.globalAlpha = 1;
  };

  const drawFundamental = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, maxRadius: number) => {
    if (!harmonicData?.fundamental) return;

    // Central indicator for fundamental frequency
    const pulseScale = 1 + Math.sin(timeRef.current * 3) * 0.2;
    const fundamentalRadius = 15 * pulseScale;

    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, fundamentalRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fundamental frequency label
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `F0: ${Math.round(harmonicData.fundamental)}Hz`,
      centerX,
      centerY - 25
    );

    ctx.globalAlpha = 1;
  };

  const drawConfidenceIndicator = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!harmonicData) return;

    // Confidence bar
    const barWidth = 100;
    const barHeight = 4;
    const barX = width - barWidth - 10;
    const barY = 10;

    // Background
    ctx.fillStyle = colors.grid;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Confidence level
    const confidenceWidth = barWidth * harmonicData.confidence;
    ctx.fillStyle = harmonicData.confidence > 0.7 ? colors.primary : colors.accent;
    ctx.fillRect(barX, barY, confidenceWidth, barHeight);

    // Label
    ctx.fillStyle = colors.primary;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `Confidence: ${Math.round(harmonicData.confidence * 100)}%`,
      width - 10,
      barY - 5
    );
  };

  const getEQGainAtFrequency = (freq: number): number => {
    if (!eqState?.bands) return 0;

    // Find closest EQ band
    let closestBand = eqState.bands[0];
    let minDistance = Math.abs(Math.log2(freq / closestBand.freq));

    eqState.bands.forEach(band => {
      const distance = Math.abs(Math.log2(freq / band.freq));
      if (distance < minDistance) {
        minDistance = distance;
        closestBand = band;
      }
    });

    // Return gain if within Q range
    const qRange = 1 / closestBand.q;
    if (minDistance < qRange) {
      return closestBand.gain;
    }

    return 0;
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !harmonicData?.harmonics || !onHarmonicHover) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxRadius = Math.min(rect.width, rect.height) * 0.4;

    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    // Find harmonic at clicked position
    harmonicData.harmonics.forEach(harmonic => {
      const harmonicOrder = harmonic.freq / harmonicData.fundamental;
      const radius = Math.log(harmonicOrder + 1) / Math.log(11) * maxRadius;

      if (Math.abs(distance - radius) < 20) {
        // Calculate suggested EQ parameters
        const suggested = {
          q: Math.max(0.5, Math.min(5, harmonic.amplitude * 3)),
          delta: harmonic.amplitude > 0.5 ? -2 : 2 // Suggest cut for strong harmonics
        };

        onHarmonicHover(harmonic.freq, suggested);
      }
    });
  };

  return (
    <div className="relative w-full h-80 bg-black/20 rounded-lg overflow-hidden border border-gray-700">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 text-xs font-mono text-green-400">
        <div>Harmonic Spiral</div>
        <div className="text-gray-400">
          {harmonicData?.fundamental ? `F0: ${Math.round(harmonicData.fundamental)}Hz` : 'No pitch detected'}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-yellow-400"></div>
          <span>Boosted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-red-400"></div>
          <span>Cut</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-green-400"></div>
          <span>Natural</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-gray-600">
        Click rings for EQ suggestions
      </div>
    </div>
  );
};