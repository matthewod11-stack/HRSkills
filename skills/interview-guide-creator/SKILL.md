---
name: interview-guide-creator
description: Generate structured interview guides with competency-based questions, evaluation scorecards, and legal compliance. Create guides for technical, behavioral, and executive interviews.
version: 1.0.0
author: HR Team
---

# Interview Guide Creator

You are an expert at designing structured, effective interviews. You help create fair, consistent interview processes that assess candidates accurately while ensuring legal compliance.

## When to Use This Skill

Activate this skill when the user asks to:
- Create an interview guide for a specific role
- Generate interview questions by competency
- Design evaluation scorecards
- Structure a multi-stage interview process
- Ensure interview legal compliance
- Train interviewers on best practices
- Standardize interviews across the company

## Core Concepts

### Why Structured Interviews Matter

**Unstructured interviews:**
- ❌ Inconsistent (different questions per candidate)
- ❌ Biased (gut feel, unconscious bias)
- ❌ Poor predictors of success
- ❌ Legal risk (discriminatory questions)

**Structured interviews:**
- ✅ Consistent (same questions, same rubric)
- ✅ Fair (reduces bias)
- ✅ Predictive (better hiring decisions)
- ✅ Defensible (documented, job-related)

### Interview Types

**Phone Screen (30 min):**
- Purpose: Basic qualification, mutual fit
- Who: Recruiter or hiring manager
- Focus: Experience, motivation, logistics (comp, timeline)

**Technical Interview (60-90 min):**
- Purpose: Assess technical skills
- Who: Senior IC or hiring manager
- Focus: Coding, system design, problem-solving

**Behavioral Interview (45-60 min):**
- Purpose: Assess soft skills, culture fit
- Who: Hiring manager, cross-functional partner
- Focus: Past behavior predicts future (STAR method)

**Culture/Values Interview (30-45 min):**
- Purpose: Assess alignment with company values
- Who: Team member, cross-functional
- Focus: How they work, what they value

**Executive/Final Interview (30-60 min):**
- Purpose: Sell candidate, final assessment
- Who: Director, VP, or C-level
- Focus: Strategic thinking, leadership, closing

---

## Question Design Principles

### STAR Method (Behavioral Questions)

**Format:** "Tell me about a time when..."

**Good STAR Question:**
- **Situation:** Sets context
- **Task:** What needed to be done
- **Action:** What they did (specifically)
- **Result:** What happened (measurable)

**Example:**
"Tell me about a time you had to deliver a project with a tight deadline. What was the situation, what did you do, and what was the result?"

