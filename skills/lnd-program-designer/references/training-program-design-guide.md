# Training Program Design Guide

Complete guide to designing effective training programs using proven instructional design methods.

---

## Overview: Instructional Design Process

**Instructional design = science of creating effective learning experiences**

**Core principle:** Learning is most effective when it's:
- **Relevant** (tied to learner's job/goals)
- **Active** (learners do, not just listen)
- **Feedback-rich** (learners know if they're getting it right)
- **Applied** (practiced in realistic contexts)
- **Retained** (reinforced over time)

---

## ADDIE Framework (Deep Dive)

### Phase 1: Analyze

**Goal:** Understand the problem, audience, and constraints before designing anything.

#### Step 1.1: Define the Business Problem

**Ask:**
- What business outcome are we trying to improve?
- What evidence shows this is a problem?
- What's the cost of not solving this?

**Example:**
```
Problem: Customer churn rate is 30% (industry average: 15%)

Evidence:
- Exit surveys cite "poor customer support" as #1 reason (65% of churned customers)
- Support CSAT score: 68% (target: 85%+)

Cost of not solving:
- Losing 300 customers/month × $5,000 LTV = $1.5M/month in lost revenue
```

**Output:** Clear business case for training

---

#### Step 1.2: Root Cause Analysis (Is it a training problem?)

**5 Whys Technique:**

Example:
```
Problem: Support tickets take 48 hours to resolve (target: 24 hours)

Why? → Support reps don't prioritize urgent tickets
Why? → They don't know how to identify urgent vs. non-urgent
Why? → No training on ticket triage
Why? → We assumed they'd figure it out
Why? → No onboarding program for support role

Root cause: Lack of onboarding training on ticket triage
Solution: Training on prioritization + triage system
```

**Ask: Is this a training problem or something else?**

| Symptom | Root Cause | Solution |
|---------|------------|----------|
| "Reps don't respond to tickets fast enough" | Don't know how (skill gap) | **Training** on response protocols |
| "Reps don't respond to tickets fast enough" | Overwhelmed (too many tickets) | **Hire more reps** |
| "Reps don't respond to tickets fast enough" | Ticket system is clunky | **Fix tools** |
| "Reps don't respond to tickets fast enough" | No incentive to be fast | **Change incentives** |

**Only proceed with training if root cause is knowledge/skill gap.**

---

#### Step 1.3: Audience Analysis

**Who are the learners?**

**Demographics:**
- Role/function
- Level (junior, mid, senior)
- Location (in-office, remote, global)
- Team size

**Current state:**
- What do they already know?
- What skills do they have?
- What's their learning style preference? (reading, videos, hands-on)

**Constraints:**
- How much time do they have?
- What's their availability? (can they take a full day off? or only 30 min at a time?)
- What technology do they have access to? (laptops, mobile, bandwidth)

**Example Audience Profile:**
```
Audience: Customer Support Representatives

Demographics:
- 50 reps, distributed globally (US, Europe, APAC)
- Mix of experience: 20 new hires (<3 months), 30 tenured (1+ year)
- Remote-first

Current state:
- New hires: No prior support experience, learning product knowledge
- Tenured: Know product, but inconsistent on soft skills (empathy, de-escalation)

Constraints:
- Cannot take full day away from tickets (business need)
- Prefer async/self-paced (timezone differences)
- Have laptops, good bandwidth

Training approach:
- Self-paced eLearning (can complete on own time)
- Short modules (15-20 min) to fit between tickets
- Separate tracks for new hires vs. tenured reps
```

---

#### Step 1.4: Learning Objectives

**Format:** "By the end of this training, learners will be able to [action verb] [skill]"

**Use Bloom's Taxonomy action verbs:**

**Level 1-2 (Knowledge/Understanding):** Define, explain, list, describe
- "Define the 5 levels of ticket priority"
- "Explain when to escalate a ticket to engineering"

**Level 3 (Application):** Apply, demonstrate, use, solve
- "Apply the ticket triage framework to categorize 10 sample tickets"
- "Use the CRM to log a customer interaction"

**Level 4 (Analysis):** Analyze, differentiate, compare
- "Analyze a customer complaint and identify root cause vs. symptom"

**Level 5-6 (Evaluate/Create):** Evaluate, design, create
- "Create a personalized response email to a frustrated customer using empathy techniques"

**Good objectives = measurable, action-oriented, realistic**

**Example: Customer Support Training Objectives**
1. "Explain the difference between Priority 1 (critical) and Priority 3 (low) tickets" (Understanding)
2. "Use the ticket triage framework to correctly categorize 10 sample tickets with 90% accuracy" (Application)
3. "Demonstrate active listening and empathy techniques in a role-play customer call" (Application)
4. "Analyze a customer escalation and propose 2 solutions with tradeoffs" (Analysis)

---

### Phase 2: Design

**Goal:** Create the blueprint for your training before building anything.

#### Step 2.1: Content Outline

**Structure training into modules:**

**Example: Customer Support Fundamentals (4-hour program)**

**Module 1: Ticket Triage (45 min)**
- Introduction (5 min)
- Priority levels explained (10 min)
- Triage framework (15 min)
- Practice exercise: Categorize 10 tickets (10 min)
- Quiz (5 min)

**Module 2: Customer Communication (60 min)**
- Why communication matters (CSAT data) (10 min)
- Active listening techniques (15 min)
- Empathy statements (10 min)
- Writing clear responses (10 min)
- Practice: Write response to angry customer email (10 min)
- Quiz (5 min)

**Module 3: Using the CRM (45 min)**
- CRM overview (10 min)
- Logging tickets (10 min)
- Updating status (10 min)
- Practice: Log 3 sample tickets (10 min)
- Quiz (5 min)

**Module 4: Escalation Protocols (30 min)**
- When to escalate (10 min)
- How to escalate (SLAs, who to contact) (10 min)
- Practice: Identify 5 escalation scenarios (5 min)
- Quiz (5 min)

**Final Assessment (30 min)**
- Comprehensive scenario-based quiz (20 min)
- Certification (pass = 80%+)

**Total: 4 hours (240 minutes)**

---

#### Step 2.2: Choose Learning Modality

**Decision tree:**

```
Is training hands-on/physical? (e.g., machine operation, lab work)
├─ YES → In-person workshop
└─ NO → Continue

Do learners need real-time interaction/Q&A?
├─ YES → Virtual instructor-led (VILT) or in-person
└─ NO → Continue

Is content primarily knowledge transfer? (facts, processes, concepts)
├─ YES → Self-paced eLearning
└─ NO → Blended (mix of modalities)

Is this high-value training where behavior change is critical? (leadership, sales)
├─ YES → Blended (eLearning + workshop + coaching)
└─ NO → Self-paced eLearning
```

**For our example (Customer Support Fundamentals):**
- Not hands-on physical → Not in-person required
- Some Q&A helpful but not critical → Could be self-paced
- Primarily knowledge transfer → Self-paced eLearning
- Plus practice/application → Add virtual practice sessions

**Modality choice: Blended**
- Self-paced eLearning (Modules 1-4) + Virtual practice sessions (role-play customer calls)

---

#### Step 2.3: Assessment Strategy

**3 types of assessments:**

**1. Pre-Assessment (Before training)**
- **Purpose:** Gauge baseline knowledge
- **Format:** Quiz, survey, skills test
- **Use:** Tailor training to learner's starting point, measure learning gain

**Example:**
```
Pre-assessment: 10-question quiz on support fundamentals

Results:
- New hires: 30% average score (low baseline)
- Tenured reps: 70% average score (higher baseline)

Action: New hires get full 4-hour program, tenured reps skip Module 3 (CRM) since they already know it
```

---

**2. Formative Assessment (During training)**
- **Purpose:** Check understanding as they learn
- **Format:** Knowledge checks after each module (3-5 questions)
- **Use:** Identify where learners are struggling, provide feedback

**Example:**
```
Module 1 Quiz (5 questions on ticket triage)

Question 1: "A customer reports they can't log in. What priority level is this?"
a) Priority 1 (Critical)
b) Priority 2 (High)
c) Priority 3 (Medium)
d) Priority 4 (Low)

[Correct answer: Priority 2 - High impact but not system-wide]

If learner gets it wrong:
→ Show explanation: "Login issues affect individual customers but aren't critical system failures. Priority 2 ensures it's addressed quickly but doesn't trigger emergency response."
```

---

**3. Summative Assessment (End of training)**
- **Purpose:** Measure if learners achieved learning objectives
- **Format:** Comprehensive quiz, skills demonstration, certification exam
- **Use:** Determine if learner passed, identify knowledge gaps for remediation

**Example:**
```
Final Assessment: Support Fundamentals Certification

Format: 20-question scenario-based quiz + 1 role-play

Passing score: 80% (16/20 questions correct)

Scenarios test:
- Ticket triage (5 questions)
- Customer communication (5 questions)
- CRM usage (5 questions)
- Escalation (5 questions)

Role-play: Handle a simulated angry customer call (manager evaluates using rubric)

If pass → Certificate of completion + added to "Certified Support Rep" list
If fail → Remediation (review missed topics, retake in 1 week)
```

---

### Phase 3: Develop

**Goal:** Build the training materials.

#### Step 3.1: Content Development

**For eLearning:**

**Tools:**
- Articulate 360 (Storyline for interactive courses, Rise for simple courses)
- Adobe Captivate
- Camtasia (screen recordings)

**Best practices:**
- **Short modules:** 10-20 minutes max (attention span)
- **Interactive:** Quizzes, scenarios, drag-and-drop, branching
- **Multimedia:** Mix text, images, video (but not just talking heads)
- **Scenario-based:** Use realistic examples, not abstract concepts

**Bad eLearning:**
- 60-minute talking head video
- Text-heavy slides
- No interactivity (just click "Next" 50 times)

**Good eLearning:**
- 15-minute module with 3 interactive scenarios
- Branching: "What would you do? Choose A, B, or C" → Different outcomes based on choice
- Knowledge checks every 5 minutes

---

**For Instructor-Led Training (Virtual or In-Person):**

**Materials needed:**
1. **Facilitator Guide**
   - Script/talking points
   - Timing (how long each section takes)
   - Materials needed (slides, handouts, props)
   - Answers to exercises

2. **Participant Workbook**
   - Pre-work (if any)
   - Handouts (frameworks, templates, reference guides)
   - Exercises (space to take notes, complete activities)

3. **Slide Deck**
   - Visuals to support facilitator
   - NOT a script (slides should be visual, not text-heavy)
   - Rule of thumb: 1 slide per 2-3 minutes of content

**Best practices:**
- **Interactivity:** Use breakout groups, polls, Q&A, role-plays
- **10-minute rule:** Don't lecture for more than 10 minutes without interaction
- **Practice:** 70% practice, 30% lecture (adults learn by doing)

---

#### Step 3.2: Pilot Testing

**Before full rollout, pilot with small group (10-20 people)**

**Pilot goals:**
- Test content (is it clear? accurate? relevant?)
- Test logistics (tech works? timing right?)
- Get feedback (what worked? what didn't?)

**Pilot process:**
1. **Select pilot group** (representative of full audience)
2. **Deliver training** (observe closely, take notes)
3. **Collect feedback**
   - Post-training survey
   - Debrief with participants
   - Observe facilitator
4. **Revise** based on feedback
5. **Approve for full rollout**

**Common pilot findings:**
- "Module 2 was too long - people tuned out at 45 min mark" → Split into 2 shorter modules
- "Quiz questions were confusing" → Rewrite for clarity
- "Participants wanted more real examples" → Add 2 case studies
- "Tech issue: Videos wouldn't load on mobile" → Compress video files

---

### Phase 4: Implement

**Goal:** Deliver training to full audience.

#### Step 4.1: Logistics Planning

**For eLearning:**
- [ ] Upload to LMS (Learning Management System)
- [ ] Assign to learners (who needs to take it?)
- [ ] Set deadline (when must it be completed by?)
- [ ] Send launch communication (email announcement)
- [ ] Track completion (monitor who's completed, send reminders)

---

**For Instructor-Led (Virtual or In-Person):**
- [ ] Schedule sessions (dates, times, locations/Zoom links)
- [ ] Book facilitators (internal trainer or external vendor)
- [ ] Book venue (if in-person) or set up Zoom room
- [ ] Send invites to participants (calendar invites)
- [ ] Send pre-work (if any - 1 week before)
- [ ] Prepare materials (print workbooks, test A/V equipment)
- [ ] Day-of logistics (check-in, tech support, catering if in-person)

---

#### Step 4.2: Communication Plan

**Training launch communications (5 touch points):**

**1. Save the Date (4 weeks before)**
```
Subject: [New Training] Customer Support Fundamentals - Coming Soon

Team,

We're launching a new training program: Customer Support Fundamentals.

This training will cover:
- Ticket triage and prioritization
- Customer communication best practices
- CRM usage
- Escalation protocols

**When:** Self-paced eLearning launches [date]
**Who:** All customer support reps
**Time commitment:** 4 hours (can complete in segments)

More details coming soon. Questions? Reply to this email.

-[L&D Team]
```

---

**2. Training Launch (Day 1)**
```
Subject: 🎓 Customer Support Fundamentals Training is LIVE - Complete by [Date]

Team,

Customer Support Fundamentals training is now live!

**Your action:**
1. Log in to [LMS link]
2. Complete all 4 modules
3. Pass final assessment (80%+ required)
4. Complete by [deadline]

**What you'll learn:**
- How to triage tickets by priority
- Communication techniques to improve CSAT
- CRM logging and escalation protocols

**Time:** 4 hours total (you can complete in 15-20 min segments)

**Bonus:** Optional virtual practice session [date/time] - role-play customer scenarios with peers

**Questions?** Email [training@company.com] or Slack #support-training

Let's go! 🚀

-[L&D Team]
```

---

**3. Mid-Point Reminder (1 week in)**
```
Subject: ⏰ Reminder: Customer Support Training Due [Date]

Team,

Quick check-in: **50% of you have completed the training - awesome!**

**If you haven't started:** No problem, you have [X days] left. Log in and get started: [Link]

**If you're partway through:** Keep going! You're making progress.

**Stuck or have questions?** Slack #support-training or email [training@company.com]

**Tip:** Break it into chunks - 15 min per day over lunch = done in a week.

You've got this!

-[L&D Team]
```

---

**4. Final Reminder (3 days before deadline)**
```
Subject: 🚨 Last Chance: Training Due in 3 Days

Team,

**Deadline: [Date] at 11:59 PM**

**Completion status:**
✅ 75% completed
⏳ 25% not yet started

**If you haven't completed yet:** Please prioritize this week. It's required.

**What happens if you miss the deadline?**
- Training will close on [date]
- You'll need to complete within 1 week or face [consequence - e.g., escalation to manager]

**Need help?** We're here. Slack #support-training.

Finish strong!

-[L&D Team]
```

---

**5. Completion Confirmation + Next Steps (After deadline)**
```
Subject: ✅ Training Complete - Thank You!

Team,

Congratulations! **90% completion rate** - well done!

**What's next:**
1. You'll receive your certificate via email
2. **Optional:** Join us for virtual practice session [date/time] to role-play customer scenarios
3. Apply what you learned - your manager will check in with you in 30 days

**For the 10% who didn't complete:**
- You have 1 week to finish (new deadline: [date])
- Your manager has been notified

**Feedback wanted:** Please take 2 min to tell us how we can improve this training: [Survey link]

Thank you for investing in your skills!

-[L&D Team]
```

---

### Phase 5: Evaluate

**Goal:** Measure training effectiveness (Kirkpatrick Levels 1-4)

See `training-evaluation-methods.md` for detailed measurement strategies.

**Quick summary:**
- **Level 1 (Reaction):** Post-training survey (did they like it?)
- **Level 2 (Learning):** Pre/post test (did they learn?)
- **Level 3 (Behavior):** Manager observation (are they using it?)
- **Level 4 (Results):** Business metrics (did it move the needle?)

---

## Key Principles

1. **Start with business outcomes, not training activities**
   - Don't start with "We need leadership training"
   - Start with "We need to reduce manager turnover from 25% to 15%"

2. **Is it really a training problem?**
   - Training fixes knowledge/skill gaps
   - It doesn't fix broken processes, poor tools, or motivation issues

3. **Design for the learner, not the content**
   - What do learners need to be able to DO after training?
   - Not: "Cover all product features" → Yes: "Enable reps to demo core value prop to prospects"

4. **Make it active, not passive**
   - Adults learn by doing
   - 70% practice, 30% lecture

5. **Measure what matters**
   - Not just "Did they complete it?"
   - But: "Did behavior change? Did metrics improve?"

6. **Iterate**
   - No training is perfect on v1
   - Use feedback to improve

Great training = business problem solved, skills developed, behavior changed, measurable outcomes. Not just content delivered.

Design programs that matter, that people use, and that move metrics.
