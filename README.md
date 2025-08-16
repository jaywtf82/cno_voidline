# C/No Voidline - AI Audio Mastering Console

🎵 Professional-grade AI audio mastering console with a cinematic, terminal aesthetic.

![C/No Voidline](https://img.shields.io/badge/C%2FNo%20Voidline-AI%20Audio%20Mastering-22c55e?style=for-the-badge&logo=audio-technica)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)

## ✨ Quick Start

### 🚀 One-Command Setup
```bash
# Clone and start immediately
npm run quick-start
```
> Requires Docker. If Docker isn't available, use the manual setup steps below.

### 📦 Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Run setup script
npm run setup

# 3. Start development server
npm run dev
```

## 🎯 What's Included

### 🔧 **Complete Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Replit Auth (configurable)

### 🚀 **Deployment Ready**
- GitHub Pages workflow included
- Multi-platform deployment scripts
- Docker configuration
- Static site generation support

### ⚙️ **Configuration Management**
- Web-based configuration interface (`config.html`)
- Environment-specific setups
- Multiple deployment targets
- Database migration scripts

## 🎵 Features

- **Real-time Audio Analysis** - Industry-standard LUFS, dBTP, LRA metrics
- **AI-Powered Mastering** - Advanced neural network processing
- **Professional Visualizers** - Spectrum analysis, stereo imaging, phase correlation
- **Multi-Format Export** - Club, Streaming, Vinyl, Radio presets
- **Terminal Aesthetic** - Four themes: Classic, Matrix, Cyberpunk, Retro
- **Preset Management** - Built-in and custom presets with usage tracking

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run quick-start` | Interactive setup and start menu |
| `npm run dev` | Development server (memory storage) |
| `npm run dev:local` | Development server (PostgreSQL) |
| `npm run build` | Production build |
| `npm run deploy` | Interactive deployment tool |
| `npm run setup` | Complete project setup |
| `npm run docker:compose` | Run with Docker Compose |

## 📋 Requirements

- **Node.js** 18+
- **npm** 8+
- **PostgreSQL** (optional, for persistent storage)
- **Docker** (optional, for containerized deployment)

## 🗂️ Project Structure

```
C/No Voidline/
├── client/               # React frontend
├── server/               # Express backend
├── shared/               # Shared types and schemas
├── scripts/              # Setup and deployment scripts
├── docs/                 # Documentation
├── .github/workflows/    # CI/CD workflows
├── config.html          # Web configuration manager
└── attached_assets/      # Static assets
```

## 🚀 Deployment Options

### GitHub Pages
```bash
npm run deploy:github
```

### Netlify
```bash
npm run deploy:netlify
```

### Vercel
```bash
npm run deploy:vercel
```

### Docker
```bash
npm run docker:compose
```

## ⚙️ Configuration

### Environment Variables
- `.env.development` - Development with memory storage
- `.env.local` - Local development with PostgreSQL  
- `.env.production` - Production configuration

### Web Configuration Manager
Open `config.html` in your browser for a visual configuration interface that generates all necessary config files.

## 🗄️ Database Setup

### PostgreSQL (Recommended)
```bash
# 1. Set up database URL in .env.local
DATABASE_URL=postgresql://user:password@host:port/database

# 2. Push schema to database
npm run db:push
```

### Memory Storage (Development)
```bash
# Uses in-memory storage (data lost on restart)
npm run dev:memory
```

## 🔐 Security Features

- **Authentication** - Configurable Replit Auth or anonymous mode
- **Session Management** - Secure PostgreSQL-backed sessions
- **Rate Limiting** - API endpoint protection
- **CORS Configuration** - Configurable cross-origin settings
- **Input Validation** - Zod schema validation throughout

## 🎨 Theming

Four built-in themes:
- **Classic Terminal** - Green on black, retro computing
- **Matrix** - Bright green matrix-style
- **Cyberpunk** - Pink/purple neon aesthetics  
- **Retro** - Amber terminal colors

## 📖 Documentation

- [Setup Guide](SETUP.md) - Detailed installation instructions
- [Configuration Guide](docs/CONFIGURATION.md) - Environment and deployment config
- [Deployment Guide](docs/DEPLOYMENT.md) - Platform-specific deployment
- [Build Audit](docs/AUDIT.md) - Tooling versions and known issues
- [Development Guide](docs/DEVELOPMENT.md) - Development workflow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎵 About

C/No Voidline is a professional AI audio mastering console designed for modern music production. Built with cutting-edge web technologies and featuring a distinctive terminal aesthetic inspired by classic computing interfaces.

**Designed and developed by [@dotslashrecords]**

---

🚀 **Ready to master your audio?** Run `npm run quick-start` to get started!