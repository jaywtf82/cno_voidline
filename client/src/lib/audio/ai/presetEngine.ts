/**
 * AI Preset Engine - C/No Voidline Phase 2
 * Generates mastering chain parameters based on analysis features
 */

export interface ChainParams {
  target: 'streaming' | 'club' | 'vinyl';
  transient: {
    attack: number;    // -10 to +10 dB
    sustain: number;   // -10 to +10 dB
  };
  msEncode: {
    enabled: boolean;
  };
  xover: {
    frequencies: number[];  // [lowMid, midHigh] in Hz
    type: 'linear' | 'minimum';
  };
  multiband: {
    bands: Array<{
      threshold: number;  // dB
      ratio: number;      // 1:1 to 10:1
      attack: number;     // ms
      release: number;    // ms
      knee: number;       // dB
      makeup: number;     // dB
    }>;
  };
  eq: {
    pre: Array<{
      type: string;
      freq: number;
      q: number;
      gain: number;
    }>;
    post: Array<{
      type: string;
      freq: number;
      q: number;
      gain: number;
    }>;
  };
  stereoWidth: {
    width: number;      // 0-200%
    monoBelow: number;  // Hz
  };
  limiter: {
    ceiling: number;    // dBTP
    lookahead: number;  // ms
    release: number;    // ms
    style: 'transparent' | 'punchy' | 'warm';
  };
  dither: {
    enabled: boolean;
    noise: 'tpdf' | 'rpdf';
    shaping: boolean;
  };
}

export interface AnalysisFeatures {
  lufsI?: number;       // Integrated loudness
  lufsS?: number;       // Short-term loudness
  lufsM?: number;       // Momentary loudness
  lra?: number;         // Loudness range
  dbtp?: number;        // True peak
  psr?: number;         // Peak to short-term ratio
  plr?: number;         // Peak to loudness ratio
  corr?: number;        // Stereo correlation
  crest?: number;       // Crest factor
  bassEnergy?: number;  // Low frequency energy
  midEnergy?: number;   // Mid frequency energy
  highEnergy?: number;  // High frequency energy
  dynamicRange?: number;
  flags?: string[];     // ['harsh', 'muddy', 'compressed', etc.]
}

/**
 * Generate mastering chain parameters based on target and analysis
 */
export function generatePreset(
  target: 'streaming' | 'club' | 'vinyl',
  features: AnalysisFeatures
): ChainParams {
  console.log(`Generating ${target} preset for features:`, features);

  // Base parameters for each target
  const baseParams = getBaseParameters(target);
  
  // Analyze audio characteristics
  const characteristics = analyzeCharacteristics(features);
  
  // Apply AI-driven adjustments
  const adjustedParams = applyIntelligentAdjustments(baseParams, characteristics, features);
  
  // Validate and clamp parameters
  return validateParameters(adjustedParams);
}

