import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={cn("text-current", className)}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Terminal bracket */}
      <text
        x="0"
        y="28"
        className="font-mono text-lg font-bold"
        fill="currentColor"
      >
        [~]
      </text>
      
      {/* Main logo text */}
      <text
        x="32"
        y="20"
        className="font-mono text-sm font-bold"
        fill="var(--theme-primary)"
      >
        C/No
      </text>
      
      <text
        x="32"
        y="34"
        className="font-mono text-sm"
        fill="currentColor"
      >
        Voidline
      </text>
      
      {/* Version indicator */}
      <text
        x="90"
        y="28"
        className="font-mono text-xs"
        fill="var(--text-muted)"
      >
        v3.4.1
      </text>
    </svg>
  );
}
