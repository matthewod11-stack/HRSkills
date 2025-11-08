# DevOps Documentation - HR Command Center

## Overview

This document provides comprehensive guidance for building, deploying, and operating the HR Command Center application in production environments.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Docker Setup](#docker-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Deployment](#deployment)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Rollback Procedures](#rollback-procedures)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- **Node.js**: 20.x (specified in `.nvmrc`)
- **Python**: 3.11+
- **Docker**: 20.10+ (for containerized deployments)
- **Docker Compose**: 2.0+ (for local development)
- **npm**: 10.x+

### Local Development

```bash
# Install dependencies
make install

# Start development server
make dev

# Or with Docker
make docker-up
```

Access the application at http://localhost:3000

---

## Docker Setup

### Production Dockerfile

The production Dockerfile (`Dockerfile`) uses a multi-stage build:

1. **deps**: Install dependencies
2. **builder**: Build the Next.js application
3. **runner**: Minimal production runtime

**Key Optimizations:**
- Alpine Linux base (minimal footprint)
- Multi-stage build (reduces final image size)
- Non-root user (security)
- Layer caching optimization
- Standalone output mode (self-contained)

### Build Production Image

```bash
# Build image
make docker-build

# Or manually
docker build -t hrskills:latest -f Dockerfile .
```

### Development Environment

```bash
# Start all services (webapp, postgres, redis, agents)
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down

# Clean everything
make docker-clean
```

**Services:**
- `web`: Next.js application (port 3000)
- `postgres`: PostgreSQL database (port 5432)
- `redis`: Redis cache (port 6379)
- `agents`: Python automation agents

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger

**Jobs:**
1. **Lint**: ESLint, TypeScript type checking, Prettier
2. **Build**: Build Next.js application, run tests
3. **Python Validation**: Lint and type-check Python agents
4. **Security**: npm audit, secret scanning, dependency review
5. **Docker Build**: Test Docker image build

**Status:** All jobs must pass for PR to be mergeable

#### 2. Deployment Pipeline (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch (auto-deploy to production)
- Tagged releases (`v*.*.*`)
- Manual trigger with environment selection

**Jobs:**
1. **Build & Push**: Build Docker image, push to registry
2. **Deploy Staging**: Deploy to staging environment
3. **Deploy Production**: Deploy to production (requires staging success)
4. **Rollback**: Auto-rollback on deployment failure
5. **Database Migrations**: Run migrations post-deployment

**Deployment Strategy:** Blue-green with automated rollback

### Required GitHub Secrets

Configure these in GitHub repository settings:

```
ANTHROPIC_API_KEY          # Claude AI API key
RIPPLING_API_KEY           # Rippling API key
NOTION_TOKEN               # Notion integration token
GOOGLE_CREDENTIALS         # Google service account JSON (base64)
SLACK_BOT_TOKEN           # Slack bot token
SLACK_WEBHOOK_URL         # Slack notifications
CALENDLY_API_KEY          # Calendly API key
DATABASE_URL              # Production database connection
REDIS_URL                 # Production Redis connection
SESSION_SECRET            # Session encryption key
JWT_SECRET                # JWT signing key
DOCKER_REGISTRY           # Container registry URL (optional)
```

---

## Deployment

### Manual Deployment

```bash
# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-production
```

### Automated Deployment

Deployments are triggered automatically via GitHub Actions:

1. **Staging**: Deployed on push to `develop` branch
2. **Production**: Deployed on push to `main` branch

### Deployment Script

The deployment script (`scripts/deploy.sh`) performs:

1. Pre-deployment checks (tests, linting, type checking)
2. Application build
3. Docker image creation
4. Image push to registry
5. Platform deployment
6. Health check verification
7. Post-deployment tasks
8. Notifications

**Usage:**

```bash
./scripts/deploy.sh staging
./scripts/deploy.sh production
```

### Environment Configuration

Use environment-specific configuration files:

- **Development**: `.env.development` → `.env.local`
- **Staging**: Managed by deployment platform secrets
- **Production**: Managed by deployment platform secrets

**NEVER commit actual secrets to version control!**

---

## Monitoring & Health Checks

### Health Check Endpoint

**Endpoint:** `/api/health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "uptime": 3600,
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "server": true,
    "memory": true
  },
  "responseTime": "5ms"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "error": "Database connection failed"
}
```

### Docker Health Check

Built into Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

### Manual Health Checks

```bash
# Local
make health
curl http://localhost:3000/api/health

# Production
make health-prod
curl https://hrskills.yourcompany.com/api/health
```

### Monitoring Integration

Add these monitoring tools:

- **Error Tracking**: Sentry
- **APM**: Datadog, New Relic
- **Logging**: CloudWatch, Loggly
- **Uptime**: Pingdom, UptimeRobot

---

## Rollback Procedures

### Automatic Rollback

The CI/CD pipeline includes automatic rollback on deployment failure.

### Manual Rollback

```bash
# Rollback staging
./scripts/rollback.sh staging

# Rollback production
./scripts/rollback.sh production
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/hrskills -n production

# Rollback to previous revision
kubectl rollout undo deployment/hrskills -n production

# Rollback to specific revision
kubectl rollout undo deployment/hrskills --to-revision=3 -n production
```

### Cloud Run Rollback

```bash
# List revisions
gcloud run revisions list --service=hrskills-production

# Rollback to previous revision
gcloud run services update-traffic hrskills-production \
  --to-revisions PREVIOUS_REVISION=100
```

---

## Security Best Practices

### 1. API Key Management

**CRITICAL:** The original `next.config.js` exposed API keys in the client bundle. This has been fixed.

**DO:**
- Store secrets in environment variables
- Access secrets only in API routes (server-side)
- Use secrets managers (AWS Secrets Manager, Google Secret Manager)
- Rotate keys regularly

**DON'T:**
- Expose secrets in `next.config.js` env section
- Commit secrets to version control
- Use production keys in development

### 2. Container Security

- Run as non-root user (implemented)
- Minimal base image (Alpine)
- Regular security scanning
- Keep dependencies updated

### 3. Network Security

- Use HTTPS only in production
- Implement rate limiting
- Configure CORS properly
- Add security headers (implemented in next.config.js)

### 4. Dependency Auditing

```bash
# Run security audit
make audit

# Auto-fix vulnerabilities
make audit-fix
```

---

## Troubleshooting

### Build Failures

**TypeScript Error:**
```
Type error: 'emp.data_sources' is possibly 'undefined'
```

**Fix:** Add null check before accessing:
```typescript
const hasSources = emp.data_sources && Array.isArray(emp.data_sources);
const hasThisSource = hasSources && emp.data_sources.includes(dataSource);
```

### Docker Build Issues

**Problem:** Build fails with "cannot find module"

**Solution:**
```bash
# Clean Docker cache
docker builder prune -af

# Rebuild with no cache
docker build --no-cache -t hrskills:latest .
```

### Health Check Failures

**Problem:** Container marked unhealthy

**Debug:**
```bash
# Check logs
docker logs <container_id>

# Exec into container
docker exec -it <container_id> sh

# Test health endpoint
curl http://localhost:3000/api/health
```

### Memory Issues

**Problem:** Application crashes with OOM error

**Solutions:**
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Review memory-intensive operations
- Implement pagination for large datasets
- Add memory monitoring

### Performance Optimization

```bash
# Analyze bundle size
cd webapp && npx next build --profile

# Check build output
ls -lh .next/static

# Enable compression
# (already configured in next.config.js)
```

---

## Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] TypeScript type check passing
- [ ] Linting passing
- [ ] Security audit clean
- [ ] Environment variables configured
- [ ] Health check endpoint working
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback procedure tested
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Support & Resources

- **Project Repository**: [Your GitHub URL]
- **CI/CD Dashboard**: GitHub Actions tab
- **Monitoring**: [Your monitoring URL]
- **On-call**: [Your on-call process]

---

## Changelog

### 2025-11-04
- Initial DevOps infrastructure setup
- Added multi-stage Dockerfile
- Created GitHub Actions CI/CD pipelines
- Implemented health check endpoint
- Fixed security vulnerability in next.config.js
- Created deployment and rollback scripts
- Added comprehensive documentation
