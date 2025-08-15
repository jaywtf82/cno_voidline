/**
 * Preset Profiles for C/No Voidline
 * Defines target corridors and characteristics for different mastering applications
 */

export interface TargetCorridor {
  name: string;
  lufsRange: [number, number];    // [min, max] LUFS-I
  truePeakMax: number;            // dBTP ceiling
  lraRange: [number, number];     // [min, max] LRA in LU
  characteristics: {
    dynamicRange: 'compressed' | 'moderate' | 'wide';
    stereoWidth: 'narrow' | 'normal' | 'wide';
    tonalBalance: 'warm' | 'neutral' | 'bright';
    transientResponse: 'smooth' | 'punchy' | 'aggressive';
  };
  description: string;
}

export const TARGET_CORRIDORS: Record<string, TargetCorridor> = {
  streaming: {
    name: 'Streaming Platforms',
    lufsRange: [-16, -8],
    truePeakMax: -1.0,
    lraRange: [3, 12],
    characteristics: {
      dynamicRange: 'moderate',
      stereoWidth: 'normal',
      tonalBalance: 'neutral',
      transientResponse: 'punchy'
    },
    description: 'Optimized for Spotify, Apple Music, YouTube, etc. Balances loudness with dynamics.'
  },

  club: {
    name: 'Club/DJ Systems',
    lufsRange: [-8, -5],
    truePeakMax: -0.9,
    lraRange: [2, 8],
    characteristics: {
      dynamicRange: 'compressed',
      stereoWidth: 'normal',
      tonalBalance: 'bright',
      transientResponse: 'aggressive'
    },
    description: 'High-energy masters for club systems. Maximum impact and presence.'
  },

  vinyl: {
    name: 'Vinyl Pressing',
    lufsRange: [-18, -12],
    truePeakMax: -2.0,
    lraRange: [6, 20],
    characteristics: {
      dynamicRange: 'wide',
      stereoWidth: 'narrow',
      tonalBalance: 'warm',
      transientResponse: 'smooth'
    },
    description: 'Optimized for vinyl pressing constraints. Wide dynamics, controlled low-end.'
  },

  broadcast: {
    name: 'Radio Broadcast',
    lufsRange: [-24, -20],
    truePeakMax: -1.0,
    lraRange: [2, 6],
    characteristics: {
      dynamicRange: 'compressed',
      stereoWidth: 'normal',
      tonalBalance: 'bright',
      transientResponse: 'punchy'
    },
    description: 'Broadcast-ready with consistent levels and presence.'
  },

  cinema: {
    name: 'Cinema/Film',
    lufsRange: [-31, -24],
    truePeakMax: -3.0,
    lraRange: [10, 25],
    characteristics: {
      dynamicRange: 'wide',
      stereoWidth: 'wide',
      tonalBalance: 'neutral',
      transientResponse: 'smooth'
    },
    description: 'Wide dynamics for immersive cinema experience.'
  }
};

export interface ProcessingProfile {
  crossover: {
    frequencies: number[];
    type: 'linear' | 'minimum';
    slopes: number[];  // dB/octave
  };
  compression: {
    style: 'transparent' | 'colorful' | 'vintage';
    multiband: boolean;
    lookahead: boolean;
  };
  eq: {
    style: 'surgical' | 'musical' | 'vintage';
    bands: Array<{
      type: string;
      freq: number;
      q: number;
      gain: number;
    }>;
  };
  stereo: {
    processing: 'none' | 'widening' | 'focusing';
    msDecoding: boolean;
    bassMonoFreq: number;
  };
  limiting: {
    style: 'transparent' | 'punchy' | 'warm';
    lookahead: number;
    oversampling: 4 | 8;
  };
}

export const PROCESSING_PROFILES: Record<string, ProcessingProfile> = {
  transparent: {
    crossover: {
      frequencies: [250, 2500],
      type: 'linear',
      slopes: [24, 24]
    },
    compression: {
      style: 'transparent',
      multiband: true,
      lookahead: true
    },
    eq: {
      style: 'surgical',
      bands: []
    },
    stereo: {
      processing: 'none',
      msDecoding: false,
      bassMonoFreq: 120
    },
    limiting: {
      style: 'transparent',
      lookahead: 5,
      oversampling: 4
    }
  },

  punchy: {
    crossover: {
      frequencies: [200, 3000],
      type: 'minimum',
      slopes: [18, 18]
    },
    compression: {
      style: 'colorful',
      multiband: true,
      lookahead: false
    },
    eq: {
      style: 'musical',
      bands: [
        { type: 'highshelf', freq: 8000, q: 0.7, gain: 1.5 }
      ]
    },
    stereo: {
      processing: 'widening',
      msDecoding: false,
      bassMonoFreq: 100
    },
    limiting: {
      style: 'punchy',
      lookahead: 3,
      oversampling: 4
    }
  },

  warm: {
    crossover: {
      frequencies: [300, 2000],
      type: 'linear',
      slopes: [12, 12]
    },
    compression: {
      style: 'vintage',
      multiband: true,
      lookahead: true
    },
    eq: {
      style: 'vintage',
      bands: [
        { type: 'lowshelf', freq: 100, q: 0.8, gain: -1 },
        { type: 'bell', freq: 3000, q: 0.5, gain: 0.5 }
      ]
    },
    stereo: {
      processing: 'focusing',
      msDecoding: true,
      bassMonoFreq: 150
    },
    limiting: {
      style: 'warm',
      lookahead: 8,
      oversampling: 8
    }
  }
};

/**
 * Get the optimal processing profile for a target corridor
 */
export function getOptimalProfile(
  target: string,
  characteristics?: Partial<TargetCorridor['characteristics']>
): ProcessingProfile {
  const corridor = TARGET_CORRIDORS[target];
  if (!corridor) {
    return PROCESSING_PROFILES.transparent;
  }

  // Select profile based on target characteristics
  if (characteristics?.transientResponse === 'aggressive' || target === 'club') {
    return PROCESSING_PROFILES.punchy;
  } else if (characteristics?.tonalBalance === 'warm' || target === 'vinyl') {
    return PROCESSING_PROFILES.warm;
  } else {
    return PROCESSING_PROFILES.transparent;
  }
}

/**
 * Validate that parameters meet target corridor requirements
 */
export function validateAgainstCorridor(
  target: string,
  lufsI: number,
  truePeak: number,
  lra: number
): { valid: boolean; issues: string[] } {
  const corridor = TARGET_CORRIDORS[target];
  if (!corridor) {
    return { valid: false, issues: ['Unknown target corridor'] };
  }

  const issues: string[] = [];

  if (lufsI < corridor.lufsRange[0] || lufsI > corridor.lufsRange[1]) {
    issues.push(`LUFS-I ${lufsI.toFixed(1)} outside target range ${corridor.lufsRange[0]} to ${corridor.lufsRange[1]}`);
  }

  if (truePeak > corridor.truePeakMax) {
    issues.push(`True peak ${truePeak.toFixed(1)}dBTP exceeds limit of ${corridor.truePeakMax}dBTP`);
  }

  if (lra < corridor.lraRange[0] || lra > corridor.lraRange[1]) {
    issues.push(`LRA ${lra.toFixed(1)}LU outside target range ${corridor.lraRange[0]} to ${corridor.lraRange[1]}LU`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}