import { NextRequest, NextResponse } from 'next/server';
import { loadDataFileByType } from '@/lib/analytics/utils';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { CACHE_TTL, responseCache } from '@/lib/analytics/chat/config';
import { validateSQL, generateChartConfig, generateFollowUps, populateAnalysisTemplate } from '@/lib/analytics/chat/utils';
import { executeQuery, hasResults, getQueryMetadata } from '@/lib/analytics/chat/sql-executor';
import { generateSQLAndAnalysis } from '@/lib/analytics/chat/claude-client';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

/**
 * POST /api/analytics/chat
 *
 * Natural language analytics interface powered by Claude
 * Generates SQL queries and visualizations from user questions
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(req, RateLimitPresets.ai);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(req);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to access analytics chat' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { message, sessionId, conversationHistory } = body;

    // Validate request
    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Message is required', code: 'MISSING_MESSAGE' } },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${message}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit for query:', message.substring(0, 50));
      return NextResponse.json({ success: true, data: cached.data });
    }

    // Load employee data
    const employeeData = await loadDataFileByType('employee_master');
    if (!employeeData || employeeData.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No employee data found. Please upload your employee master sheet in the Data Center first.',
          code: 'NO_DATA',
          suggestion: 'Go to Data Center and upload your employee_master.csv file.'
        }
      }, { status: 400 });
    }

    // Generate SQL query and analysis template using Claude
    const startTime = Date.now();
    let sqlResult;

    try {
      sqlResult = await generateSQLAndAnalysis(
        message,
        ['employees'],
        conversationHistory
      );
    } catch (error: any) {
      if (error.message === 'NO_SQL_GENERATED') {
        return NextResponse.json({
          success: false,
          error: {
            message: 'I couldn\'t determine how to query your data for that question. Could you be more specific?',
            code: 'NO_SQL_GENERATED',
            suggestion: 'Try rephrasing your question with more details about what you want to analyze.'
          }
        }, { status: 400 });
      }
      throw error;
    }

    const { sql, intent, explanation, analysis_template } = sqlResult;

    // Validate SQL for security
    const validation = validateSQL(sql);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          message: `SQL validation failed: ${validation.error}`,
          code: 'INVALID_SQL',
          suggestion: 'Please try rephrasing your question.'
        }
      }, { status: 400 });
    }

    console.log('Generated SQL:', sql);
    console.log('Intent:', intent);

    // Execute the query
    const rows = await executeQuery(sql, message, employeeData);

    // Handle empty results
    if (!hasResults(rows)) {
      return NextResponse.json({
        success: true,
        data: {
          content: `I ran your query but found no results. This could mean:\n- The data doesn't exist for this query\n- The filters are too restrictive\n- The date range is outside available data\n\nTry broadening your question or adjusting the timeframe.`,
          chartConfig: null,
          suggestedFollowUps: [
            'Show me all available data',
            'What data do we have?',
            'Try a different timeframe'
          ],
          metadata: {
            queryIntent: intent,
            sqlGenerated: sql,
            rowsReturned: 0,
            executionTime: Date.now() - startTime
          }
        }
      });
    }

    // Generate visualization
    const chartConfig = generateChartConfig(intent, rows);

    // Populate analysis template with actual data
    const aiExplanation = populateAnalysisTemplate(analysis_template, rows);

    // Generate follow-up suggestions
    const suggestedFollowUps = generateFollowUps(intent, message);

    // Build response
    const responseData = {
      content: aiExplanation,
      chartConfig,
      suggestedFollowUps,
      metadata: {
        queryIntent: intent,
        sqlGenerated: sql,
        ...getQueryMetadata(rows, startTime)
      }
    };

    // Cache the response
    responseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/chat',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: {}
    });
  }
}
