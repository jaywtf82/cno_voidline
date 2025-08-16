
# C/No Voidline - Complete Feature Specification

> **2025-08-16** – Synced with recent build audit and package script additions. Refer to `docs/AUDIT.md`.

## Application Overview

C/No Voidline is a professional AI-powered audio mastering console that combines cutting-edge audio processing with a cinematic terminal aesthetic. The application provides real-time audio analysis, intelligent mastering algorithms, and comprehensive project management within an immersive cyberpunk-inspired interface.

## Core Features & Functionality

### 1. Authentication & User Management

#### Login System
- **Replit Auth Integration**: Seamless OAuth2 flow with Replit authentication
- **Session Management**: Secure PostgreSQL-backed session storage
- **User Preferences**: Persistent theme, export format, and workspace settings
- **Access Control**: Role-based permissions for different feature sets

#### User Interface Elements
```
┌─────────────────────────────────────────────────┐
│ [LOGO] C/No Voidline     [USER] [THEME] [LOGOUT]│
└─────────────────────────────────────────────────┘
```

### 2. Audio Processing Engine

#### Core Audio Pipeline
```
Audio Input → Real-time Analysis → DSP Processing → Visualization → Export
```

#### Analysis Engine Features
- **LUFS Measurement**: ITU-R BS.1770-4 compliant loudness analysis
- **True Peak Detection**: Oversampled peak detection with dBTP measurement
- **Loudness Range (LRA)**: Dynamic range analysis for different broadcast standards
- **Stereo Correlation**: Phase relationship analysis between L/R channels
- **Spectral Analysis**: Real-time FFT with 2048-point resolution
- **Noise Floor Detection**: Automatic noise floor measurement and tracking

#### DSP Processing Chain
1. **Input Stage**: Gain staging and level optimization
2. **EQ Section**: 
   - Low shelf filter (20Hz-500Hz adjustable)
   - High shelf filter (2kHz-20kHz adjustable)
   - Parametric mid-band control
3. **Dynamics Processing**:
   - Multi-band compression with lookahead
   - Transient enhancement
   - Harmonic excitation
4. **Stereo Processing**:
   - Stereo width control (0-200%)
   - Bass mono management (20Hz-200Hz)
   - Mid/Side processing
5. **Output Stage**:
   - Transparent limiting
   - Dithering for different bit depths

#### Voidline Scoring Algorithm
```typescript
interface VoidlineScore {
  overall: number;        // 0-100 overall mastering quality
  loudness: number;       // Loudness standard compliance
  dynamics: number;       // Dynamic range preservation
  stereo: number;         // Stereo field optimization
  technical: number;      // Technical quality metrics
}
```

### 3. Real-time Visualizers

#### WaveDNA Visualizer
- **3D Orbital Display**: Rotating frequency spectrum in 3D space
- **Multiple View Modes**:
  - Spectrum: Traditional frequency analysis
  - Orbital: 3D circular representation
  - Waterfall: Time-based frequency evolution
- **Interactive Controls**: Zoom, rotation, frequency isolation
- **Performance**: 60fps rendering with WebGL optimization

#### Stereo Field Radar
- **Polar Visualization**: Circular radar-style stereo imaging
- **Real-time Data**:
  - Phase correlation (-1 to +1)
  - Stereo width percentage
  - Center focus indication
- **Radar Sweep**: Continuous scanning animation
- **Data Trails**: Historical correlation tracking

#### Phase Lock Grid
- **Network Visualization**: Node-based phase relationship display
- **Connection Lines**: Dynamic phase correlation indicators
- **Real-time Updates**: Immediate response to audio changes
- **Color Coding**: Green (good correlation) to red (phase issues)

### 4. Professional Metering System

#### VoidlineMeter
```
┌─────────────────────────────────────────────────┐
│ LEVEL METER                    PEAK: -1.2 dBFS  │
│ ████████████████████▓▓░░░░     RMS:  -12.4 dBFS │
│ ████████████████████▓▓░░░░     LUFS: -14.1 LUFS │
│ Headroom: 12.3 dB              LRA:  6.8 LU     │
│ Noise Floor: -65.2 dB          Correlation: 0.94│
└─────────────────────────────────────────────────┘
```

#### Mission Status Display
- **Signal Strength**: Real-time input level monitoring
- **Processing Status**: Current operation state
- **Voidline Score**: Live quality scoring (0-100)
- **System Logs**: Processing history and alerts

