# Smart Routing Guide

> **Complete guide to the intelligent chat routing system with action suggestions**

**Last Updated:** 2025-11-09
**Feature:** Phase 2 Smart Routing & Action Suggestions
**Status:** Production Ready

---

## Overview

The smart routing system enhances the chat endpoint with:

1. **Automatic Workflow Detection** - Routes queries to appropriate HR workflows
2. **Intelligent Action Suggestions** - Suggests relevant follow-up actions based on context
3. **Follow-Up Question Prompts** - Guides users to explore related functionality
4. **Permission-Aware Filtering** - Only suggests actions the user can execute

---

## How Smart Routing Works

### 1. Workflow Detection

When a user sends a message, the system:

```typescript
// 1. Build detection context
const detectionContext = buildDetectionContext(message, history, currentWorkflow)

// 2. Detect workflow using pattern matching
const workflowMatch = detectWorkflow(detectionContext)
// Returns: { workflowId, confidence, contextFactors }

// 3. Load appropriate workflow prompt
const workflow = loadWorkflow(workflowMatch.workflowId)
const systemPrompt = buildWorkflowSystemPrompt(workflow)
```

**Supported Workflows:**
- `hiring` - Job descriptions, interviews, offers
- `performance` - Reviews, feedback, PIPs
- `onboarding` - New hire setup, checklists
- `offboarding` - Exit processes, terminations
- `analytics` - Metrics, reports, dashboards
- `compensation` - Salary adjustments, equity
- `employee_relations` - Complaints, investigations
- `compliance` - Policies, documentation
- `general` - Catch-all for unmatched queries

**Detection Example:**

```typescript
// User message: "Create a job description for a senior engineer"

// Detected:
{
  workflowId: "hiring",
  confidence: 95,
  contextFactors: ["keyword_match: job description", "domain: hiring"]
}
```

### 2. Action Suggestion Engine

After generating the AI response, the system suggests relevant actions:

```typescript
const suggestionContext: SuggestionContext = {
  workflowId: 'hiring',
  message: "Create a job description for a senior engineer",
  aiResponse: reply,
  conversationHistory: history,
  userId: authResult.user.userId,
  userPermissions: ['chat', 'uploadData', 'takeActions']
}

const suggestedActions = suggestActions(suggestionContext)
```

**Suggested Actions (Example):**

```json
{
  "suggestedActions": [
    {
      "id": "action_abc123",
      "type": "create_document",
      "label": "Save job description to Google Drive",
      "description": "Save this job description to the Hiring folder in Google Drive",
      "priority": "high",
      "requiresApproval": false,
      "payload": {
        "documentType": "job_description",
        "title": "Job Description - Senior Engineer",
        "content": "...",
        "destination": {
          "type": "google_drive",
          "folderPath": "/Hiring/Job Descriptions"
        }
      }
    },
    {
      "id": "action_def456",
      "type": "send_slack_message",
      "label": "Post to #hiring channel",
      "description": "Share this JD with the hiring team on Slack",
      "priority": "medium",
      "requiresApproval": false,
      "payload": {
        "channel": "hiring",
        "text": "New job description ready: Senior Engineer"
      }
    }
  ]
}
```

### 3. Follow-Up Question Suggestions

The system also suggests related questions:

```json
{
  "followUpQuestions": [
    "Create an interview guide for this position",
    "Draft an offer letter for a candidate",
    "Show me hiring pipeline metrics"
  ]
}
```

---

## Action Suggestion Rules

### Workflow-Specific Rules

Each workflow has specific triggers and action generators:

#### Hiring Workflow

**Triggers:**
- `job description|jd`
- `offer letter|offer`
- `candidate|applicant|interview`

**Generated Actions:**
- Save JD to Google Drive
- Post to Slack #hiring channel
- Schedule interview
- Generate offer letter
- Email offer to candidate

#### Performance Workflow

**Triggers:**
- `review|feedback|evaluation`
- `pip|improvement plan`
- `performance|rating`

**Generated Actions:**
- Save performance review
- Email review to employee
- Create PIP document
- Schedule PIP kickoff meeting

#### Analytics Workflow

**Triggers:**
- `headcount|turnover|attrition`
- `report|dashboard|metrics`

**Generated Actions:**
- Export to Google Sheets
- Schedule weekly dashboard email
- Generate PDF report

#### Onboarding Workflow

**Triggers:**
- `onboarding|new hire|first day`

**Generated Actions:**
- Create onboarding checklist
- Create Slack onboarding channel
- Send welcome email
- Schedule orientation

#### Offboarding Workflow

**Triggers:**
- `offboarding|exit|termination|resignation`

**Generated Actions:**
- Generate termination letter
- Schedule exit interview
- Create offboarding checklist
- Revoke system access

---

## Permission-Based Filtering

Actions are filtered based on user permissions:

```typescript
// Action requires: ['chat', 'takeActions']
// User has: ['chat', 'viewEmployees']
// Result: Action is NOT suggested

// Action requires: ['chat', 'uploadData']
// User has: ['chat', 'uploadData', 'editEmployees']
// Result: Action IS suggested
```

