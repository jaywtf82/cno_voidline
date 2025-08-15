/**
 * MasteringProcess.tsx - Professional Mastering Process Interface
 * 
 * CONTROLS:
 * - Phase filter chips: Click to toggle/focus (Nuance, Dynamics, Frequencies, Stereo Image)
 * - Spectrum analyzer: Cmd/Ctrl-drag for freq zoom, Shift-drag for level zoom
 * - Vectorscope: Double-click to reset, Space to freeze, hover for readouts
 * - All visualizers: PNG export via right-click context menu
 * - Target corridor selector: Choose between Streaming, Club, Vinyl profiles
 * 
 * QA STEPS:
 * 1. Verify session data loads correctly from previous analysis
 * 2. Test all phase filter interactions and visual updates
 * 3. Check real-time worklet processing (no audio dropouts)
 * 4. Verify standards metrics match offline analysis within ±0.5 LU
 * 5. Test AI analyzer outputs (if enabled) show proper risk flags
 * 6. Confirm responsive layout and 60fps performance on mid-range devices
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import { FloatingSystemToast } from '@/components/system/FloatingSystemToast';
import { useMasteringStore } from '@/state/masteringStore';
import { Phase1DeepSignal } from '@/components/mastering/Phase1DeepSignal';
import { SpectrumCanvas } from '@/components/mastering/vis/SpectrumCanvas';
import { ScopeCanvas } from '@/components/mastering/vis/ScopeCanvas';
import { MeterStacks } from '@/components/mastering/vis/MeterStacks';
import { AnalysisPipeline } from '@/lib/audio/analysisPipeline';
import { VisualBus } from '@/lib/audio/visualBus';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type PhaseFilter = 'nuance' | 'dynamics' | 'frequencies' | 'stereo';
type TargetCorridor = 'streaming' | 'club' | 'vinyl';

export default function MasteringProcess() {
  const [location, navigate] = useNavigate();
  const { session, loadSession, updateSettings } = useMasteringStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // State
  const [activePhase, setActivePhase] = useState<PhaseFilter>('nuance');
  const [targetCorridor, setTargetCorridor] = useState<TargetCorridor>('streaming');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workletMetrics, setWorkletMetrics] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showExportToast, setShowExportToast] = useState(false);
  // Placeholder for analysis progress, actual calculation would depend on worklet metrics or pipeline state
  const [analysisProgress, setAnalysisProgress] = useState(0); 


  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysisPipelineRef = useRef<AnalysisPipeline | null>(null);
  const visualBusRef = useRef<VisualBus | null>(null);

  // Extract session ID from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sessionId = urlParams.get('id');

  // Initialize audio processing
  useEffect(() => {
    const initializeAudio = async () => {
      if (!session?.buffer) return;

      try {
        // Initialize audio context and worklets
        audioContextRef.current = new AudioContext();
        await audioContextRef.current.audioWorklet.addModule('/worklets/lufs-processor.js');
        await audioContextRef.current.audioWorklet.addModule('/worklets/peaks-rms-processor.js');
        await audioContextRef.current.audioWorklet.addModule('/worklets/correlation-processor.js');

        // Initialize analysis pipeline
        analysisPipelineRef.current = new AnalysisPipeline(audioContextRef.current);
        visualBusRef.current = new VisualBus();

        // Start real-time processing
        await analysisPipelineRef.current.startRealTimeAnalysis(session.buffer);

        // Subscribe to worklet updates
        visualBusRef.current.subscribe('metrics', (metrics) => {
            setWorkletMetrics(metrics);
            // Simple progress calculation: based on time elapsed in buffer
            if (metrics && metrics.currentTime) {
                const progress = (metrics.currentTime / session.buffer.duration) * 100;
                setAnalysisProgress(Math.min(progress, 100)); // Ensure progress doesn't exceed 100%
            }
        });

        setIsProcessing(true);

        toast({
          title: "Analysis Started",
          description: "Real-time processing active",
        });

      } catch (error) {
        console.error('Failed to initialize audio processing:', error);
        toast({
          title: "Processing Error",
          description: "Failed to start real-time analysis",
          variant: "destructive",
        });
      }
    };

    if (sessionId && !session) {
      loadSession(sessionId);
    } else if (session) {
      initializeAudio();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [session, sessionId, loadSession, toast]);

  // Handle phase filter changes
  const handlePhaseChange = useCallback((phase: PhaseFilter) => {
    setActivePhase(phase);
    updateSettings({ activePhase: phase });
  }, [updateSettings]);

  // Handle target corridor changes
  const handleCorridorChange = useCallback((corridor: TargetCorridor) => {
    setTargetCorridor(corridor);
    updateSettings({ corridor });
  }, [updateSettings]);

  // Redirect if no session
  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono text-red-400 mb-4">Session Not Found</h1>
          <p className="text-gray-400 mb-4">No mastering session found for ID: {sessionId}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Return to Landing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-4">
                <Button 
                  variant="link" 
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                  onClick={() => navigate('/')}
                >
                  /home
                </Button>
                <Button 
                  variant="link" 
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                  onClick={() => navigate('/console')}
                >
                  /console
                </Button>
              </nav>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mission Status */}
      <div className="bg-black/90 border-b border-cyan-500/20 px-6 py-3">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-mono text-sm text-cyan-400">MISSION PROGRESS</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden min-w-[200px]">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="font-mono text-sm text-white">{Math.round(analysisProgress)}%</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-mono text-xs text-gray-400">
                {session.fileMeta.duration.toFixed(1)}s • {session.fileMeta.sr/1000}kHz • {session.fileMeta.channels}ch
              </span>
              {isProcessing && (
                <Badge variant="outline" className="border-green-500 text-green-400">
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        {/* Target Corridor Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-sm text-gray-400">TARGET CORRIDOR:</span>
            <div className="flex space-x-2">
              {(['streaming', 'club', 'vinyl'] as TargetCorridor[]).map((corridor) => (
                <Button
                  key={corridor}
                  variant={targetCorridor === corridor ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCorridorChange(corridor)}
                  className="font-mono text-xs uppercase"
                >
                  {corridor}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 1: Deep Signal Deconstruction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Phase1DeepSignal
            activePhase={activePhase}
            onPhaseChange={handlePhaseChange}
            session={session}
            workletMetrics={workletMetrics}
            aiAnalysis={aiAnalysis}
            targetCorridor={targetCorridor}
          />
        </motion.div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spectrum Analyzer */}
          <Card className="bg-black/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="font-mono text-sm text-cyan-400 flex items-center justify-between">
                HYBRID SPECTRUM ANALYZER
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">1/24 OCT + LOG</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SpectrumCanvas
                audioContext={audioContextRef.current}
                session={session}
                activePhase={activePhase}
                targetCorridor={targetCorridor}
              />
            </CardContent>
          </Card>

          {/* Vectorscope */}
          <Card className="bg-black/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="font-mono text-sm text-cyan-400 flex items-center justify-between">
                STEREO VECTORSCOPE
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">POLAR + CORRELATION</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScopeCanvas
                audioContext={audioContextRef.current}
                session={session}
                mode={session.settings?.scopeMode || 'polar'}
                workletMetrics={workletMetrics}
              />
            </CardContent>
          </Card>

          {/* Meter Stacks */}
          <Card className="bg-black/90 border-cyan-500/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-mono text-sm text-cyan-400 flex items-center justify-between">
                STANDARDS COMPLIANCE METERS
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">ITU-R BS.1770 / EBU R128</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MeterStacks
                session={session}
                workletMetrics={workletMetrics}
                targetCorridor={targetCorridor}
                activePhase={activePhase}
              />
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Panel (if available) */}
        {aiAnalysis && (
          <Card className="bg-black/90 border-cyan-500/30 mb-8">
            <CardHeader>
              <CardTitle className="font-mono text-sm text-cyan-400">
                AI ANALYZER INSIGHTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-mono text-cyan-400 mb-1">
                    {aiAnalysis.balance || 0}
                  </div>
                  <div className="text-xs text-gray-400">BALANCE SCORE</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono text-cyan-400 mb-1">
                    {aiAnalysis.dynamics || 0}
                  </div>
                  <div className="text-xs text-gray-400">DYNAMICS SCORE</div>
                </div>
                <div className="text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {(aiAnalysis.risks || []).map((risk: string, index: number) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">RISK FLAGS</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Export System Toast */}
      <FloatingSystemToast 
        isActive={showExportToast}
        onComplete={() => {
          setShowExportToast(false);
        }}
      />
    </div>
  );
}