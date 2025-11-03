# Claude for People & Talent: Master Capabilities Document

**Organization:** Head of People & Talent  
**Tech Stack:** Rippling (HR/ATS/Performance), Notion (Project Management), Google Workspace, Slack (Team Communication)  
**Status:** Building from scratch  
**Last Updated:** November 2, 2025

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Core Capabilities Matrix](#core-capabilities-matrix)
3. [Custom Skills Library](#custom-skills-library)
4. [Claude Code Agents](#claude-code-agents)
5. [Prompt Templates](#prompt-templates)
6. [Integration Architecture](#integration-architecture)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Overview

### What This Document Provides

This is your comprehensive guide to leveraging Claude across three deployment modes:

- **Claude.ai Skills** - Custom capabilities that extend Claude's functionality for HR-specific workflows
- **Claude Code Agents** - Automated scripts that connect Claude to your tech stack (Rippling, Notion, Google, Slack)
- **Prompt Templates** - Battle-tested prompts for everyday HR tasks

### Quick Reference: When to Use What

| Need | Solution Type | Example |
|------|---------------|---------|
| Generate standardized documents | Custom Skill | Offer letters, performance review templates |
| Automate data flow between systems | Claude Code Agent | Sync new hire data from Rippling → Notion → Google |
| One-off analysis or drafting | Prompt Template | Analyze engagement survey, draft job description |
| Complex multi-step workflow | Custom Skill + Agent | Onboarding orchestration across all systems |

---

## Core Capabilities Matrix

### 📋 Talent Acquisition

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **JD Generator** | Skill | Create role-specific job descriptions using company voice, compliance requirements, DEI language | HIGH |
| **Candidate Scorecard** | Skill | Structured interview evaluation forms with competency frameworks | HIGH |
| **Interview Guide Builder** | Skill | Generate role-specific interview questions with evaluation rubrics | HIGH |
| **Offer Letter Automation** | Skill + Agent | Pull approved comp from Rippling, generate compliant offer letters | MEDIUM |
| **Candidate Communication** | Prompt Template | Rejection emails, scheduling, follow-ups with appropriate tone | HIGH |
| **Sourcing Message Generator** | Prompt Template | Personalized outreach for passive candidates | MEDIUM |
| **ATS Data Analysis** | Agent | Pull Rippling ATS metrics, analyze pipeline health, flag bottlenecks | MEDIUM |
| **Job Posting Multi-Channel** | Skill | Format JDs for LinkedIn, Indeed, company site from single source | LOW |

### 👥 Onboarding & Offboarding

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **Onboarding Orchestrator** | Agent | Create new hire in all systems, generate checklists, schedule kickoffs | HIGH |
| **Welcome Packet Generator** | Skill | Personalized welcome docs with role-specific info | MEDIUM |
| **Onboarding Checklist Builder** | Skill | Role and department-specific task lists in Notion | HIGH |
| **Equipment Request Automation** | Agent | Generate IT tickets from new hire data | LOW |
| **Offboarding Workflow** | Agent | Trigger system access removal, exit interview scheduling, knowledge transfer | MEDIUM |
| **Exit Interview Analysis** | Skill | Aggregate and analyze exit interview themes, flag patterns | MEDIUM |

### 📊 Performance Management

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **Review Cycle Launcher** | Agent | Create review forms in Rippling, notify managers, track completion | HIGH |
| **Review Synthesis** | Skill | Aggregate 360 feedback into coherent narrative summaries | HIGH |
| **Goal Setting Templates** | Skill | Generate SMART goals by role/level with company OKR alignment | MEDIUM |
| **Development Plan Generator** | Skill | Create personalized growth plans based on review feedback | MEDIUM |
| **Calibration Session Prep** | Skill | Analyze rating distributions, flag outliers, prepare discussion materials | HIGH |
| **Performance Improvement Plan** | Skill | Generate legally compliant PIPs with clear metrics and timelines | HIGH |
| **Manager 1:1 Templates** | Prompt Template | Structured agenda formats for different scenarios | LOW |

### 📈 Analytics & Reporting

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **HR Metrics Dashboard** | Agent | Pull data from Rippling, create Google Sheets dashboards with visualizations | HIGH |
| **Headcount Planning Models** | Skill | Build scenario models in Sheets with formulas for budget impact | MEDIUM |
| **Turnover Analysis** | Agent + Skill | Analyze attrition patterns, cohort analysis, predictive indicators | HIGH |
| **Diversity Metrics** | Agent | Track and report DEI metrics with privacy-preserving aggregation | HIGH |
| **Compensation Benchmarking** | Skill | Analyze internal pay equity, compare to market data | MEDIUM |
| **Survey Analysis** | Skill | Aggregate engagement/pulse surveys, extract themes, recommend actions | HIGH |
| **Time-to-Fill Reporting** | Agent | Track recruiting funnel metrics, calculate key performance indicators | MEDIUM |

### 📝 Compliance & Documentation

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **Policy Document Generator** | Skill | Create employee handbook sections with legal compliance by jurisdiction | HIGH |
| **Compliance Checklist** | Skill | Jurisdiction-specific requirements for employment law | HIGH |
| **I-9 Verification Tracker** | Agent | Monitor I-9 expiration dates, generate renewal reminders | MEDIUM |
| **Audit Trail Documentation** | Agent | Generate compliance reports for review cycles, policy acknowledgments | MEDIUM |
| **Employee Acknowledgment Forms** | Skill | Create policy acknowledgment documents with tracking | LOW |

### 💬 Employee Relations

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **Investigation Documentation** | Skill | Structured templates for HR investigations with chain of custody | HIGH |
| **Employee Communication Templates** | Skill | Company announcements, policy changes, benefit communications | MEDIUM |
| **Accommodation Request Handler** | Skill | Generate accommodation letters, interactive process documentation | HIGH |
| **Conflict Resolution Scripts** | Prompt Template | Facilitation guides for manager-employee conflicts | MEDIUM |
| **Recognition Program Content** | Prompt Template | Peer recognition messages, award nominations, celebration announcements | LOW |

### 🎓 Learning & Development

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **Training Curriculum Designer** | Skill | Build role-based learning paths with milestones | MEDIUM |
| **Manager Training Content** | Skill | Create workshops on feedback, delegation, difficult conversations | MEDIUM |
| **Skills Gap Analysis** | Agent | Compare employee skills (from Rippling) vs role requirements | LOW |
| **Learning Resource Curator** | Prompt Template | Recommend courses, articles, resources based on development needs | LOW |

### 🔄 Operations & Admin

| Capability | Type | Description | Priority |
|------------|------|-------------|----------|
| **Meeting Note Templates** | Skill | Structured formats for leadership meetings, skip-levels, all-hands Q&A | MEDIUM |
| **Project Tracker Generator** | Agent | Create Notion databases for HR initiatives with proper schema | HIGH |
| **Email Triage Assistant** | Prompt Template | Draft responses to common employee questions | MEDIUM |
| **Budget Tracker** | Skill | Create Google Sheets budget models for HR spend tracking | MEDIUM |
| **Org Chart Generator** | Agent | Pull Rippling org data, create visual org charts, export to slides | LOW |

---

## Custom Skills Library

### High-Priority Skills to Build First

#### 1. HR Document Generator Skill

**Purpose:** Create employment documents that match your company voice, legal requirements, and branding

**Contents:**
```
hr-document-generator/
├── SKILL.md
├── assets/
│   ├── logo.png
│   ├── letterhead-template.docx
│   └── company-fonts/
├── references/
│   ├── legal-language-library.md (state-specific clauses)
│   ├── company-voice-guide.md
│   └── dei-language-standards.md
└── scripts/
    └── generate_letterhead_docx.py
```

**Key Features:**
- Offer letters (multiple templates by level/type)
- Promotion letters
- Performance improvement plans
- Termination letters
- Policy acknowledgment forms
- Reference letters

**When to Use:** Any time you need to generate official employment documents

---

#### 2. Rippling Integration Skill

**Purpose:** Extract, analyze, and manipulate data from Rippling

**Contents:**
```
rippling-integration/
├── SKILL.md
├── references/
│   ├── rippling-api-docs.md
│   ├── data-schemas.md
│   └── common-queries.md
└── scripts/
    ├── auth_rippling.py
    ├── fetch_employee_data.py
    ├── update_employee_record.py
    └── generate_reports.py
```

**Key Features:**
- Employee data extraction
- Performance review data pulls
- ATS candidate pipeline analysis
- Compensation data reporting
- Bulk updates via API

**When to Use:** Any workflow that needs to read or write Rippling data

---

#### 3. Interview & Hiring Skill

**Purpose:** Streamline recruiting workflows with consistent, high-quality materials

**Contents:**
```
interview-hiring/
├── SKILL.md
├── assets/
│   ├── scorecard-templates/
│   └── interview-guide-examples/
├── references/
│   ├── competency-frameworks.md (by role family)
│   ├── behavioral-question-bank.md
│   └── interview-best-practices.md
└── scripts/
    └── generate_candidate_packet.py
```

**Key Features:**
- Job description generator with SEO optimization
- Competency-based interview guides
- Structured scorecards
- Rejection email templates (kind but clear)
- Reference check question sets

**When to Use:** From job opening through candidate selection

---

#### 4. Performance Review Skill

**Purpose:** Manage review cycles with consistency and fairness

**Contents:**
```
performance-review/
├── SKILL.md
├── assets/
│   ├── review-form-templates/
│   └── calibration-worksheets.xlsx
├── references/
│   ├── rating-definitions.md
│   ├── calibration-guidelines.md
│   └── example-feedback.md (by rating level)
└── scripts/
    └── aggregate_360_feedback.py
```

**Key Features:**
- Review form generation (self, manager, peer, upward)
- Feedback synthesis from multiple sources
- Calibration session materials
- Development plan templates
- Performance improvement plans

**When to Use:** During review cycles, calibration, ongoing feedback

---

#### 5. HR Analytics Skill

**Purpose:** Transform HR data into actionable insights

**Contents:**
```
hr-analytics/
├── SKILL.md
├── assets/
│   ├── dashboard-templates.xlsx
│   └── visualization-examples/
├── references/
│   ├── key-metrics-definitions.md
│   ├── industry-benchmarks.md
│   └── statistical-methods.md
└── scripts/
    ├── calculate_turnover.py
    ├── diversity_analysis.py
    └── compensation_equity_check.py
```

**Key Features:**
- Turnover/retention analysis
- Diversity metrics reporting
- Compensation equity audits
- Time-to-fill calculations
- Engagement survey analysis

**When to Use:** Board reporting, strategic planning, issue investigation

---

#### 6. Onboarding Orchestration Skill

**Purpose:** Coordinate new hire setup across all systems

**Contents:**
```
onboarding-orchestrator/
├── SKILL.md
├── assets/
│   ├── onboarding-checklist-template.md
│   └── welcome-packet-template.docx
├── references/
│   ├── system-access-requirements.md (by role)
│   ├── onboarding-timeline.md
│   └── departmental-requirements.md
└── scripts/
    ├── create_notion_onboarding_page.py
    ├── schedule_onboarding_meetings.py
    └── generate_it_tickets.py
```

**Key Features:**
- Role-specific onboarding checklists in Notion
- Welcome packet generation
- Stakeholder notification (IT, manager, buddy)
- Meeting scheduling (Google Calendar)
- Progress tracking

**When to Use:** When a new hire is marked "hired" in Rippling ATS

---

### Medium-Priority Skills

#### 7. Policy Documentation Skill
- Employee handbook sections
- Compliance checklist by state
- Policy update communications

#### 8. Compensation Planning Skill
- Salary range modeling
- Equity calculation tools
- Market benchmarking reports

#### 9. Employee Investigation Skill
- Investigation workflow templates
- Documentation standards
- Timeline tracking

---

## Claude Code Agents

### What Are Claude Code Agents?

Claude Code agents are Python scripts that run locally, use Claude's API for intelligence, and automate workflows across your systems. They're perfect for scheduled tasks, data sync, and complex multi-step processes.

### High-Priority Agents to Build

#### 1. New Hire Onboarding Agent

**Trigger:** Candidate marked "Hired" in Rippling ATS

**Workflow:**
```python
# Pseudo-code workflow
1. Detect new hire in Rippling via webhook/polling
2. Create employee record in Rippling HRIS (if not auto-created)
3. Generate personalized onboarding checklist in Notion
4. Create Google Workspace account
5. Send welcome email with credentials
6. Schedule day 1 meetings on Google Calendar
7. Notify manager, IT, and facilities
8. Create Slack workspace invite
```

**Data Flow:**
```
Rippling ATS → Python Script → Claude API (generates content) → Notion API (creates page) → Google APIs (calendar, email) → Slack API
```

**Benefits:** 
- Eliminates 2-3 hours of manual work per new hire
- Zero human error in system provisioning
- Consistent onboarding experience

---

#### 2. HR Metrics Dashboard Agent

**Trigger:** Daily/weekly schedule (cron job)

**Workflow:**
```python
1. Extract data from Rippling APIs:
   - Headcount by department/level
   - Active job openings
   - Offer acceptance rate
   - Time-to-fill metrics
   - Turnover rate (30/60/90 day, annual)
   - Performance rating distribution
   - Diversity metrics

2. Send data to Claude API for analysis:
   - Trend detection
   - Anomaly flagging
   - Insight generation

3. Update Google Sheets dashboard:
   - Write data with formulas
   - Update charts
   - Conditional formatting

4. Send summary to Slack channel:
   - Key metrics
   - Week-over-week changes
   - Action items flagged
```

**Output:** Live dashboard accessible to leadership, auto-updated

---

#### 3. Performance Review Orchestrator Agent

**Trigger:** Review cycle launch

**Workflow:**
```python
1. Pull employee list from Rippling
2. For each employee:
   - Identify manager, peers, skip-level
   - Generate review forms in Rippling
   - Send notification emails
   - Create reminder tasks in Notion

3. Monitor completion:
   - Daily checks for incomplete reviews
   - Send reminder emails at set intervals
   - Escalate to HR for blockers

4. When cycle closes:
   - Aggregate all feedback
   - Generate synthesis for each employee (via Claude)
   - Create calibration prep materials
   - Schedule calibration meetings on Google Calendar
```

---

#### 4. Exit Interview & Offboarding Agent

**Trigger:** Employee marked "Terminated" in Rippling

**Workflow:**
```python
1. Detect termination in Rippling
2. Determine exit type (voluntary/involuntary)
3. Create offboarding Notion page with checklist
4. Schedule exit interview (voluntary exits only)
5. Generate IT offboarding tickets
6. Send manager checklist for knowledge transfer
7. On last day:
   - Revoke all system access
   - Export employee files from Google Drive
   - Send final reminders
8. Post-exit:
   - Analyze exit interview themes
   - Update turnover dashboards
```

---

#### 5. Compliance Monitoring Agent

**Trigger:** Weekly schedule

**Workflow:**
```python
1. Check for expiring documents:
   - I-9 reverifications
   - Work authorization renewals
   - Required training completions
   - Policy acknowledgments

2. Pull required compliance reports from Rippling

3. Flag issues in Notion database

4. Send action item emails to HR team

5. Generate compliance dashboard
```

---

#### 6. Candidate Pipeline Agent

**Trigger:** Daily schedule

**Workflow:**
```python
1. Pull Rippling ATS data:
   - Candidates by stage
   - Time in each stage
   - Interview scheduled/completed
   - Offer status

2. Flag issues:
   - Candidates stalled >X days
   - Missing interview feedback
   - Pending offer decisions

3. Update Notion recruiting tracker

4. Send recruiter digest email with priorities

5. Calculate weekly funnel metrics
```

---

### Agent Architecture Template

```python
# Standard structure for all HR agents

import anthropic
import os
from integrations import rippling, notion, google_workspace, slack

class HRAgent:
    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.rippling = rippling.RipplingClient()
        self.notion = notion.NotionClient()
        self.google = google_workspace.GoogleClient()
        self.slack = slack.SlackClient()
    
    def run(self):
        # 1. Extract data from source systems
        data = self.extract_data()
        
        # 2. Send to Claude for processing
        result = self.process_with_claude(data)
        
        # 3. Take action in target systems
        self.execute_actions(result)
        
        # 4. Log results
        self.log_execution()
    
    def process_with_claude(self, data):
        """Use Claude API for intelligent processing"""
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": f"Process this HR data: {data}"
            }]
        )
        return response.content
```

---

## Prompt Templates

### Why Prompt Templates?

Not everything needs automation. These are battle-tested prompts for one-off tasks that HR teams face daily.

### Recruitment Templates

#### Job Description Generator

```
I need to create a job description for a [ROLE TITLE] reporting to [MANAGER TITLE] on the [DEPARTMENT] team.

Context about the role:
- [Brief description of what this person will do]
- [Key challenges they'll face]
- [Team structure and collaboration]

Requirements:
- Use our company voice: [conversational/formal/innovative - pick one]
- Include DEI-friendly language
- Format for posting on LinkedIn and our careers site
- Include [list any required sections: salary range, benefits, etc.]

Generate a compelling job description that will attract top talent.
```

---

#### Candidate Rejection Email

```
I need to send a rejection email to a candidate who interviewed for [ROLE].

Context:
- Candidate name: [NAME]
- Stage they reached: [phone screen/1st round/final round]
- Reason for rejection: [not enough experience in X / not a culture fit / chose another candidate]
- Anything positive to highlight: [e.g., impressed by their Y skill]

Tone: Kind but clear. Not overly apologetic. Professional.

Generate a rejection email that maintains our employer brand.
```

---

#### Sourcing Message

```
I want to reach out to a passive candidate on LinkedIn.

Candidate background: [SUMMARY FROM THEIR PROFILE]
Role I'm hiring for: [ROLE TITLE + BRIEF DESCRIPTION]
Why they'd be a good fit: [SPECIFIC REASONS]

Generate a personalized LinkedIn InMail (300 chars) that:
- References something specific from their background
- Clearly explains the opportunity
- Makes them curious to learn more
- Isn't salesy or generic
```

---

### Performance Management Templates

#### Review Synthesis

```
I need to synthesize 360 feedback for an employee's performance review.

Employee: [NAME], [TITLE]
Review period: [DATES]

Self-review highlights: [PASTE KEY POINTS]
Manager feedback: [PASTE KEY POINTS]
Peer feedback: [PASTE KEY POINTS]
Skip-level feedback (if any): [PASTE KEY POINTS]

Create a coherent narrative that:
- Identifies 2-3 key strengths with examples
- Identifies 1-2 development areas with specific suggestions
- Maintains the employee's dignity and motivation
- Is 250-300 words
```

---

#### Development Plan

```
Create a development plan for [NAME], [TITLE] based on their performance review.

Areas for development:
1. [SKILL/COMPETENCY 1]
2. [SKILL/COMPETENCY 2]

Context:
- Their career aspirations: [E.G., MOVE TO MANAGEMENT, BECOME TECHNICAL LEAD]
- Available resources: [BUDGET FOR COURSES, MENTORING PROGRAMS, STRETCH PROJECTS]
- Timeline: [6 MONTHS / 1 YEAR]

Generate a concrete development plan with:
- SMART goals for each development area
- Specific actions (courses, projects, mentoring)
- Milestones and check-in points
- How success will be measured
```

---

#### Performance Improvement Plan (PIP)

```
I need to create a Performance Improvement Plan for [NAME], [TITLE].

Performance issues:
1. [SPECIFIC ISSUE 1 with examples]
2. [SPECIFIC ISSUE 2 with examples]

Context:
- How long these issues have been occurring: [TIMELINE]
- Previous feedback given: [SUMMARY]
- Expected standards for the role: [DESCRIBE]

Generate a 30-60-90 day PIP that:
- Clearly defines the performance gap
- Sets specific, measurable expectations
- Includes weekly check-in structure
- Outlines support/resources provided
- States consequences if standards not met
- Is legally compliant and documentation-ready
```

---

### Employee Relations Templates

#### Investigation Documentation

```
I need to document an employee relations investigation.

Complaint: [BRIEF SUMMARY]
Complainant: [NAME/TITLE]
Respondent: [NAME/TITLE]
Date reported: [DATE]

Information gathered:
- [WITNESS 1 STATEMENT SUMMARY]
- [WITNESS 2 STATEMENT SUMMARY]
- [RELEVANT EMAILS/EVIDENCE]

Create an investigation summary that:
- Presents findings objectively
- Cites specific evidence
- Makes a determination (substantiated/not substantiated)
- Recommends next steps
- Maintains confidentiality and professionalism
- Is legally defensible
```

---

#### Difficult Conversation Script

```
I need to prepare for a difficult conversation.

Situation: [DESCRIBE THE ISSUE]
Employee: [NAME], [TITLE], [TENURE]
Relationship context: [HOW WELL DO YOU KNOW THEM, PAST PERFORMANCE]

What needs to be communicated:
- [KEY MESSAGE 1]
- [KEY MESSAGE 2]

Anticipated reactions: [DEFENSIVE / EMOTIONAL / DENY]

Generate a conversation guide with:
- Opening statement (how to frame the conversation)
- Key points to cover
- How to handle common reactions
- Questions to ask
- Desired outcome and next steps
```

---

### Analytics Templates

#### Survey Analysis

```
Analyze our employee engagement survey results.

Survey data: [PASTE CSV OR SUMMARY STATS]
Previous survey results (for comparison): [PASTE IF AVAILABLE]

Analyze for:
- Overall sentiment trends
- Top 3 strengths to celebrate
- Top 3 concerns that need action
- Differences by department/tenure/level (if data allows)
- Specific themes in open-ended responses

Provide:
1. Executive summary (3-4 sentences)
2. Key findings with supporting data
3. Recommended actions (prioritized)
4. Suggested communication to employees about results
```

---

#### Turnover Analysis

```
Analyze our turnover data to identify patterns.

Turnover data: [PASTE DATA - WHO LEFT, WHEN, TENURE, DEPARTMENT, ROLE, EXIT REASON]
Context: [COMPANY SIZE, INDUSTRY, RECENT CHANGES]

Analyze for:
- Overall turnover rate vs industry benchmarks
- Patterns by department, role, tenure, manager
- High-risk cohorts (who's most likely to leave)
- Root cause themes from exit interviews
- Early warning indicators

Provide:
1. Key findings with data
2. Root cause hypothesis
3. Recommended retention interventions
4. Metrics to track going forward
```

---

### Operations Templates

#### Meeting Notes

```
Structure these notes from our [TYPE OF MEETING].

Raw notes: [PASTE NOTES]

Format as:
- Attendees
- Key decisions made
- Action items (with owners and due dates)
- Open questions / parking lot
- Next meeting date

Keep it scannable and action-oriented.
```

---

#### All-Hands Q&A Prep

```
Prepare me to answer these employee questions at our all-hands.

Questions submitted:
1. [QUESTION 1]
2. [QUESTION 2]
3. [QUESTION 3]

Context: [RELEVANT COMPANY SITUATION, RECENT CHANGES, SENTIMENT]

For each question, provide:
- Suggested answer (2-3 sentences, clear and honest)
- Tone guidance (empathetic/factual/optimistic)
- What NOT to say
- Likely follow-up questions
```

---

## Integration Architecture

### System Overview

```
┌─────────────┐
│   Rippling  │  (Source of truth for employee data)
└──────┬──────┘
       │
       ├─── Employee records
       ├─── ATS candidates
       ├─── Performance data
       ├─── Compensation
       │
       ▼
┌──────────────┐
│ Claude Code  │  (Intelligence & orchestration layer)
│   Agents     │
└──────┬───────┘
       │
       ├───────────┬───────────┐
       │           │           │
       ▼           ▼           ▼
┌──────────┐  ┌─────────────┐  ┌─────────┐
│  Notion  │  │   Google    │  │  Slack  │
│          │  │  Workspace  │  │         │
└──────────┘  └─────────────┘  └─────────┘
│              │                │
├─ Projects   ├─ Gmail         ├─ Channels
├─ Checklists ├─ Calendar      ├─ DMs
├─ Wikis      ├─ Drive        ├─ Notifications
└─ Databases  └─ Sheets       └─ Workflows
```

### Authentication & Security

#### API Keys Storage
```bash
# Use environment variables, never hardcode
export ANTHROPIC_API_KEY="sk-ant-..."
export RIPPLING_API_KEY="rpl_..."
export NOTION_TOKEN="secret_..."
export GOOGLE_CREDENTIALS_PATH="/path/to/creds.json"
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." # Optional, for webhooks
```

#### Recommended Security Practices
- Store credentials in environment variables or secret manager
- Use service accounts with minimal required permissions
- Rotate API keys quarterly
- Log all agent actions for audit trail
- Never commit credentials to git repos
- Use .env files locally (added to .gitignore)

---

### API Integration Guide

#### Rippling API

**Base URL:** `https://api.rippling.com`

**Key Endpoints:**
```python
# Employee data
GET /platform/api/employees
GET /platform/api/employees/{id}

# ATS
GET /platform/api/applicants
GET /platform/api/jobs

# Performance
GET /platform/api/performance_reviews
```

**Authentication:**
```python
headers = {
    "Authorization": f"Bearer {RIPPLING_API_KEY}",
    "Content-Type": "application/json"
}
```

**Python Example:**
```python
import requests

def get_all_employees():
    url = "https://api.rippling.com/platform/api/employees"
    headers = {"Authorization": f"Bearer {os.getenv('RIPPLING_API_KEY')}"}
    response = requests.get(url, headers=headers)
    return response.json()
```

---

#### Notion API

**Base URL:** `https://api.notion.com/v1`

**Key Endpoints:**
```python
# Databases
POST /databases/{database_id}/query
POST /pages  # Create new page
PATCH /pages/{page_id}  # Update page

# Search
POST /search
```

**Python Example:**
```python
from notion_client import Client

notion = Client(auth=os.getenv("NOTION_TOKEN"))

# Create onboarding page
notion.pages.create(
    parent={"database_id": "abc123"},
    properties={
        "Name": {"title": [{"text": {"content": "John Doe Onboarding"}}]},
        "Status": {"select": {"name": "In Progress"}},
        "Start Date": {"date": {"start": "2025-11-15"}}
    }
)
```

---

#### Google Workspace APIs

**Authentication:** OAuth 2.0 service account

**Key APIs:**
- Gmail API: Send emails, read inbox
- Calendar API: Create events, check availability
- Drive API: Create folders, upload files
- Sheets API: Read/write spreadsheet data

**Python Example (Google Calendar):**
```python
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']
credentials = service_account.Credentials.from_service_account_file(
    'credentials.json', scopes=SCOPES)

service = build('calendar', 'v3', credentials=credentials)

# Create meeting
event = {
    'summary': 'New Hire Kickoff - John Doe',
    'start': {'dateTime': '2025-11-15T09:00:00-08:00'},
    'end': {'dateTime': '2025-11-15T10:00:00-08:00'},
    'attendees': [
        {'email': 'john.doe@company.com'},
        {'email': 'manager@company.com'}
    ]
}

service.events().insert(calendarId='primary', body=event).execute()
```

---

#### Slack API

**Authentication:** Bot Token (OAuth) or Webhook URL

**Key Use Cases:**
- Send notifications to channels (metrics, alerts, announcements)
- Send direct messages to employees (onboarding, reminders)
- Post formatted messages with attachments
- Create interactive workflows and buttons
- Listen to events via webhooks

**Python Example (Slack SDK):**
```python
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

slack = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))

# Send message to channel
try:
    response = slack.chat_postMessage(
        channel="#hr-updates",
        text="Welcome to the team! 🎉",
        blocks=[
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*New Hire Alert*\nJohn Doe joined Engineering today!"
                }
            }
        ]
    )
except SlackApiError as e:
    print(f"Error: {e}")
```

**Python Example (Webhook - Simpler for notifications):**
```python
import requests
import json

def send_slack_notification(message, channel="#hr-metrics"):
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    payload = {
        "text": message,
        "channel": channel
    }
    requests.post(webhook_url, json=payload)
```

**Common Slack Integration Patterns:**
- **HR Metrics Dashboard:** Post daily/weekly summary to `#hr-leadership`
- **New Hire Onboarding:** Send welcome DM with resources and schedule
- **Review Cycle Reminders:** Post to manager channels when reviews are due
- **Compliance Alerts:** Send urgent notifications to `#hr-compliance`
- **Announcements:** Format company-wide updates with rich formatting

---

### Data Schemas

#### Employee Record (Rippling)
```json
{
  "id": "emp_123",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@company.com",
  "department": "Engineering",
  "title": "Senior Software Engineer",
  "manager_id": "emp_456",
  "start_date": "2025-11-15",
  "employment_type": "full_time",
  "location": "San Francisco, CA"
}
```

#### Onboarding Checklist (Notion)
```json
{
  "Employee Name": "John Doe",
  "Start Date": "2025-11-15",
  "Department": "Engineering",
  "Manager": "Jane Smith",
  "Status": "In Progress",
  "Checklist Items": [
    {"task": "Complete I-9", "owner": "HR", "due": "Day 1", "status": "Not Started"},
    {"task": "Laptop setup", "owner": "IT", "due": "Day 1", "status": "Not Started"},
    {"task": "Benefits enrollment", "owner": "Employee", "due": "Day 5", "status": "Not Started"}
  ]
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Set up core infrastructure and deliver first value

**Tasks:**
1. Set up development environment
   - Install Claude Code
   - Configure API access (Rippling, Notion, Google)
   - Create service accounts with proper permissions

2. Build first custom skill: **HR Document Generator**
   - Most immediate value
   - Clear use case
   - Low technical complexity

3. Create prompt template library
   - Document top 10 most common HR asks
   - Test and refine prompts
   - Share with team in Notion

**Deliverables:**
- Working HR Document Generator skill (.skill file)
- Prompt library (Notion page)
- API credentials configured

**Success Metrics:**
- First document generated via skill
- Team using prompt templates

---

### Phase 2: Automation (Weeks 3-4)

**Goal:** Automate first high-impact workflow

**Tasks:**
1. Build **New Hire Onboarding Agent**
   - Most painful manual process
   - Touches all systems
   - Immediately visible impact

2. Set up agent infrastructure
   - Hosting (local server or cloud function)
   - Logging and error handling
   - Monitoring dashboard

3. Build **Rippling Integration Skill**
   - Enables other workflows
   - Standardizes data access patterns

**Deliverables:**
- Onboarding agent running on schedule
- Rippling integration skill
- Agent monitoring dashboard

**Success Metrics:**
- First automated onboarding completed
- Zero manual errors in provisioning
- Time saved per new hire: 2-3 hours

---

### Phase 3: Analytics (Weeks 5-6)

**Goal:** Enable data-driven decision making

**Tasks:**
1. Build **HR Metrics Dashboard Agent**
   - Daily data sync from Rippling
   - Google Sheets dashboard with charts
   - Slack notifications for key metrics

2. Build **HR Analytics Skill**
   - Turnover analysis
   - Diversity metrics
   - Compensation equity checks

3. Create executive reporting templates
   - Board deck slides
   - Monthly HR scorecards

**Deliverables:**
- Auto-updating metrics dashboard
- HR Analytics skill
- Board reporting templates

**Success Metrics:**
- Dashboard used weekly by leadership
- Data requests reduced by 50%
- Board deck prep time cut in half

---

### Phase 4: Performance & Talent (Weeks 7-8)

**Goal:** Streamline performance management and recruiting

**Tasks:**
1. Build **Performance Review Skill**
   - Review form generation
   - Feedback synthesis
   - Calibration prep

2. Build **Interview & Hiring Skill**
   - Job description generator
   - Interview guides
   - Candidate scorecards

3. Build **Performance Review Orchestrator Agent** (optional)
   - Automate review cycle logistics

**Deliverables:**
- Performance Review skill
- Interview & Hiring skill
- Review orchestrator agent (if time)

**Success Metrics:**
- Review cycle completion rate >95%
- Time-to-fill reduced by 20%
- Interview process consistency score

---

### Phase 5: Scale & Optimize (Weeks 9-12)

**Goal:** Build remaining skills and optimize existing ones

**Tasks:**
1. Build remaining medium-priority skills
   - Policy Documentation
   - Compensation Planning
   - Employee Investigation

2. Optimize existing agents
   - Add error recovery
   - Improve performance
   - Expand capabilities

3. Train team on usage
   - Documentation
   - Office hours
   - Best practices guide

4. Measure impact
   - Time saved per workflow
   - Error reduction
   - Employee/manager satisfaction

**Deliverables:**
- Complete skills library
- Optimized agents
- Team training complete
- Impact report

**Success Metrics:**
- All high-priority skills built
- Team adoption >80%
- Measurable ROI on implementation

---

## Quick Start Actions

### This Week

1. **Install Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Set up API access**
   - Rippling: Generate API key in settings
   - Notion: Create integration and get token
   - Google: Create service account and download credentials
   - Slack: Create app in Slack API dashboard, install to workspace, get bot token (or use webhook URL for simpler notifications)

3. **Build your first skill**
   - Use the skill-creator skill at `/mnt/skills/public/skill-creator/`
   - Start with HR Document Generator
   - Test with real documents

4. **Document your top 5 prompts**
   - What do you ask Claude most often?
   - Refine and save as templates
   - Share with team

### This Month

1. Deploy New Hire Onboarding Agent
2. Create HR Metrics Dashboard
3. Build Interview & Hiring Skill
4. Train team on prompt templates

---

## Resources & Next Steps

### Internal Documentation Needed

Create these reference documents for skills to use:

1. **Company Voice Guide** - How we write (formal vs casual, values, tone)
2. **Legal Language Library** - Pre-approved clauses by jurisdiction
3. **Competency Frameworks** - What "good" looks like by role family
4. **DEI Language Standards** - Inclusive language guidelines
5. **Compliance Requirements** - Checklists by state/country
6. **Data Schemas** - How data is structured across systems

### External Resources

- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code
- **Anthropic API Docs:** https://docs.claude.com/en/api
- **Rippling API Docs:** [From Rippling support]
- **Notion API Docs:** https://developers.notion.com
- **Google Workspace APIs:** https://developers.google.com/workspace
- **Slack API Docs:** https://api.slack.com

---

## Questions to Answer

As you build, you'll need to decide:

1. **Hosting:** Where will agents run? (Local server, cloud functions, serverless)
2. **Scheduling:** How often do agents run? (Real-time webhooks vs scheduled)
3. **Error Handling:** What happens when an API fails? (Retry logic, alerting)
4. **Security:** Who has access to what? (RBAC, audit logs)
5. **Compliance:** What data can be processed by Claude? (PII handling, data residency)
6. **Governance:** Who approves new skills/agents? (Review process, testing)

---

## Appendix: Example Implementations

### Example 1: Simple Agent (HR Metrics)

```python
#!/usr/bin/env python3
"""
HR Metrics Dashboard Agent
Runs daily to update Google Sheets with Rippling data
"""

import anthropic
import os
from datetime import datetime
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Initialize clients
claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
rippling_headers = {"Authorization": f"Bearer {os.getenv('RIPPLING_API_KEY')}"}

def fetch_rippling_data():
    """Get key metrics from Rippling"""
    # Headcount
    employees = requests.get(
        "https://api.rippling.com/platform/api/employees",
        headers=rippling_headers
    ).json()
    
    # Active jobs
    jobs = requests.get(
        "https://api.rippling.com/platform/api/jobs",
        headers=rippling_headers
    ).json()
    
    return {
        "total_headcount": len(employees),
        "active_jobs": len([j for j in jobs if j["status"] == "open"]),
        "employees": employees,
        "date": datetime.now().isoformat()
    }

def analyze_with_claude(data):
    """Use Claude to analyze trends and generate insights"""
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"""Analyze this HR data and provide insights:

Data: {data}

Provide:
1. Key observations (any unusual trends?)
2. Recommended actions (what should HR focus on?)
3. Metrics to highlight in dashboard

Format as JSON."""
        }]
    )
    return response.content[0].text

def update_google_sheet(data, insights):
    """Write data to Google Sheets dashboard"""
    creds = service_account.Credentials.from_service_account_file(
        'credentials.json',
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    service = build('sheets', 'v4', credentials=creds)
    
    # Update values
    sheet_id = os.getenv("HR_DASHBOARD_SHEET_ID")
    values = [
        [data["date"], data["total_headcount"], data["active_jobs"]]
    ]
    
    service.spreadsheets().values().append(
        spreadsheetId=sheet_id,
        range="Metrics!A:C",
        valueInputOption="USER_ENTERED",
        body={"values": values}
    ).execute()
    
    # Update insights
    service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range="Insights!A1",
        valueInputOption="USER_ENTERED",
        body={"values": [[insights]]}
    ).execute()

def send_slack_summary(data, insights):
    """Post summary to Slack channel"""
    from slack_sdk import WebClient
    
    slack = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))
    
    summary = f"""📊 *Daily HR Metrics Update*
    
    • Headcount: {data["total_headcount"]}
    • Active Jobs: {data["active_jobs"]}
    
    *Key Insights:*
    {insights[:200]}..."""
    
    slack.chat_postMessage(
        channel="#hr-metrics",
        text=summary
    )

