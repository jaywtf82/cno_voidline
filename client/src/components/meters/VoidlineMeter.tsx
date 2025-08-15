import { useTheme } from "@/components/ThemeProvider";

interface VoidlineMeterProps {
  level?: number; // Current signal level in dB
  headroom?: number; // Available headroom in dB
  noiseFloor?: number; // Noise floor in dB
  className?: string;
}

export function VoidlineMeter({
  level = -8.5,
  headroom = 12.3,
  noiseFloor = -60.2,
  className = "",
}: VoidlineMeterProps) {
  const { theme } = useTheme();

  const themeColors = {
    classic: "#3FB950",
    matrix: "#00FF41",
    cyberpunk: "#00D4FF",
    retro: "#FF8C42",
  };

  const primaryColor = themeColors[theme];

  // Calculate positions (0dB = 100%, -60dB = 0%)
  const calculatePosition = (dbValue: number) => {
    const min = -60;
    const max = 0;
    return Math.max(0, Math.min(100, ((dbValue - min) / (max - min)) * 100));
  };

  const levelPosition = calculatePosition(level);
  const voidlinePosition = 80; // Approximately -12dB position

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-accent-primary text-sm">NOISE FLOOR TRACKER</h3>
        <div className="font-mono text-sm text-text-muted" data-testid="text-headroom">
          Headroom: {headroom.toFixed(1)}dB
        </div>
      </div>

      <div className="relative h-8 bg-black/50 rounded overflow-hidden">
        {/* Danger Zone (0dB to -6dB) */}
        <div
          className="absolute top-0 h-full bg-red-500/20"
          style={{
            right: "0%",
            width: "10%",
          }}
          data-testid="danger-zone"
        />

        {/* Warning Zone (-6dB to -12dB) */}
        <div
          className="absolute top-0 h-full bg-yellow-400/20"
          style={{
            right: "10%",
            width: "10%",
          }}
          data-testid="warning-zone"
        />

        {/* Safe Zone (-12dB to -60dB) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: "0%",
            right: "20%",
            background: `${primaryColor}1A`,
          }}
          data-testid="safe-zone"
        />

        {/* Voidline Indicator */}
        <div
          className="absolute inset-y-0 w-1 shadow-glow-md"
          style={{
            left: `${voidlinePosition}%`,
            background: primaryColor,
            boxShadow: `0 0 8px ${primaryColor}`,
          }}
          data-testid="voidline-indicator"
        />

        {/* Current Level Indicator */}
        <div
          className="absolute inset-y-0 w-2 bg-yellow-400 animate-glow-pulse"
          style={{
            left: `${levelPosition}%`,
          }}
          data-testid="level-indicator"
        />

        {/* Peak Hold Indicator */}
        <div
          className="absolute inset-y-0 w-0.5 bg-red-400"
          style={{
            left: `${Math.max(levelPosition, 85)}%`,
          }}
          data-testid="peak-hold"
        />
      </div>

      {/* Scale Markers */}
      <div className="flex justify-between text-xs font-mono text-text-muted mt-2">
        <span>-60dB</span>
        <span>-40dB</span>
        <span>-20dB</span>
        <span>-6dB</span>
        <span>0dB</span>
      </div>

      {/* Status Information */}
      <div className="flex justify-between mt-3 text-xs font-mono">
        <div>
          <span className="text-text-muted">Current: </span>
          <span className="text-accent-primary" data-testid="text-current-level">
            {level.toFixed(1)}dB
          </span>
        </div>
        <div>
          <span className="text-text-muted">Noise Floor: </span>
          <span className="text-accent-primary" data-testid="text-noise-floor">
            {noiseFloor.toFixed(1)}dB
          </span>
        </div>
      </div>
    </div>
  );
}
