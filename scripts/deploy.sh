
#!/bin/bash

# C/No Voidline - Enhanced Deployment Script
# Supports multiple deployment targets with automatic configuration

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

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
    echo "🚀 C/No Voidline Enhanced Deployment Script"
    echo "==========================================="
    echo
    echo "Usage: $0 [TARGET] [OPTIONS]"
    echo
    echo "TARGETS:"
    echo "  github       - Deploy to GitHub Pages"
    echo "  netlify      - Deploy to Netlify"
    echo "  vercel       - Deploy to Vercel"
    echo "  replit       - Deploy to Replit"
    echo "  railway      - Deploy to Railway"
    echo "  render       - Deploy to Render"
    echo "  huggingface  - Deploy to Hugging Face Spaces"
    echo "  docker       - Build Docker image"
    echo "  all          - Deploy to all configured platforms"
    echo
    echo "OPTIONS:"
    echo "  --config FILE    - Use specific config file"
    echo "  --env ENV        - Environment (development/staging/production)"
    echo "  --build          - Force rebuild before deploy"
    echo "  --preview        - Deploy to preview/staging"
    echo "  --dry-run        - Show what would be deployed without deploying"
    echo "  --verbose        - Verbose output"
    echo "  --help           - Show this help"
    echo
    echo "EXAMPLES:"
    echo "  $0 github                          # Deploy to GitHub Pages"
    echo "  $0 netlify --preview               # Deploy to Netlify preview"
    echo "  $0 vercel --build --env production # Force rebuild and deploy to Vercel"
    echo "  $0 all --dry-run                   # Show all deployment commands"
    echo
}

# Check if required tools are installed
check_deployment_tools() {
    local target=$1
    
    case $target in
        github)
            if ! command -v gh &> /dev/null && ! npm list gh-pages &> /dev/null; then
                print_warning "GitHub CLI or gh-pages not found."
                print_info "Installing gh-pages..."
                npm install --save-dev gh-pages
            fi
            ;;
        netlify)
            if ! command -v netlify &> /dev/null; then
                print_warning "Netlify CLI not found."
                print_info "Install with: npm install -g netlify-cli"
                return 1
            fi
            ;;
        vercel)
            if ! command -v vercel &> /dev/null; then
                print_warning "Vercel CLI not found."
                print_info "Install with: npm install -g vercel"
                return 1
            fi
            ;;
        railway)
            if ! command -v railway &> /dev/null; then
                print_warning "Railway CLI not found."
                print_info "Install from: https://railway.app/cli"
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
    local target=$1
    local env=${2:-production}
    
    print_info "Building C/No Voidline for $target deployment..."
    
    # Create platform-specific environment
    create_platform_env "$target" "$env"
    
    # Clean previous build
    rm -rf dist
    
    # Build based on target
    case $target in
        github)
            npm run build:github-pages
            ;;
        netlify)
            npm run build:netlify
            ;;
        vercel)
            npm run build:vercel
            ;;
        replit)
            npm run build:replit
            ;;
        *)
            npm run build
            ;;
    esac
    
    # Copy additional files
    cp config.html dist/config.html 2>/dev/null || true
    
    print_status "Build completed for $target"
}

# Create platform-specific environment file
create_platform_env() {
    local target=$1
    local env=$2
    
    cat > .env.${env} << EOF
# C/No Voidline - ${target} deployment
# Generated: $(date)

NODE_ENV=${env}
VITE_DEPLOYMENT_TARGET=${target}
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
VITE_MAX_FILE_SIZE_MB=50
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true

# Platform-specific settings
$(get_platform_specific_env "$target")
EOF
}

# Get platform-specific environment variables
get_platform_specific_env() {
    local target=$1
    
    case $target in
        github)
            echo "VITE_PUBLIC_PATH=/cno-voidline/"
            ;;
        netlify)
            echo "NETLIFY_FUNCTIONS_ENABLED=true"
            ;;
        vercel)
            echo "VERCEL_FUNCTIONS_ENABLED=true"
            ;;
        replit)
            echo "REPLIT_DEPLOYMENT=true"
            ;;
        huggingface)
            echo "HUGGINGFACE_SPACES=true"
            ;;
        *)
            echo "# No platform-specific settings"
            ;;
    esac
}