### 5. Preset Management System

#### Blackroom Profiles (Built-in Presets)
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
  harmonicBoost: number;      // 0-100% harmonic enhancement
  subweight: number;          // 0-100% bass emphasis
  transientPunch: number;     // 0-100% transient enhancement
  airlift: number;           // 0-100% high-frequency presence
  spatialFlux: number;       // 0-100% stereo width enhancement
  compression: {
    threshold: number;        // -30 to 0 dB
    ratio: number;           // 1:1 to 10:1
    attack: number;          // 0.1 to 100 ms
    release: number;         // 10 to 1000 ms
  };
  eq: {
    lowShelf: { frequency: number; gain: number };
    highShelf: { frequency: number; gain: number };
  };
  stereo: {
    width: number;           // 0 to 2.0
    bassMonoFreq: number;    // 20 to 200 Hz
  };
}
```

### 6. Export & Transmission System

#### Multi-Format Export
- **WAV**: Uncompressed 16/24/32-bit, 44.1/48/96 kHz
- **FLAC**: Lossless compression, metadata preservation
- **MP3**: 320kbps CBR, streaming optimized
- **AAC**: 256kbps VBR, Apple ecosystem compatible

#### Platform-Specific Optimization
- **Spotify**: -14 LUFS, -1 dBTP, EBU R128 compliant
- **Apple Music**: -16 LUFS, -1 dBTP, mastered for iTunes
- **YouTube**: -13 LUFS, -1 dBTP, broadcast range
- **SoundCloud**: -8 to -12 LUFS, aggressive limiting
- **Vinyl Master**: -18 LUFS, wide dynamics, analog-ready
- **CD Master**: -12 LUFS, Red Book standard

#### Export Progress System
```
┌─────────────────────────────────────────────────┐
│ TRANSMISSION PROTOCOL                           │
│ ████████████████████████░░░░░░░░░░░░ 67%        │
│ Status: Applying dynamics processing...         │
│ ETA: 23 seconds                                 │
│ Output: club_master_final.wav                   │
└─────────────────────────────────────────────────┘
```

### 7. Project Management

#### Project Structure
```typescript
interface Project {
  id: string;
  name: string;
  originalFileName: string;
  audioData: string;              // Base64 encoded audio
  processingParams: PresetParameters;
  analysisResults: AnalysisResults;
  voidlineScore: number;
  exportHistory: ExportRecord[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Auto-Save System
- **Real-time Saving**: Parameter changes saved immediately
- **Version History**: Track processing parameter evolution
- **Recovery System**: Automatic crash recovery
- **Cloud Sync**: Projects synchronized across devices

### 8. Theme & Visual System

#### Four Terminal Themes

##### Classic Theme (Default)
```css
/* Matrix green aesthetic */
Primary: #3FB950
Background: #0B0C0E
Glow: rgba(63, 185, 80, 0.4)
Typography: 'Fira Code', monospace
```

##### Matrix Theme
```css
/* Digital rain aesthetic */
Primary: #00FF41
Background: #000000
Effects: Digital rain animation
Glow: rgba(0, 255, 65, 0.6)
```

##### Cyberpunk Theme
```css
/* Neon blue aesthetic */
Primary: #00D4FF
Secondary: #FF0080
Background: #0A0A0F
Glow: rgba(0, 212, 255, 0.5)
```

##### Retro Theme
```css
/* Warm orange aesthetic */
Primary: #FF8C42
Background: #1A0F08
Glow: rgba(255, 140, 66, 0.4)
Typography: 'IBM Plex Mono', monospace
```

## User Interface Layout Specification

### Main Console Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo + Navigation + User Controls + Theme Selector             │
├───────────────┬─────────────────────────────────┬───────────────────────┤
│ LEFT PANEL    │ CENTER VISUALIZATION AREA       │ RIGHT PANEL           │
│ (3 columns)   │ (6 columns)                     │ (3 columns)           │
│               │                                 │                       │
│ ┌───────────┐ │ ┌─────────────────────────────┐ │ ┌─────────────────────┐ │
│ │Transport  │ │ │ WaveDNA Visualizer          │ │ │ Preset Library      │ │
│ │Controls   │ │ │ ┌─────┐ ┌─────┐ ┌─────┐     │ │ │ ┌─────┐ ┌─────┐     │ │
│ │           │ │ │ │ PLAY│ │PAUSE│ │STOP │     │ │ │ │CLUB │ │VINYL│     │ │
│ │ ┌───────┐ │ │ │ └─────┘ └─────┘ └─────┘     │ │ │ │MSTR │ │WARM │     │ │
│ │ │  ▶    │ │ │ │                             │ │ │ └─────┘ └─────┘     │ │
│ │ └───────┘ │ │ │   ╭─────────────────────╮   │ │ │ ┌─────┐ ┌─────┐     │ │
│ │           │ │ │   │ 3D Orbital Spectrum │   │ │ │ │STRM │ │RADIO│     │ │
│ │Processing │ │ │   │                     │   │ │ │ │LOUD │ │READY│     │ │
│ │Parameters │ │ │   │      ╭─────╮       │   │ │ │ └─────┘ └─────┘     │ │
│ │           │ │ │   │    ╱─┤     │─╲     │   │ │ │                     │ │
│ │ Harmonic  │ │ │   │  ╱   │  ●  │   ╲   │   │ │ │ Analysis Display    │ │
│ │ ●────────●│ │ │   │ ╱    │     │    ╲  │   │ │ │ ┌─────────────────┐ │ │
│ │   45%     │ │ │   │╱     ╰─────╯     ╲ │   │ │ │ │ PEAK: -1.2 dBFS │ │ │
│ │           │ │ │   │                   │   │ │ │ │ RMS:  -12.4 dBFS│ │ │
│ │ Subweight │ │ │   ╰─────────────────────╯   │ │ │ │ LUFS: -14.1     │ │ │
│ │ ●────●────│ │ │                             │ │ │ │ LRA:  6.8 LU    │ │ │
│ │   32%     │ │ │ ┌─────────────┐┌───────────┐ │ │ │ │ CORR: 0.94      │ │ │
│ │           │ │ │ │Stereo Radar ││Phase Grid │ │ │ │ └─────────────────┘ │ │
│ │ Transient │ │ │ │             ││           │ │ │ │                     │ │
│ │ ●──────●──│ │ │ │     ╭─●─╮   ││  ●───●    │ │ │ │ Export Options      │ │
│ │   78%     │ │ │ │   ╱ ╱   ╲ ╲ ││  │   │    │ │ │ │ ┌─────────────────┐ │ │
│ │           │ │ │ │  ╱ ╱  ▲  ╲ ╲││  ●───●    │ │ │ │ │ FORMAT: WAV 24  │ │ │
│ │ Airlift   │ │ │ │ ╱ ╱   │   ╲ ╲│  │   │    │ │ │ │ │ TARGET: Spotify │ │ │
│ │ ●────●────│ │ │ │╱ ╱    ●    ╲ ╲  ●───●    │ │ │ │ │ [TRANSMIT]      │ │ │
│ │   56%     │ │ │ │ ╱           ╲││           │ │ │ │ └─────────────────┘ │ │
│ │           │ │ │ │╱             ╲│           │ │ │ │                     │ │
│ │ Spatial   │ │ │ └─────────────┘└───────────┘ │ │ │                     │ │
│ │ ●─────●───│ │ │                             │ │ │                     │ │
│ │   63%     │ │ │                             │ │ │                     │ │
│ └───────────┘ │ └─────────────────────────────┘ │ └─────────────────────┘ │
│               │                                 │                       │
└───────────────┴─────────────────────────────────┴───────────────────────┤
│ FOOTER STATUS BAR                                                       │
│ ENGINE: ONLINE | BUFFER: 512 | LATENCY: 2.3ms | CPU: 15% | MEM: 245MB  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Responsive)
```
┌─────────────────────────┐
│ ☰ C/No Voidline    [●] │ <- Collapsible header
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │   WaveDNA Display   │ │ <- Full-width visualizer
│ │                     │ │
│ │     ╭─────────╮     │ │
│ │   ╱─┤   ●     │─╲   │ │
│ │  ╱  │         │  ╲  │ │
│ │ ╱   ╰─────────╯   ╲ │ │
│ │╱                   ╲│ │
│ └─────────────────────┘ │
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

## Animation & Interaction Specifications

### Visual Effects System

#### Glitch Effects
```typescript
interface GlitchConfig {
  intensity: 'low' | 'medium' | 'high';
  duration: number;        // milliseconds
  trigger: 'hover' | 'click' | 'auto';
  interval: number;        // auto-trigger interval
}

// Text glitch effect on titles and brand elements
<GlitchWord 
  autoTrigger 
  autoInterval={8000} 
  intensity="medium"
>
  FREQUENCY COMMAND DECK
</GlitchWord>
```

#### Neon Glow System
```css
/* Dynamic glow intensities */
.glow-weak { box-shadow: 0 0 10px var(--theme-glow); }
.glow-medium { box-shadow: 0 0 20px var(--theme-glow); }
.glow-strong { box-shadow: 0 0 30px var(--theme-glow-strong); }

/* Pulsing glow animation */
@keyframes glow-pulse {
  0% { box-shadow: 0 0 5px var(--theme-glow); }
  100% { box-shadow: 0 0 25px var(--theme-glow-strong); }
}
```

#### Radar Sweep Animation
```css
@keyframes radar-sweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.radar-beam {
  animation: radar-sweep 3s linear infinite;
  background: linear-gradient(
    90deg, 
    transparent 0%, 
    var(--theme-primary) 50%, 
    transparent 100%
  );
}
```

### Control Interactions

#### Knob Controls
- **Rotation**: Click and drag for parameter adjustment
- **Fine Control**: Hold Shift for precision adjustment
- **Reset**: Double-click to return to default value
- **Visual Feedback**: Real-time value display with glow intensity

#### Fader Controls
- **Smooth Movement**: Exponential easing for professional feel
- **Target Lines**: Visual indicators for optimal values
- **Color Coding**: Green (safe) → Yellow (caution) → Red (limit)
- **Peak Hold**: 3-second peak hold with decay animation

### State Management Architecture

#### Audio Store (Zustand)
```typescript
interface AudioState {
  // Audio file management
  currentFile: File | null;
  isLoaded: boolean;
  duration: number;
  currentTime: number;
  
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  
  // Real-time analysis
  analysisResults: AnalysisResults | null;
  spectrum: Float32Array;
  levels: {
    peak: number;
    rms: number;
    lufs: number;
  };
  
