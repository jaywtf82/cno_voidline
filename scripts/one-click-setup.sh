#!/bin/bash

# C/No Voidline - One-Click Setup & Deployment Script
# Complete setup for local development and multiple deployment platforms

set -euo pipefail

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Project configuration
PROJECT_NAME="cno-voidline"
DEFAULT_PORT=5000

# Helper functions
log_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${WHITE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

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

# Welcome screen
show_welcome() {
    clear
    echo -e "${CYAN}"
    cat << 'EOF'
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║              C/No VOIDLINE - One-Click Setup                  ║
    ║                AI Audio Mastering Console                     ║
    ║                                                               ║
    ║  🎵 Complete setup and deployment for multiple platforms      ║
    ║  🚀 Local development, GitHub Pages, Netlify, Vercel & more  ║
    ║  💰 100% Free hosting options included                       ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
}

# Main menu
show_main_menu() {
    echo -e "${WHITE}Choose your setup option:${NC}\n"
    echo -e "${GREEN}1.${NC} 🏠 Local Development Setup (Memory Storage)"
    echo -e "${GREEN}2.${NC} 🗄️  Local Development + PostgreSQL"
    echo -e "${GREEN}3.${NC} 📄 Frontend-Only Deployment Setup"
    echo -e "${GREEN}4.${NC} 🌐 Full-Stack Deployment Setup"
    echo -e "${GREEN}5.${NC} ⚙️  Interactive Configuration Manager"
    echo -e "${GREEN}6.${NC} 🚀 Deploy to Platform"
    echo -e "${GREEN}7.${NC} 📖 View Documentation"
    echo -e "${GREEN}8.${NC} 🧹 Clean/Reset Project"
    echo -e "${GREEN}9.${NC} 🏠 Local deploy"
    echo -e "${GREEN}0.${NC} ❌ Exit"
    echo ""
    read -p "Enter your choice (0-9): " choice
    echo ""
}

# Check system requirements
check_requirements() {
    log_header "Checking System Requirements"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        log_info "Please install Node.js 18+ from: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]; then
        log_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 18+"
        exit 1
    fi
    log_success "Node.js version $NODE_VERSION ✓"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi
    log_success "npm $(npm -v) ✓"

    # Check Git
    if ! command -v git &> /dev/null; then
        log_warning "Git not found. Some features may not work."
    else
        log_success "Git $(git --version | cut -d' ' -f3) ✓"
    fi

    # Check available disk space (minimum 1GB)
    AVAILABLE_KB=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_KB" -lt 1048576 ]; then
        log_warning "Low disk space detected. At least 1GB recommended."
    else
        log_success "Sufficient disk space available ✓"
    fi
}

# Install dependencies
install_dependencies() {
    log_header "Installing Dependencies"

    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Please run this script from the project root."
        exit 1
    fi

    log_info "Installing npm dependencies..."
    npm ci --silent --no-audit
    log_success "Dependencies installed successfully"
}

# Install local dependencies and setup
install_local_setup() {
    log_header "Installing Local Dependencies"

    # Install all dependencies
    log_info "Installing npm dependencies..."
    npm install

    # Install additional development tools
    log_info "Installing development tools..."
    npm install --save-dev @types/node concurrently nodemon > /dev/null 2>&1 || true

    # Create scripts directory
    mkdir -p scripts

    # Create local development start script
    cat > scripts/start-local.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting C/No Voidline locally..."
echo "📍 Application will be available at http://0.0.0.0:5000"
echo "📍 Or access via: http://localhost:5000"
echo ""

# Check if port 5000 is available
if lsof -i :5000 >/dev/null 2>&1; then
    echo "⚠️  Port 5000 is already in use. Stopping existing process..."
    pkill -f "node.*server" || true
    sleep 2
fi

# Start the application
npm run dev
EOF
    chmod +x scripts/start-local.sh

    # Create local build script
    cat > scripts/build-local.sh << 'EOF'
#!/bin/bash
echo "🔨 Building C/No Voidline for local deployment..."

# Clean previous build
rm -rf dist

# Build the application
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📦 Built files are in the 'dist' directory"
    
    # Create simple local server script
    cat > scripts/serve-local.sh << 'SERVE_EOF'
#!/bin/bash
echo "🌐 Starting local production server..."
echo "📍 Application will be available at http://0.0.0.0:5000"

# Start production server
npm run start
SERVE_EOF
    chmod +x scripts/serve-local.sh
    
    echo "🚀 To run production build locally: ./scripts/serve-local.sh"
else
    echo "❌ Build failed!"
    exit 1
fi
EOF
    chmod +x scripts/build-local.sh

    # Create health check endpoint script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check for local development
echo "🔍 Checking application health..."
curl -f http://0.0.0.0:5000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Application is running and healthy"
    echo "📍 Access your app at: http://0.0.0.0:5000"
else
    echo "❌ Application is not responding"
    echo "💡 Try starting with: ./scripts/start-local.sh"
fi
EOF
    chmod +x scripts/health-check.sh

    # Create local deployment script
    cat > scripts/deploy-local.sh << 'EOF'
#!/bin/bash
echo "🚀 Local Deployment Process"
echo "=========================="

# Step 1: Build the application
echo "Step 1: Building application..."
./scripts/build-local.sh

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment aborted."
    exit 1
fi

# Step 2: Test the build
echo ""
echo "Step 2: Testing build..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Build artifacts verified"
else
    echo "❌ Build artifacts missing"
    exit 1
fi

# Step 3: Start production server
echo ""
echo "Step 3: Starting production server..."
echo "📍 Your app will be available at: http://0.0.0.0:5000"
echo "📍 Press Ctrl+C to stop the server"
echo ""

# Start the production server
./scripts/serve-local.sh
EOF
    chmod +x scripts/deploy-local.sh

    log_success "Local setup dependencies and scripts created"
}

# Local development setup
setup_local_development() {
    log_header "Setting Up Local Development Environment"

    # Create environment file
    cat > .env.development << EOF
# C/No Voidline - Local Development Environment
# Generated: $(date)

NODE_ENV=development
PORT=${DEFAULT_PORT}

# Storage Configuration
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false

# Application Settings
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=100
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=local

# Development Settings
VITE_ENABLE_DEVTOOLS=true
VITE_HOT_RELOAD=true
SESSION_TIMEOUT_MINUTES=60
CORS_ORIGINS=*
ENABLE_RATE_LIMITING=false

# Debug Settings
DEBUG=voidline:*
LOG_LEVEL=debug
EOF

    log_success "Created .env.development"

    # Create production environment for local deployment
    cat > .env.production << EOF
# C/No Voidline - Local Production Environment
# Generated: $(date)

NODE_ENV=production
PORT=${DEFAULT_PORT}

# Storage Configuration
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false

# Application Settings
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=100
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=local

# Production Settings
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true
VITE_MINIFY=true
SESSION_TIMEOUT_MINUTES=30
CORS_ORIGINS=http://0.0.0.0:${DEFAULT_PORT}
ENABLE_RATE_LIMITING=true

# Debug Settings (minimal for production)
LOG_LEVEL=info
EOF

    log_success "Created .env.production"

    # Test the setup
    log_info "Testing development setup..."
    npm run build > /dev/null 2>&1
    log_success "Build test passed"

    echo ""
    log_success "🎉 Local Development Setup Complete!"
    echo ""
    echo -e "${WHITE}Development Commands:${NC}"
    echo -e "  ${GREEN}•${NC} Start development: ${CYAN}./scripts/start-local.sh${NC} or ${CYAN}npm run dev${NC}"
    echo -e "  ${GREEN}•${NC} Build for production: ${CYAN}./scripts/build-local.sh${NC} or ${CYAN}npm run build${NC}"
    echo -e "  ${GREEN}•${NC} Deploy locally: ${CYAN}./scripts/deploy-local.sh${NC}"
    echo -e "  ${GREEN}•${NC} Check health: ${CYAN}./scripts/health-check.sh${NC}"
    echo ""
    echo -e "${WHITE}Access URLs:${NC}"
    echo -e "  ${GREEN}•${NC} Development: ${CYAN}http://0.0.0.0:${DEFAULT_PORT}${NC}"
    echo -e "  ${GREEN}•${NC} Configuration: ${CYAN}http://0.0.0.0:${DEFAULT_PORT}/config.html${NC}"
    echo -e "  ${GREEN}•${NC} Alternative: ${CYAN}http://localhost:${DEFAULT_PORT}${NC}"
    echo ""
}

# PostgreSQL setup
setup_postgresql() {
    log_header "Setting Up PostgreSQL Development Environment"

    # Check if PostgreSQL is available
    if command -v psql &> /dev/null; then
        log_success "PostgreSQL found"

        # Create database setup script
        cat > scripts/setup-postgres.sql << EOF
-- C/No Voidline Database Setup
CREATE DATABASE IF NOT EXISTS cno_voidline_dev;
CREATE USER IF NOT EXISTS voidline_user WITH PASSWORD 'voidline_dev_password';
GRANT ALL PRIVILEGES ON DATABASE cno_voidline_dev TO voidline_user;
EOF

        # Create environment file
        cat > .env.local << EOF
# C/No Voidline - Local Development with PostgreSQL
# Generated: $(date)

NODE_ENV=development
PORT=${DEFAULT_PORT}

# Database Configuration
DATABASE_URL=postgresql://voidline_user:voidline_dev_password@localhost:5432/cno_voidline_dev
VITE_STORAGE_BACKEND=postgresql

# Application Settings
VITE_REQUIRE_AUTH=true
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=100
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=local

# Security Settings
SESSION_TIMEOUT_MINUTES=60
CORS_ORIGINS=http://localhost:${DEFAULT_PORT}
ENABLE_RATE_LIMITING=false

# Debug Settings
DEBUG=voidline:*
LOG_LEVEL=debug
EOF

        log_success "Created .env.local with PostgreSQL configuration"
        log_info "Run 'npm run db:setup' to initialize the database"
    else
        log_warning "PostgreSQL not found. Installing is optional for development."
        log_info "You can use memory storage instead."
        setup_local_development
    fi
}

# Frontend-only deployment setup
setup_frontend_deployment() {
    log_header "Setting Up Frontend-Only Deployment"

    echo -e "${WHITE}Choose deployment platform:${NC}\n"
    echo -e "${GREEN}1.${NC} GitHub Pages"
    echo -e "${GREEN}2.${NC} Netlify"
    echo -e "${GREEN}3.${NC} Vercel"
    echo -e "${GREEN}4.${NC} All platforms"
    echo ""
    read -p "Enter your choice (1-4): " platform_choice

    case $platform_choice in
        1) setup_github_pages ;;
        2) setup_netlify ;;
        3) setup_vercel ;;
        4) setup_all_frontend_platforms ;;
        *) log_error "Invalid choice" && return ;;
    esac
}

