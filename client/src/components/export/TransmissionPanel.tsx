import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NeonCard } from "@/components/ui/neon-card";
import { cn } from "@/lib/utils";
import type { ExportFormatType } from "@shared/schema";

interface ExportTarget {
  id: ExportFormatType;
  name: string;
  icon: string;
  lufs: number;
  sampleRate: number;
  description: string;
}

interface TransmissionPanelProps {
  onExport: (format: ExportFormatType) => void;
  isExporting?: boolean;
  exportProgress?: number;
  exportStatus?: string;
  className?: string;
}

export function TransmissionPanel({
  onExport,
  isExporting = false,
  exportProgress = 0,
  exportStatus = "Ready for transmission",
  className,
}: TransmissionPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatType>("STREAMING");

  const exportTargets: ExportTarget[] = [
    {
      id: "CLUB",
      name: "CLUB",
      icon: "🎛️",
      lufs: -8,
      sampleRate: 48,
      description: "High energy club master",
    },
    {
      id: "STREAMING",
      name: "STREAMING", 
      icon: "📱",
      lufs: -14,
      sampleRate: 44.1,
      description: "Optimized for streaming platforms",
    },
    {
      id: "VINYL",
      name: "VINYL",
      icon: "💿", 
      lufs: -16,
      sampleRate: 44.1,
      description: "Analog-friendly dynamics",
    },
    {
      id: "RADIO",
      name: "RADIO",
      icon: "📻",
      lufs: -12,
      sampleRate: 44.1,
      description: "Broadcast ready format",
    },
  ];

  const handleExport = () => {
    onExport(selectedFormat);
  };

  return (
    <NeonCard variant="terminal" className={className}>
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 glow-text">TRANSMISSION WINDOW</h2>
          <p className="text-text-secondary text-lg">
            Export your mastered audio to various target formats
          </p>
        </div>

        {/* Export Format Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {exportTargets.map((target) => (
            <div
              key={target.id}
              className={cn(
                "text-center p-4 border rounded cursor-pointer transition-all duration-200",
                selectedFormat === target.id
                  ? "border-accent-primary bg-accent-primary/20"
                  : "border-accent-primary/30 hover:border-accent-primary hover:bg-accent-primary/10"
              )}
              onClick={() => setSelectedFormat(target.id)}
              data-testid={`format-${target.id.toLowerCase()}`}
            >
              <div className="text-2xl mb-2">{target.icon}</div>
              <div className="font-mono text-accent-primary mb-1">{target.name}</div>
              <div className="text-xs text-text-muted mb-2">
                {target.lufs} LUFS, {target.sampleRate}kHz
              </div>
              <div className="text-xs text-text-secondary">
                {target.description}
              </div>
            </div>
          ))}
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm text-text-muted">Rendering Progress</span>
              <span 
                className="font-mono text-sm text-accent-primary"
                data-testid="text-export-progress"
              >
                {exportProgress}%
              </span>
            </div>
            
            <Progress value={exportProgress} className="h-3 mb-2" />
            
            <div className="text-xs font-mono text-text-muted" data-testid="text-export-status">
              {exportStatus}
            </div>
          </div>
        )}

        {/* Export Settings Preview */}
        <div className="mb-6 p-4 bg-black/30 rounded border border-accent-primary/20">
          <h4 className="font-mono text-accent-primary mb-3">EXPORT SETTINGS</h4>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <span className="text-text-muted">Format: </span>
              <span className="text-accent-primary" data-testid="text-selected-format">
                {selectedFormat}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Target LUFS: </span>
              <span className="text-accent-primary" data-testid="text-target-lufs">
                {exportTargets.find(t => t.id === selectedFormat)?.lufs} LUFS
              </span>
            </div>
            <div>
              <span className="text-text-muted">Sample Rate: </span>
              <span className="text-accent-primary" data-testid="text-sample-rate">
                {exportTargets.find(t => t.id === selectedFormat)?.sampleRate} kHz
              </span>
            </div>
            <div>
              <span className="text-text-muted">Bit Depth: </span>
              <span className="text-accent-primary">24-bit</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center">
          <Button
            size="lg"
            disabled={isExporting}
            onClick={handleExport}
            className={cn(
              "font-mono font-bold px-8 py-3",
              isExporting ? "animate-pulse" : "hover:shadow-glow-md"
            )}
            data-testid="button-transmit-signal"
          >
            {isExporting ? "TRANSMITTING..." : "TRANSMIT SIGNAL"}
          </Button>
        </div>

        {/* Status Information */}
        <div className="mt-6 text-center">
          <div className="font-mono text-sm text-text-muted">
            {isExporting 
              ? "Signal transmission in progress..." 
              : "Ready to transmit optimized signal"
            }
          </div>
        </div>
      </div>
    </NeonCard>
  );
}
