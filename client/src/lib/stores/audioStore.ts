import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { AudioEngine } from "@/modules/audio/AudioEngine";
import type { AnalysisResults, PresetParameters } from "@shared/schema";

interface AudioState {
  // Audio engine
  audioEngine: AudioEngine | null;
  
  // Playback state
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  
  // Audio file
  audioFile: File | null;
  audioBuffer: AudioBuffer | null;
  
  // Analysis results
  analysisResults: AnalysisResults | null;
  isAnalyzing: boolean;
  
  // Processing parameters
  processingParams: PresetParameters;
  
  // Real-time data
  spectrumData: Float32Array | null;
  meterData: {
    lufs: number;
    dbtp: number;
    dbfs: number;
    lra: number;
    correlation: number;
  } | null;
  
  // Export state
  isExporting: boolean;
  exportProgress: number;
  
  // Actions
  initializeAudioEngine: () => Promise<void>;
  loadAudioFile: (file: File) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  analyzeAudio: () => Promise<void>;
  updateProcessingParams: (params: Partial<PresetParameters>) => void;
  exportAudio: (format: string, sampleRate?: number) => Promise<AudioBuffer>;
  setSpectrumData: (data: Float32Array) => void;
  setMeterData: (data: any) => void;
  cleanup: () => void;
}

const defaultProcessingParams: PresetParameters = {
  harmonicBoost: 0,
  subweight: 0,
  transientPunch: 0,
  airlift: 0,
  spatialFlux: 0,
  compression: {
    threshold: -20,
    ratio: 4,
    attack: 10,
    release: 100,
  },
  eq: {
    lowShelf: { frequency: 100, gain: 0 },
    highShelf: { frequency: 8000, gain: 0 },
  },
  stereo: {
    width: 1,
    bassMonoFreq: 120,
  },
};

export const useAudioStore = create<AudioState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    audioEngine: null,
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    audioFile: null,
    audioBuffer: null,
    analysisResults: null,
    isAnalyzing: false,
    processingParams: defaultProcessingParams,
    spectrumData: null,
    meterData: null,
    isExporting: false,
    exportProgress: 0,

    // Actions
    initializeAudioEngine: async () => {
      try {
        const engine = new AudioEngine();
        await engine; // Wait for initialization
        set({ audioEngine: engine });
      } catch (error) {
        console.error("Failed to initialize audio engine:", error);
        throw error;
      }
    },

    loadAudioFile: async (file: File) => {
      const { audioEngine } = get();
      if (!audioEngine) {
        throw new Error("Audio engine not initialized");
      }

      try {
        set({ audioFile: file, isLoaded: false });
        
        await audioEngine.loadAudio(file);
        
        set({
          isLoaded: true,
          duration: audioEngine.duration,
          currentTime: 0,
        });

        // Trigger analysis
        get().analyzeAudio();
      } catch (error) {
        set({ audioFile: null, isLoaded: false });
        throw error;
      }
    },

    play: async () => {
      const { audioEngine } = get();
      if (!audioEngine || !audioEngine.isLoaded) {
        throw new Error("No audio loaded");
      }

      try {
        await audioEngine.play();
        set({ isPlaying: true });
      } catch (error) {
        console.error("Playback failed:", error);
        throw error;
      }
    },

    pause: async () => {
      const { audioEngine } = get();
      if (!audioEngine) return;

      try {
        await audioEngine.pause();
        set({ isPlaying: false });
      } catch (error) {
        console.error("Pause failed:", error);
        throw error;
      }
    },

    stop: async () => {
      const { audioEngine } = get();
      if (!audioEngine) return;

      try {
        await audioEngine.stop();
        set({ isPlaying: false, currentTime: 0 });
      } catch (error) {
        console.error("Stop failed:", error);
        throw error;
      }
    },

    seekTo: async (time: number) => {
      // For now, just update the current time
      // Real implementation would need to seek the audio engine
      set({ currentTime: Math.max(0, Math.min(time, get().duration)) });
    },

    analyzeAudio: async () => {
      const { audioEngine } = get();
      if (!audioEngine || !audioEngine.isLoaded) {
        return;
      }

      try {
        set({ isAnalyzing: true });
        
        const results = await audioEngine.analyzeAudio();
        
        set({ 
          analysisResults: results,
          isAnalyzing: false,
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        set({ isAnalyzing: false });
        throw error;
      }
    },

    updateProcessingParams: (params: Partial<PresetParameters>) => {
      const currentParams = get().processingParams;
      const newParams = { ...currentParams, ...params };
      
      set({ processingParams: newParams });
      
      // Update audio engine parameters
      const { audioEngine } = get();
      if (audioEngine) {
        audioEngine.updateProcessingParameters(newParams);
      }
    },

    exportAudio: async (format: string, sampleRate = 44100) => {
      const { audioEngine, processingParams } = get();
      if (!audioEngine || !audioEngine.isLoaded) {
        throw new Error("No audio loaded");
      }

      try {
        set({ isExporting: true, exportProgress: 0 });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          set(state => ({
            exportProgress: Math.min(95, state.exportProgress + Math.random() * 10)
          }));
        }, 100);

        const renderedBuffer = await audioEngine.exportAudio(processingParams, sampleRate);
        
        clearInterval(progressInterval);
        set({ exportProgress: 100 });

        // Reset export state after a delay
        setTimeout(() => {
          set({ isExporting: false, exportProgress: 0 });
        }, 1000);

        return renderedBuffer;
      } catch (error) {
        set({ isExporting: false, exportProgress: 0 });
        throw error;
      }
    },

    setSpectrumData: (data: Float32Array) => {
      set({ spectrumData: data });
    },

    setMeterData: (data: any) => {
      set({ meterData: data });
    },

    cleanup: () => {
      const { audioEngine } = get();
      if (audioEngine) {
        audioEngine.dispose();
      }
      
      set({
        audioEngine: null,
        isPlaying: false,
        isLoaded: false,
        currentTime: 0,
        duration: 0,
        audioFile: null,
        audioBuffer: null,
        analysisResults: null,
        isAnalyzing: false,
        spectrumData: null,
        meterData: null,
        isExporting: false,
        exportProgress: 0,
      });
    },
  }))
);

// Initialize audio engine on store creation
useAudioStore.getState().initializeAudioEngine().catch(console.error);

// Clean up on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    useAudioStore.getState().cleanup();
  });
}