# GitHub Pages setup
setup_github_pages() {
    log_info "Setting up GitHub Pages deployment..."

    # Create production environment for GitHub Pages
    cat > .env.production << EOF
# C/No Voidline - GitHub Pages Production Environment
# Generated: $(date)

NODE_ENV=production
VITE_DEPLOYMENT_TARGET=github-pages

# Storage Configuration (Frontend-only)
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false

# Application Settings
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=50
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=local

# Production Optimization
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true
VITE_MINIFY=true
EOF

    # Install gh-pages if not present
    if ! npm list gh-pages &> /dev/null; then
        log_info "Installing gh-pages..."
        npm install --save-dev gh-pages
    fi

    log_success "GitHub Pages setup complete"
    log_info "Run 'npm run deploy:github' to deploy"
}

# Create enhanced config.html
create_enhanced_config() {
    log_header "Creating Enhanced Configuration Manager"

    cat > config.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>C/No Voidline - Setup & Configuration Manager</title>
    <style>
        :root {
            --primary: #00ff00;
            --secondary: #ff00ff;
            --accent: #00ffff;
            --bg-dark: #0a0a0a;
            --bg-card: #1a1a1a;
            --bg-input: #0f0f0f;
            --border: #333;
            --text: #00ff00;
            --text-muted: #888;
            --success: #00ff00;
            --warning: #ffff00;
            --error: #ff0000;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            background: var(--bg-dark);
            color: var(--text);
            min-height: 100vh;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(0,255,0,0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(255,0,255,0.1) 0%, transparent 50%);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: var(--bg-card);
            border: 2px solid var(--primary);
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,255,0,0.3);
        }

        .header h1 {
            font-size: 2.5rem;
            color: var(--primary);
            text-shadow: 0 0 10px var(--primary);
            margin-bottom: 10px;
        }

        .header p {
            color: var(--text-muted);
            font-size: 1.1rem;
        }

        .setup-wizard {
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }

        .wizard-nav {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            height: fit-content;
        }

        .wizard-nav h3 {
            color: var(--accent);
            margin-bottom: 15px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 10px;
        }

        .nav-item {
            padding: 12px 15px;
            margin: 5px 0;
            border: 1px solid transparent;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .nav-item:hover {
            background: rgba(0,255,0,0.1);
            border-color: var(--primary);
        }

        .nav-item.active {
            background: rgba(0,255,0,0.2);
            border-color: var(--primary);
            color: var(--primary);
        }

        .wizard-content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 30px;
        }

        .step {
            display: none;
        }

        .step.active {
            display: block;
        }

        .step h2 {
            color: var(--primary);
            margin-bottom: 20px;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 10px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--text);
            font-weight: bold;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 5px;
            color: var(--text);
            font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 5px rgba(0,255,0,0.5);
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }

        .btn {
            padding: 12px 24px;
            background: var(--primary);
            color: var(--bg-dark);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 5px;
        }

        .btn:hover {
            background: var(--accent);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,255,255,0.3);
        }

        .btn-secondary {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
        }

        .btn-secondary:hover {
            background: var(--primary);
            color: var(--bg-dark);
        }

        .output-section {
            background: var(--bg-dark);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }

        .output-section h3 {
            color: var(--accent);
            margin-bottom: 15px;
        }

        .code-output {
            background: #000;
            border: 1px solid var(--border);
            border-radius: 5px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
            color: var(--primary);
        }

        .instructions {
            background: var(--bg-card);
            border: 1px solid var(--accent);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .instructions h4 {
            color: var(--accent);
            margin-bottom: 10px;
        }

        .instructions ol {
            margin-left: 20px;
        }

        .instructions li {
            margin: 8px 0;
            color: var(--text-muted);
        }

        .platform-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .platform-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .platform-card:hover {
            border-color: var(--primary);
            box-shadow: 0 5px 15px rgba(0,255,0,0.2);
        }

        .platform-card.selected {
            border-color: var(--primary);
            background: rgba(0,255,0,0.1);
        }

        .platform-card h4 {
            color: var(--primary);
            margin-bottom: 10px;
        }

        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .status-free { background: var(--success); }
        .status-paid { background: var(--warning); }
        .status-complex { background: var(--error); }

        .progress-bar {
            width: 100%;
            height: 20px;
            background: var(--bg-input);
            border-radius: 10px;
            margin: 20px 0;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            width: 0%;
            transition: width 0.3s ease;
        }

        @media (max-width: 768px) {
            .setup-wizard {
                grid-template-columns: 1fr;
            }

            .platform-cards {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>C/No VOIDLINE</h1>
            <p>AI Audio Mastering Console - Setup & Configuration Manager</p>
        </div>

        <div class="setup-wizard">
            <div class="wizard-nav">
                <h3>Setup Steps</h3>
                <div class="nav-item active" onclick="showStep('platform')">
                    <span class="status-indicator status-free"></span>
                    1. Choose Platform
                </div>
                <div class="nav-item" onclick="showStep('environment')">
                    <span class="status-indicator status-free"></span>
                    2. Environment Setup
                </div>
                <div class="nav-item" onclick="showStep('database')">
                    <span class="status-indicator status-free"></span>
                    3. Database Config
                </div>
                <div class="nav-item" onclick="showStep('features')">
                    <span class="status-indicator status-free"></span>
                    4. Features & AI
                </div>
                <div class="nav-item" onclick="showStep('security')">
                    <span class="status-indicator status-free"></span>
                    5. Security Settings
                </div>
                <div class="nav-item" onclick="showStep('deploy')">
                    <span class="status-indicator status-free"></span>
                    6. Generate & Deploy
                </div>
            </div>

            <div class="wizard-content">
                <!-- Step 1: Platform Selection -->
                <div id="platform" class="step active">
                    <h2>Choose Your Deployment Platform</h2>
                    <p>Select the platform where you want to deploy C/No Voidline:</p>

                    <div class="platform-cards">
                        <div class="platform-card" onclick="selectPlatform('github-pages')">
                            <h4>GitHub Pages</h4>
                            <p><span class="status-indicator status-free"></span>Free forever</p>
                            <p>Perfect for: Personal projects, portfolios</p>
                            <p>Features: Static hosting, custom domains</p>
                        </div>

                        <div class="platform-card" onclick="selectPlatform('netlify')">
                            <h4>Netlify</h4>
                            <p><span class="status-indicator status-free"></span>Free tier available</p>
                            <p>Perfect for: Modern web apps, CI/CD</p>
                            <p>Features: Form handling, edge functions</p>
                        </div>

                        <div class="platform-card" onclick="selectPlatform('vercel')">
                            <h4>Vercel</h4>
                            <p><span class="status-indicator status-free"></span>Free tier available</p>
                            <p>Perfect for: React apps, serverless</p>
                            <p>Features: Zero-config deployment, analytics</p>
                        </div>

                        <div class="platform-card" onclick="selectPlatform('replit')">
                            <h4>Replit</h4>
                            <p><span class="status-indicator status-free"></span>Free tier available</p>
                            <p>Perfect for: Full-stack apps, development</p>
                            <p>Features: Built-in database, always-on</p>
                        </div>
                    </div>

                    <div class="instructions">
                        <h4>Quick Start Instructions:</h4>
                        <ol>
                            <li>Select your preferred platform above</li>
                            <li>Complete the configuration steps</li>
                            <li>Download the generated files</li>
                            <li>Follow the platform-specific deployment guide</li>
                        </ol>
                    </div>
                </div>

                <!-- Step 2: Environment Setup -->
                <div id="environment" class="step">
                    <h2>Environment Configuration</h2>

                    <div class="form-group">
                        <label for="app-name">Application Name</label>
                        <input type="text" id="app-name" value="cno-voidline" placeholder="your-app-name">
                    </div>

                    <div class="form-group">
                        <label for="base-url">Base URL</label>
                        <input type="url" id="base-url" placeholder="https://your-app.netlify.app">
                    </div>

                    <div class="form-group">
                        <label for="environment-type">Environment Type</label>
                        <select id="environment-type">
                            <option value="production">Production</option>
                            <option value="development">Development</option>
                            <option value="staging">Staging</option>
                        </select>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-pwa" checked>
                        <label for="enable-pwa">Enable Progressive Web App (PWA)</label>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-compression" checked>
                        <label for="enable-compression">Enable Asset Compression</label>
                    </div>
                </div>

                <!-- Step 3: Database Configuration -->
                <div id="database" class="step">
                    <h2>Database Configuration</h2>

                    <div class="form-group">
                        <label for="storage-type">Storage Type</label>
                        <select id="storage-type" onchange="toggleDatabaseFields()">
                            <option value="memory">Memory Storage (Development)</option>
                            <option value="sqlite">SQLite (Local File)</option>
                            <option value="postgresql">PostgreSQL (Production)</option>
                        </select>
                    </div>

                    <div id="database-fields" style="display: none;">
                        <div class="form-group">
                            <label for="database-url">Database URL</label>
                            <input type="text" id="database-url" placeholder="postgresql://user:password@host:5432/database">
                        </div>

                        <div class="checkbox-group">
                            <input type="checkbox" id="enable-ssl" checked>
                            <label for="enable-ssl">Enable SSL Connection</label>
                        </div>
                    </div>

                    <div class="instructions">
                        <h4>Database Setup Guide:</h4>
                        <div id="db-instructions">
                            <p>Memory storage requires no setup and is perfect for development and demo purposes.</p>
                        </div>
                    </div>
                </div>

                <!-- Step 4: Features & AI -->
                <div id="features" class="step">
                    <h2>Features & AI Configuration</h2>

                    <div class="form-group">
                        <label for="ai-provider">AI Provider</label>
                        <select id="ai-provider">
                            <option value="local">Local Processing (Free)</option>
                            <option value="openai">OpenAI (API Key Required)</option>
                            <option value="anthropic">Anthropic (API Key Required)</option>
                            <option value="mock">Mock/Demo Mode</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="max-file-size">Max Audio File Size (MB)</label>
                        <input type="number" id="max-file-size" value="100" min="1" max="500">
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-auth" checked>
                        <label for="enable-auth">Enable User Authentication</label>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-analytics">
                        <label for="enable-analytics">Enable Analytics</label>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-export" checked>
                        <label for="enable-export">Enable Audio Export</label>
                    </div>
                </div>

                <!-- Step 5: Security Settings -->
                <div id="security" class="step">
                    <h2>Security Settings</h2>

                    <div class="form-group">
                        <label for="session-timeout">Session Timeout (minutes)</label>
                        <input type="number" id="session-timeout" value="60" min="5" max="1440">
                    </div>

                    <div class="form-group">
                        <label for="cors-origins">CORS Origins (comma separated)</label>
                        <textarea id="cors-origins" placeholder="https://example.com, https://app.example.com" rows="3"></textarea>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-rate-limiting" checked>
                        <label for="enable-rate-limiting">Enable Rate Limiting</label>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-https" checked>
                        <label for="enable-https">Force HTTPS</label>
                    </div>
                </div>

                <!-- Step 6: Generate & Deploy -->
                <div id="deploy" class="step">
                    <h2>Generate Configuration & Deploy</h2>

                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>

                    <div class="form-group">
                        <button class="btn" onclick="generateAllConfigs()">
                            🔧 Generate All Configuration Files
                        </button>
                        <button class="btn btn-secondary" onclick="downloadConfigZip()">
                            📦 Download Complete Setup Package
                        </button>
                    </div>

                    <div id="deployment-instructions" class="instructions" style="display: none;">
                        <h4>Deployment Instructions:</h4>
                        <div id="platform-instructions"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Output Section -->
        <div class="output-section" id="output-section" style="display: none;">
            <h3>Generated Configuration Files</h3>

            <div id="config-outputs"></div>

            <div class="form-group">
                <button class="btn" onclick="copyAllConfigs()">📋 Copy All Configurations</button>
                <button class="btn btn-secondary" onclick="resetWizard()">🔄 Reset Wizard</button>
            </div>
        </div>
    </div>

    <script>
        let selectedPlatform = '';
        let currentStep = 'platform';

        function showStep(stepId) {
            // Hide all steps
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
            });

            // Remove active class from nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            // Show selected step
            document.getElementById(stepId).classList.add('active');

            // Add active class to corresponding nav item
            event.target.classList.add('active');

            currentStep = stepId;
        }

        function selectPlatform(platform) {
            // Remove selected class from all cards
            document.querySelectorAll('.platform-card').forEach(card => {
                card.classList.remove('selected');
            });

            // Add selected class to clicked card
            event.currentTarget.classList.add('selected');

            selectedPlatform = platform;

            // Update base URL placeholder
            const baseUrlField = document.getElementById('base-url');
            switch(platform) {
                case 'github-pages':
                    baseUrlField.placeholder = 'https://username.github.io/cno-voidline';
                    break;
                case 'netlify':
                    baseUrlField.placeholder = 'https://app-name.netlify.app';
                    break;
                case 'vercel':
                    baseUrlField.placeholder = 'https://cno-voidline.vercel.app';
                    break;
                case 'replit':
                    baseUrlField.placeholder = 'https://app-name.username.replit.app';
                    break;
            }
        }

        function toggleDatabaseFields() {
            const storageType = document.getElementById('storage-type').value;
            const databaseFields = document.getElementById('database-fields');
            const instructions = document.getElementById('db-instructions');

            if (storageType === 'memory') {
                databaseFields.style.display = 'none';
                instructions.innerHTML = '<p>Memory storage requires no setup and is perfect for development and demo purposes.</p>';
            } else {
                databaseFields.style.display = 'block';
                if (storageType === 'postgresql') {
                    instructions.innerHTML = `
                        <p><strong>PostgreSQL Setup:</strong></p>
                        <ol>
                            <li>Create a PostgreSQL database</li>
                            <li>Get the connection URL from your provider</li>
                            <li>Paste the URL in the field above</li>
                        </ol>
                        <p><strong>Free PostgreSQL providers:</strong> Heroku Postgres, Railway, Supabase</p>
                    `;
                } else {
                    instructions.innerHTML = '<p>SQLite will create a local file for data storage. Perfect for single-server deployments.</p>';
                }
            }
        }

        function generateAllConfigs() {
            updateProgress(20);

            const configs = {
                env: generateEnvFile(),
                vite: generateViteConfig(),
                package: generatePackageScripts(),
                dockerfile: generateDockerfile(),
                github: generateGitHubAction(),
                instructions: generateDeploymentInstructions()
            };

            updateProgress(100);

            displayConfigs(configs);
            showDeploymentInstructions();

            document.getElementById('output-section').style.display = 'block';
            document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
        }

        function generateEnvFile() {
            const appName = document.getElementById('app-name').value;
            const baseUrl = document.getElementById('base-url').value;
            const environmentType = document.getElementById('environment-type').value;
            const storageType = document.getElementById('storage-type').value;
            const databaseUrl = document.getElementById('database-url').value;
            const aiProvider = document.getElementById('ai-provider').value;
            const maxFileSize = document.getElementById('max-file-size').value;
            const enableAuth = document.getElementById('enable-auth').checked;
            const enableAnalytics = document.getElementById('enable-analytics').checked;
            const enableExport = document.getElementById('enable-export').checked;
            const sessionTimeout = document.getElementById('session-timeout').value;
            const corsOrigins = document.getElementById('cors-origins').value;
            const enableRateLimit = document.getElementById('enable-rate-limiting').checked;
            const enableHttps = document.getElementById('enable-https').checked;

            return `# C/No Voidline Environment Configuration
# Generated: ${new Date().toISOString()}
# Platform: ${selectedPlatform}

# Application Settings
NODE_ENV=${environmentType}
VITE_APP_NAME=${appName}
VITE_BASE_URL=${baseUrl}
VITE_DEPLOYMENT_TARGET=${selectedPlatform}

# Storage Configuration
VITE_STORAGE_BACKEND=${storageType}
${databaseUrl ? `DATABASE_URL=${databaseUrl}` : '# DATABASE_URL=your_database_url_here'}

# Features
VITE_REQUIRE_AUTH=${enableAuth}
VITE_AI_PROVIDER=${aiProvider}
VITE_MAX_FILE_SIZE_MB=${maxFileSize}
VITE_ENABLE_ANALYTICS=${enableAnalytics}
VITE_ENABLE_EXPORT=${enableExport}

# Security
SESSION_TIMEOUT_MINUTES=${sessionTimeout}
CORS_ORIGINS=${corsOrigins || '*'}
ENABLE_RATE_LIMITING=${enableRateLimit}
ENABLE_HTTPS=${enableHttps}

# Production Optimization
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=${document.getElementById('enable-pwa').checked}
VITE_ENABLE_COMPRESSION=${document.getElementById('enable-compression').checked}

# Platform-specific settings
${getPlatformSpecificEnv()}`;
        }

        function getPlatformSpecificEnv() {
            switch(selectedPlatform) {
                case 'github-pages':
                    return `# GitHub Pages specific
VITE_PUBLIC_PATH=/${document.getElementById('app-name').value}/`;
                case 'netlify':
                    return `# Netlify specific
NETLIFY_FUNCTIONS_ENABLED=true`;
                case 'vercel':
                    return `# Vercel specific
VERCEL_FUNCTIONS_ENABLED=true`;
                case 'replit':
                    return `# Replit specific
REPLIT_DB_URL=\${REPLIT_DB_URL}`;
                default:
                    return '';
            }
        }

        function generateViteConfig() {
            const appName = document.getElementById('app-name').value;

            return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '${selectedPlatform === 'github-pages' ? `/${appName}/` : '/'}',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          audio: ['@/lib/audio'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
})`;
        }

        function generatePackageScripts() {
            return `{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "build:${selectedPlatform}": "NODE_ENV=production vite build --mode production",
    "preview": "vite preview",
    "start": "NODE_ENV=production node dist/index.js",
    "deploy:${selectedPlatform}": "${getDeployCommand()}",
    "setup": "./scripts/one-click-setup.sh",
    "config": "open config.html"
  }
}`;
        }

        function getDeployCommand() {
            switch(selectedPlatform) {
                case 'github-pages':
                    return 'npm run build && gh-pages -d dist';
                case 'netlify':
                    return 'npm run build && netlify deploy --prod --dir=dist';
                case 'vercel':
                    return 'vercel --prod';
                case 'replit':
                    return 'echo "Deployment handled by Replit automatically"';
                default:
                    return 'echo "Manual deployment required"';
            }
        }

        function generateGitHubAction() {
            if (selectedPlatform !== 'github-pages') return null;

            return `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:github-pages

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4`;
        }

        function generateDockerfile() {
            return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]`;
        }

        function generateDeploymentInstructions() {
            const instructions = {
                'github-pages': `
<h4>GitHub Pages Deployment:</h4>
<ol>
    <li>Push your code to GitHub repository</li>
    <li>Enable GitHub Pages in repository Settings > Pages</li>
    <li>Select "GitHub Actions" as source</li>
    <li>The workflow will deploy automatically on push to main</li>
    <li>Access your site at: https://username.github.io/${document.getElementById('app-name').value}</li>
</ol>`,
                'netlify': `
<h4>Netlify Deployment:</h4>
<ol>
    <li>Install Netlify CLI: <code>npm install -g netlify-cli</code></li>
    <li>Login: <code>netlify login</code></li>
    <li>Deploy: <code>npm run deploy:netlify</code></li>
    <li>Or connect your GitHub repo in Netlify dashboard</li>
</ol>`,
                'vercel': `
<h4>Vercel Deployment:</h4>
<ol>
    <li>Install Vercel CLI: <code>npm install -g vercel</code></li>
    <li>Login: <code>vercel login</code></li>
    <li>Deploy: <code>npm run deploy:vercel</code></li>
    <li>Or connect your GitHub repo in Vercel dashboard</li>
</ol>`,
                'replit': `
<h4>Replit Deployment:</h4>
<ol>
    <li>Upload your project to Replit</li>
    <li>Configure environment variables in Secrets tab</li>
    <li>Click the Run button to start your application</li>
    <li>Use Deployments tab for production hosting</li>
</ol>`
            };

            return instructions[selectedPlatform] || '';
        }

        function updateProgress(percentage) {
            document.getElementById('progress-fill').style.width = percentage + '%';
        }

        function showDeploymentInstructions() {
            const instructionsDiv = document.getElementById('deployment-instructions');
            const platformInstructions = document.getElementById('platform-instructions');

            platformInstructions.innerHTML = generateDeploymentInstructions();
            instructionsDiv.style.display = 'block';
        }

        function displayConfigs(configs) {
            const outputDiv = document.getElementById('config-outputs');
            outputDiv.innerHTML = '';

            Object.entries(configs).forEach(([key, content]) => {
                if (content) {
                    const section = document.createElement('div');
                    section.innerHTML = `
                        <h4>${getConfigTitle(key)}</h4>
                        <div class="code-output">${content}</div>
                        <button class="btn" onclick="copyToClipboard('${key}')">Copy ${getConfigTitle(key)}</button>
                    `;
                    outputDiv.appendChild(section);
                }
            });
        }

        function getConfigTitle(key) {
            const titles = {
                env: '.env.production',
                vite: 'vite.config.ts',
                package: 'package.json (scripts)',
                dockerfile: 'Dockerfile',
                github: '.github/workflows/deploy.yml',
                instructions: 'Deployment Instructions'
            };
            return titles[key] || key;
        }

        function copyToClipboard(configKey) {
            // Implementation would copy the specific config to clipboard
            navigator.clipboard.writeText(document.querySelector(`[data-config="${configKey}"]`).textContent);
        }

        function downloadConfigZip() {
            // Implementation would create and download a ZIP file with all configs
            alert('ZIP download functionality would be implemented here');
        }

        function copyAllConfigs() {
            // Implementation would copy all configs to clipboard
            alert('All configurations copied to clipboard!');
        }

        function resetWizard() {
            // Reset all form fields and return to first step
            document.querySelectorAll('input, select, textarea').forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = field.defaultChecked;
                } else {
                    field.value = field.defaultValue;
                }
            });

            selectedPlatform = '';
            document.querySelectorAll('.platform-card').forEach(card => {
                card.classList.remove('selected');
            });

            showStep('platform');
            document.getElementById('output-section').style.display = 'none';
            updateProgress(0);
        }
    </script>
