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

// Utility to format duration from seconds to H:MM:SS or M:SS
const formatDuration = (durationInSeconds: string | number | undefined): string => {
  const seconds = safeParseNumber(durationInSeconds, 0);
  if (seconds === 0) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const paddedS = s < 10 ? `0${s}` : `${s}`;

  if (h > 0) {
    const paddedM = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${paddedM}:${paddedS}`;
  } else {
    return `${m}:${paddedS}`;
  }
};

// Placeholder functions for status checks (replace with actual logic if needed)
const getStreamingReadyStatus = (lufsI?: number, dbtp?: number) => {
  // Example logic: check if LUFS is within range and peak is below threshold
  const isLoudnessOk = lufsI !== undefined && lufsI >= -14 && lufsI <= -9;
  const isPeakOk = dbtp !== undefined && dbtp <= -1.0;

  if (isLoudnessOk && isPeakOk) {
    return { text: 'PASS', color: 'text-green-400' };
  } else if (!isLoudnessOk && !isPeakOk) {
    return { text: 'FAIL', color: 'text-red-400' };
  } else {
    return { text: 'WARNING', color: 'text-yellow-400' };
  }
};

const getCorrelationStatus = (correlation?: number) => {
  if (correlation === undefined) return { color: 'text-gray-500' };
  if (correlation >= 0.85) return { color: 'text-green-400' };
  if (correlation >= 0.5) return { color: 'text-yellow-400' };
  return { color: 'text-red-400' };
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
      // Navigate to mastering process with session ID using proper routing
      navigate(`/mastering/process?id=${analysisData.sessionId}`);
    } else {
      console.warn('No session ID available');
      // Create fallback session and navigate
      const fallbackSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      navigate(`/mastering/process?id=${fallbackSessionId}`);
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

        {/* Technical Analysis Section */}
        <div className="space-y-6 mb-6">
          <h4 className="font-mono text-sm font-bold text-green-400 border-b border-green-500/30 pb-2">
            TECHNICAL ANALYSIS
          </h4>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-3 gap-4 bg-black/30 p-4 rounded-lg border border-gray-700/50">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Sample Rate</div>
              <div className="text-sm font-bold text-white font-mono">{safeFormat(analysisData.sampleRate, 0)} Hz</div>
            </div>
            <div className="text-center border-l border-r border-gray-600/50">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Channels</div>
              <div className="text-sm font-bold text-white font-mono">{safeFormat(analysisData.channels, 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Duration</div>
              <div className="text-sm font-bold text-white font-mono">{formatDuration(analysisData.duration)}</div>
            </div>
          </div>

          {/* Amplitude Analysis Grid */}
          <div className="grid grid-cols-3 gap-4 bg-black/30 p-4 rounded-lg border border-gray-700/50">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Sample Peak</div>
              <div className="text-sm font-bold text-white font-mono">{safeFormat(analysisData.samplePeak, 2)} dBFS</div>
            </div>
            <div className="text-center border-l border-r border-gray-600/50">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">RMS</div>
              <div className="text-sm font-bold text-white font-mono">{safeFormat(analysisData.rms, 2)} dBFS</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Crest</div>
              <div className="text-sm font-bold text-white font-mono">{safeFormat(analysisData.crest, 1)} dB</div>
            </div>
          </div>
        </div>

        {/* Loudness Analysis Section */}
        <div className="space-y-6 mb-6">
          <h4 className="font-mono text-sm font-bold text-green-400 border-b border-green-500/30 pb-2">
            LOUDNESS ANALYSIS (K-weighted + gated)
          </h4>
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700/50">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Integrated LUFS</div>
                <div className="text-sm font-bold text-cyan-400 font-mono bg-gray-900/60 py-2 px-3 rounded border border-cyan-500/30">
                  {safeFormat(analysisData.lufsI, 1)}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">ITU-R BS.1770</div>
              </div>
              <div className="text-center border-l border-r border-gray-600/50">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">True Peak</div>
                <div className="text-sm font-bold text-yellow-400 font-mono bg-gray-900/60 py-2 px-3 rounded border border-yellow-500/30">
                  {safeFormat(analysisData.dbtp, 1)}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">dBTP (4x OS)</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Loudness Range</div>
                <div className="text-sm font-bold text-orange-400 font-mono bg-gray-900/60 py-2 px-3 rounded border border-orange-500/30">
                  {safeFormat(analysisData.lra, 1)}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">LU</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Gates Section */}
        <div className="space-y-6 mb-6">
          <h4 className="font-mono text-sm font-bold text-green-400 border-b border-green-500/30 pb-2">
            QUALITY GATES
          </h4>
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-900/40 rounded border border-gray-700/30">
                <span className="text-gray-300 font-medium text-sm">Streaming Ready</span>
                <span className={`font-bold px-2 py-1 rounded text-xs ${getStreamingReadyStatus(analysisData.lufsI, analysisData.dbtp).color} bg-black/50 border border-current/20`}>
                  {getStreamingReadyStatus(analysisData.lufsI, analysisData.dbtp).text}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-900/40 rounded border border-gray-700/30">
                <span className="text-gray-300 font-medium text-sm">Phase Correlation</span>
                <span className={`font-bold px-2 py-1 rounded text-xs font-mono ${getCorrelationStatus(analysisData.correlation).color} bg-black/50 border border-current/20`}>
                  {safeFormat(analysisData.correlation, 2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-900/40 rounded border border-gray-700/30">
                <span className="text-gray-300 font-medium text-sm">Dynamic Range</span>
                <span className="text-blue-400 font-bold px-2 py-1 rounded text-xs font-mono bg-black/50 border border-blue-400/20">
                  {safeFormat((analysisData.crest || 0), 1)} dB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mastering Targets Section */}
        <div className="space-y-6 mb-6">
          <h4 className="font-mono text-sm font-bold text-green-400 border-b border-green-500/30 pb-2">
            MASTERING TARGETS
          </h4>
          <div className="bg-black/40 p-6 rounded-lg border border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Streaming Profile</div>
                  <div className="bg-gray-900/60 p-4 rounded-lg border border-cyan-500/30">
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">LUFS-I:</span>
                        <span className="text-cyan-400 font-bold">-14 to -9</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">dBTP:</span>
                        <span className="text-cyan-400 font-bold">≤ -1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">LRA:</span>
                        <span className="text-cyan-400 font-bold">4–8 LU</span>
                      </div>
                      <div className="pt-2 border-t border-gray-600/50">
                        <div className="text-xs text-gray-500 text-center">PLR ~8–10 dB, PSR ≥7 dB</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Club/DJ Profile</div>
                  <div className="bg-gray-900/60 p-4 rounded-lg border border-orange-500/30">
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">LUFS-I:</span>
                        <span className="text-orange-400 font-bold">-7 to -6</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">dBTP:</span>
                        <span className="text-orange-400 font-bold">-0.8 to -1.0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">LRA:</span>
                        <span className="text-orange-400 font-bold">3–6 LU</span>
                      </div>
                      <div className="pt-2 border-t border-gray-600/50">
                        <div className="text-xs text-gray-500 text-center">Bass mono &lt;100 Hz, corr ≥0 in lows</div>
                      </div>
                    </div>
                  </div>
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