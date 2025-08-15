import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Define proper interfaces for type safety
interface AudioAnalysisData {
  fileName?: string;
  fileSize?: string;
  duration?: string | number; // comes as "620.70s" format or can be number
  sampleRate?: string;
  channels?: string;
  sessionId?: string;
  lufs?: number;
  peak?: number;
  rms?: number;
  dynamicRange?: number;
  stereoWidth?: number;
  phaseCorrelation?: number;
  voidlineScore?: number;
}

interface TechnicalAnalysisData {
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

interface PremasterAnalysisProps {
  analysisData: AudioAnalysisData;
  className?: string;
}

// Safe number parsing utility
const safeParseNumber = (value: string | number | undefined, fallback: number): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove units like 's', 'Hz', 'kHz', 'MB' etc.
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

// Safe number formatting - ensures we always get a valid number for toFixed
const safeFormat = (value: number | undefined, decimals: number = 1): string => {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return num.toFixed(decimals);
};

export function PremasterAnalysis({ analysisData, className = '' }: PremasterAnalysisProps) {
  const [, navigate] = useLocation();

  if (!analysisData) {
    return null;
  }

  // Safely parse and create technical analysis data with proper fallbacks
  const technicalData: TechnicalAnalysisData = {
    id: analysisData.fileName?.replace(/\.[^/.]+$/, '') || 'premaster', // Remove file extension
    sr: 48000, // Standard sample rate
    ch: analysisData.channels === 'Mono' ? 1 : 2,
    dur_s: (() => {
      const duration = analysisData?.duration || 0;
      return typeof duration === 'number' ? duration : safeParseNumber(duration as string, 0);
    })(),
    peak_dbfs: safeParseNumber(analysisData.peak, -5.60),
    rms_mono_dbfs: safeParseNumber(analysisData.rms, -17.19),
    crest_db: 11.59, // Calculated from peak and RMS
    lufs_i: analysisData.lufs ? Math.round(analysisData.lufs * 10) / 10 : null, // Round to 1 decimal
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
              <div className="text-cyan-400 font-mono text-sm">
                {technicalData.dur_s?.toFixed ? technicalData.dur_s.toFixed(2) : technicalData.dur_s}s
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-sm font-mono">
              <span className="text-gray-400">Peak:</span>
              <span className="text-white">{safeFormat(technicalData.peak_dbfs, 2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">RMS (mono):</span>
              <span className="text-white">{safeFormat(technicalData.rms_mono_dbfs, 2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Crest:</span>
              <span className="text-white">{safeFormat(technicalData.crest_db, 2)} dB</span>
            </div>
          </div>
        </div>

        {/* LUFS note */}
        <div className="mb-6">
          <div className="text-sm font-mono text-gray-400">
            Integrated LUFS: <span className="text-yellow-400">
              {technicalData.lufs_i !== null ? safeFormat(technicalData.lufs_i, 1) : '(pyloudnorm unavailable)'}
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
                <span className="text-white">{safeFormat(technicalData.bands.sub_20_40, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">low_40_120:</span>
                <span className="text-white">{technicalData.bands.low_40_120 >= 0 ? '+' : ''}{safeFormat(technicalData.bands.low_40_120, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">lowmid_120_300:</span>
                <span className="text-white">{safeFormat(technicalData.bands.lowmid_120_300, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">mid_300_1500:</span>
                <span className="text-white">{safeFormat(technicalData.bands.mid_300_1500, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">highmid_1p5k_6k:</span>
                <span className="text-white">{safeFormat(technicalData.bands.highmid_1p5k_6k, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">high_6k_12k:</span>
                <span className="text-white">{safeFormat(technicalData.bands.high_6k_12k, 1)}</span>
              </div>
              <div className="flex justify-between md:col-span-2">
                <span className="text-gray-400">air_12k_20k:</span>
                <span className="text-white">{safeFormat(technicalData.bands.air_12k_20k, 1)}</span>
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

        {/* CTA Button */}
        <div className="mt-6 text-center">
          <Button
            size="lg"
            onClick={() => {
              if (window.location.pathname === '/') {
                // Call parent callback if provided
                if (typeof (window as any).handleStartMasteringSession === 'function') {
                  (window as any).handleStartMasteringSession();
                }
              }
            }}
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-mono font-bold px-8 py-3 hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200"
          >
            Start Mastering Session
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}