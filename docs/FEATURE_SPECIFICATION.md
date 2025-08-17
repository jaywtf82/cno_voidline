
# C/No Voidline - Feature Specification

> **Updated 2025** – Complete feature specification for the AI Audio Mastering Console with real-time processing capabilities.

## Project Overview

**C/No Voidline** is a production-grade AI-powered audio mastering console that provides professional-quality audio processing through an intuitive web interface. The application combines advanced signal processing with machine learning to deliver studio-quality results.

---

## Core Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Audio Engine**: Web Audio API + Custom AudioWorklets
- **AI Processing**: TensorFlow.js + Custom neural networks
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSockets for live updates

### Audio Processing Pipeline
```
Audio Input → Analysis Engine → AI Processing → Mastering Chain → Export
     ↓              ↓             ↓            ↓         ↓
  Validation → Spectral Analysis → Neural Net → DSP → Render
```

---

## Feature Categories

### 1. Audio Analysis Engine

#### Professional Metrics
- **LUFS (Loudness Units)**: ITU-R BS.1770-4 compliant
  - Integrated LUFS (full track analysis)
  - Short-term LUFS (3-second window)
  - Momentary LUFS (400ms window)
- **True Peak Detection**: 4x oversampled intersample peak detection
- **LRA (Loudness Range)**: EBU R128 compliance with relative gating
- **Dynamic Range**: Peak-to-RMS ratio analysis
- **Stereo Analysis**: Phase correlation, stereo width, M/S balance

#### Advanced Analysis
```typescript
interface AudioAnalysis {
  // Loudness Metrics
  lufs: {
    integrated: number;      // -70.0 to 0.0 LUFS
    shortTerm: number[];     // 3-second windows
    momentary: number[];     // 400ms windows
  };
  
  // Peak Analysis
  peaks: {
    truePeak: number;        // dBTP with oversampling
    samplePeak: number;      // Raw sample peaks
    clipCount: number;       // Consecutive sample clipping
  };
  
  // Dynamic Properties
  dynamics: {
    lra: number;            // Loudness Range (LU)
    crestFactor: number;    // Peak-to-RMS ratio
    rmsEnergy: number;      // RMS level in dB
  };
  
  // Spectral Analysis
  spectrum: {
    frequencies: number[];   // Frequency bins (Hz)
    magnitudes: number[];    // Magnitude response (dB)
    phase: number[];         // Phase response (radians)
  };
  
  // Quality Assessment
  quality: {
    voidlineScore: number;   // 0-100 mastering quality score
    recommendations: string[];
    issues: AudioIssue[];
  };
}
```

### 2. AI Mastering Core

#### Two-Phase Processing

**Phase 1: Deep Signal Deconstruction**
- Real-time audio buffer analysis
- Feature extraction for AI processing
- Spectral decomposition
- Dynamic characteristic profiling
- Quality validation and feedback

**Phase 2: Intelligent Reconstruction**
- AI-driven parameter generation
- Neural network preset creation
- Real-time processing feedback
- A/B comparison system
- Final quality assurance

#### AI Model Specifications
```typescript
interface AIModel {
  architecture: 'conv1d-lstm-dense';
  inputShape: [number, number];    // [timeSteps, features]
  outputShape: [number];           // [parameters]
  
  training: {
    dataset: 'professional-masters';
    samples: 50000;
    epochs: 200;
    batchSize: 32;
    validation: 0.2;
  };
  
  performance: {
    accuracy: 0.94;
    latency: '< 100ms';
    modelSize: '15MB';
  };
}
```

### 3. Mastering Chain Components

#### EQ Module
- **Bands**: 5-band parametric EQ
- **Filters**: High-pass, low-pass, bell, shelf
- **Range**: 20Hz - 20kHz
- **Q Factor**: 0.1 - 10.0
- **Gain**: ±24dB

#### Dynamics Processing
- **Compressor**: VCA-style with program-dependent release
- **Limiter**: Lookahead brick-wall limiting
- **Gate**: Noise gate with hysteresis
- **Expander**: Downward expansion for dynamic control

#### Stereo Processing
- **Width Control**: 0% (mono) to 200% (wide stereo)
- **Bass Mono**: Low-frequency mono fold (20-200Hz)
- **M/S Processing**: Mid/Side independent processing
- **Phase Correlation**: Real-time phase relationship monitoring

#### Enhancement Modules
```typescript
interface EnhancementParameters {
  harmonicBoost: number;      // 0-100% harmonic enhancement
  subweight: number;          // 0-100% bass emphasis  
  transientPunch: number;     // 0-100% transient enhancement
  airlift: number;           // 0-100% high-frequency presence
  spatialFlux: number;       // 0-100% stereo width enhancement
}
```

### 4. Preset System

#### Built-in Profiles (Built-in Presets)
- **CLUB_MASTER**: High-energy club mastering
  - Punchy transients, enhanced bass
  - Loudness: -10 LUFS, aggressive limiting
- **VINYL_WARM**: Vintage vinyl simulation  
  - Harmonic saturation, gentle compression
  - Loudness: -16 LUFS, analog modeling
- **STREAMING_LOUD**: Optimized for streaming platforms
  - Spotify/Apple Music compliance
  - Loudness: -14 LUFS, true peak limiting
- **RADIO_READY**: Broadcast standard mastering
  - EBU R128 compliance, consistent levels
  - Loudness: -23 LUFS, broadcast limiting

