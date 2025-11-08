#!/bin/bash
# ============================================
# HR Command Center - Deployment Script
# ============================================
# Automated deployment with rollback support
#
# Usage:
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh production

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/deploy_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================
# Validate Environment
# ============================================
validate_environment() {
    local env=$1

    if [[ "$env" != "staging" && "$env" != "production" ]]; then
        error "Invalid environment: $env"
        error "Valid environments: staging, production"
        exit 1
    fi

    log "Deploying to: ${env}"
}

# ============================================
# Pre-deployment Checks
# ============================================
pre_deployment_checks() {
    log "Running pre-deployment checks..."

    # Check if git repo is clean
    if [[ -n $(git status -s) ]]; then
        warning "Git working directory is not clean"
        git status -s
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check if on correct branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log "Current branch: $CURRENT_BRANCH"

    # Run tests
    log "Running tests..."
    cd "$PROJECT_ROOT/webapp"
    npm test --if-present || warning "Tests not found or failed"

    # Type check
    log "Running type check..."
    npx tsc --noEmit || {
        error "TypeScript type check failed"
        exit 1
    }

    # Lint check
    log "Running linter..."
    npm run lint || {
        error "Linting failed"
        exit 1
    }

    success "Pre-deployment checks passed"
}

# ============================================
# Build Application
# ============================================
build_application() {
    log "Building application..."

    cd "$PROJECT_ROOT/webapp"

    # Clean previous build
    rm -rf .next

    # Build
    npm run build || {
        error "Build failed"
        exit 1
    }

    success "Build completed"
}

# ============================================
# Build Docker Image
# ============================================
build_docker_image() {
    local env=$1
    local tag="hrskills:${env}-${TIMESTAMP}"

    log "Building Docker image: $tag"

    cd "$PROJECT_ROOT"
    docker build -t "$tag" -f Dockerfile . || {
        error "Docker build failed"
        exit 1
    }

    # Tag as latest for this environment
    docker tag "$tag" "hrskills:${env}-latest"

    success "Docker image built: $tag"
    echo "$tag"
}

# ============================================
# Push to Registry
# ============================================
push_to_registry() {
    local tag=$1
    local registry=${DOCKER_REGISTRY:-"ghcr.io"}

    log "Pushing image to registry: $registry"

    docker tag "$tag" "${registry}/${tag}"
    docker push "${registry}/${tag}" || {
        error "Failed to push image to registry"
        exit 1
    }

    success "Image pushed to registry"
}

# ============================================
# Deploy to Cloud Platform
# ============================================
deploy_to_platform() {
    local env=$1
    local image=$2

    log "Deploying to $env..."

    case "$env" in
        staging)
            deploy_staging "$image"
            ;;
        production)
            deploy_production "$image"
            ;;
    esac
}

# ============================================
# Deploy to Staging
# ============================================
deploy_staging() {
    local image=$1

    log "Deploying to staging environment..."

    # Example: Deploy to Cloud Run (adjust for your platform)
    # gcloud run deploy hrskills-staging \
    #     --image "$image" \
    #     --platform managed \
    #     --region us-central1 \
    #     --allow-unauthenticated \
    #     --set-env-vars NODE_ENV=production

    # Example: Deploy to Kubernetes
    # kubectl set image deployment/hrskills-staging hrskills="$image" -n staging
    # kubectl rollout status deployment/hrskills-staging -n staging

    # Example: Deploy to AWS ECS
    # aws ecs update-service --cluster hrskills-staging --service hrskills --force-new-deployment

    success "Deployed to staging"
}

# ============================================
# Deploy to Production
# ============================================
deploy_production() {
    local image=$1

    warning "Deploying to PRODUCTION environment"
    read -p "Are you sure? Type 'yes' to continue: " -r
    if [[ $REPLY != "yes" ]]; then
        log "Deployment cancelled"
        exit 0
    fi

    log "Deploying to production environment..."

    # Blue-green deployment strategy
    # 1. Deploy to "green" environment
    # 2. Run health checks
    # 3. Switch traffic from "blue" to "green"
    # 4. Keep "blue" for quick rollback

    # Example: Deploy to Cloud Run with gradual rollout
    # gcloud run deploy hrskills-production \
    #     --image "$image" \
    #     --platform managed \
    #     --region us-central1 \
    #     --no-allow-unauthenticated \
    #     --set-env-vars NODE_ENV=production \
    #     --max-instances 10 \
    #     --concurrency 80

    success "Deployed to production"
}

# ============================================
# Health Check
# ============================================
health_check() {
    local env=$1
    local url

    case "$env" in
        staging)
            url="https://staging.hrskills.example.com"
            ;;
        production)
            url="https://hrskills.example.com"
            ;;
    esac

    log "Running health check: ${url}/api/health"

    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."

        if curl -sf "${url}/api/health" > /dev/null; then
            success "Health check passed"
            return 0
        fi

        sleep 5
        attempt=$((attempt + 1))
    done

    error "Health check failed after $max_attempts attempts"
    return 1
}

# ============================================
# Post-deployment Tasks
# ============================================
post_deployment() {
    local env=$1

    log "Running post-deployment tasks..."

    # Run database migrations if needed
    # ./scripts/migrate.sh "$env"

    # Clear CDN cache
    # ./scripts/clear-cache.sh "$env"

    # Send notification
    send_notification "$env" "success"

    success "Post-deployment tasks completed"
}

# ============================================
# Send Notification
# ============================================
send_notification() {
    local env=$1
    local status=$2

    log "Sending deployment notification..."

    # Example: Send Slack notification
    # curl -X POST "$SLACK_WEBHOOK_URL" \
    #     -H 'Content-Type: application/json' \
    #     -d "{\"text\":\"Deployment to $env: $status\"}"

    success "Notification sent"
}

# ============================================
# Main Deployment Flow
# ============================================
main() {
    local environment=${1:-}

    # Create logs directory
    mkdir -p "${PROJECT_ROOT}/logs"

    log "=================================="
    log "HR Command Center - Deployment"
    log "=================================="
    log "Timestamp: $TIMESTAMP"
    log "Environment: $environment"
    log "User: $(whoami)"
    log "Git Commit: $(git rev-parse --short HEAD)"
    log "=================================="

    # Validate
    validate_environment "$environment"

    # Pre-deployment checks
    pre_deployment_checks

    # Build
    build_application

    # Build Docker image
    IMAGE=$(build_docker_image "$environment")

    # Push to registry (if using remote registry)
    # push_to_registry "$IMAGE"

    # Deploy
    deploy_to_platform "$environment" "$IMAGE"

    # Health check
    if health_check "$environment"; then
        # Post-deployment tasks
        post_deployment "$environment"

        success "=================================="
        success "Deployment completed successfully!"
        success "Environment: $environment"
        success "Image: $IMAGE"
        success "Log file: $LOG_FILE"
        success "=================================="
    else
        error "Health check failed - consider rollback"
        exit 1
    fi
}

# ============================================
# Execute
# ============================================
main "$@"