# Deploy to GitHub Pages
deploy_github() {
    local preview=$1
    local dry_run=$2
    
    print_info "Deploying to GitHub Pages..."
    
    if [ "$dry_run" = true ]; then
        echo "Would run: npx gh-pages -d dist"
        return
    fi
    
    # Check if gh-pages is available
    if ! npm list gh-pages &> /dev/null; then
        print_info "Installing gh-pages..."
        npm install --save-dev gh-pages
    fi
    
    if [ "$preview" = true ]; then
        npx gh-pages -d dist -b gh-pages-preview
        print_status "Deployed to GitHub Pages preview branch"
    else
        npx gh-pages -d dist
        print_status "Deployed to GitHub Pages"
        
        # Try to get repository info
        if command -v gh &> /dev/null; then
            REPO_URL=$(gh repo view --json url -q .url 2>/dev/null || echo "")
            if [ -n "$REPO_URL" ]; then
                PAGES_URL="${REPO_URL/github.com/github.io}"
                PAGES_URL="${PAGES_URL/.git/}"
                print_info "Available at: ${PAGES_URL}"
            fi
        fi
    fi
}

# Deploy to Netlify
deploy_netlify() {
    local preview=$1
    local dry_run=$2
    
    print_info "Deploying to Netlify..."
    
    if [ "$dry_run" = true ]; then
        if [ "$preview" = true ]; then
            echo "Would run: netlify deploy --dir=dist"
        else
            echo "Would run: netlify deploy --prod --dir=dist"
        fi
        return
    fi
    
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
    local dry_run=$2
    
    print_info "Deploying to Vercel..."
    
    if [ "$dry_run" = true ]; then
        if [ "$preview" = true ]; then
            echo "Would run: vercel --yes"
        else
            echo "Would run: vercel --prod --yes"
        fi
        return
    fi
    
    if [ "$preview" = true ]; then
        vercel --yes
        print_status "Deployed to Vercel preview"
    else
        vercel --prod --yes
        print_status "Deployed to Vercel production"
    fi
}

# Deploy to Replit
deploy_replit() {
    local dry_run=$1
    
    print_info "Preparing Replit deployment..."
    
    if [ "$dry_run" = true ]; then
        echo "Would configure Replit deployment files"
        return
    fi
    
    # Create .replit file
    cat > .replit << EOF
modules = ["nodejs-20"]

[deployment]
run = "npm start"
deploymentTarget = "autoscale"

[[ports]]
localPort = 5000
externalPort = 80
EOF
    
    print_status "Replit configuration updated"
    print_info "Use Replit's Deploy button to deploy to production"
}

# Deploy to Railway
deploy_railway() {
    local dry_run=$1
    
    print_info "Deploying to Railway..."
    
    if [ "$dry_run" = true ]; then
        echo "Would run: railway up"
        return
    fi
    
    # Create railway.json if it doesn't exist
    if [ ! -f "railway.json" ]; then
        cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health"
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
    local dry_run=$1
    
    print_info "Preparing Render deployment..."
    
    if [ "$dry_run" = true ]; then
        echo "Would create render.yaml configuration"
        return
    fi
    
    # Create render.yaml if it doesn't exist
    if [ ! -f "render.yaml" ]; then
        cat > render.yaml << EOF
services:
  - type: web
    name: cno-voidline
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_STORAGE_BACKEND
        value: memory
      - key: VITE_AI_PROVIDER
        value: local
EOF
        print_status "Created render.yaml"
    fi
    
    print_info "Push your code to trigger Render deployment"
    print_warning "Render deployments are triggered by git push to connected repository"
}

