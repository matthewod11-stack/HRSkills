# Claude for HR: Quick Reference Card

**For:** Head of People & Talent  
**Tech Stack:** Rippling, Notion, Google Workspace, Slack  
**Last Updated:** November 2, 2025

---

## 🚀 Start Here: Week 1 Action Plan

### Day 1-2: Setup
```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Set up API keys (store in .env file)
ANTHROPIC_API_KEY=sk-ant-...
RIPPLING_API_KEY=rpl_...
NOTION_TOKEN=secret_...
GOOGLE_CREDENTIALS_PATH=/path/to/creds.json
SLACK_BOT_TOKEN=xoxb-...
# Optional: SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Day 3-4: Build First Skill
- Use `/mnt/skills/public/skill-creator/` as guide
- Build **HR Document Generator** skill
- Test with offer letter and PIP

### Day 5: Quick Wins
- Document your top 5 most-used prompts
- Share prompt library with team
- Schedule first agent (New Hire Onboarding)

---

## 📊 Capability Decision Tree

```
What do you need?

├─ Generate a document (offer letter, PIP, etc.)
│  └─ → Use: HR Document Generator Skill
│
├─ Automate recurring workflow (onboarding, metrics)
│  └─ → Build: Claude Code Agent
│
├─ One-off task (analyze survey, draft email)
│  └─ → Use: Prompt Template
│
└─ Read/write data from Rippling/Notion/Google/Slack
   └─ → Build: Integration Skill first, then Agent
```

---

## 🎯 Top 5 High-Impact Use Cases

### 1. New Hire Onboarding (Agent)
**Impact:** Save 2-3 hours per new hire, zero errors  
**Complexity:** Medium  
**Build Time:** 3-4 days  

**What it does:**
- Detects "Hired" status in Rippling
- Creates Notion onboarding page
- Provisions Google account
- Schedules Day 1 meetings
- Notifies stakeholders

---

### 2. HR Metrics Dashboard (Agent)
**Impact:** Real-time visibility for leadership  
**Complexity:** Low  
**Build Time:** 1-2 days  

**What it does:**
- Daily pull from Rippling (headcount, turnover, time-to-fill)
- Updates Google Sheets dashboard
- Sends Slack digest with insights

---

### 3. HR Document Generator (Skill)
**Impact:** Consistent, compliant docs in seconds  
**Complexity:** Low  
**Build Time:** 2 days  

**What it creates:**
- Offer letters
- PIPs
- Termination letters
- Reference letters

---

### 4. Performance Review Cycle (Skill + Agent)
**Impact:** 50% reduction in cycle admin time  
**Complexity:** High  
**Build Time:** 5-7 days  

**What it does:**
- Generates review forms
- Tracks completion
- Synthesizes 360 feedback
- Prepares calibration materials

---

### 5. Interview & Hiring Toolkit (Skill)
**Impact:** Faster hiring, better candidate experience  
**Complexity:** Low  
**Build Time:** 2-3 days  

**What it creates:**
- Job descriptions (optimized for SEO)
- Competency-based interview guides
- Candidate scorecards
- Rejection emails

---

## 🛠️ Skill vs Agent: When to Use What

| Feature | Custom Skill | Claude Code Agent |
|---------|--------------|-------------------|
| **Purpose** | Extend Claude's knowledge/capabilities | Automate workflows across systems |
| **Runs in** | Claude.ai interface | Command line / server |
| **User interaction** | Real-time, conversational | Scheduled or triggered |
| **Best for** | Document generation, analysis | Data sync, orchestration |
| **Example** | "Generate an offer letter" | "Sync new hires to all systems daily" |

---

## 📝 Top 10 Prompt Templates

### Recruiting
1. **Job Description Generator**
   ```
   Create JD for [ROLE] on [TEAM]. Use [TONE]. Include DEI language and salary range.
   ```

2. **Sourcing Message**
   ```
   LinkedIn InMail for [CANDIDATE BACKGROUND] about [ROLE]. Reference [SPECIFIC DETAIL]. 300 chars.
   ```

3. **Candidate Rejection**
   ```
   Rejection email for [NAME] who reached [STAGE]. Kind but clear. Highlight [POSITIVE].
   ```

### Performance
4. **Review Synthesis**
   ```
   Synthesize 360 feedback for [NAME]. Self: [PASTE]. Manager: [PASTE]. Peers: [PASTE]. 250 words.
   ```

5. **Development Plan**
   ```
   Create 6-month plan for [NAME] to develop [SKILLS]. Include SMART goals and milestones.
   ```

6. **PIP Creation**
   ```
   30-60-90 day PIP for [NAME]. Issues: [LIST]. Previous feedback: [SUMMARY]. Legally compliant.
   ```

### Analytics
7. **Survey Analysis**
   ```
   Analyze engagement survey: [DATA]. Identify top 3 strengths and concerns. Recommend actions.
   ```

8. **Turnover Analysis**
   ```
   Analyze turnover data: [PASTE]. Find patterns by dept/role/tenure. Recommend retention strategies.
   ```

### Operations
9. **Meeting Notes**
   ```
   Structure these [MEETING TYPE] notes: [PASTE]. Include decisions, actions (with owners), next steps.
   ```

10. **All-Hands Q&A**
    ```
    Prep answers for: [QUESTIONS]. Context: [SITUATION]. Include tone guidance and follow-ups.
    ```

---

## 🔗 Integration Quick Reference

### Rippling API
```python
import requests

