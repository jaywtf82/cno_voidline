
# Complete Setup & Deployment Guide for C/No Voidline

## 🚀 One-Click Quick Start

```bash
# Clone and setup in one command
git clone <your-repo-url> && cd cno-voidline && ./scripts/one-click-setup.sh
```

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Local Development](#local-development)
4. [Configuration](#configuration)
5. [Deployment Platforms](#deployment-platforms)
6. [Platform-Specific Guides](#platform-specific-guides)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0+
- **npm**: 8.0+
- **RAM**: 4GB
- **Storage**: 2GB free space

### Recommended
- **Node.js**: 20.0+
- **npm**: 10.0+
- **RAM**: 8GB
- **Storage**: 5GB free space

### Optional (for full-stack deployment)
- **PostgreSQL**: 14+
- **Docker**: 20.0+ (for containerized deployment)
- **Git**: Latest version

## Installation Methods

### Method 1: One-Click Setup Script (Recommended)

```bash
# Make script executable and run
chmod +x scripts/one-click-setup.sh
./scripts/one-click-setup.sh
```

**Features:**
- Interactive menu system
- Automatic dependency installation
- Environment configuration
- Platform-specific setup
- Built-in deployment tools

### Method 2: Manual Setup

```bash
# Install dependencies
npm install

# Create development environment
cp .env.example .env.development

# Build and test
npm run build
npm run dev
```

### Method 3: Using npm Scripts

```bash
# Quick development setup
npm run setup:quick

# Setup with PostgreSQL
npm run setup:postgres

# Frontend-only setup
npm run setup:frontend
```

## Local Development

### Option 1: Memory Storage (Fastest)

```bash
# Start development server with memory storage
npm run dev

# Access application
open http://localhost:5000
```

**Features:**
- No database setup required
- Instant startup
- Perfect for development and testing
- No persistent data storage

### Option 2: PostgreSQL (Production-like)

```bash
# Setup PostgreSQL environment
npm run setup:postgres

# Start with database
npm run dev:local
```

**Features:**
- Persistent data storage
- User authentication
- Production-like environment
- Multi-user support

### Option 3: Custom Configuration

1. **Open Configuration Manager:**
   ```bash
   npm run config
   # Opens config.html in your browser
   ```

2. **Configure your preferences:**
   - Choose deployment platform
   - Set storage backend
   - Configure features and AI
   - Set security options

3. **Generate configuration files:**
   - Download generated configs
   - Apply to your project
   - Start development server

## Configuration

### Environment Files

The application supports multiple environment configurations:

- `.env.development` - Local development with memory storage
- `.env.local` - Local development with PostgreSQL
- `.env.production` - Production deployment
- `.env.staging` - Staging environment

### Configuration Manager

Access the web-based configuration manager at `/config.html`:

```bash
# Open configuration manager
npm run config
```

**Features:**
- Interactive platform selection
- Real-time configuration generation
- Step-by-step setup wizard
- Download complete configuration packages
- Platform-specific deployment instructions

### Manual Configuration

Edit environment files directly:

```env
# .env.production
NODE_ENV=production
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
VITE_DEPLOYMENT_TARGET=github-pages
```

## Deployment Platforms

### Free Hosting Options

| Platform | Setup Time | Features | Best For |
|----------|------------|----------|----------|
| **GitHub Pages** | 5 min | Static hosting, custom domains | Open source projects |
| **Netlify** | 5 min | CI/CD, form handling, edge functions | Modern web apps |
| **Vercel** | 5 min | Serverless functions, analytics | React applications |
| **Replit** | 3 min | Full-stack hosting, built-in database | Development & prototyping |
| **Railway** | 10 min | PostgreSQL, custom domains | Full-stack applications |
| **Render** | 10 min | Auto-deployment, SSL certificates | Production applications |

### Quick Deployment Commands

```bash
# Deploy to GitHub Pages
npm run deploy:github

# Deploy to Netlify
npm run deploy:netlify

# Deploy to Vercel
npm run deploy:vercel

# Use interactive deployment menu
npm run deploy
```

## Platform-Specific Guides

### GitHub Pages

**Setup:**
1. Enable GitHub Pages in repository settings
2. Choose "GitHub Actions" as source
3. Push to main branch (auto-deployment)

**Manual Deployment:**
```bash
# Install gh-pages
npm install -g gh-pages

# Deploy
npm run deploy:github
```

**Custom Domain:**
1. Add CNAME file to public folder
2. Configure DNS records
3. Enable HTTPS in GitHub settings

### Netlify

**Setup via Git:**
1. Connect repository in Netlify dashboard
2. Set build command: `npm run build:netlify`
3. Set publish directory: `dist`
4. Configure environment variables

**CLI Deployment:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
npm run deploy:netlify
```

**Environment Variables:**
- `NODE_ENV=production`
- `VITE_STORAGE_BACKEND=memory`
- `VITE_AI_PROVIDER=local`

### Vercel

**Setup via Git:**
1. Import repository in Vercel dashboard
2. Framework auto-detected (Vite)
3. Configure environment variables
4. Deploy automatically on push

**CLI Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run deploy:vercel
```

**Configuration:**
- Build command: `npm run build:vercel`
- Output directory: `dist`
- Node.js version: 20.x

### Replit

**Setup:**
1. Import GitHub repository
2. Configure environment variables in Secrets
3. Click Run button to start

**Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
VITE_STORAGE_BACKEND=postgresql
VITE_REQUIRE_AUTH=true
```

**Deployment:**
1. Use Deployments tab
2. Choose deployment type (Autoscale recommended)
3. Configure custom domain (optional)

### Hugging Face Spaces

**Setup:**
1. Create new Space at [huggingface.co](https://huggingface.co/new-space)
2. Choose "Static" SDK
3. Upload built files
4. Configure README.md with metadata

**Configuration:**
```yaml
---
title: C/No Voidline
emoji: 🎵
colorFrom: green
colorTo: cyan
sdk: static
pinned: false
---
```

## Advanced Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t cno-voidline .

# Run container
docker run -p 5000:5000 cno-voidline
```

### Docker Compose

```bash
# Start full stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Custom Server Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Copy files to server:**
   ```bash
   scp -r dist/* user@server:/var/www/html/
   ```

3. **Configure web server (Nginx example):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Environment Variables Reference

### Application Settings
```env
NODE_ENV=production|development|staging
VITE_APP_NAME=cno-voidline
VITE_DEPLOYMENT_TARGET=platform_name
VITE_BASE_URL=https://your-domain.com
```

### Storage Configuration
```env
VITE_STORAGE_BACKEND=memory|sqlite|postgresql
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Feature Toggles
```env
VITE_REQUIRE_AUTH=true|false
VITE_AI_PROVIDER=local|openai|anthropic|mock
VITE_MAX_FILE_SIZE_MB=100
VITE_ENABLE_ANALYTICS=true|false
VITE_ENABLE_EXPORT=true|false
```

### Security Settings
```env
SESSION_TIMEOUT_MINUTES=60
CORS_ORIGINS=https://domain.com,https://app.domain.com
ENABLE_RATE_LIMITING=true|false
ENABLE_HTTPS=true|false
```

### Performance Optimization
```env
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_COMPRESSION=true
VITE_MINIFY=true
```

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Or use different port
PORT=3000 npm run dev
```

#### Environment Variables Not Loading
1. Check file name (`.env.production` not `.env.prod`)
2. Verify VITE_ prefix for client-side variables
3. Restart development server
4. Check for syntax errors in .env file

#### Database Connection Issues
```bash
# Test PostgreSQL connection
npm run db:test

# Check if PostgreSQL is running
systemctl status postgresql  # Linux
brew services list postgresql  # macOS
```

#### Memory Issues During Build
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Performance Issues

#### Slow Build Times
1. Clear node_modules cache
2. Use npm ci instead of npm install
3. Enable parallel builds
4. Optimize bundle configuration

#### Large Bundle Size
1. Run bundle analyzer: `npm run build && npx webpack-bundle-analyzer dist`
2. Enable code splitting
3. Remove unused dependencies
4. Use dynamic imports

### Getting Help

1. **Check logs:** Look for error messages in console
2. **Verify setup:** Run `npm run health` to check server status
3. **Documentation:** Review platform-specific guides
4. **Community:** Check GitHub Issues and Discussions
5. **Support:** Contact maintainers for complex issues

## Best Practices

### Development
- Use memory storage for development
- Enable hot reloading
- Use TypeScript for type safety
- Follow ESLint rules

### Production
- Use PostgreSQL for persistence
- Enable compression and minification
- Set up monitoring and analytics
- Use HTTPS everywhere

### Security
- Never commit API keys
- Use environment variables for secrets
- Enable CORS restrictions
- Implement rate limiting

### Performance
- Optimize images and assets
- Use CDN for static files
- Enable caching headers
- Monitor bundle size

---

This guide provides comprehensive instructions for setting up and deploying C/No Voidline across multiple platforms. For the most up-to-date information, check the repository documentation and release notes.