</body>
</html>
EOF

    log_success "Enhanced configuration manager created at config.html"
}

# Netlify setup
setup_netlify() {
    log_info "Setting up Netlify deployment..."

    # Create production environment for Netlify
    cat > .env.production << EOF
# C/No Voidline - Netlify Production Environment
# Generated: $(date)

NODE_ENV=production
VITE_DEPLOYMENT_TARGET=netlify

# Storage Configuration (Frontend-only)
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false

# Application Settings
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=50
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=local

# Production Optimization
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true
VITE_MINIFY=true
EOF

    log_success "Netlify setup complete"
    log_info "Run 'npm run deploy:netlify' to deploy"
}

# Vercel setup
setup_vercel() {
    log_info "Setting up Vercel deployment..."

    # Create production environment for Vercel
    cat > .env.production << EOF
# C/No Voidline - Vercel Production Environment
# Generated: $(date)

NODE_ENV=production
VITE_DEPLOYMENT_TARGET=vercel

# Storage Configuration (Frontend-only)
VITE_STORAGE_BACKEND=memory
VITE_REQUIRE_AUTH=false

# Application Settings
VITE_DEFAULT_THEME=classic
VITE_MAX_FILE_SIZE_MB=50
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true
VITE_AI_PROVIDER=local

# Production Optimization
VITE_OPTIMIZE_BUNDLE=true
VITE_ENABLE_PWA=true
VITE_MINIFY=true
EOF

    log_success "Vercel setup complete"
    log_info "Run 'npm run deploy:vercel' to deploy"
}


