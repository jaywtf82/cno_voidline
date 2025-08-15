# C/No Voidline - Deployment Guide

A comprehensive guide for deploying the AI Audio Mastering Console across different platforms, all using free services.

## Table of Contents

1. [Quick Setup (Local)](#quick-setup-local)
2. [Frontend-Only Deployment](#frontend-only-deployment)
3. [Full-Stack Deployment](#full-stack-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Quick Setup (Local)

Perfect for development and testing without any external dependencies.

### Prerequisites
- Node.js 18+ installed
- Git

### Steps
```bash
# Clone the repository
git clone <your-repo-url>
cd cnvoidline

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure for local development
echo "VITE_REQUIRE_AUTH=false" >> .env
echo "DATABASE_TYPE=memory" >> .env
echo "VITE_AI_PROVIDER=local" >> .env

# Start the application
npm run dev
```

**Access:** http://localhost:3000

**Features Available:**
- ✅ Audio upload and analysis
- ✅ Real-time mastering interface
- ✅ All audio processing features
- ❌ Project saving (memory only)
- ❌ User authentication

---

## Frontend-Only Deployment

Deploy just the frontend for static hosting, with client-side processing only.

### Option 1: GitHub Pages (Free)

#### Setup
```bash
# Install GitHub Pages deployment package
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

#### Configuration
Create `.env.production`:
```env
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
VITE_ENABLE_PROJECT_SAVING=false
DATABASE_TYPE=memory
```

#### Deploy
```bash
# Build and deploy
npm run deploy
```

**Access:** https://yourusername.github.io/cnvoidline

### Option 2: Netlify (Free)

#### Setup via CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init
netlify deploy --prod
```

#### Setup via Git Integration
1. Push code to GitHub
2. Connect repository in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

**Access:** https://your-app-name.netlify.app

### Option 3: Vercel (Free)

#### Setup via CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Setup via Git Integration
1. Connect GitHub repository in Vercel dashboard
2. Configure build settings automatically detected
3. Add environment variables in Vercel dashboard

**Access:** https://your-app-name.vercel.app

---

## Full-Stack Deployment

Deploy both frontend and backend with database support.

### Option 1: Replit (Free)

#### Setup
1. Fork/import repository to Replit
2. Configure `.env` file:
```env
VITE_REQUIRE_AUTH=true
DATABASE_TYPE=postgresql
VITE_AI_PROVIDER=local
DEPLOYMENT_TARGET=replit
```

3. Set up Replit secrets:
   - `DATABASE_URL` (auto-provided by Replit PostgreSQL)
   - `REPL_ID` (auto-provided)
   - `SESSION_SECRET` (generate random string)

#### Deploy
```bash
# Run in Replit console
npm install
npm run db:push
npm run dev
```

**Access:** https://your-repl-name.your-username.replit.app

### Option 2: Railway (Free Tier)

#### Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init
```

#### Configuration
Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

Add environment variables in Railway dashboard:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
```

#### Deploy
```bash
railway deploy
```

**Access:** https://your-app-name.railway.app

### Option 3: Render (Free)

#### Setup
1. Connect GitHub repository in Render dashboard
2. Create new Web Service
3. Configure build command: `npm install && npm run build`
4. Configure start command: `npm start`

#### Database Setup
1. Create PostgreSQL database in Render
2. Copy connection string to environment variables

#### Environment Variables
```env
DATABASE_URL=<render-postgres-url>
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
NODE_ENV=production
```

**Access:** https://your-app-name.onrender.com

### Option 4: Supabase + Vercel

#### Backend: Supabase (Free)
1. Create Supabase project
2. Get database URL from project settings
3. Run database migrations:
```sql
-- Copy schema from shared/schema.ts and run in Supabase SQL editor
```

#### Frontend: Vercel
1. Deploy frontend to Vercel as described above
2. Add environment variables:
```env
VITE_API_URL=https://your-project.supabase.co
DATABASE_URL=postgresql://...supabase.co:5432/postgres
```

**Access:** Frontend on Vercel, API on Supabase

---

## Environment Configuration

### Development
```env
NODE_ENV=development
VITE_REQUIRE_AUTH=false
DATABASE_TYPE=memory
VITE_AI_PROVIDER=local
```

### Production (Frontend Only)
```env
NODE_ENV=production
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
VITE_ENABLE_PROJECT_SAVING=false
```

### Production (Full Stack)
```env
NODE_ENV=production
VITE_REQUIRE_AUTH=true
DATABASE_TYPE=postgresql
DATABASE_URL=your-postgres-url
VITE_AI_PROVIDER=local
```

### AI Provider Options

#### Local Processing (Recommended for Free Hosting)
```env
VITE_AI_PROVIDER=local
```
- No external API costs
- Works offline
- Client-side processing

#### OpenAI (Requires API Key)
```env
VITE_AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4
```

#### Mock/Demo Mode
```env
VITE_AI_PROVIDER=mock
```
- No real processing
- Perfect for demos
- Shows UI without actual AI

---

## Database Options

### Memory (Default for Development)
```env
DATABASE_TYPE=memory
```
- No persistence
- Perfect for testing
- No setup required

### SQLite (Local File Storage)
```env
DATABASE_TYPE=sqlite
SQLITE_PATH=./data/cnvoidline.db
```
- File-based storage
- Good for single-server deployments
- No external dependencies

### PostgreSQL (Production)
```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/db
```
- Full persistence
- Scalable
- Required for multi-user

---

## Troubleshooting

### Common Issues

#### 1. Build Fails on Deployment
**Solution:** Check Node.js version compatibility
```bash
# Ensure Node.js 18+
node --version

# Update if needed
nvm install 18
nvm use 18
```

#### 2. Environment Variables Not Loading
**Solution:** Verify platform-specific configuration
- **Vercel:** Use dashboard or `vercel env`
- **Netlify:** Use dashboard or `netlify.toml`
- **Railway:** Use dashboard or Railway CLI

#### 3. Database Connection Issues
**Solution:** Check connection string format
```bash
# Test PostgreSQL connection
npm run db:test-connection

# Check if tables exist
npm run db:check-schema
```

#### 4. Audio Processing Not Working
**Solution:** Verify AI provider configuration
```env
# For local processing
VITE_AI_PROVIDER=local

# For demo mode
VITE_AI_PROVIDER=mock
```

#### 5. CORS Issues in Production
**Solution:** Configure allowed origins
```javascript
// server/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Getting Help

1. **Check logs:** Each platform provides deployment logs
2. **Test locally:** Reproduce issues in development
3. **Environment validation:** Use provided health check endpoints
4. **Documentation:** Refer to platform-specific guides

### Performance Optimization

#### Frontend
- Enable compression in build
- Use CDN for static assets
- Implement code splitting

#### Backend  
- Use connection pooling for database
- Implement caching for API responses
- Optimize audio processing algorithms

---

## Cost Breakdown

All recommended options are **completely free** for moderate usage:

| Service | Free Tier Limits | Best For |
|---------|------------------|----------|
| GitHub Pages | 1GB storage, 100GB bandwidth | Static frontend |
| Netlify | 100GB bandwidth, 300 build minutes | Full frontend |
| Vercel | 100GB bandwidth, 6000 build seconds | Frontend + serverless |
| Replit | Always-on repl, unlimited bandwidth | Full-stack development |
| Railway | 500 hours/month, 1GB RAM | Full-stack production |
| Render | 750 hours/month, 512MB RAM | Full-stack production |
| Supabase | 500MB database, 2GB bandwidth | Database + API |

**Recommended Combinations:**
- **Development:** Replit (all-in-one)
- **Frontend Only:** GitHub Pages + Local processing
- **Full-Stack:** Railway + PostgreSQL or Render + PostgreSQL
- **Enterprise:** Vercel + Supabase