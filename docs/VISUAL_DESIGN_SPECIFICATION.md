
# C/No Voidline - Visual Design Specification

## Interface Design Language

### Design Philosophy
C/No Voidline employs a **"Cinematic Terminal"** design language that merges professional audio engineering with cyberpunk aesthetics. The interface should feel like operating a high-tech command center from a sci-fi film while maintaining the precision and functionality of professional studio equipment.

## Color System & Themes

### Theme Architecture
Each theme defines a complete visual ecosystem with primary colors, glow effects, and atmospheric elements.

#### Classic Theme (GitHub Green)
```css
:root[data-theme="classic"] {
  /* Primary Colors */
  --theme-primary: #3FB950;
  --theme-secondary: #2EA043;
  --theme-accent: #58A6FF;
  
  /* Backgrounds */
  --background-primary: #0B0C0E;
  --background-secondary: #161B22;
  --background-card: #21262D;
  
  /* Text Colors */
  --text-primary: #C9D1D9;
  --text-secondary: #8B949E;
  --text-muted: #6E7681;
  
  /* Glow Effects */
  --theme-glow: rgba(63, 185, 80, 0.4);
  --theme-glow-strong: rgba(63, 185, 80, 0.8);
  --theme-shadow: rgba(63, 185, 80, 0.2);
}
```

#### Matrix Theme (Digital Rain)
```css
:root[data-theme="matrix"] {
  --theme-primary: #00FF41;
  --theme-secondary: #00CC33;
  --theme-accent: #33FF66;
  
  --background-primary: #000000;
  --background-secondary: #001100;
  --background-card: #002200;
  
  --text-primary: #00FF41;
  --text-secondary: #00CC33;
  --text-muted: #009922;
  
  --theme-glow: rgba(0, 255, 65, 0.6);
  --theme-glow-strong: rgba(0, 255, 65, 1.0);
  
  /* Matrix-specific effects */
  --matrix-rain-speed: 3s;
  --matrix-characters: "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
}
```

#### Cyberpunk Theme (Neon Blue)
```css
:root[data-theme="cyberpunk"] {
  --theme-primary: #00D4FF;
  --theme-secondary: #0099CC;
  --theme-accent: #FF0080;
  
  --background-primary: #0A0A0F;
  --background-secondary: #1A1A2E;
  --background-card: #16213E;
  
  --text-primary: #00D4FF;
  --text-secondary: #66B3FF;
  --text-muted: #3388CC;
  
  --theme-glow: rgba(0, 212, 255, 0.5);
  --theme-glow-strong: rgba(0, 212, 255, 1.0);
  --theme-accent-glow: rgba(255, 0, 128, 0.6);
}
```

#### Retro Theme (Amber Terminal)
```css
:root[data-theme="retro"] {
  --theme-primary: #FF8C42;
  --theme-secondary: #E6751A;
  --theme-accent: #FFB366;
  
  --background-primary: #1A0F08;
  --background-secondary: #2D1810;
  --background-card: #3D2418;
  
  --text-primary: #FF8C42;
  --text-secondary: #CC6600;
  --text-muted: #994D00;
  
  --theme-glow: rgba(255, 140, 66, 0.4);
  --theme-glow-strong: rgba(255, 140, 66, 0.8);
}
```

## Typography System

### Font Stack Hierarchy
```css
/* Primary Interface Font (Monospace) */
.font-mono {
  font-family: 'Fira Code', 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-feature-settings: 'liga' 1, 'calt' 1;
}

/* Secondary UI Font (Sans-serif) */
.font-sans {
  font-family: 'Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', sans-serif;
}

/* Display Font (Technical/Terminal) */
.font-display {
  font-family: 'Geist Mono', 'IBM Plex Mono', 'Source Code Pro', monospace;
  font-weight: 600;
  letter-spacing: 0.05em;
}
```

### Text Scale & Hierarchy
```css
/* Display Text */
.text-display {
  font-size: 3rem;        /* 48px */
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Page Titles */
.text-title {
  font-size: 2.5rem;      /* 40px */
  line-height: 1.2;
  font-weight: 600;
}

/* Section Headers */
.text-heading {
  font-size: 1.5rem;      /* 24px */
  line-height: 1.3;
  font-weight: 600;
  text-transform: uppercase;
}

/* Body Text */
.text-body {
  font-size: 1rem;        /* 16px */
  line-height: 1.5;
  font-weight: 400;
}

/* Caption/Metadata */
.text-caption {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.4;
  font-weight: 400;
  opacity: 0.8;
}

/* Code/Terminal */
.text-terminal {
  font-size: 0.75rem;     /* 12px */
  line-height: 1.4;
  font-family: var(--font-mono);
  letter-spacing: 0.025em;
}
```