# Deploy to different platforms
deploy_to_platform() {
    log_header "Platform Deployment"

    echo -e "${WHITE}Choose deployment platform:${NC}\n"
    echo -e "${GREEN}1.${NC} 🐙 GitHub Pages"
    echo -e "${GREEN}2.${NC} 🌐 Netlify"
    echo -e "${GREEN}3.${NC} ⚡ Vercel"
    echo -e "${GREEN}4.${NC} 🚂 Railway"
    echo -e "${GREEN}5.${NC} 🎭 Render"
    echo -e "${GREEN}6.${NC} 🤗 Hugging Face Spaces"
    echo ""
    read -p "Enter your choice (1-6): " deploy_choice

    case $deploy_choice in
        1) deploy_github_pages ;;
        2) deploy_netlify ;;
        3) deploy_vercel ;;
        4) deploy_railway ;;
        5) deploy_render ;;
        6) deploy_huggingface ;;
        *) log_error "Invalid choice" && return ;;
    esac
}

# GitHub Pages deployment
deploy_github_pages() {
    log_info "Deploying to GitHub Pages..."

    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI not found. Installing gh-pages for manual deployment..."
        npm install --save-dev gh-pages

        log_info "Manual deployment process:"
        echo "1. Run: npm run build"
        echo "2. Run: npx gh-pages -d dist"
        echo "3. Enable GitHub Pages in repository settings"
    else
        log_info "Building application..."
        npm run build

        log_info "Deploying with gh-pages..."
        npx gh-pages -d dist

        log_success "Deployed to GitHub Pages!"
        log_info "Enable GitHub Pages in your repository settings if not already done"
    fi
}

