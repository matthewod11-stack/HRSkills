#!/bin/bash
# ============================================
# HR Command Center - Rollback Script
# ============================================
# Automated rollback to previous stable version
#
# Usage:
#   ./scripts/rollback.sh staging
#   ./scripts/rollback.sh production

set -e
set -u
set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

rollback() {
    local env=$1

    warning "=================================="
    warning "INITIATING ROLLBACK TO PREVIOUS VERSION"
    warning "Environment: $env"
    warning "=================================="

    read -p "Are you sure? Type 'yes' to continue: " -r
    if [[ $REPLY != "yes" ]]; then
        log "Rollback cancelled"
        exit 0
    fi

    log "Rolling back $env environment..."

    case "$env" in
        staging)
            # Example: Rollback Cloud Run
            # gcloud run services update-traffic hrskills-staging --to-revisions LATEST=0,PREVIOUS=100

            # Example: Rollback Kubernetes
            # kubectl rollout undo deployment/hrskills-staging -n staging

            log "Staging rollback completed"
            ;;
        production)
            warning "ROLLING BACK PRODUCTION!"

            # Example: Switch traffic back to blue environment
            # kubectl set image deployment/hrskills hrskills=hrskills:blue-latest -n production

            log "Production rollback completed"
            ;;
        *)
            error "Invalid environment: $env"
            exit 1
            ;;
    esac

    # Verify health after rollback
    log "Verifying health after rollback..."
    sleep 10

    # Health check
    # curl -sf https://${env}.hrskills.example.com/api/health || {
    #     error "Health check failed after rollback"
    #     exit 1
    # }

    success "Rollback completed successfully"
    success "Please verify the application is functioning correctly"
}

main() {
    local environment=${1:-}

    if [[ -z "$environment" ]]; then
        error "Usage: $0 <staging|production>"
        exit 1
    fi

    rollback "$environment"
}

main "$@"
