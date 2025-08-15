import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="font-mono text-lg text-accent-primary font-bold tracking-wider">
        VOIDLINE
      </div>
    </div>
  );
}
