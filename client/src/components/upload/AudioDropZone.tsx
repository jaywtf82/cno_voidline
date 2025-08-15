import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Play, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface AudioDropZoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
  isProcessing?: boolean;
}

export function AudioDropZone({ onFileSelect, className, isProcessing = false }: AudioDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

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

    // Check file extension as well as MIME type
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
      onFileSelect(file);
    } catch (err) {
      setError('Failed to process audio file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isProcessing) return; // Prevent multiple uploads while processing

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [onFileSelect, isProcessing]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return; // Prevent multiple uploads while processing

    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [onFileSelect, isProcessing]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Terminal Header */}
      <div className="bg-black border border-primary/30 rounded-t-lg p-4">
        <div className="flex items-center space-x-2 text-primary font-mono text-sm">
          <span className="text-accent-primary">$</span>
          <span>•/C/No_Voidline</span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "border-2 border-dashed border-primary/30 bg-background/50 backdrop-blur-sm rounded-b-lg p-8 transition-all duration-300 cursor-pointer",
          isDragOver && "border-accent-primary bg-accent-primary/10 scale-[1.02]",
          isProcessing && "opacity-60 cursor-not-allowed"
        )}
        data-testid="audio-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
          data-testid="file-input"
        />

        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            {isProcessing ? (
              <div className="animate-spin border-2 border-accent-primary border-t-transparent rounded-full w-8 h-8" />
            ) : (
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragOver ? "text-accent-primary" : "text-primary"
              )} />
            )}
          </div>

          {/* Text */}
          <div className="space-y-3">
            <p className="font-mono text-text-muted text-sm leading-relaxed">
              Welcome, producer. Our advanced AI is ready to analyze and enhance your audio. Upload your track to begin 
              the mastering process and unlock its full sonic potential.
            </p>

            {error && (
              <div className="flex items-center justify-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              disabled={isProcessing}
              className="font-mono px-6 py-3 border-primary/50"
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Audio File ...
            </Button>
          </div>

          {/* Supported Formats */}
          <div className="text-xs font-mono text-text-muted/70">
            Supported: WAV, MP3, AAC, FLAC, OGG • Max size: 100MB
          </div>

          {/* AI Info */}
          <div className="border-t border-primary/20 pt-4 mt-6">
            <p className="text-xs font-mono text-accent-primary">
              Intelligent Reconstruction
            </p>
            <p className="text-xs font-mono text-text-muted mt-1">
              The AI rebuilds the audio, applying precise, calculated enhancements.
            </p>
            <p className="text-xs font-mono text-text-muted/60 mt-2">
              designed and developed by <span className="text-accent-primary">[@dotslashrecords]</span>
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Footer Effect */}
      <div className="bg-black/30 border border-primary/20 border-t-0 rounded-b-lg p-2">
        <div className="flex items-center space-x-2 text-text-muted/50 font-mono text-xs">
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
          <span>Ready for audio input...</span>
        </div>
      </div>
    </div>
  );
}