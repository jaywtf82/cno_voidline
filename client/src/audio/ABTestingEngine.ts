/**
 * ABTestingEngine.ts - Professional A/B Testing System for Audio Mastering
 * 
 * Features:
 * - Real-time A/B switching with delay compensation
 * - Level matching for accurate comparison
 * - Blind testing support with randomized switching
 * - Automatic crossfading for seamless transitions
 * - Detailed comparison metrics and logging
 */

import { AudioMetrics } from '@/state/useSessionStore';

export interface ABTestConfig {
  // Delay compensation
  delayCompensationMs: number;
  
  // Level matching
  levelMatching: boolean;
  targetLUFS: number;
  
  // Crossfade settings
  crossfadeDurationMs: number;
  crossfadeType: 'linear' | 'equalPower' | 'constantPower';
  
  // Blind testing
  blindMode: boolean;
  randomizeLabels: boolean;
  
  // Comparison settings
  autoSwitch: boolean;
  autoSwitchIntervalMs: number;
}

export interface ABComparison {
  timestamp: number;
  currentMonitor: 'A' | 'B';
  duration: number; // How long this monitor was active
  userAction: 'manual' | 'auto' | 'blind';
  metricsSnapshot: {
    A: AudioMetrics;
    B: AudioMetrics;
  };
}

export interface ABTestSession {
  id: string;
  startTime: number;
  config: ABTestConfig;
  comparisons: ABComparison[];
  preferences: {
    preferred: 'A' | 'B' | 'none';
    confidence: number; // 1-5 scale
    notes: string;
  };
  metrics: {
    totalSwitches: number;
    averageListenTime: number;
    timeOnA: number;
    timeOnB: number;
  };
}

export class ABTestingEngine {
  private audioContext: AudioContext;
  private currentMonitor: 'A' | 'B' = 'A';
  private config: ABTestConfig;
  
  // Audio routing
  private inputA: AudioNode | null = null;
  private inputB: AudioNode | null = null;
  private output: AudioNode;
  private gainA: GainNode;
  private gainB: GainNode;
  private crossfader: GainNode;
  
  // Delay compensation
  private delayA: DelayNode;
  private delayB: DelayNode;
  
  // Level matching
  private levelMatchA: GainNode;
  private levelMatchB: GainNode;
  
  // Session tracking
  private currentSession: ABTestSession | null = null;
  private lastSwitchTime: number = 0;
  private autoSwitchTimer?: NodeJS.Timeout;
  
  // Blind mode state
  private blindLabels: { A: string; B: string } | null = null;
  
  // Callbacks
  private onMonitorChange?: (monitor: 'A' | 'B', realLabel?: 'A' | 'B') => void;
  private onSessionUpdate?: (session: ABTestSession) => void;
  
  constructor(audioContext: AudioContext, output: AudioNode) {
    this.audioContext = audioContext;
    this.output = output;
    
    this.config = {
      delayCompensationMs: 5.0,
      levelMatching: true,
      targetLUFS: -14,
      crossfadeDurationMs: 50,
      crossfadeType: 'equalPower',
      blindMode: false,
      randomizeLabels: false,
      autoSwitch: false,
      autoSwitchIntervalMs: 10000,
    };
    
    this.initializeAudioGraph();
  }
  
  private initializeAudioGraph(): void {
    // Create gain nodes for A/B channels
    this.gainA = this.audioContext.createGain();
    this.gainB = this.audioContext.createGain();
    
    // Create delay nodes for compensation
    this.delayA = this.audioContext.createDelay(0.1);
    this.delayB = this.audioContext.createDelay(0.1);
    
    // Level matching gains
    this.levelMatchA = this.audioContext.createGain();
    this.levelMatchB = this.audioContext.createGain();
    
    // Main crossfader
    this.crossfader = this.audioContext.createGain();
    
    // Initial state: A is active, B is muted
    this.gainA.gain.value = 1;
    this.gainB.gain.value = 0;
    this.levelMatchA.gain.value = 1;
    this.levelMatchB.gain.value = 1;
    
    // Set initial delay compensation
    this.updateDelayCompensation();
    
    // Connect to output
    this.crossfader.connect(this.output);
  }
  
  setConfig(newConfig: Partial<ABTestConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateDelayCompensation();
    
    if (this.config.autoSwitch && !this.autoSwitchTimer) {
      this.startAutoSwitch();
    } else if (!this.config.autoSwitch && this.autoSwitchTimer) {
      this.stopAutoSwitch();
    }
  }
  
  setInputA(input: AudioNode): void {
    if (this.inputA) {
      this.inputA.disconnect();
    }
    
    this.inputA = input;
    input.connect(this.delayA);
    this.delayA.connect(this.levelMatchA);
    this.levelMatchA.connect(this.gainA);
    this.gainA.connect(this.crossfader);
  }
  
