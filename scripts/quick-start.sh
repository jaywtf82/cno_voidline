#!/bin/bash

# C/No Voidline - Quick Start Script
# One command to get everything running

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${CYAN}"
    echo "   ██████╗      ███╗   ██╗ ██████╗     ██╗   ██╗ ██████╗ ██╗██████╗ ██╗     ██╗███╗   ██╗███████╗"
    echo "  ██╔════╝      ████╗  ██║██╔═══██╗    ██║   ██║██╔═══██╗██║██╔══██╗██║     ██║████╗  ██║██╔════╝"
    echo "  ██║     █████ ██╔██╗ ██║██║   ██║    ██║   ██║██║   ██║██║██║  ██║██║     ██║██╔██╗ ██║█████╗  "
    echo "  ██║     ╚════ ██║╚██╗██║██║   ██║    ╚██╗ ██╔╝██║   ██║██║██║  ██║██║     ██║██║╚██╗██║██╔══╝  "
    echo "  ╚██████╗      ██║ ╚████║╚██████╔╝     ╚████╔╝ ╚██████╔╝██║██████╔╝███████╗██║██║ ╚████║███████╗"
    echo "   ╚═════╝      ╚═╝  ╚═══╝ ╚═════╝       ╚═══╝   ╚═════╝ ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝"
    echo -e "${NC}"
    echo -e "${GREEN}                              AI Audio Mastering Console${NC}"
    echo -e "${YELLOW}                              Quick Start & Setup Tool${NC}"
    echo
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

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_status "Node.js: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_status "npm: $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi
    
    # Git (optional)
    if command -v git &> /dev/null; then
        print_status "Git: $(git --version | cut -d' ' -f3)"
    else
        print_warning "Git not found (optional for development)"
    fi
}

# Show menu
show_menu() {
    echo -e "${CYAN}What would you like to do?${NC}"
    echo
    echo "1) 🚀 Quick Start (Memory Storage) - Fastest way to try the app"
    echo "2) 🔧 Full Setup (PostgreSQL) - Complete development environment"
    echo "3) 🐳 Docker Setup - Run with Docker Compose"
    echo "4) ⚙️  Configuration Manager - Open web-based config tool"
    echo "5) 📦 Build for Production - Create production build"
    echo "6) 🌐 Deploy to Cloud - Deploy to various platforms"
    echo "7) 🩺 Health Check - Verify installation"
    echo "8) 📚 Documentation - View setup guides"
    echo "9) 🔄 Update - Pull latest changes and update dependencies"
    echo "0) ❌ Exit"
    echo
    read -p "Enter your choice (0-9): " choice
}

# Quick start with memory storage
quick_start() {
    print_info "Starting C/No Voidline with memory storage..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi
    
    # Set up environment for memory storage
    export NODE_ENV=development
    export VITE_STORAGE_BACKEND=memory
    export VITE_REQUIRE_AUTH=false
    
    print_status "Starting development server..."
    print_info "The application will be available at: http://localhost:5000"
    print_warning "Using memory storage - data will be lost when server stops"
    echo
    npm run dev
}

# Full setup with PostgreSQL
full_setup() {
    print_info "Setting up complete C/No Voidline environment..."
    
    # Run main setup script
    if [ -f "scripts/setup.sh" ]; then
        ./scripts/setup.sh
    else
        print_error "Setup script not found"
        exit 1
    fi
    
    print_status "Setup completed!"
    
    # Ask if user wants to start the application
    echo
    read -p "Start the application now? (y/N): " start_now
    if [[ $start_now =~ ^[Yy]$ ]]; then
        export NODE_ENV=development
        if [ -f ".env.local" ]; then
            export $(cat .env.local | grep -v '^#' | xargs) 2>/dev/null || true
        fi
        npm run dev
    fi
}

# Docker setup
docker_setup() {
    print_info "Setting up C/No Voidline with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    # Copy docker files to project root
    cp scripts/docker-compose.yml ./docker-compose.yml
    cp scripts/Dockerfile ./Dockerfile
    cp scripts/nginx.conf ./nginx.conf
    
    print_status "Docker configuration files copied"
    
    # Create .dockerignore
    cat > .dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env*
scripts/
docs/
attached_assets/
*.log
dist/
EOF
    
    print_info "Starting services with Docker Compose..."
    docker-compose up --build -d
    
    print_status "Services started!"
    print_info "Application: http://localhost:80"
    print_info "Database: postgresql://postgres:password@localhost:5432/cno_voidline"
    print_info "Redis: localhost:6379"
}

