import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Zap, Settings, Play } from 'lucide-react';
import { useSessionStore, usePhase2Source } from '@/state/useSessionStore';
import { EngineParams } from '@/types/audio';

const PRESETS = {
  CLUB_MASTER: 'Club Master',
  VINYL_WARM: 'Vinyl Warm',
  STREAMING_LOUD: 'Streaming Loud', 
  RADIO_READY: 'Radio Ready',
  AI_SUGGEST: 'AI Suggest',
  BERLIN_CONCRETE: 'Berlin Concrete',
  SUB_ABYSS: 'Sub Abyss',
  DOME_SHIFT: 'Dome Shift'
} as const;

interface MacroControls {
  harmonicBoost: number;
  subweight: number; 
  transientPunch: number;
  airlift: number;
  spatialFlux: number;
}

export const BlackroomPanel: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('AI_SUGGEST');
  const [showMacros, setShowMacros] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const phase2Source = usePhase2Source();
  const setPhase2Source = useSessionStore(s => s.setPhase2Source);
  const activateProcessedPreview = useSessionStore(s => s.activateProcessedPreview);

  const [macros, setMacros] = useState<MacroControls>({
    harmonicBoost: 0,
    subweight: 0,
    transientPunch: 0,
    airlift: 0,
    spatialFlux: 0
  });

  const handleProcessMastering = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Simulate AI processing and parameter inference
      const params: EngineParams = {
        msEq: { 
          m: { low: 0, mid: 0, high: 0 },
          s: { low: 0, mid: 0, high: 0 }
        },
        denoise: { amount: 0.1 },
        limiter: { threshold: -6, ceiling: -1, lookaheadMs: 5, knee: 2 },
        macros
      };

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock processed preview snapshot
      const snapshot = {
        metrics: {
          peakDb: -3.2,
          truePeakDb: -0.8,
          rmsDb: -14.5,
          lufsI: -23.0,
          lufsS: -21.2,
          lra: 7.3,
          corr: 0.85,
          widthPct: 78,
          noiseFloorDb: -60,
          headroomDb: 0.8
        },
        fft: new Float32Array(512).fill(0).map(() => Math.random() * -40)
      };

      activateProcessedPreview(snapshot);
      setPhase2Source('post');
      
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [macros, activateProcessedPreview, setPhase2Source]);

  const handleMacroChange = useCallback((macro: keyof MacroControls, value: number) => {
    setMacros(prev => ({ ...prev, [macro]: value }));
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono">BLACKROOM AI + Manual</CardTitle>
          {phase2Source === 'post' && (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              PREVIEW: PROCESSED
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preset Selection */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(PRESETS).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedPreset === key ? 'default' : 'outline'}
              size="sm"
              className="text-xs font-mono"
              onClick={() => setSelectedPreset(key as keyof typeof PRESETS)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Signal Modulation Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-mono text-muted-foreground">Signal Modulation Zone</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMacros(!showMacros)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
          
          {showMacros && (
            <div className="space-y-3 p-3 border rounded-md bg-muted/20">
              {Object.entries(macros).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-xs font-mono capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="w-24">
                    <Slider
                      value={[value]}
                      onValueChange={([val]) => handleMacroChange(key as keyof MacroControls, val)}
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">
                    {value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Process Mastering CTA */}
        <Button 
          onClick={handleProcessMastering}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          <Zap className="h-4 w-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Process Mastering'}
        </Button>
      </CardContent>
    </Card>
  );
};