
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { initializeAudioEngine } from '@/audio/AudioEngine';
import { initializeTicker } from '@/graphics/Ticker';
import Landing from '@/pages/Landing';
import MasteringProcess from '@/pages/MasteringProcess';
import Console from '@/pages/Console';

function App() {
  useEffect(() => {
    // Initialize global systems once on app mount
    const initializeSystems = async () => {
      try {
        // Initialize global audio engine
        await initializeAudioEngine();
        console.log('Audio engine initialized');
        
        // Initialize global graphics ticker (single RAF loop)
        initializeTicker();
        console.log('Graphics ticker initialized');
      } catch (error) {
        console.error('Failed to initialize systems:', error);
      }
    };

    initializeSystems();

    // Cleanup on unmount
    return () => {
      // Ticker cleanup handled internally
    };
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/mastering" element={<MasteringProcess />} />
            <Route path="/console" element={<Console />} />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