def main():
    print("Fetching data from Rippling...")
    data = fetch_rippling_data()
    
    print("Analyzing with Claude...")
    insights = analyze_with_claude(data)
    
    print("Updating Google Sheet...")
    update_google_sheet(data, insights)
    
    print("Posting to Slack...")
    send_slack_summary(data, insights)
    
    print("✅ Dashboard updated successfully!")

if __name__ == "__main__":
    main()
```

### Example 2: Custom Skill (Simplified)

```markdown
---
name: hr-document-generator
description: Generate professional HR documents including offer letters, performance reviews, and termination letters. Use when the user needs to create any official employment document. Maintains company voice, legal compliance, and professional formatting.
---

# HR Document Generator

Generate professional HR documents with proper formatting, legal compliance, and company voice.

## Supported Documents

1. **Offer Letters** - New hire and contractor offers
2. **Promotion Letters** - Internal role changes
3. **Performance Improvement Plans** - Structured PIPs with metrics
4. **Termination Letters** - Resignation acceptance and involuntary termination
5. **Reference Letters** - Employment verification

## Usage

1. Ask user for document type and key details
2. Load appropriate template from `assets/`
3. Use company voice guide from `references/company-voice-guide.md`
4. Include legal language from `references/legal-language-library.md` (by state)
5. Generate document using docx skill
6. Save to `/mnt/user-data/outputs/`

