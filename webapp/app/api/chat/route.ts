import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadSkill, loadSkillWithDriveTemplates, buildSkillSystemPrompt, generateCacheableSkillsCatalog } from '@/lib/skills'
import { readMetadata, loadDataFileByType } from '@/lib/analytics/utils'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { generateEmployeeContext, type Employee } from '@/lib/employee-context'
import { trackMetric } from '@/lib/performance-monitor'
import { handleApiError, createSuccessResponse, validateRequiredFields } from '@/lib/api-helpers'
import { createMessage, extractTextContent } from '@/lib/api-helpers/anthropic-client'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import type { Anthropic } from '@/lib/api-helpers/anthropic-client'

// In-memory response cache (OPTIMIZATION: saves $1,350/month on repeated queries)
interface CachedResponse {
  reply: string
  detectedSkill?: string
  timestamp: number
  dataHash: string
}

const responseCache = new Map<string, CachedResponse>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100 // Limit cache size

// Clean old cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key)
    }
  }
}, 60 * 1000) // Clean every minute

// Dynamic max_tokens estimation based on query type (OPTIMIZATION: saves $100/month)
function estimateMaxTokens(message: string): number {
  const messageLower = message.toLowerCase()

  // Short answers - lists, counts, simple questions
  if (/^(show|list|count|what is|who is|how many)/i.test(message)) {
    return 512
  }

  // Medium answers - analysis, comparisons, explanations
  if (/analyze|compare|explain|recommend|suggest|review/i.test(messageLower)) {
    return 2048
  }

  // Long-form content - writing, drafting, creating documents
  if (/write|draft|create|generate|compose|prepare/i.test(messageLower)) {
    return 4096
  }

  // Default for unknown query types
  return 1024
}