## Component Visual Specifications

### Control Components

#### Knob Component Visual Design
```
┌─────────────────┐
│ HARMONIC BOOST  │ <- Label (text-caption, uppercase)
│                 │
│     ╭─────╮     │
│   ╱─┤  ●  │─╲   │ <- Circular control with rotation indicator
│  ╱  │  │  │  ╲  │
│ ╱   │  │  │   ╲ │ <- Glow effect around active area
│╱    ╰──┼──╯    ╲│
│       45%       │ <- Value display (text-terminal)
│                 │
│ [0% ──●── 100%] │ <- Range indicator (optional)
└─────────────────┘
```

**Visual States:**
- **Default**: Subtle border glow
- **Hover**: Increased glow intensity (+50%)
- **Active**: Maximum glow + rotation animation
- **Disabled**: Reduced opacity (40%)

#### Fader Component Visual Design
```
┌─────────────────┐
│      LUFS       │ <- Parameter label
│  ┌─────────────┐│
│  │ ░░░░░███░░░ ││ <- Track with current value position
│  │     ▲       ││ <- Handle with target indicator
│  │  -14.2      ││ <- Current value display
│  └─────────────┘│
│  [-30] [TARGET] │ <- Min/max values with target
│      [-14]      │
└─────────────────┘
```

**Color Coding:**
- **Green Zone**: Safe/optimal values
- **Yellow Zone**: Caution range
- **Red Zone**: Limit/danger area

### Card System Visual Design

#### NeonCard Terminal Variant
```css
.neon-card-terminal {
  background: linear-gradient(
    135deg, 
    var(--background-card) 0%, 
    rgba(var(--background-card), 0.8) 100%
  );
  border: 1px solid var(--theme-primary);
  border-radius: 8px;
  box-shadow: 
    0 0 20px var(--theme-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

/* Animated border effect */
.neon-card-terminal::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    var(--theme-primary),
    transparent
  );
  transition: left 0.5s;
}

.neon-card-terminal:hover::before {
  left: 100%;
}
```

### Visualizer Design Specifications

#### WaveDNA 3D Visualizer
```
┌─────────────────────────────────────────────────┐
│ WAVE DNA ANALYZER                    [3D] [2D] │
│                                                 │
│                   ╭─────╮                      │
│                 ╱─┤     │─╲                    │
│               ╱   │  ●  │   ╲                  │
│             ╱     │ ╱─╲ │     ╲                │
│           ╱       │╱   ╲│       ╲              │
│         ╱         │     │         ╲            │
│       ╱          ╱│     │╲          ╲          │
│     ╱          ╱  │     │  ╲          ╲        │
│   ╱          ╱    ╰─────╯    ╲          ╲      │
│ ╱          ╱                   ╲          ╲    │
│          ╱                       ╲             │
│        ╱           CENTER           ╲           │
│                                                 │
│ Frequency Bands: [20Hz] [1kHz] [20kHz]         │
│ Resolution: 2048 points | Mode: Orbital         │
└─────────────────────────────────────────────────┘
```

**Orbital Mode Characteristics:**
- **Center Point**: Current playback position marker
- **Radius**: Frequency magnitude representation
- **Color Mapping**: Low freq (red) → Mid (green) → High (blue)
- **Rotation**: Continuous clockwise rotation (3s/revolution)
- **Particles**: Floating frequency particles with trails

#### Stereo Radar Visualization
```
┌─────────────────────────────────────┐
│ STEREO FIELD RADAR                  │
│                                     │
│     ╭─────────────────────────╮     │
│   ╱───────────┬───────────────╲    │
│ ╱─────────────┼─────────────────╲   │
│╱──────────────┼──────────────────╲  │
││      L       │       R         │  │
││              │                 │  │
││         ╱────┼────╲            │  │
││       ╱      ●      ╲          │  │ <- Correlation point
││     ╱        │        ╲        │  │
││   ╱          │          ╲      │  │
││ ╱            │            ╲    │  │
│╲──────────────┼──────────────────╱  │
│ ╲─────────────┼─────────────────╱   │
│   ╲───────────┼───────────────╱     │
│     ╰─────────────────────────╯     │
│                                     │
│ Correlation: 0.94 | Width: 78%      │
└─────────────────────────────────────┘
```

**Radar Elements:**
- **Sweep Beam**: Rotating scanner beam (3s rotation)
- **Correlation Dot**: Real-time L/R correlation position
- **Width Rings**: Concentric circles showing stereo width
- **Phase Lines**: Connecting lines between L/R channels

