# C/No Voidline - AI Audio Mastering Console

A professional-grade AI audio mastering console with a cinematic terminal aesthetic, built for musicians and producers who demand precision and style.

## ✨ Features

- **🎵 Real-time Audio Analysis** - Advanced spectral analysis with WaveDNA visualization
- **🤖 AI-Powered Mastering** - Intelligent audio processing with adaptive algorithms
- **🎛️ Professional Interface** - Terminal-inspired design with cinematic aesthetics
- **📊 Advanced Visualizers** - Stereo field radar, phase correlation, and spectrum displays
- **🎯 Multi-Format Export** - Optimized for Club, Streaming, Vinyl, and Radio formats
- **⚡ Configurable Deployment** - Deploy anywhere from static hosting to full-stack platforms

## 🚀 Quick Start

### Local Development (5 minutes)

```bash
# Clone and install
git clone <your-repo-url>
cd cnvoidline
npm install

# Configure for local development
cp .env.example .env
echo "VITE_REQUIRE_AUTH=false" >> .env

# Start the application
npm run dev
```

**Access:** http://localhost:3000

### Deploy to GitHub Pages (Free Forever)

```bash
# Install deployment tools
npm install --save-dev gh-pages

# Add deploy scripts to package.json
npm run deploy
```

**Access:** https://yourusername.github.io/cnvoidline

## 🌍 Deployment Options

| Platform | Cost | Setup Time | Best For |
|----------|------|------------|----------|
| **GitHub Pages** | Free | 5 min | Open source, demos |
| **Netlify** | Free | 10 min | Professional frontend |
| **Vercel** | Free | 10 min | React optimization |
| **Replit** | Free | 5 min | Full-stack development |
| **Railway** | Free | 15 min | Production apps |

**[📖 Full Deployment Guide](./docs/FREE_HOSTING.md)**

## ⚙️ Configuration

The application is highly configurable to support different deployment scenarios:

### Authentication (Optional)
```env
# Disable authentication for open access
VITE_REQUIRE_AUTH=false

# Enable authentication for user accounts
VITE_REQUIRE_AUTH=true
```

### Database Options
```env
# Memory (development/demos)
DATABASE_TYPE=memory

# File-based (single server)
DATABASE_TYPE=sqlite

# PostgreSQL (production)
DATABASE_TYPE=postgresql
```

### AI Processing
```env
# Local processing (free, privacy-focused)
VITE_AI_PROVIDER=local

# OpenAI integration (requires API key)
VITE_AI_PROVIDER=openai

# Demo mode (no actual processing)
VITE_AI_PROVIDER=mock
```

**[📖 Full Configuration Guide](./docs/CONFIGURATION.md)**

## 🎯 Usage

### Upload and Analyze
1. Drag and drop audio files (WAV, MP3, AAC, FLAC, OGG)
2. Watch real-time analysis with spectral visualization
3. Review audio metrics and quality assessment

### AI Mastering
1. Click "Start Mastering Session"
2. Choose mastering target (Club, Streaming, Vinyl, Radio)
3. Adjust parameters or use intelligent presets
4. Export optimized audio

### Project Management
- Save mastering sessions (requires authentication)
- Create custom presets
- Export multiple formats
- Share projects with collaborators

## 🏗️ Architecture

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** with custom terminal theming
- **Web Audio API** for real-time processing
- **Framer Motion** for smooth animations

### Backend (Optional)
- **Express.js** server with TypeScript
- **Drizzle ORM** for type-safe database operations
- **Replit Auth** integration (configurable)
- **PostgreSQL/SQLite** storage options

### Audio Processing
- **Local AI processing** for privacy and cost-effectiveness
- **Real-time spectral analysis** with custom visualizers
- **Multi-format export** with platform optimization
- **Custom mastering algorithms** with adaptive intelligence

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- Git

### Setup
```bash
# Install dependencies
npm install

# Set up development environment
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Database Operations
```bash
# Push schema changes
npm run db:push

# Generate types
npm run db:generate

# View database
npm run db:studio
```

## 📁 Project Structure

```
cnvoidline/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── hooks/       # Custom hooks
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database operations
│   └── auth.ts      # Authentication
├── shared/          # Shared types and schemas
├── docs/            # Documentation
└── .env.example     # Environment template
```

## 🎨 Theming

The application supports multiple terminal-inspired themes:

- **Classic** - Green on black terminal
- **Matrix** - Digital rain aesthetic  
- **Cyberpunk** - Neon pink and blue
- **Retro** - Amber on dark brown

Themes are configurable via user preferences and environment variables.

## 🔒 Security

### Data Privacy
- Local AI processing by default (no data sent to external services)
- Optional authentication with secure session management
- HTTPS enforcement in production environments

### File Security
- File type validation and size limits
- Secure upload handling with virus scanning support
- Content-type verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Audio API** for real-time audio processing
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **Drizzle ORM** for type-safe database operations

## 🔗 Links

- **[Live Demo](https://cnvoidline.vercel.app)** - Try the application
- **[Documentation](./docs/)** - Comprehensive guides
- **[GitHub Issues](https://github.com/yourusername/cnvoidline/issues)** - Bug reports and feature requests
- **[Discord Community](https://discord.gg/your-community)** - Get help and share projects

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/cnvoidline)
![GitHub forks](https://img.shields.io/github/forks/yourusername/cnvoidline)
![GitHub issues](https://img.shields.io/github/issues/yourusername/cnvoidline)
![License](https://img.shields.io/github/license/yourusername/cnvoidline)

---

**Designed and developed by [@dotslashrecords](https://github.com/dotslashrecords)**