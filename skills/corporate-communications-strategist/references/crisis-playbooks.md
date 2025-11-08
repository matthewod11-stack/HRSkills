# Crisis Communication Playbooks

Step-by-step response plans for common crises.

---

## Crisis Response Framework (Universal)

### Phase 1: Assess (Hour 0-1)

**Immediate actions:**
- [ ] Confirm what happened (facts, not rumors)
- [ ] Assess scope and severity
- [ ] Identify who's affected
- [ ] Determine legal exposure
- [ ] Assemble crisis team

**Crisis team:**
- CEO or senior leader
- General Counsel / Legal
- Head of Communications/PR
- Relevant functional leader (CTO for security breach, etc.)
- HR (if employee-related)

**Key questions:**
1. What exactly happened?
2. When did it happen? When did we learn about it?
3. Who's affected? (employees, customers, public)
4. What's our legal liability?
5. Is it ongoing or contained?
6. What's the worst case scenario?

---

### Phase 2: Contain (Hour 1-6)

**Technical containment:**
- [ ] Stop the problem (shut down system, remove access, etc.)
- [ ] Prevent escalation
- [ ] Document everything

**Legal containment:**
- [ ] Legal review of situation
- [ ] Determine disclosure obligations
- [ ] Identify potential lawsuits or regulatory action

**Communication prep:**
- [ ] Draft initial holding statement
- [ ] Identify spokesperson
- [ ] Prepare FAQs
- [ ] Monitor social media / press

**Don't:**
- ❌ Publicly comment before legal review
- ❌ Speculate about causes
- ❌ Blame individuals

---

### Phase 3: Communicate (Hour 6-24)

**Internal first (always):**
- [ ] Brief employees before external communication
- [ ] Provide managers with talking points
- [ ] Set up internal Q&A mechanism

**External (affected parties):**
- [ ] Direct notification to affected customers/users
- [ ] Public statement (if needed)
- [ ] Media response plan

**Statement structure:**
1. Acknowledge what happened (factual)
2. Who's affected
3. What we're doing (immediate response)
4. What's next (investigation, prevention)
5. How to get help/more info

---

### Phase 4: Resolve (Days to Weeks)

**Fix the problem:**
- [ ] Root cause analysis
- [ ] Implement fixes
- [ ] Test and verify

**Rebuild trust:**
- [ ] Regular updates on progress
- [ ] Transparent post-mortem (if appropriate)
- [ ] Demonstrate accountability

**Prevent recurrence:**
- [ ] System improvements
- [ ] Process changes
- [ ] Training

---

## Crisis Playbook: Security Breach / Data Leak

### Immediate (Hour 0-2)

**Assess:**
- What data was accessed?
- How many users affected?
- How did breach occur?
- Is breach ongoing?
- What's legal exposure (GDPR, state laws)?

**Contain:**
- Shut down compromised systems
- Change credentials
- Engage forensic security team
- Preserve evidence
- Legal review

**Legal obligations:**
- GDPR: 72 hours to notify regulators
- State laws: Varies (CA: "without unreasonable delay")
- SEC (if public company): Material event disclosure

---

### Communicate (Hour 6-24)

**To affected users:**
```
Subject: Security Incident - Action Required

Dear [User],

We're writing to inform you of a security incident that may have affected your account.

**What happened:**
On [date], we discovered unauthorized access to [system]. The breach affected
approximately [X] users.

**What data was accessed:**
[Specific data: email, passwords, payment info, etc.]

**What we've done:**
- Immediately shut down the compromised system
- Engaged cybersecurity experts
- Notified law enforcement
- Reset all potentially affected passwords

**What you should do:**
1. Reset your password immediately: [link]
2. Enable two-factor authentication
3. Monitor your accounts for suspicious activity
4. [If payment data: Monitor credit card statements]

**What's next:**
We're conducting a full investigation and will share findings when complete.
We're also implementing [security improvements].

Questions? Contact [security@company.com]

We take this extremely seriously and apologize for this incident.

[Company] Security Team
```

