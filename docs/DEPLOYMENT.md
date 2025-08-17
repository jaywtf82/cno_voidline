
# C/No Voidline - Deployment Guide

> **Updated 2025** – Production-grade AI Audio Mastering Console deployment guide with optimized platform combinations.

A comprehensive guide for deploying the AI Audio Mastering Console across different platforms, focusing on high-performance full-stack solutions.

## Table of Contents

1. [Recommended Full-Stack Combinations](#recommended-full-stack-combinations)
2. [Platform-Specific Setup](#platform-specific-setup)
3. [Environment Configuration](#environment-configuration)
4. [Performance Optimization](#performance-optimization)
5. [Troubleshooting](#troubleshooting)

---

## Recommended Full-Stack Combinations

### 🥇 Primary: Railway + Supabase
**Best for: Production applications, real-time audio processing**

**Railway Advantages:**
- Always-on hosting (no cold starts)
- Excellent Node.js performance
- Automatic SSL/HTTPS
- Built-in CI/CD from Git
- Resource scaling

**Supabase Advantages:**
- Real-time PostgreSQL
- Built-in authentication
- Edge functions
- File storage for audio
- Real-time subscriptions

**Setup Time:** 15 minutes
**Monthly Cost:** Free tier covers most usage

### 🥈 Alternative: Render + PlanetScale
**Best for: High-availability applications**

**Render Advantages:**
- Auto-scaling web services
- Background jobs support
- Persistent disks available
- DDoS protection

**PlanetScale Advantages:**
- Serverless MySQL
- Database branching
- Connection pooling
- Global read replicas

### 🥉 Budget: Netlify + Supabase
**Best for: Serverless-first approach**

**Netlify Advantages:**
- Edge functions worldwide
- Form handling
- Split testing
- Deploy previews

---

## Platform-Specific Setup

### Railway + Supabase Setup

#### 1. Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init
```

Configuration:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  },
  "variables": {
    "NODE_ENV": "production",
    "PORT": "5000",
    "DATABASE_URL": "${{Postgres.DATABASE_URL}}"
  }
}
```

#### 2. Supabase Setup
1. Create project at supabase.com
2. Get database URL and anon key
3. Run migrations:
```sql
-- Audio sessions table
CREATE TABLE audio_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  filename VARCHAR(255) NOT NULL,
  original_audio BYTEA,
  processed_audio BYTEA,
  analysis_data JSONB,
  preset_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presets table
CREATE TABLE user_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  parameters JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Render + PlanetScale Setup

#### 1. Render Setup
```yaml
# render.yaml
services:
  - type: web
    name: cno-voidline
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: cno-voidline-db
          property: connectionString
```

#### 2. PlanetScale Setup
```bash
# Install PlanetScale CLI
curl -fsSL https://raw.githubusercontent.com/planetscale/cli/main/install.sh | sh

# Create database
pscale database create cno-voidline

# Create branch and deploy
pscale branch create cno-voidline main
pscale deploy-request create cno-voidline main
```

---

## Environment Configuration

### Production Environment Variables

#### Core Application
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=your-postgres-url
DATABASE_TYPE=postgresql

# Authentication
VITE_REQUIRE_AUTH=true
SESSION_SECRET=your-32-char-random-string

# AI Processing
VITE_AI_PROVIDER=local
VITE_MAX_FILE_SIZE_MB=200

# Performance
VITE_ENABLE_COMPRESSION=true
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true

# Security
CORS_ORIGINS=https://your-domain.com
ENABLE_RATE_LIMITING=true
ENABLE_HTTPS=true
```

#### Audio Processing Optimizations
```env
# Audio Engine Settings
AUDIO_BUFFER_SIZE=4096
SAMPLE_RATE=44100
BIT_DEPTH=24

# AI Model Configuration
AI_MODEL_PRECISION=float32
ENABLE_GPU_ACCELERATION=true
WORKLET_THREAD_COUNT=4

# Caching
ENABLE_ANALYSIS_CACHE=true
CACHE_DURATION_MINUTES=30
```

#### Real-time Features
```env
# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
MAX_CONNECTIONS_PER_IP=10

# Real-time Analysis
ENABLE_LIVE_METERS=true
METER_UPDATE_RATE=60
SPECTRUM_FFT_SIZE=2048
```

---

## Performance Optimization

### Railway Optimizations

#### 1. Resource Allocation
```json
{
  "resources": {
    "cpu": "2000m",
    "memory": "2048Mi"
  },
  "scaling": {
    "minReplicas": 1,
    "maxReplicas": 5
  }
}
```

#### 2. Health Checks
```javascript
// server/health.js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

### Database Optimizations

#### 1. Connection Pooling
```javascript
// server/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 2. Indexes for Audio Queries
```sql
-- Optimize session queries
CREATE INDEX idx_audio_sessions_user_created ON audio_sessions(user_id, created_at DESC);
CREATE INDEX idx_audio_sessions_preset ON audio_sessions(preset_id);

-- Optimize preset queries
CREATE INDEX idx_user_presets_public ON user_presets(is_public, created_at DESC);
```

---

## Monitoring and Logging

### Application Monitoring
```javascript
// server/monitoring.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});
```

### Error Tracking
```javascript
// server/errorHandler.js
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});
```

---

## Cost Analysis

### Railway + Supabase
- **Railway**: $5/month for starter plan (includes custom domain)
- **Supabase**: Free tier up to 500MB database
- **Total**: $5/month for production app

### Render + PlanetScale  
- **Render**: Free tier available, $7/month for starter
- **PlanetScale**: $29/month for production branch
- **Total**: $29-36/month

### Netlify + Supabase
- **Netlify**: Free tier, $19/month for pro features
- **Supabase**: Free tier up to 500MB database
- **Total**: Free to $19/month

---

## Deployment Commands

### Railway Deployment
```bash
# Deploy to Railway
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=$DATABASE_URL

# View logs
railway logs
```

### Render Deployment
```bash
# Deploy via Git push (automatic)
git push origin main

# Or manual deploy
curl -X POST "https://api.render.com/v1/services/YOUR_SERVICE_ID/deploys" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

This setup provides enterprise-grade performance with real-time capabilities perfect for your AI audio mastering application.
