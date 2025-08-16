import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionStore } from '@/state/useSessionStore';
import { EngineParams, Metrics } from '@/types/audio';
import { Zap, Play, Settings } from 'lucide-react';

// BLACKROOM AI Presets
const PRESETS = {
  CLUB_MASTER: 'Club Master',
  VINYL_WARM: 'Vinyl Warm',
  STREAMING_LOUD: 'Streaming Loud',
  RADIO_READY: 'Radio Ready',
  AI_SUGGEST: 'AI Suggest',
  BERLIN_CONCRETE: 'Berlin Concrete',
  SUB_ABYSS: 'Sub Abyss',
  DOME_SHIFT: 'Dome Shift',
} as const;

// AI Macros
interface MacroState {
  harmonicBoost: number;
  subweight: number;
  transientPunch: number;
  airlift: number;
  spatialFlux: number;
}

const initialMacros: MacroState = {
  harmonicBoost: 0,
  subweight: 0,
  transientPunch: 0,
  airlift: 0,
  spatialFlux: 0,
};

export function BlackroomPanel() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('AI_SUGGEST');
  const [macros, setMacros] = useState<MacroState>(initialMacros);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    setPhase2Source, 
    activateProcessedPreview, 
    metricsA, 
    fftA,
    phase2Source,
    processedReady 
  } = useSessionStore();

  const handleMacroChange = useCallback((macro: keyof MacroState, value: number) => {
    setMacros(prev => ({ ...prev, [macro]: value }));
  }, []);

  const handlePresetSelect = useCallback((preset: keyof typeof PRESETS) => {
    setSelectedPreset(preset);
    
    // Apply preset-specific macro values
    const presetMacros: Record<keyof typeof PRESETS, MacroState> = {
      CLUB_MASTER: { harmonicBoost: 0.7, subweight: 0.8, transientPunch: 0.6, airlift: 0.4, spatialFlux: 0.5 },
      VINYL_WARM: { harmonicBoost: 0.3, subweight: 0.4, transientPunch: 0.2, airlift: 0.6, spatialFlux: 0.3 },
      STREAMING_LOUD: { harmonicBoost: 0.8, subweight: 0.6, transientPunch: 0.9, airlift: 0.3, spatialFlux: 0.4 },
      RADIO_READY: { harmonicBoost: 0.6, subweight: 0.5, transientPunch: 0.7, airlift: 0.5, spatialFlux: 0.6 },
      AI_SUGGEST: { harmonicBoost: 0.5, subweight: 0.5, transientPunch: 0.5, airlift: 0.5, spatialFlux: 0.5 },
      BERLIN_CONCRETE: { harmonicBoost: 0.9, subweight: 0.9, transientPunch: 0.8, airlift: 0.2, spatialFlux: 0.7 },
      SUB_ABYSS: { harmonicBoost: 0.2, subweight: 1.0, transientPunch: 0.3, airlift: 0.8, spatialFlux: 0.9 },
      DOME_SHIFT: { harmonicBoost: 0.4, subweight: 0.3, transientPunch: 0.6, airlift: 0.9, spatialFlux: 0.8 },
    };
    
    setMacros(presetMacros[preset]);
  }, []);

  const handleProcessMastering = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // AI feature extraction from metricsA
      const features = extractFeatures(metricsA);
      
      // ONNX inference (simulated for now)
      const aiParams = await performAiInference(features, selectedPreset);
      
      // Apply macros to AI params
      const finalParams: EngineParams = applyMacros(aiParams, macros);
      
      // Create processed snapshot (simulated processing for now)
      const processedMetrics: Metrics = {
        ...metricsA,
        peakDb: Math.min(metricsA.peakDb + 2, -1), // Boost but limit
        lufsI: Math.max(metricsA.lufsI + 4, -14), // Increase loudness
        corr: Math.min(metricsA.corr + 0.1, 1), // Improve correlation
        widthPct: Math.min(metricsA.widthPct + 10, 100), // Widen stereo
        headroomDb: Math.max(metricsA.headroomDb - 1, 0), // Reduce headroom
      };
      
      const processedFft = fftA ? new Float32Array(fftA) : new Float32Array(512);
      
      // Apply spectral processing
      if (processedFft) {
        for (let i = 0; i < processedFft.length; i++) {
          processedFft[i] *= 1.1; // Slight boost
        }
      }
      
      const snapshot = {
        metrics: processedMetrics,
        fft: processedFft,
      };
      
      // Activate processed preview and switch to post source
      activateProcessedPreview(snapshot);
      setPhase2Source('post');
      
    } catch (error) {
      console.error('AI processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [metricsA, fftA, selectedPreset, macros, activateProcessedPreview, setPhase2Source]);

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-orange-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono flex items-center text-orange-400">
          <Zap className="w-4 h-4 mr-2" />
          BLACKROOM AI
          {processedReady && <Badge className="ml-2 bg-orange-600 text-white">PROCESSED</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Preset Selection */}
        <div>
          <div className="text-xs font-mono text-orange-300 mb-2">AI PRESETS</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, name]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedPreset === key ? "default" : "outline"}
                onClick={() => handlePresetSelect(key as keyof typeof PRESETS)}
                className={selectedPreset === key 
                  ? "bg-orange-600 hover:bg-orange-700 text-white" 
                  : "border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
                }
              >
                <span className="text-xs">{name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* AI Macros */}
        <div>
          <div className="text-xs font-mono text-orange-300 mb-2">AI MACROS</div>
          <div className="space-y-3">
            {Object.entries(macros).map(([macro, value]) => (
              <div key={macro} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono capitalize text-orange-200">
                    {macro.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-xs text-orange-300">
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newValue]) => handleMacroChange(macro as keyof MacroState, newValue)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Process Mastering CTA */}
        <div className="pt-3 border-t border-orange-800">
          <Button
            onClick={handleProcessMastering}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-mono"
          >
            {isProcessing ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                PROCESSING...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                PROCESS MASTERING
              </>
            )}
          </Button>
          
          {processedReady && (
            <div className="mt-2 text-center">
              <Badge className="bg-orange-600 text-white">
                Phase-2 → Processed Preview Active
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions for AI processing
function extractFeatures(metrics: Metrics) {
  return {
    loudness: metrics.lufsI,
    peak: metrics.peakDb,
    dynamics: metrics.lra,
    stereo: metrics.corr,
    width: metrics.widthPct,
    noise: metrics.noiseFloorDb,
  };
}

async function performAiInference(features: any, preset: keyof typeof PRESETS): Promise<EngineParams> {
  // Simulated ONNX inference - would use onnxruntime-web in production
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const presetParams: Record<keyof typeof PRESETS, EngineParams> = {
    CLUB_MASTER: {
      msEq: { m: { low: 2, mid: 1, high: 3 }, s: { low: 0, mid: 2, high: 4 } },
      denoise: { amount: 0.2 },
      limiter: { threshold: -2, ceiling: -0.1, lookaheadMs: 5, knee: 0.5 },
    },
    VINYL_WARM: {
      msEq: { m: { low: 1, mid: 0, high: -1 }, s: { low: 0, mid: 1, high: 1 } },
      denoise: { amount: 0.1 },
      limiter: { threshold: -4, ceiling: -0.5, lookaheadMs: 10, knee: 1.0 },
    },
    STREAMING_LOUD: {
      msEq: { m: { low: 3, mid: 2, high: 4 }, s: { low: 1, mid: 3, high: 5 } },
      denoise: { amount: 0.3 },
      limiter: { threshold: -1, ceiling: -0.1, lookaheadMs: 3, knee: 0.3 },
    },
    RADIO_READY: {
      msEq: { m: { low: 2, mid: 3, high: 2 }, s: { low: 1, mid: 2, high: 3 } },
      denoise: { amount: 0.25 },
      limiter: { threshold: -2, ceiling: -0.2, lookaheadMs: 4, knee: 0.4 },
    },
    AI_SUGGEST: {
      msEq: { m: { low: 1, mid: 1, high: 1 }, s: { low: 0, mid: 1, high: 2 } },
      denoise: { amount: 0.15 },
      limiter: { threshold: -3, ceiling: -0.3, lookaheadMs: 6, knee: 0.6 },
    },
    BERLIN_CONCRETE: {
      msEq: { m: { low: 4, mid: 0, high: 6 }, s: { low: 2, mid: 1, high: 8 } },
      denoise: { amount: 0.05 },
      limiter: { threshold: -1, ceiling: -0.1, lookaheadMs: 2, knee: 0.2 },
    },
    SUB_ABYSS: {
      msEq: { m: { low: 6, mid: -2, high: -4 }, s: { low: 8, mid: 0, high: 2 } },
      denoise: { amount: 0.4 },
      limiter: { threshold: -4, ceiling: -0.5, lookaheadMs: 12, knee: 1.2 },
    },
    DOME_SHIFT: {
      msEq: { m: { low: 0, mid: -1, high: 8 }, s: { low: 2, mid: 4, high: 12 } },
      denoise: { amount: 0.1 },
      limiter: { threshold: -3, ceiling: -0.2, lookaheadMs: 8, knee: 0.8 },
    },
  };
  
  return presetParams[preset];
}

function applyMacros(params: EngineParams, macros: MacroState): EngineParams {
  return {
    ...params,
    macros,
    msEq: {
      m: {
        low: params.msEq.m.low * (1 + macros.harmonicBoost * 0.5),
        mid: params.msEq.m.mid * (1 + macros.transientPunch * 0.3),
        high: params.msEq.m.high * (1 + macros.airlift * 0.4),
      },
      s: {
        low: params.msEq.s.low * (1 + macros.subweight * 0.6),
        mid: params.msEq.s.mid * (1 + macros.spatialFlux * 0.3),
        high: params.msEq.s.high * (1 + macros.airlift * 0.5),
      },
    },
  };
}