  // Processing parameters
  processingParams: PresetParameters;
  
  // Actions
  loadAudio: (file: File) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  updateParams: (params: Partial<PresetParameters>) => void;
}
```

#### Theme Store
```typescript
interface ThemeState {
  currentTheme: 'classic' | 'matrix' | 'cyberpunk' | 'retro';
  customColors: Record<string, string>;
  animationsEnabled: boolean;
  glitchIntensity: number;
  
  setTheme: (theme: string) => void;
  toggleAnimations: () => void;
  setCustomColor: (key: string, value: string) => void;
}
```

## Technical Performance Specifications

### Audio Processing Performance
- **Latency**: < 10ms round-trip processing latency
- **Sample Rate**: Support for 44.1, 48, 88.2, 96 kHz
- **Bit Depth**: 16, 24, 32-bit integer and 32-bit float
- **Buffer Sizes**: 128, 256, 512, 1024 samples (user selectable)
- **CPU Usage**: < 20% on modern hardware for real-time processing

### Visual Performance
- **Frame Rate**: 60fps for all visualizers and animations
- **GPU Utilization**: WebGL-accelerated rendering for complex visualizations
- **Memory Usage**: < 500MB for typical project with 5-minute audio file
- **Load Times**: < 2 seconds for application initialization

### Responsiveness Requirements
- **First Paint**: < 1 second
- **Interactive**: < 2 seconds
- **Audio Load**: < 3 seconds for 10MB file
- **Export Time**: Real-time for uncompressed formats

## Integration Specifications

### File Format Support
#### Import Formats
- **WAV**: All common sample rates and bit depths
- **FLAC**: Lossless compressed audio
- **MP3**: 128kbps to 320kbps
- **AAC**: M4A container, various bitrates
- **AIFF**: Apple audio format
- **OGG**: Vorbis compressed audio

#### Export Formats
- **Professional**: WAV 24/96, FLAC 24/96
- **Streaming**: MP3 320, AAC 256
- **Mastering**: WAV 24/44.1, DDP images
- **Archive**: FLAC 24/48, BWF metadata

### Metadata Handling
```typescript
interface AudioMetadata {
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  isrc: string;           // International Standard Recording Code
  mastered_by: string;    // Auto-populated with "C/No Voidline"
  lufs_integrated: number; // Embedded loudness metadata
  true_peak: number;      // Peak level metadata
}
```

This comprehensive specification provides the complete feature set and visual design for the C/No Voidline application, ensuring a professional-grade audio mastering experience with an immersive terminal aesthetic.
