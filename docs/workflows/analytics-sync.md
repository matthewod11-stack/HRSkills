# HR Metrics Dashboard Sync Workflow

**Status:** Planned for Phase 2.2
**Original Python Agent:** `agents/hr-metrics-dashboard/agent.py` (removed in Phase 2.1)

## Overview

Automated daily sync of HR metrics to Google Sheets dashboard with AI-generated insights posted to Slack for executive visibility.

## Workflow Steps

### 1. Metrics Collection
- **Trigger:** Daily cron job at 8:00 AM
- **Data Sources:**
  - SQLite `employees` table (headcount, demographics)
  - SQLite `employee_metrics` table (engagement, performance, flight risk)
  - SQLite `performance_reviews` table (ratings, trends)
  - External APIs (Rippling for time-off, applicant tracking)

### 2. Metrics Calculation
- **SQL-powered analytics** (using Phase 2 SQL functions):
  - **Headcount:** Total, by dept/level/location, growth rate
  - **Attrition:** Overall rate, voluntary vs involuntary, by department
  - **Diversity:** Gender, race/ethnicity breakdowns with trend analysis
  - **Performance:** Average ratings, distribution, high/low performers
  - **Engagement:** eNPS score, promoter/passive/detractor split
  - **Recruiting:** Open roles, time-to-fill, offer acceptance rate
  - **Compensation:** Pay equity analysis, comp ratio by department

### 3. AI Insight Generation
- **Provider:** Claude 3.5 Sonnet (via Phase 2 AI abstraction layer)
- **Input:** Full metrics dataset + prior month for comparison
- **Output:** Executive summary with:
  - Key trends (e.g., "Engineering attrition up 15% vs last quarter")
  - Anomalies (e.g., "3 high performers in Sales are flight risks")
  - Recommended actions (e.g., "Consider retention bonuses for Product team")
  - Forecast (e.g., "Projected to miss Q4 hiring goal by 8 roles")

### 4. Google Sheets Update
- **Sheet Structure:**
  - **Tab 1: Overview** - Key metrics cards (headcount, attrition, eNPS, diversity %)
  - **Tab 2: Headcount** - By department, level, location with sparklines
  - **Tab 3: Attrition** - Trend chart, voluntary vs involuntary, regrettable %
  - **Tab 4: Diversity** - Representation by level, pay equity, pipeline analysis
  - **Tab 5: Performance** - Distribution, calibration data, promotion readiness
  - **Tab 6: Recruiting** - Funnel metrics, time-to-hire by role, source effectiveness
  - **Tab 7: AI Insights** - Latest summary + historical insights log

- **Update Method:**
  - Clear previous day's data
  - Write new metrics via Sheets API (batch update for performance)
  - Apply conditional formatting (red/yellow/green indicators)
  - Refresh charts and pivot tables

### 5. Slack Summary Post
- **Channel:** `#exec-hr-metrics` (private channel for leadership)
- **Format:**
  ```
  📊 Daily HR Metrics Summary - [Date]

  🎯 Key Metrics:
  • Headcount: 347 (+5 vs last month)
  • Attrition: 12.3% annual (↑ from 10.8%)
  • eNPS: +42 (Promoter territory)
  • Open Roles: 23 (avg 38 days to fill)

  🚨 Alerts:
  • Engineering attrition at 18% (company avg: 12%)
  • 4 high performers flagged as flight risks
  • Diversity hiring goal tracking 15% behind target

  💡 AI Insights:
  [Claude-generated summary with actionable recommendations]

  📈 Full Dashboard: [Link to Google Sheet]
  ```

- **Threading:** Attach detailed breakdowns as thread replies
- **Mentions:** Tag @ceo, @cfo, @vp-people on critical alerts

### 6. Alerting & Notifications
- **Conditions triggering alerts:**
  - Attrition spike (>5% increase month-over-month)
  - Flight risk employee count >10 or >5% of headcount
  - eNPS drops below 0 (into Detractor territory)
  - Diversity representation decreases
  - Open roles >90 days unfilled

