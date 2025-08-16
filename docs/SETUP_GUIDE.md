# C/No Voidline - Complete Setup and Configuration Guide

> **2025-08-16** – Added audit reference and noted Docker requirement for quick-start. See `docs/AUDIT.md`.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [AI Model Setup](#ai-model-setup)
5. [Authentication Setup](#authentication-setup)
6. [Production Deployment](#production-deployment)
7. [GitHub Pages Frontend Deployment](#github-pages-frontend-deployment)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: v18.0+ (LTS recommended)
- **npm**: v9.0+ or **yarn**: v1.22+
- **PostgreSQL**: v14+ (for production)
- **Python**: v3.9+ (for AI model training)
- **Git**: Latest version
- **Docker**: v20.0+ (optional, for containerized deployment)

### Hardware Requirements
- **CPU**: 4+ cores (8+ recommended for AI processing)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 10GB+ free space
- **GPU**: Optional but recommended for AI model training

## Local Development Setup

### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/dotslashrecords/c-no-voidline.git
cd c-no-voidline

# Install dependencies
npm install

# Install AI/ML dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Development Environment Variables
```env
# Application
NODE_ENV=development
PORT=5000
VITE_APP_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/voidline_dev
PGHOST=localhost
PGPORT=5432
PGUSER=voidline_user
PGPASSWORD=your_secure_password
PGDATABASE=voidline_dev

# Authentication (Replit Auth)
REPLIT_APP_ID=your_replit_app_id
REPLIT_APP_SECRET=your_replit_app_secret
SESSION_SECRET=your_super_secure_session_secret

# AI Model Configuration
AI_MODEL_PATH=./models/voidline_model.tflite
AI_WEIGHTS_PATH=./models/weights/
ENABLE_GPU_ACCELERATION=false
MODEL_CACHE_SIZE=512MB

# External Services
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=voidline-audio-storage
CDN_URL=https://cdn.voidline.com
```

### 4. Start Development Server
```bash
# Start the application
npm run dev

# The application will be available at:
# Frontend: http://localhost:5000
# API: http://localhost:5000/api
```

## Database Configuration

### 1. PostgreSQL Installation

#### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from [PostgreSQL Official Site](https://www.postgresql.org/download/windows/)

### 2. Database Setup
```bash
# Connect to PostgreSQL
psql postgres

# Create user and database
CREATE USER voidline_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE voidline_dev OWNER voidline_user;
GRANT ALL PRIVILEGES ON DATABASE voidline_dev TO voidline_user;

# Exit PostgreSQL
\q
```

### 3. Run Database Migrations
```bash
# Generate and run migrations
npm run db:generate
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

### 4. Database Schema Verification
```bash
# Connect to your database
psql postgresql://voidline_user:your_secure_password@localhost:5432/voidline_dev

# List tables
\dt

# Verify schema
\d users
\d projects
\d presets
```

## AI Model Setup

### 1. Model Dependencies
```bash
# Install Python dependencies for AI model
pip install tensorflow==2.13.0
pip install librosa==0.10.1
pip install numpy==1.24.3
pip install scipy==1.11.1
pip install soundfile==0.12.1
```

### 2. Download Pre-trained Models
```bash
# Create models directory
mkdir -p models/weights

# Download base model (placeholder - replace with actual model)
wget https://releases.voidline.com/models/voidline-base-v1.0.tflite -O models/voidline_model.tflite

# Download model weights
wget https://releases.voidline.com/models/weights/base_weights.bin -O models/weights/base_weights.bin
```

### 3. Model Training Setup (Optional)
```bash
# Create training environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install training dependencies
pip install -r training/requirements.txt

# Prepare training data
python training/prepare_dataset.py --input_dir /path/to/audio/files --output_dir ./training_data

# Start training
python training/train_model.py --config training/config.yaml
```

### 4. Model Validation
```bash
# Test model inference
python scripts/test_model.py --model models/voidline_model.tflite --test_audio test/sample.wav

# Benchmark performance
python scripts/benchmark.py --model models/voidline_model.tflite
```

## Authentication Setup

### 1. Replit Auth Configuration

#### Get Replit Auth Credentials
1. Visit [Replit Apps](https://replit.com/apps)
2. Create a new app or use existing
3. Note down `App ID` and `App Secret`

#### Configure Environment
```env
REPLIT_APP_ID=your_app_id_here
REPLIT_APP_SECRET=your_app_secret_here
```

### 2. Session Configuration
```bash
# Generate secure session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to environment
SESSION_SECRET=your_generated_secret_here
```

### 3. Test Authentication
```bash
# Start the server
npm run dev

# Visit http://localhost:5000/api/login
# Should redirect to Replit OAuth
```

## Production Deployment

### 1. Environment Setup
```env
# Production environment
NODE_ENV=production
PORT=8080
VITE_APP_URL=https://your-domain.com

# Production database
DATABASE_URL=postgresql://user:pass@production-db:5432/voidline_prod

# Security
SESSION_SECRET=your_production_session_secret
ENABLE_HTTPS=true
SECURE_COOKIES=true
```

### 2. Build for Production
```bash
# Build the application
npm run build

# Test production build locally
npm run preview
```

### 3. Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "start"]
```

```bash
# Build and run Docker container
docker build -t voidline:latest .
docker run -p 8080:8080 --env-file .env voidline:latest
```

### 4. Cloud Platform Deployment

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set DATABASE_URL=your_database_url
heroku config:set SESSION_SECRET=your_session_secret

# Deploy
git push heroku main
```

## GitHub Pages Frontend Deployment

### 1. Frontend-Only Build Configuration

Create `vite.config.github.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/c-no-voidline/', // Replace with your repo name
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify('https://your-backend-api.com'),
  },
});
```

### 2. GitHub Actions Workflow

Create `.github/workflows/deploy-gh-pages.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build for GitHub Pages
      run: npm run build:github
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
        cname: your-custom-domain.com  # Optional
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "build:github": "vite build --config vite.config.github.ts",
    "preview:github": "vite preview --config vite.config.github.ts"
  }
}
```

### 4. Frontend Environment Configuration

Create `client/src/config/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: `${API_BASE_URL}/api/auth`,
    projects: `${API_BASE_URL}/api/projects`,
    presets: `${API_BASE_URL}/api/presets`,
    mastering: `${API_BASE_URL}/api/mastering`,
  },
};
```

### 5. Static API Fallback for Demo

Create `client/src/lib/demo-data.ts`:
```typescript
// Demo data for GitHub Pages deployment (when backend is not available)
export const DEMO_MODE = !import.meta.env.VITE_API_URL;