# Configuration manager
config_manager() {
    print_info "Opening C/No Voidline Configuration Manager..."
    
    # Check if config.html exists
    if [ -f "config.html" ]; then
        # Try to open in browser
        if command -v xdg-open &> /dev/null; then
            xdg-open config.html
        elif command -v open &> /dev/null; then
            open config.html
        else
            print_info "Open config.html in your web browser"
        fi
        print_status "Configuration manager opened"
    else
        print_error "config.html not found"
        exit 1
    fi
}

# Build for production
build_production() {
    print_info "Building C/No Voidline for production..."
    
    if [ -f "scripts/build.sh" ]; then
        ./scripts/build.sh
    else
        npm run build
    fi
    
    print_status "Production build completed!"
    print_info "Files are in the 'dist' directory"
}

# Deploy to cloud
deploy_cloud() {
    print_info "Available deployment options:"
    echo
    echo "1) GitHub Pages"
    echo "2) Netlify"
    echo "3) Vercel"
    echo "4) Railway"
    echo "5) Render"
    echo "6) Docker Registry"
    echo
    read -p "Choose deployment target (1-6): " deploy_choice
    
    case $deploy_choice in
        1) ./scripts/deploy.sh github ;;
        2) ./scripts/deploy.sh netlify ;;
        3) ./scripts/deploy.sh vercel ;;
        4) ./scripts/deploy.sh railway ;;
        5) ./scripts/deploy.sh render ;;
        6) ./scripts/deploy.sh docker ;;
        *) print_error "Invalid choice" ;;
    esac
}

# Health check
health_check() {
    print_info "Running C/No Voidline health check..."
    
    if [ -f "scripts/run-stack.sh" ]; then
        ./scripts/run-stack.sh health
    else
        print_error "Health check script not found"
        exit 1
    fi
}

# View documentation
view_docs() {
    print_info "Available documentation:"
    echo
    if [ -f "SETUP.md" ]; then
        echo "📖 SETUP.md - Setup and installation guide"
    fi
    if [ -f "README.md" ]; then
        echo "📋 README.md - Project overview and usage"
    fi
    if [ -d "docs/" ]; then
        echo "📁 docs/ - Detailed documentation"
        ls docs/
    fi
    echo
    
    read -p "Open SETUP.md? (y/N): " open_setup
    if [[ $open_setup =~ ^[Yy]$ ]] && [ -f "SETUP.md" ]; then
        if command -v less &> /dev/null; then
            less SETUP.md
        else
            cat SETUP.md
        fi
    fi
}

# Update project
update_project() {
    print_info "Updating C/No Voidline..."
    
    # Pull latest changes if git is available
    if command -v git &> /dev/null && [ -d ".git" ]; then
        print_info "Pulling latest changes..."
        git pull
        print_status "Code updated"
    fi
    
    # Update dependencies
    print_info "Updating dependencies..."
    npm update
    print_status "Dependencies updated"
    
    # Clear cache
    print_info "Clearing cache..."
    npm run clean 2>/dev/null || rm -rf dist node_modules/.cache 2>/dev/null || true
    print_status "Cache cleared"
    
    print_status "Update completed!"
}

# Main function
main() {
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    print_banner
    check_requirements
    echo
    
    while true; do
        show_menu
        
        case $choice in
            1)
                echo
                quick_start
                break
                ;;
            2)
                echo
                full_setup
                break
                ;;
            3)
                echo
                docker_setup
                break
                ;;
            4)
                echo
                config_manager
                echo
                ;;
            5)
                echo
                build_production
                echo
                ;;
            6)
                echo
                deploy_cloud
                echo
                ;;
            7)
                echo
                health_check
                echo
                ;;
            8)
                echo
                view_docs
                echo
                ;;
            9)
                echo
                update_project
                echo
                ;;
            0)
                print_info "Thank you for using C/No Voidline!"
                exit 0
                ;;
            *)
                echo
                print_error "Invalid choice. Please enter 0-9."
                echo
                ;;
        esac
    done
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}⚠${NC} Interrupted by user"; exit 0' INT

# Run main function
main "$@"