**To employees (before external):**
```
Subject: URGENT: Security Incident

Team,

I need to brief you on a serious security incident.

**What happened:**
[Details for internal team]

**User impact:**
[X] users affected, we're notifying them now

**What we're doing:**
[Response plan]

**Media/customer inquiries:**
- Direct all questions to [spokesperson]
- Do NOT comment on social media
- Do NOT speculate about cause or impact

More updates coming. Questions to #security-incident Slack channel.
```

**Public statement:**
```
[Company] Security Incident Update

On [date], we discovered unauthorized access to our systems affecting
approximately [X] users.

We immediately shut down the compromised system, engaged cybersecurity experts,
and notified law enforcement.

Affected users have been notified directly and provided steps to secure
their accounts.

We're conducting a full investigation and implementing additional security
measures to prevent recurrence.

For more information: [link to FAQ page]
```

---

### Follow-up (Days-Weeks)

- Day 3: Investigation update
- Week 1: Preliminary findings
- Week 2-4: Final report and preventions implemented
- Ongoing: Transparency about improvements

---

## Crisis Playbook: Executive Scandal

**Types:**
- Harassment/discrimination allegations
- Fraud or embezzlement
- Substance abuse
- Inappropriate relationship
- Social media controversy

### Immediate (Hour 0-6)

**Assess:**
- What are the allegations?
- Is there evidence?
- Who's involved?
- Is this a legal matter?
- Media risk?

**Contain:**
- Legal investigation immediately
- Suspend accused (typically with pay during investigation)
- Preserve evidence
- Engage outside counsel (if serious)

**Communication hold:**
- Do NOT comment publicly until investigation complete
- Exception: If already in media, issue holding statement

---

### Communicate (Post-Investigation)

**If allegations substantiated:**

**Internal:**
```
Subject: Leadership Change

Team,

[Name], our [title], is no longer with the company effective immediately.

This follows an investigation into [general category: workplace conduct / policy
violation - don't give details].

We take [values: respect, integrity] seriously, and this decision reflects
our commitment to [maintaining standards / safe workplace / etc.].

[Interim/replacement plan]

We understand this is difficult news. Leadership is available for questions.
```

**External (if high-profile):**
```
[Company] announced today that [Name] is no longer with the company following
an internal investigation into workplace conduct concerns.

[Interim leader] will serve as [interim/permanent title].

[Company] is committed to maintaining a respectful and inclusive workplace.
```

**If allegations unsubstantiated:**
```
[Name] has returned to [his/her/their] role following a thorough investigation
that found [general outcome - no substantiation / no policy violation / etc.].

We take all allegations seriously and conducted a comprehensive review.
```

---

## Crisis Playbook: Product Failure / Major Outage

### Immediate (Minute 0-30)

**Detect and assess:**
- What's broken?
- How many users affected?
- Is data at risk?
- What's the business impact?

**War room:**
- Engineering incident commander
- Product lead
- Customer support
- Communications

---

### Communicate (Minute 30-60)

**Status page update:**
```
[Red] Major Outage

We're experiencing a service outage affecting [feature/all users].

Our team is actively investigating and working on a fix.

Next update in 30 minutes.

Status: Investigating → Identified → Monitoring → Resolved
```

**Customer proactive email (if severe):**
```
Subject: Service Outage - We're On It

We're experiencing a service outage starting at [time].

Impact: [What's not working]
Affected: [Who's affected]
Status: [Working on fix]

Updates: [Link to status page]

We apologize for the disruption and will share more info shortly.
```

**Internal:**
```
Slack #incident channel:

Service outage. Engineering actively working on fix.

Customer Support:
- Route all inquiries to [status page]
- Do NOT promise timeline unless confirmed by engineering
- Escalate VIP customers to [lead]

Sales/CS: Pause outreach until resolved.

Updates every 30 min.
```

---

### Resolution

