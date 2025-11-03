# New Hire Onboarding Agent

Automatically provisions new hires across all company systems.

## What It Does

When a candidate is marked "Hired" in Rippling, this agent:

1. ✅ Creates employee record in Rippling HRIS
2. ✅ Generates personalized Notion onboarding checklist
3. ✅ Provisions Google Workspace account (email, calendar, drive)
4. ✅ Schedules Day 1 meetings with manager and team
5. ✅ Sends welcome email with credentials and resources
6. ✅ Sends Slack welcome message with onboarding info
7. ✅ Notifies IT, facilities, and manager

## Setup

### Prerequisites

- Python 3.10+
- API access configured in `.env.local`
- Integrations layer installed

### Installation

```bash
# Install Python dependencies
pip3 install anthropic python-dotenv

# Install integration dependencies
cd ../../integrations
npm install
```

### Configuration

Set these environment variables in `.env.local`:

```bash
RIPPLING_API_KEY=...
NOTION_TOKEN=...
NOTION_ONBOARDING_DB=...
GOOGLE_CREDENTIALS_PATH=...
GOOGLE_ADMIN_EMAIL=...
SLACK_BOT_TOKEN=...
ANTHROPIC_API_KEY=...
```

## Usage

### Run Once

Check for new hires and process them:

```bash
python3 agent.py
```

### Dry Run (Test Mode)

See what would happen without making changes:

```bash
python3 agent.py --dry-run
```

### Continuous Monitoring

Run continuously, checking every hour:

```bash
python3 agent.py --watch
```

### Schedule with Cron

Run automatically every day at 9 AM:

```bash
# Edit crontab
crontab -e

# Add this line:
0 9 * * * cd /path/to/hrskills/agents/new-hire-onboarding && python3 agent.py
```

## Workflow Details

### 1. Detect New Hires

Queries Rippling ATS API for candidates with:
- Status: "hired"
- Updated in last 24 hours

### 2. Create Employee Record

If not auto-created, creates HRIS record with:
- Personal information
- Department and manager
- Start date
- Employment type

### 3. Notion Onboarding Page

Creates structured checklist with:
- Pre-boarding tasks (before day 1)
- Day 1 schedule
- Week 1 checklist
- 30/60/90 day milestones

### 4. Google Workspace

Creates account with:
- Email: firstname.lastname@company.com
- Adds to appropriate org units
- Sets temporary password
- Grants necessary access

### 5. Calendar Events

Schedules:
- 9 AM: Welcome meeting with manager
- 10 AM: IT setup session
- 11 AM: Benefits overview
- 2 PM: Team introductions

### 6. Welcome Email

Sends email with:
- Login credentials
- First day schedule
- Required documents
- Links to handbook and resources

### 7. Slack Welcome

Sends DM with:
- Welcome message
- Onboarding checklist link
- Channel recommendations
- Point of contact

## Error Handling

The agent handles failures gracefully:

- **API errors**: Logs and retries with exponential backoff
- **Partial failures**: Completes successful steps, reports failures
- **Duplicate detection**: Skips if employee already onboarded

## Monitoring

Check logs at: `logs/onboarding-agent.log`

Slack notifications sent to: `#hr-automation`

## Customization

Edit `agent.py` to customize:

- Which systems to provision
- Onboarding checklist items
- Email templates
- Meeting schedules

## Troubleshooting

**Agent not finding new hires**
- Check Rippling API key permissions
- Verify candidate status is exactly "hired"

**Google account creation failing**
- Verify service account has Admin SDK access
- Check domain-wide delegation is configured

**Notion pages not creating**
- Confirm database ID is correct
- Verify integration has access to database

## Support

For issues, contact: devops@yourcompany.com
