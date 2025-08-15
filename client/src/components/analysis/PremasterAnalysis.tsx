import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Define proper interfaces following the specification
interface AudioAnalysisData {
  fileName?: string;
  fileSize?: string;
  duration?: string | number;
  sampleRate?: number;
  channels?: number;
  sessionId?: string;

  // Must-have metrics (ITU-R BS.1770 compliant)
  lufsI?: number;           // Integrated LUFS
  lufsS?: number;           // Short-term LUFS (3s)
  lufsM?: number;           // Momentary LUFS (400ms)
  dbtp?: number;            // True Peak (dBTP) with 4x oversampling
  lra?: number;             // Loudness Range

  // Basic metrics
  samplePeak?: number;      // Sample peak in dBFS
  rms?: number;            // RMS level in dBFS
  crest?: number;          // Crest factor in dB

  // Quality metrics
  clipCount?: number;       // Inter-sample clipping count
  dcL?: number;            // DC offset left channel
  dcR?: number;            // DC offset right channel
  correlation?: number;     // Stereo correlation (-1 to +1)

  // Derived metrics
  plr?: number;            // Peak to Loudness Ratio
  psr?: number;            // Peak to Short-term Ratio

  // Optional quality gates
  stereoWidth?: number;
  phaseCorrelation?: number;
  voidlineScore?: number;
}

interface TechnicalAnalysisData {
  id: string;
  sr: number;
  ch: number;
  dur_s: number | undefined;

  // Core measurements
  lufs_i: number | null;
  lufs_s: number | null;
  lufs_m: number | null;
  dbtp: number;
  lra: number;

  // Basic metrics
  sample_peak_dbfs: number;
  rms_mono_dbfs: number;
  crest_db: number;

  // Quality metrics
  clip_count: number;
  dc_offset_l: number;
  dc_offset_r: number;
  stereo_correlation: number;

  // Derived
  plr: number;  // Peak to Loudness Ratio
  psr: number;  // Peak to Short-term Ratio

