import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Terminal window chrome */}
      <div className="flex items-center space-x-2 bg-black border border-primary/30 rounded-lg p-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
        <div className="font-mono text-primary text-sm px-2">
          •/C/No_Voidline
        </div>
      </div>
      
      {/* Logo SVG from story.svg */}
      <svg
        viewBox="0 0 200 50"
        className="h-8 text-current"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 15 L30 15 M10 25 L25 25 M10 35 L35 35"
          stroke="var(--theme-primary)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="45" cy="25" r="8" fill="var(--theme-primary)" opacity="0.6" />
        <path
          d="M60 15 Q70 15 70 25 Q70 35 60 35 L55 35 L55 15 Z"
          fill="var(--theme-primary)"
        />
        <text x="80" y="30" className="font-mono text-sm" fill="currentColor">
          Frequencies aligned. Stillness remains.
        </text>
      </svg>
    </div>
  );
}
