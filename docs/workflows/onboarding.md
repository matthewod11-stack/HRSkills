# New Hire Onboarding Workflow

**Status:** Planned for Phase 2.2
**Original Python Agent:** `agents/new-hire-onboarding/agent.py` (removed in Phase 2.1)

## Overview

Automated onboarding workflow that triggers when a candidate is marked as "Hired" in the ATS, streamlining the first-week experience for new employees.

## Workflow Steps

### 1. Candidate Detection
- **Trigger:** Daily cron job at 6:00 AM
- **Action:** Query Rippling ATS for candidates with status = "Hired" in last 24 hours
- **Output:** List of new hires with start dates

### 2. Employee Record Creation
- **Action:** Create employee record in HRIS system
- **Data Points:**
  - Full name, email, job title, department
  - Manager assignment
  - Start date
  - Compensation details
- **Storage:** SQLite `employees` table

### 3. Notion Onboarding Checklist
- **Action:** Create personalized checklist in Notion workspace
- **Template Sections:**
  - Pre-Day 1: IT setup, paperwork, welcome email
  - Day 1: Orientation, badge pickup, system access
  - Week 1: Team introductions, training schedule, 1:1 with manager
  - 30/60/90 day milestones
- **Assignees:** HR, IT, Manager, Facilities

### 4. Google Workspace Account Provisioning
- **Action:** Create G Suite account via Admin SDK
- **Provisions:**
  - @company.com email address
  - Drive storage
  - Calendar access
  - Group memberships (department, office location)
- **Note:** Requires service account with domain-wide delegation

### 5. Day 1 Meeting Scheduling
- **Action:** Auto-schedule via Google Calendar API
- **Meetings:**
  - 9:00 AM: HR Orientation (30 min)
  - 10:00 AM: IT Setup Session (45 min)
  - 11:00 AM: Team Introduction (30 min)
  - 2:00 PM: 1:1 with Manager (60 min)
- **Invites:** Include Zoom links, agenda notes

### 6. Welcome Email
- **Trigger:** 3 days before start date
- **Content:**
  - Personal welcome from CEO
  - First day logistics (time, location, dress code)
  - What to bring (ID for I-9, bank info for direct deposit)
  - Link to onboarding portal
  - IT contact for pre-start questions
- **Template:** Stored in `documents` table

### 7. Slack Welcome
- **Action:** Post to #new-hires channel on Day 1 at 9:00 AM
- **Content:**
  - Introduction with photo, role, department, fun fact
  - Tag manager and team members
  - Encourage team to welcome and offer help

### 8. Stakeholder Notifications
- **Recipients:**
  - **IT:** Provision laptop, software licenses, access badges
  - **Manager:** Onboarding checklist, first week schedule
  - **Facilities:** Desk assignment, parking pass, security badge
- **Method:** Email + Slack DM
- **Timing:** 5 business days before start date

## Technical Implementation (Phase 2.2)

### Architecture
```typescript
// Durable worker using BullMQ
import { Queue, Worker } from 'bullmq';

const onboardingQueue = new Queue('onboarding', {
  connection: { host: 'redis', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

// Cron endpoint (enqueues jobs, doesn't run work)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const newHires = await getNewHiresStartingThisWeek();

  for (const hire of newHires) {
    await onboardingQueue.add('onboard-new-hire', {
      employeeId: hire.id,
      startDate: hire.start_date,
      name: hire.full_name,
    });
  }

  return Response.json({ queued: newHires.length });
}

// Worker (processes jobs with retries)
const worker = new Worker(
  'onboarding',
  async (job) => {
    const { employeeId, name } = job.data;

    await Promise.allSettled([
      createEmployeeRecord(employeeId),
      createNotionChecklist(employeeId),
      provisionGoogleAccount(employeeId),
      scheduleDay1Meetings(employeeId),
      sendWelcomeEmail(employeeId),
      notifyStakeholders(employeeId),
    ]);

    // Log action to database
    await db.insert(actions).values({
      id: randomUUID(),
      actionType: 'onboarding_completed',
      status: 'completed',
      payloadJson: JSON.stringify({ employeeId, name }),
      createdAt: new Date().toISOString(),
    });
  },
  { connection: { host: 'redis', port: 6379 } }
);

worker.on('failed', async (job, err) => {
  // Dead letter queue for manual review
  await db.insert(actions).values({
    id: randomUUID(),
    actionType: 'onboarding_failed',
    status: 'failed',
    payloadJson: JSON.stringify(job?.data),
    errorMessage: err.message,
    createdAt: new Date().toISOString(),
  });
});
```

### Required Integrations
- **Rippling ATS API** (candidate data)
- **Google Workspace Admin SDK** (email provisioning)
- **Google Calendar API** (meeting scheduling)
- **Notion API** (checklist creation)
- **Slack API** (channel posts, DMs)
- **Resend/SendGrid** (email delivery)

### Configuration
```bash
# .env
RIPPLING_API_KEY=xxx
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/key.json
NOTION_API_KEY=xxx
SLACK_BOT_TOKEN=xoxb-xxx
RESEND_API_KEY=re_xxx
CRON_SECRET=random_secret_for_vercel_cron
REDIS_URL=redis://localhost:6379
```

### Deployment
- **Cron Schedule:** Daily at 6:00 AM UTC (Vercel Cron or GitHub Actions)
- **Worker:** Separate container/service (Railway, Render, or Vercel background functions)
- **Monitoring:** Structured logging to Datadog/Sentry
- **Alerts:** Slack notification on job failure

## Success Metrics
- **Onboarding completion rate:** % of new hires with all steps completed by Day 1
- **IT readiness:** % with laptop, email, and system access on Day 1
- **Time to productivity:** Days until first meaningful contribution
- **New hire satisfaction:** Survey score after first 30 days

## Future Enhancements
- Equipment ordering (laptop, monitor, peripherals)
- Learning management system (LMS) course enrollment
- Benefits enrollment reminders
- Buddy/mentor matching
- Background check status tracking
