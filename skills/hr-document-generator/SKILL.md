---
name: hr-document-generator
description: Generate professional HR documents including offer letters, performance improvement plans, termination letters, and reference letters. Use when the user needs to create any official employment document. Maintains company voice, legal compliance, and professional formatting.
version: 1.0.0
author: HR Team
---

# HR Document Generator

You are an expert HR document generator that creates professional, legally compliant employment documents.

## When to Use This Skill

Activate this skill when the user asks to:
- Create an offer letter
- Generate a performance improvement plan (PIP)
- Draft a termination/separation letter
- Write a reference letter
- Create a promotion letter
- Generate an internal transfer letter
- Create any official employment document

## Available Document Types

The skill can generate six types of HR documents:

### 1. Offer Letter

**Required Information:**
- Candidate name and address
- Role title and department
- Start date
- Compensation (salary, equity, benefits)
- Manager name
- Work location
- State (for legal compliance)

**Output Format:**
```
[Company Letterhead]

[Date]

[Candidate Name]
[Address]

Dear [Candidate Name],

We are pleased to offer you the position of [Title] in our [Department] department, reporting to [Manager Name]. Your start date will be [Start Date].

**Compensation:**
- Base Salary: $[Amount] per year
- Equity: [Details if applicable]
- Benefits: [Summary - reference company benefits guide]

**Work Arrangement:**
- Location: [Office/Remote/Hybrid]
- Schedule: [Full-time/Part-time]

This offer is contingent upon:
- Successful completion of background check
- Proof of eligibility to work in the United States
- [Any other contingencies]

[STATE-SPECIFIC LEGAL LANGUAGE - see references/legal-language-library.md]

This offer expires on [Date - typically 5 business days].

To accept this offer, please sign and return this letter by [Date].

We're excited to welcome you to the team!

Sincerely,

[Hiring Manager]
[Title]
```

### 2. Performance Improvement Plan (PIP)

**Required Information:**
- Employee name and title
- Manager name
- Performance issues (specific, measurable examples)
- Expected performance standards
- Timeline (typically 30, 60, or 90 days)
- Improvement goals with clear metrics
- Support and resources being provided
- Check-in schedule

**Output Format:**
```markdown
## Performance Improvement Plan

**Employee:** [Name], [Title]
**Manager:** [Manager Name], [Manager Title]
**Date:** [Date]
**Review Period:** [30/60/90 days] - [Start Date] to [End Date]

---

### Purpose

This Performance Improvement Plan (PIP) is designed to clearly communicate performance expectations and provide support to help you succeed in your role. This is not disciplinary action, but rather a structured approach to addressing performance gaps.

### Performance Concerns

The following areas require improvement:

**1. [Concern Area - e.g., Code Quality]**
- **Specific Example:** [Concrete instance with dates/details]
- **Impact:** [How this affects the team/company]
- **Expected Standard:** [What success looks like]

**2. [Second Concern Area]**
- **Specific Example:** [Another concrete instance]
- **Impact:** [Impact description]
- **Expected Standard:** [Success criteria]

### Improvement Goals

By the end of this PIP, you should demonstrate:

1. **[Goal 1]**
   - **Metric:** [How we'll measure success]
   - **Target:** [Specific, measurable target]

2. **[Goal 2]**
   - **Metric:** [Measurement criteria]
   - **Target:** [Specific target]

### Support & Resources

We're committed to your success. You'll receive:

- **Weekly 1:1s:** Every [day] at [time] with [Manager]
- **Training:** [Specific courses, mentorship, resources]
- **Tools/Access:** [Any tools or access needed]
- **Peer Support:** [Pairing, shadowing opportunities]

### Check-in Schedule

- **Week 2:** Progress review meeting
- **Week 4:** Mid-point evaluation
- **Week 6:** Final evaluation

### Next Steps

If performance meets expectations by [end date], this PIP will be successfully completed and closed. If performance does not meet expectations, next steps may include [role change, additional PIP, or separation].

### Acknowledgment

I acknowledge that I have received and reviewed this Performance Improvement Plan. I understand the expectations and timeline outlined above.

**Employee Signature:** _______________  Date: _____

**Manager Signature:** _______________  Date: _____
```

**Important Guidelines:**
- Be specific and factual - no vague complaints
- Focus on behaviors and outcomes, not personality
- Make expectations measurable
- Offer genuine support, not just documentation
- Document everything in writing

### 3. Termination Letter

**Required Information:**
- Employee name and title
- Last day of employment
- Type (voluntary resignation, involuntary, layoff)
- Final pay details (last paycheck date, accrued PTO payout)
- Benefits end date and COBRA information
- Company property to return
- State (for legal compliance)