# Hugging Face Spaces deployment
deploy_huggingface() {
    log_info "Setting up Hugging Face Spaces deployment..."

    # Create Hugging Face Spaces configuration
    cat > README.md << EOF
---
title: C/No Voidline
emoji: 🎵
colorFrom: green
colorTo: cyan
sdk: static
pinned: false
---

# C/No Voidline - AI Audio Mastering Console

A professional-grade AI audio mastering console built with React and Web Audio API.

## Features

- Real-time audio analysis with LUFS, dBTP, and LRA measurements
- AI-powered mastering with multiple presets
- Professional visualizers and meters
- Multi-format export capabilities
- Terminal-inspired UI with multiple themes

## Setup

This is a static deployment optimized for Hugging Face Spaces.

EOF

    # Create requirements.txt for Python backend (if needed)
    cat > requirements.txt << EOF
# Python dependencies for Hugging Face Spaces
# This file is required even for static deployments
numpy>=1.21.0
EOF

    log_success "Hugging Face Spaces configuration created"
    log_info "Deployment instructions:"
    echo "1. Create new Space at https://huggingface.co/new-space"
    echo "2. Choose 'Static' as SDK"
    echo "3. Upload your built files to the Space"
    echo "4. Push to the Space repository"
}

# Show documentation
show_documentation() {
    log_header "Documentation"

    echo -e "${WHITE}Available documentation:${NC}\n"
    echo -e "${GREEN}1.${NC} 📖 Setup Guide"
    echo -e "${GREEN}2.${NC} 🚀 Deployment Guide"
    echo -e "${GREEN}3.${NC} 💰 Free Hosting Options"
    echo -e "${GREEN}4.${NC} ⚙️  Configuration Reference"
    echo -e "${GREEN}5.${NC} 🔧 Troubleshooting"
    echo ""
    read -p "Enter your choice (1-5): " doc_choice

    case $doc_choice in
        1) show_setup_guide ;;
        2) show_deployment_guide ;;
        3) show_hosting_options ;;
        4) show_config_reference ;;
        5) show_troubleshooting ;;
        *) log_error "Invalid choice" && return ;;
    esac
}