**Permission Mapping:**

| Action Type | Required Permissions |
|-------------|---------------------|
| `create_document` | `chat`, `uploadData` |
| `send_email` | `chat`, `takeActions` |
| `send_slack_message` | `chat`, `takeActions` |
| `create_calendar_event` | `chat`, `takeActions` |
| `update_database` | `editEmployees` |
| `api_call` | `chat` |
| `webhook` | `chat`, `takeActions` |

---

## Response Format

### Complete Chat Response

```typescript
{
  // AI-generated response
  reply: string,

  // Workflow detection
  detectedWorkflow: WorkflowId,
  workflowConfidence: number, // 0-100

  // Suggested actions (max 4)
  suggestedActions: BaseAction[],

  // Follow-up questions (max 3)
  followUpQuestions: string[],

  // Workflow state (if stateful)
  workflowState?: {
    currentStep: string,
    progress: number,
    completedSteps: string[],
    isComplete: boolean,
    hasActions: boolean,
    actionCount: number
  },

  // Quota status
  quotaStatus: {
    requestsToday: number,
    requestsRemaining: number,
    quotaLimit: number
  },

  // Cache indicator
  cached: boolean
}
```

---

## Usage Examples

### Example 1: Job Description Creation

**Request:**
```bash
POST /api/chat
{
  "message": "Create a job description for a Senior Software Engineer in our Platform team"
}
```

**Response:**
```json
{
  "reply": "Here's a comprehensive job description for a Senior Software Engineer on the Platform team:\n\n# Senior Software Engineer - Platform\n\n## Role Overview\n...",
  "detectedWorkflow": "hiring",
  "workflowConfidence": 95,
  "suggestedActions": [
    {
      "id": "action_123",
      "type": "create_document",
      "label": "Save to Google Drive",
      "description": "Save this JD to /Hiring/Job Descriptions",
      "priority": "high",
      "requiresApproval": false,
      "payload": { ... }
    },
    {
      "id": "action_124",
      "type": "send_slack_message",
      "label": "Share in #hiring",
      "description": "Post to hiring team channel",
      "priority": "medium",
      "requiresApproval": false,
      "payload": { ... }
    }
  ],
  "followUpQuestions": [
    "Create an interview guide for this position",
    "Draft an offer letter template",
    "Show me current hiring pipeline"
  ]
}
```

### Example 2: Performance Review

**Request:**
```bash
POST /api/chat
{
  "message": "Generate a performance review for Sarah Chen, Senior Engineer",
  "conversationId": "conv_abc123"
}
```

**Response:**
```json
{
  "reply": "Here's Sarah Chen's performance review:\n\n## Performance Review - Sarah Chen\n...",
  "detectedWorkflow": "performance",
  "workflowConfidence": 92,
  "suggestedActions": [
    {
      "id": "action_456",
      "type": "create_document",
      "label": "Save performance review",
      "description": "Save to Google Drive and employee record",
      "priority": "high",
      "requiresApproval": false,
      "payload": {
        "documentType": "performance_review",
        "title": "Performance Review - Sarah Chen",
        "content": "..."
      }
    },
    {
      "id": "action_457",
      "type": "send_email",
      "label": "Email to Sarah",
      "description": "Send review for acknowledgment",
      "priority": "medium",
      "requiresApproval": true,
      "payload": {
        "to": ["sarah.chen@company.com"],
        "subject": "Performance Review - Q4 2024"
      }
    }
  ],
  "workflowState": {
    "currentStep": "review_generated",
    "progress": 66,
    "completedSteps": ["gather_data", "draft_review"],
    "isComplete": false,
    "hasActions": true,
    "actionCount": 2
  }
}
```

### Example 3: Analytics Query

**Request:**
```bash
POST /api/chat
{
  "message": "Show me engineering headcount trends for the last 6 months"
}
```

**Response:**
```json
{
  "reply": "Here's the engineering headcount analysis:\n\n**Current Headcount:** 89 engineers\n...",
  "detectedWorkflow": "analytics",
  "workflowConfidence": 88,
  "suggestedActions": [
    {
      "id": "action_789",
      "type": "api_call",
      "label": "Export to Google Sheets",
      "description": "Create a live Google Sheet with this data",
      "priority": "medium",
      "requiresApproval": false,
      "payload": {
        "url": "/api/analytics/export",
        "method": "POST",
        "body": { "metric": "headcount", "format": "sheets" }
      }
    }
  ],
  "followUpQuestions": [
    "Show me department breakdown",
    "Compare to last quarter",
    "Show attrition rate"
  ]
}
```

---

## Frontend Integration

### Display Action Buttons

