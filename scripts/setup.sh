#!/bin/bash

# C/No Voidline - Complete Stack Setup Script
# This script sets up the entire C/No Voidline AI Audio Mastering Console

set -e

echo "🎵 C/No Voidline - AI Audio Mastering Console Setup"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 18 or higher."
        exit 1
    fi
    
    print_status "Node.js version $NODE_VERSION detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    print_status "npm $(npm -v) detected"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm ci --silent
    print_status "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment configuration..."
    
    # Development environment
    if [ ! -f .env.development ]; then
        cat > .env.development << EOF
# C/No Voidline Development Environment
NODE_ENV=development
VITE_REQUIRE_AUTH=false
VITE_DEPLOYMENT_TARGET=development
VITE_STORAGE_BACKEND=memory
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=100
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=anthropic
SESSION_TIMEOUT_MINUTES=60
CORS_ORIGINS=*
ENABLE_RATE_LIMITING=false
EOF
        print_status "Created .env.development"
    fi
    
    # Production environment template
    if [ ! -f .env.production ]; then
        cat > .env.production << EOF
# C/No Voidline Production Environment
NODE_ENV=production
VITE_REQUIRE_AUTH=true
VITE_DEPLOYMENT_TARGET=production
VITE_STORAGE_BACKEND=postgresql
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=50
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=anthropic
SESSION_TIMEOUT_MINUTES=30
CORS_ORIGINS=https://yourdomain.com
ENABLE_RATE_LIMITING=true

# Database (set your actual database URL)
# DATABASE_URL=postgresql://user:password@host:port/database

# API Keys (set your actual API keys)
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
EOF
        print_status "Created .env.production template"
    fi
    
    # Local development with PostgreSQL
    if [ ! -f .env.local ]; then
        cat > .env.local << EOF
# C/No Voidline Local Development with PostgreSQL
NODE_ENV=development
VITE_REQUIRE_AUTH=true
VITE_DEPLOYMENT_TARGET=local
VITE_STORAGE_BACKEND=postgresql
DATABASE_URL=postgresql://postgres:password@localhost:5432/cno_voidline
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=100
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=anthropic
SESSION_TIMEOUT_MINUTES=60
CORS_ORIGINS=*
ENABLE_RATE_LIMITING=false
EOF
        print_status "Created .env.local template"
    fi
}

# Setup database (if PostgreSQL is available)
setup_database() {
    if [ -f .env.local ] && grep -q "postgresql" .env.local; then
        print_warning "PostgreSQL configuration detected in .env.local"
        echo "To set up the database, run: npm run db:setup"
        echo "This will create tables and initial data"
    fi
}

# Create run scripts
create_run_scripts() {
    print_status "Creating run scripts..."
    
    # Development run script
    cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting C/No Voidline in Development Mode"
export NODE_ENV=development
npm run dev
EOF
    chmod +x scripts/dev.sh
    
    # Production build script
    cat > scripts/build.sh << 'EOF'
#!/bin/bash
echo "🏗️ Building C/No Voidline for Production"
export NODE_ENV=production
npm run build
echo "✅ Build completed! Files are in the 'dist' directory"
EOF
    chmod +x scripts/build.sh
    
    # Production run script
    cat > scripts/start.sh << 'EOF'
#!/bin/bash
echo "🌟 Starting C/No Voidline in Production Mode"
export NODE_ENV=production
npm run start
EOF
    chmod +x scripts/start.sh
    
    # Database setup script
    cat > scripts/db-setup.sh << 'EOF'
#!/bin/bash
echo "🗄️ Setting up C/No Voidline Database"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please run setup.sh first."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Push database schema
echo "📋 Pushing database schema..."
npm run db:push

echo "✅ Database setup completed!"
EOF
    chmod +x scripts/db-setup.sh
    
    print_status "Run scripts created successfully"
}