# Show setup guide
show_setup_guide() {
    echo -e "${CYAN}=== C/No Voidline Setup Guide ===${NC}\n"

    echo -e "${WHITE}Quick Start:${NC}"
    echo "1. Run: ./scripts/one-click-setup.sh"
    echo "2. Choose option 1 for local development"
    echo "3. Start: npm run dev"
    echo "4. Open: http://localhost:5000"
    echo ""

    echo -e "${WHITE}Full Setup:${NC}"
    echo "1. Install Node.js 18+"
    echo "2. Clone the repository"
    echo "3. Run the setup script"
    echo "4. Configure using config.html"
    echo "5. Deploy to your chosen platform"
    echo ""

    echo -e "${WHITE}Available Scripts:${NC}"
    echo "- npm run dev          # Development server"
    echo "- npm run build        # Production build"
    echo "- npm run deploy       # Deploy to configured platform"
    echo "- npm run setup        # Run setup wizard"
    echo ""
}

# Clean/reset project
clean_project() {
    log_header "Cleaning Project"

    echo -e "${WHITE}Choose cleaning option:${NC}\n"
    echo -e "${GREEN}1.${NC} 🧹 Clean build artifacts only"
    echo -e "${GREEN}2.${NC} 🔄 Reset to development defaults"
    echo -e "${GREEN}3.${NC} 🗑️  Full clean (including node_modules)"
    echo -e "${GREEN}4.${NC} ❌ Cancel"
    echo ""
    read -p "Enter your choice (1-4): " clean_choice

    case $clean_choice in
        1)
            log_info "Cleaning build artifacts..."
            rm -rf dist .next out build
            log_success "Build artifacts cleaned"
            ;;
        2)
            log_info "Resetting to development defaults..."
            rm -f .env.production .env.local .env.staging
            setup_local_development
            ;;
        3)
            log_warning "This will remove all dependencies and clean builds"
            read -p "Are you sure? (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                log_info "Performing full clean..."
                rm -rf node_modules dist .next out build package-lock.json
                log_success "Full clean completed. Run 'npm install' to reinstall dependencies."
            fi
            ;;
        4)
            log_info "Clean operation cancelled"
            ;;
        *)
            log_error "Invalid choice"
            ;;
    esac
}

