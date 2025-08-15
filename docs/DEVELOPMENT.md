
# C/No Voidline - Development Documentation

## Project Overview

C/No Voidline is a professional-grade AI audio mastering console with a cinematic, terminal aesthetic. The application provides real-time audio analysis, AI-powered mastering algorithms, and comprehensive preset management with advanced visualizers.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom terminal theme system
- **Component Library**: shadcn/ui with custom terminal-styled extensions
- **State Management**: Zustand for client-side state management
- **Animations**: Framer Motion for GPU-optimized animations
- **Query Management**: TanStack Query for server state synchronization
- **Audio Processing**: Web Audio API with custom AudioWorklets

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js with custom middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Vite**: Development server with HMR

## Project Structure

```
├── client/src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base shadcn/ui components
│   │   ├── controls/       # Audio control components (Fader, Knob)
│   │   ├── visualizers/    # Audio visualization components
│   │   ├── meters/         # Level and analysis meters
│   │   ├── effects/        # Visual effects (GlitchWord)
│   │   └── presets/        # Preset management components
│   ├── pages/              # Main application pages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and stores
│   ├── modules/            # Core business logic
│   │   ├── audio/          # Audio processing engine
│   │   └── presets/        # Preset management
│   └── App.tsx             # Main application component
├── server/                 # Backend API and services
├── shared/                 # Shared types and schemas
└── docs/                   # Documentation
```

## Development Workflow

### Local Development Setup

1. **Prerequisites**:
   - Node.js 20+
   - PostgreSQL database
   - Replit account for authentication

2. **Environment Variables**:
   ```bash
   PORT=5000
   DATABASE_URL=postgresql://...
   REPLIT_AUTH_CLIENT_ID=...
   REPLIT_AUTH_CLIENT_SECRET=...
   SESSION_SECRET=...
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```

### Code Organization Standards

#### Component Structure
```typescript
// Component file organization
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/lib/stores/audioStore";

interface ComponentProps {
  // Props interface
}

export function Component({ ...props }: ComponentProps) {
  // Component implementation
}
```

#### Store Structure (Zustand)
```typescript
interface StoreState {
  // State interface
}

interface StoreActions {
  // Actions interface
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  // Store implementation
}));
```

#### API Route Structure
```typescript
app.get('/api/resource', isAuthenticated, async (req: any, res) => {
  try {
    // Route implementation
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error message" });
  }
});
```

### Theme System Architecture

The application uses a dynamic theme system with four variants:
- **Classic**: Green terminal aesthetic
- **Matrix**: Digital rain green theme
- **Cyberpunk**: Neon blue/cyan theme
- **Retro**: Orange/amber vintage theme

#### Theme Implementation
```typescript
// Theme switching mechanism
const { theme, setTheme } = useTheme();

// CSS custom properties for theming
:root[data-theme="classic"] {
  --theme-primary: #3FB950;
  --theme-glow: rgba(63, 185, 80, 0.4);
}
```

### Audio Processing Architecture

#### Core Components
1. **AudioEngine**: Main audio processing coordinator
2. **AnalysisEngine**: Real-time audio analysis (LUFS, dBTP, LRA)
3. **MasteringProcessor**: DSP chain implementation
4. **AudioWorklets**: Low-latency audio processing

#### Processing Flow
```
Audio Input → Analysis → Processing → Visualization → Output
```

#### Key Metrics
- **LUFS**: Loudness Units relative to Full Scale
- **dBTP**: True Peak level detection
- **LRA**: Loudness Range Analysis
- **Phase Correlation**: Stereo field analysis
- **Voidline Score**: Proprietary quality scoring

### Database Schema

#### Core Tables
```sql
-- Users table with Replit Auth integration
users (id, replit_id, username, email, created_at, updated_at)

-- User preferences and settings
user_preferences (user_id, theme, default_export_format, settings)

-- Audio projects with processing parameters
projects (id, user_id, name, audio_data, parameters, created_at)

-- Mastering presets (built-in and user-created)
presets (id, name, category, parameters, user_id, is_public, usage_count)

-- Export configurations for different platforms
export_targets (id, name, format, platform_specs, created_at)
```

### API Endpoints

#### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate Replit Auth flow
- `POST /api/logout` - End user session

#### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Presets
- `GET /api/presets` - List available presets
- `POST /api/presets` - Create custom preset
- `GET /api/presets/built-in` - Get built-in presets

### Testing Strategy

#### Component Testing
```typescript
// Example test structure
describe('AudioControl', () => {
  it('should render with correct initial state', () => {
    render(<AudioControl />);
    expect(screen.getByTestId('audio-control')).toBeInTheDocument();
  });
});
```

#### Integration Testing
- API endpoint testing with supertest
- Database operations testing
- Authentication flow testing

### Performance Considerations

#### Audio Processing
- Use AudioWorklets for real-time processing
- Implement efficient FFT algorithms
- Minimize audio buffer copying
- Optimize visualization rendering

#### UI Performance
- Use Framer Motion's GPU-accelerated animations
- Implement virtual scrolling for large lists
- Lazy load heavy components
- Optimize re-renders with React.memo

### Deployment

#### Build Process
```bash
npm run build    # Build client and server
npm run start    # Start production server
```

#### Environment Configuration
- Production builds use optimized Vite bundling
- Server-side rendering for initial page load
- Static asset optimization and caching

### Security Considerations

#### Authentication
- Secure session management with PostgreSQL
- CSRF protection on state-changing requests
- Secure cookie configuration

#### Data Protection
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- User data isolation and access control

### Monitoring and Debugging

#### Development Tools
- React DevTools for component inspection
- Zustand DevTools for state debugging
- Web Audio Inspector for audio analysis

#### Error Handling
- Global error boundaries for React components
- Structured error logging on server
- User-friendly error messages

### Contributing Guidelines

#### Code Standards
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper JSDoc comments for functions
- Include tests for new features

#### Git Workflow
- Feature branches from main
- Descriptive commit messages
- Code review required for merges

### Future Enhancements

#### Planned Features
- Real-time collaboration on projects
- Advanced AI mastering algorithms
- Plugin system for custom processors
- Mobile application companion

#### Technical Debt
- Migrate to newer React patterns
- Optimize bundle size
- Improve test coverage
- Enhance accessibility features
