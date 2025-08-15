#!/bin/bash

# C/No Voidline - Complete Stack Runner
# This script provides different ways to run the complete stack

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Show usage information
show_usage() {
    echo "🎵 C/No Voidline Stack Runner"
    echo "============================="
    echo
    echo "Usage: $0 [MODE] [OPTIONS]"
    echo
    echo "MODES:"
    echo "  dev          - Development mode with memory storage"
    echo "  dev-db       - Development mode with PostgreSQL"
    echo "  production   - Production mode"
    echo "  build        - Build for production"
    echo "  docker       - Run with Docker (if available)"
    echo "  setup        - Initial setup"
    echo "  health       - Health check"
    echo
    echo "OPTIONS:"
    echo "  --port PORT  - Specify port (default: 5000)"
    echo "  --host HOST  - Specify host (default: 0.0.0.0)"
    echo "  --env FILE   - Specify environment file"
    echo "  --verbose    - Verbose output"
    echo "  --help       - Show this help"
    echo
    echo "EXAMPLES:"
    echo "  $0 dev                    # Development with memory storage"
    echo "  $0 dev-db                 # Development with PostgreSQL"
    echo "  $0 production --port 3000 # Production on port 3000"
    echo "  $0 build                  # Build for production"
    echo "  $0 setup                  # Initial setup"
    echo
}

# Check if dependencies are installed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not installed. Running setup..."
        npm install
    fi
}

# Health check
health_check() {
    print_info "Running C/No Voidline health check..."
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_status "Node.js: $NODE_VERSION"
    else
        print_error "Node.js not found"
        return 1
    fi
    
    # Check npm version
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_status "npm: $NPM_VERSION"
    else
        print_error "npm not found"
        return 1
    fi
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        print_status "package.json found"
    else
        print_error "package.json not found"
        return 1
    fi
    
    # Check dependencies
    if [ -d "node_modules" ]; then
        print_status "Dependencies installed"
    else
        print_warning "Dependencies not installed"
    fi
    
    # Check environment files
    if [ -f ".env.development" ]; then
        print_status ".env.development found"
    else
        print_warning ".env.development not found"
    fi
    
    # Check database connection (if applicable)
    if [ -f ".env.local" ] && grep -q "postgresql" .env.local 2>/dev/null; then
        print_info "PostgreSQL configuration detected"
        if command -v psql &> /dev/null; then
            print_status "PostgreSQL client available"
        else
            print_warning "PostgreSQL client not found"
        fi
    fi
    
    print_status "Health check completed"
}

# Setup the project
setup_project() {
    print_info "Setting up C/No Voidline project..."
    
    if [ -f "scripts/setup.sh" ]; then
        ./scripts/setup.sh
    else
        print_error "Setup script not found. Please run the setup manually."
        exit 1
    fi
}

# Run development mode
run_development() {
    local use_db=${1:-false}
    local port=${2:-5000}
    local host=${3:-"0.0.0.0"}
    
    print_info "Starting C/No Voidline in development mode..."
    
    if [ "$use_db" = true ]; then
        print_info "Using PostgreSQL database"
        export NODE_ENV=development
        if [ -f ".env.local" ]; then
            export $(cat .env.local | grep -v '^#' | xargs) 2>/dev/null || true
        fi
    else
        print_info "Using memory storage"
        export NODE_ENV=development
        export VITE_STORAGE_BACKEND=memory
        if [ -f ".env.development" ]; then
            export $(cat .env.development | grep -v '^#' | xargs) 2>/dev/null || true
        fi
    fi
    
    export PORT=$port
    export HOST=$host
    
    check_dependencies
    
    print_status "Starting server on http://$host:$port"
    npm run dev
}

# Run production mode
run_production() {
    local port=${1:-5000}
    local host=${2:-"0.0.0.0"}
    
    print_info "Starting C/No Voidline in production mode..."
    
    export NODE_ENV=production
    export PORT=$port
    export HOST=$host
    
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
    fi
    
    check_dependencies
    
    # Build if dist directory doesn't exist
    if [ ! -d "dist" ]; then
        print_info "Building project for production..."
        npm run build
    fi
    
    print_status "Starting production server on http://$host:$port"
    npm run start
}

# Build for production
build_project() {
    print_info "Building C/No Voidline for production..."
    
    export NODE_ENV=production
    
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
    fi
    
    check_dependencies
    
    print_status "Building..."
    npm run build
    
    print_status "Build completed! Files are in the 'dist' directory"
    
    # Show build info
    if [ -d "dist" ]; then
        BUILD_SIZE=$(du -sh dist | cut -f1)
        print_info "Build size: $BUILD_SIZE"
    fi
}

# Run with Docker (if available)
run_docker() {
    print_info "Attempting to run C/No Voidline with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        print_warning "Dockerfile not found. Creating a basic Dockerfile..."
        create_dockerfile
    fi
    
    # Build Docker image
    print_info "Building Docker image..."
    docker build -t cno-voidline .
    
    # Run Docker container
    print_info "Starting Docker container..."
    docker run -p 5000:5000 --env-file .env.production cno-voidline
}

# Create a basic Dockerfile
create_dockerfile() {
    cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
EOF
    
    print_status "Created basic Dockerfile"
}

# Process command line arguments
process_arguments() {
    local mode=""
    local port=5000
    local host="0.0.0.0"
    local env_file=""
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            dev|development)
                mode="dev"
                shift
                ;;
            dev-db|development-db)
                mode="dev-db"
                shift
                ;;
            prod|production)
                mode="production"
                shift
                ;;
            build)
                mode="build"
                shift
                ;;
            docker)
                mode="docker"
                shift
                ;;
            setup)
                mode="setup"
                shift
                ;;
            health|check)
                mode="health"
                shift
                ;;
            --port)
                port="$2"
                shift 2
                ;;
            --host)
                host="$2"
                shift 2
                ;;
            --env)
                env_file="$2"
                shift 2
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
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    # Load custom environment file if specified
    if [ -n "$env_file" ] && [ -f "$env_file" ]; then
        print_info "Loading environment from $env_file"
        export $(cat "$env_file" | grep -v '^#' | xargs) 2>/dev/null || true
    fi
    
    # Execute based on mode
    case $mode in
        dev)
            run_development false "$port" "$host"
            ;;
        dev-db)
            run_development true "$port" "$host"
            ;;
        production)
            run_production "$port" "$host"
            ;;
        build)
            build_project
            ;;
        docker)
            run_docker
            ;;
        setup)
            setup_project
            ;;
        health)
            health_check
            ;;
        "")
            print_error "No mode specified"
            show_usage
            exit 1
            ;;
        *)
            print_error "Unknown mode: $mode"
            show_usage
            exit 1
            ;;
    esac
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}⚠${NC} Shutting down C/No Voidline..."; exit 0' INT

# Main execution
main() {
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    process_arguments "$@"
}

# Run main function with all arguments
main "$@"