function getBaseParameters(target: 'streaming' | 'club' | 'vinyl'): ChainParams {
  const bases = {
    streaming: {
      target: 'streaming' as const,
      transient: { attack: 0, sustain: 0 },
      msEncode: { enabled: false },
      xover: { frequencies: [250, 2500], type: 'linear' as const },
      multiband: {
        bands: [
          { threshold: -20, ratio: 2.5, attack: 10, release: 100, knee: 2, makeup: 0 },
          { threshold: -18, ratio: 2.0, attack: 5, release: 50, knee: 2, makeup: 0 },
          { threshold: -16, ratio: 1.8, attack: 3, release: 30, knee: 1, makeup: 0 }
        ]
      },
      eq: { pre: [], post: [] },
      stereoWidth: { width: 100, monoBelow: 120 },
      limiter: { ceiling: -1.0, lookahead: 5, release: 50, style: 'transparent' as const },
      dither: { enabled: false, noise: 'tpdf' as const, shaping: false }
    },
    
    club: {
      target: 'club' as const,
      transient: { attack: 1.5, sustain: -0.5 },
      msEncode: { enabled: false },
      xover: { frequencies: [200, 3000], type: 'minimum' as const },
      multiband: {
        bands: [
          { threshold: -16, ratio: 3.0, attack: 8, release: 80, knee: 2, makeup: 1 },
          { threshold: -14, ratio: 2.5, attack: 4, release: 40, knee: 2, makeup: 0.5 },
          { threshold: -12, ratio: 2.2, attack: 2, release: 25, knee: 1, makeup: 0 }
        ]
      },
      eq: { 
        pre: [
          { type: 'highshelf', freq: 8000, q: 0.7, gain: 1.5 }
        ], 
        post: [] 
      },
      stereoWidth: { width: 105, monoBelow: 100 },
      limiter: { ceiling: -0.9, lookahead: 3, release: 30, style: 'punchy' as const },
      dither: { enabled: false, noise: 'tpdf' as const, shaping: false }
    },
    
    vinyl: {
      target: 'vinyl' as const,
      transient: { attack: -0.5, sustain: 1.0 },
      msEncode: { enabled: true },
      xover: { frequencies: [300, 2000], type: 'linear' as const },
      multiband: {
        bands: [
          { threshold: -24, ratio: 1.8, attack: 15, release: 150, knee: 3, makeup: 0 },
          { threshold: -22, ratio: 1.5, attack: 8, release: 80, knee: 3, makeup: 0 },
          { threshold: -20, ratio: 1.3, attack: 5, release: 50, knee: 2, makeup: 0 }
        ]
      },
      eq: { 
        pre: [
          { type: 'highpass', freq: 30, q: 0.7, gain: 0 },
          { type: 'lowshelf', freq: 100, q: 0.8, gain: -1 }
        ], 
        post: [] 
      },
      stereoWidth: { width: 95, monoBelow: 150 },
      limiter: { ceiling: -2.0, lookahead: 8, release: 80, style: 'warm' as const },
      dither: { enabled: true, noise: 'tpdf' as const, shaping: true }
    }
  };

  return bases[target];
}

interface AudioCharacteristics {
  isOverCompressed: boolean;
  isUnderCompressed: boolean;
  hasExcessiveBass: boolean;
  lacksHighEnd: boolean;
  isHarsh: boolean;
  isMuddy: boolean;
  isNarrow: boolean;
  isWide: boolean;
  needsDynamicControl: boolean;
  needsTransientShaping: boolean;
}

function analyzeCharacteristics(features: AnalysisFeatures): AudioCharacteristics {
  const lufsI = features.lufsI || -20;
  const lra = features.lra || 10;
  const psr = features.psr || 10;
  const crest = features.crest || 12;
  const corr = features.corr || 0.8;
  
  return {
    isOverCompressed: lra < 3 || crest < 8,
    isUnderCompressed: lra > 15 || crest > 20,
    hasExcessiveBass: (features.bassEnergy || 0) > (features.midEnergy || 0) + 6,
    lacksHighEnd: (features.highEnergy || 0) < (features.midEnergy || 0) - 6,
    isHarsh: features.flags?.includes('harsh') || false,
    isMuddy: features.flags?.includes('muddy') || false,
    isNarrow: corr > 0.95,
    isWide: corr < 0.3,
    needsDynamicControl: psr > 15 || lufsI > -8,
    needsTransientShaping: features.flags?.includes('soft') || features.flags?.includes('dull') || false
  };
}

