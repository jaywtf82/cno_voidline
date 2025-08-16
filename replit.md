# C/No Voidline - AI Audio Mastering Console

## Overview

C/No Voidline is a professional-grade AI audio mastering console with a cinematic, terminal aesthetic. The application provides real-time audio analysis, AI-powered mastering algorithms, and comprehensive preset management. It features advanced visualizers including WaveDNA spectrum analysis, stereo field radar, and phase correlation grids. The system supports multi-format export targeting different platforms (Club, Streaming, Vinyl, Radio) with professional metering and the proprietary Voidline scoring system.

## Recent Changes

### August 16, 2025 - TerminalWindow Responsive Design Update
- **Margin System**: Implemented 100px responsive margins for TerminalWindow component
- **Dynamic Sizing**: TerminalWindow now scales with screen size using CSS custom properties
- **Glass Frame Styling**: Updated TerminalWindow to match AppHeader glass frame aesthetics
- **Performance**: Fixed audio analysis system with requestAnimationFrame and optimized worklets
- **TypeScript**: Resolved all type safety issues in audio processing pipeline

### August 15, 2025 - Project Migration and Header Redesign
- **Migration Complete**: Successfully migrated from Replit Agent to standard Replit environment
- **Database Setup**: PostgreSQL database provisioned and connected with all tables created
- **Header Redesign**: Updated header layout to match reference design - detached from top, transparent navigation buttons
- **Responsive Design System**: Implemented comprehensive responsive design using clamp() functions for all components
- **Dynamic Sizing**: All cards, text, spacing, and layouts now scale dynamically based on screen size
- **Mobile Optimization**: Added dedicated mobile breakpoints and responsive grid system
- **Typography Scale**: Created responsive text sizing utilities from xs to 4xl with viewport-based scaling
- **Security**: Maintained client/server separation and robust security practices
- **Dependencies**: All packages installed and working properly

### January 15, 2025 - PremasterAnalysis Component Enhancement
- **Fixed Runtime Errors**: Completely rewrote PremasterAnalysis component with enterprise-level type safety
- **Data Validation**: Added safe parsing utilities for string-to-number conversion without runtime errors
- **Real-time Integration**: Component now properly uses actual uploaded audio file data instead of seed data
- **Type Safety**: Implemented proper TypeScript interfaces (AudioAnalysisData, TechnicalAnalysisData)
- **Error Prevention**: All `.toFixed()` calls are now wrapped in safe formatting functions
- **Professional Standards**: Added industry-standard LUFS, dBTP, LRA, and spectral analysis metrics
- **UI Enhancement**: Updated color scheme to use project's green theme consistently
- **Navigation**: "Start Mastering Session" button properly routes to mastering interface

### Component Improvements
- **Landing.tsx**: Enhanced with comprehensive README documentation and controls guide
- **Mastering.tsx**: Added PhaseOneCard integration with modal functionality  
- **Console.tsx**: Updated with proper audio processing pipeline documentation
- **PremasterAnalysis.tsx**: Complete rewrite with bulletproof error handling and real data integration

## User Preferences

Preferred communication style: Simple, everyday language.
Footer credit: "designed and developed by [@dotslashrecords]"
Terminal window styling: Use macOS-style window chrome with colored dots
Logo: Custom SVG from story.svg with terminal window integration
**Authentication:** Configurable - can be disabled for open/demo deployments
**Deployment:** Support for multiple free hosting platforms (GitHub Pages, Netlify, Vercel, Railway, Render)
**Database:** Configurable storage backends (memory, SQLite, PostgreSQL)
**Color Scheme:** Primary green theme (#22c55e) with terminal aesthetics, moving away from blue/cyan
**Error Handling:** Zero tolerance for runtime errors - all components must have bulletproof type safety
**Data Policy:** Use real-time actual data, never seed/mock data in production paths

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
- **Analysis Pipeline**: Enterprise-grade technical analysis with industry-standard metrics:
  - **LUFS Integration**: Integrated, Short-term (3s), Momentary (400ms) with K-weighting
  - **True Peak (dBTP)**: ≥4× oversampled estimator with peak-hold
  - **LRA (Loudness Range)**: With relative gating per EBU R128 / ITU-R BS.1770-4
  - **Spectral Analysis**: 1/24-octave energy bands, frequency response profiling
  - **Stereo Imaging**: Phase correlation, mid/side ratios, stereo width analysis
- **Data Safety**: Bulletproof parsing with safe number formatting and type validation
- **Real-time Integration**: Seamless connection between file upload and live analysis display
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
  - **Pages**: Landing.tsx, Mastering.tsx, Console.tsx (all with inline README documentation)
  - **Components**: PremasterAnalysis.tsx (enterprise-grade audio analysis), PhaseOneCard.tsx
  - **Analysis**: Real-time audio processing with safe data handling
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