# Deploy to Hugging Face Spaces
deploy_huggingface() {
    local dry_run=$1
    
    print_info "Preparing Hugging Face Spaces deployment..."
    
    if [ "$dry_run" = true ]; then
        echo "Would create Hugging Face Spaces configuration"
        return
    fi
    
    # Create README.md for Hugging Face
    cat > README.md << EOF
---
title: C/No Voidline
emoji: 🎵
colorFrom: green
colorTo: cyan
sdk: static
pinned: false
license: mit
---

# C/No Voidline - AI Audio Mastering Console

A professional-grade AI audio mastering console built with React and Web Audio API.

## Features

- 🎵 Real-time audio analysis with industry-standard metrics
- 🤖 AI-powered mastering with multiple presets
- 📊 Professional visualizers and meters
- 🎛️ Manual control rack for fine-tuning
- 💾 Multi-format export capabilities
- 🎨 Terminal-inspired UI with multiple themes

## Live Demo

This Space contains the static build of C/No Voidline, optimized for client-side processing.

## Repository

Full source code and documentation available at: [GitHub Repository](https://github.com/yourusername/cno-voidline)

EOF
    
    print_status "Created Hugging Face Spaces configuration"
    print_info "Upload your built files to Hugging Face Spaces"
}

# Build Docker image
deploy_docker() {
    local dry_run=$1
    
    print_info "Building Docker image..."
    
    if [ "$dry_run" = true ]; then
        echo "Would run: docker build -t cno-voidline:latest ."
        return
    fi
    
    # Create optimized Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << 'EOF'
# Multi-stage build for C/No Voidline
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runtime

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
EOF
        print_status "Created optimized Dockerfile"
    fi
    
    # Build Docker image
    docker build -t cno-voidline:latest .
    
    print_status "Docker image built successfully"
    print_info "Run with: docker run -p 5000:5000 cno-voidline:latest"
    
    # Create docker-compose.yml for easy deployment
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - VITE_STORAGE_BACKEND=memory
      - VITE_AI_PROVIDER=local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF
        print_status "Created docker-compose.yml"
        print_info "Run with: docker-compose up -d"
    fi
}

# Deploy to all platforms
deploy_all() {
    local dry_run=$1
    local preview=$2
    
    print_header "Deploying to All Platforms"
    
    local platforms=("github" "netlify" "vercel" "docker")
    local success_count=0
    local total_count=${#platforms[@]}
    
    for platform in "${platforms[@]}"; do
        print_info "Deploying to $platform..."
        
        if check_deployment_tools "$platform"; then
            case $platform in
                github) deploy_github "$preview" "$dry_run" ;;
                netlify) deploy_netlify "$preview" "$dry_run" ;;
                vercel) deploy_vercel "$preview" "$dry_run" ;;
                docker) deploy_docker "$dry_run" ;;
            esac
            
            if [ $? -eq 0 ]; then
                ((success_count++))
                print_status "$platform deployment completed"
            else
                print_warning "$platform deployment failed"
            fi
        else
            print_warning "Skipping $platform (tools not available)"
        fi
        
        echo ""
    done
    
    print_header "Deployment Summary"
    print_info "Successfully deployed to $success_count out of $total_count platforms"
    
    if [ $success_count -eq $total_count ]; then
        print_status "All deployments completed successfully! 🎉"
    elif [ $success_count -gt 0 ]; then
        print_warning "Some deployments completed with warnings"
    else
        print_error "All deployments failed"
        return 1
    fi
}

# Main deployment function
deploy() {
    local target=$1
    local config_file=$2
    local env=$3
    local force_build=$4
    local preview=$5
    local dry_run=$6
    local verbose=$7
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    print_header "C/No Voidline Deployment"
    print_info "Target: $target"
    print_info "Environment: $env"
    print_info "Preview mode: $preview"
    print_info "Dry run: $dry_run"
    echo ""
    
    # Check deployment tools for single platform deployments
    if [ "$target" != "all" ] && ! check_deployment_tools "$target"; then
        exit 1
    fi
    
    # Build if required
    if [ "$force_build" = true ] || [ ! -d "dist" ]; then
        if [ "$target" != "all" ]; then
            build_project "$target" "$env"
        else
            build_project "production" "$env"
        fi
    fi
    
    # Deploy based on target
    case $target in
        github)
            deploy_github "$preview" "$dry_run"
            ;;
        netlify)
            deploy_netlify "$preview" "$dry_run"
            ;;
        vercel)
            deploy_vercel "$preview" "$dry_run"
            ;;
        replit)
            deploy_replit "$dry_run"
            ;;
        railway)
            deploy_railway "$dry_run"
            ;;
        render)
            deploy_render "$dry_run"
            ;;
        huggingface)
            deploy_huggingface "$dry_run"
            ;;
        docker)
            deploy_docker "$dry_run"
            ;;
        all)
            deploy_all "$dry_run" "$preview"
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
    local config_file=""
    local env="production"
    local force_build=false
    local preview=false
    local dry_run=false
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            github|netlify|vercel|replit|railway|render|huggingface|docker|all)
                target=$1
                shift
                ;;
            --config)
                config_file="$2"
                shift 2
                ;;
            --env)
                env="$2"
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
            --dry-run)
                dry_run=true
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
    
    # Load config file if specified
    if [ -n "$config_file" ] && [ -f "$config_file" ]; then
        source "$config_file"
    fi
    
    # Start deployment
    deploy "$target" "$config_file" "$env" "$force_build" "$preview" "$dry_run" "$verbose"
    
    if [ $? -eq 0 ]; then
        print_status "Deployment completed successfully! 🚀"
    else
        print_error "Deployment failed! ❌"
        exit 1
    fi
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}⚠${NC} Deployment interrupted"; exit 1' INT

# Run main function
main "$@"
