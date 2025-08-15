#!/bin/bash

# C/No Voidline - Deployment Script
# Supports multiple deployment targets

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

show_usage() {
    echo "🚀 C/No Voidline Deployment Script"
    echo "=================================="
    echo
    echo "Usage: $0 [TARGET] [OPTIONS]"
    echo
    echo "TARGETS:"
    echo "  github       - Deploy to GitHub Pages"
    echo "  netlify      - Deploy to Netlify"
    echo "  vercel       - Deploy to Vercel"
    echo "  railway      - Deploy to Railway"
    echo "  render       - Deploy to Render"
    echo "  docker       - Build and deploy Docker image"
    echo "  static       - Generate static files only"
    echo
    echo "OPTIONS:"
    echo "  --env FILE   - Environment file to use"
    echo "  --build      - Force rebuild before deploy"
    echo "  --preview    - Deploy to preview/staging"
    echo "  --verbose    - Verbose output"
    echo "  --help       - Show this help"
    echo
    echo "EXAMPLES:"
    echo "  $0 github                 # Deploy to GitHub Pages"
    echo "  $0 netlify --preview      # Deploy to Netlify preview"
    echo "  $0 vercel --build         # Force rebuild and deploy to Vercel"
    echo
}

# Check if required tools are installed
check_deployment_tools() {
    local target=$1
    
    case $target in
        github)
            if ! command -v gh &> /dev/null; then
                print_error "GitHub CLI not found. Install from: https://cli.github.com/"
                return 1
            fi
            ;;
        netlify)
            if ! command -v netlify &> /dev/null; then
                print_error "Netlify CLI not found. Install with: npm install -g netlify-cli"
                return 1
            fi
            ;;
        vercel)
            if ! command -v vercel &> /dev/null; then
                print_error "Vercel CLI not found. Install with: npm install -g vercel"
                return 1
            fi
            ;;
        railway)
            if ! command -v railway &> /dev/null; then
                print_error "Railway CLI not found. Install from: https://railway.app/cli"
                return 1
            fi
            ;;
        docker)
            if ! command -v docker &> /dev/null; then
                print_error "Docker not found. Install from: https://docker.com/"
                return 1
            fi
            ;;
    esac
    
    return 0
}

# Build the project
build_project() {
    local env_file=$1
    
    print_info "Building C/No Voidline for deployment..."
    
    # Load environment file if specified
    if [ -n "$env_file" ] && [ -f "$env_file" ]; then
        print_info "Loading environment from $env_file"
        export $(cat "$env_file" | grep -v '^#' | xargs) 2>/dev/null || true
    else
        # Use production environment by default
        if [ -f ".env.production" ]; then
            export $(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
        fi
    fi
    
    export NODE_ENV=production
    
    # Clean previous build
    rm -rf dist
    
    # Build
    npm run build
    
    print_status "Build completed"
}

# Deploy to GitHub Pages
deploy_github() {
    local preview=$1
    
    print_info "Deploying to GitHub Pages..."
    
    # Check if gh-pages is installed
    if ! npm list gh-pages &> /dev/null; then
        print_info "Installing gh-pages..."
        npm install --save-dev gh-pages
    fi
    
    # Deploy
    if [ "$preview" = true ]; then
        npx gh-pages -d dist -b gh-pages-preview
        print_status "Deployed to GitHub Pages preview branch"
    else
        npx gh-pages -d dist
        print_status "Deployed to GitHub Pages"
        
        # Get repository info
        if command -v gh &> /dev/null; then
            REPO_URL=$(gh repo view --json url -q .url)
            PAGES_URL="${REPO_URL/github.com/github.io}"
            PAGES_URL="${PAGES_URL/.git/}"
            print_info "Available at: ${PAGES_URL}"
        fi
    fi
}

# Deploy to Netlify
deploy_netlify() {
    local preview=$1
    
    print_info "Deploying to Netlify..."
    
    if [ "$preview" = true ]; then
        netlify deploy --dir=dist
        print_status "Deployed to Netlify preview"
    else
        netlify deploy --prod --dir=dist
        print_status "Deployed to Netlify production"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    local preview=$1
    
    print_info "Deploying to Vercel..."
    
    if [ "$preview" = true ]; then
        vercel --yes
        print_status "Deployed to Vercel preview"
    else
        vercel --prod --yes
        print_status "Deployed to Vercel production"
    fi
}

# Deploy to Railway
deploy_railway() {
    print_info "Deploying to Railway..."
    
    # Check if railway.json exists
    if [ ! -f "railway.json" ]; then
        cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health"
  }
}
EOF
        print_status "Created railway.json"
    fi
    
    railway up
    print_status "Deployed to Railway"
}

