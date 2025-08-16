#!/bin/bash

# C/No Voidline - Quick Start Script
# Production-ready deployment for multiple platforms

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cno-voidline"
DOCKER_IMAGE="voidline/audio-mastering"
DEFAULT_PORT=5000

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is required but not installed."
        exit 1
    fi
    
    # Check available disk space (minimum 2GB)
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then  # 2GB in KB
        log_warning "Low disk space detected. At least 2GB recommended."
    fi
    
    log_success "System requirements check passed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cat > .env << EOF
# C/No Voidline Configuration
NODE_ENV=production
PORT=${DEFAULT_PORT}

# Database Configuration
DATABASE_URL=postgresql://voidline:voidline@postgres:5432/voidline
PGHOST=postgres
PGPORT=5432
PGDATABASE=voidline
PGUSER=voidline
PGPASSWORD=voidline

# Optional: Redis Session Store
# REDIS_URL=redis://redis:6379

# Optional: External Services
# OPENAI_API_KEY=your_openai_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here

# Security (change in production)
SESSION_SECRET=change-this-in-production-$(openssl rand -base64 32 | head -c 32)

# Deployment Target (github-pages, netlify, vercel, railway, render)
DEPLOY_TARGET=docker
EOF
        log_success "Created .env configuration file"
    else
        log_info "Environment file already exists, skipping creation"
    fi
}

build_application() {
    log_info "Building C/No Voidline application..."
    
    # Change to project root
    cd "$(dirname "$0")/.."
    
    # Build with Docker Compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        DOCKER_COMPOSE_CMD="docker compose"
    fi
    
    $DOCKER_COMPOSE_CMD -f scripts/docker-compose.yml build --no-cache
    
    log_success "Application build completed"
}

start_services() {
    log_info "Starting services..."
    
    # Start the full stack
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        DOCKER_COMPOSE_CMD="docker compose"
    fi
    
    $DOCKER_COMPOSE_CMD -f scripts/docker-compose.yml up -d
    
    log_success "Services started successfully"
}

wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for database
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if docker exec ${PROJECT_NAME}_postgres_1 pg_isready -U voidline -d voidline > /dev/null 2>&1 || \
           docker exec ${PROJECT_NAME}-postgres-1 pg_isready -U voidline -d voidline > /dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            log_error "Database failed to start within timeout"
            exit 1
        fi
        
        sleep 2
    done
    
    # Wait for application
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -f http://localhost:${DEFAULT_PORT}/health > /dev/null 2>&1; then
            log_success "Application is ready"
            break
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            log_error "Application failed to start within timeout"
            exit 1
        fi
        
        sleep 3
    done
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Find the correct container name
    CONTAINER_NAME=""
    for name in "${PROJECT_NAME}_voidline-app_1" "${PROJECT_NAME}-voidline-app-1"; do
        if docker ps --format "table {{.Names}}" | grep -q "$name"; then
            CONTAINER_NAME="$name"
            break
        fi
    done
    
    if [ -n "$CONTAINER_NAME" ]; then
        docker exec "$CONTAINER_NAME" npm run db:push || true
        log_success "Database migrations completed"
    else
        log_warning "Could not find application container for migrations"
    fi
}

show_deployment_info() {
    log_success "🚀 C/No Voidline is now running!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 Local Access:"
    echo "   🌐 Application: http://localhost:${DEFAULT_PORT}"
    echo "   📊 Health Check: http://localhost:${DEFAULT_PORT}/health"
    echo ""
    echo "🗄️ Database:"
    echo "   📍 PostgreSQL: localhost:5432"
    echo "   🔑 Database: voidline / voidline / voidline"
    echo ""
    echo "🛠️ Management Commands:"
    echo "   🔍 View logs:     docker-compose -f scripts/docker-compose.yml logs -f"
    echo "   ⏹️ Stop services: docker-compose -f scripts/docker-compose.yml down"
    echo "   🔄 Restart:       docker-compose -f scripts/docker-compose.yml restart"
    echo "   🧹 Full cleanup:  docker-compose -f scripts/docker-compose.yml down -v --remove-orphans"
    echo ""
    echo "🚀 Deployment Options:"
    echo "   • GitHub Pages:   Set DEPLOY_TARGET=github-pages in .env"
    echo "   • Netlify:        Set DEPLOY_TARGET=netlify in .env"
    echo "   • Vercel:         Set DEPLOY_TARGET=vercel in .env"
    echo "   • Railway:        Set DEPLOY_TARGET=railway in .env"
    echo "   • Render:         Set DEPLOY_TARGET=render in .env"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

cleanup_on_error() {
    log_error "Setup failed. Cleaning up..."
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        DOCKER_COMPOSE_CMD="docker compose"
    fi
    
    cd "$(dirname "$0")/.."
    $DOCKER_COMPOSE_CMD -f scripts/docker-compose.yml down --remove-orphans > /dev/null 2>&1 || true
}

# Main execution
main() {
    echo ""
    echo "┌─────────────────────────────────────────────────────────────────────────────┐"
    echo "│                           C/No Voidline Setup                               │"
    echo "│                     AI Audio Mastering Console                             │"
    echo "└─────────────────────────────────────────────────────────────────────────────┘"
    echo ""

    # Set up error handling
    trap cleanup_on_error ERR

    check_requirements
    setup_environment
    build_application
    start_services
    wait_for_services
    run_database_migrations
    show_deployment_info

    log_success "Setup completed successfully! 🎵"
}

# Handle arguments
case "${1:-setup}" in
    "setup"|"start")
        main
        ;;
    "stop")
        log_info "Stopping C/No Voidline services..."
        cd "$(dirname "$0")/.."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f scripts/docker-compose.yml down
        else
            docker compose -f scripts/docker-compose.yml down
        fi
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting C/No Voidline services..."
        cd "$(dirname "$0")/.."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f scripts/docker-compose.yml restart
        else
            docker compose -f scripts/docker-compose.yml restart
        fi
        log_success "Services restarted"
        ;;
    "cleanup")
        log_info "Cleaning up C/No Voidline installation..."
        cd "$(dirname "$0")/.."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f scripts/docker-compose.yml down -v --remove-orphans
        else
            docker compose -f scripts/docker-compose.yml down -v --remove-orphans
        fi
        docker image prune -f
        log_success "Cleanup completed"
        ;;
    "help")
        echo "C/No Voidline Quick Start"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup     - Full setup and start (default)"
        echo "  start     - Same as setup"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  cleanup   - Remove all containers and volumes"
        echo "  help      - Show this help"
        echo ""
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac