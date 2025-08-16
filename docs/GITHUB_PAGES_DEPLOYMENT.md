# GitHub Pages Deployment Guide for C/No Voidline

> **2025-08-16** – Clarified tooling audit and quick-start script availability. See `docs/AUDIT.md`.

## Overview

This guide provides step-by-step instructions for deploying the C/No Voidline frontend to GitHub Pages, including backend API setup, CI/CD configuration, and custom domain setup.

## Architecture Overview

```
Frontend (GitHub Pages) ↔ Backend API (Cloud Platform) ↔ Database ↔ AI Model
```

## Prerequisites

- GitHub repository with the C/No Voidline code
- Backend API deployed on a cloud platform (Vercel, Railway, Heroku, etc.)
- Basic knowledge of Git and GitHub Actions

## Step 1: Backend API Deployment

### Option A: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy the backend
cd your-project-directory
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: c-no-voidline-api
# - Directory: ./
# - Override settings? No

# Add environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add REPLIT_APP_ID
vercel env add REPLIT_APP_SECRET

# Deploy to production
vercel --prod
```

### Option B: Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set DATABASE_URL=your_database_url
railway variables set SESSION_SECRET=your_session_secret
railway variables set REPLIT_APP_ID=your_replit_app_id
railway variables set REPLIT_APP_SECRET=your_replit_app_secret

# Deploy
railway up
```

### Option C: Deploy to Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create c-no-voidline-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SESSION_SECRET=your_session_secret
heroku config:set REPLIT_APP_ID=your_replit_app_id
heroku config:set REPLIT_APP_SECRET=your_replit_app_secret

# Deploy
git push heroku main
```

## Step 2: Frontend Configuration for GitHub Pages

### 1. Create GitHub Pages Build Configuration

Create `vite.config.github.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/c-no-voidline/', // Replace with your repository name
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          audio: ['./src/lib/audio/aiMasteringCore'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
    'process.env.VITE_GITHUB_PAGES': JSON.stringify('true'),
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
});
```

### 2. Update Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:github": "vite build --config vite.config.github.ts",
    "preview:github": "vite preview --config vite.config.github.ts",
    "deploy:github": "npm run build:github && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.0.0"
  }
}
```

### 3. Create API Configuration

Create `client/src/config/api.ts`:

```typescript
const isGitHubPages = import.meta.env.VITE_GITHUB_PAGES === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  isGitHubPages,
  endpoints: {
    auth: `${API_BASE_URL}/api/auth`,
    projects: `${API_BASE_URL}/api/projects`,
    presets: `${API_BASE_URL}/api/presets`,
    mastering: `${API_BASE_URL}/api/mastering`,
    upload: `${API_BASE_URL}/api/upload`,
  },
  cors: {
    credentials: 'include',
    mode: 'cors' as RequestMode,
  },
};

// Demo mode for when backend is not available
export const DEMO_MODE = !API_BASE_URL || API_BASE_URL.includes('localhost');
```

### 4. Update API Client

Create `client/src/lib/api-client.ts`:

```typescript
import { API_CONFIG, DEMO_MODE } from '@/config/api';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Return demo data if in demo mode
    if (DEMO_MODE) {
      return this.getDemoData<T>(endpoint);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors',
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getDemoData<T>(endpoint: string): T {
    // Demo data for GitHub Pages
    const demoResponses: Record<string, any> = {
      '/api/auth/user': {
        id: 'demo-user',
        email: 'demo@voidline.com',
        name: 'Demo User',
      },
      '/api/presets': [
        {
          id: '1',
          name: 'CLUB_MASTER',
          category: 'Club',
          description: 'High energy club master',
          parameters: {
            harmonicBoost: 75,
            subweight: 80,
            transientPunch: 90,
            airlift: 60,
            spatialFlux: 70,
          },
        },
        {
          id: '2',
          name: 'VINYL_WARM',
          category: 'Vinyl',
          description: 'Warm vinyl simulation',
          parameters: {
            harmonicBoost: 45,
            subweight: 60,
            transientPunch: 40,
            airlift: 85,
            spatialFlux: 55,
          },
        },
      ],
      '/api/projects': [],
    };

    return demoResponses[endpoint] as T;
  }

  // API methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

## Step 3: GitHub Actions Workflow

Create `.github/workflows/deploy-gh-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

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
        VITE_GITHUB_PAGES: 'true'

    - name: Upload artifact
      uses: actions/upload-pages-artifact@v2
      with:
        path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v2
