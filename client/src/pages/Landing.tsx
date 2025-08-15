
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NeonCard, NeonCardHeader, NeonCardTitle, NeonCardContent } from "@/components/ui/neon-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { GlitchWord } from "@/components/effects/GlitchWord";
import { WaveDNA } from "@/components/visualizers/WaveDNA";
import { StereoRadar } from "@/components/visualizers/StereoRadar";
import { PhaseGrid } from "@/components/visualizers/PhaseGrid";
import { VoidlineMeter } from "@/components/meters/VoidlineMeter";
import { Fader } from "@/components/controls/Fader";
import { Knob } from "@/components/controls/Knob";
import { PresetTile } from "@/components/presets/PresetTile";
import { AudioDropZone } from "@/components/upload/AudioDropZone";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Play, Pause, Square, Volume2, Settings, Zap, Target, Waves, Brain } from "lucide-react";
import { aiMasteringCore } from "@/lib/audio/aiMasteringCore";
import { SpectrumAnalyzer } from "@/components/audio/SpectrumAnalyzer";
import { WaveformComparison } from "@/components/audio/WaveformComparison";
import { OptimizedAudioProcessor } from "@/lib/audio/optimizedAudioProcessor";

export default function Landing() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Mock audio parameters with animated values
  const [mockData, setMockData] = useState({
    harmonicBoost: 45,
    subweight: 32,
    transientPunch: 78,
    airlift: 56,
    spatialFlux: 63,
    compression: { threshold: -18.5, ratio: 3.2, attack: 12.3, release: 85.7 },
    eq: { lowShelf: 2.3, highShelf: 1.8 },
    stereo: { width: 1.2, bassMonoFreq: 125 },
    levels: { peak: -3.2, rms: -12.4, lufs: -16.8 },
    analysis: { dynamicRange: 8.2, stereoWidth: 78, phaseCorrelation: 0.92 }
  });

  // Animate values periodically
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setMockData(prev => ({
        ...prev,
        harmonicBoost: Math.max(0, Math.min(100, prev.harmonicBoost + (Math.random() - 0.5) * 10)),
        subweight: Math.max(0, Math.min(100, prev.subweight + (Math.random() - 0.5) * 8)),
        transientPunch: Math.max(0, Math.min(100, prev.transientPunch + (Math.random() - 0.5) * 12)),
        airlift: Math.max(0, Math.min(100, prev.airlift + (Math.random() - 0.5) * 6)),
        spatialFlux: Math.max(0, Math.min(100, prev.spatialFlux + (Math.random() - 0.5) * 9)),
        levels: {
          peak: Math.max(-20, Math.min(0, prev.levels.peak + (Math.random() - 0.5) * 2)),
          rms: Math.max(-30, Math.min(-5, prev.levels.rms + (Math.random() - 0.5) * 1.5)),
          lufs: Math.max(-25, Math.min(-10, prev.levels.lufs + (Math.random() - 0.5) * 1))
        },
        analysis: {
          dynamicRange: Math.max(3, Math.min(15, prev.analysis.dynamicRange + (Math.random() - 0.5) * 0.5)),
          stereoWidth: Math.max(40, Math.min(100, prev.analysis.stereoWidth + (Math.random() - 0.5) * 5)),
          phaseCorrelation: Math.max(0.3, Math.min(1, prev.analysis.phaseCorrelation + (Math.random() - 0.5) * 0.1))
        }
      }));
      setCurrentTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    setGlitchTrigger(true);
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleStartMastering = () => {
    if (isAuthenticated) {
      window.location.href = "/console";
    } else {
      handleLogin();
    }
  };

  const handleFileSelect = async (file: File) => {
    console.log('File selected:', file.name);
    setSelectedFile(file);
    setIsProcessing(true);
    setAnalysisProgress(0);
    setAnalysisComplete(false);
    
    try {
      // Initialize AI mastering core
      await aiMasteringCore.initialize();
      
      // Convert file to AudioBuffer
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create mastering session
      const sessionId = await aiMasteringCore.createSession(audioBuffer);
      console.log('Mastering session created:', sessionId);
      
      // Simulate realistic analysis progress
      for (let progress = 0; progress <= 100; progress += 5) {
        setAnalysisProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Set analysis results with real audio file data
      setAudioAnalysis({
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        duration: audioBuffer.duration.toFixed(2) + 's',
        sampleRate: (audioBuffer.sampleRate / 1000).toFixed(1) + ' kHz',
        channels: audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo',
        sessionId: sessionId,
        // Mock analysis results for now - would be replaced with real AI analysis
        lufs: -14.2 + (Math.random() - 0.5) * 4,
        peak: -0.1 - Math.random() * 2,
        rms: -18.3 + (Math.random() - 0.5) * 6,
        dynamicRange: 12.8 + (Math.random() - 0.5) * 8,
        stereoWidth: 85 + Math.random() * 15,
        phaseCorrelation: 0.94 + (Math.random() - 0.5) * 0.1,
        voidlineScore: 87.3 + (Math.random() - 0.5) * 20
      });

      setIsProcessing(false);
      setAnalysisComplete(true);
      
    } catch (error) {
      console.error('Failed to process audio file:', error);
      setIsProcessing(false);
    }
  };



  // File analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Mastering session state
  const [masteringActive, setMasteringActive] = useState(false);
  const [masteringProgress, setMasteringProgress] = useState(0);
  const [masteringMode, setMasteringMode] = useState<'ai' | 'manual'>('ai');
  const [currentPreset, setCurrentPreset] = useState('intelligent');
  const [masteringTarget, setMasteringTarget] = useState('streaming');
  const [isExporting, setIsExporting] = useState(false);
  const [processedAudioFile, setProcessedAudioFile] = useState<File | null>(null);

  // Helper functions for mastering targets
  const getTargetLUFS = (target: string) => {
    const targets = {
      streaming: '-14.0',
      club: '-7.0',
      vinyl: '-16.0',
      radio: '-12.0'
    };
    return targets[target as keyof typeof targets] || '-14.0';
  };

  const getTargetPeak = (target: string) => {
    const targets = {
      streaming: '-1.0 dB',
      club: '-0.5 dB',
      vinyl: '-2.0 dB',
      radio: '-0.8 dB'
    };
    return targets[target as keyof typeof targets] || '-1.0 dB';
  };

  const mockPresets = [
    { name: "CLUB_MASTER", category: "Club", description: "High energy club master", isActive: false },
    { name: "VINYL_WARM", category: "Vinyl", description: "Warm vinyl simulation", isActive: true },
    { name: "STREAMING_LOUD", category: "Streaming", description: "Optimized for streaming", isActive: false },
    { name: "RADIO_READY", category: "Radio", description: "Broadcast ready", isActive: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker text-text-primary">
      <div className="container-professional section-spacing">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-12 pb-6 border-b border-primary/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo />
        
        <div className="flex items-center space-x-8">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="#" 
              className="text-text-secondary hover:text-accent-primary font-mono text-sm transition-colors"
              data-testid="link-home"
            >
              /home
            </a>
            <a 
              href="#features" 
              className="text-text-secondary hover:text-accent-primary font-mono text-sm transition-colors"
              data-testid="link-features"
            >
              /features
            </a>
            <a 
              href="#pricing" 
              className="text-text-secondary hover:text-accent-primary font-mono text-sm transition-colors"
              data-testid="link-pricing"
            >
              /pricing
            </a>
            <a 
              href="#docs" 
              className="text-text-secondary hover:text-accent-primary font-mono text-sm transition-colors"
              data-testid="link-docs"
            >
              /docs
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* Login Button */}
            {!isAuthenticated && (
              <Button
                variant="outline"
                onClick={handleLogin}
                className="font-mono text-sm px-4 py-2"
                data-testid="button-login"
              >
                Login
              </Button>
            )}
            
            {/* System Status */}
            <div className="flex items-center space-x-2 font-mono text-xs text-accent-primary border border-accent-primary/30 px-3 py-2 rounded-lg bg-black/20">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>ONLINE</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Section - AI Mastering Upload */}
      <motion.div 
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >


        <AudioDropZone 
          onFileSelect={handleFileSelect} 
          className="mb-8" 
          isProcessing={isProcessing}
        />
        
        {/* Analysis Progress - shown when processing */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <NeonCard variant="terminal" className="p-6 max-w-3xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-lg text-accent-primary">Deep Signal Analysis</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm text-accent-primary">PROCESSING</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-black/50 rounded-lg h-3 overflow-hidden border border-accent-primary/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-primary to-yellow-400 shadow-glow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(analysisProgress, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                
                {/* Live System Feed */}
                <div className="font-mono text-sm space-y-2 text-left">
                  <div className="text-accent-primary">$ Live System Feed:</div>
                  <div className="text-text-muted">[STATUS] AI core initialized and stable.</div>
                  <div className="text-text-muted">[STATUS] Neural network connection is nominal.</div>
                  <div className="text-text-muted">[INFO] FFT analysis: {Math.min(analysisProgress, 100).toFixed(1)}% complete</div>
                  <div className="text-yellow-400">[ALERT] Solar flare activity detected. Uplink integrity at 96%.</div>
                  <div className="text-accent-primary">Status: Deep signal analysis in progress</div>
                </div>
              </div>
            </NeonCard>
          </motion.div>
        )}
        
        {/* Default System Status - shown when not processing */}
        {!isProcessing && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <NeonCard variant="terminal" className="p-4 max-w-2xl mx-auto text-left">
              <div className="font-mono text-sm space-y-2">
                <div className="text-accent-primary">$ Live System Feed:</div>
                <div className="text-text-muted">[STATUS] AI core initialized and stable.</div>
                <div className="text-text-muted">[STATUS] Neural network connection is nominal.</div>
                <div className="text-yellow-400">[ALERT] Solar flare activity detected. Uplink integrity at 96%.</div>
                <div className="text-accent-primary">System is ready for your command</div>
              </div>
            </NeonCard>
          </motion.div>
        )}
      </motion.div>

      {/* Analysis Results Panel - shown when audio is analyzed */}
      {analysisComplete && audioAnalysis && (
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <NeonCard variant="terminal" className="p-6">
            <NeonCardHeader>
              <NeonCardTitle className="flex items-center space-x-2">
                <Waves className="h-5 w-5" />
                <span>Audio Analysis Complete</span>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <h4 className="font-mono text-sm text-accent-primary">File Info</h4>
                  <div className="font-mono text-xs space-y-1">
                    <div>Name: {audioAnalysis.fileName}</div>
                    <div>Size: {audioAnalysis.fileSize}</div>
                    <div>Duration: {audioAnalysis.duration}</div>
                    <div>Sample Rate: {audioAnalysis.sampleRate}</div>
                    <div>Channels: {audioAnalysis.channels}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-mono text-sm text-accent-primary">Audio Levels</h4>
                  <div className="font-mono text-xs space-y-1">
                    <div>LUFS: {audioAnalysis.lufs.toFixed(1)}</div>
                    <div>Peak: {audioAnalysis.peak.toFixed(1)} dB</div>
                    <div>RMS: {audioAnalysis.rms.toFixed(1)} dB</div>
                    <div>Dynamic Range: {audioAnalysis.dynamicRange.toFixed(1)} LU</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-mono text-sm text-accent-primary">Stereo Analysis</h4>
                  <div className="font-mono text-xs space-y-1">
                    <div>Width: {audioAnalysis.stereoWidth.toFixed(0)}%</div>
                    <div>Phase Correlation: {audioAnalysis.phaseCorrelation.toFixed(2)}</div>
                    <div className="pt-2 border-t border-accent-primary/20">
                      <div className="text-accent-primary">Voidline Score</div>
                      <div className="text-lg font-bold">{audioAnalysis.voidlineScore.toFixed(1)}/100</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  className="font-mono bg-accent-primary hover:bg-accent-primary/80 text-black"
                  onClick={() => {
                    // Check if authentication is required (configurable)
                    const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';
                    
                    if (requireAuth && !isAuthenticated) {
                      setShowAuthModal(true);
                    } else {
                      // Start mastering session on the same page
                      setMasteringActive(true);
                      // Scroll to mastering interface
                      document.getElementById('mastering-interface')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }
                  }}
                >
                  Start Mastering Session
                </Button>
              </div>
            </NeonCardContent>
          </NeonCard>
        </motion.div>
      )}

      {/* Mastering Interface - Only shown when session is active */}
      {masteringActive && (
        <motion.div 
          id="mastering-interface"
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <NeonCard variant="terminal" className="mb-8">
            <NeonCardHeader>
              <NeonCardTitle className="flex items-center justify-between">
                <span>AI Mastering Console</span>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-text-muted font-mono">
                    SESSION: {audioAnalysis?.sessionId?.slice(-8).toUpperCase()}
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs border-accent-primary/50 hover:border-accent-primary"
                    onClick={() => {
                      setMasteringActive(false);
                      setMasteringProgress(0);
                      setIsExporting(false);
                    }}
                  >
                    Back to Analysis
                  </Button>
                </div>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Panel - Controls */}
                <div className="space-y-6">
                  {/* Mode Selection */}
                  <div>
                    <h3 className="font-mono text-accent-primary mb-4">Processing Mode</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={masteringMode === 'ai' ? "default" : "outline"}
                        className={`font-mono text-xs p-3 h-auto flex flex-col items-center ${
                          masteringMode === 'ai' 
                            ? 'bg-accent-primary text-black' 
                            : 'border-accent-primary/50 hover:border-accent-primary'
                        }`}
                        onClick={() => setMasteringMode('ai')}
                      >
                        <Brain className="h-4 w-4 mb-1" />
                        <div className="font-bold">AI Mastering</div>
                        <div className="text-xs opacity-70">Intelligent processing</div>
                      </Button>
                      <Button
                        variant={masteringMode === 'manual' ? "default" : "outline"}
                        className={`font-mono text-xs p-3 h-auto flex flex-col items-center ${
                          masteringMode === 'manual' 
                            ? 'bg-accent-primary text-black' 
                            : 'border-accent-primary/50 hover:border-accent-primary'
                        }`}
                        onClick={() => setMasteringMode('manual')}
                      >
                        <Settings className="h-4 w-4 mb-1" />
                        <div className="font-bold">Manual Control</div>
                        <div className="text-xs opacity-70">Precise adjustments</div>
                      </Button>
                    </div>
                  </div>

                  {/* Target Selection */}
                  <div>
                    <h3 className="font-mono text-accent-primary mb-4">Output Target</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'streaming', label: 'Streaming', desc: '-14 LUFS, -1.0 dBTP' },
                        { id: 'club', label: 'Club', desc: '-7 LUFS, -0.5 dBTP' },
                        { id: 'vinyl', label: 'Vinyl', desc: '-16 LUFS, Dynamic' },
                        { id: 'radio', label: 'Radio', desc: '-12 LUFS, Limited' }
                      ].map((target) => (
                        <Button
                          key={target.id}
                          variant={masteringTarget === target.id ? "default" : "outline"}
                          className={`font-mono text-xs p-2 h-auto flex flex-col items-start ${
                            masteringTarget === target.id 
                              ? 'bg-accent-primary text-black' 
                              : 'border-accent-primary/50 hover:border-accent-primary'
                          }`}
                          onClick={() => setMasteringTarget(target.id)}
                        >
                          <div className="font-bold">{target.label}</div>
                          <div className="text-xs opacity-70">{target.desc}</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* AI Presets (only shown in AI mode) */}
                  {masteringMode === 'ai' && (
                    <div>
                      <h3 className="font-mono text-accent-primary mb-4">AI Style</h3>
                      <div className="space-y-2">
                        {[
                          { id: 'intelligent', label: 'Intelligent Auto', desc: 'Analyzes and adapts to content' },
                          { id: 'transparent', label: 'Transparent', desc: 'Clean, minimal processing' },
                          { id: 'warm', label: 'Analog Warm', desc: 'Vintage tube/tape character' },
                          { id: 'punchy', label: 'Modern Punch', desc: 'Enhanced impact and clarity' }
                        ].map((preset) => (
                          <Button
                            key={preset.id}
                            variant={currentPreset === preset.id ? "default" : "outline"}
                            className={`w-full font-mono text-xs justify-start p-2 h-auto ${
                              currentPreset === preset.id 
                                ? 'bg-accent-primary text-black' 
                                : 'border-accent-primary/50 hover:border-accent-primary'
                            }`}
                            onClick={() => setCurrentPreset(preset.id)}
                          >
                            <div>
                              <div className="font-bold">{preset.label}</div>
                              <div className="text-xs opacity-70">{preset.desc}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Processing Controls */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 font-mono bg-accent-primary hover:bg-accent-primary/80 text-black"
                      onClick={async () => {
                        setMasteringProgress(0);
                        setProcessedAudioFile(null);
                        
                        // Optimized processing simulation
                        const processingSteps = [
                          { name: 'Analyzing...', duration: 500 },
                          { name: 'Processing...', duration: 2000 },
                          { name: 'Finalizing...', duration: 300 }
                        ];
                        
                        let currentProgress = 0;
                        for (const step of processingSteps) {
                          const stepIncrement = step.duration / 50; // 50ms intervals
                          const targetProgress = currentProgress + (step.duration / 3000) * 100;
                          
                          while (currentProgress < targetProgress) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                            currentProgress = Math.min(targetProgress, currentProgress + 2);
                            setMasteringProgress(currentProgress);
                          }
                        }
                        
                        // Simulate creating processed file
                        if (selectedFile) {
                          setProcessedAudioFile(selectedFile); // In real implementation, this would be the processed audio
                        }
                      }}
                      disabled={masteringProgress > 0 && masteringProgress < 100}
                    >
                      {masteringProgress === 0 ? `${masteringMode === 'ai' ? 'AI Process' : 'Process'}` : 
                       masteringProgress < 100 ? `Processing ${masteringProgress.toFixed(0)}%` : 
                       'Complete'}
                    </Button>
                    
                    {masteringProgress === 100 && (
                      <Button 
                        variant="outline"
                        className="font-mono border-accent-primary/50 hover:border-accent-primary"
                        onClick={() => {
                          setIsExporting(true);
                          setTimeout(() => {
                            setIsExporting(false);
                            // Simulate download
                            const link = document.createElement('a');
                            link.download = `mastered_${selectedFile?.name || 'audio'}.wav`;
                            link.href = '#'; // In real implementation, this would be the processed audio blob URL
                            link.click();
                          }, 2000);
                        }}
                        disabled={isExporting}
                      >
                        {isExporting ? 'Exporting...' : 'Export WAV'}
                      </Button>
                    )}
                  </div>
                  
                  {masteringProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span>Progress</span>
                        <span>{masteringProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-surface-dark border border-accent-primary/30 rounded overflow-hidden">
                        <div 
                          className="bg-accent-primary h-2 transition-all duration-150 ease-out"
                          style={{ width: `${masteringProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Panel - Visualizers */}
                <div className="space-y-6">
                  {/* Spectrum Analyzer */}
                  <SpectrumAnalyzer
                    audioFile={selectedFile || undefined}
                    isActive={masteringProgress > 0}
                    className="h-48"
                  />
                  
                  {/* Waveform Comparison */}
                  <WaveformComparison
                    originalFile={selectedFile || undefined}
                    processedFile={processedAudioFile || undefined}
                    isProcessing={masteringProgress > 0 && masteringProgress < 100}
                    className="h-40"
                  />
                  
                  {/* Levels Display */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="text-accent-primary">Input</div>
                      <div>LUFS: {audioAnalysis?.lufs?.toFixed(1) || '-23.1'}</div>
                      <div>Peak: {audioAnalysis?.peak?.toFixed(1) || '-3.2'} dB</div>
                      <div>RMS: {audioAnalysis?.rms?.toFixed(1) || '-18.5'} dB</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-accent-primary">Output</div>
                      <div>LUFS: {masteringProgress === 100 ? getTargetLUFS(masteringTarget) : '---'}</div>
                      <div>Peak: {masteringProgress === 100 ? getTargetPeak(masteringTarget) : '---'}</div>
                      <div>RMS: {masteringProgress === 100 ? '-12.0 dB' : '---'}</div>
                    </div>
                  </div>
                  
                  {/* Quality Metrics */}
                  {masteringProgress === 100 && (
                    <div className="bg-black/30 border border-accent-primary/30 rounded p-3">
                      <div className="text-xs font-mono text-accent-primary mb-2">QUALITY METRICS</div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>Dynamic Range: {(12 + Math.random() * 3).toFixed(1)} LU</div>
                        <div>Stereo Width: {(75 + Math.random() * 20).toFixed(0)}%</div>
                        <div>Phase Correlation: {(0.85 + Math.random() * 0.1).toFixed(2)}</div>
                        <div>Voidline Score: {(88 + Math.random() * 8).toFixed(1)}/100</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </NeonCardContent>
          </NeonCard>
        </motion.div>
      )}

      {/* Main Grid - improved responsive layout */}
      <div 
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 transition-opacity duration-500 ${
          masteringActive ? 'opacity-30 pointer-events-none' : 'opacity-100'
        }`} 
        id="features"
      >
        
        {/* Left Panel - Transport & Controls */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <NeonCard variant="terminal" className="mb-6">
            <NeonCardHeader>
              <NeonCardTitle>Phase 1: Analysis</NeonCardTitle>
              <div className="text-xs text-text-muted font-mono">CORE: DECONSTRUCT</div>
            </NeonCardHeader>
            <NeonCardContent>
              <h3 className="text-lg font-bold mb-3">Deep Signal Deconstruction</h3>
              <p className="text-text-secondary mb-6 text-sm">
                AI meticulously analyzes every nuance, dynamics, frequencies, and stereo image.
              </p>
              
              {/* Spectrum Analyzer Preview */}
              <div className="bg-black/50 p-4 rounded">
                <div className="flex items-end space-x-1 h-24">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-accent-primary flex-1 animate-signal-scan"
                      style={{
                        height: `${Math.random() * 80 + 20}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </NeonCardContent>
          </NeonCard>

          {/* Processing Controls */}
          <NeonCard variant="terminal">
            <NeonCardHeader>
              <NeonCardTitle>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>PROCESSING</span>
                </div>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="space-y-4">
                <Knob
                  label="Harmonic Boost"
                  value={mockData.harmonicBoost}
                  onChange={() => {}}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Subweight"
                  value={mockData.subweight}
                  onChange={() => {}}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Transient Punch"
                  value={mockData.transientPunch}
                  onChange={() => {}}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Airlift"
                  value={mockData.airlift}
                  onChange={() => {}}
                  min={0}
                  max={100}
                  unit="%"
                />
              </div>
            </NeonCardContent>
          </NeonCard>
        </motion.div>

        {/* Center Panel - Visualizers */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-6">
            {/* WaveDNA Visualizer */}
            <WaveDNA isPlaying={isPlaying} className="h-64" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase 2: Enhancement */}
              <NeonCard variant="terminal" className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-accent-primary font-mono text-lg">Phase 2:</div>
                  <div className="text-text-primary font-bold">Enhancement</div>
                  <div className="text-text-muted font-mono text-sm">CORE: REBUILD</div>
                </div>
                
                <h3 className="text-lg font-bold mb-3">Intelligent Reconstruction</h3>
                <p className="text-text-secondary mb-4 text-sm">
                  The AI rebuilds the audio, applying precise, calculated enhancements.
                </p>
                <p className="text-xs font-mono text-text-muted/70 mb-4">
                  designed and developed by <span className="text-accent-primary">[@dotslashrecords]</span>
                </p>
                
                {/* Neural Module Display */}
                <div className="bg-black/50 p-4 rounded border border-accent-primary/20">
                  <div className="font-mono text-sm mb-3 text-accent-primary">neural module v9.4.1</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-accent-primary/20 border border-accent-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <div className="w-3 h-3 bg-accent-primary rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-xs font-mono">Dynamics</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-accent-primary/20 border border-accent-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <div className="w-3 h-3 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <div className="text-xs font-mono">Stereo</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-accent-primary/20 border border-accent-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <div className="w-3 h-3 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <div className="text-xs font-mono">EQ Balance</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-accent-primary/20">
                    <div className="text-xs font-mono text-text-muted text-center">
                      designed and developed by <span className="text-accent-primary">[@dotslashrecords]</span>
                    </div>
                  </div>
                </div>
              </NeonCard>
              
              {/* Phase 3: Transmission */}
              <NeonCard variant="terminal" className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-accent-primary font-mono text-lg">Phase 3:</div>
                  <div className="text-text-primary font-bold">
                    <GlitchWord autoTrigger autoInterval={7000} intensity="low">
                      Transmission
                    </GlitchWord>
                  </div>
                  <div className="text-text-muted font-mono text-sm">CORE: TRANSPORT</div>
                </div>
                
                <h3 className="text-lg font-bold mb-3">Interstellar Transmission</h3>
                <p className="text-text-secondary mb-6 text-sm">
                  The final master signal is crafted for a powerful and clear transmission.
                </p>
                
                {/* Signal Bars */}
                <div className="bg-black/50 p-4 rounded border border-accent-primary/20">
                  <div className="flex items-end justify-center space-x-3 h-16">
                    <div className="w-4 h-8 bg-accent-primary rounded-t shadow-glow-sm"></div>
                    <div className="w-4 h-12 bg-accent-primary rounded-t shadow-glow-sm"></div>
                    <div className="w-4 h-16 bg-yellow-400 rounded-t shadow-glow-md"></div>
                    <div className="w-4 h-14 bg-accent-primary rounded-t shadow-glow-sm"></div>
                  </div>
                  <div className="text-xs font-mono text-center mt-2 text-text-muted">
                    Signal Strength: Optimal
                  </div>
                </div>
              </NeonCard>
            </div>
            
            {/* Level Meters */}
            <VoidlineMeter 
              level={mockData.levels.peak}
              headroom={Math.abs(mockData.levels.peak)}
              noiseFloor={-65.2}
            />
          </div>
        </motion.div>

        {/* Right Panel - Presets & Analysis */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {/* Presets */}
          <NeonCard variant="terminal" className="mb-6">
            <NeonCardHeader>
              <NeonCardTitle>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>PRESETS</span>
                </div>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="space-y-3">
                {mockPresets.map((preset, index) => (
                  <motion.div
                    key={preset.name}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PresetTile
                      preset={{
                        id: index.toString(),
                        name: preset.name,
                        category: preset.category,
                        description: preset.description,
                        codeName: preset.name,
                        userId: null,
                        parameters: {
                          harmonicBoost: mockData.harmonicBoost,
                          subweight: mockData.subweight,
                          transientPunch: mockData.transientPunch,
                          airlift: mockData.airlift,
                          spatialFlux: mockData.spatialFlux,
                          compression: mockData.compression,
                          eq: {
                            lowShelf: { frequency: 100, gain: mockData.eq.lowShelf },
                            highShelf: { frequency: 8000, gain: mockData.eq.highShelf }
                          },
                          stereo: mockData.stereo
                        },
                        isBuiltIn: true,
                        isPublic: true,
                        usageCount: Math.floor(Math.random() * 1000),
                        createdAt: new Date(),
                        updatedAt: new Date()
                      }}
                      isActive={preset.isActive}
                      onApply={() => {}}
                    />
                  </motion.div>
                ))}
              </div>
            </NeonCardContent>
          </NeonCard>

          {/* Live Analysis */}
          <NeonCard variant="terminal">
            <NeonCardHeader>
              <NeonCardTitle>
                <div className="flex items-center space-x-2">
                  <Waves className="h-4 w-4" />
                  <span>ANALYSIS</span>
                </div>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="space-y-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-muted">PEAK:</span>
                    <div className="text-accent-primary font-semibold" data-testid="text-peak">
                      {mockData.levels.peak.toFixed(1)} dB
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted">RMS:</span>
                    <div className="text-accent-primary font-semibold" data-testid="text-rms">
                      {mockData.levels.rms.toFixed(1)} dB
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-muted">LUFS:</span>
                    <div className="text-accent-primary font-semibold" data-testid="text-lufs">
                      {mockData.levels.lufs.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted">LRA:</span>
                    <div className="text-accent-primary font-semibold" data-testid="text-lra">
                      {mockData.analysis.dynamicRange.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="border-t border-accent-primary/20 pt-4">
                  <div className="text-text-muted mb-2">STEREO FIELD</div>
                  <div className="flex justify-between items-center">
                    <span>Width:</span>
                    <span className="text-accent-primary" data-testid="text-stereo-width">
                      {mockData.analysis.stereoWidth.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Correlation:</span>
                    <span className="text-accent-primary" data-testid="text-phase-correlation">
                      {mockData.analysis.phaseCorrelation.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-accent-primary/20 pt-4">
                  <div className="text-text-muted mb-2">COMPRESSION</div>
                  <div className="flex justify-between items-center">
                    <span>Threshold:</span>
                    <span className="text-accent-primary" data-testid="text-comp-threshold">
                      {mockData.compression.threshold.toFixed(1)} dB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ratio:</span>
                    <span className="text-accent-primary" data-testid="text-comp-ratio">
                      {mockData.compression.ratio.toFixed(1)}:1
                    </span>
                  </div>
                </div>

                {/* Voidline Score */}
                <div className="border-t border-accent-primary/20 pt-4">
                  <div className="text-center">
                    <div className="text-text-muted text-xs mb-1">VOIDLINE SCORE</div>
                    <motion.div 
                      className="text-2xl font-bold text-accent-primary"
                      animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      data-testid="text-voidline-score"
                    >
                      {(85 + Math.random() * 10).toFixed(1)}
                    </motion.div>
                    <div className="text-xs text-text-muted">Professional Grade</div>
                  </div>
                </div>
              </div>
            </NeonCardContent>
          </NeonCard>
        </motion.div>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-accent-primary font-mono">$ Transmission Pricing</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Payload - Free */}
          <NeonCard variant="terminal" className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Payload</h3>
              <p className="text-text-muted text-sm">15 Day Free Trial</p>
            </div>
            
            <div className="text-3xl font-bold mb-6">Free</div>
            
            <ul className="space-y-2 text-sm mb-8">
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                3 AI Masters
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                WAV & MP3 Exports
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                Standard Delivery
              </li>
            </ul>
            
            <Button 
              variant="outline" 
              className="w-full font-mono border-accent-primary/30 hover:border-accent-primary text-accent-primary"
            >
              Start Trial
            </Button>
          </NeonCard>

          {/* Orbital Pack - Most Popular */}
          <NeonCard variant="terminal" className="p-6 border-accent-primary">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Orbital Pack</h3>
                <span className="bg-accent-primary text-black px-2 py-1 text-xs font-bold rounded">MOST POPULAR</span>
              </div>
              <p className="text-text-muted text-sm">Ideal for EPs and albums, providing better value.</p>
            </div>
            
            <div className="mb-6">
              <span className="text-3xl font-bold">₹ 599</span>
              <span className="text-text-muted"> / month</span>
            </div>
            
            <ul className="space-y-2 text-sm mb-8">
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                15 AI Masters / month
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                All Formats (WAV, MP3, FLAC)
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                Priority Queue
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                Reference Tracks
              </li>
            </ul>
            
            <Button 
              className="w-full font-mono bg-accent-primary hover:bg-accent-primary/80 text-black"
            >
              Select Plan
            </Button>
          </NeonCard>

          {/* Voidline Unlimited */}
          <NeonCard variant="terminal" className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Voidline Unlimited</h3>
              <p className="text-text-muted text-sm">For the prolific producer and professional studios.</p>
            </div>
            
            <div className="mb-6">
              <span className="text-3xl font-bold">₹ 999</span>
              <span className="text-text-muted"> / year</span>
            </div>
            
            <ul className="space-y-2 text-sm mb-8">
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                Unlimited AI Masters
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                All Formats & Features
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                Highest Priority Access
              </li>
              <li className="flex items-center">
                <span className="text-accent-primary mr-2">&gt;</span>
                Dedicated Support Channel
              </li>
            </ul>
            
            <Button 
              variant="outline"
              className="w-full font-mono border-accent-primary/30 hover:border-accent-primary text-accent-primary"
            >
              Select Plan
            </Button>
          </NeonCard>
        </div>
      </section>

      {/* Footer Status Bar */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-accent-primary/20 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex space-x-6">
            <div className="text-text-muted">
              designed and developed by <span className="text-accent-primary">[@dotslashrecords]</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-text-muted">
              <a href="#" className="hover:text-accent-primary">Privacy Policy</a>
            </div>
            <div className="text-text-muted">
              <a href="#" className="hover:text-accent-primary">Terms of Service</a>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              />
              <span className="text-accent-primary">READY</span>
            </div>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Authentication Modal - Only shown when auth is required */}
      {import.meta.env.VITE_REQUIRE_AUTH === 'true' && (
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogContent className="bg-surface-dark border border-primary/30 text-text-primary">
            <DialogHeader>
              <DialogTitle className="font-mono text-accent-primary text-center">
                Start Mastering Session
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 p-4">
              <div className="text-center space-y-4">
                <p className="text-text-secondary text-sm">
                  Choose how you'd like to proceed with your mastering session
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full font-mono bg-accent-primary hover:bg-accent-primary/80 text-black"
                    onClick={() => {
                      localStorage.setItem('pendingSession', audioAnalysis?.sessionId || '');
                      setShowAuthModal(false);
                      handleLogin();
                    }}
                  >
                    Login / Register
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full font-mono border-accent-primary/50 hover:border-accent-primary text-accent-primary"
                    onClick={() => {
                      setShowAuthModal(false);
                      setMasteringActive(true);
                      document.getElementById('mastering-interface')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                  >
                    Continue as Demo
                  </Button>
                </div>
                
                <div className="text-xs text-text-muted space-y-2">
                  <div className="border-t border-primary/20 pt-3">
                    <p><strong className="text-accent-primary">Login Benefits:</strong></p>
                    <p>• Save your mastered tracks</p>
                    <p>• Create custom presets</p>
                    <p>• Access project history</p>
                  </div>
                  <div className="pt-2">
                    <p><strong className="text-yellow-400">Demo Mode:</strong></p>
                    <p>• Try all features without saving</p>
                    <p>• Perfect for testing the interface</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
