
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TerminalWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  command?: string;
  variant?: "default" | "init";
  children: React.ReactNode;
}

const TerminalWindow = React.forwardRef<HTMLDivElement, TerminalWindowProps>(
  ({ className, command = "$ ./command", variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg overflow-hidden border",
          variant === "init" ? "border-[#1C1F22]" : "border-primary/30",
          className
        )}
        {...props}
      >
        {/* Terminal Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3",
            variant === "init" ? "bg-[#12151A]" : "bg-black/50"
          )}
        >
          {/* Left side - Command */}
          <div className="flex items-center space-x-2">
            <span 
              className="font-mono text-sm text-primary"
              aria-label={`Terminal command: ${command}`}
            >
              {command}
            </span>
          </div>

          {/* Right side - Traffic Lights */}
          <div className="flex items-center space-x-2" aria-hidden="true">
            <div 
              className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm"
              style={{ 
                boxShadow: '0 0 6px rgba(39, 201, 63, 0.4)' 
              }}
            />
            <div 
              className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"
              style={{ 
                boxShadow: '0 0 6px rgba(255, 189, 46, 0.4)' 
              }}
            />
            <div 
              className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm"
              style={{ 
                boxShadow: '0 0 6px rgba(255, 95, 86, 0.4)' 
              }}
            />
          </div>
        </div>

        {/* Terminal Body */}
        <div
          className={cn(
            "p-8",
            variant === "init" ? "bg-[#0B0F12]" : "bg-background/80"
          )}
        >
          <span className="sr-only">Terminal window content</span>
          {children}
        </div>
      </div>
    );
  }
);

TerminalWindow.displayName = "TerminalWindow";

export { TerminalWindow };
