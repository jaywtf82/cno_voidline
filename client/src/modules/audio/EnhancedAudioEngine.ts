/**
 * Enhanced AudioEngine with AI processing integration
 * Phase 2: Enhancement with Neural Module v9.4.1
 */

import { AIEngine, AIAnalysisResult, AIProcessingParams } from '../ai/AIEngine';
import { IntelligentReconstruction, ReconstructionAnalysis } from '../ai/IntelligentReconstruction';
import { AdvancedAnalyzer, AdvancedAnalysisResult } from './AdvancedAnalyzer';
import { TransmissionCore, TransmissionFormat, TransmissionSettings, TransmissionProgress } from '../export/TransmissionCore';

export interface EnhancedAnalysisResults {
  lufs: number;
  dbtp: number;
  lra: number;
  correlation: number;
  stereoWidth: number;
  peakLevel: number;
  rmsLevel: number;
  dynamicRange: number;
  noiseFloor: number;
  voidlineScore: number;
  // Enhanced AI metrics
  advanced: AdvancedAnalysisResult;
  reconstruction: ReconstructionAnalysis;
}

export class EnhancedAudioEngine {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isLoaded = false;
  private isPlaying = false;
  
  // AI Processing Engines
  private aiEngine: AIEngine;
  private reconstructionEngine: IntelligentReconstruction;
  private advancedAnalyzer: AdvancedAnalyzer;
  private transmissionCore: TransmissionCore;
  
  // Processing state
  private lastAnalysis: AdvancedAnalysisResult | null = null;
  private processedBuffer: AudioBuffer | null = null;
  private processingEnabled = true;

