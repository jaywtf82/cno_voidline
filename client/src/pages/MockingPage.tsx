import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NeonCard, NeonCardHeader, NeonCardTitle, NeonCardContent } from "@/components/ui/neon-card";
import { Logo } from "@/components/Logo";
import { GlitchWord } from "@/components/effects/GlitchWord";
import { WaveDNA } from "@/components/visualizers/WaveDNA";
import { StereoRadar } from "@/components/visualizers/StereoRadar";
import { PhaseGrid } from "@/components/visualizers/PhaseGrid";
import { VoidlineMeter } from "@/components/meters/VoidlineMeter";
import { Knob } from "@/components/controls/Knob";
import { PresetTile } from "@/components/presets/PresetTile";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";
import { Play, Pause, Square, Settings, Zap, Target, Waves } from "lucide-react";

/**
 * Style/Font/Color reference:
 * - Fonts: 'Fira Code', monospace everywhere.
 * - Colors: bg-[#0B0C0E]; accent-green[#3FB950]; muted text-[#8A9499]; white text for main.
 * - Buttons: .bg-[#18281A] .border-[#3FB950] .text-[#3FB950] when active/filled; .bg-transparent .border-[#3FB95099] .text-[#3FB950CC] when ghost.
 * - Cards: .bg-[#101315] .border-[#3FB95022] .rounded .font-mono
 * - All text: font-mono (Fira Code or fallback monospace).
 * - All UI: squarish corners, subtle grid lines, neon green glow on accent.
 */

