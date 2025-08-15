import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  Activity,
  Eye,
  Settings,
  TrendingUp
} from 'lucide-react';
import { SpectrumCanvas } from './vis/SpectrumCanvas';
import { ScopeCanvas } from './vis/ScopeCanvas';
import { MeterStacks } from './vis/MeterStacks';
import { liveFeed } from '@/state/liveFeedHub';
import { useMasteringStore } from '@/state/masteringStore';

/**
 * Phase1DeepSignal - Interactive Phase 1 mastering card
 * Deep signal analysis with real-time visualizations
 */
export function Phase1DeepSignal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const { 
    currentSession, 
    audioMetrics,
    setSessionPhase
  } = useMasteringStore();
  
  useEffect(() => {
    // Set current phase
    setSessionPhase('phase1');
  }, [setSessionPhase]);
  
  const handleStartAnalysis = async () => {
    setIsProcessing(true);
    setProgress(0);
    setAnalysisComplete(false);
    
    // Start live feed
    liveFeed.ui.action('Starting Phase 1: Deep Signal Deconstruction');
    liveFeed.analysis.progress('Initializing analysis pipeline...', 0);
    
    // Simulate analysis pipeline with realistic progress
    const stages = [
      { name: 'Loading audio worklets...', duration: 800 },
      { name: 'Computing LUFS integration...', duration: 1200 },
      { name: 'True peak detection...', duration: 900 },
      { name: 'LRA calculation with gating...', duration: 1000 },
      { name: 'Spectral analysis (1/24-oct)...', duration: 1500 },
      { name: 'Stereo correlation mapping...', duration: 700 },
      { name: 'AI model initialization...', duration: 1100 },
      { name: 'Feature extraction...', duration: 1300 },
      { name: 'Finalizing metrics...', duration: 600 }
    ];
    
    let currentProgress = 0;
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      liveFeed.analysis.progress(stage.name, currentProgress);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      
      currentProgress = Math.round(((i + 1) / stages.length) * 100);
      setProgress(currentProgress);
      
      // Send some worklet data during processing
      if (i >= 2) {
        liveFeed.worklet.lufs({}, -14.2 + Math.random() * 2);
        liveFeed.worklet.dbtp({}, -1.1 + Math.random() * 0.5);
        liveFeed.worklet.lra({}, 6.8 + Math.random());
      }
      
      if (i === 6) {
        liveFeed.ai.init('YAMNet model loaded, preparing embeddings...');
      }
      
      if (i === 7) {
        liveFeed.ai.epoch('Training audio classifier head...', 1, 0.045);
      }
    }
    
    // Complete
    liveFeed.analysis.summary('Phase 1 analysis complete - all metrics within tolerance');
    liveFeed.ai.done('AI analysis ready for Phase 2 processing');
    liveFeed.complete('phase1', 'Deep Signal Deconstruction completed successfully');
    
    setIsProcessing(false);
    setAnalysisComplete(true);
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    liveFeed.ui.action(isPlaying ? 'Playback paused' : 'Playback started');
  };
  
  const handleReset = () => {
    setProgress(0);
    setIsProcessing(false);
    setAnalysisComplete(false);
    setIsPlaying(false);
    liveFeed.ui.action('Phase 1 reset to initial state');
  };
  
  return (
    <div className="card-terminal">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="card-header">
          <Zap className="w-5 h-5" />
          Phase 1: Deep Signal Deconstruction
          <span className={`status-indicator ${analysisComplete ? 'status-indicator--active' : isProcessing ? 'status-indicator--warning' : 'status-indicator--inactive'}`} />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlayPause}
            disabled={!analysisComplete}
            className="btn-terminal btn-terminal--secondary"
            size="sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            onClick={handleReset}
            className="btn-terminal btn-terminal--secondary"
            size="sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Progress */}
      {isProcessing && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-terminal-sm">Analysis Progress</span>
            <span className="text-terminal-sm text-color-primary">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="w-full h-2 bg-terminal-border"
          />
        </div>
      )}
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time visualizations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spectrum Canvas */}
          <div className="card-terminal p-4">
            <h3 className="text-terminal-base font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Spectrum Analysis
            </h3>
            <SpectrumCanvas 
              width={480} 
              height={200} 
              isActive={isPlaying || isProcessing}
            />
          </div>
          
          {/* Scope Canvas */}
          <div className="card-terminal p-4">
            <h3 className="text-terminal-base font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Vectorscope & Correlation
            </h3>
            <ScopeCanvas 
              width={480} 
              height={200} 
              isActive={isPlaying || isProcessing}
            />
          </div>
        </div>
        
        {/* Meter stacks and controls */}
        <div className="space-y-6">
          {/* Meters */}
          <div className="card-terminal p-4">
            <h3 className="text-terminal-base font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time Meters
            </h3>
            <MeterStacks isActive={isPlaying || isProcessing} />
          </div>
          
          {/* Controls */}
          <div className="card-terminal p-4">
            <h3 className="text-terminal-base font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Analysis Controls
            </h3>
            
            <div className="space-y-4">
              <Button
                onClick={handleStartAnalysis}
                disabled={isProcessing}
                className="btn-terminal w-full"
              >
                {isProcessing ? 'Processing...' : 'Start Deep Analysis'}
              </Button>
              
              <div className="space-y-2 text-terminal-xs">
                <div className="flex justify-between">
                  <span>LUFS Integration:</span>
                  <span className="text-color-primary">
                    {audioMetrics?.lufs?.toFixed(1) || '--'} LUFS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>True Peak:</span>
                  <span className="text-color-primary">
                    {audioMetrics?.dbtp?.toFixed(1) || '--'} dBTP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LRA:</span>
                  <span className="text-color-primary">
                    {audioMetrics?.lra?.toFixed(1) || '--'} LU
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stereo Correlation:</span>
                  <span className="text-color-primary">
                    {audioMetrics?.correlation?.toFixed(2) || '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mission Status */}
          {analysisComplete && (
            <div className="card-terminal p-4 border-status-success">
              <h3 className="text-terminal-base font-semibold mb-2 text-status-success">
                Phase 1 Complete
              </h3>
              <p className="text-terminal-xs text-terminal-text-muted">
                Signal analysis complete. Ready to proceed to Phase 2: AI Enhancement.
              </p>
              <Button
                className="btn-terminal w-full mt-3"
                onClick={() => liveFeed.ui.action('Proceeding to Phase 2...')}
              >
                Continue to Phase 2
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}