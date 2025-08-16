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
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSessionStore } from '@/state/useSessionStore';
import { Download, RefreshCw, FileText } from 'lucide-react';

export default function TransmissionPanel() {
  const exportStatus = useSessionStore(state => state.exportStatus);
  const resetExportStatus = useSessionStore(state => state.resetExportStatus);

  const handleExportSession = () => {
    // TODO: Implement actual export logic
    console.log('Exporting session...');
  };

  const getStatusBadge = () => {
    switch (exportStatus.phase) {
      case 'render':
        return <Badge className="bg-blue-600">Rendering</Badge>;
      case 'encode':
        return <Badge className="bg-purple-600">Encoding</Badge>;
      case 'zip':
        return <Badge className="bg-green-600">Packaging</Badge>;
      case 'done':
        return <Badge className="bg-green-600">Complete</Badge>;
      case 'error':
        return <Badge className="bg-red-600">Error</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-500/30 bg-green-950/20">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border border-green-500/30 rounded">
              <div className="text-sm font-semibold text-green-400">WAV</div>
              <div className="text-xs text-gray-400">24-bit</div>
            </div>
            <div className="text-center p-3 border border-green-500/30 rounded">
              <div className="text-sm font-semibold text-green-400">MP3</div>
              <div className="text-xs text-gray-400">320kbps</div>
            </div>
            <div className="text-center p-3 border border-green-500/30 rounded">
              <div className="text-sm font-semibold text-green-400">FLAC</div>
              <div className="text-xs text-gray-400">Lossless</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {exportStatus.phase !== 'idle' && (
        <Card className="border-gray-700 bg-black/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Export Progress
              {getStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={exportStatus.progress} className="mb-2" />
            {exportStatus.message && (
              <p className="text-sm text-gray-400">{exportStatus.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={resetExportStatus}
          className="border-gray-600 text-gray-400"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset All
        </Button>
        
        <Button
          onClick={handleExportSession}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Session
        </Button>
      </div>
    </div>
  );
}
