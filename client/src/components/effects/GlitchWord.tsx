import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchWordProps {
  children: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
  trigger?: boolean;
  autoTrigger?: boolean;
  autoInterval?: number;
}

export function GlitchWord({
  children,
  className,
  intensity = "medium",
  trigger = false,
  autoTrigger = false,
  autoInterval = 3000,
}: GlitchWordProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState(children);
  const intervalRef = useRef<NodeJS.Timeout>();

  const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`";
  
  const intensitySettings = {
    low: { duration: 100, iterations: 2, charCount: 1 },
    medium: { duration: 150, iterations: 3, charCount: 2 },
    high: { duration: 200, iterations: 4, charCount: 3 },
  };

  const settings = intensitySettings[intensity];

  const generateGlitchText = (originalText: string, iteration: number) => {
    if (iteration === 0) return originalText;
    
    const chars = originalText.split("");
    const numCharsToGlitch = Math.min(settings.charCount, chars.length);
    
    for (let i = 0; i < numCharsToGlitch; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
      chars[randomIndex] = randomChar;
    }
    
    return chars.join("");
  };

  const performGlitch = () => {
    if (isGlitching) return;
    
    setIsGlitching(true);
    let iteration = 0;

    const glitchInterval = setInterval(() => {
      if (iteration < settings.iterations) {
        setGlitchText(generateGlitchText(children, iteration));
        iteration++;
      } else {
        setGlitchText(children);
        setIsGlitching(false);
        clearInterval(glitchInterval);
      }
    }, settings.duration / settings.iterations);
  };

  // Handle manual trigger
  useEffect(() => {
    if (trigger) {
      performGlitch();
    }
  }, [trigger]);

  // Handle auto trigger
  useEffect(() => {
    if (autoTrigger) {
      intervalRef.current = setInterval(() => {
        performGlitch();
      }, autoInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoTrigger, autoInterval]);

  return (
    <span
      className={cn(
        "relative inline-block",
        isGlitching && "animate-pulse",
        className
      )}
      data-testid="glitch-word"
    >
      {/* Main text */}
      <span
        className={cn(
          "relative z-10",
          isGlitching && "text-shadow-glow"
        )}
      >
        {glitchText}
      </span>
      
      {/* Glitch background effects */}
      {isGlitching && (
        <>
          <span
            className="absolute inset-0 text-red-400 opacity-70 transform translate-x-0.5"
            style={{ mixBlendMode: "multiply" }}
            aria-hidden="true"
          >
            {glitchText}
          </span>
          <span
            className="absolute inset-0 text-cyan-400 opacity-70 transform -translate-x-0.5"
            style={{ mixBlendMode: "multiply" }}
            aria-hidden="true"
          >
            {glitchText}
          </span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent animate-pulse"
            aria-hidden="true"
          />
        </>
      )}
    </span>
  );
}
