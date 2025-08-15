import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal } from 'lucide-react';

interface SystemMessage {
  id: string;
  type: 'analysis' | 'processing' | 'export' | 'complete';
  phase: string;
  message: string;
  timestamp: Date;
  progress?: number;
}

interface FloatingSystemToastProps {
  isActive?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function FloatingSystemToast({ 
  isActive = false, 
  onComplete,
  className = '' 
}: FloatingSystemToastProps) {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // System phases for analysis and mastering
  const analysisPhases = [
    'Standard Analysis: peak scan...',
    'Standard Analysis: crest factor...',
    'Standard Analysis: phase window init...',
    'Standard Analysis: spectral FFT...',
    'Standard Analysis: loudness gates...',
    'Standard Analysis: correlation matrix...',
    'AI Refinement: Spatial Flux suggests width 86%',
    'AI Refinement: EQ bell −1.2 dB @ 2.8 kHz',
    'AI Refinement: Neural transient detection',
    'AI Refinement: Dynamic range optimization',
    'AI Refinement: Stereo field analysis',
    'AI Refinement: Final parameter tuning'
  ];

  const exportPhases = [
    'Preparing export pipeline...',
    'Applying final processing...',
    'Encoding audio stream...',
    'Finalizing transmission...',
    'Export complete'
  ];

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    let phaseIndex = 0;
    let currentPhases = analysisPhases;

    const processPhase = () => {
      if (phaseIndex < currentPhases.length) {
        const phase = currentPhases[phaseIndex];
        const newMessage: SystemMessage = {
          id: Date.now().toString(),
          type: phaseIndex < 6 ? 'analysis' : 'processing',
          phase: phase.includes('Analysis') ? 'ANALYSIS' : 'AI_REFINEMENT',
          message: phase,
          timestamp: new Date(),
          progress: Math.round(((phaseIndex + 1) / currentPhases.length) * 100)
        };

        setMessages(prev => [newMessage, ...prev.slice(0, 4)]);
        setCurrentPhase(phase);
        setProgress(newMessage.progress || 0);

        phaseIndex++;

        // Variable timing for realism
        const delay = phase.includes('Analysis') ? 800 : 1200;
        setTimeout(processPhase, delay + Math.random() * 500);
      } else {
        // Complete analysis, start export if needed
        if (currentPhases === analysisPhases) {
          currentPhases = exportPhases;
          phaseIndex = 0;
          setTimeout(processPhase, 1000);
        } else {
          // All phases complete
          setTimeout(() => {
            const completeMessage: SystemMessage = {
              id: Date.now().toString(),
              type: 'complete',
              phase: 'COMPLETE',
              message: 'All systems nominal. Ready for transmission.',
              timestamp: new Date(),
              progress: 100
            };
            setMessages(prev => [completeMessage, ...prev.slice(0, 2)]);

            // Auto-hide after completion
            setTimeout(() => {
              setIsVisible(false);
              onComplete?.();
            }, 3000);
          }, 1000);
        }
      }
    };

    processPhase();
  }, [isActive, onComplete]);

  const getMessageColor = (type: SystemMessage['type']) => {
    switch (type) {
      case 'analysis': return 'text-cyan-400';
      case 'processing': return 'text-emerald-400';
      case 'export': return 'text-orange-400';
      case 'complete': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ANALYSIS': return 'text-cyan-400';
      case 'AI_REFINEMENT': return 'text-emerald-400';
      case 'EXPORT': return 'text-orange-400';
      case 'COMPLETE': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className={`w-80 ${className}`}
          >
            <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl font-mono text-xs">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-cyan-500/20">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold text-xs">SYSTEM FEED</span>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="px-3 py-2 border-b border-cyan-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-400 text-xs">PROGRESS</span>
                  <span className="text-cyan-400 text-xs">{progress}%</span>
                </div>
                <div className="bg-black/50 h-1.5 rounded overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Messages */}
              <div className="p-3 max-h-32 overflow-hidden">
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {messages.slice(0, 4).map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ 
                          opacity: 1 - (index * 0.2), 
                          x: 0, 
                          height: 'auto',
                          transition: { duration: 0.3 }
                        }}
                        exit={{ 
                          opacity: 0, 
                          x: -20, 
                          height: 0,
                          transition: { duration: 0.2 }
                        }}
                        className="flex items-start space-x-2"
                      >
                        <span className={`text-xs font-semibold min-w-fit ${getPhaseColor(message.phase)}`}>
                          [{message.phase}]
                        </span>
                        <span className={`text-xs leading-relaxed ${getMessageColor(message.type)}`}>
                          {message.message}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Status footer */}
              <div className="px-3 py-2 border-t border-cyan-500/20">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-cyan-400">ACTIVE</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                      <span className="text-emerald-400">AI</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date().toLocaleTimeString().slice(0, 5)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}