# Create package.json scripts if they don't exist
update_package_scripts() {
    print_status "Updating package.json scripts..."
    
    # Read current package.json and add missing scripts
    if command -v jq &> /dev/null; then
        # Use jq if available for cleaner JSON manipulation
        jq '.scripts += {
            "setup": "./scripts/setup.sh",
            "dev:memory": "NODE_ENV=development npm run dev",
            "dev:local": "NODE_ENV=development NODE_OPTIONS=\"--env-file=.env.local\" npm run dev",
            "build:production": "NODE_ENV=production npm run build",
            "start:production": "NODE_ENV=production npm run start",
            "db:setup": "./scripts/db-setup.sh",
            "deploy:github": "npm run build && gh-pages -d dist",
            "deploy:netlify": "npm run build && netlify deploy --prod --dir=dist",
            "deploy:vercel": "vercel --prod",
            "clean": "rm -rf dist node_modules/.cache",
            "reset": "rm -rf node_modules package-lock.json && npm install"
        }' package.json > package.json.tmp && mv package.json.tmp package.json
        print_status "Package.json scripts updated"
    else
        print_warning "jq not available - package.json scripts not updated"
        echo "Please manually add the scripts from scripts/package-scripts.json"
        
        # Create a reference file with the scripts
        cat > scripts/package-scripts.json << EOF
{
  "scripts": {
    "setup": "./scripts/setup.sh",
    "dev:memory": "NODE_ENV=development npm run dev",
    "dev:local": "NODE_ENV=development NODE_OPTIONS=\"--env-file=.env.local\" npm run dev",
    "build:production": "NODE_ENV=production npm run build",
    "start:production": "NODE_ENV=production npm run start",
    "db:setup": "./scripts/db-setup.sh",
    "deploy:github": "npm run build && gh-pages -d dist",
    "deploy:netlify": "npm run build && netlify deploy --prod --dir=dist",
    "deploy:vercel": "vercel --prod",
    "clean": "rm -rf dist node_modules/.cache",
    "reset": "rm -rf node_modules package-lock.json && npm install"
  }
}
EOF
    fi
}

# Create documentation
create_documentation() {
    print_status "Creating setup documentation..."
    
    cat > SETUP.md << 'EOF'
# C/No Voidline Setup Guide

## Quick Start

### 1. Initial Setup
```bash
# Run the setup script
./scripts/setup.sh

# Or manually:
npm install
```

### 2. Development Mode (Memory Storage)
```bash
# Simple development with in-memory storage
npm run dev:memory
# or
./scripts/dev.sh
```

### 3. Local Development (PostgreSQL)
```bash
# Setup database first
npm run db:setup
# or
./scripts/db-setup.sh

# Start with PostgreSQL
npm run dev:local
```

### 4. Production Build
```bash
# Build for production
npm run build:production
# or
./scripts/build.sh

# Start production server
npm run start:production
# or
./scripts/start.sh
```

## Environment Files

- `.env.development` - Development with memory storage
- `.env.local` - Local development with PostgreSQL
- `.env.production` - Production configuration

## Available Scripts

- `npm run setup` - Complete setup process
- `npm run dev` - Development server (default)
- `npm run dev:memory` - Development with memory storage
- `npm run dev:local` - Development with PostgreSQL
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:setup` - Setup PostgreSQL database
- `npm run db:push` - Push schema changes to database
- `npm run deploy:github` - Deploy to GitHub Pages
- `npm run deploy:netlify` - Deploy to Netlify
- `npm run deploy:vercel` - Deploy to Vercel
- `npm run clean` - Clean build cache
- `npm run reset` - Reset node_modules and reinstall

## Database Setup

### PostgreSQL (Recommended for Production)
1. Install PostgreSQL locally or use a cloud provider
2. Update `DATABASE_URL` in `.env.local` or `.env.production`
3. Run `npm run db:setup` to create tables

### Memory Storage (Development Only)
- No setup required
- Data is lost when server restarts
- Use for quick development and testing

## Deployment

### GitHub Pages
1. Update repository settings to enable GitHub Pages
2. Run `npm run deploy:github`

### Netlify
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login: `netlify login`
3. Run `npm run deploy:netlify`

### Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Run `npm run deploy:vercel`

## Troubleshooting

### Node.js Version
- Requires Node.js 18+
- Check with: `node -v`

### Port Issues
- Default port: 5000
- Change with: `PORT=3000 npm run dev`

### Database Connection
- Check `DATABASE_URL` in environment file
- Ensure PostgreSQL is running
- Run `npm run db:setup` if tables are missing

### Build Errors
- Clear cache: `npm run clean`
- Reset dependencies: `npm run reset`
- Check environment variables

## Configuration

Use the configuration manager at `/config.html` to:
- Generate environment files
- Configure deployment targets
- Set up database connections
- Manage API keys and security settings
EOF
    
    print_status "Setup documentation created"
}

# Main setup process
main() {
    echo
    print_status "Starting C/No Voidline setup process..."
    echo
    
    # Create scripts directory
    mkdir -p scripts
    
    # Run setup steps
    check_nodejs
    check_npm
    install_dependencies
    setup_environment
    create_run_scripts
    update_package_scripts
    create_documentation
    setup_database
    
    echo
    echo "🎉 Setup completed successfully!"
    echo
    echo "Next steps:"
    echo "  1. For development: ./scripts/dev.sh or npm run dev"
    echo "  2. For production build: ./scripts/build.sh or npm run build"
    echo "  3. Open config.html to configure deployment settings"
    echo "  4. Read SETUP.md for detailed instructions"
    echo
    print_warning "Don't forget to set up your API keys in the environment files!"
    echo
}

# Run main function
main "$@"