headers = {"Authorization": f"Bearer {RIPPLING_API_KEY}"}
employees = requests.get(
    "https://api.rippling.com/platform/api/employees",
    headers=headers
).json()
```

### Notion API
```python
from notion_client import Client

notion = Client(auth=NOTION_TOKEN)
notion.pages.create(
    parent={"database_id": "abc123"},
    properties={"Name": {"title": [{"text": {"content": "Page Title"}}]}}
)
```

### Google Calendar API
```python
from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file('creds.json')
service = build('calendar', 'v3', credentials=creds)

event = {
    'summary': 'Meeting',
    'start': {'dateTime': '2025-11-15T09:00:00-08:00'},
    'end': {'dateTime': '2025-11-15T10:00:00-08:00'}
}
service.events().insert(calendarId='primary', body=event).execute()
```

### Slack API
```python
from slack_sdk import WebClient

slack = WebClient(token=SLACK_BOT_TOKEN)

# Send message to channel
slack.chat_postMessage(
    channel="#hr-updates",
    text="Daily HR metrics update",
    blocks=[
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*HR Metrics*\n• Headcount: 150\n• Open roles: 12"
            }
        }
    ]
)

# Send DM to user
slack.chat_postMessage(
    channel="U1234567890",  # User ID
    text="Welcome to the team! Here's your onboarding checklist..."
)

# Webhook (simpler for notifications)
import requests
requests.post(SLACK_WEBHOOK_URL, json={"text": "Alert: Compliance deadline approaching"})
```

**Slack Use Cases:**
- Notify channels about new hires, metrics, alerts
- Send welcome DMs to new employees
- Remind managers about review deadlines
- Post compliance alerts and announcements

---

## 🏗️ Agent Template (Copy-Paste)

```python
#!/usr/bin/env python3
import anthropic
import os

# Initialize
claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def main():
    # 1. Extract data from source
    data = fetch_data_from_rippling()
    
    # 2. Process with Claude
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": f"Process: {data}"}]
    )
    
    # 3. Take action in target systems
    result = response.content[0].text
    write_to_notion(result)
    notify_slack(result)  # Optional: post to Slack
    
    print("✅ Complete!")

if __name__ == "__main__":
    main()
```

---

## ⚠️ Common Pitfalls

### 1. Trying to build everything at once
**Solution:** Start with HR Document Generator + New Hire Agent. Ship, learn, iterate.

### 2. Hardcoding API keys
**Solution:** Use environment variables. Never commit credentials.

### 3. No error handling
**Solution:** Add try/catch, logging, and retry logic to agents.

### 4. Skills that are too general
**Solution:** One skill = one clear job. Split complex skills into multiple.

### 5. Not testing with real data
**Solution:** Use actual employee records (anonymized if needed) when building.

---

## 📚 Essential Resources

- **Full Master Doc:** `/mnt/user-data/outputs/claude-hr-capabilities-master.md`
- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code
- **API Docs:** https://docs.claude.com/en/api
- **Skill Creator Guide:** `/mnt/skills/public/skill-creator/SKILL.md`

---

## 🎯 30-Day Roadmap

### Week 1: Foundation
- [ ] Set up dev environment
- [ ] Build HR Document Generator skill
- [ ] Create prompt library (Notion)

### Week 2: First Agent
- [ ] Build New Hire Onboarding Agent
- [ ] Deploy and test with real hire
- [ ] Build Rippling Integration Skill

### Week 3: Analytics
- [ ] Build HR Metrics Dashboard Agent
- [ ] Create executive reporting templates
- [ ] Build HR Analytics Skill

### Week 4: Performance & Talent
- [ ] Build Performance Review Skill
- [ ] Build Interview & Hiring Skill
- [ ] Train team on usage

---

## 💡 Pro Tips

1. **Start conversationally:** Before building a skill, just use Claude.ai to test the workflow
2. **Use existing skills:** docx, xlsx, pdf skills are already built - reference them
3. **Think progressive disclosure:** Keep SKILL.md lean, put details in references/
4. **Name things clearly:** `onboarding-orchestrator` > `agent-1`
5. **Document as you go:** Future you will thank present you

---

## 🆘 Troubleshooting

**Q: Skill isn't triggering**  
A: Check the `description` in frontmatter - that's what Claude uses to decide when to load it

**Q: Agent failing silently**  
A: Add logging and print statements. Check API rate limits.

**Q: Can't authenticate with Rippling**  
A: Verify API key has correct scopes. Check docs for required permissions.

**Q: Google API quota exceeded**  
A: Implement exponential backoff. Consider caching responses.

**Q: Notion page creation failing**  
A: Check database schema matches your properties. Notion is strict about types.

**Q: Slack messages not posting**  
A: Verify bot token has correct scopes (chat:write, im:write). Check channel/user IDs are correct.

---

## 🎉 Quick Wins to Demo Value

Try these today to show immediate ROI:

1. **Generate an offer letter** (5 min)
   - Use HR Document Generator skill
   - Compare to manual process

2. **Analyze last engagement survey** (10 min)
   - Use Survey Analysis prompt
   - Present insights to leadership

3. **Create interview guide for open role** (15 min)
   - Use Interview & Hiring prompt
   - Share with hiring manager

4. **Pull Rippling metrics and format for exec team** (20 min)
   - Simple Python script + Claude API
   - Auto-format in Google Slides

---

**Remember:** You don't need to be a developer to use Claude effectively. Start with prompts, graduate to skills, build agents when you're ready. Each level unlocks more leverage.

**Next step:** Open the full master doc and pick your first project. You've got this! 🚀
