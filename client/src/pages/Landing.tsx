
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
import { useLocation } from "wouter";

export default function Landing() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();

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

  const handleLogin = async () => {
    try {
      await login();
      navigate('/console');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleStartMastering = () => {
    if (isAuthenticated) {
      navigate('/console');
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
      await aiMasteringCore.initialize();
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const sessionId = await aiMasteringCore.createSession(audioBuffer);
      console.log('Mastering session created:', sessionId);

      for (let progress = 0; progress <= 100; progress += 5) {
        setAnalysisProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      setAudioAnalysis({
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        duration: audioBuffer.duration.toFixed(2) + 's',
        sampleRate: (audioBuffer.sampleRate / 1000).toFixed(1) + ' kHz',
        channels: audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo',
        sessionId: sessionId,
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
    <div className="min-h-screen" style={{ 
      backgroundColor: 'var(--color-primary)', 
      color: 'var(--color-secondary)',
      fontFamily: "'Fira Code', monospace"
    }}>
      {/* Background Grid */}
      <div className="background-grid"></div>
      <div className="background-vignette"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-12 pb-4"
          style={{ borderBottom: '1px solid var(--color-glass-border)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Left Side - Terminal Window */}
          <div className="flex items-center space-x-2 terminal-window px-3 py-1.5">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <span className="font-mono text-sm" style={{ color: 'var(--color-accent)' }}>./C/No_Voidline</span>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="nav-link">/home</a>
            <a href="#features" className="nav-link">/features</a>
            <a href="#pricing" className="nav-link">/pricing</a>
            <a href="#docs" className="nav-link">/docs</a>
            <a href="#logs" className="nav-link">/logs</a>
          </nav>

          {/* Right Side - Login Button */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated && (
              <button
                onClick={handleLogin}
                className="btn btn-secondary"
              >
                Login
              </button>
            )}
            <div className="flex items-center justify-end space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </motion.div>

        {/* Hero Section - AI Mastering Upload */}
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Terminal Title */}
          <div className="terminal-window p-8 mb-8 animated-item" style={{ animationDelay: '0.3s' }}>
            <div className="terminal-header px-4 py-2 mb-6 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="text-left font-mono">
              <div className="text-2xl mb-4" style={{ color: 'var(--color-accent)' }}>
                <span className="prompt">./ai-mastering-core --init</span>
                <span className="cursor-blink"></span>
              </div>
              
              <div className="text-sm space-y-2 text-gray-400 mb-8">
                <p>Welcome, producer. Our advanced AI is ready to analyze and enhance your audio. Upload your track to begin the mastering process and unlock its full sonic potential.</p>
              </div>

              <div className="flex space-x-4 justify-center">
                <button className="btn btn-primary">
                  Start Mastering
                </button>
                <button className="btn btn-secondary">
                  Upload Audio File ...
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="terminal-window p-4 mb-8 text-left animated-item" style={{ animationDelay: '0.6s' }}>
            <div className="font-mono text-sm space-y-2">
              <div style={{ color: 'var(--color-accent)' }}>$ Live System Feed:</div>
              <div className="text-gray-400">[STATUS] AI core initialized and stable.</div>
              <div className="text-gray-400">[STATUS] Neural network connection is nominal.</div>
              <div className="text-yellow-400">[ALERT] Solar flare activity detected. Uplink integrity at 96%.</div>
              <div style={{ color: 'var(--color-accent)' }}>System is ready for your command</div>
            </div>
          </div>
        </motion.div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Phase 1: Analysis */}
          <motion.div 
            className="terminal-window p-6 animated-item" 
            style={{ animationDelay: '0.9s' }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-lg font-mono" style={{ color: 'var(--color-accent)' }}>Phase 1:</div>
              <div className="text-white font-bold">Analysis</div>
              <div className="text-gray-400 font-mono text-sm">CORE: DECONSTRUCT</div>
            </div>

            <h3 className="text-lg font-bold mb-3">Deep Signal Deconstruction</h3>
            <p className="text-gray-400 mb-6 text-sm">
              AI meticulously analyzes every nuance, dynamics, frequencies, and stereo image.
            </p>

            {/* Spectrum Bars */}
            <div className="bg-black/50 p-4 rounded border" style={{ borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-end space-x-1 h-24">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 animate-pulse"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      height: `${Math.random() * 80 + 20}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Phase 2: Enhancement */}
          <motion.div 
            className="terminal-window p-6 animated-item" 
            style={{ animationDelay: '1.2s' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-lg font-mono" style={{ color: 'var(--color-accent)' }}>Phase 2:</div>
              <div className="text-white font-bold">Enhancement</div>
              <div className="text-gray-400 font-mono text-sm">CORE: REBUILD</div>
            </div>

            <h3 className="text-lg font-bold mb-3">Intelligent Reconstruction</h3>
            <p className="text-gray-400 mb-6 text-sm">
              The AI rebuilds the audio, applying precise, calculated enhancements.
            </p>

            {/* Neural Module Display */}
            <div className="bg-black/50 p-4 rounded border" style={{ borderColor: 'var(--color-glass-border)' }}>
              <div className="font-mono text-sm mb-3" style={{ color: 'var(--color-accent)' }}>neural module v9.4.1</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border rounded-lg mx-auto mb-2 flex items-center justify-center" 
                       style={{ 
                         backgroundColor: 'var(--color-glow)', 
                         borderColor: 'var(--color-accent)' 
                       }}>
                    <div className="w-3 h-3 rounded-full animate-pulse" 
                         style={{ backgroundColor: 'var(--color-accent)' }}></div>
                  </div>
                  <div className="text-xs font-mono">Dynamics</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border rounded-lg mx-auto mb-2 flex items-center justify-center" 
                       style={{ 
                         backgroundColor: 'var(--color-glow)', 
                         borderColor: 'var(--color-accent)' 
                       }}>
                    <div className="w-3 h-3 rounded-full animate-pulse" 
                         style={{ 
                           backgroundColor: 'var(--color-accent)',
                           animationDelay: '0.2s'
                         }}></div>
                  </div>
                  <div className="text-xs font-mono">Stereo</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border rounded-lg mx-auto mb-2 flex items-center justify-center" 
                       style={{ 
                         backgroundColor: 'var(--color-glow)', 
                         borderColor: 'var(--color-accent)' 
                       }}>
                    <div className="w-3 h-3 rounded-full animate-pulse" 
                         style={{ 
                           backgroundColor: 'var(--color-accent)',
                           animationDelay: '0.4s'
                         }}></div>
                  </div>
                  <div className="text-xs font-mono">EQ Balance</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase 3: Transmission */}
          <motion.div 
            className="terminal-window p-6 animated-item" 
            style={{ animationDelay: '1.5s' }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-lg font-mono" style={{ color: 'var(--color-accent)' }}>Phase 3:</div>
              <div className="text-white font-bold">Transmission</div>
              <div className="text-gray-400 font-mono text-sm">CORE: TRANSPORT</div>
            </div>

            <h3 className="text-lg font-bold mb-3">Interstellar Transmission</h3>
            <p className="text-gray-400 mb-6 text-sm">
              The final master signal is crafted for a powerful and clear transmission.
            </p>

            {/* Signal Bars */}
            <div className="bg-black/50 p-4 rounded border" style={{ borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-end justify-center space-x-3 h-16">
                <div className="w-4 h-8 rounded-t" style={{ backgroundColor: 'var(--color-accent)' }}></div>
                <div className="w-4 h-12 rounded-t" style={{ backgroundColor: 'var(--color-accent)' }}></div>
                <div className="w-4 h-16 bg-yellow-400 rounded-t"></div>
                <div className="w-4 h-14 rounded-t" style={{ backgroundColor: 'var(--color-accent)' }}></div>
              </div>
              <div className="text-xs font-mono text-center mt-2 text-gray-400">
                Signal Strength: Optimal
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Section */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <div className="text-2xl font-mono font-bold mb-4" style={{ color: 'var(--color-accent)' }}>
              $ Transmission Pricing
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Payload Plan */}
            <div className="terminal-window p-6">
              <div className="mb-4">
                <h3 className="text-lg font-mono font-bold mb-2">Payload</h3>
                <div className="text-sm text-gray-400">15 Day Free Trial</div>
              </div>
              
              <div className="text-4xl font-mono font-bold mb-6">Free</div>
              
              <div className="space-y-3 mb-8 font-mono text-sm">
                <div>&gt; 3 AI Masters</div>
                <div>&gt; WAV & MP3 Exports</div>
                <div>&gt; Standard Delivery</div>
              </div>
              
              <button className="btn btn-secondary w-full">
                Start Trial
              </button>
            </div>

            {/* Orbital Pack - Most Popular */}
            <div className="terminal-window p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-black px-3 py-1 rounded text-xs font-mono font-bold">
                  MOST POPULAR
                </span>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-mono font-bold mb-2">Orbital Pack</h3>
                <div className="text-sm text-gray-400">Ideal for EPs and albums, providing better value.</div>
              </div>
              
              <div className="text-4xl font-mono font-bold mb-2">₹ 599</div>
              <div className="text-sm text-gray-400 mb-6">/ month</div>
              
              <div className="space-y-3 mb-8 font-mono text-sm">
                <div>&gt; 15 AI Masters / month</div>
                <div>&gt; All Formats (WAV, MP3, FLAC)</div>
                <div>&gt; Priority Queue</div>
                <div>&gt; Reference Tracks</div>
              </div>
              
              <button className="btn btn-primary w-full">
                Select Plan
              </button>
            </div>

            {/* Voidline Unlimited */}
            <div className="terminal-window p-6">
              <div className="mb-4">
                <h3 className="text-lg font-mono font-bold mb-2">Voidline Unlimited</h3>
                <div className="text-sm text-gray-400">For the prolific producer and professional studios.</div>
              </div>
              
              <div className="text-4xl font-mono font-bold mb-2">₹ 999</div>
              <div className="text-sm text-gray-400 mb-6">/ year</div>
              
              <div className="space-y-3 mb-8 font-mono text-sm">
                <div>&gt; Unlimited AI Masters</div>
                <div>&gt; All Formats &amp; Features</div>
                <div>&gt; Highest Priority Access</div>
                <div>&gt; Dedicated Support Channel</div>
              </div>
              
              <button className="btn btn-secondary w-full">
                Select Plan
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="border-t pt-8 text-center font-mono text-sm text-gray-400" 
             style={{ borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              designed and developed by <span style={{ color: 'var(--color-accent)' }}>[@dotslashrecords]</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full animate-pulse" 
                     style={{ backgroundColor: 'var(--color-accent)' }}></div>
                <span style={{ color: 'var(--color-accent)' }}>READY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {import.meta.env.VITE_REQUIRE_AUTH === 'true' && (
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogContent className="terminal-window text-white border-none">
            <DialogHeader>
              <DialogTitle className="font-mono text-center" style={{ color: 'var(--color-accent)' }}>
                Start Mastering Session
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-4">
              <div className="text-center space-y-4">
                <p className="text-gray-400 text-sm">
                  Choose how you'd like to proceed with your mastering session
                </p>

                <div className="space-y-3">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => {
                      localStorage.setItem('pendingSession', audioAnalysis?.sessionId || '');
                      setShowAuthModal(false);
                      handleLogin();
                    }}
                  >
                    Login / Register
                  </button>

                  <button 
                    className="btn btn-secondary w-full"
                    onClick={() => {
                      setShowAuthModal(false);
                      setMasteringActive(true);
                      document.getElementById('mastering-interface')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                  >
                    Continue as Demo
                  </button>
                </div>

                <div className="text-xs text-gray-400 space-y-2">
                  <div className="border-t pt-3" style={{ borderColor: 'var(--color-glass-border)' }}>
                    <p><strong style={{ color: 'var(--color-accent)' }}>Login Benefits:</strong></p>
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