**Post-mortem (public if major):**
```
[Company] Post-Mortem: [Date] Service Outage

**What happened:**
[Plain language explanation]

**Impact:**
- Duration: [X hours]
- Affected: [X% of users]
- Data loss: [None / specify]

**Root cause:**
[Technical explanation - be transparent]

**Why it happened:**
[Honest assessment of gap - lack of testing, edge case, etc.]

**What we're doing:**
1. [Specific fix]
2. [Process improvement]
3. [Additional safeguard]

**What we're doing for affected customers:**
[Credit, refund, etc.]

We're sorry. We hold ourselves to high standards and fell short.

Questions? [Email]

[CTO/Engineering Leader]
```

---

## Crisis Playbook: Discrimination Lawsuit

### Immediate

**Do:**
- Engage legal counsel immediately
- Preserve all documents and communications
- Do NOT destroy evidence
- Do NOT comment publicly

**Don't:**
- ❌ Publicly discuss details
- ❌ Disparage plaintiff
- ❌ Speculate about outcome
- ❌ Discuss with anyone except legal

---

### Communication (External)

**If in media:**
```
We take all allegations seriously and are reviewing the matter.

We're committed to maintaining a respectful and inclusive workplace.

As this is active litigation, we cannot comment further.
```

**If settled:**
```
We've reached a resolution with [plaintiff]. While we don't admit liability,
we're committed to [diversity/inclusion/respect] and have [implemented changes].
```

---

## Crisis Playbook: Social Media Backlash

**Triggers:**
- Controversial statement from leader
- Tone-deaf marketing
- Policy decision (layoffs, RTO, etc.)
- Product decision users hate

### Assess (Hour 0-2)

**Questions:**
- Is criticism valid?
- How widespread? (dozens vs. thousands)
- Are influencers amplifying?
- Mainstream media picking up?
- What are they asking for?

---

### Response Options

**Option 1: Acknowledge and Correct (if we're wrong)**
```
We hear you, and you're right. [What we did wrong]

We're [specific action to fix].

We're sorry. We can do better.
```

**Option 2: Clarify and Explain (if miscommunication)**
```
We're seeing concerns about [issue]. Let us clarify:

[Clear explanation of actual policy/decision]

[Why we made this decision]

We understand this may not be popular, but [rationale].

We're listening and value your feedback.
```

**Option 3: Stand Firm (if decision is right but unpopular)**
```
We understand not everyone agrees with [decision], but we believe it's the
right choice because [reason].

We're committed to [value/outcome] even when it's difficult.
```

**Option 4: Don't Engage (if trolling or small)**
- If < 50 complaints and no influencer amplification
- If clearly bad-faith attacks
- Monitor but don't respond

---

## General Crisis Communication Rules

### DO:

✅ **Move fast** - Speed beats perfection in crisis
✅ **Tell the truth** - Lies always come out
✅ **Show accountability** - "We messed up" builds trust
✅ **Be specific** - Vague statements fuel speculation
✅ **Update regularly** - Even if "no new info, still working on it"
✅ **Internal first** - Employees before external
✅ **One spokesperson** - Consistent message

### DON'T:

❌ **Minimize** - "This isn't a big deal"
❌ **Blame others** - Vendors, employees, users
❌ **Speculate** - "We think maybe..."
❌ **Hide** - Silence makes it worse
❌ **Delete** - Tweets, posts, evidence
❌ **Rush without legal** - Some things need legal review
❌ **Forget to follow up** - Announce resolution, not just problem

---

## Crisis Severity Levels

### Level 1: Minor
- Small user impact
- No legal/regulatory risk
- No media attention
- Response: Status page update, customer support

### Level 2: Moderate
- Significant user impact
- Potential legal exposure
- Some media attention possible
- Response: Internal + external comms, executive involvement

### Level 3: Major
- Widespread impact
- Serious legal/regulatory risk
- Guaranteed media coverage
- Reputation damage
- Response: Full crisis team, legal counsel, comprehensive comms plan

### Level 4: Existential
- Company-threatening
- Criminal investigation
- Major media firestorm
- Mass customer exodus
- Response: Board involvement, crisis PR firm, potential CEO statement

---

Great crisis communication = truth + speed + accountability + follow-through.
