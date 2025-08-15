import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { NeonCard } from "@/components/ui/neon-card";
import { Logo } from "@/components/Logo";
import { WaveDNA } from "@/components/visualizers/WaveDNA";
import { StereoRadar } from "@/components/visualizers/StereoRadar";
import { PhaseGrid } from "@/components/visualizers/PhaseGrid";
import { VoidlineMeter } from "@/components/meters/VoidlineMeter";
import { Fader } from "@/components/controls/Fader";
import { Knob } from "@/components/controls/Knob";
import { MissionBar } from "@/components/mission/MissionBar";
import { PresetTile } from "@/components/presets/PresetTile";
import { TransmissionPanel } from "@/components/export/TransmissionPanel";
import { GlitchWord } from "@/components/effects/GlitchWord";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAudioStore } from "@/lib/stores/audioStore";
import { usePresetStore } from "@/lib/stores/presetStore";
import { AudioEngine } from "@/modules/audio/AudioEngine";
import type { Preset, ExportFormatType, AnalysisResults, PresetParameters } from "@shared/schema";

export default function Console() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [processingParams, setProcessingParams] = useState<PresetParameters>({
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
  });
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Audio engine instance
  const [audioEngine] = useState(() => new AudioEngine());

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  // Fetch presets
  const { data: presetsData, isLoading: presetsLoading } = useQuery({
    queryKey: ["/api/presets"],
    retry: false,
  });

  // Fetch user projects
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: (project) => {
      setCurrentProject(project.id);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: `Created project: ${project.name}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Analyze audio mutation
  const analyzeAudioMutation = useMutation({
    mutationFn: async (audioData: string) => {
      const response = await apiRequest("POST", "/api/dsp/analyze", { audioData });
      return response.json();
    },
    onSuccess: (analysis: AnalysisResults) => {
      setAnalysisResults(analysis);
      if (currentProject) {
        updateProjectMutation.mutate({
          id: currentProject,
          updates: { analysisResults: analysis, voidlineScore: analysis.voidlineScore },
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Analysis Failed",
        description: "Could not analyze audio file",
        variant: "destructive",
      });
    },
  });

  // Export audio mutation
  const exportAudioMutation = useMutation({
    mutationFn: async (format: ExportFormatType) => {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await apiRequest("POST", "/api/dsp/render", {
        audioData: "mock_audio_data", // In real app, would be actual audio data
        parameters: processingParams,
        exportFormat: format,
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Export Complete",
        description: "Your mastered audio is ready for download",
      });
    },
    onError: (error) => {
      setIsExporting(false);
      setExportProgress(0);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Export Failed",
        description: "Could not export audio file",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setAudioFile(file);
    
    // Create project
    createProjectMutation.mutate({
      name: file.name.replace(/\.[^/.]+$/, ""),
      originalFileName: file.name,
      processingParams,
    });

    // Convert to base64 and analyze
    const reader = new FileReader();
    reader.onload = () => {
      const audioData = reader.result as string;
      analyzeAudioMutation.mutate(audioData);
    };
    reader.readAsDataURL(file);

    // Load into audio engine
    try {
      await audioEngine.loadAudio(file);
      toast({
        title: "Audio Loaded",
        description: "Ready for mastering",
      });
    } catch (error) {
      toast({
        title: "Audio Load Failed",
        description: "Could not load audio file",
        variant: "destructive",
      });
    }
  }, [processingParams]);

  // Handle preset application
  const handleApplyPreset = useCallback((preset: Preset) => {
    const params = preset.parameters as PresetParameters;
    setProcessingParams(params);
    
    if (currentProject) {
      updateProjectMutation.mutate({
        id: currentProject,
        updates: { processingParams: params },
      });
    }

    toast({
      title: "Preset Applied",
      description: `Applied ${preset.name}`,
    });
  }, [currentProject]);

  // Handle parameter changes
  const handleParameterChange = useCallback((key: string, value: number) => {
    setProcessingParams(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (!audioEngine.isLoaded) {
      toast({
        title: "No Audio",
        description: "Please upload an audio file first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isPlaying) {
        await audioEngine.pause();
      } else {
        await audioEngine.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Could not control audio playback",
        variant: "destructive",
      });
    }
  }, [audioEngine, isPlaying]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker text-text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-accent-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo className="h-8" />
            
            <div className="flex items-center space-x-6">
              <div className="font-mono text-sm text-text-muted">
                {user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="font-mono text-sm"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <GlitchWord autoTrigger autoInterval={8000} intensity="medium" className="glow-text">
                FREQUENCY COMMAND DECK
              </GlitchWord>
            </h1>
            <p className="text-text-secondary text-lg">Professional mastering interface with real-time analysis</p>
          </div>

          {/* Audio Upload Section */}
          {!audioFile && (
            <NeonCard variant="glow" className="p-8 mb-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Signal Acquisition</h2>
              <p className="text-text-secondary mb-6">Upload your audio file to begin the mastering process</p>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="max-w-md mx-auto"
                data-testid="input-audio-file"
              />
            </NeonCard>
          )}

          {/* Main Console Grid */}
          {audioFile && (
            <>
              {/* Playback Controls */}
              <div className="flex justify-center mb-8">
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className="font-mono px-8"
                  data-testid="button-play-pause"
                >
                  {isPlaying ? "PAUSE" : "PLAY"}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Left Panel - Stereo Field Radar */}
                <NeonCard variant="terminal" className="p-6">
                  <StereoRadar 
                    correlation={analysisResults?.correlation}
                    width={analysisResults?.stereoWidth}
                    isActive={isPlaying}
                  />
                </NeonCard>
                
                {/* Center Panel - WaveDNA Visualizer */}
                <div className="lg:col-span-2">
                  <NeonCard variant="terminal" className="p-6">
                    <WaveDNA isPlaying={isPlaying} />
                  </NeonCard>
                </div>
                
                {/* Right Panel - Dynamic Faders */}
                <NeonCard variant="terminal" className="p-6">
                  <h3 className="font-mono text-accent-primary mb-4 text-sm">DYNAMIC FADERS</h3>
                  
                  <div className="space-y-6">
                    <Fader
                      label="LUFS"
                      value={analysisResults?.lufs || -14.2}
                      min={-30}
                      max={0}
                      target={-14}
                      unit=" LUFS"
                      onChange={() => {}} // Read-only display
                    />
                    <Fader
                      label="dBTP"
                      value={analysisResults?.dbtp || -1.1}
                      min={-10}
                      max={0}
                      target={-1}
                      unit=" dBTP"
                      onChange={() => {}}
                    />
                    <Fader
                      label="dBFS"
                      value={analysisResults?.dbfs || -3.5}
                      min={-60}
                      max={0}
                      unit=" dBFS"
                      onChange={() => {}}
                    />
                    <Fader
                      label="LRA"
                      value={analysisResults?.lra || 6.8}
                      min={0}
                      max={20}
                      unit=" LU"
                      onChange={() => {}}
                    />
                  </div>
                </NeonCard>
                
                {/* Bottom Left - Phase Lock Grid */}
                <NeonCard variant="terminal" className="p-6">
                  <PhaseGrid 
                    correlation={analysisResults?.correlation}
                    isActive={isPlaying}
                  />
                </NeonCard>
                
                {/* Bottom Center - Signal Modulation */}
                <div className="lg:col-span-2">
                  <NeonCard variant="terminal" className="p-6">
                    <h3 className="font-mono text-accent-primary mb-4 text-sm">SIGNAL MODULATION ZONE</h3>
                    
                    <div className="grid grid-cols-5 gap-4">
                      <Knob
                        label="Harmonic"
                        value={processingParams.harmonicBoost}
                        onChange={(value) => handleParameterChange("harmonicBoost", value)}
                      />
                      <Knob
                        label="Subweight"
                        value={processingParams.subweight}
                        onChange={(value) => handleParameterChange("subweight", value)}
                      />
                      <Knob
                        label="Transient"
                        value={processingParams.transientPunch}
                        onChange={(value) => handleParameterChange("transientPunch", value)}
                      />
                      <Knob
                        label="Airlift"
                        value={processingParams.airlift}
                        onChange={(value) => handleParameterChange("airlift", value)}
                      />
                      <Knob
                        label="Spatial"
                        value={processingParams.spatialFlux}
                        onChange={(value) => handleParameterChange("spatialFlux", value)}
                      />
                    </div>
                  </NeonCard>
                </div>
                
                {/* Bottom Right - Mission Status */}
                <NeonCard variant="terminal" className="p-6">
                  <MissionBar
                    signalStrength={94}
                    voidlineScore={analysisResults?.voidlineScore || 87}
                    status={isPlaying ? "processing" : "analyzing"}
                  />
                </NeonCard>
              </div>
              
              {/* Noise Floor Tracker */}
              <NeonCard variant="terminal" className="p-6 mb-8">
                <VoidlineMeter
                  level={analysisResults?.dbfs || -8.5}
                  headroom={12.3}
                  noiseFloor={analysisResults?.noiseFloor || -60.2}
                />
              </NeonCard>

              {/* Blackroom Profiles */}
              <div className="mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 glow-text">BLACKROOM PROFILES</h2>
                  <p className="text-text-secondary">AI-crafted presets for every sonic environment</p>
                </div>
                
                {!presetsLoading && presetsData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {presetsData.builtIn?.slice(0, 3).map((preset: Preset) => (
                      <PresetTile
                        key={preset.id}
                        preset={preset}
                        onApply={handleApplyPreset}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Transmission Window */}
              <TransmissionPanel
                onExport={(format) => exportAudioMutation.mutate(format)}
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportStatus={isExporting ? "Applying dynamics processing..." : "Ready for transmission"}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