```tsx
// components/chat/ActionButtons.tsx
import { BaseAction } from '@/lib/workflows/actions/types'

interface ActionButtonsProps {
  actions: BaseAction[]
  onExecute: (action: BaseAction) => void
}

export function ActionButtons({ actions, onExecute }: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onExecute(action)}
          className={`px-4 py-2 rounded-lg ${
            action.priority === 'high' ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
```

### Display Follow-Up Questions

```tsx
// components/chat/FollowUpQuestions.tsx
interface FollowUpQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

export function FollowUpQuestions({ questions, onSelect }: FollowUpQuestionsProps) {
  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-gray-500">You might also want to:</p>
      <div className="flex flex-col gap-2">
        {questions.map((question, i) => (
          <button
            key={i}
            onClick={() => onSelect(question)}
            className="text-left px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Complete Chat Component

```tsx
import { useState } from 'react'
import { ActionButtons } from './ActionButtons'
import { FollowUpQuestions } from './FollowUpQuestions'

export function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [suggestedActions, setSuggestedActions] = useState([])
  const [followUpQuestions, setFollowUpQuestions] = useState([])

  async function sendMessage(message: string) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    })

    const data = await response.json()

    setMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: data.reply }
    ])

    setSuggestedActions(data.suggestedActions || [])
    setFollowUpQuestions(data.followUpQuestions || [])
  }

  async function executeAction(action: BaseAction) {
    const response = await fetch('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action })
    })

    // Handle result...
  }

  return (
    <div>
      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <ActionButtons
          actions={suggestedActions}
          onExecute={executeAction}
        />
      )}

      {/* Follow-Up Questions */}
      {followUpQuestions.length > 0 && (
        <FollowUpQuestions
          questions={followUpQuestions}
          onSelect={sendMessage}
        />
      )}

      {/* Input */}
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value)
            e.target.value = ''
          }
        }}
      />
    </div>
  )
}
```

---

## Configuration

### Customize Action Suggestions

Add new suggestion rules in `/lib/workflows/actions/suggestions.ts`:

```typescript
{
  workflowId: 'my_custom_workflow',
  triggers: [
    /custom trigger pattern/i
  ],
  generator: (ctx) => {
    return [{
      type: 'create_document',
      label: 'My Custom Action',
      description: 'Does something custom',
      priority: 'high',
      requiresApproval: false,
      payload: {
        // Custom payload
      }
    }]
  }
}
```

### Adjust Suggestion Limits

In `/app/api/chat/route.ts`:

```typescript
// Current: 4 actions, 3 questions
suggestedActions: suggestedActions.slice(0, 4),
followUpQuestions: followUpQuestions.slice(0, 3),

// Adjust as needed
suggestedActions: suggestedActions.slice(0, 6),
followUpQuestions: followUpQuestions.slice(0, 5),
```

---

## Performance Considerations

### Action Suggestion Cost

- **Generation Time:** < 5ms (no AI calls)
- **Memory Impact:** Minimal (small rule set)
- **Cache Compatibility:** Cached responses skip action generation

### Optimization Tips

1. **Limit action count** - Too many actions overwhelm users
2. **Filter by permissions** - Don't show unavailable actions
3. **Prioritize actions** - Show most relevant first
4. **Cache workflow prompts** - Reduce token usage

---

## Testing

### Unit Tests

```typescript
import { suggestActions } from '@/lib/workflows/actions/suggestions'

describe('Action Suggestion System', () => {
  it('should suggest JD save action for hiring workflow', () => {
    const context = {
      workflowId: 'hiring',
      message: 'Create a job description for Senior Engineer',
      aiResponse: '# Senior Engineer\n\n...',
      userId: 'user_123',
      userPermissions: ['chat', 'uploadData']
    }

    const actions = suggestActions(context)

    expect(actions).toHaveLength(2)
    expect(actions[0].type).toBe('create_document')
    expect(actions[0].label).toContain('Google Drive')
  })

  it('should filter actions by permissions', () => {
    const context = {
      workflowId: 'hiring',
      message: 'Send offer letter',
      aiResponse: 'Offer letter content...',
      userId: 'user_123',
      userPermissions: ['chat'] // No 'takeActions'
    }

    const actions = suggestActions(context)

    // Email action should be filtered out
    expect(actions.find(a => a.type === 'send_email')).toBeUndefined()
  })
})
```

---

## Troubleshooting

### Actions not appearing

**Check:**
1. Workflow detected correctly (`detectedWorkflow` in response)
2. User has required permissions
3. Trigger patterns match message content
4. No errors in server logs

### Wrong actions suggested

**Fix:**
1. Review trigger patterns in `suggestions.ts`
2. Adjust workflow detection confidence threshold
3. Add more specific patterns

### Performance issues

**Solutions:**
1. Reduce action suggestion complexity
2. Limit number of rules evaluated
3. Add caching for expensive operations

---

## Future Enhancements

1. **ML-Based Suggestions** - Learn from user behavior
2. **Custom User Rules** - Let users define their own shortcuts
3. **Action Templates** - Pre-configured action sets
4. **Smart Defaults** - Auto-fill action parameters from context
5. **Multi-Step Actions** - Chain related actions together

---

**Questions?** See the [API Reference](./API_REFERENCE_V2.md) or open an issue.
