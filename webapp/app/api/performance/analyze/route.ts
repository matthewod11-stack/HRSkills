import { NextRequest, NextResponse } from 'next/server';
import { loadDataFileByType } from '@/lib/analytics/utils';
import { PerformanceReview } from '@/lib/types/master-employee';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';
import { createMessage, extractTextContent } from '@/lib/api-helpers/anthropic-client';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

interface ReviewText {
  question: string;
  text: string;
  responseType: 'manager' | 'self' | 'peer';
}

interface AnalyzeRequest {
  employeeId: string;
  employeeName?: string;
  reviewTexts?: ReviewText[];
  managerRating?: number;
}

interface PerformanceAnalysis {
  aiPerformanceScore: number;      // 1-5
  aiPotentialScore: number;        // 1-3
  confidence: number;              // 0-1
  reasoning: string;
  redFlags: string[];
  ratingInflation: number;
  keyStrengths: string[];
  improvementAreas: string[];
  calibrationNeeded: boolean;
}

function buildSystemPrompt(): string {
  return `You are an expert HR performance analyst. Analyze performance review text and provide objective scoring.

# SCORING RUBRIC (1-5 scale)

**5 - Exceptional Performer**
- Consistently exceeds ALL expectations
- Demonstrates leadership, innovation, strategic impact
- Key language: "outstanding", "exceptional", "consistently exceeds", "far beyond expectations"
- Drives significant organizational impact

**4 - Strong Performer**
- Exceeds MOST expectations
- High-quality, reliable work with initiative
- Key language: "exceeds expectations", "strong performer", "takes initiative", "reliable"
- Goes beyond assigned duties

**3 - Meets Expectations**
- Solid, competent performance
- Meets core job requirements consistently
- Key language: "meets expectations", "good", "satisfactory", "solid contributor"
- ⚠️ RED FLAG: "Great culture fit" or "nice person" WITHOUT performance details = likeability bias

**2 - Needs Improvement**
- Falls short of expectations in multiple areas
- Inconsistent performance, requires frequent oversight
- Key language: "needs to improve", "struggles with", "inconsistent", "requires support"
- Multiple improvement areas mentioned

**1 - Unsatisfactory**
- Does not meet basic expectations
- Serious performance issues
- Key language: "unacceptable", "fails to", "serious concerns", "not meeting requirements"
- Performance issues requiring immediate action

# POTENTIAL SCORING (1-3 scale)

**3 - High Potential**
- Clear leadership qualities mentioned
- Growth mindset, learns quickly, adapts well
- Scalable to next level, promotable
- Key language: "leadership potential", "ready for promotion", "takes on more", "strategic thinker"

**2 - Medium Potential**
- Solid contributor in current role
- Some growth capacity, developing skills
- Key language: "room to grow", "developing skills", "growing in role"
- Could expand responsibilities with support

**1 - Low Potential**
- Limited growth indicators
- Maintenance mode in current role
- Key language: focus ONLY on current duties, no mention of growth
- No evidence of initiative or development

# RED FLAGS TO DETECT

Identify these concerning patterns:
- "Needs to improve communication" (repeated mentions) → Communication issues
- "Working on time management" or "misses deadlines" → Deadline problems
- "Can be difficult to work with" or "team friction" → Interpersonal issues
- "Needs more strategic thinking" → Limited to tactical work only
- "Great team player" BUT no actual performance details → Likeability over performance
- Manager rates HIGH (4-5) but review text shows concerns → Rating inflation
- Multiple "needs to improve" statements → Performance concerns
- Frequent mentions of oversight or "requires support" → Independence issues

# RATING INFLATION DETECTION

Compare manager rating (if provided) to your AI score:
- Difference > 2 points = SERIOUS inflation, flag for immediate calibration
- Difference 1-2 points = MODERATE inflation, recommend calibration
- Difference < 1 point = Aligned, no calibration needed

# RESPONSE TYPE WEIGHTING

Weight different review types:
- Manager reviews: PRIMARY signal (80% weight) - most reliable
- Self reviews: Use as supplement but discount optimism bias (10% weight)
- Peer reviews: Valuable for collaboration/teamwork (10% weight)

# OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no code blocks):
{
  "aiPerformanceScore": 3.5,
  "aiPotentialScore": 2,
  "confidence": 0.85,
  "reasoning": "Brief 2-3 sentence explanation of the scores",
  "redFlags": ["Communication issues", "Deadline management"],
  "ratingInflation": 1.5,
  "keyStrengths": ["Technical skills", "Reliability"],
  "improvementAreas": ["Strategic thinking", "Time management"],
  "calibrationNeeded": true
}

IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any explanatory text outside the JSON.`;
}