export default function MockingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const { theme, setTheme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

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

  // Export/Transmit Mock
  const handleTransmit = () => {
    setExporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setExporting(false), 2000);
          return 100;
        }
        return p + 5;
      });
    }, 120);
  };

  // Presets
  const mockPresets = [
    { name: "CLUB_MASTER", category: "Club", description: "High energy club master", isActive: false, params: { harmonicBoost: 80, subweight: 70, transientPunch: 85, airlift: 60, spatialFlux: 95 }},
    { name: "VINYL_WARM", category: "Vinyl", description: "Warm vinyl simulation", isActive: false, params: { harmonicBoost: 55, subweight: 35, transientPunch: 40, airlift: 45, spatialFlux: 60 }},
    { name: "STREAMING_LOUD", category: "Streaming", description: "Optimized for streaming", isActive: false, params: { harmonicBoost: 60, subweight: 50, transientPunch: 70, airlift: 52, spatialFlux: 70 }},
    { name: "RADIO_READY", category: "Radio", description: "Broadcast ready", isActive: false, params: { harmonicBoost: 40, subweight: 25, transientPunch: 35, airlift: 30, spatialFlux: 55 }},
  ];

  // Which preset matches data?
  const activePresetIndex = mockPresets.findIndex(p =>
    Math.abs(p.params.harmonicBoost - mockData.harmonicBoost) < 10 &&
    Math.abs(p.params.subweight - mockData.subweight) < 10 &&
    Math.abs(p.params.transientPunch - mockData.transientPunch) < 10 &&
    Math.abs(p.params.airlift - mockData.airlift) < 10 &&
    Math.abs(p.params.spatialFlux - mockData.spatialFlux) < 10
  );

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F7F9FA] font-mono tracking-tight p-2 sm:p-4 md:p-6">
      {/* HEADER */}
      <motion.div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4">
          <Logo className="h-8" />
          <div className="border-l border-[#3FB95044] pl-4">
            <h1 className="font-mono text-2xl text-[#3FB950]">
              <GlitchWord trigger={glitchTrigger} intensity="medium">
                MOCKING CONSOLE
              </GlitchWord>
            </h1>
            <p className="font-mono text-sm text-[#8A9499]">Live System Simulation</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
          {/* Theme Selector */}
          <div className="flex space-x-2">
            {(["classic", "matrix", "cyberpunk", "retro"] as const).map((themeName) => (
              <Button
                key={themeName}
                variant={theme === themeName ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme(themeName)}
                className={`font-mono text-xs tracking-tight px-3 py-1 border rounded border-[#3FB95088] 
                  ${theme === themeName ? "bg-[#18281A] text-[#3FB950] border-[#3FB950]" : "bg-transparent text-[#3FB950CC] hover:text-[#3FB950]"}
                `}
                data-testid={`button-theme-${themeName}`}
              >
                {themeName.toUpperCase()}
              </Button>
            ))}
          </div>
          {/* System Status */}
          <div className="font-mono text-xs text-[#3FB950] border border-[#3FB95044] px-3 py-1 rounded mt-1 bg-[#121616]">
            SYSTEM: ONLINE
          </div>
        </div>
      </motion.div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Left Panel */}
        <motion.div 
          className="md:col-span-3 flex flex-col gap-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <NeonCard variant="terminal" className="mb-4 bg-[#101315] border-[#3FB95022] rounded">
            <NeonCardHeader>
              <NeonCardTitle>TRANSPORT</NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayback}
                  className="h-12 w-12 rounded border-2 border-[#3FB95044] hover:border-[#3FB950] text-[#3FB950] bg-[#18281A] hover:bg-[#1d2920]"
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded border-2 border-[#3FB95044] hover:border-[#3FB950] text-[#3FB950] bg-[#18281A] hover:bg-[#1d2920]"
                  onClick={() => { setIsPlaying(false); setCurrentTime(0); }}
                  data-testid="button-stop"
                >
                  <Square className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded border-2 border-[#3FB95044] hover:border-[#3FB950] text-[#3FB950] bg-[#18281A] hover:bg-[#1d2920]"
                  onClick={() => setGlitchTrigger(gt => !gt)}
                  data-testid="button-settings"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </div>
            </NeonCardContent>
          </NeonCard>
          {/* Processing Controls */}
          <NeonCard variant="terminal" className="bg-[#101315] border-[#3FB95022] rounded">
            <NeonCardHeader>
              <NeonCardTitle>
                <div className="flex items-center space-x-2 text-[#3FB950]">
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
                  onChange={val => setMockData(md => ({ ...md, harmonicBoost: val }))}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Subweight"
                  value={mockData.subweight}
                  onChange={val => setMockData(md => ({ ...md, subweight: val }))}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Transient Punch"
                  value={mockData.transientPunch}
                  onChange={val => setMockData(md => ({ ...md, transientPunch: val }))}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Airlift"
                  value={mockData.airlift}
                  onChange={val => setMockData(md => ({ ...md, airlift: val }))}
                  min={0}
                  max={100}
                  unit="%"
                />
                <Knob
                  label="Spatial Flux"
                  value={mockData.spatialFlux}
                  onChange={val => setMockData(md => ({ ...md, spatialFlux: val }))}
                  min={0}
                  max={100}
                  unit="%"
                />
              </div>
            </NeonCardContent>
          </NeonCard>
        </motion.div>

        {/* Center Panel */}
        <motion.div 
          className="md:col-span-6 flex flex-col gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-6 w-full">
            {/* WaveDNA */}
            <WaveDNA isPlaying={isPlaying} className="h-64" />
            {/* Stereo Radar and Phase Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {/* Level Meter */}
            <VoidlineMeter 
              level={mockData.levels.peak}
              headroom={Math.abs(mockData.levels.peak)}
              noiseFloor={-65.2}
            />
          </div>
        </motion.div>

        {/* Right Panel */}
        <motion.div 
          className="md:col-span-3 flex flex-col gap-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {/* Presets */}
          <NeonCard variant="terminal" className="mb-4 bg-[#101315] border-[#3FB95022] rounded">
            <NeonCardHeader>
              <NeonCardTitle>
                <div className="flex items-center space-x-2 text-[#3FB950]">
                  <Target className="h-4 w-4" />
                  <span>PRESETS</span>
                </div>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="space-y-3">
                {mockPresets.map((preset, idx) => (
                  <motion.div
                    key={preset.name}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PresetTile
                      preset={{
                        id: idx.toString(),
                        name: preset.name,
                        category: preset.category,
                        description: preset.description,
                        codeName: preset.name,
                        userId: null,
                        parameters: {
                          harmonicBoost: preset.params.harmonicBoost,
                          subweight: preset.params.subweight,
                          transientPunch: preset.params.transientPunch,
                          airlift: preset.params.airlift,
                          spatialFlux: preset.params.spatialFlux,
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
                      isActive={idx === activePresetIndex}
                      onApply={() =>
                        setMockData(md => ({
                          ...md,
                          harmonicBoost: preset.params.harmonicBoost,
                          subweight: preset.params.subweight,
                          transientPunch: preset.params.transientPunch,
                          airlift: preset.params.airlift,
                          spatialFlux: preset.params.spatialFlux
                        }))
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </NeonCardContent>
          </NeonCard>

          {/* Analysis & Compression */}
          <NeonCard variant="terminal" className="bg-[#101315] border-[#3FB95022] rounded">
            <NeonCardHeader>
              <NeonCardTitle>
                <div className="flex items-center space-x-2 text-[#3FB950]">
                  <Waves className="h-4 w-4" />
                  <span>ANALYSIS</span>
                </div>
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="space-y-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#8A9499]">PEAK:</span>
                    <div className="text-[#3FB950] font-semibold" data-testid="text-peak">
                      {mockData.levels.peak.toFixed(1)} dB
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8A9499]">RMS:</span>
                    <div className="text-[#3FB950] font-semibold" data-testid="text-rms">
                      {mockData.levels.rms.toFixed(1)} dB
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#8A9499]">LUFS:</span>
                    <div className="text-[#3FB950] font-semibold" data-testid="text-lufs">
                      {mockData.levels.lufs.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8A9499]">LRA:</span>
                    <div className="text-[#3FB950] font-semibold" data-testid="text-lra">
                      {mockData.analysis.dynamicRange.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#3FB95022] pt-4">
                  <div className="text-[#8A9499] mb-2">STEREO FIELD</div>
                  <div className="flex justify-between items-center">
                    <span>Width:</span>
                    <span className="text-[#3FB950]" data-testid="text-stereo-width">
                      {mockData.analysis.stereoWidth.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Correlation:</span>
                    <span className="text-[#3FB950]" data-testid="text-phase-correlation">
                      {mockData.analysis.phaseCorrelation.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-[#3FB95022] pt-4">
                  <div className="text-[#8A9499] mb-2">COMPRESSION</div>
                  <div className="flex justify-between items-center">
                    <span>Threshold:</span>
                    <span className="text-[#3FB950]" data-testid="text-comp-threshold">
                      {mockData.compression.threshold.toFixed(1)} dB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ratio:</span>
                    <span className="text-[#3FB950]" data-testid="text-comp-ratio">
                      {mockData.compression.ratio.toFixed(1)}:1
                    </span>
                  </div>
                </div>
                {/* Voidline Score */}
                <div className="border-t border-[#3FB95022] pt-4">
                  <div className="text-center">
                    <div className="text-xs text-[#8A9499] mb-1">VOIDLINE SCORE</div>
                    <motion.div 
                      className="text-2xl font-bold text-[#3FB950]"
                      animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      data-testid="text-voidline-score"
                    >
                      {(85 + Math.random() * 10).toFixed(1)}
                    </motion.div>
                    <div className="text-xs text-[#8A9499]">Professional Grade</div>
                  </div>
                </div>
              </div>
            </NeonCardContent>
          </NeonCard>
          {/* Export/Transmit Panel */}
          <NeonCard variant="terminal" className="mt-2 bg-[#101315] border-[#3FB95022] rounded">
            <NeonCardHeader>
              <NeonCardTitle className="text-[#3FB950]">TRANSMISSION PROTOCOL</NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <div className="mb-2 text-xs">Status: {exporting ? (progress < 100 ? "Applying dynamics processing..." : "Complete!") : "Idle"}</div>
              <div className="relative w-full h-3 bg-[#141D15] rounded">
                <div className="absolute top-0 left-0 h-3 bg-[#3FB950] rounded transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs mt-1">ETA: {exporting && progress < 100 ? Math.max(1, Math.round((100 - progress) / 5 * 0.12)) + "s" : "0s"}</div>
              <div className="text-xs">Output: club_master_final.wav</div>
              <Button className="mt-2 w-full font-mono tracking-tight bg-[#18281A] border border-[#3FB950] text-[#3FB950] hover:bg-[#1d2920]" onClick={handleTransmit} disabled={exporting}>
                [TRANSMIT]
              </Button>
            </NeonCardContent>
          </NeonCard>
        </motion.div>
      </div>

      {/* FOOTER STATUS BAR */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-[#0B0C0E] border-t border-[#3FB95022] p-2 md:p-4 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex flex-wrap items-center justify-between font-mono text-xs gap-2">
          <div className="flex flex-wrap gap-4">
            <div className="text-[#8A9499]">
              ENGINE: <span className="text-[#3FB950]">ONLINE</span>
            </div>
            <div className="text-[#8A9499]">
              BUFFER: <span className="text-[#3FB950]">512 SAMPLES</span>
            </div>
            <div className="text-[#8A9499]">
              LATENCY: <span className="text-[#3FB950]">2.3ms</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-[#8A9499]">
              CPU: <span className="text-[#3FB950]">{(15 + Math.random() * 10).toFixed(1)}%</span>
            </div>
            <div className="text-[#8A9499]">
              MEMORY: <span className="text-[#3FB950]">{(245 + Math.random() * 50).toFixed(0)}MB</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#3FB950' }}
              />
              <span className="text-[#3FB950]">READY</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}