## Document Structure

### Offer Letter
- Company letterhead
- Candidate name and address
- Role title and department
- Start date
- Compensation (salary + equity + benefits)
- At-will employment statement
- State-specific legal clauses
- Expiration date (typically 5 business days)
- Signature block

### PIP Template
- Employee information
- Performance concerns (specific examples)
- Expectations and metrics
- Support provided
- Check-in schedule (weekly)
- Timeline (30/60/90 days)
- Consequences if standards not met

## Legal Requirements by State

See `references/legal-language-library.md` for required clauses.

## Assets

- `assets/letterhead-template.docx` - Company branded template
- `assets/logo.png` - Company logo for documents

## References

- `references/company-voice-guide.md` - How we write
- `references/legal-language-library.md` - Pre-approved legal clauses
- `references/dei-language-standards.md` - Inclusive language guide
```

---

## Final Notes

This document is a living resource. As you build and learn, update it with:
- New skills developed
- Agents deployed
- Prompts refined
- Best practices discovered
- Integration patterns that work

**Remember:** Start small, ship fast, iterate based on real usage. Don't try to build everything at once.

**First priority:** Build the HR Document Generator skill and deploy the New Hire Onboarding Agent. These two will deliver immediate, visible value and build momentum for the rest.

Good luck! 🚀