export const mockApiResponses = {
  '/api/auth/user': { id: 'demo', email: 'demo@voidline.com', name: 'Demo User' },
  '/api/presets': [
    { id: 1, name: 'CLUB_MASTER', category: 'Club', description: 'High energy club master' },
    { id: 2, name: 'VINYL_WARM', category: 'Vinyl', description: 'Warm vinyl simulation' },
  ],
  // Add more mock responses as needed
};
```

### 6. Deploy to GitHub Pages

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - Save

2. **Set Repository Secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Add: `VITE_API_URL` with your backend URL

3. **Push to Deploy**:
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

4. **Access Your Site**:
   - Visit: `https://yourusername.github.io/c-no-voidline/`

## Environment Variables

### Complete Environment Variables List
```env
# Application Configuration
NODE_ENV=development|production
PORT=5000
VITE_APP_URL=http://localhost:5000

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:port/dbname
PGHOST=localhost
PGPORT=5432
PGUSER=voidline_user
PGPASSWORD=secure_password
PGDATABASE=voidline_dev

# Authentication
REPLIT_APP_ID=your_replit_app_id
REPLIT_APP_SECRET=your_replit_app_secret
SESSION_SECRET=your_session_secret

# AI Model Configuration
AI_MODEL_PATH=./models/voidline_model.tflite
AI_WEIGHTS_PATH=./models/weights/
ENABLE_GPU_ACCELERATION=false
MODEL_CACHE_SIZE=512
INFERENCE_BATCH_SIZE=32

# Storage and CDN
STORAGE_PROVIDER=local|s3|gcs
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=voidline-storage
CDN_URL=https://cdn.voidline.com

# Redis (for caching and sessions)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_password

# Monitoring and Logging
LOG_LEVEL=info|debug|error
SENTRY_DSN=your_sentry_dsn
ENABLE_ANALYTICS=true

# Security
ENABLE_RATE_LIMITING=true
CORS_ORIGINS=http://localhost:3000,https://voidline.com
CSRF_SECRET=csrf_secret_key

# Feature Flags
ENABLE_AI_LEARNING=true
ENABLE_REAL_TIME_PROCESSING=true
ENABLE_CLOUD_STORAGE=false
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql postgresql://user:pass@localhost:5432/dbname

# Common fixes:
# - Verify credentials
# - Check if PostgreSQL is running
# - Verify database exists
# - Check firewall settings
```

#### 2. AI Model Loading Issues
```bash
# Check model file exists
ls -la models/voidline_model.tflite

# Verify model format
python -c "import tensorflow as tf; print(tf.lite.Interpreter(model_path='models/voidline_model.tflite'))"

# Common fixes:
# - Download correct model version
# - Check file permissions
# - Verify Python dependencies
```

#### 3. Authentication Issues
```bash
# Test Replit Auth endpoint
curl -I https://replit.com/api/oauth2/token

# Check environment variables
echo $REPLIT_APP_ID
echo $REPLIT_APP_SECRET

# Common fixes:
# - Verify Replit app configuration
# - Check redirect URLs
# - Validate environment variables
```

#### 4. Build/Deployment Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Verify build output
npm run build
ls -la dist/
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for better query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_presets_category ON presets(category);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

#### 2. AI Model Optimization
```bash
# Quantize model for better performance
python scripts/quantize_model.py --input models/voidline_model.h5 --output models/voidline_model_int8.tflite

# Enable GPU acceleration (if available)
export ENABLE_GPU_ACCELERATION=true
```

#### 3. Frontend Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze

# Enable gzip compression
# (handled by production server)
```

### Getting Help

1. **Documentation**: Check the `/docs` folder for detailed guides
2. **Issues**: Report bugs on GitHub Issues
3. **Discussions**: Join GitHub Discussions for questions
4. **Support**: Contact [@dotslashrecords] for technical support

---

**Note**: This setup guide is continuously updated. Check the repository for the latest version and community contributions.