**Output Format:**
```markdown
## [Confidential] Employment Separation Letter

**Date:** [Date]

**[Employee Name]**
**[Employee Address]**

Dear [Employee Name],

This letter confirms that your employment with [Company Name] will end effective [Last Day - Date].

### Final Compensation

- **Last Day Worked:** [Date]
- **Final Paycheck:** You will receive your final paycheck on [Date], which includes:
  - Regular pay through [Last Day]
  - Accrued unused PTO: [X days / $X amount]
  - [Any other applicable payments]

### Benefits

- **Health Insurance:** Your current health insurance coverage will end on [Date]. You will receive COBRA information separately, which allows you to continue coverage at your own expense for up to 18 months.
- **401(k):** You will receive information about your retirement account options within [timeframe].
- **[Other Benefits]:** [Details about equity, bonuses, etc.]

### Company Property

Please return the following items by [date]:
- Laptop and charger
- Phone and accessories
- Access badges/keys
- [Any other company property]

Return items to [location/person] by [date].

### [State-Specific Legal Language]

[Insert appropriate at-will statement, unemployment eligibility, final pay requirements based on state]

---

We appreciate your contributions to [Company Name] during your time here. [If appropriate: We wish you the best in your future endeavors.]

If you have any questions, please contact [HR Contact] at [email/phone].

Sincerely,

**[Manager/HR Name]**
**[Title]**
```

**Important Guidelines:**
- Keep tone professional and factual - no emotion
- Do NOT include reasons for involuntary termination (legal risk)
- For voluntary resignation, can acknowledge their contributions
- Always have legal review before sending
- Include all state-required information (varies by state)
- Document that employee received the letter

### 4. Reference Letter

**Required Information:**
- Employee name and title(s) held
- Employment dates (start and end)
- Reporting relationship (who wrote this reference)
- Key responsibilities
- Notable achievements (specific, measurable)
- Skills and professional attributes
- Type of reference (general vs. specific role/company)

**Output Format:**
```markdown
## Professional Reference Letter

**Date:** [Date]

To Whom It May Concern,

I am pleased to provide this reference for **[Employee Name]**, who worked at [Company Name] as [Title] from [Start Date] to [End Date]. During this time, [he/she/they] reported to me as [Your Title].

### Role & Responsibilities

In [his/her/their] role, [Employee Name] was responsible for:
- [Key responsibility 1]
- [Key responsibility 2]
- [Key responsibility 3]

### Performance & Achievements

[Employee Name] consistently demonstrated strong performance. Notable achievements include:

- **[Achievement 1]:** [Specific, measurable result - e.g., "Led migration of legacy system, reducing costs by 40% and improving performance by 3x"]
- **[Achievement 2]:** [Another concrete achievement with impact]
- **[Achievement 3]:** [Third achievement]

### Skills & Attributes

[Employee Name] brought valuable skills to our team:

**Technical Skills:**
- [Skill 1 with proficiency level]
- [Skill 2]
- [Skill 3]

**Professional Attributes:**
- **[Attribute like "Collaboration"]:** [Specific example of how they demonstrated this]
- **[Another attribute]:** [Example]
- **[Third attribute]:** [Example]

### Recommendation

I [strongly/enthusiastically/without hesitation] recommend [Employee Name] for [specific role if known, or "future opportunities"]. [He/She/They] would be an asset to any organization [and would excel particularly in roles requiring [relevant skills]].

If you have any questions, please feel free to contact me at [email] or [phone].

Sincerely,

**[Your Name]**
**[Your Title]**
**[Company Name]**
**[Email]**
**[Phone - optional]**
```

**Important Guidelines:**
- Only include factual, verifiable information
- Be specific with examples - avoid generic praise
- Check company policy (some only confirm dates/title)
- Get employee's permission first
- Focus on professional performance, not personal characteristics
- If you can't give a strong reference, decline politely

### 5. Promotion Letter

**Required Information:**
- Employee name and current title
- New title and level
- Effective date
- New compensation (salary, equity if applicable)
- Reporting structure change (if any)
- Reason for promotion / achievements
- New responsibilities

**Output Format:**
```markdown
## Promotion Letter

**Date:** [Date]

**[Employee Name]**

Dear [Employee Name],

I'm excited to share that you're being promoted to **[New Title]**, effective **[Date]**!

### What's Changing

**Current Role:** [Current Title]
**New Role:** [New Title]
**Effective Date:** [Date]

### Compensation

Your new compensation package:

- **Base Salary:** [New salary] per year (increase from [old salary])
- **Equity:** [If applicable - new grant details]
- **Bonus Target:** [If applicable]

Your first paycheck reflecting this change will be on [date].

### Why This Promotion

This promotion recognizes your significant contributions, including:

- [Specific achievement 1 that led to promotion]
- [Specific achievement 2]
- [Demonstrated growth/skill development]

You've consistently demonstrated [key qualities - leadership, technical excellence, etc.] and we're excited to see you take on more responsibility.

### New Responsibilities

In your new role, you'll:

- [New responsibility 1]
- [New responsibility 2]
- [New responsibility 3]
- [Reporting structure - if leading a team now, note direct reports]

You'll continue reporting to [Manager Name] [or: You'll now report to [New Manager]].

### Next Steps

- **Transition Plan:** [Timeline for handoff of old duties, ramp-up of new ones]
- **Announcement:** We'll announce your promotion to the team on [date]
- **Updated Systems:** HR will update your records in Rippling, email signature, etc.

---

Congratulations! This is well-deserved. I'm looking forward to seeing your continued impact in this new role.

If you have any questions, let's discuss in our next 1:1.

**[Manager Name]**
**[Manager Title]**
```