  constructor() {
    this.aiEngine = new AIEngine();
    this.reconstructionEngine = new IntelligentReconstruction();
    this.advancedAnalyzer = new AdvancedAnalyzer();
    this.transmissionCore = new TransmissionCore();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Initialize AI engines
      await this.aiEngine.initialize(this.audioContext);
      
      // Create nodes
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();
      
      // Configure analyser for professional analysis
      this.analyserNode.fftSize = 4096;
      this.analyserNode.smoothingTimeConstant = 0.1; // Less smoothing for accuracy
      
      // Connect nodes
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
      console.log('AI Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI AudioEngine:', error);
    }
  }

  public async loadAudio(file: File): Promise<void> {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.isLoaded = true;
      
      console.log('Audio loaded:', {
        duration: this.audioBuffer.duration,
        sampleRate: this.audioBuffer.sampleRate,
        channels: this.audioBuffer.numberOfChannels
      });
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  public async analyzeAudio(file: File): Promise<EnhancedAnalysisResults> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Extract channel data
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
      const sampleRate = audioBuffer.sampleRate;
      
      console.log('Performing comprehensive AI analysis...');
      
      // Parallel analysis for efficiency
      const [advancedAnalysis, aiAnalysis, reconstructionAnalysis] = await Promise.all([
        this.advancedAnalyzer.performAdvancedAnalysis(leftChannel, rightChannel, sampleRate),
        this.aiEngine.analyzeAudio(audioBuffer),
        this.reconstructionEngine.analyzeForReconstruction(leftChannel, rightChannel, sampleRate)
      ]);
      
      // Store for later use
      this.lastAnalysis = advancedAnalysis;
      
      // Return enhanced results
      const enhancedResults: EnhancedAnalysisResults = {
        lufs: advancedAnalysis.lufs,
        dbtp: advancedAnalysis.dbtp,
        lra: advancedAnalysis.lra,
        correlation: advancedAnalysis.correlation,
        stereoWidth: advancedAnalysis.stereoWidth,
        peakLevel: advancedAnalysis.peakLevel,
        rmsLevel: advancedAnalysis.rmsLevel,
        dynamicRange: advancedAnalysis.dynamicRange,
        noiseFloor: advancedAnalysis.noiseFloor,
        voidlineScore: advancedAnalysis.voidlineScore,
        advanced: advancedAnalysis,
        reconstruction: reconstructionAnalysis
      };
      
      console.log('AI Analysis complete:', {
        voidlineScore: advancedAnalysis.voidlineScore,
        reconstructionPotential: reconstructionAnalysis.reconstructionPotential,
        masteredCompliance: advancedAnalysis.masteredCompliance
      });
      
      return enhancedResults;
      
    } catch (error) {
      console.error('AI audio analysis failed:', error);
      throw error;
    }
  }

  public async processAudio(params: AIProcessingParams): Promise<AudioBuffer> {
    if (!this.audioBuffer || !this.audioContext) {
      throw new Error('No audio loaded or context unavailable');
    }

    console.log('Starting AI processing with parameters:', params);
    
    try {
      let processedBuffer: AudioBuffer;
      
      if (this.processingEnabled) {
        // Phase 2: Enhancement - Intelligent Reconstruction
        console.log('Phase 2: AI Enhancement and Reconstruction');
        
        // Use AI engine for processing
        processedBuffer = await this.aiEngine.processAudio(this.audioBuffer, params);
        
        // If reconstruction is recommended, apply it
        if (this.lastAnalysis && this.lastAnalysis.reconstruction?.reconstructionPotential > 60) {
          console.log('Applying Intelligent Reconstruction...');
          
          const leftChannel = processedBuffer.getChannelData(0);
          const rightChannel = processedBuffer.numberOfChannels > 1 ? 
            processedBuffer.getChannelData(1) : leftChannel;
          
          const reconstructed = await this.reconstructionEngine.performReconstruction(
            leftChannel,
            rightChannel,
            processedBuffer.sampleRate,
            this.lastAnalysis.reconstruction.recommendedSettings,
            params
          );
          
          // Update buffer with reconstructed audio
          const newBuffer = this.audioContext.createBuffer(
            processedBuffer.numberOfChannels,
            processedBuffer.length,
            processedBuffer.sampleRate
          );
          
          newBuffer.getChannelData(0).set(reconstructed.left);
          if (processedBuffer.numberOfChannels > 1) {
            newBuffer.getChannelData(1).set(reconstructed.right);
          }
          
          processedBuffer = newBuffer;
        }
      } else {
        // Fallback: simple processing
        processedBuffer = this.audioContext.createBuffer(
          this.audioBuffer.numberOfChannels,
          this.audioBuffer.length,
          this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
          const inputData = this.audioBuffer.getChannelData(channel);
          const outputData = processedBuffer.getChannelData(channel);
          outputData.set(inputData);
        }
      }
      
      // Store processed buffer
      this.processedBuffer = processedBuffer;
      
      console.log('AI processing complete');
      return processedBuffer;
      
    } catch (error) {
      console.error('AI processing failed:', error);
      throw error;
    }
  }

  public async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer || this.isPlaying) return;
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.processedBuffer || this.audioBuffer;
    
    // Connect to processing chain
    this.sourceNode.connect(this.gainNode!);
    
    this.sourceNode.onended = () => {
      this.isPlaying = false;
      this.sourceNode = null;
    };
    
    this.sourceNode.start();
    this.isPlaying = true;
  }

  public async pause(): Promise<void> {
    if (this.sourceNode && this.isPlaying) {
      this.sourceNode.stop();
      this.sourceNode = null;
      this.isPlaying = false;
    }
  }

  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public get loaded(): boolean {
    return this.isLoaded;
  }
  
  public get playing(): boolean {
    return this.isPlaying;
  }
  
  public getProcessedBuffer(): AudioBuffer | null {
    return this.processedBuffer;
  }
  
  public getLastAnalysis(): AdvancedAnalysisResult | null {
    return this.lastAnalysis;
  }
  
  public setProcessingEnabled(enabled: boolean): void {
    this.processingEnabled = enabled;
    console.log(`AI processing ${enabled ? 'enabled' : 'disabled'}`);
  }

  public getAnalyserData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array();
    
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    return dataArray;
  }
  
  public async exportAudio(
    format: TransmissionFormat,
    onProgress?: (progress: TransmissionProgress) => void
  ): Promise<ArrayBuffer> {
    if (!this.processedBuffer) {
      throw new Error('No processed audio available for export');
    }
    
    console.log('Phase 3: Interstellar Transmission');
    
    const leftChannel = this.processedBuffer.getChannelData(0);
    const rightChannel = this.processedBuffer.numberOfChannels > 1 ?
      this.processedBuffer.getChannelData(1) : leftChannel;
    
    const settings: TransmissionSettings = {
      format,
      enhanceForTarget: true,
      limiterSettings: {
        threshold: format.peakLimit + 3,
        ceiling: format.peakLimit,
        release: 50,
        lookahead: 5,
        isr: 4
      },
      dithering: {
        enabled: format.bitDepth < 24,
        type: 'triangular',
        noiseShaping: true
      },
      metadata: {
        replayGain: format.target === 'streaming'
      }
    };
    
    return await this.transmissionCore.transmit(
      leftChannel,
      rightChannel,
      this.processedBuffer.sampleRate,
      settings,
      onProgress
    );
  }
  
  public getAvailableFormats(): TransmissionFormat[] {
    return this.transmissionCore.getAvailableFormats();
  }

  public async getRealtimeAnalysis(): Promise<Partial<AdvancedAnalysisResult>> {
    if (!this.analyserNode || !this.audioContext) {
      return {};
    }
    
    const bufferLength = this.analyserNode.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);
    
    this.analyserNode.getByteFrequencyData(frequencyData);
    this.analyserNode.getByteTimeDomainData(timeDomainData);
    
    // Convert to float for analysis
    const floatData = new Float32Array(timeDomainData.length);
    for (let i = 0; i < timeDomainData.length; i++) {
      floatData[i] = (timeDomainData[i] - 128) / 128;
    }
    
    // Quick analysis
    let peak = 0;
    let rms = 0;
    for (let i = 0; i < floatData.length; i++) {
      peak = Math.max(peak, Math.abs(floatData[i]));
      rms += floatData[i] * floatData[i];
    }
    rms = Math.sqrt(rms / floatData.length);
    
    return {
      peakLevel: 20 * Math.log10(peak + 0.0001),
      rmsLevel: 20 * Math.log10(rms + 0.0001),
      crestFactor: peak / (rms + 0.0001)
    };
  }
  
  public getProcessingStatus(): {
    aiEnabled: boolean;
    hasProcessedAudio: boolean;
    lastAnalysisScore: number;
    reconstructionRecommended: boolean;
  } {
    return {
      aiEnabled: this.processingEnabled,
      hasProcessedAudio: this.processedBuffer !== null,
      lastAnalysisScore: this.lastAnalysis?.voidlineScore || 0,
      reconstructionRecommended: (this.lastAnalysis?.reconstruction?.reconstructionPotential || 0) > 60
    };
  }
}