  setInputB(input: AudioNode): void {
    if (this.inputB) {
      this.inputB.disconnect();
    }
    
    this.inputB = input;
    input.connect(this.delayB);
    this.delayB.connect(this.levelMatchB);
    this.levelMatchB.connect(this.gainB);
    this.gainB.connect(this.crossfader);
  }
  
  switchTo(monitor: 'A' | 'B', userAction: 'manual' | 'auto' | 'blind' = 'manual'): void {
    if (monitor === this.currentMonitor) return;
    
    const previousMonitor = this.currentMonitor;
    const switchTime = this.audioContext.currentTime;
    const duration = Date.now() - this.lastSwitchTime;
    
    // Record comparison if we have an active session
    if (this.currentSession) {
      const comparison: ABComparison = {
        timestamp: Date.now(),
        currentMonitor: previousMonitor,
        duration,
        userAction,
        metricsSnapshot: {
          A: this.getMetricsSnapshot('A'),
          B: this.getMetricsSnapshot('B'),
        }
      };
      
      this.currentSession.comparisons.push(comparison);
      this.currentSession.metrics.totalSwitches++;
      
      if (previousMonitor === 'A') {
        this.currentSession.metrics.timeOnA += duration;
      } else {
        this.currentSession.metrics.timeOnB += duration;
      }
      
      this.updateSessionMetrics();
      this.onSessionUpdate?.(this.currentSession);
    }
    
    // Perform crossfade
    this.performCrossfade(monitor, switchTime);
    
    this.currentMonitor = monitor;
    this.lastSwitchTime = Date.now();
    
    // Notify listeners
    const realLabel = this.blindLabels ? 
      (monitor === 'A' ? (this.blindLabels.A === 'A' ? 'A' : 'B') : (this.blindLabels.B === 'A' ? 'A' : 'B')) :
      monitor;
      
    this.onMonitorChange?.(monitor, realLabel);
  }
  
  private performCrossfade(targetMonitor: 'A' | 'B', startTime: number): void {
    const duration = this.config.crossfadeDurationMs / 1000;
    const endTime = startTime + duration;
    
    if (this.config.crossfadeType === 'equalPower') {
      // Equal power crossfade (constant perceived loudness)
      if (targetMonitor === 'A') {
        this.gainA.gain.setValueCurveAtTime(
          this.generateEqualPowerCurve(true), startTime, duration
        );
        this.gainB.gain.setValueCurveAtTime(
          this.generateEqualPowerCurve(false), startTime, duration
        );
      } else {
        this.gainA.gain.setValueCurveAtTime(
          this.generateEqualPowerCurve(false), startTime, duration
        );
        this.gainB.gain.setValueCurveAtTime(
          this.generateEqualPowerCurve(true), startTime, duration
        );
      }
    } else if (this.config.crossfadeType === 'constantPower') {
      // Constant power crossfade (smoother)
      const curve = this.generateConstantPowerCurve();
      if (targetMonitor === 'A') {
        this.gainA.gain.setValueCurveAtTime(curve, startTime, duration);
        this.gainB.gain.setValueCurveAtTime(curve.slice().reverse(), startTime, duration);
      } else {
        this.gainA.gain.setValueCurveAtTime(curve.slice().reverse(), startTime, duration);
        this.gainB.gain.setValueCurveAtTime(curve, startTime, duration);
      }
    } else {
      // Linear crossfade (simple)
      if (targetMonitor === 'A') {
        this.gainA.gain.linearRampToValueAtTime(1, endTime);
        this.gainB.gain.linearRampToValueAtTime(0, endTime);
      } else {
        this.gainA.gain.linearRampToValueAtTime(0, endTime);
        this.gainB.gain.linearRampToValueAtTime(1, endTime);
      }
    }
  }
  
  private generateEqualPowerCurve(fadeIn: boolean): Float32Array {
    const samples = 256;
    const curve = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const position = i / (samples - 1);
      const angle = fadeIn ? position * Math.PI / 2 : (1 - position) * Math.PI / 2;
      curve[i] = Math.cos(angle);
    }
    
