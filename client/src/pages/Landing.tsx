import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Logo } from "@/components/Logo";
import { GlitchWord } from "@/components/effects/GlitchWord";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { WaveDNA } from "@/components/visualizers/WaveDNA";

export default function Landing() {
  const [selectedTheme, setSelectedTheme] = useState<"classic" | "matrix" | "cyberpunk" | "retro">("classic");
  const [showUpload, setShowUpload] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const handleThemeChange = (newTheme: typeof selectedTheme) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker text-text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-accent-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo className="h-8" />
            </div>
            
            <div className="flex items-center space-x-6">
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
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  className="font-mono text-sm"
                  data-testid="button-login"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="font-mono text-accent-primary text-lg mb-4">
              $ ./ai-mastering-core --init
            </div>
            
            <h1 className="text-5xl font-bold mb-6">
              <GlitchWord 
                autoTrigger 
                autoInterval={5000} 
                intensity="medium"
                className="glow-text"
              >
                AI MASTERING
              </GlitchWord>{" "}
              CONSOLE
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Welcome, producer. Our advanced AI is ready to analyze and enhance your audio. Upload your track to begin 
              the mastering process and unlock its full sonic potential.
            </p>
            
            <div className="flex justify-center space-x-4 mb-12">
              <Button 
                size="lg"
                onClick={handleStartMastering}
                className="neon-button font-bold px-8 py-3"
                data-testid="button-start-mastering"
              >
                Start Mastering
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setShowUpload(true)}
                className="neon-button-outline px-8 py-3"
                data-testid="button-upload-audio"
              >
                Upload Audio File...
              </Button>
            </div>
            
            {/* System Status */}
            <NeonCard variant="terminal" className="p-4 max-w-2xl mx-auto text-left">
              <div className="font-mono text-sm space-y-2">
                <div className="text-accent-primary">% Live System Feed:</div>
                <div className="text-text-muted">[STATUS] AI core initialized and stable.</div>
                <div className="text-text-muted">[STATUS] Neural network connection is nominal.</div>
                <div className="text-yellow-400">[ALERT] Solar flare activity detected. Uplink integrity at 96%.</div>
                <div className="text-accent-primary">System is ready for your command</div>
              </div>
            </NeonCard>
          </div>
          
          {/* Theme Selector */}
          <div className="mb-16">
            <NeonCard variant="terminal" className="p-4 max-w-2xl mx-auto">
              <div className="font-mono text-sm mb-3 text-accent-primary">$ select-theme --mode</div>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  variant={theme === "classic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("classic")}
                  className="font-mono text-sm"
                  data-testid="button-theme-classic"
                >
                  Classic Terminal
                </Button>
                <Button
                  variant={theme === "matrix" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("matrix")}
                  className="font-mono text-sm"
                  data-testid="button-theme-matrix"
                >
                  Matrix
                </Button>
                <Button
                  variant={theme === "cyberpunk" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("cyberpunk")}
                  className="font-mono text-sm"
                  data-testid="button-theme-cyberpunk"
                >
                  Cyberpunk
                </Button>
                <Button
                  variant={theme === "retro" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("retro")}
                  className="font-mono text-sm"
                  data-testid="button-theme-retro"
                >
                  Retro
                </Button>
              </div>
            </NeonCard>
          </div>
          
          {/* Three Phase Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16" id="features">
            {/* Phase 1: Analysis */}
            <NeonCard variant="terminal" className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-accent-primary font-mono text-lg">Phase 1:</div>
                <div className="text-text-primary font-bold">Analysis</div>
                <div className="text-text-muted font-mono text-sm">CORE: DECONSTRUCT</div>
              </div>
              
              <h3 className="text-xl font-bold mb-3">Deep Signal Deconstruction</h3>
              <p className="text-text-secondary mb-6">
                AI meticulously analyzes every nuance, dynamics, frequencies, and stereo image.
              </p>
              
              {/* Spectrum Analyzer Preview */}
              <div className="bg-black/50 p-4 rounded">
                <div className="flex items-end space-x-1 h-24">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="spectrum-bar flex-1 animate-signal-scan"
                      style={{
                        height: `${Math.random() * 80 + 20}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </NeonCard>
            
            {/* Phase 2: Enhancement */}
            <NeonCard variant="terminal" className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-accent-primary font-mono text-lg">Phase 2:</div>
                <div className="text-text-primary font-bold">Enhancement</div>
                <div className="text-text-muted font-mono text-sm">CORE: REBUILD</div>
              </div>
              
              <h3 className="text-xl font-bold mb-3">Intelligent Reconstruction</h3>
              <p className="text-text-secondary mb-6">
                The AI rebuilds the audio, applying precise, calculated enhancements.
              </p>
              
              {/* Neural Module Display */}
              <div className="bg-black/50 p-4 rounded">
                <div className="font-mono text-sm mb-2">neural module v9.4.1</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="w-8 h-8 bg-accent-primary/30 border border-accent-primary rounded mx-auto mb-1"></div>
                    <div className="text-xs">Dynamics</div>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-accent-primary/30 border border-accent-primary rounded mx-auto mb-1"></div>
                    <div className="text-xs">Stereo</div>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-accent-primary/30 border border-accent-primary rounded mx-auto mb-1"></div>
                    <div className="text-xs">EQ Balance</div>
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
              
              <h3 className="text-xl font-bold mb-3">Interstellar Transmission</h3>
              <p className="text-text-secondary mb-6">
                The final master signal is crafted for a powerful and clear transmission.
              </p>
              
              {/* Signal Bars */}
              <div className="bg-black/50 p-4 rounded">
                <div className="flex items-end justify-center space-x-2 h-16">
                  <div className="w-3 h-8 bg-accent-primary"></div>
                  <div className="w-3 h-12 bg-accent-primary"></div>
                  <div className="w-3 h-16 bg-yellow-400"></div>
                  <div className="w-3 h-14 bg-accent-primary"></div>
                </div>
              </div>
            </NeonCard>
          </div>

          {/* WaveDNA Preview */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 glow-text">WAVEDNA PREVIEW</h2>
              <p className="text-text-secondary">Experience our advanced audio visualization technology</p>
            </div>
            <NeonCard variant="glow" className="max-w-4xl mx-auto">
              <WaveDNA isPlaying={true} className="h-64" />
            </NeonCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-accent-primary/20 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="font-mono text-text-muted">
              Frequencies aligned. Silence remains.
            </div>
            <div className="flex space-x-6 text-sm font-mono text-text-muted">
              <a href="#" className="hover:text-accent-primary">Privacy Policy</a>
              <a href="#" className="hover:text-accent-primary">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
