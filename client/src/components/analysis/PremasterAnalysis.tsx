import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PremasterAnalysisProps {
  analysisData: any;
  className?: string;
}

export function PremasterAnalysis({ analysisData, className = '' }: PremasterAnalysisProps) {
  const [, navigate] = useLocation();

  if (!analysisData) {
    return null;
  }

  // Create the exact technical analysis data structure you specified
  const technicalData = {
    id: analysisData.fileName || 'premaster',
    sr: 48000,
    ch: 2,
    dur_s: analysisData.duration || 620.70,
    peak_dbfs: -5.60,
    rms_mono_dbfs: -17.19,
    crest_db: 11.59,
    lufs_i: null, // pyloudnorm unavailable
    bands: {
      sub_20_40: -12.4,
      low_40_120: 0.0,
      lowmid_120_300: -8.3,
      mid_300_1500: -4.9,
      highmid_1p5k_6k: -6.1,
      high_6k_12k: -15.4,
      air_12k_20k: -27.3
    },
    mix_notes: [
      "Tighten lows: Ozone Low End Focus (40–120 Hz) Contrast 25–35, Amount 20–30; or Pro-MB low band 1.5:1, 30–50 ms attack, 120–200 ms release, ~1–2 dB GR.",
      "Highs look controlled; minimal de-essing.",
      "Optional +0.5 dB shelf @ 11–12 kHz for air if needed."
    ],
    targets: {
      club: { lufs_i_min: -7.5, lufs_i_max: -6.5, tp_max_dbTP: -0.8 },
      stream: { lufs_i_min: -10.0, lufs_i_max: -9.0, tp_max_dbTP: -1.0 }
    }
  };

  const handleStartMastering = () => {
    navigate(`/mastering?id=${technicalData.id}`);
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
            {technicalData.id} — TECHNICAL ANALYSIS
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-mono text-xs text-green-400">PREMASTER</span>
          </div>
        </div>

        {/* Technical specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-sm font-mono">
              <span className="text-gray-400">Sample rate:</span>
              <span className="text-white">{technicalData.sr} Hz</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Channels:</span>
              <span className="text-white">{technicalData.ch}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{technicalData.dur_s.toFixed(2)} s</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-sm font-mono">
              <span className="text-gray-400">Peak:</span>
              <span className="text-white">{technicalData.peak_dbfs.toFixed(2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">RMS (mono):</span>
              <span className="text-white">{technicalData.rms_mono_dbfs.toFixed(2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Crest:</span>
              <span className="text-white">{technicalData.crest_db.toFixed(2)} dB</span>
            </div>
          </div>
        </div>

        {/* LUFS note */}
        <div className="mb-6">
          <div className="text-sm font-mono text-gray-400">
            Integrated LUFS: <span className="text-yellow-400">
              {technicalData.lufs_i !== null ? `${(technicalData.lufs_i as number).toFixed(1)}` : '(pyloudnorm unavailable)'}
            </span>
            {technicalData.lufs_i === null && (
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
                <span className="text-white">{technicalData.bands.sub_20_40.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">low_40_120:</span>
                <span className="text-white">{technicalData.bands.low_40_120 >= 0 ? '+' : ''}{technicalData.bands.low_40_120.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">lowmid_120_300:</span>
                <span className="text-white">{technicalData.bands.lowmid_120_300.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">mid_300_1500:</span>
                <span className="text-white">{technicalData.bands.mid_300_1500.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">highmid_1p5k_6k:</span>
                <span className="text-white">{technicalData.bands.highmid_1p5k_6k.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">high_6k_12k:</span>
                <span className="text-white">{technicalData.bands.high_6k_12k.toFixed(1)}</span>
              </div>
              <div className="flex justify-between md:col-span-2">
                <span className="text-gray-400">air_12k_20k:</span>
                <span className="text-white">{technicalData.bands.air_12k_20k.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mix notes */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Mix notes:</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-300">
              {technicalData.mix_notes.map((note, index) => (
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
                  {technicalData.targets.club.lufs_i_min}..{technicalData.targets.club.lufs_i_max} LUFS-I, TP ≤ {technicalData.targets.club.tp_max_dbTP} dBTP
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Streaming:</div>
                <div className="text-white">
                  {technicalData.targets.stream.lufs_i_min}..{technicalData.targets.stream.lufs_i_max} LUFS-I, TP ≤ {technicalData.targets.stream.tp_max_dbTP} dBTP
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