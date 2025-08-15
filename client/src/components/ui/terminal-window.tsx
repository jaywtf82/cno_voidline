
import * as React from "react";
import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, AlertCircle } from "lucide-react";

export interface TerminalWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  command?: string;
  variant?: "default" | "init";
  children: React.ReactNode;
  onFileSelect?: (file: File) => void;
  isProcessing?: boolean;
}

const TerminalWindow = React.forwardRef<HTMLDivElement, TerminalWindowProps>(
  ({ className, command = "$ ./command", variant = "default", children, onFileSelect, isProcessing = false, ...props }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateAudioFile = (file: File): string | null => {
      const allowedTypes = [
        'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/mp3', 'audio/mpeg', 'audio/mp4',
        'audio/aac', 'audio/x-aac',
        'audio/flac', 'audio/x-flac',
        'audio/ogg', 'audio/ogg; codecs=vorbis'
      ];
      const allowedExtensions = ['.wav', '.mp3', '.aac', '.flac', '.ogg', '.m4a'];
      const maxSize = 100 * 1024 * 1024; // 100MB

      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      const hasValidMimeType = allowedTypes.includes(file.type.toLowerCase());

      if (!hasValidExtension && !hasValidMimeType) {
        return 'Please upload a valid audio file (WAV, MP3, AAC, FLAC, OGG)';
      }

      if (file.size > maxSize) {
        return 'File size must be less than 100MB';
      }

      return null;
    };

    const processFile = async (file: File) => {
      setError(null);

      const validationError = validateAudioFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        if (onFileSelect) {
          onFileSelect(file);
        }
      } catch (err) {
        setError('Failed to process audio file');
      }
    };

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === e.target) {
        setIsDragOver(false);
      }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isProcessing) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    }, [onFileSelect, isProcessing]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    }, [onFileSelect, isProcessing]);

    const handleClick = () => {
      fileInputRef.current?.click();
    };

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

        {/* Terminal Body with Drag & Drop */}
        <div
          className={cn(
            "p-8 transition-all duration-300",
            variant === "init" ? "bg-[#0B0F12]" : "bg-background/80",
            onFileSelect && "cursor-pointer",
            isDragOver && onFileSelect && "bg-accent-primary/10 scale-[1.02]",
            isProcessing && "opacity-60 cursor-not-allowed"
          )}
          onDragEnter={onFileSelect ? handleDragEnter : undefined}
          onDragLeave={onFileSelect ? handleDragLeave : undefined}
          onDragOver={onFileSelect ? handleDragOver : undefined}
          onDrop={onFileSelect ? handleDrop : undefined}
          onClick={onFileSelect ? handleClick : undefined}
        >
          <span className="sr-only">Terminal window content</span>
          
          {onFileSelect && (
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
          )}

          {error && onFileSelect && (
            <div className="flex items-center justify-center space-x-2 text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {children}

          {onFileSelect && isDragOver && (
            <div className="absolute inset-0 bg-accent-primary/5 border-2 border-dashed border-accent-primary rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Upload className="w-8 h-8 text-accent-primary mx-auto mb-2" />
                <p className="text-accent-primary font-mono">Drop audio file here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

TerminalWindow.displayName = "TerminalWindow";

export { TerminalWindow };
