
import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/lib/stores/audioStore';

interface AnalysisData {
  id: string;
  sr: number;
  ch: number;
  dur_s: number;
  peak_dbfs: number;
  rms_mono_dbfs: number;
  crest_db: number;
  lufs_i: number | null;
  bands: {
    sub_20_40: number;
    low_40_120: number;
    lowmid_120_300: number;
    mid_300_1500: number;
    highmid_1p5k_6k: number;
    high_6k_12k: number;
    air_12k_20k: number;
  };
  mix_notes: string[];
  targets: {
    club: { lufs_i_min: number; lufs_i_max: number; tp_max_dbTP: number };
    stream: { lufs_i_min: number; lufs_i_max: number; tp_max_dbTP: number };
  };
}

interface PersistentAnalysisCardProps {
  analysisId?: string;
  analysisData?: AnalysisData;
  className?: string;
}

export function PersistentAnalysisCard({ analysisId, analysisData, className = '' }: PersistentAnalysisCardProps) {
  const [, navigate] = useLocation();
  const getAnalysis = useAudioStore((state) => state.getAnalysis);
  
  const analysis = analysisData || (analysisId ? getAnalysis(analysisId) : null);

  if (!analysis || typeof analysis !== 'object') {
    return null;
  }

  // Ensure all required properties exist with fallbacks
  const safeAnalysis = {
    id: analysis.id || 'Unknown',
    sr: analysis.sr || analysis.sampleRate || 44100,
    ch: analysis.ch || analysis.channels || 2,
    dur_s: analysis.dur_s || analysis.duration || 0,
    peak_dbfs: analysis.peak_dbfs || analysis.peak || 0,
    rms_mono_dbfs: analysis.rms_mono_dbfs || analysis.rms || 0,
    crest_db: analysis.crest_db || analysis.crest || 0,
    lufs_i: analysis.lufs_i !== undefined ? analysis.lufs_i : null,
    bands: analysis.bands || {
      sub_20_40: 0,
      low_40_120: 0,
      lowmid_120_300: 0,
      mid_300_1500: 0,
      highmid_1p5k_6k: 0,
      high_6k_12k: 0,
      air_12k_20k: 0
    },
    mix_notes: analysis.mix_notes || [],
    targets: analysis.targets || {
      club: { lufs_i_min: -8, lufs_i_max: -6, tp_max_dbTP: -1 },
      stream: { lufs_i_min: -16, lufs_i_max: -14, tp_max_dbTP: -1 }
    }
  };

  const handleStartMastering = () => {
    navigate(`/mastering?id=${safeAnalysis?.id || analysisId || 'current_analysis'}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full ${className}`}
    >
      <Card className="bg-black/90 border-green-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-lg text-green-400 font-bold tracking-wider">
            {safeAnalysis.id} — TECHNICAL ANALYSIS
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-mono text-xs text-green-400">PERSISTENT</span>
          </div>
        </div>

        {/* Technical specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-sm font-mono">
              <span className="text-gray-400">Sample rate:</span>
              <span className="text-white">{safeAnalysis.sr} Hz</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Channels:</span>
              <span className="text-white">{safeAnalysis.ch}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{safeAnalysis.dur_s.toFixed(2)} s</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-sm font-mono">
              <span className="text-gray-400">Peak:</span>
              <span className="text-white">{safeAnalysis.peak_dbfs.toFixed(2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">RMS (mono):</span>
              <span className="text-white">{safeAnalysis.rms_mono_dbfs.toFixed(2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Crest:</span>
              <span className="text-white">{safeAnalysis.crest_db.toFixed(2)} dB</span>
            </div>
          </div>
        </div>

        {/* LUFS note */}
        <div className="mb-6">
          <div className="text-sm font-mono text-gray-400">
            Integrated LUFS: <span className="text-yellow-400">
              {safeAnalysis.lufs_i !== null ? `${safeAnalysis.lufs_i.toFixed(1)}` : '(pyloudnorm unavailable)'}
            </span>
            {safeAnalysis.lufs_i === null && (
              <span className="text-gray-500"> — use a meter in Live to verify final targets.</span>
            )}
          </div>
        </div>

        {/* Band energy analysis */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Relative band energy (dB; 0 = loudest band):</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">sub_20_40:</span>
                <span className="text-white">{safeAnalysis.bands.sub_20_40.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">low_40_120:</span>
                <span className="text-white">{safeAnalysis.bands.low_40_120 >= 0 ? '+' : ''}{safeAnalysis.bands.low_40_120.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">lowmid_120_300:</span>
                <span className="text-white">{safeAnalysis.bands.lowmid_120_300.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">mid_300_1500:</span>
                <span className="text-white">{safeAnalysis.bands.mid_300_1500.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">highmid_1p5k_6k:</span>
                <span className="text-white">{safeAnalysis.bands.highmid_1p5k_6k.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">high_6k_12k:</span>
                <span className="text-white">{safeAnalysis.bands.high_6k_12k.toFixed(1)}</span>
              </div>
              <div className="flex justify-between md:col-span-2">
                <span className="text-gray-400">air_12k_20k:</span>
                <span className="text-white">{safeAnalysis.bands.air_12k_20k.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mix notes */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Mix notes:</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-300">
              {safeAnalysis.mix_notes.map((note, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-400 mr-2">-</span>
                  <span className="flex-1">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Targets */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Targets:</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <div className="text-gray-400 mb-1">Club:</div>
                <div className="text-white">
                  {safeAnalysis.targets.club.lufs_i_min}..{safeAnalysis.targets.club.lufs_i_max} LUFS-I, TP ≤ {safeAnalysis.targets.club.tp_max_dbTP} dBTP
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Streaming:</div>
                <div className="text-white">
                  {safeAnalysis.targets.stream.lufs_i_min}..{safeAnalysis.targets.stream.lufs_i_max} LUFS-I, TP ≤ {safeAnalysis.targets.stream.tp_max_dbTP} dBTP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Mastering CTA */}
        <div className="flex justify-end">
          <Button
            onClick={handleStartMastering}
            className="bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black font-mono font-bold px-6 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-green-500/25"
          >
            Start Mastering Session
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