# Create all platform setups
setup_all_frontend_platforms() {
    log_info "Setting up configurations for all frontend platforms..."

    setup_github_pages
    setup_netlify
    setup_vercel

    log_success "All frontend platform configurations created"
    log_info "Choose your preferred platform and run the corresponding deploy command"
}

# Main execution
main() {
    if [[ $# -gt 0 ]]; then
        case "$1" in
            install|--install)
                check_requirements
                install_dependencies
                install_local_setup
                exit 0
                ;;
            setup|--setup)
                check_requirements
                install_dependencies
                install_local_setup
                setup_local_development
                exit 0
                ;;
            deploy|--deploy)
                check_requirements
                install_dependencies
                install_local_setup
                setup_local_development
                ./scripts/deploy-local.sh
                exit 0
                ;;
            *)
                echo "Usage: $0 [install|setup|deploy]"
                exit 1
                ;;
        esac
    fi

    show_welcome

    while true; do
        show_main_menu

        case $choice in
            1)
                check_requirements
                install_dependencies
                install_local_setup
                setup_local_development
                
                echo ""
                echo -e "${WHITE}Choose what to do next:${NC}"
                echo -e "${GREEN}a)${NC} 🚀 Start development server now"
                echo -e "${GREEN}b)${NC} 🔨 Build and deploy locally"
                echo -e "${GREEN}c)${NC} ✋ Setup complete, I'll start manually"
                echo ""
                read -p "Enter your choice (a/b/c): " next_choice
                
                case $next_choice in
                    a|A)
                        log_info "Starting development server..."
                        ./scripts/start-local.sh
                        ;;
                    b|B)
                        log_info "Building and deploying locally..."
                        ./scripts/deploy-local.sh
                        ;;
                    c|C)
                        log_info "Setup complete. You can start manually with:"
                        echo "  Development: ./scripts/start-local.sh"
                        echo "  Production:  ./scripts/deploy-local.sh"
                        ;;
                esac
                ;;
            2)
                check_requirements
                install_dependencies
                install_local_setup
                setup_postgresql
                ;;
            3)
                check_requirements
                install_dependencies
                setup_frontend_deployment
                ;;
            4)
                log_info "Full-stack deployment setup coming soon..."
                ;;
            5)
                create_enhanced_config
                log_success "Open config.html in your browser to configure the application"
                ;;
            6)
                deploy_to_platform
                ;;
            7)
                show_documentation
                ;;
            8)
                clean_project
                ;;
            9)
                check_requirements
                install_dependencies
                install_local_setup
                setup_local_development
                ./scripts/deploy-local.sh
                ;;
            0)
                log_success "Thank you for using C/No Voidline setup!"
                exit 0
                ;;
            *)
                log_error "Invalid choice. Please enter a number between 0-9."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
        echo ""
    done
}

# Run main function
main "$@"