#### Custom Preset Creation
```typescript
interface PresetParameters {
  // Core Processing
  eq: {
    lowShelf: { frequency: number; gain: number; q: number };
    lowMid: { frequency: number; gain: number; q: number };
    midrange: { frequency: number; gain: number; q: number };
    highMid: { frequency: number; gain: number; q: number };
    highShelf: { frequency: number; gain: number; q: number };
  };
  
  compression: {
    threshold: number;        // -30 to 0 dB
    ratio: number;           // 1:1 to 10:1
    attack: number;          // 0.1 to 100 ms
    release: number;         // 10 to 1000 ms
    knee: number;            // 0 to 10 dB
  };
  
  limiting: {
    threshold: number;       // -10 to 0 dB
    release: number;         // 1 to 100 ms
    lookahead: number;       // 0 to 10 ms
  };
  
  stereo: {
    width: number;           // 0 to 2.0
    bassMonoFreq: number;    // 20 to 200 Hz
  };
}
```

### 5. Real-time Visualization

#### Spectrum Analyzer
- **Resolution**: 2048-point FFT with Hanning window
- **Range**: 20Hz - 20kHz with logarithmic scaling
- **Update Rate**: 60fps for smooth visualization
- **Display**: Pre/post processing comparison

#### Stereo Correlation Meter
- **Range**: -1.0 (out of phase) to +1.0 (perfect correlation)
- **Integration**: Gated measurement following EBU R128
- **Visual**: Real-time polar display with phase warnings

#### Loudness Meters
- **Standards**: ITU-R BS.1770-4, EBU R128, ATSC A/85
- **Display**: Integrated, Short-term, Momentary LUFS
- **Range**: -70 LUFS to 0 LUFS with color coding
- **History**: 10-minute rolling history graph

### 6. Export & Transmission System

#### Multi-Format Export
- **WAV**: Uncompressed 16/24/32-bit PCM
- **FLAC**: Lossless compression with metadata
- **MP3**: Variable/Constant bitrate 128-320 kbps
- **AAC**: Advanced Audio Coding for streaming
- **OGG Vorbis**: Open-source lossy compression

#### Render Engine
```typescript
interface RenderOptions {
  format: 'wav' | 'flac' | 'mp3' | 'aac' | 'ogg';
  bitDepth: 16 | 24 | 32;           // For uncompressed formats
  sampleRate: 44100 | 48000 | 96000;
  quality: number;                   // For lossy formats (0-1)
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: number;
  };
}
```

### 7. User Interface

#### Responsive Design
```
Desktop (1920px+)    Tablet (768px+)     Mobile (320px+)
┌─────────────────┐   ┌──────────────┐    ┌──────────┐
│  [ Spectrum  ]  │   │ [Spectrum]   │    │[Spectrum]│
│  [Meters][EQ ]  │   │ [Controls]   │    │[Controls]│
│  [Comp][Limit]  │   │ [Transport]  │    │[Export]  │
│  [ Transport ]  │   └──────────────┘    └──────────┘
└─────────────────┘
```

#### Mobile Interface
```
┌─────────────────────────┐
│ [ ≡ ] C/No Voidline [⚙] │ <- Sticky header
├─────────────────────────┤
│       [Spectrum]        │ <- Collapsible spectrum
├─────────────────────────┤
│ [▶] [⏸] [⏹]           │ <- Transport controls
├─────────────────────────┤
│ Processing Controls     │ <- Collapsible sections
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │ ●   │ │ ●   │ │ ●   │ │ <- Touch-optimized knobs
│ │ 45% │ │ 32% │ │ 78% │ │
│ └─────┘ └─────┘ └─────┘ │
├─────────────────────────┤
│ Presets                 │
│ [CLUB] [VINYL] [STREAM] │ <- Horizontal scroll
├─────────────────────────┤
│ Analysis                │
│ PEAK: -1.2 | RMS: -12.4 │
│ LUFS: -14.1 | LRA: 6.8  │
└─────────────────────────┘
```

### 8. Performance Specifications

#### Audio Engine
- **Latency**: < 10ms round-trip processing
- **Sample Rates**: 44.1kHz, 48kHz, 96kHz
- **Bit Depth**: 16-bit, 24-bit, 32-bit float
- **Buffer Sizes**: 128, 256, 512, 1024, 2048 samples

#### System Requirements
- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **Browser**: Chrome 90+, Firefox 90+, Safari 14+
- **Audio Interface**: Any Web Audio API compatible device

#### File Support
- **Input**: WAV, FLAC, MP3, AAC, OGG, M4A
- **Max Size**: 200MB per file
- **Duration**: Up to 60 minutes per track
- **Channels**: Mono, Stereo (multi-channel planned)

---

## Technical Implementation

### Audio Worklet Architecture
```javascript
// mastering-worklet.js
class MasteringProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.sampleRate = 44100;
    this.analysisBuffer = new Float32Array(this.bufferSize);
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    // Process each channel
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      // Apply mastering chain
      this.processChannel(inputChannel, outputChannel);
    }
    
    return true;
  }
}
```

### State Management
```typescript
interface AppState {
  // Audio State
  audio: {
    file: File | null;
    buffer: AudioBuffer | null;
    context: AudioContext | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
  
  // Analysis State
  analysis: {
    current: AudioAnalysis | null;
    isAnalyzing: boolean;
    progress: number;
  };
  
  // Processing State
  processing: {
    preset: string | null;
    parameters: PresetParameters;
    isProcessing: boolean;
    phase: 1 | 2;
  };
  
  // UI State
  ui: {
    theme: 'dark' | 'light';
    mobileMenuOpen: boolean;
    activePanel: string;
  };
}
```

This specification covers all implemented features and provides the foundation for future enhancements including AI model improvements, additional export formats, and advanced real-time collaboration features.