// Skill detection based on user query keywords
function detectSkill(message: string): string {
  const messageLower = message.toLowerCase()

  // Skill keyword mappings
  const skillPatterns = [
    {
      id: 'skills-gap-analyzer',
      keywords: ['skills gap', 'skill assessment', 'development plan', 'promotion readiness', 'ready for promotion', 'skill development', 'gap analysis', 'learning plan', 'career development']
    },
    {
      id: 'job-description-writer',
      keywords: ['job description', 'jd', 'job posting', 'job ad', 'write jd', 'review jd', 'job listing', 'hiring post', 'role description', 'posting']
    },
    {
      id: 'offboarding-exit-builder',
      keywords: ['offboarding', 'offboard', 'exit', 'resignation', 'leaving', 'departure', 'exit interview', 'last day', 'transition plan', 'knowledge transfer', 'termination', 'layoff']
    },
    {
      id: 'onboarding-program-builder',
      keywords: ['onboarding', 'onboard', 'new hire', 'first day', '30-60-90', 'pre-boarding', 'buddy system', 'ramp', 'orientation']
    },
    {
      id: 'hr-document-generator',
      keywords: ['offer letter', 'pip', 'performance improvement', 'termination letter', 'document', 'template', 'write a', 'draft a', 'generate a']
    },
    {
      id: 'interview-guide-creator',
      keywords: ['interview', 'interviewing', 'interview guide', 'interview questions', 'screening', 'hiring process']
    },
    {
      id: 'hr-metrics-analyst',
      keywords: ['metrics', 'kpi', 'analytics', 'dashboard', 'measure', 'track', 'data', 'report', 'attrition', 'turnover rate']
    },
    {
      id: 'performance-insights-analyst',
      keywords: ['performance', 'performance review', 'feedback', 'evaluation', 'rating', 'calibration']
    },
    {
      id: 'comp-band-designer',
      keywords: ['compensation', 'salary', 'pay band', 'comp band', 'equity', 'stock options', 'benefits', 'market rate']
    },
    {
      id: 'career-path-planner',
      keywords: ['career', 'promotion', 'career path', 'career ladder', 'growth', 'advancement', 'ic track', 'manager track']
    },
    {
      id: 'one-on-one-guide',
      keywords: ['1:1', 'one-on-one', '1 on 1', 'check-in', 'skip level', 'coaching']
    },
    {
      id: 'headcount-planner',
      keywords: ['headcount', 'hiring plan', 'workforce planning', 'staffing', 'team size', 'org growth']
    },
    {
      id: 'corporate-communications-strategist',
      keywords: ['rif', 'layoff communication', 'message', 'announcement', 'crisis', 'ceo departure', 'leadership change', 'security breach', 'data leak', 'acquisition announcement', 'return to office', 'rto mandate', 'policy change', 'communicate layoff', 'how should we message', 'press release', 'all-hands', 'company announcement']
    },
    {
      id: 'workforce-reduction-planner',
      keywords: ['workforce reduction', 'layoff planning', 'rif planning', 'headcount reduction', 'reduction in force', 'selection criteria', 'warn act', 'severance calculation', 'severance cost', 'cost reduction', 'cut headcount', 'eliminate roles', 'layoff budget', 'demographic analysis', 'disparate impact', 'legal compliance', 'workforce planning', 'rif timeline', 'how to select', 'who to lay off']
    },
    {
      id: 'employee-relations-case-manager',
      keywords: ['investigation', 'complaint', 'harassment', 'discrimination', 'employee relations', 'witness interview', 'hr case', 'workplace complaint', 'hostile work environment', 'retaliation', 'sexual harassment', 'misconduct', 'policy violation', 'investigate', 'workplace investigation']
    },
    {
      id: 'benefits-leave-coordinator',
      keywords: ['benefits', 'benefits enrollment', 'open enrollment', 'fmla', 'family leave', 'medical leave', 'maternity leave', 'paternity leave', 'parental leave', 'life event', 'new baby', 'marriage', 'divorce', 'return to work', 'fitness for duty', 'ada accommodation', 'reasonable accommodation', 'cobra', 'health insurance', 'health plan', 'add spouse', 'add dependent', 'state leave', 'paid leave', 'ca pfl', 'wa pfml', 'ny pfl', 'leave laws', 'qualifying life event', 'return-to-work', 'phased return', 'leave of absence']
    },
    {
      id: 'pip-builder-monitor',
      keywords: ['pip', 'performance improvement plan', 'performance improvement', 'underperforming', 'performance issues', 'not meeting expectations', 'coaching conversation', 'document performance', 'performance management', 'measurable goals', 'performance goals', 'terminate for performance', 'manage out', 'performance coaching', 'performance plan', 'written warning', 'corrective action']
    },
    {
      id: 'lnd-program-designer',
      keywords: ['training', 'learning and development', 'l&d', 'training program', 'learning path', 'skill development', 'training design', 'instructional design', 'elearning', 'e-learning', 'training curriculum', 'learning management', 'lms', 'training evaluation', 'kirkpatrick', 'training roi', 'leadership development', 'onboarding training', 'technical training', 'sales training', 'compliance training', 'learning objectives', 'training needs assessment', 'addie', 'blended learning', 'virtual training', 'training effectiveness']
    },
    {
      id: 'survey-analyzer-action-planner',
      keywords: ['survey', 'engagement survey', 'pulse survey', 'employee survey', 'survey results', 'survey analysis', 'analyze survey', 'enps', 'employee net promoter', 'survey questions', 'survey design', 'engagement score', 'response rate', 'action plan', 'survey action plan', 'onboarding survey', 'exit survey', '360 feedback', '360 survey', 'survey template', 'survey communication', 'survey report', 'engagement metric', 'favorability', 'likert scale', 'survey segmentation', 'heat map', 'key drivers', 'root cause analysis', 'survey follow-up', 'pulse check']
    },
    {
      id: 'recognition-rewards-manager',
      keywords: ['recognition', 'recognition program', 'employee recognition', 'rewards', 'rewards program', 'peer recognition', 'peer-to-peer recognition', 'shout-out', 'kudos', 'spot bonus', 'service anniversary', 'anniversary gift', 'milestone celebration', 'employee appreciation', 'values award', 'annual awards', 'employee of the month', 'bonusly', 'kazoo', 'achievers', 'recognition platform', 'recognition culture', 'thank you', 'celebrate employee', 'life event', 'new baby', 'wedding gift', 'retirement party', 'promotion celebration', 'award ceremony', 'appreciation program']
    },
    {
      id: 'org-design-consultant',
      keywords: ['org chart', 'org structure', 'organizational structure', 'organization design', 'org design', 'reporting lines', 'span of control', 'reporting structure', 'reorganization', 'reorg', 're-org', 'org restructuring', 'team structure', 'functional organization', 'divisional organization', 'matrix organization', 'business unit', 'reporting hierarchy', 'dotted line', 'solid line reporting', 'team sizing', 'headcount planning', 'organizational hierarchy', 'functional vs divisional', 'scaling organization', 'layers of management', 'manager to employee ratio', 'flat organization', 'merger integration', 'acquisition integration', 'organizational chart']
    },
    {
      id: 'policy-lifecycle-manager',
      keywords: ['policy', 'policies', 'employee handbook', 'handbook', 'code of conduct', 'workplace policy', 'company policy', 'policy update', 'policy review', 'compliance', 'employment law', 'labor law', 'at-will employment', 'pto policy', 'vacation policy', 'sick leave policy', 'remote work policy', 'work from home policy', 'dress code', 'anti-harassment', 'harassment policy', 'discrimination policy', 'eeo policy', 'equal employment', 'fmla', 'ada', 'confidentiality policy', 'social media policy', 'drug-free workplace', 'background check policy', 'expense policy', 'travel policy', 'overtime policy', 'timekeeping', 'bereavement', 'jury duty', 'military leave', 'parental leave', 'paid leave', 'unpaid leave', 'acknowledgment form', 'policy rollout', 'handbook update', 'legal compliance', 'state law', 'california policy', 'new york policy', 'poster requirement', 'wage notice', 'meal break', 'rest break', 'final pay', 'termination policy', 'separation policy', 'resignation policy', 'exit interview', 'workers compensation', 'workplace safety', 'osha', 'whistleblower', 'retaliation', 'reasonable accommodation', 'disability accommodation', 'religious accommodation', 'lactation', 'nursing mothers', 'sexual harassment training', 'anti-harassment training', 'conflict of interest', 'ethics policy', 'data security policy', 'byod policy', 'acceptable use', 'email monitoring', 'progressive discipline', 'corrective action', 'pip policy', 'performance policy', 'attendance policy', 'punctuality', 'tardiness']
    },
    {
      id: 'compensation-review-cycle-manager',
      keywords: ['compensation review', 'comp review', 'merit cycle', 'merit increase', 'annual raise', 'salary review', 'merit budget', 'merit matrix', 'compa-ratio', 'promotion increase', 'equity refresh', 'market adjustment', 'compensation planning', 'pay increase', 'raise budget', 'compensation cycle', 'merit planning', 'compensation calibration', 'promotion budget', 'stock refresh', 'rsu refresh', 'option refresh', 'total compensation review', 'comp cycle', 'merit process', 'performance-based raise', 'compensation adjustment', 'pay review']
    },
    {
      id: 'manager-effectiveness-coach',
      keywords: ['manager training', 'manager effectiveness', 'new manager', 'first-time manager', 'manager bootcamp', 'leadership training', 'manager coaching', 'leadership development', 'how to manage', 'managing people', 'one on one', '1:1 meeting', 'giving feedback', 'difficult conversation', 'conflict resolution', 'manager skills', 'delegation', 'micromanagement', 'team management', 'people management', 'leadership skills', 'manager development', 'coaching conversation', 'performance conversation', 'manager communication', 'team conflict', 'manage team', 'leadership coaching', 'manager best practices', 'skip level', 'team meeting', 'retrospective', 'team dynamics', 'psychological safety']
    },
    {
      id: 'dei-program-designer',
      keywords: ['diversity', 'equity', 'inclusion', 'dei', 'edi', 'belonging', 'diverse hiring', 'diversity recruiting', 'inclusive interviewing', 'pay equity', 'pay gap', 'gender pay gap', 'racial pay gap', 'wage gap', 'pay equity audit', 'erg', 'employee resource group', 'affinity group', 'diversity metrics', 'representation', 'underrepresented', 'underrepresented minority', 'urm', 'women in tech', 'black employees', 'latinx', 'hispanic', 'lgbtq', 'lgbtqia', 'pride', 'neurodiversity', 'disability inclusion', 'accessibility', 'ada compliance', 'unconscious bias', 'implicit bias', 'bias training', 'dei strategy', 'dei program', 'dei metrics', 'dei goals', 'dei okr', 'inclusive culture', 'diverse candidates', 'diverse pipeline', 'structured interviewing', 'blind resume', 'blind review', 'inclusive job description', 'pronouns', 'transgender', 'non-binary', 'gender-neutral', 'microaggression', 'psychological safety', 'belonging survey', 'inclusion survey']
    }
  ]

  // Score each skill based on keyword matches
  let bestMatch = 'general'
  let highestScore = 0

  for (const skill of skillPatterns) {
    let score = 0
    for (const keyword of skill.keywords) {
      if (messageLower.includes(keyword)) {
        // Longer keywords get higher weight (more specific)
        score += keyword.length
      }
    }

    if (score > highestScore) {
      highestScore = score
      bestMatch = skill.id
    }
  }

  return highestScore > 0 ? bestMatch : 'general'
}

