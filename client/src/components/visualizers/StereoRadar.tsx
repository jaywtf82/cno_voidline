import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface StereoRadarProps {
  leftSignal?: number[];
  rightSignal?: number[];
  correlation?: number;
  width?: number;
  isActive?: boolean;
  className?: string;
}

export function StereoRadar({
  leftSignal,
  rightSignal,
  correlation = 0.94,
  width = 0.82,
  isActive = false,
  className = "",
}: StereoRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  // Generate mock signal data if none provided
  const generateSignalPoints = () => {
    const points = [];
    const numPoints = 8;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = 20 + Math.random() * 25;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      points.push({ x, y, intensity: Math.random() });
    }
    
    return points;
  };

  const signalPoints = generateSignalPoints();

  const themeColors = {
    classic: "#3FB950",
    matrix: "#00FF41", 
    cyberpunk: "#00D4FF",
    retro: "#FF8C42",
  };

  const primaryColor = themeColors[theme];

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-accent-primary text-sm">STEREO FIELD RADAR</h3>
        <div className="text-xs font-mono text-text-muted">POLAR</div>
      </div>

      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="w-full h-full"
          data-testid="svg-stereo-radar"
        >
          {/* Radar Grid */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`${primaryColor}33`}
            strokeWidth="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke={`${primaryColor}33`}
            strokeWidth="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="15"
            fill="none"
            stroke={`${primaryColor}33`}
            strokeWidth="0.5"
          />
          
          {/* Grid Lines */}
          <line
            x1="5"
            y1="50"
            x2="95"
            y2="50"
            stroke={`${primaryColor}33`}
            strokeWidth="0.5"
          />
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="95"
            stroke={`${primaryColor}33`}
            strokeWidth="0.5"
          />

          {/* Sweeping Line */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="5"
            stroke={primaryColor}
            strokeWidth="1.5"
            className={isActive ? "animate-radar-sweep" : ""}
            style={{ transformOrigin: "50px 50px" }}
          />

          {/* Signal Dots */}
          {signalPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={primaryColor}
              opacity={0.6 + point.intensity * 0.4}
              data-testid={`signal-dot-${index}`}
            >
              {isActive && (
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur={`${1.5 + Math.random()}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          ))}
        </svg>
      </div>

      <div className="space-y-2 text-sm font-mono">
        <div className="flex justify-between">
          <span className="text-text-muted">L/R Width:</span>
          <span className="text-accent-primary" data-testid="text-lr-width">
            {(width * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">M/S Balance:</span>
          <span className="text-accent-primary" data-testid="text-ms-balance">
            +2.1dB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Correlation:</span>
          <span className="text-accent-primary" data-testid="text-correlation">
            {correlation.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