- **Notification channels:**
  - Slack DM to VP of People
  - Email digest to HR team
  - Entry in `insight_events` table for dashboard visibility

## Technical Implementation (Phase 2.2)

### Cron Endpoint
```typescript
// app/api/cron/metrics-sync/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Enqueue job for worker
  await metricsQueue.add('sync-dashboard', {
    date: new Date().toISOString().split('T')[0],
    includeAIInsights: true,
  });

  return Response.json({ status: 'queued' });
}
```

### Worker Implementation
```typescript
import { Worker } from 'bullmq';
import { aiProvider } from '@/lib/ai/router';
import { calculateHeadcount, calculateAttrition } from '@/lib/analytics/headcount-sql';

const worker = new Worker('metrics', async (job) => {
  const { date } = job.data;

  // Step 1: Calculate all metrics using SQL
  const [headcount, attrition, engagement, performance] = await Promise.all([
    calculateHeadcount(),
    calculateAttrition(),
    calculateEngagement(),
    calculatePerformance(),
  ]);

  // Step 2: Generate AI insights
  const insights = await aiProvider.analyze(
    JSON.stringify({ headcount, attrition, engagement, performance }),
    'executive_hr_summary'
  );

  // Step 3: Update Google Sheet
  await updateGoogleSheet({
    sheetId: process.env.HR_DASHBOARD_SHEET_ID!,
    tabs: {
      overview: buildOverviewData(headcount, attrition, engagement),
      headcount: buildHeadcountData(headcount),
      attrition: buildAttritionData(attrition),
      insights: [{ date, summary: insights.summary }],
    },
  });

  // Step 4: Post to Slack
  await postToSlack({
    channel: process.env.SLACK_HR_METRICS_CHANNEL!,
    message: formatSlackMessage(headcount, attrition, engagement, insights),
  });

  // Step 5: Check for alerts
  const alerts = detectAlerts({ attrition, engagement, performance });
  if (alerts.length > 0) {
    await sendAlerts(alerts);
    await logInsightEvents(alerts);
  }

  // Log successful completion
  await db.insert(actions).values({
    id: randomUUID(),
    actionType: 'metrics_sync_completed',
    status: 'completed',
    payloadJson: JSON.stringify({ date, alertCount: alerts.length }),
    createdAt: new Date().toISOString(),
  });
});
```

### Required Integrations
- **Google Sheets API** (dashboard updates)
- **Slack Web API** (channel posts, DMs)
- **Anthropic API** (AI insights via Phase 2 provider abstraction)
- **Rippling API** (optional: supplemental data like time-off balances)

### Configuration
```bash
# .env
HR_DASHBOARD_SHEET_ID=1abc...xyz
SLACK_HR_METRICS_CHANNEL=C01234ABCDE
SLACK_BOT_TOKEN=xoxb-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
CRON_SECRET=random_secret
REDIS_URL=redis://localhost:6379
```

### Deployment
- **Cron Schedule:** Daily at 8:00 AM UTC (Vercel Cron)
- **Worker:** Background service with retry logic and DLQ
- **Monitoring:** Track sync latency, API errors, insight quality
- **Cost:** ~$0.50/day for Claude API calls

## Success Metrics
- **Dashboard freshness:** % of days with successful sync by 9:00 AM
- **Insight quality:** Exec team satisfaction score (weekly survey)
- **Action taken:** % of AI recommendations acted upon within 7 days
- **Alert accuracy:** % of alerts leading to meaningful action (avoid noise)

## Future Enhancements
- **Predictive forecasting:** ML models for attrition, hiring needs
- **Benchmarking:** Compare metrics to industry standards
- **Custom metrics:** User-defined KPIs and thresholds
- **Multi-tenant:** Separate dashboards per department/region
- **Interactive chat:** Ask questions about metrics via Slack bot