#### Phase Lock Grid Network
```
┌─────────────────────────────────────┐
│ PHASE LOCK GRID                     │
│                                     │
│    ●─────────●─────────●            │
│    │         │         │            │
│    │    ●────┼────●    │            │
│    │    │    │    │    │            │
│    ●────┼────●────┼────●            │
│         │         │                 │
│    ●────┼────●────┼────●            │
│    │    │    │    │    │            │
│    │    ●────┼────●    │            │
│    │         │         │            │
│    ●─────────●─────────●            │
│                                     │
│ Nodes: 12 | Connections: 8          │
│ Phase Sync: 94% | Drift: 0.02°      │
└─────────────────────────────────────┘
```

**Network Elements:**
- **Nodes**: Frequency band phase points
- **Connections**: Phase relationship lines
- **Line Thickness**: Correlation strength
- **Color**: Green (in-phase) → Red (out-of-phase)
- **Animation**: Pulsing connections show real-time changes

### Level Meter Visual Design

#### VoidlineMeter Professional Display
```
┌───────────────────────────────────────────────────┐
│ LEVEL MONITORING                                  │
├───────────────────────────────────────────────────┤
│ L  ████████████████████████▓▓▓░░░░  -1.2 dBFS    │ <- Left channel
│ R  ████████████████████████▓▓▓░░░░  -1.3 dBFS    │ <- Right channel
├───────────────────────────────────────────────────┤
│ Peak Hold: 3.2s │ Headroom: 12.3 dB              │
│ Noise Floor: -65.2 dB │ Dynamic Range: 8.7 dB    │
├───────────────────────────────────────────────────┤
│ LUFS: -14.1 │ LRA: 6.8 LU │ Correlation: 0.94    │
└───────────────────────────────────────────────────┘
```

**Meter Segments:**
- **Green** (-∞ to -18 dB): Safe operating range
- **Yellow** (-18 to -6 dB): Caution zone
- **Orange** (-6 to -1 dB): Approach limit
- **Red** (-1 to 0 dB): Peak limiting zone

## Animation Specifications

### Entrance Animations
```css
/* Page load stagger */
.page-enter {
  animation: slideInUp 0.6s ease-out;
}

.page-enter-delayed {
  animation: slideInUp 0.6s ease-out 0.2s both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Interactive Animations
```css
/* Hover glow enhancement */
.interactive-glow {
  transition: box-shadow 0.3s ease;
}

.interactive-glow:hover {
  box-shadow: 
    0 0 20px var(--theme-glow),
    0 0 40px var(--theme-glow-strong);
  transform: scale(1.02);
}

/* Active state pulse */
.active-pulse {
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  from { box-shadow: 0 0 10px var(--theme-glow); }
  to { box-shadow: 0 0 30px var(--theme-glow-strong); }
}
```

### Theme Transition Animations
```css
/* Smooth theme switching */
* {
  transition: 
    color 0.3s ease,
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* Theme-specific entrance effects */
.matrix-theme .digital-rain {
  animation: matrix-rain 3s linear infinite;
}

.cyberpunk-theme .neon-flicker {
  animation: neon-flicker 0.1s infinite alternate;
}

@keyframes neon-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

## Responsive Design Breakpoints

### Mobile Layout (320px - 767px)
```css
/* Single column stack */
.grid-console {
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Enlarged touch targets */
.touch-control {
  min-height: 44px;
  min-width: 44px;
}

/* Simplified visualizers */
.visualizer-mobile {
  height: 200px; /* Reduced height */
  simplification: enabled;
}
```

### Tablet Layout (768px - 1023px)
```css
/* Two-column layout */
.grid-console {
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Responsive visualizers */
.visualizer-tablet {
  height: 300px;
  detail-level: medium;
}
```

### Desktop Layout (1024px+)
```css
/* Full three-column layout */
.grid-console {
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
}

/* Full-detail visualizers */
.visualizer-desktop {
  height: 400px;
  detail-level: maximum;
}
```

### Large Display (1440px+)
```css
/* Enhanced spacing and sizing */
.grid-console {
  grid-template-columns: 350px 1fr 350px;
  gap: 3rem;
  max-width: 1800px;
  margin: 0 auto;
}
```

## Accessibility Visual Specifications

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --theme-primary: #FFFFFF;
    --background-primary: #000000;
    --text-primary: #FFFFFF;
    --border-color: #FFFFFF;
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .radar-sweep,
  .glow-pulse,
  .matrix-rain {
    animation: none;
  }
}
```

### Focus Indicators
```css
.focus-visible {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--theme-glow);
}
```

This visual specification ensures a consistent, professional, and accessible interface that maintains the cyberpunk terminal aesthetic while providing excellent usability across all devices and user preferences.
