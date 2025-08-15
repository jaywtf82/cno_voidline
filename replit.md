# C/No Voidline - AI Audio Mastering Console

## Overview

C/No Voidline is a professional-grade AI audio mastering console with a cinematic, terminal aesthetic. The application provides real-time audio analysis, AI-powered mastering algorithms, and comprehensive preset management. It features advanced visualizers including WaveDNA spectrum analysis, stereo field radar, and phase correlation grids. The system supports multi-format export targeting different platforms (Club, Streaming, Vinyl, Radio) with professional metering and the proprietary Voidline scoring system.

## User Preferences

Preferred communication style: Simple, everyday language.
Footer credit: "designed and developed by [@dotslashrecords]"
Terminal window styling: Use macOS-style window chrome with colored dots
Logo: Custom SVG from story.svg with terminal window integration
**Authentication:** Configurable - can be disabled for open/demo deployments
**Deployment:** Support for multiple free hosting platforms (GitHub Pages, Netlify, Vercel, Railway, Render)
**Database:** Configurable storage backends (memory, SQLite, PostgreSQL)

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router and React 18, providing server-side rendering and modern React features
- **Styling**: Tailwind CSS with custom terminal theme system supporting four themes (Classic, Matrix, Cyberpunk, Retro)
- **Component Library**: shadcn/ui for base components with custom terminal-styled extensions
- **State Management**: Zustand for client-side state management with separate stores for audio and preset data
- **Animations**: Framer Motion for GPU-optimized animations using transform/opacity properties
- **Query Management**: TanStack Query for server state synchronization and caching

### Backend Architecture
- **Framework**: Express.js server with Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect and session management
- **Session Storage**: PostgreSQL-backed session store with connect-pg-simple

### Audio Processing Engine
- **Core**: Web Audio API with custom AudioWorklets for real-time DSP processing
- **AI Mastering Core**: Advanced neural network for intelligent audio reconstruction and enhancement
- **Features**: Multi-phase audio analysis (LUFS, dBTP, LRA, phase correlation), real-time EQ/compression/stereo processing
- **AI Learning**: Continuous learning from user feedback and preference adaptation
- **Export**: Offline rendering with progress tracking, supporting multiple professional formats
- **Visualizations**: Real-time spectrum analysis, stereo imaging, and phase correlation displays

### Database Schema
- **Users**: Core user data with Replit Auth integration
- **User Preferences**: Theme settings, default export formats, and custom preferences
- **Projects**: Audio project storage with metadata and processing parameters
- **Presets**: Built-in and user-created mastering presets with usage tracking
- **Export Targets**: Multiple format configurations for different platforms
- **Sessions**: Secure session management for authentication

### Theme System
- **Dynamic Theming**: Runtime theme switching with CSS custom properties
- **Terminal Aesthetics**: Consistent monospace typography with Fira Code and Inter fonts
- **Color Palettes**: Theme-specific color schemes with proper contrast and accessibility
- **Component Variants**: Theme-aware component styling throughout the application

### File Organization
- **Client**: React components, pages, hooks, and utilities under `/client/src`
- **Server**: Express routes, database operations, and authentication under `/server`
- **Shared**: Common types, schemas, and utilities under `/shared`
- **Assets**: Static resources and multimedia content under `/attached_assets`

## External Dependencies

### Authentication & Infrastructure
- **Replit Auth**: Primary authentication provider using OpenID Connect
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Connect-PG-Simple**: PostgreSQL session store for Express sessions

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework with custom terminal theming
- **Framer Motion**: Animation library for smooth, GPU-optimized transitions

### Audio & Media
- **Web Audio API**: Native browser audio processing capabilities
- **Custom AudioWorklets**: Low-latency audio processing for real-time effects

### Data & Validation
- **Zod**: Runtime type validation and schema definition
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **TanStack Query**: Server state management and caching

### Development Tools
- **TypeScript**: Type safety across the entire application
- **Vite**: Build tool with hot module replacement and optimized bundling
- **ESBuild**: Fast JavaScript bundler for server-side code