# Deploy to Render
deploy_render() {
    print_info "Deploying to Render..."
    
    # Check if render.yaml exists
    if [ ! -f "render.yaml" ]; then
        cat > render.yaml << EOF
services:
  - type: web
    name: cno-voidline
    env: node
    buildCommand: npm run build
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
EOF
        print_status "Created render.yaml"
    fi
    
    print_info "Push your code to trigger Render deployment"
    print_warning "Render deployments are triggered by git push to connected repository"
}

# Build Docker image
deploy_docker() {
    print_info "Building Docker image for C/No Voidline..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start"]
EOF
        print_status "Created Dockerfile"
    fi
    
    # Create .dockerignore if it doesn't exist
    if [ ! -f ".dockerignore" ]; then
        cat > .dockerignore << EOF
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
.env
.env.local
.env.development
.env.production
Dockerfile
.dockerignore
EOF
        print_status "Created .dockerignore"
    fi
    
    # Build image
    docker build -t cno-voidline:latest .
    
    print_status "Docker image built successfully"
    print_info "Run with: docker run -p 5000:5000 cno-voidline:latest"
}

# Generate static files
deploy_static() {
    print_info "Generating static files..."
    
    # Set static generation environment
    export VITE_STATIC_GENERATION=true
    export VITE_REQUIRE_AUTH=false
    export VITE_STORAGE_BACKEND=memory
    
    # Build
    npm run build
    
    # Create additional static files
    cp config.html dist/config.html
    
    # Create a simple server for static files
    cat > dist/server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.static('.'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Static server running on port ${port}`);
});
EOF
    
    print_status "Static files generated in 'dist' directory"
    print_info "Serve with any static file server or use: node dist/server.js"
}

# Main deployment function
deploy() {
    local target=$1
    local env_file=$2
    local force_build=$3
    local preview=$4
    local verbose=$5
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    # Check deployment tools
    if ! check_deployment_tools "$target"; then
        exit 1
    fi
    
    # Build if required
    if [ "$force_build" = true ] || [ ! -d "dist" ]; then
        build_project "$env_file"
    fi
    
    # Deploy based on target
    case $target in
        github)
            deploy_github "$preview"
            ;;
        netlify)
            deploy_netlify "$preview"
            ;;
        vercel)
            deploy_vercel "$preview"
            ;;
        railway)
            deploy_railway
            ;;
        render)
            deploy_render
            ;;
        docker)
            deploy_docker
            ;;
        static)
            deploy_static
            ;;
        *)
            print_error "Unknown deployment target: $target"
            show_usage
            exit 1
            ;;
    esac
}

# Process arguments
main() {
    local target=""
    local env_file=""
    local force_build=false
    local preview=false
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            github|netlify|vercel|railway|render|docker|static)
                target=$1
                shift
                ;;
            --env)
                env_file="$2"
                shift 2
                ;;
            --build)
                force_build=true
                shift
                ;;
            --preview)
                preview=true
                shift
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [ -z "$target" ]; then
        print_error "No deployment target specified"
        show_usage
        exit 1
    fi
    
    # Change to project root
    cd "$(dirname "$0")/.."
    
    # Start deployment
    echo "🚀 C/No Voidline Deployment"
    echo "==========================="
    echo
    
    deploy "$target" "$env_file" "$force_build" "$preview" "$verbose"
    
    echo
    print_status "Deployment completed!"
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}⚠${NC} Deployment interrupted"; exit 1' INT

# Run main function
main "$@"