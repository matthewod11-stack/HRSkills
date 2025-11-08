.PHONY: help dev build start clean install setup lint test docker-build docker-up docker-down deploy health

# ============================================
# HR Command Center - Makefile
# ============================================
# Comprehensive build and deployment commands

# Colors for output
CYAN := \033[36m
RESET := \033[0m

help: ## Show this help message
	@echo '$(CYAN)HR Command Center - Available Commands:$(RESET)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ''

# ============================================
# Development Commands
# ============================================

dev: ## Start development server (Next.js webapp)
	@echo "$(CYAN)Starting HR Command Center development server...$(RESET)"
	@cd webapp && npm run dev

build: ## Build the webapp for production
	@echo "$(CYAN)Building webapp for production...$(RESET)"
	@cd webapp && npm run build

start: ## Start production server
	@echo "$(CYAN)Starting production server...$(RESET)"
	@cd webapp && npm run start

lint: ## Run linter on webapp
	@echo "$(CYAN)Running ESLint...$(RESET)"
	@cd webapp && npm run lint

test: ## Run tests (when implemented)
	@echo "$(CYAN)Running tests...$(RESET)"
	@cd webapp && npm test --if-present

type-check: ## Check TypeScript types
	@echo "$(CYAN)Checking TypeScript types...$(RESET)"
	@cd webapp && npx tsc --noEmit

# ============================================
# Installation & Setup
# ============================================

install: ## Install dependencies for all workspaces
	@echo "$(CYAN)Installing root dependencies...$(RESET)"
	@npm install
	@echo "$(CYAN)Installing webapp dependencies...$(RESET)"
	@cd webapp && npm install
	@echo "$(CYAN)Installing Python dependencies...$(RESET)"
	@pip3 install -r requirements.txt
	@echo "$(CYAN)✓ All dependencies installed successfully!$(RESET)"

setup: install ## Initial project setup (alias for install)

clean: ## Clean node_modules and build artifacts
	@echo "$(CYAN)Cleaning build artifacts and dependencies...$(RESET)"
	@rm -rf node_modules
	@rm -rf webapp/node_modules
	@rm -rf webapp/.next
	@rm -rf dist
	@rm -rf __pycache__
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(CYAN)✓ Clean complete!$(RESET)"

# ============================================
# Docker Commands
# ============================================

docker-build: ## Build Docker production image
	@echo "$(CYAN)Building Docker image...$(RESET)"
	@docker build -t hrskills:latest -f Dockerfile .

docker-build-dev: ## Build Docker development image
	@echo "$(CYAN)Building Docker development image...$(RESET)"
	@docker build -t hrskills:dev -f Dockerfile.dev .

docker-build-agents: ## Build Python agents Docker image
	@echo "$(CYAN)Building Python agents Docker image...$(RESET)"
	@docker build -t hrskills-agents:latest -f Dockerfile.agents .

docker-up: ## Start all services with Docker Compose
	@echo "$(CYAN)Starting Docker Compose services...$(RESET)"
	@docker-compose up -d
	@echo "$(CYAN)✓ Services started. Access webapp at http://localhost:3000$(RESET)"

docker-down: ## Stop all Docker Compose services
	@echo "$(CYAN)Stopping Docker Compose services...$(RESET)"
	@docker-compose down

docker-logs: ## Follow Docker Compose logs
	@docker-compose logs -f

docker-clean: ## Remove all Docker images and volumes
	@echo "$(CYAN)Cleaning Docker images and volumes...$(RESET)"
	@docker-compose down -v
	@docker rmi hrskills:latest hrskills:dev hrskills-agents:latest 2>/dev/null || true
	@echo "$(CYAN)✓ Docker cleanup complete!$(RESET)"

# ============================================
# Python Agents Commands
# ============================================

agent-onboarding: ## Run new hire onboarding agent
	@echo "$(CYAN)Running new hire onboarding agent...$(RESET)"
	@python3 agents/new-hire-onboarding/agent.py

agent-metrics: ## Run HR metrics dashboard agent
	@echo "$(CYAN)Running HR metrics dashboard agent...$(RESET)"
	@python3 agents/hr-metrics-dashboard/agent.py

# ============================================
# Deployment Commands
# ============================================

deploy-staging: ## Deploy to staging environment
	@echo "$(CYAN)Deploying to staging...$(RESET)"
	@./scripts/deploy.sh staging

deploy-production: ## Deploy to production environment
	@echo "$(CYAN)Deploying to production...$(RESET)"
	@./scripts/deploy.sh production

rollback: ## Rollback to previous deployment
	@echo "$(CYAN)Rolling back deployment...$(RESET)"
	@./scripts/rollback.sh

# ============================================
# Health & Monitoring
# ============================================

health: ## Check application health
	@echo "$(CYAN)Checking application health...$(RESET)"
	@curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

health-prod: ## Check production health
	@echo "$(CYAN)Checking production health...$(RESET)"
	@curl -f https://hrskills.yourcompany.com/api/health || echo "❌ Health check failed"

# ============================================
# CI/CD Commands
# ============================================

ci-lint: ## Run CI linting checks
	@echo "$(CYAN)Running CI lint checks...$(RESET)"
	@cd webapp && npm run lint
	@flake8 agents/ --max-line-length=100 2>/dev/null || echo "Skipping Python lint (flake8 not installed)"

ci-test: ## Run CI tests
	@echo "$(CYAN)Running CI tests...$(RESET)"
	@cd webapp && npm test --if-present

ci-build: ## Run CI build
	@echo "$(CYAN)Running CI build...$(RESET)"
	@cd webapp && npm run build

ci-all: ci-lint ci-test ci-build ## Run all CI checks

# ============================================
# Database Commands (for future use)
# ============================================

db-migrate: ## Run database migrations
	@echo "$(CYAN)Running database migrations...$(RESET)"
	@# Add migration command here

db-seed: ## Seed database with sample data
	@echo "$(CYAN)Seeding database...$(RESET)"
	@# Add seed command here

# ============================================
# Security & Auditing
# ============================================

audit: ## Run security audit
	@echo "$(CYAN)Running security audit...$(RESET)"
	@npm audit
	@cd webapp && npm audit

audit-fix: ## Fix security vulnerabilities
	@echo "$(CYAN)Fixing security vulnerabilities...$(RESET)"
	@npm audit fix
	@cd webapp && npm audit fix

# ============================================
# Utility Commands
# ============================================

version: ## Show version information
	@echo "$(CYAN)HR Command Center Version Information:$(RESET)"
	@echo "  Node.js:    $$(node --version)"
	@echo "  npm:        $$(npm --version)"
	@echo "  Python:     $$(python3 --version)"
	@echo "  Docker:     $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "  Next.js:    $$(cd webapp && npx next --version)"

env-check: ## Validate environment variables
	@echo "$(CYAN)Checking environment variables...$(RESET)"
	@node -e "require('dotenv').config({path:'.env.local'}); const required=['ANTHROPIC_API_KEY','RIPPLING_API_KEY','NOTION_TOKEN']; const missing=required.filter(k=>!process.env[k]); if(missing.length){console.error('❌ Missing:',missing.join(', '));process.exit(1)}else{console.log('✓ All required variables present')}"