    return curve;
  }
  
  private generateConstantPowerCurve(): Float32Array {
    const samples = 256;
    const curve = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const position = i / (samples - 1);
      curve[i] = Math.sqrt(position);
    }
    
    return curve;
  }
  
  updateLevelMatching(lufsA: number, lufsB: number): void {
    if (!this.config.levelMatching) return;
    
    const targetLUFS = this.config.targetLUFS;
    
    // Calculate gain adjustments to match target LUFS
    const gainA = Math.pow(10, (targetLUFS - lufsA) / 20);
    const gainB = Math.pow(10, (targetLUFS - lufsB) / 20);
    
    // Apply with smooth transitions
    const rampTime = 0.1; // 100ms ramp
    const currentTime = this.audioContext.currentTime;
    
    this.levelMatchA.gain.setTargetAtTime(gainA, currentTime, rampTime);
    this.levelMatchB.gain.setTargetAtTime(gainB, currentTime, rampTime);
  }
  
  private updateDelayCompensation(): void {
    const delayTime = this.config.delayCompensationMs / 1000;
    this.delayA.delayTime.value = delayTime;
    this.delayB.delayTime.value = delayTime;
  }
  
  startSession(config?: Partial<ABTestConfig>): ABTestSession {
    if (config) {
      this.setConfig(config);
    }
    
    // Initialize blind labels if enabled
    if (this.config.blindMode && this.config.randomizeLabels) {
      this.blindLabels = Math.random() > 0.5 ? 
        { A: 'A', B: 'B' } : 
        { A: 'B', B: 'A' };
    }
    
    this.currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      config: { ...this.config },
      comparisons: [],
      preferences: {
        preferred: 'none',
        confidence: 3,
        notes: '',
      },
      metrics: {
        totalSwitches: 0,
        averageListenTime: 0,
        timeOnA: 0,
        timeOnB: 0,
      }
    };
    
    this.lastSwitchTime = Date.now();
    
    if (this.config.autoSwitch) {
      this.startAutoSwitch();
    }
    
    return this.currentSession;
  }
  
  endSession(preferences?: Partial<ABTestSession['preferences']>): ABTestSession | null {
    if (!this.currentSession) return null;
    
    // Final duration recording
    const duration = Date.now() - this.lastSwitchTime;
    if (this.currentMonitor === 'A') {
      this.currentSession.metrics.timeOnA += duration;
    } else {
      this.currentSession.metrics.timeOnB += duration;
    }
    
    // Update preferences
    if (preferences) {
      this.currentSession.preferences = { ...this.currentSession.preferences, ...preferences };
    }
    
    this.updateSessionMetrics();
    this.stopAutoSwitch();
    
    const completedSession = this.currentSession;
    this.currentSession = null;
    this.blindLabels = null;
    
    return completedSession;
  }
  
  private updateSessionMetrics(): void {
    if (!this.currentSession) return;
    
    const totalTime = this.currentSession.metrics.timeOnA + this.currentSession.metrics.timeOnB;
    const totalSwitches = this.currentSession.metrics.totalSwitches;
    
    this.currentSession.metrics.averageListenTime = totalSwitches > 0 ? totalTime / totalSwitches : 0;
  }
  
  private startAutoSwitch(): void {
    this.stopAutoSwitch();
    
    this.autoSwitchTimer = setInterval(() => {
      const newMonitor = this.currentMonitor === 'A' ? 'B' : 'A';
      this.switchTo(newMonitor, 'auto');
    }, this.config.autoSwitchIntervalMs);
  }
  
  private stopAutoSwitch(): void {
    if (this.autoSwitchTimer) {
      clearInterval(this.autoSwitchTimer);
      this.autoSwitchTimer = undefined;
    }
  }
  
  private getMetricsSnapshot(channel: 'A' | 'B'): AudioMetrics {
    // This would be implemented to capture real-time metrics
    // For now, return empty metrics
    return {
      peak: -Infinity,
      rms: -Infinity,
      truePeak: -Infinity,
      lufsIntegrated: -70,
      lufsShort: -70,
      lufsRange: 0,
      correlation: 1,
      width: 0,
      noiseFloor: -Infinity,
    };
  }
  
  getCurrentMonitor(): 'A' | 'B' {
    return this.currentMonitor;
  }
  
  getBlindLabel(monitor: 'A' | 'B'): string {
    if (!this.blindLabels) return monitor;
    return monitor === 'A' ? this.blindLabels.A : this.blindLabels.B;
  }
  
  isBlindMode(): boolean {
    return this.config.blindMode;
  }
  
  getCurrentSession(): ABTestSession | null {
    return this.currentSession;
  }
  
  setCallbacks(callbacks: {
    onMonitorChange?: (monitor: 'A' | 'B', realLabel?: 'A' | 'B') => void;
    onSessionUpdate?: (session: ABTestSession) => void;
  }): void {
    this.onMonitorChange = callbacks.onMonitorChange;
    this.onSessionUpdate = callbacks.onSessionUpdate;
  }
  
  destroy(): void {
    this.stopAutoSwitch();
    
    if (this.inputA) this.inputA.disconnect();
    if (this.inputB) this.inputB.disconnect();
    
    this.gainA.disconnect();
    this.gainB.disconnect();
    this.delayA.disconnect();
    this.delayB.disconnect();
    this.levelMatchA.disconnect();
    this.levelMatchB.disconnect();
    this.crossfader.disconnect();
    
    this.currentSession = null;
  }
}