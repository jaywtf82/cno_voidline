import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface MissionBarProps {
  signalStrength?: number;
  voidlineScore?: number;
  status?: "idle" | "analyzing" | "processing" | "complete";
  logs?: string[];
  className?: string;
}

export function MissionBar({
  signalStrength = 94,
  voidlineScore = 87,
  status = "analyzing",
  logs = [],
  className = "",
}: MissionBarProps) {
  const [currentLogs, setCurrentLogs] = useState(logs);
  const { theme } = useTheme();

  const defaultLogs = [
    "[ACTIVE] Spectral analysis running",
    "[INFO] Phase coherence: optimal", 
    "[INFO] Dynamic range: preserved",
    "[WARN] Peak limiting engaged",
  ];

  const displayLogs = currentLogs.length > 0 ? currentLogs : defaultLogs;

  const statusMessages = {
    idle: "System ready for signal input",
    analyzing: "Deep signal analysis in progress",
    processing: "AI enhancement algorithms active",
    complete: "Signal optimization complete",
  };

  const statusColors = {
    idle: "text-text-muted",
    analyzing: "text-accent-primary",
    processing: "text-yellow-400", 
    complete: "text-green-400",
  };

  // Simulate log updates
  useEffect(() => {
    if (status === "analyzing" || status === "processing") {
      const interval = setInterval(() => {
        // Add some variation to make it feel alive
        const variations = [
          "[INFO] FFT analysis: 94.2% complete",
          "[INFO] Harmonic detection active",
          "[INFO] Stereo field optimization",
          "[ACTIVE] Neural network processing",
        ];
        
        if (Math.random() > 0.7) {
          const newLog = variations[Math.floor(Math.random() * variations.length)];
          setCurrentLogs(prev => [...prev.slice(-3), newLog]);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-mono text-accent-primary mb-4 text-sm">MISSION STATUS</h3>

      <div className="space-y-4">
        {/* Signal Strength */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm text-text-muted">Signal Strength</span>
            <span 
              className="font-mono text-sm text-accent-primary"
              data-testid="text-signal-strength"
            >
              {signalStrength}%
            </span>
          </div>
          <div className="bg-black/50 h-3 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-yellow-400 animate-glow-pulse transition-all duration-500"
              style={{ width: `${signalStrength}%` }}
              data-testid="meter-signal-strength"
            />
          </div>
        </div>

        {/* Status Logs */}
        <div className="space-y-2 text-xs font-mono min-h-[4rem]">
          {displayLogs.map((log, index) => {
            const logType = log.match(/\[(.*?)\]/)?.[1] || "INFO";
            const logColor = {
              ACTIVE: "text-accent-primary",
              INFO: "text-text-muted",
              WARN: "text-yellow-400",
              ERROR: "text-red-400",
              SUCCESS: "text-green-400",
            }[logType] || "text-text-muted";

            return (
              <div 
                key={`${log}-${index}`}
                className={logColor}
                data-testid={`log-${index}`}
              >
                {log}
              </div>
            );
          })}
        </div>

        {/* Current Status */}
        <div className="border-t border-accent-primary/20 pt-3">
          <div className={`text-xs font-mono ${statusColors[status]}`}>
            <span className="text-text-muted">Status: </span>
            <span data-testid="text-status">{statusMessages[status]}</span>
          </div>
        </div>

        {/* Voidline Score */}
        <div className="text-center border-t border-accent-primary/20 pt-4">
          <div 
            className="text-2xl font-mono text-accent-primary mb-1"
            data-testid="text-voidline-score"
          >
            {voidlineScore}
          </div>
          <div className="text-xs font-mono text-text-muted">
            Voidline Score
          </div>
          
          {/* Score indicator */}
          <div className="mt-2 bg-black/50 h-1 rounded overflow-hidden">
            <div
              className="h-full bg-accent-primary transition-all duration-500"
              style={{ width: `${voidlineScore}%` }}
              data-testid="meter-voidline-score"
            />
          </div>
        </div>

        {/* Processing indicator */}
        {(status === "analyzing" || status === "processing") && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
