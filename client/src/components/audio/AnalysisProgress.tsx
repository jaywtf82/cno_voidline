
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  progress: number;
  currentStage?: string;
  className?: string;
  metrics?: {
    lufs?: number;
    peak?: number;
    rms?: number;
    dynamicRange?: number;
  };
}

export function AnalysisProgress({ 
  isAnalyzing, 
  progress, 
  currentStage = 'Initializing...', 
  className = '',
  metrics
}: AnalysisProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [stageText, setStageText] = useState(currentStage);
  const [stageMetrics, setStageMetrics] = useState({
    freq: false,
    dynamics: false,
    lufs: false,
    phase: false
  });

  // Enhanced stage definitions with proper timing
  const stages = [
    { text: 'Loading audio buffer...', threshold: 5 },
    { text: 'Extracting frequency spectrum...', threshold: 15 },
    { text: 'Analyzing dynamic range...', threshold: 30 },
    { text: 'Computing stereo imaging...', threshold: 45 },
    { text: 'Measuring loudness levels...', threshold: 60 },
    { text: 'Detecting phase relationships...', threshold: 75 },
    { text: 'Calculating harmonic content...', threshold: 85 },
    { text: 'Evaluating transient response...', threshold: 90 },
    { text: 'Generating analysis report...', threshold: 95 },
    { text: 'Analysis complete.', threshold: 100 }
  ];

  useEffect(() => {
    // Always ensure we have a valid number for progress
    const safeProgress = typeof progress === 'number' && !isNaN(progress) ? 
      Math.max(0, Math.min(100, progress)) : 0;

    if (isAnalyzing) {
      // Smooth progress animation with robust NaN protection
      const animateProgress = () => {
        setDisplayProgress(prev => {
          const currentProgress = typeof prev === 'number' && !isNaN(prev) ? prev : 0;
          const diff = safeProgress - currentProgress;
          
          if (Math.abs(diff) < 0.5) return safeProgress;
          return currentProgress + (diff * 0.2); // Smoother interpolation
        });
      };

      const interval = setInterval(animateProgress, 32); // 60fps-ish
      return () => clearInterval(interval);
    } else {
      // Immediately set to safe progress when not analyzing
      setDisplayProgress(safeProgress);
    }
  }, [progress, isAnalyzing]);

  useEffect(() => {
    if (currentStage && currentStage !== 'Initializing...') {
      setStageText(currentStage);
    } else {
      // Find current stage based on progress
      const currentStageData = stages.find((stage, index) => {
        const nextStage = stages[index + 1];
        return progress >= stage.threshold && (nextStage ? progress < nextStage.threshold : true);
      });
      
      if (currentStageData) {
        setStageText(currentStageData.text);
      }
    }

    // Update stage completion indicators
    setStageMetrics({
      freq: displayProgress > 15,
      dynamics: displayProgress > 30,
      lufs: displayProgress > 60,
      phase: displayProgress > 75
    });
  }, [displayProgress, currentStage]);

  if (!isAnalyzing && progress === 0) {
    return null;
  }

  return (
    <div className={`bg-black/80 border border-cyan-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-sm text-cyan-400 font-bold tracking-wider">
          AUDIO ANALYSIS
        </h3>
        <div className="text-cyan-400/60 font-mono text-xs">
          {typeof displayProgress === 'number' && !isNaN(displayProgress) ? 
            Math.round(Math.max(0, Math.min(100, displayProgress))) : 0}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full h-2 bg-black/60 border border-cyan-500/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 relative"
            initial={{ width: "0%" }}
            animate={{ 
              width: `${typeof displayProgress === 'number' && !isNaN(displayProgress) ? 
                Math.max(0, Math.min(100, Math.round(displayProgress))) : 0}%` 
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Scanning effect */}
            {isAnalyzing && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
          </motion.div>
        </div>
        
        {/* Progress markers */}
        <div className="absolute top-0 left-0 w-full h-2 flex justify-between">
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((mark) => (
            <div
              key={mark}
              className={`w-0.5 h-full ${
                mark <= displayProgress 
                  ? 'bg-cyan-400' 
                  : 'bg-gray-600/50'
              }`}
              style={{ left: `${mark}%`, position: 'absolute' }}
            />
          ))}
        </div>
      </div>

      {/* Current Stage */}
      <div className="flex items-center space-x-2 mb-3">
        <motion.div
          className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
          animate={{ opacity: isAnalyzing ? [0.3, 1, 0.3] : 1 }}
          transition={{ duration: 1, repeat: isAnalyzing ? Infinity : 0 }}
        />
        <span className="font-mono text-xs text-cyan-400/80">
          {stageText}
        </span>
      </div>

      {/* Live Metrics Display */}
      {metrics && (
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-mono">
          {metrics.lufs && (
            <div className="text-emerald-400">
              LUFS: {metrics.lufs.toFixed(1)}
            </div>
          )}
          {metrics.peak && (
            <div className="text-cyan-400">
              PEAK: {metrics.peak.toFixed(1)}dB
            </div>
          )}
          {metrics.rms && (
            <div className="text-yellow-400">
              RMS: {metrics.rms.toFixed(1)}dB
            </div>
          )}
          {metrics.dynamicRange && (
            <div className="text-orange-400">
              DR: {metrics.dynamicRange.toFixed(1)}dB
            </div>
          )}
        </div>
      )}

      {/* Analysis Meters */}
      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="text-center">
          <div className="text-emerald-400 font-semibold">FREQ</div>
          <div className={`transition-colors ${
            stageMetrics.freq ? 'text-emerald-400' : 'text-gray-400'
          }`}>
            {stageMetrics.freq ? '✓' : '...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-cyan-400 font-semibold">DYN</div>
          <div className={`transition-colors ${
            stageMetrics.dynamics ? 'text-cyan-400' : 'text-gray-400'
          }`}>
            {stageMetrics.dynamics ? '✓' : '...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-semibold">LUFS</div>
          <div className={`transition-colors ${
            stageMetrics.lufs ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {stageMetrics.lufs ? '✓' : '...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-orange-400 font-semibold">PHASE</div>
          <div className={`transition-colors ${
            stageMetrics.phase ? 'text-orange-400' : 'text-gray-400'
          }`}>
            {stageMetrics.phase ? '✓' : '...'}
          </div>
        </div>
      </div>
    </div>
  );
}
