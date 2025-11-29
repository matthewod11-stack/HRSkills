import { type NextRequest, NextResponse } from 'next/server';
import { analyzeWithAI } from '@/lib/ai/router';
import type { AnalysisTask } from '@/lib/ai/types';
import { loadDataFileByType } from '@/lib/analytics/utils';
import { handleApiError } from '@/lib/api-helpers';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

interface SurveyResponse {
  employee_id: string;
  response: string;
  score?: number;
  quarter?: string;
  department?: string;
  survey_type?: string;
}

interface ThemeInsight {
  theme: string;
  count: number;
  avgSentiment: number;
  examples: string[];
  entities: Array<{ name: string; frequency: number }>;
}

/** Sentiment analysis result from AI */
interface SentimentResult {
  sentiment: string;
  score: number;
  reasoning?: string;
}

/** Response with attached sentiment for processing */
interface ResponseWithSentiment {
  text: string;
  sentiment: SentimentResult;
}

/** Department aggregation during processing */
interface DepartmentAggregate {
  count: number;
  totalSentiment: number;
  avgSentiment?: number;
  responses: ResponseWithSentiment[];
  topConcerns?: string[];
}

/** Final department result for API response */
interface DepartmentResult {
  count: number;
  avgSentiment: number;
  topConcerns: string[];
}

/** Employee data row from master file */
interface EmployeeDataRow {
  employee_id: string;
  status?: string;
  termination_reason?: string;
  department?: string;
  termination_date?: string;
  regrettable_loss?: boolean | string;
}

interface SurveyAnalysisResult {
  overall: {
    totalResponses: number;
    avgSentiment: number;
    sentimentDistribution: {
      veryPositive: number;
      positive: number;
      neutral: number;
      negative: number;
      veryNegative: number;
    };
  };
  byDepartment?: Record<
    string,
    {
      count: number;
      avgSentiment: number;
      topConcerns: string[];
    }
  >;
  themes: ThemeInsight[];
  sentiments: Array<{ sentiment: string; score: number; reasoning?: string }>;
  topConcerns: string[];
  topStrengths: string[];
  actionableInsights: string[];
}

