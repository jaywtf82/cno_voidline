
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Phase1DeepSignalProps {
  activePhase: 'nuance' | 'dynamics' | 'frequencies' | 'stereo';
  onPhaseChange: (phase: 'nuance' | 'dynamics' | 'frequencies' | 'stereo') => void;
  session: any;
  workletMetrics: any;
  aiAnalysis: any;
  targetCorridor: 'streaming' | 'club' | 'vinyl';
}

export function Phase1DeepSignal({
  activePhase,
  onPhaseChange,
  session,
  workletMetrics,
  aiAnalysis,
  targetCorridor
}: Phase1DeepSignalProps) {
  const phases = [
    {
      key: 'nuance' as const,
      title: 'Nuance',
      description: 'Micro-dynamics and transient analysis',
      metrics: ['ΔRMS', 'Crest', 'Transients'],
      color: 'from-cyan-500 to-blue-500'
    },
    {
      key: 'dynamics' as const,
      title: 'Dynamics',
      description: 'PLR/PSR and loudness analysis',
      metrics: ['LUFS', 'PLR', 'PSR'],
      color: 'from-green-500 to-cyan-500'
    },
    {
      key: 'frequencies' as const,
      title: 'Frequencies',
      description: 'Spectral analysis and EQ planning',
      metrics: ['Spectrum', 'Balance', 'Resonance'],
      color: 'from-yellow-500 to-green-500'
    },
    {
      key: 'stereo' as const,
      title: 'Stereo Image',
      description: 'Spatial field and correlation',
      metrics: ['Width', 'Correlation', 'Center'],
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <Card className="bg-black/90 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="font-mono text-lg text-cyan-400 flex items-center justify-between">
          Phase 1: Deep Signal Deconstruction
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">ACTIVE</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-4">
            AI meticulously analyzes every nuance, dynamics, frequencies, and stereo image.
          </p>
          
          {/* Phase Filter Chips */}
          <div className="flex flex-wrap gap-3">
            {phases.map((phase) => (
              <motion.div
                key={phase.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={activePhase === phase.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPhaseChange(phase.key)}
                  className={`
                    font-mono text-sm px-4 py-2 transition-all duration-200
                    ${activePhase === phase.key 
                      ? `bg-gradient-to-r ${phase.color} text-white border-none` 
                      : 'border-cyan-500/30 text-cyan-400 hover:border-cyan-400'
                    }
                  `}
                >
                  {phase.title}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Phase Details */}
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black/50 p-4 rounded border border-cyan-500/20"
        >
          {(() => {
            const currentPhase = phases.find(p => p.key === activePhase);
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-cyan-400 font-bold">
                    {currentPhase?.title} Analysis
                  </h3>
                  <div className="flex space-x-2">
                    {currentPhase?.metrics.map((metric) => (
                      <Badge key={metric} variant="outline" className="text-xs border-cyan-500/50">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {currentPhase?.description}
                </p>

                {/* Real-time Metrics */}
                {workletMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activePhase === 'nuance' && (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.crest || 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">CREST dB</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.transients || 0)}
                          </div>
                          <div className="text-xs text-gray-400">TRANSIENTS</div>
                        </div>
                      </>
                    )}

                    {activePhase === 'dynamics' && (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.lufsI || 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">LUFS-I</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.plr || 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">PLR dB</div>
                        </div>
                      </>
                    )}

                    {activePhase === 'frequencies' && (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.spectralCentroid || 0).toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-400">CENTROID Hz</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.spectralBalance || 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">BALANCE</div>
                        </div>
                      </>
                    )}

                    {activePhase === 'stereo' && (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.correlation || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">CORRELATION</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-mono text-cyan-400">
                            {(workletMetrics.stereoWidth || 0).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-400">WIDTH</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* AI Insights for Active Phase */}
                {aiAnalysis?.risks && aiAnalysis.risks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/20">
                    <div className="text-xs text-gray-400 mb-2">AI INSIGHTS:</div>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.risks.map((risk: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="destructive" 
                          className="text-xs cursor-pointer hover:bg-red-600"
                          title={`Click to focus on ${risk}`}
                        >
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-6">
          <div className="text-xs text-gray-400 mb-2">Analysis Progress</div>
          <div className="flex items-center space-x-2">
            {phases.map((phase, index) => (
              <div
                key={phase.key}
                className={`
                  flex-1 h-1 rounded-full transition-all duration-300
                  ${index <= phases.findIndex(p => p.key === activePhase)
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                    : 'bg-gray-700'
                  }
                `}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
