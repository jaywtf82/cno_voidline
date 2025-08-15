# C/No Voidline - AI Audio Mastering Console

A professional-grade AI audio mastering console with a terminal aesthetic, featuring advanced visualizers, real-time analysis, and comprehensive preset management.

## Features

### Core Mastering
- **AI-powered audio analysis** with real-time metrics (LUFS, dBTP, LRA, correlation)
- **Advanced signal processing** using Web Audio API and custom AudioWorklets
- **Multi-phase workflow** from signal acquisition to transmission
- **Professional metering** with Voidline scoring system

### Visualizers
- **WaveDNA Visualizer** - Multi-mode spectrum analysis with orbital 3D view
- **Stereo Field Radar** - Real-time polar stereo imaging
- **Phase Lock Grid** - Network visualization of phase correlation
- **Noise Floor Tracker** - Professional headroom monitoring

### Theme System
- **Four terminal themes**: Classic, Matrix, Cyberpunk, Retro
- **Dynamic color schemes** with real-time switching
- **Customizable visualizer palettes**
- **Consistent terminal aesthetic** across all components

### Preset Management
- **Blackroom Profiles** - Built-in AI-crafted presets
- **Custom preset creation** with parameter validation
- **Import/export functionality** for sharing presets
- **Usage tracking** and popularity sorting

### Audio Processing
- **Real-time DSP chain**: EQ, compression, stereo processing, limiting
- **Custom AudioWorklet** for advanced stereo and spatial effects
- **Professional export formats**: Club, Streaming, Vinyl, Radio
- **Offline rendering** with progress tracking

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** + TypeScript
- **Tailwind CSS** with custom terminal styling
- **Framer Motion** for smooth animations
- **Zustand** for state management
- **TanStack Query** for server state

### Backend
- **Next.js API Routes**
- **PostgreSQL** with Prisma ORM
- **Replit Auth** for authentication
- **Express** with custom session handling

### Audio
- **Web Audio API** with custom processors
- **AudioWorklet** for real-time effects
- **FFT analysis** for spectral visualization
- **ITU-R BS.1770** LUFS implementation

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Replit account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voidline-console