function createFallbackAnalysis(managerRating?: number): PerformanceAnalysis {
  const score = managerRating ?? 3;
  return {
    aiPerformanceScore: score,
    aiPotentialScore: 2,
    confidence: 0.5,
    reasoning: 'Analysis unavailable - using manager rating as fallback. Unable to perform detailed AI analysis.',
    redFlags: ['AI analysis incomplete'],
    ratingInflation: 0,
    keyStrengths: [],
    improvementAreas: [],
    calibrationNeeded: false
  };
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

  // Check permissions - need analytics or employees read permission
  if (!hasPermission(authResult.user, 'analytics', 'read') && !hasPermission(authResult.user, 'employees', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to analyze performance' },
      { status: 403 }
    );
  }

  try {
    const body: AnalyzeRequest = await request.json();
    const { employeeId, employeeName, reviewTexts, managerRating } = body;

    // Load employee data to get their reviews
    const employeeData = await loadDataFileByType('employee_master');
    const employee = employeeData?.find((emp: any) => emp.employee_id === employeeId);

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        }
      }, { status: 404 });
    }

    // Use reviews from employee record if not provided in request
    let reviewsToAnalyze: ReviewText[] = reviewTexts || [];

    if ((!reviewsToAnalyze || reviewsToAnalyze.length === 0) && employee.performance_reviews) {
      // Convert PerformanceReview[] to ReviewText[]
      reviewsToAnalyze = employee.performance_reviews.map((review: PerformanceReview) => ({
        question: review.question || 'General Assessment',
        text: review.response || '',
        responseType: review.review_type as 'manager' | 'self' | 'peer'
      }));
    }

    if (!reviewsToAnalyze || reviewsToAnalyze.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No review texts available for this employee',
          code: 'MISSING_REVIEWS'
        }
      }, { status: 400 });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt();

    // Build user prompt
    const reviewsText = reviewsToAnalyze
      .map((r, i) => `Review ${i + 1} (${r.responseType}):\nQuestion: ${r.question}\nResponse: ${r.text}`)
      .join('\n\n');

    const finalEmployeeName = employeeName || employee.full_name || `${employee.first_name} ${employee.last_name}` || 'Unknown';
    const userPrompt = `Analyze these performance reviews for ${finalEmployeeName} (ID: ${employeeId}):

${managerRating ? `Manager's Rating: ${managerRating}/5\n` : ''}
${reviewsText}

Provide objective performance and potential scores based on the review content. Return ONLY valid JSON.`;

    console.log('Analyzing performance for:', employeeName);

    // Call Claude with retry logic and circuit breaker
    const response = await createMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3
    });

    // Extract text content
    const content = extractTextContent(response);

    // Parse JSON response
    let analysis: PerformanceAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      analysis = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      console.error('Parse error:', parseError);
      return NextResponse.json({
        success: true,
        analysis: createFallbackAnalysis(managerRating)
      });
    }

    // Calculate rating inflation
    if (managerRating) {
      analysis.ratingInflation = managerRating - analysis.aiPerformanceScore;
      analysis.calibrationNeeded = Math.abs(analysis.ratingInflation) > 1;
    } else {
      analysis.ratingInflation = 0;
      analysis.calibrationNeeded = false;
    }

    // Validate scores are within ranges
    analysis.aiPerformanceScore = Math.max(1, Math.min(5, analysis.aiPerformanceScore));
    analysis.aiPotentialScore = Math.max(1, Math.min(3, analysis.aiPotentialScore));
    analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));

    console.log('Analysis complete:', {
      employee: employeeName,
      performance: analysis.aiPerformanceScore,
      potential: analysis.aiPotentialScore,
      calibrationNeeded: analysis.calibrationNeeded
    });

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/performance/analyze',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: {} // Body not accessible in catch scope
    });
  }
}
