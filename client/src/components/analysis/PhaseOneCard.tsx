
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface PhaseOneCardProps {
  className?: string;
}

export function PhaseOneCard({ className = '' }: PhaseOneCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  return (
    <>
      {/* Main Phase 1 Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`cursor-pointer ${className}`}
        onClick={openModal}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Open Phase 1: Deep Signal Deconstruction"
      >
        <Card className="bg-black/90 border-cyan-500/30 p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-lg text-cyan-400 font-bold tracking-wider">
              Phase 1 · Deep Signal Deconstruction
            </h3>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            AI meticulously analyzes every nuance, dynamics, frequencies, and stereo image.
          </p>

          {/* Animated Thumbnails Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Nuance Thumbnail */}
            <div className="bg-black/60 border border-gray-700 rounded-lg p-4 relative overflow-hidden">
              <h4 className="font-mono text-xs text-cyan-400 mb-3">Nuance</h4>
              <div className="relative h-16">
                {/* Waveform */}
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  <polyline
                    points="4,44 24,34 44,48 64,20 84,36 104,18 124,28 144,12 164,22 184,16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-cyan-400"
                  />
                  {/* Pulsing transients */}
                  <circle cx="64" cy="20" r="2" className="fill-cyan-400 animate-pulse" />
                  <circle cx="144" cy="12" r="2" className="fill-cyan-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </svg>
                {/* Sweep line */}
                <div className="absolute top-0 right-0 w-2 h-full bg-cyan-400 opacity-20 animate-pulse" />
              </div>
            </div>

            {/* Dynamics Thumbnail */}
            <div className="bg-black/60 border border-gray-700 rounded-lg p-4">
              <h4 className="font-mono text-xs text-cyan-400 mb-3">Dynamics</h4>
              <div className="flex items-end space-x-2 h-16">
                {/* Animated bars */}
                <div className="w-4 bg-cyan-400 rounded-t animate-pulse" style={{ height: '40%', animationDelay: '0s' }} />
                <div className="w-4 bg-green-400 rounded-t animate-pulse" style={{ height: '60%', animationDelay: '0.2s' }} />
                <div className="w-4 bg-yellow-400 rounded-t animate-pulse" style={{ height: '25%', animationDelay: '0.4s' }} />
                {/* Gauge */}
                <div className="ml-4 relative">
                  <div className="w-12 h-12 border-2 border-gray-600 rounded-full">
                    <div className="absolute top-1/2 left-1/2 w-1 h-5 bg-cyan-400 origin-bottom -translate-x-1/2 -translate-y-5 rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            {/* Frequencies Thumbnail */}
            <div className="bg-black/60 border border-gray-700 rounded-lg p-4 relative overflow-hidden">
              <h4 className="font-mono text-xs text-cyan-400 mb-3">Frequencies</h4>
              <div className="flex items-end space-x-1 h-16">
                {/* Spectrum bars */}
                {Array.from({ length: 16 }, (_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-cyan-400 rounded-t opacity-80"
                    style={{
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              {/* EQ curve overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60">
                <path
                  d="M5,45 Q25,25 50,35 T95,30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-green-400 opacity-70"
                />
              </svg>
              {/* Scan line */}
              <div className="absolute top-0 right-0 w-2 h-full bg-cyan-400 opacity-20 animate-pulse" />
            </div>

            {/* Stereo Image Thumbnail */}
            <div className="bg-black/60 border border-gray-700 rounded-lg p-4">
              <h4 className="font-mono text-xs text-cyan-400 mb-3">Stereo Image</h4>
              <div className="flex space-x-2 h-16">
                {/* Goniometer */}
                <div className="flex-1 relative">
                  <div className="w-full h-full border border-gray-600 rounded">
                    <svg className="w-full h-full" viewBox="0 0 60 60">
                      <ellipse cx="30" cy="30" rx="20" ry="12" fill="none" stroke="currentColor" className="text-cyan-400" strokeWidth="1" />
                      <ellipse cx="30" cy="30" rx="12" ry="6" fill="none" stroke="currentColor" className="text-green-400" strokeWidth="1" />
                      <line
                        x1="30" y1="30" x2="50" y2="30"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-cyan-400 origin-[30px_30px] animate-pulse"
                        style={{ transformOrigin: '30px 30px' }}
                      />
                    </svg>
                  </div>
                </div>
                {/* Phase radar */}
                <div className="w-8 relative">
                  <div className="w-full h-full border border-gray-600 rounded">
                    <div className="absolute inset-1 bg-cyan-400 opacity-20 rounded" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 50% 0)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="font-mono text-xs text-green-400 mb-2">Click to expand full analysis ⏎</p>
            <div className="text-gray-500 text-xs">
              What happens in Phase 1? Micro‑transient mapping, loudness analysis, spectral profiling, and stereo correlation.
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black border border-cyan-500/30 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
                <h2 className="font-mono text-lg text-cyan-400 font-bold">
                  Deep Signal Deconstruction — Detailed Panels
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <button
                    onClick={closeModal}
                    className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors"
                    aria-label="Close detail view"
                    title="Close (Esc)"
                  />
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Detailed analysis cards would go here */}
                  <Card className="bg-black/50 border-gray-700 p-6">
                    <h3 className="font-mono text-cyan-400 text-lg mb-4">AI Analysis • Nuance</h3>
                    <div className="space-y-4">
                      <div className="bg-black/60 border border-gray-600 rounded p-4 h-32">
                        <div className="text-xs text-gray-400 mb-2">MICRO‑TRANSIENT MAP</div>
                        <div className="text-xs text-gray-300 text-right mb-2">Resolution: 5 ms</div>
                        {/* Detailed visualization would go here */}
                        <div className="h-16 bg-gray-800 rounded"></div>
                      </div>
                      <div className="bg-black/60 border border-gray-600 rounded p-3">
                        <div className="font-mono text-xs text-cyan-300">
                          Transients: 27 • Micro‑contrast Δ: 1.8 dB • Sibilants: nominal
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-black/50 border-gray-700 p-6">
                    <h3 className="font-mono text-cyan-400 text-lg mb-4">AI Analysis • Dynamics</h3>
                    <div className="space-y-4">
                      <div className="bg-black/60 border border-gray-600 rounded p-4 h-32">
                        <div className="text-xs text-gray-400 mb-2">LOUDNESS • PEAK • CREST</div>
                        {/* Detailed visualization would go here */}
                        <div className="h-16 bg-gray-800 rounded"></div>
                      </div>
                      <div className="bg-black/60 border border-gray-600 rounded p-3">
                        <div className="font-mono text-xs text-cyan-300">
                          Targets: Club −9…−7 LUFS • TP ≤ −1.0 dBTP • LRA 6–10
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-black/50 border-gray-700 p-6">
                    <h3 className="font-mono text-cyan-400 text-lg mb-4">AI Analysis • Frequencies</h3>
                    <div className="space-y-4">
                      <div className="bg-black/60 border border-gray-600 rounded p-4 h-32">
                        <div className="text-xs text-gray-400 mb-2">SPECTRAL PROFILE (20 Hz → 20 kHz)</div>
                        {/* Detailed visualization would go here */}
                        <div className="h-16 bg-gray-800 rounded"></div>
                      </div>
                      <div className="bg-black/60 border border-gray-600 rounded p-3">
                        <div className="font-mono text-xs text-cyan-300">
                          EQ plan: +1.5 dB @ 65 Hz • −1.2 dB @ 2.8 kHz • +0.8 dB @ 12 kHz
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-black/50 border-gray-700 p-6">
                    <h3 className="font-mono text-cyan-400 text-lg mb-4">AI Analysis • Stereo Image</h3>
                    <div className="space-y-4">
                      <div className="bg-black/60 border border-gray-600 rounded p-4 h-32">
                        <div className="text-xs text-gray-400 mb-2">GONIOMETER • PHASE • WIDTH</div>
                        {/* Detailed visualization would go here */}
                        <div className="h-16 bg-gray-800 rounded"></div>
                      </div>
                      <div className="bg-black/60 border border-gray-600 rounded p-3">
                        <div className="font-mono text-xs text-cyan-300">
                          Keep correlation ≥ 0.2 for mono‑safe lows • Width tuned by Spatial Flux
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
