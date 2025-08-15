import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <div className="hidden md:block font-mono text-xs text-text-muted">
        Frequencies aligned. Stillness remains.
      </div>
    </div>
  );
}
