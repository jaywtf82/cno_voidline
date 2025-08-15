import { AnalysisEngine } from "./analysis/AnalysisEngine";
import { MasteringProcessor } from "./processors/MasteringProcessor";
import type { PresetParameters, AnalysisResults } from "@shared/schema";

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private masteringProcessor: MasteringProcessor | null = null;
  private analysisEngine: AnalysisEngine | null = null;
  private isInitialized = false;
  private _isLoaded = false;
  private _isPlaying = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Create audio context
      this.audioContext = new AudioContext();
      
      // Initialize mastering processor
      this.masteringProcessor = new MasteringProcessor(this.audioContext);
      await this.masteringProcessor.initialize();
      
      // Initialize analysis engine
      this.analysisEngine = new AnalysisEngine(this.audioContext);
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize audio engine:", error);
      throw error;
    }
  }

  async loadAudio(file: File): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error("Audio engine not initialized");
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio data
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this._isLoaded = true;
    } catch (error) {
      console.error("Failed to load audio:", error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.isInitialized || !this.audioContext || !this.audioBuffer) {
      throw new Error("Audio engine not ready for playback");
    }

    try {
      // Stop current playback if any
      await this.stop();

      // Create new source node
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // Connect through mastering processor
      if (this.masteringProcessor) {
        this.sourceNode.connect(this.masteringProcessor.inputNode);
        this.masteringProcessor.outputNode.connect(this.audioContext.destination);
      } else {
        this.sourceNode.connect(this.audioContext.destination);
      }

      // Start playback
      this.sourceNode.start();
      this._isPlaying = true;

      // Handle ended event
      this.sourceNode.onended = () => {
        this._isPlaying = false;
      };
    } catch (error) {
      console.error("Failed to start playback:", error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    await this.stop();
  }

  async stop(): Promise<void> {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Source may already be stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this._isPlaying = false;
  }

  async analyzeAudio(): Promise<AnalysisResults | null> {
    if (!this.analysisEngine || !this.audioBuffer) {
      return null;
    }

    try {
      return await this.analysisEngine.analyze(this.audioBuffer);
    } catch (error) {
      console.error("Analysis failed:", error);
      return null;
    }
  }

  updateProcessingParameters(params: PresetParameters): void {
    if (this.masteringProcessor) {
      this.masteringProcessor.updateParameters(params);
    }
  }

  async exportAudio(params: PresetParameters, sampleRate: number = 44100): Promise<AudioBuffer> {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error("No audio loaded");
    }

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.length,
      sampleRate
    );

    // Create offline mastering processor
    const offlineProcessor = new MasteringProcessor(offlineContext);
    await offlineProcessor.initialize();
    offlineProcessor.updateParameters(params);

    // Create source
    const offlineSource = offlineContext.createBufferSource();
    offlineSource.buffer = this.audioBuffer;

    // Connect and render
    offlineSource.connect(offlineProcessor.inputNode);
    offlineProcessor.outputNode.connect(offlineContext.destination);

    offlineSource.start();
    const renderedBuffer = await offlineContext.startRendering();

    return renderedBuffer;
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this.audioBuffer?.duration || 0;
  }

  get sampleRate(): number {
    return this.audioBuffer?.sampleRate || 44100;
  }

  get numberOfChannels(): number {
    return this.audioBuffer?.numberOfChannels || 2;
  }

  dispose(): void {
    this.stop();
    
    if (this.masteringProcessor) {
      this.masteringProcessor.dispose();
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffer = null;
    this._isLoaded = false;
    this._isPlaying = false;
    this.isInitialized = false;
  }
}
