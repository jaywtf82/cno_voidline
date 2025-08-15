import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NeonCard, NeonCardHeader, NeonCardTitle, NeonCardContent } from "@/components/ui/neon-card";
import { Logo } from "@/components/Logo";
import { GlitchWord } from "@/components/effects/GlitchWord";
import { WaveDNA } from "@/components/visualizers/WaveDNA";
import { StereoRadar } from "@/components/visualizers/StereoRadar";
import { PhaseGrid } from "@/components/visualizers/PhaseGrid";
import { VoidlineMeter } from "@/components/meters/VoidlineMeter";
import { Fader } from "@/components/controls/Fader";
import { Knob } from "@/components/controls/Knob";
import { PresetTile } from "@/components/presets/PresetTile";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";
import { Play, Pause, Square, Volume2, Settings, Zap, Target, Waves } from "lucide-react";

export default function MockingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const { theme, setTheme } = useTheme();

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

  const mockPresets = [
    { name: "CLUB_MASTER", category: "Club", description: "High energy club master", isActive: false },
    { name: "VINYL_WARM", category: "Vinyl", description: "Warm vinyl simulation", isActive: true },
    { name: "STREAMING_LOUD", category: "Streaming", description: "Optimized for streaming", isActive: false },
    { name: "RADIO_READY", category: "Radio", description: "Broadcast ready", isActive: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker text-text-primary p-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4">
          <Logo className="h-8" />
          <div className="border-l border-accent-primary/30 pl-4">
            <h1 className="font-mono text-2xl text-accent-primary">
              <GlitchWord trigger={glitchTrigger} intensity="medium">
                MOCKING CONSOLE
              </GlitchWord>
            </h1>
            <p className="font-mono text-sm text-text-muted">Live System Simulation</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Selector */}
          <div className="flex space-x-2">
            {(["classic", "matrix", "cyberpunk", "retro"] as const).map((themeName) => (
              <Button
                key={themeName}
                variant={theme === themeName ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme(themeName)}
                className="font-mono text-xs"
                data-testid={`button-theme-${themeName}`}
              >
                {themeName.toUpperCase()}
              </Button>
            ))}
          </div>
          
          {/* System Status */}
          <div className="font-mono text-xs text-accent-primary border border-accent-primary/30 px-3 py-1 rounded">
            SYSTEM: ONLINE
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Panel - Transport & Controls */}
        <motion.div 
          className="col-span-3"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <NeonCard variant="terminal" className="mb-6">
            <NeonCardHeader>
              <NeonCardTitle>TRANSPORT</NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayback}
                  className="h-12 w-12 rounded-full border-2 border-accent-primary/30 hover:border-accent-primary"
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-accent-primary/30 hover:border-accent-primary"
                  data-testid="button-stop"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="font-mono text-xs text-text-muted">
                  TIME: {currentTime.toFixed(1)}s
                </div>
                
                <div className="h-2 bg-black/50 rounded overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                    style={{ width: `${(currentTime % 10) * 10}%` }}
                    transition={{ duration: 0.1 }}
                  />
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
          className="col-span-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-6">
            {/* WaveDNA Visualizer */}
            <WaveDNA isPlaying={isPlaying} className="h-64" />
            
            <div className="grid grid-cols-2 gap-4">
              {/* Stereo Radar */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <StereoRadar 
                  width={mockData.analysis.stereoWidth}
                  correlation={mockData.analysis.phaseCorrelation}
                  isActive={isPlaying}
                />
              </motion.div>
              
              {/* Phase Grid */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <PhaseGrid 
                  correlation={mockData.analysis.phaseCorrelation}
                  isActive={isPlaying}
                />
              </motion.div>
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
          className="col-span-3"
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
              ENGINE: <span className="text-accent-primary">ONLINE</span>
            </div>
            <div className="text-text-muted">
              BUFFER: <span className="text-accent-primary">512 SAMPLES</span>
            </div>
            <div className="text-text-muted">
              LATENCY: <span className="text-accent-primary">2.3ms</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-text-muted">
              CPU: <span className="text-accent-primary">{(15 + Math.random() * 10).toFixed(1)}%</span>
            </div>
            <div className="text-text-muted">
              MEMORY: <span className="text-accent-primary">{(245 + Math.random() * 50).toFixed(0)}MB</span>
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
  );
}