/**
 * POST /api/surveys/analyze
 * Analyze survey responses with sentiment analysis and theme extraction
 * Supports: Exit interviews, eNPS surveys, engagement surveys, pulse surveys
 * Requires: Authentication + analytics read permission
 */
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

  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();
    const {
      surveyResponses,
      surveyType: _surveyType = 'general',
      analyzeDepartments = true,
      maxResponses = 500,
    } = body;

    // Validate input
    if (!surveyResponses || !Array.isArray(surveyResponses)) {
      return NextResponse.json(
        { success: false, error: '"surveyResponses" must be an array' },
        { status: 400 }
      );
    }

    if (surveyResponses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No survey responses provided' },
        { status: 400 }
      );
    }

    // Limit to prevent excessive API costs
    const limitedResponses = surveyResponses.slice(0, maxResponses);
    if (surveyResponses.length > maxResponses) {
      console.warn(
        `[Survey Analysis] Truncated ${surveyResponses.length} responses to ${maxResponses}`
      );
    }

    const startTime = Date.now();

    // Extract response texts for batch sentiment analysis
    const responseTexts = limitedResponses.map((r: SurveyResponse) => r.response);

    // Perform batch sentiment analysis using unified AI provider
    console.log(`[Survey Analysis] Analyzing ${responseTexts.length} responses...`);
    const sentimentAnalyses = await Promise.all(
      responseTexts.map(async (text) => {
        const task: AnalysisTask = {
          type: 'sentiment',
          text,
        };
        const result = await analyzeWithAI(task, {
          userId: authResult.user.userId,
          endpoint: '/api/surveys/analyze',
        });
        return result.result;
      })
    );

    // Calculate sentiment distribution and average
    const avgSentiment =
      sentimentAnalyses.reduce((acc, s) => acc + (s.score || 0), 0) / sentimentAnalyses.length;

    const sentimentDistribution = {
      veryPositive: sentimentAnalyses.filter((s) => (s.score || 0) > 0.6).length,
      positive: sentimentAnalyses.filter((s) => (s.score || 0) > 0.2 && (s.score || 0) <= 0.6)
        .length,
      neutral: sentimentAnalyses.filter((s) => (s.score || 0) >= -0.2 && (s.score || 0) <= 0.2)
        .length,
      negative: sentimentAnalyses.filter((s) => (s.score || 0) < -0.2 && (s.score || 0) >= -0.6)
        .length,
      veryNegative: sentimentAnalyses.filter((s) => (s.score || 0) < -0.6).length,
    };

    // Group by department if requested
    let byDepartment: Record<string, DepartmentAggregate> | undefined;
    if (analyzeDepartments) {
      byDepartment = {};

      for (let i = 0; i < limitedResponses.length; i++) {
        const response = limitedResponses[i];
        const sentiment = sentimentAnalyses[i];
        const dept = response.department || 'Unknown';

        if (!byDepartment[dept]) {
          byDepartment[dept] = {
            count: 0,
            totalSentiment: 0,
            responses: [],
          };
        }

        byDepartment[dept].count++;
        byDepartment[dept].totalSentiment += sentiment.score || 0;
        byDepartment[dept].responses.push({
          text: response.response,
          sentiment: sentiment,
        });
      }

      // Calculate averages and extract top concerns per department
      for (const dept in byDepartment) {
        byDepartment[dept].avgSentiment =
          byDepartment[dept].totalSentiment / byDepartment[dept].count;

        // Top concerns = most negative responses
        const topConcerns = byDepartment[dept].responses
          .filter((r: ResponseWithSentiment) => (r.sentiment.score || 0) < -0.3)
          .sort(
            (a: ResponseWithSentiment, b: ResponseWithSentiment) =>
              (a.sentiment.score || 0) - (b.sentiment.score || 0)
          )
          .slice(0, 3)
          .map(
            (r: ResponseWithSentiment) =>
              r.text.substring(0, 100) + (r.text.length > 100 ? '...' : '')
          );

        byDepartment[dept].topConcerns = topConcerns;
      }
    }

    // Extract themes using entity extraction on negative responses
    const negativeResponses = limitedResponses.filter(
      (_r: SurveyResponse, i: number) => (sentimentAnalyses[i].score || 0) < -0.25
    );

    const themes: ThemeInsight[] = [];

    if (negativeResponses.length > 0) {
      // Combine negative responses for theme extraction
      const negativeText = negativeResponses.map((r) => r.response).join('. ');

      try {
        const entityTask: AnalysisTask = {
          type: 'entities',
          text: negativeText,
        };
        const entityResult = await analyzeWithAI(entityTask, {
          userId: authResult.user.userId,
          endpoint: '/api/surveys/analyze',
        });

        const entities = entityResult.result.entities || [];

        // Group common entities as themes
        const entityGroups: Record<string, { count: number; examples: string[] }> = {};

        for (const entity of entities.slice(0, 20)) {
          // Top 20 most salient entities
          const key = (entity.text || entity.name || '').toLowerCase();
          if (!entityGroups[key]) {
            entityGroups[key] = { count: 0, examples: [] };
          }
          entityGroups[key].count++;
        }

        // Convert to theme insights
        for (const [theme, data] of Object.entries(entityGroups)) {
          if (data.count >= 2) {
            // Only themes mentioned 2+ times
            themes.push({
              theme,
              count: data.count,
              avgSentiment,
              examples: negativeResponses.slice(0, 2).map((r) => r.response.substring(0, 100)),
              entities: [{ name: theme, frequency: data.count }],
            });
          }
        }
      } catch (error) {
        console.error('[Survey Analysis] Entity extraction failed:', error);
      }
    }

    // Extract top concerns (most negative responses)
    const topConcerns = sentimentAnalyses
      .map((s, i) => ({ text: limitedResponses[i].response, score: s.score || 0 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((r) => r.text.substring(0, 150) + (r.text.length > 150 ? '...' : ''));

    // Extract top strengths (most positive responses)
    const topStrengths = sentimentAnalyses
      .map((s, i) => ({ text: limitedResponses[i].response, score: s.score || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => r.text.substring(0, 150) + (r.text.length > 150 ? '...' : ''));

    // Generate actionable insights
    const actionableInsights: string[] = [];

    const negativeCount = sentimentAnalyses.filter((s) => (s.score || 0) < -0.2).length;
    if (negativeCount > sentimentAnalyses.length * 0.3) {
      actionableInsights.push(
        '⚠️ High negative sentiment detected (>30% of responses). Immediate attention recommended.'
      );
    }

    if (avgSentiment < -0.3) {
      actionableInsights.push(
        '📉 Overall sentiment is significantly negative. Consider addressing systemic issues.'
      );
    } else if (avgSentiment > 0.5) {
      actionableInsights.push('✅ Overall sentiment is positive. Continue current initiatives.');
    }

    if (themes.length > 0) {
      actionableInsights.push(
        `🎯 Key themes identified: ${themes
          .slice(0, 3)
          .map((t) => t.theme)
          .join(', ')}`
      );
    }

    if (byDepartment) {
      const deptIssues = Object.entries(byDepartment)
        .filter(([_, data]: [string, DepartmentAggregate]) => (data.avgSentiment ?? 0) < -0.3)
        .sort(
          ([_, a]: [string, DepartmentAggregate], [__, b]: [string, DepartmentAggregate]) =>
            (a.avgSentiment ?? 0) - (b.avgSentiment ?? 0)
        );

      if (deptIssues.length > 0) {
        actionableInsights.push(
          `🏢 Departments needing attention: ${deptIssues
            .slice(0, 3)
            .map(([dept]) => dept)
            .join(', ')}`
        );
      }
    }

    const processingTime = Date.now() - startTime;

    // Transform byDepartment to expected output format
    const byDepartmentResult = byDepartment
      ? Object.fromEntries(
          Object.entries(byDepartment).map(([dept, data]) => [
            dept,
            {
              count: data.count,
              avgSentiment: data.avgSentiment ?? 0,
              topConcerns: data.topConcerns ?? [],
            },
          ])
        )
      : undefined;

    const analysis: SurveyAnalysisResult = {
      overall: {
        totalResponses: limitedResponses.length,
        avgSentiment,
        sentimentDistribution,
      },
      byDepartment: byDepartmentResult,
      themes,
      sentiments: sentimentAnalyses,
      topConcerns,
      topStrengths,
      actionableInsights,
    };

    console.log('[Survey Analysis] Complete:', {
      responses: limitedResponses.length,
      avgSentiment: avgSentiment.toFixed(2),
      processingTime: `${processingTime}ms`,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        processingTime,
        responsesAnalyzed: limitedResponses.length,
        responsesTotal: surveyResponses.length,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/surveys/analyze',
      method: 'POST',
      userId: authResult.user.userId,
    });
  }
}

/**
 * GET /api/surveys/analyze/employees
 * Quick endpoint to analyze all terminated employees' exit survey data
 * Requires: Authentication + analytics read permission
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    // Load employee master data
    const employees = await loadDataFileByType('employee_master');

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No employee data found. Please upload employee data first.',
        },
        { status: 404 }
      );
    }

    // Extract terminated employees with termination reasons
    const exitData = employees
      .filter((emp) => emp.status === 'Terminated' && emp.termination_reason)
      .map((emp) => ({
        employee_id: String(emp.employee_id ?? ''),
        response: String(emp.termination_reason ?? ''),
        department: emp.department ? String(emp.department) : undefined,
        termination_date: emp.termination_date ? String(emp.termination_date) : undefined,
        regrettable_loss: emp.regrettable_loss,
      }));

    if (exitData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No exit interview data found. Upload exit survey data or ensure termination_reason field is populated.',
        },
        { status: 404 }
      );
    }

    console.log(`[Survey Analysis] Found ${exitData.length} exit interviews`);

    // Return exit data for analysis
    return NextResponse.json({
      success: true,
      data: {
        count: exitData.length,
        message: 'Use POST /api/surveys/analyze with this data to get sentiment analysis',
        exitInterviews: exitData,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/surveys/analyze/employees',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}
