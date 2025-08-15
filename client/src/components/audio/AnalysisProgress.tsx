import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  progress: number;
  currentStage?: string;
  className?: string;
}

export function AnalysisProgress({ 
  isAnalyzing, 
  progress, 
  currentStage = 'Initializing...', 
  className = '' 
}: AnalysisProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [stageText, setStageText] = useState(currentStage);

  const stages = [
    'Loading audio buffer...',
    'Extracting frequency spectrum...',
    'Analyzing dynamic range...',
    'Computing stereo imaging...',
    'Measuring loudness levels...',
    'Detecting phase relationships...',
    'Calculating harmonic content...',
    'Evaluating transient response...',
    'Generating analysis report...',
    'Analysis complete.'
  ];

  useEffect(() => {
    if (isAnalyzing) {
      setDisplayProgress(progress);
      
      // Update stage text based on progress
      const stageIndex = Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1);
      setStageText(stages[stageIndex]);
    }
  }, [progress, isAnalyzing]);

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
          {Math.round(displayProgress)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full h-2 bg-black/60 border border-cyan-500/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 relative"
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Scanning effect */}
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
          </motion.div>
        </div>
        
        {/* Progress markers */}
        <div className="absolute top-0 left-0 w-full h-2 flex justify-between">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-0.5 h-full ${
                (i + 1) * 10 <= displayProgress 
                  ? 'bg-cyan-400' 
                  : 'bg-gray-600'
              }`}
              style={{ marginLeft: i === 0 ? '0' : '-1px' }}
            />
          ))}
        </div>
      </div>

      {/* Current Stage */}
      <div className="flex items-center space-x-2 mb-3">
        <motion.div
          className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="font-mono text-xs text-cyan-400/80">
          {stageText}
        </span>
      </div>

      {/* Analysis Meters */}
      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="text-center">
          <div className="text-emerald-400 font-semibold">FREQ</div>
          <div className="text-gray-400">
            {displayProgress > 20 ? '✓' : '...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-cyan-400 font-semibold">DYN</div>
          <div className="text-gray-400">
            {displayProgress > 40 ? '✓' : '...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-semibold">LUFS</div>
          <div className="text-gray-400">
            {displayProgress > 70 ? '✓' : '...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-orange-400 font-semibold">PHASE</div>
          <div className="text-gray-400">
            {displayProgress > 90 ? '✓' : '...'}
          </div>
        </div>
      </div>
    </div>
  );
}