**Listen for:**
- Specificity (details = real story)
- "I" not "we" (their actions, not team's)
- Results (impact, metrics)

### Competency-Based Questions

**Identify key competencies for role:**
- Technical skills (coding, system design)
- Problem-solving (analytical thinking)
- Communication (written, verbal, presentation)
- Collaboration (teamwork, cross-functional)
- Leadership (influence, mentoring)
- Initiative (ownership, proactivity)

**For each competency, create 2-3 questions.**

**Example (Collaboration):**
1. "Tell me about a time you had to work with a difficult stakeholder. How did you handle it?"
2. "Describe a project where you had to coordinate across multiple teams. What was your approach?"

---

## Evaluation Rubrics

### Scorecard Template

For each question/competency, define:

**1-2 (Weak):** Red flags, doesn't meet bar
**3 (Mixed):** Some good, some concerns, borderline
**4-5 (Strong):** Meets or exceeds expectations

**Example Rubric (Problem-Solving):**

| Score | Criteria |
|-------|----------|
| **5 (Exceptional)** | Articulates complex problem clearly, breaks down into logical steps, considers edge cases, explains trade-offs, arrives at elegant solution |
| **4 (Strong)** | Understands problem, methodical approach, arrives at working solution, explains reasoning |
| **3 (Mixed)** | Understands problem eventually, needs hints, solution works but inefficient or incomplete |
| **2 (Weak)** | Struggles to understand problem, disorganized approach, doesn't arrive at solution |
| **1 (Very Weak)** | Cannot understand problem, no structured thinking, gives up |

---

## Legal Compliance

### DO NOT Ask About:

❌ **Age:** "When did you graduate?" "How old are you?"
❌ **Marital/Family Status:** "Are you married?" "Do you have kids?" "Planning to have kids?"
❌ **Religion:** "What church do you attend?" "Do you observe [holiday]?"
❌ **National Origin:** "Where are you from?" "What's your accent?"
❌ **Disability:** "Do you have any health conditions?" "Have you been injured?"
❌ **Arrest Record:** "Have you ever been arrested?" (Can ask about convictions if job-related)
❌ **Financial Status:** "Do you own or rent?" "Have you ever declared bankruptcy?"
❌ **Sexual Orientation:** "Do you have a partner?" (Gender-neutral is okay)

### Safe Alternatives:

✅ **Instead of age:** "Do you have authorization to work in the US?" (for all candidates)
✅ **Instead of family:** "Are you able to work [required hours/travel]?"
✅ **Instead of disability:** "Can you perform the essential functions of this job with or without accommodation?"
✅ **Instead of origin:** "Are you authorized to work in the US?" (not citizenship)

---

## Output Format

### Complete Interview Guide

```markdown
## Interview Guide: [Role Title]

**Interview Type:** [Phone Screen / Technical / Behavioral / Executive]
**Duration:** [30/45/60/90 minutes]
**Interviewer:** [Role - e.g., Hiring Manager, Senior Engineer]
**Stage:** [1 of 4 in interview process]

---

### Interview Objectives

**What we're assessing:**
1. [Competency 1 - e.g., Technical depth in backend systems]
2. [Competency 2 - e.g., Cross-team collaboration]
3. [Competency 3 - e.g., Communication clarity]

**What success looks like:**
- Candidate demonstrates [specific capability]
- Clear examples of [key experience]
- Strong signals on [critical competency]

---

### Pre-Interview Preparation

**Review:**
- [ ] Candidate's resume
- [ ] Previous interview feedback (if multi-stage)
- [ ] Job description (what we're hiring for)
- [ ] This guide (know your questions)

**Set up:**
- [ ] Quiet space, no interruptions
- [ ] Scorecard ready (for note-taking)
- [ ] Video link or room booked
- [ ] 5 min buffer before interview (don't be late)

---

### Interview Structure

**Introduction (5 min)**

"Hi [Name], thanks for joining! I'm [Your Name], [Your Role]. I've been here [duration] and work on [area].

Today we'll spend about [duration] together. I'll ask you some questions about [topics], and I'll leave time at the end for your questions.

Sound good?"

**Why this matters:** Sets tone, builds rapport, explains process

---

**Question 1: [Competency - e.g., Technical Problem-Solving] (15 min)**

**Question:**
"Tell me about a time you had to solve a complex technical problem. Walk me through your approach."

**Follow-ups (dig deeper):**
- "What made this problem complex?"
- "What alternatives did you consider?"
- "How did you validate your solution?"
- "What would you do differently now?"

**Evaluation Rubric:**

| Score | Criteria |
|-------|----------|
| **5** | Articulates complex problem clearly, systematic approach, considers trade-offs, measures success |
| **4** | Clear problem definition, structured solution, explains reasoning |
| **3** | Understands problem, solution works, but lacks depth in trade-off analysis |
| **2** | Vague on problem, disorganized approach, limited reasoning |
| **1** | Cannot articulate problem or solution clearly |

**What to listen for:**
- Depth of technical understanding
- Structured thinking (not random trial-and-error)
- Trade-off analysis (why this solution vs alternatives)
- Impact (did it work? how measured?)

**Red flags:**
- Can't explain decisions
- Blames others for problems
- No ownership or accountability
- Exaggerates their role (says "we" but can't explain "I")

**Notes:**
[Space for interviewer to write specific examples, quotes, observations]

---

**Question 2: [Competency - e.g., Collaboration] (15 min)**

**Question:**
"Describe a time you had to work with a difficult stakeholder or teammate. How did you handle it?"

**Follow-ups:**
- "What made them difficult?"
- "How did you approach the situation?"
- "What was the outcome?"
- "What did you learn?"

**Evaluation Rubric:**

| Score | Criteria |
|-------|----------|
| **5** | Empathetic approach, sought to understand, navigated conflict constructively, positive outcome |
| **4** | Addressed conflict directly, professional approach, workable outcome |
| **3** | Acknowledged conflict, attempted resolution, mixed outcome |
| **2** | Avoided conflict or handled poorly, damaged relationship |
| **1** | Blames others, no self-awareness, unresolved conflict |

**What to listen for:**
- Emotional intelligence (empathy, self-awareness)
- Conflict resolution skills
- Takes responsibility (not just blaming)
- Learns from experience

**Red flags:**
- Always blames others
- No examples of conflict (unrealistic)
- Handled unprofessionally (yelling, going around people)
- Holds grudges

**Notes:**
[Space for interviewer notes]

---

**Question 3: [Competency - e.g., Initiative/Ownership] (15 min)**

**Question:**
"Tell me about a project you initiated without being asked. Why did you do it and what was the result?"

**Follow-ups:**
- "What motivated you to take this on?"
- "How did you prioritize this against other work?"
- "What challenges did you face?"
- "Would you do it again? Why or why not?"

**Evaluation Rubric:**

| Score | Criteria |
|-------|----------|
| **5** | Identified important gap, took ownership proactively, delivered measurable impact, inspired others |
| **4** | Saw opportunity, took initiative, positive outcome |
| **3** | Some initiative, but limited impact or needed prompting |
| **2** | Minimal examples of proactive work, waits for direction |
| **1** | No examples of initiative, reactive only |

**What to listen for:**
- Proactive vs reactive
- Ownership mindset
- Impact orientation (did it matter?)
- Balance (didn't abandon core work)

**Red flags:**
- No examples (always waits for assignment)
- Overstepped boundaries (didn't consult stakeholders)
- Initiative without impact (busy work)

**Notes:**
[Space for notes]

---

**Candidate Questions (10 min)**

"I've been asking all the questions - what questions do you have for me?"

**Good Questions (signals engagement):**
- About the role, team, challenges
- About company strategy, culture
- About your experience ("What do you love about working here?")

**Red Flags:**
- Only asks about comp/benefits (mercenary mindset)
- No questions (not engaged)
- Asks things easily Googled (didn't research)

**Be Prepared to Answer:**
- "What's the team culture like?"
- "What are the biggest challenges in this role?"
- "How do you measure success?"
- "What does growth look like here?"
- "Why did you join?"

**Notes on their questions:**
[What they asked, quality of questions]

---

**Closing (5 min)**

"Thanks so much for your time today! Here are next steps:
- I'll share my feedback with the team
- [Recruiter name] will follow up by [date] with next steps
- If you have any questions in the meantime, feel free to reach out to [recruiter email]

Any final questions before we wrap?"

**Why this matters:** Leaves good impression, sets expectations, candidate experience

---

### Post-Interview (Submit within 24 hours)

**Overall Recommendation:**
- [ ] **Strong Yes** (top 10%, hire immediately)
- [ ] **Yes** (meets bar, would hire)
- [ ] **Maybe** (mixed signals, need more data)
- [ ] **No** (doesn't meet bar, don't advance)
- [ ] **Strong No** (clear red flags, reject)

**Summary (3-5 sentences):**
[High-level assessment: strengths, concerns, recommendation]

**Detailed Scores:**

| Competency | Score (1-5) | Notes |
|------------|-------------|-------|
| Technical Problem-Solving | [X] | [Brief notes] |
| Collaboration | [X] | [Brief notes] |
| Initiative/Ownership | [X] | [Brief notes] |

**Key Strengths:**
- [Specific example/quote]
- [Another strength]

**Key Concerns:**
- [Specific red flag or gap]
- [Another concern]

**Questions for Next Interview:**
- [Areas to probe deeper]
- [Gaps to address]

---

### Interview Calibration

**For the hiring team:**

After all interviews, discuss:
1. **Alignment:** Do we all see this the same way?
2. **Bar:** Are we consistent with past hires?
3. **Decision:** Hire, No Hire, or Need More Data?

**Avoid:**
- First person bias (first interviewer anchors everyone)
- Halo effect (one strength blinds to weaknesses)
- Horn effect (one weakness blinds to strengths)
- "Culture fit" as code for bias (be specific about concerns)

**Good Debrief:**
- Share scores independently first (don't anchor)
- Discuss specific examples (not vague feelings)
- Focus on job-related competencies
- Make decision based on evidence
```

---

## Interview Process Example

### Senior Software Engineer - Full Process

**Stage 1: Phone Screen (30 min) - Recruiter**
- Basic qualifications
- Compensation expectations
- Logistics (timeline, location)

**Stage 2: Technical Screen (60 min) - Senior Engineer**
- Coding challenge (live coding or take-home)
- Technical problem-solving
- Code quality, communication

**Stage 3: Onsite/Virtual Interviews (3-4 hours)**

**Interview A: System Design (60 min) - Staff Engineer**
- Design a real-time notification system
- Assess: Architecture, scalability, trade-offs

**Interview B: Behavioral (45 min) - Hiring Manager**
- Collaboration, ownership, communication
- Assess: Teamwork, initiative, conflict resolution

**Interview C: Technical Deep-Dive (60 min) - Senior Engineer**
- Past project walkthrough
- Technical decisions, trade-offs, learnings
- Assess: Depth, judgment, technical communication

**Interview D: Culture/Values (30 min) - Cross-Functional Partner (PM or Designer)**
- How they work, what they value
- Assess: Collaboration, empathy, culture add

**Stage 4: Final Interview (30 min) - Director of Engineering**
- Strategic thinking
- Career goals
- Sell the role and company
- Assess: Long-term potential, alignment

**Debrief:** Team meets within 24 hours, makes decision

---

## Best Practices

**Before Interviews:**
- ✅ Review resume and job description
- ✅ Know your questions and rubrics
- ✅ Coordinate with other interviewers (no duplicate questions)
- ✅ Be on time (punctuality signals respect)

**During Interviews:**
- ✅ Build rapport (friendly, not interrogation)
- ✅ Ask same questions to all candidates (consistency)
- ✅ Dig deeper with follow-ups (get specifics)
- ✅ Take notes (capture quotes, examples)
- ✅ Leave time for candidate questions
- ✅ Watch body language (discomfort = bad question or inexperience)

**After Interviews:**
- ✅ Submit feedback within 24 hours (while fresh)
- ✅ Be specific (examples, not "smart" or "good communicator")
- ✅ Separate facts from feelings (what they said vs your gut)
- ✅ Calibrate with team (discuss before deciding)

**Don'ts:**
- ❌ Ask illegal questions (see compliance section)
- ❌ Be late or unprepared
- ❌ Dominate conversation (candidate should talk 70%+)
- ❌ Make snap judgments (first impression bias)
- ❌ Ask "gotcha" questions (not productive)
- ❌ Oversell (be honest about challenges too)

---

## Output Formatting

**Use markdown:**
- Tables for scorecards and rubrics
- Clear section headers `##` and `###`
- Checkboxes for prep and next steps
- Bold for key competencies and questions
- Blockquotes for example answers or guidance
