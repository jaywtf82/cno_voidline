/**
 * useOptimizedAudioAnalysis - Performance-optimized audio analysis hook
 * Prevents UI blocking and provides smooth progress updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getOptimizedAudioWorklet, type AnalysisMetrics } from '@/lib/audio/optimizedAudioWorklet';

export interface UseAudioAnalysisReturn {
  isAnalyzing: boolean;
  progress: number;
  currentStage: string;
  metrics: AnalysisMetrics | null;
  error: string | null;
  startAnalysis: (audioBuffer: AudioBuffer) => Promise<AnalysisMetrics>;
  stopAnalysis: () => void;
}

export function useOptimizedAudioAnalysis(): UseAudioAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('Ready');
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const workletRef = useRef(getOptimizedAudioWorklet());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Throttled progress updates to prevent excessive re-renders
  const throttledProgressUpdate = useRef<{
    lastUpdate: number;
    pendingUpdate: ReturnType<typeof setTimeout> | null;
  }>({ lastUpdate: 0, pendingUpdate: null });

  const updateProgress = useCallback((newMetrics: AnalysisMetrics) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - throttledProgressUpdate.current.lastUpdate;

    // Clear any pending update
    if (throttledProgressUpdate.current.pendingUpdate) {
      clearTimeout(throttledProgressUpdate.current.pendingUpdate);
    }

    // Update immediately if enough time has passed, otherwise schedule update
    if (timeSinceLastUpdate >= 100) { // Max 10 updates per second
      throttledProgressUpdate.current.lastUpdate = now;
      setProgress(newMetrics.progress);
      setCurrentStage(newMetrics.stage);
      setMetrics(newMetrics);
    } else {
      // Schedule update for later
      const delay = 100 - timeSinceLastUpdate;
      throttledProgressUpdate.current.pendingUpdate = setTimeout(() => {
        throttledProgressUpdate.current.lastUpdate = Date.now();
        setProgress(newMetrics.progress);
        setCurrentStage(newMetrics.stage);
        setMetrics(newMetrics);
      }, delay);
    }
  }, []);

  const startAnalysis = useCallback(async (audioBuffer: AudioBuffer): Promise<AnalysisMetrics> => {
    if (isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    // Reset state
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStage('Initializing analysis...');
    setMetrics(null);
    setError(null);

    // Create abort controller for this analysis
    abortControllerRef.current = new AbortController();

    try {
      // Initialize worklet if needed
      await workletRef.current.initialize();

      return await workletRef.current.processAudio(
        audioBuffer,
        // Progress callback
        (progressMetrics: AnalysisMetrics) => {
          if (abortControllerRef.current?.signal.aborted) return;
          updateProgress(progressMetrics);
        },
        // Complete callback
        (finalMetrics: AnalysisMetrics) => {
          if (abortControllerRef.current?.signal.aborted) return;
          setProgress(100);
          setCurrentStage('Analysis complete.');
          setMetrics(finalMetrics);
          setIsAnalyzing(false);
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during analysis';
      console.error('Audio analysis failed:', err);
      
      setError(errorMessage);
      setIsAnalyzing(false);
      setProgress(0);
      setCurrentStage('Analysis failed');
      
      // Return fallback metrics on error
      const fallbackMetrics: AnalysisMetrics = {
        lufs: -70,
        peak: -60,
        rms: -60,
        dynamicRange: 12,
        correlation: 0,
        progress: 0,
        stage: 'Analysis failed'
      };
      
      throw new Error(errorMessage);
    }
  }, [isAnalyzing, updateProgress]);

  const stopAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending throttled updates
    if (throttledProgressUpdate.current.pendingUpdate) {
      clearTimeout(throttledProgressUpdate.current.pendingUpdate);
      throttledProgressUpdate.current.pendingUpdate = null;
    }

    setIsAnalyzing(false);
    setProgress(0);
    setCurrentStage('Stopped');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
      // Note: We don't cleanup the worklet here as it's a singleton
      // and may be used by other components
    };
  }, [stopAnalysis]);

  return {
    isAnalyzing,
    progress,
    currentStage,
    metrics,
    error,
    startAnalysis,
    stopAnalysis
  };
}