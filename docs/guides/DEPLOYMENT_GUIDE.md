# Deployment Guide

Complete guide for deploying HR Command Center to staging and production environments.

**Last Updated:** November 6, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Local Development](#local-development)
5. [Docker Deployment](#docker-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Manual Deployment](#manual-deployment)
8. [Platform-Specific Guides](#platform-specific-guides)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Options

HR Command Center supports multiple deployment strategies:

- **Local Development**: Hot-reload development server
- **Docker**: Containerized deployment with Docker Compose
- **Cloud Platforms**: Vercel, AWS, Google Cloud, Azure
- **Kubernetes**: Production-grade orchestration
- **CI/CD**: Automated deployment with GitHub Actions

### Architecture

```
┌─────────────────┐
│   Next.js App   │  Port 3000
│   (webapp/)     │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    │          │          │          │
┌───▼────┐ ┌──▼────┐ ┌───▼────┐ ┌───▼────┐
│ Claude │ │ Redis │ │ Postgres│ │ Python │
│  API   │ │ Cache │ │   DB    │ │ Agents │
└────────┘ └───────┘ └─────────┘ └────────┘
```

---

## Prerequisites

### Required Software

- **Node.js**: 20.x (specified in `.nvmrc`)
- **npm**: 10.x+
- **Docker**: 20.10+ (for containerized deployments)
- **Docker Compose**: 2.0+ (for local development)
- **Python**: 3.11+ (for automation agents)
- **Git**: Latest version

### Verification

```bash
# Check versions
make version

# Output:
# Node.js:    v20.x.x
# npm:        10.x.x
# Python:     3.11.x
# Docker:     20.10.x
# Next.js:    14.x.x
```

---

## Environment Configuration

### Environment Files

Create environment-specific configuration:

```bash
# Development
cp .env.development .env.local

# Production (managed by deployment platform)
# .env.production (DO NOT commit to version control)
```

### Required Environment Variables

#### Core Configuration

```bash
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Session & Security
SESSION_SECRET=your-session-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
```

#### API Keys (Required)

```bash
# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# HR Integrations
RIPPLING_API_KEY=rpl_...
NOTION_TOKEN=secret_...
SLACK_BOT_TOKEN=xoxb-...
CALENDLY_API_KEY=...

# Google Integration (base64 encoded JSON)
GOOGLE_CREDENTIALS=eyJ0eXBlIjoi...
# OR path to credentials file
GOOGLE_CREDENTIALS_PATH=/app/credentials/google-credentials.json
```

#### Database & Cache (Optional)

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/hrskills

# Redis
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=changeme123
```

#### Feature Flags

```bash
# AI Cost Optimization
ENABLE_PROMPT_CACHING=true
ENABLE_SEMANTIC_FILTERING=true
ENABLE_DYNAMIC_TOKENS=true

# Monitoring
METRICS_RETENTION_HOURS=24
MAX_STORED_METRICS=1000
```

### Validation

```bash
# Validate environment variables
make env-check
```

---

## Local Development

### Quick Start

```bash
# Install dependencies
make install

# Start development server
make dev
```

Access at http://localhost:3000

### Using Docker Compose

```bash
# Start all services (webapp, postgres, redis, agents)
make docker-up

# Follow logs
make docker-logs

# Stop services
make docker-down

# Clean everything
make docker-clean
```

### Available Services

When using Docker Compose:

- **Web**: http://localhost:3000 (Next.js app)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Agents**: Background Python agents

---

## Docker Deployment

### Production Docker Build

#### Multi-Stage Dockerfile

The production `Dockerfile` uses a 3-stage build:

1. **deps**: Install dependencies
2. **builder**: Build Next.js application
3. **runner**: Minimal production runtime

**Features:**
- Alpine Linux base (minimal footprint)
- Non-root user execution (security)
- Layer caching optimization
- Standalone output mode
- Health check built-in

#### Build Commands

```bash
# Build production image
make docker-build

# Or manually
docker build -t hrskills:latest -f Dockerfile .

# Build with specific tag
docker build -t hrskills:v1.0.0 -f Dockerfile .
```

#### Run Production Container

```bash
# Run with environment file
docker run -d \
  --name hrskills \
  --env-file .env.production \
  -p 3000:3000 \
  hrskills:latest

# Check health
docker inspect --format='{{json .State.Health}}' hrskills

# View logs
docker logs -f hrskills
```

### Docker Compose Production

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale web=3
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Manual trigger

**Jobs:**
1. **Lint**: ESLint, TypeScript, Prettier
2. **Build**: Build Next.js app, run tests
3. **Python Validation**: Lint and type-check agents
4. **Security**: npm audit, secret scanning, dependency review
5. **Docker Build**: Test Docker image build

**All jobs must pass for PR to be mergeable**

#### 2. Deployment Pipeline (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` (auto-deploy production)
- Tagged releases (`v*.*.*`)
- Manual trigger with environment selection

**Jobs:**
1. **Build & Push**: Build Docker image, push to registry
2. **Deploy Staging**: Deploy to staging environment
3. **Deploy Production**: Deploy to production (requires staging success)
4. **Rollback**: Auto-rollback on failure
5. **Database Migrations**: Run migrations post-deployment

**Deployment Strategy:** Blue-green with automated rollback

### Required GitHub Secrets

Configure in GitHub repository settings (Settings → Secrets):

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

### Monitoring Deployments

```bash
# View GitHub Actions runs
# Go to: https://github.com/your-org/hrskills/actions

# Watch deployment logs in real-time
# Click on the deployment run → Job → Steps
```

---

## Manual Deployment

### Using Deployment Script

The `scripts/deploy.sh` script automates deployment:

#### Features

1. Pre-deployment checks (tests, linting, type checking)
2. Application build
3. Docker image creation
4. Image push to registry
5. Platform deployment
6. Health check verification
7. Post-deployment tasks
8. Notifications

#### Deploy to Staging

```bash
# Using Makefile
make deploy-staging

# Or directly
./scripts/deploy.sh staging
```

#### Deploy to Production

```bash
# Using Makefile
make deploy-production

# Or directly
./scripts/deploy.sh production

# You will be prompted for confirmation:
# "Are you sure? Type 'yes' to continue:"
```

#### Deployment Flow

```
┌─────────────────────┐
│ Pre-deployment      │
│ Checks              │
│ (tests, lint, type) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Build Application   │
│ (npm run build)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Build Docker Image  │
│ (multi-stage)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Push to Registry    │
│ (ghcr.io)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Deploy to Platform  │
│ (Cloud Run/K8s/etc) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Health Check        │
│ (10 attempts)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Post-deployment     │
│ Tasks & Notify      │
└─────────────────────┘
```

### Manual Build and Deploy

```bash
# 1. Run pre-deployment checks
cd webapp
npm test
npx tsc --noEmit
npm run lint

# 2. Build application
npm run build

# 3. Build Docker image
cd ..
docker build -t hrskills:latest -f Dockerfile .

# 4. Tag for registry
docker tag hrskills:latest ghcr.io/your-org/hrskills:latest

# 5. Push to registry
docker push ghcr.io/your-org/hrskills:latest

# 6. Deploy to platform (example commands below)
```

---

## Platform-Specific Guides

### Vercel Deployment

**Easiest option for Next.js applications**

#### Setup

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   cd webapp
   vercel
   ```

#### Environment Variables

Configure in Vercel Dashboard:
- Project Settings → Environment Variables
- Add all required variables from [Environment Configuration](#environment-configuration)

#### Production Deployment

```bash
# Deploy to production
vercel --prod

# Auto-deploy on push to main (configure in Vercel dashboard)
```

---

### Google Cloud Run

**Serverless container deployment**

#### Prerequisites

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

#### Deployment

```bash
# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hrskills

# Deploy to Cloud Run
gcloud run deploy hrskills \
  --image gcr.io/YOUR_PROJECT_ID/hrskills \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,ANTHROPIC_API_KEY=sk-ant-... \
  --max-instances 10 \
  --concurrency 80 \
  --memory 1Gi \
  --cpu 2
```

#### Using Secret Manager

```bash
# Create secrets
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-

# Deploy with secrets
gcloud run deploy hrskills \
  --image gcr.io/YOUR_PROJECT_ID/hrskills \
  --update-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

---

### AWS ECS/Fargate

**Container deployment on AWS**

#### Prerequisites

```bash
# Install AWS CLI
# https://aws.amazon.com/cli/

# Configure credentials
aws configure
```

#### ECR Setup

```bash
# Create ECR repository
aws ecr create-repository --repository-name hrskills

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker tag hrskills:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hrskills:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hrskills:latest
```

#### ECS Deployment

```bash
# Create task definition (see AWS console or IaC)
# Create ECS service
# Deploy new task definition
aws ecs update-service \
  --cluster hrskills-cluster \
  --service hrskills \
  --force-new-deployment
```

---

### Kubernetes

**Production-grade orchestration**

#### Prerequisites

```bash
# Install kubectl
# https://kubernetes.io/docs/tasks/tools/

# Configure kubeconfig
export KUBECONFIG=~/.kube/config
```

#### Deployment Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hrskills
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hrskills
  template:
    metadata:
      labels:
        app: hrskills
    spec:
      containers:
      - name: hrskills
        image: ghcr.io/your-org/hrskills:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: hrskills-secrets
              key: anthropic-api-key
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: hrskills-service
  namespace: production
spec:
  selector:
    app: hrskills
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace production

# Create secrets
kubectl create secret generic hrskills-secrets \
  --from-literal=anthropic-api-key=sk-ant-... \
  --namespace production

# Apply manifests
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods -n production
kubectl get services -n production

# View logs
kubectl logs -f deployment/hrskills -n production
```

#### Rolling Update

```bash
# Update image
kubectl set image deployment/hrskills \
  hrskills=ghcr.io/your-org/hrskills:v1.1.0 \
  -n production

# Monitor rollout
kubectl rollout status deployment/hrskills -n production
```

---

### Self-Hosted (PM2)

**Traditional server deployment**

#### Prerequisites

```bash
# Install PM2
npm install -g pm2

# Install nginx (reverse proxy)
sudo apt-get install nginx
```

#### Deployment

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/your-org/hrskills.git
cd hrskills

# Install dependencies
make install

# Build application
cd webapp && npm run build

# Start with PM2
pm2 start npm --name "hr-command-center" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/hrskills
server {
    listen 80;
    server_name hrskills.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hrskills /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild
cd webapp && npm run build

# Restart
pm2 restart hr-command-center
```

---

## Rollback Procedures

### When to Rollback

Trigger rollback if:
- Health check fails after deployment
- Error rate >5%
- Critical bugs in production
- Performance degradation >500ms average latency
- User-reported critical issues

### Automatic Rollback

GitHub Actions includes automatic rollback on deployment failure.

### Manual Rollback Script

```bash
# Rollback staging
make rollback staging

# Or directly
./scripts/rollback.sh staging

# Rollback production (requires confirmation)
./scripts/rollback.sh production
```

### Platform-Specific Rollback

#### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

#### Google Cloud Run
```bash
# List revisions
gcloud run revisions list --service=hrskills

# Rollback to previous
gcloud run services update-traffic hrskills \
  --to-revisions PREVIOUS_REVISION=100
```

#### Kubernetes
```bash
# View rollout history
kubectl rollout history deployment/hrskills -n production

# Rollback to previous
kubectl rollout undo deployment/hrskills -n production

# Rollback to specific revision
kubectl rollout undo deployment/hrskills --to-revision=3 -n production
```

#### Docker/PM2
```bash
# Checkout backup branch
git checkout backup-pre-deployment-YYYYMMDD

# Rebuild
cd webapp && npm run build

# Restart
pm2 restart hr-command-center
```

### Post-Rollback

1. Notify stakeholders
2. Document issue that caused rollback
3. Analyze logs for root cause
4. Create fix in separate branch
5. Test thoroughly before redeployment

---

## Troubleshooting

### Build Failures

#### TypeScript Errors

```bash
# Problem: Type errors during build
# Solution: Fix type errors or add type assertions

# Check types locally
npx tsc --noEmit

# Common fix patterns
const value = data?.field ?? defaultValue;
const array = data?.items || [];
```

#### Missing Environment Variables

```bash
# Problem: Build fails with "env var not found"
# Solution: Add dummy values for build-time

# In CI/CD, use dummy values
ANTHROPIC_API_KEY=sk-ant-dummy-for-build npm run build
```

### Docker Issues

#### Build Cache Issues

```bash
# Problem: Build fails with stale cache
# Solution: Clean and rebuild

docker builder prune -af
docker build --no-cache -t hrskills:latest .
```

#### Container Exits Immediately

```bash
# Check logs
docker logs <container_id>

# Common issues:
# - Missing environment variables
# - Port already in use
# - Invalid NODE_ENV value
```

### Health Check Failures

```bash
# Check endpoint manually
curl http://localhost:3000/api/health

# Check container health
docker inspect --format='{{json .State.Health}}' hrskills

# Exec into container
docker exec -it hrskills sh
curl http://localhost:3000/api/health
```

### Performance Issues

```bash
# Problem: High memory usage
# Solution: Increase Node.js memory limit

# In Dockerfile or env
NODE_OPTIONS=--max-old-space-size=4096

# Monitor memory
docker stats hrskills
```

### Deployment Verification Checklist

After deployment:

- [ ] Application starts without errors
- [ ] Health check endpoint returns 200
- [ ] Can login successfully
- [ ] Chat interface loads and works
- [ ] Employee data displays correctly
- [ ] Analytics dashboard loads
- [ ] No console errors in browser
- [ ] API endpoints respond correctly
- [ ] Environment variables loaded correctly
- [ ] Monitoring/logging working

---

## Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] TypeScript type check passing
- [ ] Linting passing
- [ ] Security audit clean (`npm audit`)
- [ ] Environment variables configured
- [ ] Health check endpoint working
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback procedure tested
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Deployment window scheduled
- [ ] Stakeholder approval obtained

---

## Resources

- [Development Setup Guide](./DEVELOPMENT_SETUP.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Operations Guide](./OPERATIONS.md)
- [DevOps Documentation](./DEVOPS_DOCUMENTATION.md)
- [API Reference](../api/API_REFERENCE.md)

---

**Last Updated:** November 6, 2025
**Next Review:** December 6, 2025
