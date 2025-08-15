import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function Knob({
  label,
  value,
  min = -10,
  max = 10,
  step = 0.1,
  unit = "",
  onChange,
  className,
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Calculate rotation based on value
  const percentage = (value - min) / (max - min);
  const rotation = (percentage - 0.5) * 270; // 270 degrees total range

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    e.preventDefault();
  }, [value]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY; // Inverted for natural feel
      const sensitivity = (max - min) / 200; // Adjust sensitivity
      const newValue = Math.max(min, Math.min(max, startValue + deltaY * sensitivity));
      
      // Snap to step
      const snappedValue = Math.round(newValue / step) * step;
      onChange(snappedValue);
    },
    [isDragging, startY, startValue, min, max, step, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newValue = value;
      
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          newValue = Math.min(max, value + step);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          newValue = Math.max(min, value - step);
          break;
        case "Home":
          newValue = min;
          break;
        case "End":
          newValue = max;
          break;
        case "PageUp":
          newValue = Math.min(max, value + step * 10);
          break;
        case "PageDown":
          newValue = Math.max(min, value - step * 10);
          break;
        default:
          return;
      }
      
      e.preventDefault();
      onChange(newValue);
    },
    [value, min, max, step, onChange]
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={cn("text-center", className)}>
      <div
        ref={knobRef}
        className={cn(
          "control-knob mx-auto mb-2 select-none",
          isDragging && "shadow-glow-md"
        )}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(1)}${unit}`}
        data-testid={`knob-${label.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Knob indicator */}
        <div
          className="absolute inset-2 bg-accent-primary/20 rounded-full"
          style={{
            background: `conic-gradient(
              var(--theme-primary) 0deg,
              var(--theme-primary) ${(percentage * 270) + 45}deg,
              transparent ${(percentage * 270) + 45}deg,
              transparent 360deg
            )`,
          }}
        />
      </div>
      
      <div className="font-mono text-xs text-text-muted mb-1">
        {label}
      </div>
      <div 
        className="font-mono text-xs text-accent-primary"
        data-testid={`text-${label.toLowerCase().replace(/\s+/g, '-')}-value`}
      >
        {value >= 0 ? "+" : ""}{value.toFixed(1)}{unit}
      </div>
    </div>
  );
}
