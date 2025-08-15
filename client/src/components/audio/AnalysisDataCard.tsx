
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface AnalysisData {
  lufs: number;
  dbtp: number;
  lra: number;
  correlation: number;
  spectralCentroid: number;
  dynamicRange: number;
  voidlineScore: number;
  masteredCompliance: number;
  broadcastCompliance: number;
}

interface AnalysisDataCardProps {
  analysisData?: AnalysisData;
  isAnalyzing: boolean;
  className?: string;
}

export function AnalysisDataCard({ analysisData, isAnalyzing, className = '' }: AnalysisDataCardProps) {
  const [displayData, setDisplayData] = useState<AnalysisData | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Partial<AnalysisData>>({});

  useEffect(() => {
    if (analysisData) {
      setDisplayData(analysisData);
      
      // Animate values counting up
      const keys = Object.keys(analysisData) as (keyof AnalysisData)[];
      keys.forEach((key, index) => {
        setTimeout(() => {
          setAnimatedValues(prev => ({
            ...prev,
            [key]: analysisData[key]
          }));
        }, index * 100);
      });
    }
  }, [analysisData]);

  const getComplianceColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getVoidlineScoreColor = (score: number) => {
    if (score >= 90) return 'text-cyan-400';
    if (score >= 75) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!displayData && !isAnalyzing) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voidline Score - Hero Metric */}
      <Card className="bg-black/90 border-cyan-500/30 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm text-cyan-400 font-bold tracking-wider">VOIDLINE SCORE</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="font-mono text-xs text-cyan-400/60">ANALYZED</span>
            </div>
          </div>
          
          <div className="text-center">
            <motion.div
              className={`text-6xl font-mono font-bold ${getVoidlineScoreColor(animatedValues.voidlineScore || 0)}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
            >
              {Math.round(animatedValues.voidlineScore || 0)}
            </motion.div>
            <div className="text-sm font-mono text-gray-400 mt-2">Mastering Quality Index</div>
            
            {/* Score Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
              <motion.div
                className={`h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-cyan-400`}
                initial={{ width: 0 }}
                animate={{ width: `${animatedValues.voidlineScore || 0}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Technical Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LUFS */}
        <Card className="bg-black/90 border-cyan-500/20 p-4">
          <div className="text-center">
            <div className="text-xs font-mono text-cyan-400 mb-2">LUFS</div>
            <motion.div
              className="text-2xl font-mono font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {(animatedValues.lufs || 0).toFixed(1)}
            </motion.div>
            <div className="text-xs text-gray-400">Loudness</div>
          </div>
        </Card>

        {/* True Peak */}
        <Card className="bg-black/90 border-cyan-500/20 p-4">
          <div className="text-center">
            <div className="text-xs font-mono text-cyan-400 mb-2">dBTP</div>
            <motion.div
              className="text-2xl font-mono font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {(animatedValues.dbtp || 0).toFixed(1)}
            </motion.div>
            <div className="text-xs text-gray-400">True Peak</div>
          </div>
        </Card>

        {/* LRA */}
        <Card className="bg-black/90 border-cyan-500/20 p-4">
          <div className="text-center">
            <div className="text-xs font-mono text-cyan-400 mb-2">LRA</div>
            <motion.div
              className="text-2xl font-mono font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {(animatedValues.lra || 0).toFixed(1)}
            </motion.div>
            <div className="text-xs text-gray-400">Loudness Range</div>
          </div>
        </Card>

        {/* Correlation */}
        <Card className="bg-black/90 border-cyan-500/20 p-4">
          <div className="text-center">
            <div className="text-xs font-mono text-cyan-400 mb-2">CORR</div>
            <motion.div
              className="text-2xl font-mono font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {(animatedValues.correlation || 0).toFixed(2)}
            </motion.div>
            <div className="text-xs text-gray-400">Stereo Correlation</div>
          </div>
        </Card>
      </div>

      {/* Compliance Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-black/90 border-cyan-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono text-sm text-cyan-400 font-bold">MASTERING COMPLIANCE</h4>
            <motion.div
              className={`text-2xl font-mono font-bold ${getComplianceColor(animatedValues.masteredCompliance || 0)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {Math.round(animatedValues.masteredCompliance || 0)}%
            </motion.div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${animatedValues.masteredCompliance || 0}%` }}
              transition={{ duration: 1.2, delay: 0.4 }}
            />
          </div>
        </Card>

        <Card className="bg-black/90 border-cyan-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono text-sm text-cyan-400 font-bold">BROADCAST COMPLIANCE</h4>
            <motion.div
              className={`text-2xl font-mono font-bold ${getComplianceColor(animatedValues.broadcastCompliance || 0)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {Math.round(animatedValues.broadcastCompliance || 0)}%
            </motion.div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${animatedValues.broadcastCompliance || 0}%` }}
              transition={{ duration: 1.2, delay: 0.5 }}
            />
          </div>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <Card className="bg-black/90 border-cyan-500/20 p-4">
        <h4 className="font-mono text-sm text-cyan-400 font-bold mb-4">ADVANCED ANALYSIS</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Spectral Centroid</div>
            <div className="text-lg font-mono text-white">
              {Math.round(animatedValues.spectralCentroid || 0)} Hz
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Dynamic Range</div>
            <div className="text-lg font-mono text-white">
              {(animatedValues.dynamicRange || 0).toFixed(1)} dB
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Loading State */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mb-4 mx-auto"></div>
              <div className="font-mono text-cyan-400 text-sm">ANALYZING AUDIO...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
