import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {/* Terminal window chrome */}
      <div className="flex items-center space-x-3 bg-black/80 border border-primary/30 rounded-lg px-3 py-2">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
        </div>
        <div className="font-mono text-primary text-sm">
          •/C/No_Voidline
        </div>
      </div>
      
      <div className="hidden md:block font-mono text-xs text-text-muted">
        Frequencies aligned. Stillness remains.
      </div>
    </div>
  );
}
