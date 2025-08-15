/**
 * Mastering.tsx - Professional Mastering Session Interface
 * 
 * CONTROLS:
 * - PhaseOneCard: Click to expand detailed signal analysis modal
 * - Escape key: Close modal
 * - Enter/Space: Open modal when focused
 * - Real-time visualizers with animated analysis thumbnails
 * 
 * QA STEPS:
 * 1. Verify PhaseOneCard renders with proper terminal styling
 * 2. Test modal opening/closing with keyboard and mouse
 * 3. Check visualizations are smooth and responsive
 * 4. Confirm green color scheme consistency
 * 5. Test accessibility features and keyboard navigation
 * 6. Verify session data persistence and restoration
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { PhaseOneCard } from '@/components/analysis/PhaseOneCard';
import { useAudioStore } from '@/lib/stores/audioStore';
import { useAuth } from '@/hooks/useAuth';

interface LogEntry {
  stage: 'Standard Analysis' | 'AI Refinement';
  message: string;
}

interface CardState {
  key: string;
  title: string;
  progress: number;
  done: boolean;
  logs: LogEntry[];
  footerText: string;
}

export default function Mastering() {
  const [location] = useLocation();
  const getAnalysis = useAudioStore((state) => state.getAnalysis);
  const { isAuthenticated } = useAuth();

  // Extract ID from query params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const analysisId = urlParams.get('id') || '888_premaster';

  const analysis = getAnalysis(analysisId);

  const [overallProgress, setOverallProgress] = useState(0);
  const [cards, setCards] = useState<CardState[]>([
    {
      key: 'nuance',
      title: 'AI Analysis • Nuance',
      progress: 0,
      done: false,
      logs: [],
      footerText: 'Transients: 27 • Micro‑contrast Δ: 1.8 dB • Sibilants: nominal'
    },
    {
      key: 'dynamics',
      title: 'AI Analysis • Dynamics',
      progress: 0,
      done: false,
      logs: [],
      footerText: 'Targets: Club −9…−7 LUFS • TP ≤ −1.0 dBTP • LRA 6–10'
    },
    {
      key: 'frequencies',
      title: 'AI Analysis • Frequencies',
      progress: 0,
      done: false,
      logs: [],
      footerText: 'EQ plan: +1.5 dB @ 65 Hz • −1.2 dB @ 2.8 kHz • +0.8 dB @ 12 kHz'
    },
    {
      key: 'stereo',
      title: 'AI Analysis • Stereo Image',
      progress: 0,
      done: false,
      logs: [],
      footerText: 'Keep correlation ≥ 0.2 for mono‑safe lows • Width tuned by Spatial Flux'
    }
  ]);

  const timerRef = useRef<NodeJS.Timeout>();
  const stepCountRef = useRef(0);

  const standardAnalysisMessages = [
    'peak scan...', 
    'crest factor...', 
    'phase window init...', 
    'spectral FFT...', 
    'loudness gates...', 
    'correlation matrix...'
  ];

  const aiRefinementMessages = [
    'Spatial Flux suggests width 86%',
    'EQ bell −1.2 dB @ 2.8 kHz',
    'Neural transient detection',
    'Dynamic range optimization',
    'Stereo field analysis',
    'Final parameter tuning'
  ];

  useEffect(() => {
    // Start the simulation
    timerRef.current = setInterval(() => {
      setCards(prevCards => {
        const newCards = [...prevCards];
        let allDone = true;

        newCards.forEach(card => {
          if (card.done) return;

          const isStandardStage = stepCountRef.current < 6;
          const stage = isStandardStage ? 'Standard Analysis' : 'AI Refinement';

          let message = '';
          if (isStandardStage) {
            message = standardAnalysisMessages[Math.min(stepCountRef.current, standardAnalysisMessages.length - 1)];
          } else {
            const aiIndex = stepCountRef.current - 6;
            message = aiRefinementMessages[Math.min(aiIndex, aiRefinementMessages.length - 1)];
          }

          card.logs.push({ stage, message });
          card.progress = Math.min(100, card.progress + 8);

          if (card.progress >= 100) {
            card.done = true;
          }

          if (!card.done) {
            allDone = false;
          }
        });

        stepCountRef.current++;

        // Update overall progress
        const totalProgress = newCards.reduce((sum, card) => sum + card.progress, 0) / newCards.length;
        setOverallProgress(totalProgress);

        // Stop when all cards are done
        if (allDone && timerRef.current) {
          clearInterval(timerRef.current);
        }

        return newCards;
      });
    }, 400);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono text-red-400 mb-4">Analysis Not Found</h1>
          <p className="text-gray-400">No analysis data found for ID: {analysisId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Identical to Landing */}
      <header className="border-b border-cyan-500/30 bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center space-x-6">
              {/* Navigation buttons */}
              <nav className="flex items-center space-x-4">
                <Button variant="link" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm">
                  Home
                </Button>
                <Button variant="link" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm">
                  Features
                </Button>
                <Button variant="link" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm">
                  Pricing
                </Button>
                <Button variant="link" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm">
                  About
                </Button>
              </nav>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mission Status Bar */}
      <div className="bg-black/90 border-b border-cyan-500/20 px-6 py-3">
        <div className="container mx-auto">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-sm text-cyan-400">MISSION PROGRESS</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="font-mono text-sm text-white">{Math.round(overallProgress)}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-mono font-bold text-cyan-400 mb-2">
            Mastering Process • {analysis.id}
          </h1>
          <p className="text-gray-400 font-mono">
            Phase 1: Deep Signal Deconstruction in progress...
          </p>
        </motion.div>

        {/* Phase 1 Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <PhaseOneCard />
        </motion.div>

        {/* Phase 1 Analysis Progress Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-black/90 border-cyan-500/30 h-96 flex flex-col">
                {/* Card Header */}
                <div className="p-4 border-b border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-sm text-cyan-400 font-bold">
                      {card.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="font-mono text-xs text-gray-400">
                        {card.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 bg-gray-800 rounded-full h-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${card.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Card Content - Mission Log */}
                <div className="flex-1 p-4 overflow-hidden">
                  <h4 className="font-mono text-xs text-gray-400 mb-3">MISSION LOG</h4>
                  <div className="bg-black/50 border border-gray-700 rounded p-3 h-full overflow-y-auto">
                    <ul className="space-y-1 font-mono text-xs" aria-live="polite">
                      <AnimatePresence>
                        {card.logs.map((log, logIndex) => (
                          <motion.li
                            key={logIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-start space-x-2"
                          >
                            <span className="text-cyan-400 shrink-0">
                              {log.stage === 'Standard Analysis' ? '○' : '●'}
                            </span>
                            <span className="text-gray-300 break-words">
                              <span className="text-cyan-400">{log.stage}:</span> {log.message}
                            </span>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                </div>

                {/* Footer Strip - Fixed height, no overlap */}
                <div className="border-t border-cyan-500/20 bg-black/70 p-3 h-16 flex items-center">
                  <div className="w-full overflow-hidden">
                    <p className="font-mono text-xs text-cyan-300 whitespace-nowrap text-ellipsis overflow-hidden">
                      {card.footerText}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Completion Status */}
        <AnimatePresence>
          {overallProgress >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mt-8 text-center"
            >
              <Card className="bg-gradient-to-r from-cyan-900/20 to-cyan-800/20 border-cyan-500/50 p-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <h2 className="font-mono text-lg text-cyan-400 font-bold">
                    Phase 1: Deep Signal Deconstruction Complete
                  </h2>
                </div>
                <p className="text-gray-400 font-mono mt-2">
                  All analysis cards have finished processing. Ready for Phase 2.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}