```

## Step 4: Repository Configuration

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Source: **GitHub Actions**
4. Save the configuration

### 2. Add Repository Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

```
VITE_API_URL=https://your-backend-api.vercel.app
```

### 3. Update Repository Settings

If using a custom domain, add a `CNAME` file to your repository root:

```bash
echo "voidline.com" > public/CNAME
```

## Step 5: CORS Configuration

### Backend CORS Setup

Update your backend to allow GitHub Pages origin:

```typescript
// server/index.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://yourusername.github.io',
  'https://your-custom-domain.com', // if using custom domain
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Step 6: Environment-Specific Features

### Demo Mode Implementation

Create `client/src/hooks/useDemo.ts`:

```typescript
import { useState, useEffect } from 'react';
import { DEMO_MODE } from '@/config/api';

export function useDemo() {
  const [isDemoMode, setIsDemoMode] = useState(DEMO_MODE);

  useEffect(() => {
    if (isDemoMode) {
      console.log('Running in demo mode - using mock data');
    }
  }, [isDemoMode]);

  return {
    isDemoMode,
    showDemoWarning: isDemoMode,
  };
}
```

### Demo Warning Component

Create `client/src/components/DemoWarning.tsx`:

```typescript
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function DemoWarning() {
  return (
    <Alert className="mb-4 border-yellow-400 bg-yellow-400/10">
      <Info className="h-4 w-4 text-yellow-400" />
      <AlertDescription className="text-yellow-400">
        Demo Mode: This is a frontend-only demo. Full functionality requires backend API.
        <a 
          href="https://github.com/dotslashrecords/c-no-voidline" 
          className="ml-2 underline hover:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </AlertDescription>
    </Alert>
  );
}
```

## Step 7: Custom Domain Setup (Optional)

### 1. DNS Configuration

Add these DNS records to your domain provider:

```
Type: CNAME
Name: www
Value: yourusername.github.io

Type: A
Name: @
Values:
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
```

### 2. GitHub Pages Custom Domain

1. Go to repository **Settings** → **Pages**
2. Enter your custom domain (e.g., `voidline.com`)
3. Check **Enforce HTTPS**
4. Save

### 3. Update Build Configuration

Update `vite.config.github.ts`:

```typescript
export default defineConfig({
  // ... other config
  base: '/', // Change from '/c-no-voidline/' to '/' for custom domain
});
```

## Step 8: Deployment Process

### Manual Deployment

```bash
# Build and deploy manually
npm run build:github
npm run deploy:github
```

### Automatic Deployment

1. Push to main branch:

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

2. GitHub Actions will automatically:
   - Build the application
   - Deploy to GitHub Pages
   - Make it available at your URL

## Step 9: Monitoring and Troubleshooting

### Check Deployment Status

1. Go to **Actions** tab in your repository
2. Check the latest workflow run
3. Review logs for any errors

### Common Issues and Solutions

#### 1. Build Failures

```bash
# Check for TypeScript errors
npm run type-check

# Check for ESLint errors
npm run lint

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build:github
```

#### 2. API CORS Issues

- Verify backend CORS configuration
- Check API URL in repository secrets
- Ensure HTTPS is used for production

#### 3. Custom Domain Issues

- Verify DNS records
- Check CNAME file in repository
- Wait for DNS propagation (up to 24 hours)

#### 4. Asset Loading Issues

- Check base URL in Vite config
- Verify asset paths are relative
- Test with `npm run preview:github`

### Performance Optimization

#### 1. Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.github.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
    }),
  ],
});
```

#### 2. Code Splitting

```typescript
// Lazy load components
const Console = lazy(() => import('@/pages/Console'));
const Landing = lazy(() => import('@/pages/Landing'));

// Use in router
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/console" element={<Console />} />
  </Routes>
</Suspense>
```

## Step 10: Production Checklist

- [ ] Backend API deployed and accessible
- [ ] CORS configured correctly
- [ ] Environment variables set in GitHub secrets
- [ ] GitHub Pages enabled
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforced
- [ ] Demo mode working correctly
- [ ] All assets loading properly
- [ ] Analytics configured (if desired)
- [ ] SEO meta tags added
- [ ] Performance optimized

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Security audit
npm audit

# Deploy updates
git push origin main
```

### Monitoring

- Check GitHub Actions for failed deployments
- Monitor backend API uptime
- Review user feedback and analytics

---

**Note**: This deployment guide is designed specifically for the C/No Voidline project. Adapt the configurations based on your specific requirements and domain setup.

For support, visit the [GitHub repository](https://github.com/dotslashrecords/c-no-voidline) or contact [@dotslashrecords].