// Load HR capabilities documentation
function loadHRCapabilities(): string {
  try {
    const capabilitiesPath = path.join(process.cwd(), '..', 'quick-reference-card.md')
    return fs.readFileSync(capabilitiesPath, 'utf-8')
  } catch (error) {
    console.error('Failed to load HR capabilities:', error)
    return `You are an HR assistant powered by Claude. You help with:
- Creating HR documents (offer letters, PIPs, termination letters)
- Recruiting and interviewing
- Performance management
- HR analytics and reporting
- Employee relations

Be professional, helpful, and ensure all advice is legally sound.`
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'chat', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to access chat' },
      { status: 403 }
    );
  }

  try {
    const startTime = Date.now() // Track request start time
    const { message, skill, history } = await request.json()

    // Generate cache key from message + employee data hash
    const crypto = require('crypto')
    let dataHash = 'no-data'

    try {
      const employeeData = await loadDataFileByType('employee_master')
      if (employeeData && employeeData.length > 0) {
        dataHash = crypto.createHash('sha256')
          .update(JSON.stringify(employeeData.slice(0, 10))) // Hash first 10 employees for speed
          .digest('hex')
          .slice(0, 8)
      }
    } catch (e) {
      // No employee data available
    }

    const cacheKey = `${crypto.createHash('sha256').update(message).digest('hex')}:${dataHash}`

    // Check cache (only for simple queries, not for complex conversations)
    if ((!history || history.length === 0) && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_TTL && cached.dataHash === dataHash) {
        console.log(`Cache hit for query: "${message.substring(0, 50)}..." (age: ${Math.round(age / 1000)}s)`)

        // Track cache hit metric
        trackMetric({
          apiLatency: Date.now() - startTime,
          cacheHit: true,
          tokensUsed: { input: 0, output: 0, cached: 0 },
          endpoint: '/api/chat',
          timestamp: Date.now(),
          userId: authResult.user.userId
        })

        return NextResponse.json({
          reply: cached.reply,
          detectedSkill: cached.detectedSkill,
          cached: true
        })
      } else {
        // Expired or data changed, remove from cache
        responseCache.delete(cacheKey)
      }
    }

    // Auto-detect skill if requested
    let activeSkill = skill
    if (skill === 'auto-detect') {
      activeSkill = detectSkill(message)
      console.log(`Auto-detected skill: ${activeSkill} for message: "${message.substring(0, 50)}..."`)
    }

    // Build system prompt based on context
    let systemPrompt = ''

    // If a skill is selected, load its context
    if (activeSkill && activeSkill !== 'general') {
      // Try to load from Drive first (user-editable templates), fallback to filesystem
      const skillContext = await loadSkillWithDriveTemplates(activeSkill)
      if (skillContext) {
        console.log(`Loaded skill: ${activeSkill}${skillContext.useDriveTemplates ? ' (using Drive templates)' : ''}`)
        systemPrompt = buildSkillSystemPrompt(skillContext)

        // For analytics-related skills, include data availability info
        const analyticsSkills = ['hr-metrics-analyst', 'performance-insights-analyst', 'dei-program-designer']
        if (analyticsSkills.includes(activeSkill)) {
          try {
            const metadata = await readMetadata()

            if (metadata.files && metadata.files.length > 0) {
              systemPrompt += `\n\n---\n\n# Available Data Files\n\n`
              systemPrompt += `The user has uploaded the following data files:\n\n`

              const filesByType: Record<string, number> = {}
              metadata.files.forEach(file => {
                filesByType[file.fileType] = (filesByType[file.fileType] || 0) + 1
              })

              Object.entries(filesByType).forEach(([type, count]) => {
                systemPrompt += `- **${type}**: ${count} file(s) uploaded\n`
              })

              systemPrompt += `\nYou can use the analytics endpoints to access pre-calculated metrics from this data.\n`
            } else {
              systemPrompt += `\n\n---\n\n# Data Status\n\n`
              systemPrompt += `**No data files uploaded yet.**\n\n`
              systemPrompt += `The user needs to upload data files to use analytics features. Direct them to:\n`
              systemPrompt += `1. Click the "Data Sources" button in the top-right corner\n`
              systemPrompt += `2. Upload their employee_master.csv and other relevant files\n\n`
              systemPrompt += `See the DATA_SOURCES_GUIDE.md for file format requirements.\n`
            }
          } catch (error) {
            console.error('Failed to load data metadata:', error)
          }
        }

        // Add CPO persona
        systemPrompt += `\n\n---\n\n# Your Persona\n\n`
        systemPrompt += `You are the Chief People Officer helping with this task. Maintain your direct, operator-focused style while following the skill instructions above.\n\n`
      }
    }

    // If no skill or skill failed to load, use general context
    if (!systemPrompt) {
      const hrCapabilities = loadHRCapabilities()

      systemPrompt = `${hrCapabilities}

---

# Chief People Officer (AI Persona)

You are the Chief People Officer of an early-stage tech startup (think: messy engineering culture, brilliant but chaotic founders, web3 + AI frontier work).

You're not a corporate HR executive — you're a builder and truth-teller. You understand that startups are unpredictable, people are complex, and growth comes from aligned autonomy, not rules.

## Your style:
- Plainspoken, candid, zero-fluff.
- Human-centric but business-minded.
- You listen, then challenge assumptions.
- You don't lecture; you coach and co-design systems that actually fit startup reality.

## Your priorities:
- Design scalable people systems that don't kill creativity.
- Help leadership mature without killing their edge.
- Shape culture through clarity, feedback, and trust — not handbooks.
- Spot and develop real leaders early.
- Handle conflict head-on, with empathy and facts.
- Make sure talent strategy, values, and velocity align.

You can swear lightly if it fits the tone — but never sound performative or "LinkedIn-inspirational."

You're not here to be a babysitter, parent, or therapist. You're here to build an environment where adults do the best work of their lives.

The CEO makes the final call — your role is to surface trade-offs, offer honest perspective, and design experiments to validate what works.

## When responding:
- Speak like an operator, not a consultant.
- Use concrete examples, not vague HR speak.
- Avoid "corporate jargon" — no "synergies," "stakeholders," or "paradigm shifts."
- Think in terms of systems, feedback loops, and incentives.
- Be provocative when needed, but always constructive.

Your goal: Help this startup scale its people, culture, and leadership with the same rigor it applies to product and engineering — without losing its soul.`
    }

    // Load employee data to provide context for questions (optimized)
    try {
      const employeeData = await loadDataFileByType('employee_master')

      if (employeeData && employeeData.length > 0) {
        // Use intelligent context generation to minimize token usage
        const employeeContext = generateEmployeeContext(employeeData as Employee[], message)
        systemPrompt += employeeContext
      }
    } catch (error) {
      console.error('Failed to load employee data for chat context:', error)
    }

    const messages = [
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Use prompt caching to reduce costs by 82%
    // Split system prompt into cacheable static blocks and dynamic employee data
    const cacheableSystemBlocks = []

    // Extract employee data context (dynamic, changes when data updates)
    const employeeDataMatch = systemPrompt.match(/---\n\n# Employee Data Context\n\n[\s\S]*$/)
    const staticPrompt = employeeDataMatch
      ? systemPrompt.substring(0, employeeDataMatch.index)
      : systemPrompt
    const employeeDataContext = employeeDataMatch ? employeeDataMatch[0] : ''

    // Static content blocks with caching enabled
    if (staticPrompt) {
      cacheableSystemBlocks.push({
        type: "text" as const,
        text: staticPrompt,
        cache_control: { type: "ephemeral" as const }
      })
    }

    // Add skills catalog (static, ~15,000 tokens, cacheable)
    // This is the primary optimization from the AI Cost Optimization Report
    const skillsCatalog = generateCacheableSkillsCatalog()
    if (skillsCatalog) {
      cacheableSystemBlocks.push({
        type: "text" as const,
        text: skillsCatalog,
        cache_control: { type: "ephemeral" as const }
      })
    }

    // Dynamic employee data (not cached, changes frequently)
    if (employeeDataContext) {
      cacheableSystemBlocks.push({
        type: "text" as const,
        text: employeeDataContext
      })
    }

    // Use dynamic max_tokens to save costs
    const maxTokens = estimateMaxTokens(message)

    const response = await createMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: cacheableSystemBlocks,
      messages
    })

    const reply = extractTextContent(response)

    // Track performance metrics
    const latency = Date.now() - startTime
    trackMetric({
      apiLatency: latency,
      cacheHit: false,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cached: (response.usage as any).cache_read_input_tokens || 0,
        cacheCreation: (response.usage as any).cache_creation_input_tokens || 0
      },
      endpoint: '/api/chat',
      timestamp: Date.now(),
      userId: authResult.user.userId
    })

    // Store in cache (only for simple queries without history)
    if (!history || history.length === 0) {
      // Limit cache size
      if (responseCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = responseCache.keys().next().value
        if (firstKey) {
          responseCache.delete(firstKey)
        }
      }

      responseCache.set(cacheKey, {
        reply,
        detectedSkill: skill === 'auto-detect' ? activeSkill : undefined,
        timestamp: Date.now(),
        dataHash
      })

      console.log(`Cached response for query: "${message.substring(0, 50)}..." (cache size: ${responseCache.size})`)
    }

    return NextResponse.json({
      reply,
      detectedSkill: skill === 'auto-detect' ? activeSkill : undefined,
      cached: false
    })
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/chat',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: {} // Body parsing may have failed, so we can't safely access it here
    });
  }
}
