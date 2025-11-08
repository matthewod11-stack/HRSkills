# Operations Guide

Comprehensive guide for monitoring, maintaining, and operating HR Command Center in production.

**Last Updated:** November 6, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Health Monitoring](#health-monitoring)
3. [Performance Monitoring](#performance-monitoring)
4. [AI Cost Monitoring](#ai-cost-monitoring)
5. [Log Management](#log-management)
6. [Alerting & Notifications](#alerting--notifications)
7. [Maintenance Tasks](#maintenance-tasks)
8. [Incident Response](#incident-response)
9. [Backup & Recovery](#backup--recovery)
10. [Security Operations](#security-operations)

---

## Overview

### Operational Goals

1. **Availability**: 99.9% uptime target
2. **Performance**: <2s API response time (P95)
3. **Cost Efficiency**: <$150/month AI costs
4. **Security**: Zero security incidents
5. **User Satisfaction**: <1% error rate

### Monitoring Stack

```
┌─────────────────────────────────────────┐
│          Application Metrics            │
│  (Health, Performance, AI Costs)        │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼────┐
   │  Logs    │        │  Alerts  │
   │ (stdout) │        │  (Slack) │
   └──────────┘        └──────────┘
```

---

## Health Monitoring

### Health Check Endpoint

**Endpoint:** `GET /api/health`

#### Response Structure

**Healthy (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T12:00:00.000Z",
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

**Unhealthy (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-06T12:00:00.000Z",
  "error": "Database connection failed",
  "checks": {
    "server": true,
    "database": false,
    "memory": true
  }
}
```

### Manual Health Checks

```bash
# Local environment
make health
curl http://localhost:3000/api/health

# Production
make health-prod
curl https://hrskills.yourcompany.com/api/health

# Health check with details
curl -s http://localhost:3000/api/health | jq
```

### Docker Health Check

Built into `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

**Check container health:**
```bash
# View health status
docker inspect --format='{{json .State.Health}}' hrskills | jq

# Watch health status
watch -n 5 'docker inspect --format="{{.State.Health.Status}}" hrskills'
```

### Kubernetes Health Probes

**Liveness Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

**Readiness Probe:**
```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 2
```

### Uptime Monitoring

**Recommended Tools:**

1. **UptimeRobot** (Free tier available)
   - Monitor health endpoint every 5 minutes
   - Alert via email/Slack on downtime

2. **Pingdom**
   - HTTP(S) monitoring
   - Real user monitoring

3. **StatusCake**
   - Uptime monitoring
   - Page speed monitoring

**Configuration:**
- URL: `https://hrskills.yourcompany.com/api/health`
- Interval: 5 minutes
- Expected status: 200
- Expected response: `"status":"healthy"`

---

## Performance Monitoring

### Key Metrics

| Metric | Target | Acceptable | Alert Threshold |
|--------|--------|------------|-----------------|
| API Latency (P95) | <2s | <3s | >5s |
| API Latency (P99) | <3s | <5s | >8s |
| Error Rate | <0.1% | <0.5% | >1% |
| Memory Usage | <512MB | <768MB | >900MB |
| CPU Usage | <40% | <60% | >80% |

### API Performance Monitoring

**Built-in Performance API:**

```bash
# Get performance metrics
curl https://hrskills.yourcompany.com/api/performance

# Response:
{
  "metrics": {
    "p50": 850,
    "p95": 1800,
    "p99": 2900,
    "errorRate": 0.002
  },
  "period": "last_hour"
}
```

### Application Performance Monitoring (APM)

#### Recommended APM Tools

**1. Datadog** (Recommended for production)

```javascript
// webapp/lib/monitoring/datadog.ts
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID!,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
  site: 'datadoghq.com',
  service: 'hr-command-center',
  env: process.env.NODE_ENV,
  version: '0.1.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input'
});
```

**2. New Relic**

```javascript
// Install: npm install newrelic
// newrelic.js in project root
exports.config = {
  app_name: ['HR Command Center'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: { level: 'info' }
};
```

**3. Sentry** (Error tracking + Performance)

```javascript
// Already configured in webapp
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});
```

### Resource Monitoring

**Docker Stats:**
```bash
# Real-time stats
docker stats hrskills

# Output:
# CONTAINER  CPU %  MEM USAGE / LIMIT   MEM %  NET I/O      BLOCK I/O
# hrskills   5.2%   512MiB / 1GiB       50%    1.2MB/980kB  0B/0B
```

**PM2 Monitoring:**
```bash
# Monitor processes
pm2 monit

# Memory/CPU usage
pm2 list
```

**Kubernetes Resource Monitoring:**
```bash
# Pod resource usage
kubectl top pods -n production

# Node resource usage
kubectl top nodes

# Detailed metrics
kubectl describe pod hrskills-xxx -n production
```

---

## AI Cost Monitoring

### Real-Time Cost Dashboard

**Access:** Settings → AI Cost Monitoring

**Metrics Displayed:**
- Total requests today
- Cache hit rate (target: >85%)
- Cost per request (target: <$0.025)
- Monthly cost projection (target: <$150)
- Estimated monthly savings

### API Endpoint

```bash
# Get AI cost metrics
curl -H "Authorization: Bearer $TOKEN" \
  https://hrskills.yourcompany.com/api/metrics/ai-costs

# Response:
{
  "success": true,
  "data": {
    "totalRequests": 450,
    "cacheHitRate": 87.3,
    "avgCostPerRequest": 0.0189,
    "projectedMonthlyCost": 118.50,
    "estimatedSavings": 826.50,
    "period": "last_24_hours"
  }
}
```

### Daily Monitoring (First Week)

**Metrics to Check:**
- Cache hit rate
- Cost per request
- Monthly cost projection
- Error rate
- User feedback

**Alert Thresholds:**
- Cache hit rate <60%
- Daily cost >$5
- Error rate >1%
- User complaints about response quality

### Weekly Monitoring (First Month)

**Metrics to Review:**
- Average cache hit rate
- Total monthly cost vs projection
- Cost savings vs baseline
- Query patterns
- Top 10 most expensive queries

**Actions:**
- Generate savings report
- Update stakeholders
- Identify optimization opportunities
- Document lessons learned

### Monthly Monitoring (Ongoing)

**Metrics to Track:**
- Month-over-month cost comparison
- Cumulative savings
- ROI progress
- Feature usage trends
- User satisfaction scores

**Actions:**
- Financial report to leadership
- Optimize based on patterns
- Plan future enhancements
- Update documentation

### Cost Calculation

```bash
# Run cost validation script
npm exec tsx scripts/validate-optimizations.ts

# Output:
# ✓ Cache Hit Rate: 87.2%
# ✓ Cost per Request: $0.0189
# ✓ Monthly Projection: $118.50
# ✓ Monthly Savings: $826.50 (87.5%)
```

---

## Log Management

### Application Logs

#### Log Levels

- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Warning conditions that might need attention
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information (development only)

#### Production Logging

**Environment Variable:**
```bash
LOG_LEVEL=info  # production
LOG_LEVEL=debug # development
```

#### Log Structure

```json
{
  "timestamp": "2025-11-06T12:00:00.000Z",
  "level": "info",
  "message": "API request completed",
  "context": {
    "method": "POST",
    "path": "/api/chat",
    "statusCode": 200,
    "duration": 1850,
    "userId": "user_123"
  }
}
```

### Viewing Logs

**Docker:**
```bash
# Follow logs
docker logs -f hrskills

# Last 100 lines
docker logs --tail 100 hrskills

# Since timestamp
docker logs --since 2025-11-06T12:00:00 hrskills
```

**PM2:**
```bash
# Follow logs
pm2 logs hr-command-center

# Error logs only
pm2 logs hr-command-center --err

# Clear logs
pm2 flush
```

**Kubernetes:**
```bash
# Follow logs
kubectl logs -f deployment/hrskills -n production

# Logs from specific pod
kubectl logs hrskills-xyz-123 -n production

# Previous container logs (after crash)
kubectl logs hrskills-xyz-123 -n production --previous
```

### Log Aggregation

#### Recommended Tools

**1. CloudWatch (AWS)**
```bash
# Install CloudWatch agent
# Configure log groups
# Stream logs automatically
```

**2. Loggly**
```javascript
// Install: npm install winston-loggly-bulk
import { LogglyTransport } from 'winston-loggly-bulk';

logger.add(new LogglyTransport({
  token: process.env.LOGGLY_TOKEN,
  subdomain: 'yourcompany',
  tags: ['hr-command-center', 'production'],
  json: true
}));
```

**3. Papertrail**
```bash
# Configure syslog endpoint
# Stream logs via rsyslog
```

### Log Retention

**Recommended Retention:**
- **Error logs**: 90 days
- **Info logs**: 30 days
- **Debug logs**: 7 days (development only)

**Rotation Configuration:**
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Alerting & Notifications

### Alert Channels

1. **Slack** (primary)
2. **Email** (secondary)
3. **PagerDuty** (critical, 24/7)

### Alert Rules

#### Critical Alerts (Immediate Response)

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Application Down | Health check fails 3x | Page on-call engineer |
| Error Rate Spike | >5% for 5 minutes | Slack + Page |
| API Latency High | P95 >10s for 5 minutes | Slack + Page |
| Memory Leak | Memory >900MB | Restart + Investigate |

#### Warning Alerts (Review Required)

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Error Rate Elevated | >1% for 15 minutes | Slack notification |
| API Latency Degraded | P95 >5s for 15 minutes | Slack notification |
| Cache Hit Rate Low | <60% for 1 hour | Slack notification |
| Daily Cost High | >$5 in 24 hours | Email notification |

#### Info Alerts (FYI)

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Deployment Success | After each deploy | Slack message |
| Daily Cost Report | Every morning at 9am | Email report |
| Weekly Usage Report | Every Monday | Email stakeholders |

### Slack Notifications

**Setup:**
```bash
# Create Slack webhook
# Settings → Incoming Webhooks → Add New Webhook

# Set environment variable
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

**Send notification:**
```javascript
// lib/notifications/slack.ts
export async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'critical') {
  const colors = {
    info: '#36a64f',
    warning: '#ff9900',
    critical: '#ff0000'
  };

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color: colors[severity],
        title: `HR Command Center ${severity.toUpperCase()}`,
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    })
  });
}
```

### Email Notifications

**Using SendGrid:**
```javascript
// lib/notifications/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmailAlert(subject: string, body: string) {
  await sgMail.send({
    to: 'ops-team@yourcompany.com',
    from: 'alerts@yourcompany.com',
    subject: `[HR Command Center] ${subject}`,
    text: body,
    html: `<pre>${body}</pre>`
  });
}
```

---

## Maintenance Tasks

### Daily Tasks

**Automated:**
- Health check monitoring (every 5 minutes)
- Log rotation
- Metrics collection
- Cost tracking

**Manual (First Week):**
- [ ] Review AI cost metrics
- [ ] Check error logs
- [ ] Verify cache hit rate
- [ ] Monitor user feedback

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Analyze slow queries
- [ ] Check disk usage
- [ ] Review security audit logs
- [ ] Update dependencies (patch versions)
- [ ] Team sync on any issues

### Monthly Tasks

- [ ] Full security audit (`npm audit`)
- [ ] Dependency updates (minor versions)
- [ ] Performance optimization review
- [ ] Cost analysis and reporting
- [ ] Backup verification
- [ ] Documentation updates
- [ ] Stakeholder report

### Quarterly Tasks

- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Disaster recovery drill
- [ ] Security penetration testing
- [ ] Performance benchmarking
- [ ] Capacity planning

### Dependency Updates

```bash
# Check for updates
cd webapp
npm outdated

# Update patch versions (safe)
npm update

# Update minor versions (review changes)
npm install package@^1.2.0

# Update major versions (test thoroughly)
npm install package@^2.0.0

# Run tests after updates
npm test
npm run build
```

### Security Updates

```bash
# Run security audit
make audit

# Fix vulnerabilities automatically
make audit-fix

# Manual fixes for breaking changes
npm audit
npm audit fix --force  # Use cautiously
```

---

## Incident Response

### Incident Severity Levels

**SEV-1 (Critical)**
- Application completely down
- Data breach or security incident
- **Response Time:** Immediate
- **Escalation:** Page on-call engineer

**SEV-2 (High)**
- Partial outage affecting >50% of users
- Major feature broken
- **Response Time:** 15 minutes
- **Escalation:** Slack notification, team assembles

**SEV-3 (Medium)**
- Minor feature degraded
- Performance issues
- **Response Time:** 1 hour
- **Escalation:** Slack notification

**SEV-4 (Low)**
- Cosmetic issues
- Non-critical bugs
- **Response Time:** Next business day
- **Escalation:** Create ticket

### Incident Response Process

1. **Detection & Alert**
   - Automated monitoring detects issue
   - Alert sent via Slack/PagerDuty

2. **Acknowledge**
   - On-call engineer acknowledges alert
   - Creates incident channel in Slack

3. **Assess**
   - Determine severity level
   - Identify affected systems/users
   - Estimate impact

4. **Communicate**
   - Notify stakeholders
   - Update status page
   - Regular updates every 30 minutes

5. **Mitigate**
   - Implement immediate fix or workaround
   - Consider rollback if needed

6. **Resolve**
   - Verify fix in production
   - Monitor for regression
   - Close incident

7. **Post-Mortem**
   - Document incident timeline
   - Root cause analysis
   - Action items to prevent recurrence

### Incident Communication Template

```markdown
# Incident Report: [YYYY-MM-DD] [Brief Description]

## Summary
Brief description of the incident

## Timeline
- **12:00 UTC** - Incident detected
- **12:05 UTC** - Team notified
- **12:15 UTC** - Root cause identified
- **12:30 UTC** - Fix deployed
- **12:45 UTC** - Incident resolved

## Impact
- **Affected Users:** X users (Y% of total)
- **Duration:** 45 minutes
- **Services Affected:** Chat API

## Root Cause
Detailed explanation of what caused the incident

## Resolution
How the incident was resolved

## Prevention
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3

## Lessons Learned
What we learned and how we'll improve
```

### Common Incidents & Solutions

#### Application Not Responding

**Symptoms:**
- Health check returns 503
- Users see "Service Unavailable"

**Diagnosis:**
```bash
# Check if container is running
docker ps | grep hrskills

# Check logs
docker logs --tail 100 hrskills

# Check resource usage
docker stats hrskills
```

**Solution:**
```bash
# Restart container
docker restart hrskills

# Or redeploy
./scripts/deploy.sh production
```

#### High Error Rate

**Symptoms:**
- Error rate >5%
- Multiple API failures

**Diagnosis:**
```bash
# Check error logs
docker logs hrskills | grep ERROR

# Check specific endpoint
curl -v https://hrskills.yourcompany.com/api/chat
```

**Solution:**
- Identify failing endpoint
- Check recent code changes
- Rollback if needed
- Fix and redeploy

#### Memory Leak

**Symptoms:**
- Memory usage continuously increasing
- Container OOM (Out of Memory)

**Diagnosis:**
```bash
# Monitor memory over time
watch -n 5 'docker stats hrskills --no-stream'

# Generate heap dump (if needed)
docker exec hrskills node --expose-gc --inspect=0.0.0.0:9229
```

**Solution:**
```bash
# Immediate: Restart container
docker restart hrskills

# Long-term: Investigate and fix memory leak
# Increase memory limit if needed
```

---

## Backup & Recovery

### What to Backup

1. **Application Code**: Git repository (already backed up)
2. **Environment Variables**: Secure secrets manager
3. **Employee Data**: `/data/master-employees.json`
4. **User Data**: Future database backups
5. **Configuration**: Docker configs, K8s manifests

### Backup Strategy

**Employee Data:**
```bash
# Automated daily backup
0 2 * * * /path/to/backup-script.sh

# backup-script.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
cp /path/to/data/master-employees.json \
   /backups/master-employees-$DATE.json
find /backups -name "master-employees-*.json" -mtime +30 -delete
```

**Configuration Backup:**
```bash
# Backup environment files (encrypted)
tar -czf config-backup.tar.gz .env.production
gpg --encrypt --recipient ops@yourcompany.com config-backup.tar.gz

# Upload to S3 or similar
aws s3 cp config-backup.tar.gz.gpg s3://backups/hrskills/
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**

1. **Deploy fresh instance**
   ```bash
   ./scripts/deploy.sh production
   ```

2. **Restore environment variables**
   - From secrets manager or encrypted backup

3. **Restore data**
   ```bash
   aws s3 cp s3://backups/hrskills/master-employees-latest.json \
     /path/to/data/master-employees.json
   ```

4. **Verify functionality**
   - Health check passes
   - Can login
   - Chat works
   - Data loads correctly

5. **Resume normal operations**

---

## Security Operations

### Security Monitoring

**What to Monitor:**
- Failed login attempts
- Unusual API access patterns
- Elevated privilege usage
- Security audit failures
- SSL certificate expiration

### Security Audit

```bash
# Run security audit
make audit

# Output:
# found 0 vulnerabilities in X packages
```

### Access Reviews

**Monthly:**
- [ ] Review user accounts
- [ ] Remove inactive users
- [ ] Verify role assignments
- [ ] Check API key usage

**Quarterly:**
- [ ] Full access audit
- [ ] Review system permissions
- [ ] Rotate secrets/keys
- [ ] Update security documentation

### SSL Certificate Management

**Check certificate expiration:**
```bash
# Check SSL certificate
echo | openssl s_client -connect hrskills.yourcompany.com:443 2>/dev/null \
  | openssl x509 -noout -dates

# Set up renewal alerts (30 days before expiry)
```

**Auto-renewal with Let's Encrypt:**
```bash
# Install certbot
sudo apt-get install certbot

# Setup auto-renewal
sudo certbot renew --dry-run
```

---

## Resources

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Development Setup](./DEVELOPMENT_SETUP.md)
- [API Reference](../api/API_REFERENCE.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** November 6, 2025
**Next Review:** December 6, 2025
