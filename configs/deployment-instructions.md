
# Platform-Specific Deployment Instructions

## Replit (Recommended)

### Quick Setup
1. Use the existing setup script:
   ```bash
   ./scripts/one-click-setup.sh
   ```
2. Choose option 1 for local development
3. Use the Deployments tab in Replit to deploy to production

### Manual Setup
1. Copy configuration:
   ```bash
   cp configs/replit-config.env .env.production
   ```
2. Build the application:
   ```bash
   npm run build
   ```
3. Use Replit's Deployment feature (Autoscale recommended)

## GitHub Pages

### Setup
1. Copy configuration:
   ```bash
   cp configs/github-pages-config.env .env.production
   cp configs/github-pages-workflow.yml .github/workflows/deploy.yml
   ```
2. Enable GitHub Pages in repository settings
3. Push to main branch for automatic deployment

### Manual Deployment
```bash
npm run deploy:github
```

## Netlify

### Setup via Git
1. Copy configuration:
   ```bash
   cp configs/netlify-config.env .env.production
   cp configs/netlify.toml netlify.toml
   ```
2. Connect repository in Netlify dashboard
3. Deploy automatically on push

### CLI Deployment
```bash
npm install -g netlify-cli
netlify login
npm run deploy:netlify
```

## Vercel

### Setup via Git
1. Copy configuration:
   ```bash
   cp configs/vercel-config.env .env.production
   cp configs/vercel.json vercel.json
   ```
2. Connect repository in Vercel dashboard
3. Deploy automatically on push

### CLI Deployment
```bash
npm install -g vercel
vercel login
npm run deploy:vercel
```

## Railway

### Setup
1. Copy configuration:
   ```bash
   cp configs/railway-config.env .env.production
   cp configs/railway.json railway.json
   ```
2. Connect repository in Railway dashboard
3. Add PostgreSQL database service
4. Deploy automatically on push

## Render

### Setup
1. Copy configuration:
   ```bash
   cp configs/render-config.env .env.production
   cp configs/render.yaml render.yaml
   ```
2. Connect repository in Render dashboard
3. Add PostgreSQL database
4. Deploy automatically on push

## Hugging Face Spaces

### Setup
1. Copy configuration:
   ```bash
   cp configs/huggingface-config.env .env.production
   cp configs/huggingface-README.md README.md
   ```
2. Create new Space at huggingface.co
3. Choose "Static" SDK
4. Upload built files to Space repository

## Docker

### Local Docker
1. Copy configuration:
   ```bash
   cp configs/docker-config.env .env.production
   cp configs/docker-compose.yml docker-compose.yml
   ```
2. Build and run:
   ```bash
   docker-compose up -d
   ```

### Production Docker
```bash
docker build -t cno-voidline:latest .
docker run -p 5000:5000 --env-file configs/docker-config.env cno-voidline:latest
```

## Environment Variables

Each platform configuration includes optimized settings for:
- Storage backend (memory/PostgreSQL)
- Authentication requirements
- File size limits
- Performance optimizations
- Security settings

Copy the appropriate `.env` file to `.env.production` before building for each platform.
