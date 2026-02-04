#!/bin/bash

# E-Commerce Platform Development Setup Script
# This script helps set up and run the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    check_command "node"
    check_command "npm"
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "20" ]; then
        print_error "Node.js version 20 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js version: $(node --version)"
    print_success "npm version: $(npm --version)"
    
    # Check for Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker is available"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker is not available. You'll need to set up PostgreSQL manually."
        DOCKER_AVAILABLE=false
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    npm install
    print_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please update .env with your configuration before running the application"
        else
            print_warning "No .env.example found. Please create .env file manually."
        fi
    else
        print_success ".env file already exists"
    fi
}

# Setup database
setup_database() {
    print_header "Setting Up Database"
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_success "Starting PostgreSQL with Docker..."
        docker compose up -d postgres
        
        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 10
        
        print_success "Database started successfully"
    else
        print_warning "Please set up PostgreSQL manually and update DATABASE_URL in .env"
    fi
}

# Database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    # Check if .env exists and has DATABASE_URL
    if [ -f .env ] && grep -q "DATABASE_URL" .env; then
        npm run db:push
        print_success "Database migrations completed"
    else
        print_warning "DATABASE_URL not found in .env. Please set up environment first."
    fi
}

# Start development servers
start_development() {
    print_header "Starting Development Servers"
    
    print_success "Starting all applications in development mode..."
    print_info "API will be available at: http://localhost:3001"
    print_info "Storefront will be available at: http://localhost:3000"
    print_info "Admin will be available at: http://localhost:3002"
    
    npm run dev
}

# Main script execution
main() {
    print_header "E-Commerce Platform Development Setup"
    
    case "${1:-setup}" in
        "setup")
            check_prerequisites
            install_dependencies
            setup_environment
            setup_database
            run_migrations
            print_success "Setup completed! Run 'npm run dev' to start the applications."
            ;;
        "dev")
            start_development
            ;;
        "build")
            print_header "Building Applications"
            npm run build
            print_success "Build completed"
            ;;
        "test")
            print_header "Running Tests"
            npm run test
            print_success "Tests completed"
            ;;
        "lint")
            print_header "Running Linting"
            npm run lint
            print_success "Linting completed"
            ;;
        "type-check")
            print_header "Running Type Checking"
            npm run type-check
            print_success "Type checking completed"
            ;;
        "clean")
            print_header "Cleaning Up"
            rm -rf node_modules
            rm -rf apps/*/node_modules
            rm -rf packages/*/node_modules
            rm -rf apps/*/.next
            rm -rf apps/*/dist
            rm -rf coverage
            print_success "Clean up completed"
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  setup       - Complete setup (default)"
            echo "  dev         - Start development servers"
            echo "  build       - Build applications"
            echo "  test        - Run tests"
            echo "  lint        - Run linting"
            echo "  type-check  - Run type checking"
            echo "  clean       - Clean up node_modules and build files"
            echo "  help        - Show this help message"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for available commands"
            exit 1
            ;;
    esac
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Run main function with all arguments
main "$@"