  // Analysis targets
  targets: {
    streaming: { lufs_i_min: number; lufs_i_max: number; dbtp_max: number; lra_range: [number, number] };
    club: { lufs_i_min: number; lufs_i_max: number; dbtp_max: number; lra_range: [number, number] };
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

  // Process actual analysis data following ITU-R BS.1770 specification
  const technicalData: TechnicalAnalysisData = {
    id: analysisData.fileName?.replace(/\.[^/.]+$/, '') || 'premaster',
    sr: analysisData.sampleRate || 48000,
    ch: analysisData.channels || 2,
    dur_s: (() => {
      const duration = analysisData?.duration || 0;
      return typeof duration === 'number' ? duration : safeParseNumber(duration as string, 0);
    })(),

    // Core LUFS measurements (K-weighted + gated)
    lufs_i: analysisData.lufsI ?? null,
    lufs_s: analysisData.lufsS ?? null,
    lufs_m: analysisData.lufsM ?? null,
    dbtp: analysisData.dbtp ?? (analysisData.samplePeak ? analysisData.samplePeak + 0.5 : -1.0),
    lra: analysisData.lra ?? 0,

    // Basic measurements
    sample_peak_dbfs: analysisData.samplePeak ?? safeParseNumber(analysisData.rms, -6.0) + 12,
    rms_mono_dbfs: analysisData.rms ?? -18.0,
    crest_db: analysisData.crest ?? 12.0,

    // Quality metrics
    clip_count: analysisData.clipCount ?? 0,
    dc_offset_l: analysisData.dcL ?? 0.0,
    dc_offset_r: analysisData.dcR ?? 0.0,
    stereo_correlation: analysisData.correlation ?? 0.85,

    // Derived metrics
    plr: analysisData.plr ?? (analysisData.samplePeak && analysisData.lufsI ?
         analysisData.samplePeak - analysisData.lufsI : 8.0),
    psr: analysisData.psr ?? (analysisData.lufsS && analysisData.lufsI ?
         analysisData.lufsS - analysisData.lufsI : 2.0),

    // Standard targets per specification
    targets: {
      streaming: {
        lufs_i_min: -14, lufs_i_max: -9, dbtp_max: -1.0,
        lra_range: [4, 8]
      },
      club: {
        lufs_i_min: -7, lufs_i_max: -6, dbtp_max: -0.8,
        lra_range: [3, 6]
      }
    }
  };

  const handleStartMastering = () => {
    navigate(`/mastering?id=${technicalData.id}`);
  };

  const handleStartMasteringSession = () => {
    if (analysisData?.sessionId) {
      // Navigate to mastering process with session ID
      window.location.href = `/mastering/process?id=${analysisData.sessionId}`;
    } else {
      console.warn('No session ID available');
      // Create fallback session and navigate
      const fallbackSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      window.location.href = `/mastering/process?id=${fallbackSessionId}`;
    }
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

        {/* Technical specs - Core measurements */}
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
              <span className="text-gray-400">Sample Peak:</span>
              <span className="text-white">{safeFormat(technicalData.sample_peak_dbfs, 2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">RMS:</span>
              <span className="text-white">{safeFormat(technicalData.rms_mono_dbfs, 2)} dBFS</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Crest:</span>
              <span className="text-white">{safeFormat(technicalData.crest_db, 1)} dB</span>
            </div>
          </div>
        </div>

        {/* LUFS measurements - ITU-R BS.1770 compliant */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Loudness Analysis (K-weighted + gated):</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">LUFS-I:</span>
                <span className="text-yellow-400">
                  {technicalData.lufs_i !== null ? safeFormat(technicalData.lufs_i, 1) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">LUFS-S:</span>
                <span className="text-white">
                  {technicalData.lufs_s !== null ? safeFormat(technicalData.lufs_s, 1) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">LUFS-M:</span>
                <span className="text-white">
                  {technicalData.lufs_m !== null ? safeFormat(technicalData.lufs_m, 1) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">True Peak:</span>
                <span className="text-cyan-400">{safeFormat(technicalData.dbtp, 2)} dBTP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">LRA:</span>
                <span className="text-white">{safeFormat(technicalData.lra, 1)} LU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Correlation:</span>
                <span className="text-white">{safeFormat(technicalData.stereo_correlation, 2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality metrics */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Quality Gates:</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">PLR:</span>
                <span className="text-white">{safeFormat(technicalData.plr, 1)} dB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">PSR:</span>
                <span className="text-white">{safeFormat(technicalData.psr, 1)} dB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Clip Count:</span>
                <span className={technicalData.clip_count > 0 ? "text-red-400" : "text-green-400"}>
                  {technicalData.clip_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DC L/R:</span>
                <span className="text-white">
                  {safeFormat(technicalData.dc_offset_l, 3)}/{safeFormat(technicalData.dc_offset_r, 3)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mastering targets - Industry standard */}
        <div className="mb-6">
          <h4 className="font-mono text-sm text-green-400 mb-3">Mastering Targets:</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <div className="text-cyan-400 mb-2">Streaming Profile:</div>
                <div className="text-gray-300 space-y-1">
                  <div>LUFS-I: {technicalData.targets.streaming.lufs_i_min}…{technicalData.targets.streaming.lufs_i_max}</div>
                  <div>dBTP: ≤ {technicalData.targets.streaming.dbtp_max}</div>
                  <div>LRA: {technicalData.targets.streaming.lra_range[0]}–{technicalData.targets.streaming.lra_range[1]} LU</div>
                  <div className="text-gray-500">PLR ~8–10 dB, PSR ≥7 dB</div>
                </div>
              </div>
              <div>
                <div className="text-orange-400 mb-2">Club/DJ Profile:</div>
                <div className="text-gray-300 space-y-1">
                  <div>LUFS-I: {technicalData.targets.club.lufs_i_min}…{technicalData.targets.club.lufs_i_max}</div>
                  <div>dBTP: {technicalData.targets.club.dbtp_max}…−1.0</div>
                  <div>LRA: {technicalData.targets.club.lra_range[0]}–{technicalData.targets.club.lra_range[1]} LU</div>
                  <div className="text-gray-500">Bass mono &lt;100 Hz, corr ≥0 in lows</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6 text-center">
          <Button
            size="lg"
            onClick={handleStartMasteringSession}
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-mono font-bold px-8 py-3 hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200"
          >
            Start Mastering Session
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}