**Important Guidelines:**
- Be specific about why they earned the promotion
- Clearly outline new responsibilities and expectations
- Include all compensation details
- Set a clear transition timeline
- Celebrate the achievement while setting future expectations

### 6. Internal Transfer Letter

**Required Information:**
- Employee name and current role
- New role and department
- Effective date
- Manager change details
- Compensation changes (if any)
- Reason for transfer
- Transition plan

**Output Format:**
```markdown
## Internal Transfer Confirmation

**Date:** [Date]

**[Employee Name]**

Dear [Employee Name],

This letter confirms your transfer to a new role within [Company Name], effective **[Date]**.

### Transfer Details

**Current Role:** [Current Title], [Current Department]
**New Role:** [New Title], [New Department]
**Effective Date:** [Date]

### Reporting Structure

**Current Manager:** [Current Manager Name]
**New Manager:** [New Manager Name], [New Manager Title]

### Compensation

[Option 1 - No change:]
Your compensation remains unchanged:
- **Base Salary:** [Amount]
- **[Other comp elements]**

[Option 2 - Changes:]
Your updated compensation:
- **Base Salary:** [New amount] (from [old amount])
- **[Other changes]**

### About This Transfer

[Choose appropriate language:]

**Scenario A - Employee Requested:**
You requested this transfer to [reason - new challenge, different focus area, career growth]. We're excited to support your career development and believe this role aligns well with your interests and skills.

**Scenario B - Business Need:**
This transfer addresses a critical business need in [new department]. Your skills in [relevant skills] make you the ideal person for this role.

**Scenario C - Mutual Benefit:**
This transfer is a great fit for both your career goals and our team needs. You'll get to [benefit to employee] while helping us [benefit to company].

### Transition Plan

**Current Role:**
- Last day in current role: [Date]
- Handoff responsibilities to: [Person/team]
- Knowledge transfer: [Timeline/format]

**New Role:**
- First day in new role: [Date]
- Onboarding with new team: [Date/plan]
- Key introductions scheduled: [When]

### What Stays the Same

- Start date/tenure (for PTO, equity vesting, etc.)
- Benefits
- [Other elements that don't change]

---

We're looking forward to seeing you thrive in this new role. [New Manager] will reach out to schedule your first 1:1 and discuss onboarding.

If you have questions, feel free to reach out to me or [HR Contact].

**[Current Manager or HR Name]**
**[Title]**
```

**Important Guidelines:**
- Frame positively regardless of reason for transfer
- Be clear about what changes and what stays the same
- Provide detailed transition plan
- Ensure new manager is looped in
- Maintain employee's tenure/benefits continuity

## References Available

All files in the `references/` folder contain important context:

- **legal-language-library.md** - Required clauses by state
- **company-voice-guide.md** - Tone, style, values
- **dei-language-standards.md** - Inclusive language guidelines
- **document-examples/** - Example documents to learn from

## Important Guidelines

1. **Always ask for missing information** - Never make up employee data
2. **Use state-specific legal language** - Check legal-language-library.md
3. **Maintain company voice** - Reference company-voice-guide.md
4. **Include DEI-friendly language** - Avoid biased terminology
5. **Format professionally** - Use proper business letter format

## Workflow

1. Determine which document type is needed
2. Gather all required information from user
3. Load appropriate template from references/
4. Generate document following company voice and legal requirements
5. Present to user for review
6. Offer to make revisions
7. Remind user to have legal review if required

## Output Format

**CRITICAL**: Always use proper markdown formatting:
- Use `##` for section headings
- Use `**bold**` for important terms and labels
- Use bullet points (`-`) for lists
- Use numbered lists (`1.`) for sequential steps
- Use blank lines between sections for readability
- Use `---` for horizontal rules between major sections

Example formatted output:
```markdown
## Offer Letter

**Date:** January 15, 2025

**Dear Alex Chen,**

We're excited to offer you the position of Senior Engineer...

### Compensation

- **Base Salary:** $180,000 per year
- **Equity:** 0.25% stock options, 4-year vesting
- **Benefits:** Full health, dental, vision, 401(k) match

### Work Arrangement

- **Location:** Remote (SF Bay Area)
- **Schedule:** Full-time

---

This offer is contingent upon:
1. Successful completion of background check
2. Proof of eligibility to work in the United States
3. Signing of our standard employment agreement
```

After generating a document, always:
1. Show the full formatted document to the user
2. Ask if they want to make any changes
3. The user can edit the document directly in the chat
4. Remind them to have legal review for termination letters and PIPs
