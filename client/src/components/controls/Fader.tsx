import { useState, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface FaderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  target?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Fader({
  label,
  value,
  min = -60,
  max = 0,
  step = 0.1,
  unit = "dB",
  target,
  onChange,
  className,
}: FaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleValueChange = useCallback(
    (newValue: number[]) => {
      onChange(newValue[0]);
    },
    [onChange]
  );

  const percentage = ((value - min) / (max - min)) * 100;
  const targetPercentage = target ? ((target - min) / (max - min)) * 100 : undefined;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm text-text-muted">{label}</span>
        <span
          className="font-mono text-sm text-accent-primary"
          data-testid={`text-${label.toLowerCase()}-value`}
        >
          {value.toFixed(1)}{unit}
        </span>
      </div>

      <div className="relative">
        {/* Meter background */}
        <div className="bg-black/50 h-2 rounded overflow-hidden mb-2">
          {/* Target indicator */}
          {targetPercentage !== undefined && (
            <div
              className="absolute h-full w-0.5 bg-text-muted opacity-50"
              style={{ left: `${targetPercentage}%` }}
              data-testid={`target-${label.toLowerCase()}`}
            />
          )}

          {/* Current level */}
          <div
            className={cn(
              "h-full transition-all duration-300",
              percentage > 85 ? "bg-red-400" :
              percentage > 70 ? "bg-yellow-400" :
              "bg-accent-primary shadow-glow-sm"
            )}
            style={{ width: `${Math.max(0, percentage)}%` }}
            data-testid={`meter-${label.toLowerCase()}`}
          />
        </div>

        {/* Slider control */}
        <div
          className={cn(
            "transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Slider
            value={[value]}
            onValueChange={handleValueChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
            data-testid={`slider-${label.toLowerCase()}`}
          />
        </div>
      </div>

      {/* Target information */}
      {target && (
        <div className="text-xs font-mono text-text-muted">
          Target: {target.toFixed(1)}{unit}
        </div>
      )}
    </div>
  );
}