function applyIntelligentAdjustments(
  base: ChainParams,
  characteristics: AudioCharacteristics,
  features: AnalysisFeatures
): ChainParams {
  const adjusted = JSON.parse(JSON.stringify(base)) as ChainParams;

  // Transient adjustments
  if (characteristics.needsTransientShaping) {
    adjusted.transient.attack += characteristics.isOverCompressed ? -2 : 2;
    adjusted.transient.sustain += characteristics.isOverCompressed ? 1 : -1;
  }

  // Crossover adjustments
  if (characteristics.hasExcessiveBass) {
    adjusted.xover.frequencies[0] = Math.min(adjusted.xover.frequencies[0] + 50, 400);
  }
  if (characteristics.isMuddy) {
    adjusted.xover.frequencies[0] = Math.min(adjusted.xover.frequencies[0] + 30, 350);
    adjusted.xover.frequencies[1] = Math.max(adjusted.xover.frequencies[1] - 200, 2000);
  }

  // Multiband compression adjustments
  if (characteristics.isUnderCompressed) {
    adjusted.multiband.bands.forEach(band => {
      band.threshold += 2;
      band.ratio = Math.min(band.ratio + 0.5, 6);
    });
  } else if (characteristics.isOverCompressed) {
    adjusted.multiband.bands.forEach(band => {
      band.threshold -= 3;
      band.ratio = Math.max(band.ratio - 0.3, 1.2);
      band.attack += 2;
      band.release += 20;
    });
  }

  // EQ adjustments
  if (characteristics.lacksHighEnd && !adjusted.eq.pre.find(eq => eq.type === 'highshelf')) {
    adjusted.eq.pre.push({
      type: 'highshelf',
      freq: 8000,
      q: 0.7,
      gain: 2
    });
  }

  if (characteristics.hasExcessiveBass && !adjusted.eq.pre.find(eq => eq.type === 'highpass')) {
    adjusted.eq.pre.push({
      type: 'highpass',
      freq: 40,
      q: 0.7,
      gain: 0
    });
  }

  if (characteristics.isMuddy) {
    adjusted.eq.pre.push({
      type: 'bell',
      freq: 300,
      q: 1.5,
      gain: -2
    });
  }

  if (characteristics.isHarsh) {
    adjusted.eq.pre.push({
      type: 'bell',
      freq: 3000,
      q: 2.0,
      gain: -1.5
    });
  }

  // Stereo width adjustments
  if (characteristics.isNarrow) {
    adjusted.stereoWidth.width = Math.min(adjusted.stereoWidth.width + 15, 150);
  } else if (characteristics.isWide) {
    adjusted.stereoWidth.width = Math.max(adjusted.stereoWidth.width - 10, 80);
    adjusted.stereoWidth.monoBelow = Math.min(adjusted.stereoWidth.monoBelow + 30, 200);
  }

  // Limiter adjustments based on target loudness
  const currentLufs = features.lufsI || -20;
  const targetLufs = getTargetLufs(adjusted.target);
  const loudnessGap = targetLufs - currentLufs;

  if (Math.abs(loudnessGap) > 2) {
    // Adjust limiter for significant loudness changes
    if (loudnessGap > 0) {
      // Need to push louder
      adjusted.limiter.release = Math.max(adjusted.limiter.release - 10, 20);
    } else {
      // Too loud, be more conservative
      adjusted.limiter.release = Math.min(adjusted.limiter.release + 20, 100);
      adjusted.limiter.ceiling = Math.min(adjusted.limiter.ceiling - 0.2, -0.5);
    }
  }

  return adjusted;
}

function getTargetLufs(target: string): number {
  const targets = {
    streaming: -14,
    club: -6.5,
    vinyl: -14
  };
  return targets[target as keyof typeof targets] || -14;
}

function validateParameters(params: ChainParams): ChainParams {
  const validated = { ...params };

  // Clamp transient values
  validated.transient.attack = Math.max(-10, Math.min(10, validated.transient.attack));
  validated.transient.sustain = Math.max(-10, Math.min(10, validated.transient.sustain));

  // Validate crossover frequencies
  validated.xover.frequencies[0] = Math.max(80, Math.min(800, validated.xover.frequencies[0]));
  validated.xover.frequencies[1] = Math.max(1000, Math.min(8000, validated.xover.frequencies[1]));

  // Ensure crossover frequencies are in order
  if (validated.xover.frequencies[0] >= validated.xover.frequencies[1]) {
    validated.xover.frequencies[1] = validated.xover.frequencies[0] + 500;
  }

  // Validate multiband parameters
  validated.multiband.bands.forEach(band => {
    band.threshold = Math.max(-40, Math.min(0, band.threshold));
    band.ratio = Math.max(1, Math.min(10, band.ratio));
    band.attack = Math.max(0.1, Math.min(100, band.attack));
    band.release = Math.max(10, Math.min(500, band.release));
    band.knee = Math.max(0, Math.min(5, band.knee));
    band.makeup = Math.max(-6, Math.min(6, band.makeup));
  });

  // Validate stereo parameters
  validated.stereoWidth.width = Math.max(0, Math.min(200, validated.stereoWidth.width));
  validated.stereoWidth.monoBelow = Math.max(60, Math.min(300, validated.stereoWidth.monoBelow));

  // Validate limiter parameters
  validated.limiter.ceiling = Math.max(-3, Math.min(0, validated.limiter.ceiling));
  validated.limiter.lookahead = Math.max(1, Math.min(10, validated.limiter.lookahead));
  validated.limiter.release = Math.max(10, Math.min(200, validated.limiter.release));

  return validated;
}

/**
 * Apply preset to audio chain (placeholder for actual implementation)
 */
export function applyPreset(params: ChainParams): void {
  console.log('Applying preset:', params);
  // This would interface with the actual audio processing worklets
  // For now, just log the parameters
}