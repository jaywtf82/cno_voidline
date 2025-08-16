/**
 * OptimizedAnalysisPanel - High-performance audio analysis component
 * Uses the optimized worklet system to prevent UI lag and scrolling issues
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnalysisProgress } from './AnalysisProgress';
import { useOptimizedAudioAnalysis } from '@/hooks/useOptimizedAudioAnalysis';
import { Button } from '@/components/ui/button';
import { Upload, Play, Square } from 'lucide-react';

interface OptimizedAnalysisPanelProps {
  onAnalysisComplete?: (metrics: any) => void;
  className?: string;
}

export function OptimizedAnalysisPanel({
  onAnalysisComplete,
  className = ''
}: OptimizedAnalysisPanelProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const {
    isAnalyzing,
    progress,
    currentStage,
    metrics,
    error,
    startAnalysis,
    stopAnalysis
  } = useOptimizedAudioAnalysis();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedAudioBuffer);
      audioContext.close();
    } catch (error) {
      console.error('Failed to decode audio file:', error);
    }
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!audioBuffer) return;

    try {
      const result = await startAnalysis(audioBuffer);
      console.log('Analysis completed:', result);
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [audioBuffer, startAnalysis, onAnalysisComplete]);

  const handleStopAnalysis = useCallback(() => {
    stopAnalysis();
  }, [stopAnalysis]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Section */}
      <div className="bg-black/80 border border-emerald-500/30 rounded-lg p-6">
        <h3 className="font-mono text-lg text-emerald-400 font-bold tracking-wider mb-4">
          AUDIO INPUT
        </h3>
        
        <div className="space-y-4">
          <label className="block">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={isAnalyzing}
              className="hidden"
            />
            <div className="border-2 border-dashed border-emerald-500/30 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500/50 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-emerald-400 font-mono">
                {audioFile ? audioFile.name : 'Click to upload audio file'}
              </p>
            </div>
          </label>

          {audioFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-black/40 rounded border border-emerald-500/30"
            >
              <div className="text-emerald-400 font-mono text-sm">
                <div>File: {audioFile.name}</div>
                <div>Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={!audioBuffer || isAnalyzing}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
                
                {isAnalyzing && (
                  <Button
                    onClick={handleStopAnalysis}
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Analysis Progress */}
      {(isAnalyzing || progress > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <AnalysisProgress
            isAnalyzing={isAnalyzing}
            progress={progress}
            currentStage={currentStage}
            metrics={metrics}
          />
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
        >
          <h4 className="text-red-400 font-mono font-bold mb-2">Analysis Error</h4>
          <p className="text-red-300 font-mono text-sm">{error}</p>
        </motion.div>
      )}

      {/* Results Display */}
      {metrics && !isAnalyzing && progress === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 border border-emerald-500/30 rounded-lg p-6"
        >
          <h3 className="font-mono text-lg text-emerald-400 font-bold tracking-wider mb-4">
            ANALYSIS RESULTS
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-sm">
            <div className="bg-black/40 p-3 rounded border border-emerald-500/30">
              <div className="text-emerald-400 font-semibold mb-1">LUFS</div>
              <div className="text-emerald-300 text-lg">
                {metrics.lufs.toFixed(1)}
              </div>
            </div>
            
            <div className="bg-black/40 p-3 rounded border border-cyan-500/30">
              <div className="text-cyan-400 font-semibold mb-1">PEAK</div>
              <div className="text-cyan-300 text-lg">
                {metrics.peak.toFixed(1)} dB
              </div>
            </div>
            
            <div className="bg-black/40 p-3 rounded border border-yellow-500/30">
              <div className="text-yellow-400 font-semibold mb-1">RMS</div>
              <div className="text-yellow-300 text-lg">
                {metrics.rms.toFixed(1)} dB
              </div>
            </div>
            
            <div className="bg-black/40 p-3 rounded border border-orange-500/30">
              <div className="text-orange-400 font-semibold mb-1">DR</div>
              <div className="text-orange-300 text-lg">
                {metrics.dynamicRange.toFixed(1)} dB
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded">
            <div className="text-emerald-400 font-mono text-sm mb-1">Correlation</div>
            <div className="text-emerald-300 font-mono">
              {(metrics.correlation * 100).toFixed(1)}%
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}