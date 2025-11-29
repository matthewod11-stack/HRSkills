/**
 * eNPS Sentiment Analysis Service
 *
 * Uses aiRouter (Anthropic Claude via multi-provider failover) to classify
 * employee survey comments as positive, neutral, or negative with confidence scores.
 *
 * Features:
 * - AI-powered sentiment classification via aiRouter
 * - Batch processing with progress tracking
 * - Automatic fallback to keyword-based classification
 * - Results stored in employeeMetrics.sentiment fields
 */

import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { employeeMetrics } from '@/db/schema';
import { aiRouter } from '@/lib/ai/router';
import { db } from '@/lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
  sentiment: SentimentType;
  confidence: number; // 0-1
  reasoning?: string;
}

export interface SentimentAnalysisProgress {
  total: number;
  processed: number;
  failed: number;
  successRate: number;
}

export interface CommentWithSentiment {
  employeeId: string;
  comment: string;
  score: number;
  quarter: string;
  sentiment: SentimentType | null;
  confidence: number | null;
}

// ============================================================================
// KEYWORD-BASED FALLBACK
// ============================================================================

const POSITIVE_KEYWORDS = [
  'great',
  'excellent',
  'amazing',
  'love',
  'best',
  'awesome',
  'fantastic',
  'wonderful',
  'happy',
  'proud',
  'appreciate',
  'supportive',
  'collaborative',
  'innovative',
  'growth',
  'opportunity',
  'team',
  'culture',
  'balance',
  'flexible',
];

const NEGATIVE_KEYWORDS = [
  'bad',
  'terrible',
  'poor',
  'worst',
  'hate',
  'awful',
  'disappointed',
  'frustrat',
  'concern',
  'problem',
  'issue',
  'lack',
  'insufficient',
  'unclear',
  'confus',
  'micromanag',
  'toxic',
  'burnout',
  'overwork',
  'underpaid',
];

/**
 * Fallback keyword-based sentiment classification
 */
function classifyWithKeywords(comment: string): SentimentResult {
  const lowerComment = comment.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  POSITIVE_KEYWORDS.forEach((keyword) => {
    if (lowerComment.includes(keyword)) positiveCount++;
  });

  NEGATIVE_KEYWORDS.forEach((keyword) => {
    if (lowerComment.includes(keyword)) negativeCount++;
  });

  // Determine sentiment
  if (positiveCount > negativeCount) {
    return {
      sentiment: 'positive',
      confidence: 0.7, // Lower confidence for keyword-based
      reasoning: 'Keyword-based classification (fallback)',
    };
  } else if (negativeCount > positiveCount) {
    return {
      sentiment: 'negative',
      confidence: 0.7,
      reasoning: 'Keyword-based classification (fallback)',
    };
  } else {
    return {
      sentiment: 'neutral',
      confidence: 0.6,
      reasoning: 'Keyword-based classification (fallback)',
    };
  }
}

// ============================================================================
// AI-POWERED SENTIMENT ANALYSIS
// ============================================================================

/**
 * Classify a single comment using aiRouter (Anthropic Claude)
 */
export async function classifyComment(comment: string): Promise<SentimentResult> {
  if (!comment || comment.trim().length === 0) {
    return {
      sentiment: 'neutral',
      confidence: 1.0,
      reasoning: 'Empty comment',
    };
  }

  try {
    // Use aiRouter's analyze method for sentiment analysis
    const result = await aiRouter.analyze({
      type: 'sentiment',
      text: comment,
    });

    // Parse the result
    // aiRouter.analyze returns: { result: { sentiment: string, confidence?: number }, ... }
    let sentiment: SentimentType = 'neutral';
    let confidence = 0.8;

    if (result.result?.sentiment) {
      const sentimentLower = result.result.sentiment.toLowerCase();
      if (sentimentLower.includes('positive')) sentiment = 'positive';
      else if (sentimentLower.includes('negative')) sentiment = 'negative';
      else sentiment = 'neutral';
    }

    if (result.result?.confidence !== undefined) {
      confidence = result.result.confidence;
    }

    return {
      sentiment,
      confidence,
      reasoning: 'AI-powered sentiment analysis via Anthropic Claude',
    };
  } catch (error) {
    console.warn('AI sentiment analysis failed, falling back to keywords:', error);
    return classifyWithKeywords(comment);
  }
}

/**
 * Batch classify comments with progress tracking
 */
export async function batchClassifyComments(
  comments: Array<{ employeeId: string; metricDate: string; comment: string }>,
  onProgress?: (progress: SentimentAnalysisProgress) => void
): Promise<SentimentAnalysisProgress> {
  const total = comments.length;
  let processed = 0;
  let failed = 0;

  for (const { employeeId, metricDate, comment } of comments) {
    try {
      const result = await classifyComment(comment);

      // Update database with sentiment
      await db
        .update(employeeMetrics)
        .set({
          sentiment: result.sentiment,
          sentimentConfidence: result.confidence,
          sentimentAnalyzedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(employeeMetrics.employeeId, employeeId),
            eq(employeeMetrics.metricDate, metricDate)
          )
        );

      processed++;

      // Report progress
      if (onProgress) {
        onProgress({
          total,
          processed,
          failed,
          successRate: processed / total,
        });
      }

      // Rate limiting: 100ms delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to classify comment for ${employeeId}:`, error);
      failed++;
      processed++; // Still count as processed even if failed
    }
  }

  return {
    total,
    processed,
    failed,
    successRate: (processed - failed) / total,
  };
}

/**
 * Analyze all unclassified eNPS comments
 */
export async function analyzeUnclassifiedComments(
  onProgress?: (progress: SentimentAnalysisProgress) => void
): Promise<SentimentAnalysisProgress> {
  // Find all eNPS responses with comments but no sentiment analysis
  const unclassified = await db
    .select({
      employeeId: employeeMetrics.employeeId,
      metricDate: employeeMetrics.metricDate,
      comment: employeeMetrics.surveyComment,
    })
    .from(employeeMetrics)
    .where(
      and(
        isNotNull(employeeMetrics.surveyComment),
        sql`${employeeMetrics.surveyComment} != ''`,
        isNull(employeeMetrics.sentiment)
      )
    );

  if (unclassified.length === 0) {
    return {
      total: 0,
      processed: 0,
      failed: 0,
      successRate: 1.0,
    };
  }

  return batchClassifyComments(
    unclassified.map((row) => ({
      employeeId: row.employeeId,
      metricDate: row.metricDate,
      comment: row.comment || '',
    })),
    onProgress
  );
}

/**
 * Re-analyze a specific quarter's comments
 */
export async function analyzeQuarterComments(
  quarter: string,
  onProgress?: (progress: SentimentAnalysisProgress) => void
): Promise<SentimentAnalysisProgress> {
  const quarterComments = await db
    .select({
      employeeId: employeeMetrics.employeeId,
      metricDate: employeeMetrics.metricDate,
      comment: employeeMetrics.surveyComment,
    })
    .from(employeeMetrics)
    .where(
      and(
        eq(employeeMetrics.surveyQuarter, quarter),
        isNotNull(employeeMetrics.surveyComment),
        sql`${employeeMetrics.surveyComment} != ''`
      )
    );

  if (quarterComments.length === 0) {
    return {
      total: 0,
      processed: 0,
      failed: 0,
      successRate: 1.0,
    };
  }

  return batchClassifyComments(
    quarterComments.map((row) => ({
      employeeId: row.employeeId,
      metricDate: row.metricDate,
      comment: row.comment || '',
    })),
    onProgress
  );
}

// ============================================================================
// SENTIMENT QUERIES
// ============================================================================

/**
 * Get top positive comments for a quarter
 */
export async function getTopPositiveComments(
  quarter?: string,
  limit: number = 5
): Promise<CommentWithSentiment[]> {
  const whereConditions = [
    eq(employeeMetrics.sentiment, 'positive'),
    isNotNull(employeeMetrics.surveyComment),
    sql`${employeeMetrics.surveyComment} != ''`,
  ];

  if (quarter) {
    whereConditions.push(eq(employeeMetrics.surveyQuarter, quarter));
  }

  const results = await db
    .select({
      employeeId: employeeMetrics.employeeId,
      comment: employeeMetrics.surveyComment,
      score: employeeMetrics.enpsScore,
      quarter: employeeMetrics.surveyQuarter,
      sentiment: employeeMetrics.sentiment,
      confidence: employeeMetrics.sentimentConfidence,
    })
    .from(employeeMetrics)
    .where(and(...whereConditions))
    .orderBy(
      sql`${employeeMetrics.sentimentConfidence} DESC`,
      sql`${employeeMetrics.enpsScore} DESC`
    )
    .limit(limit);

  return results.map((row) => ({
    employeeId: row.employeeId,
    comment: row.comment || '',
    score: row.score || 0,
    quarter: row.quarter || '',
    sentiment: row.sentiment as SentimentType | null,
    confidence: row.confidence,
  }));
}

/**
 * Get top negative comments for a quarter
 */
export async function getTopNegativeComments(
  quarter?: string,
  limit: number = 5
): Promise<CommentWithSentiment[]> {
  const whereConditions = [
    eq(employeeMetrics.sentiment, 'negative'),
    isNotNull(employeeMetrics.surveyComment),
    sql`${employeeMetrics.surveyComment} != ''`,
  ];

  if (quarter) {
    whereConditions.push(eq(employeeMetrics.surveyQuarter, quarter));
  }

  const results = await db
    .select({
      employeeId: employeeMetrics.employeeId,
      comment: employeeMetrics.surveyComment,
      score: employeeMetrics.enpsScore,
      quarter: employeeMetrics.surveyQuarter,
      sentiment: employeeMetrics.sentiment,
      confidence: employeeMetrics.sentimentConfidence,
    })
    .from(employeeMetrics)
    .where(and(...whereConditions))
    .orderBy(
      sql`${employeeMetrics.sentimentConfidence} DESC`,
      sql`${employeeMetrics.enpsScore} ASC`
    )
    .limit(limit);

  return results.map((row) => ({
    employeeId: row.employeeId,
    comment: row.comment || '',
    score: row.score || 0,
    quarter: row.quarter || '',
    sentiment: row.sentiment as SentimentType | null,
    confidence: row.confidence,
  }));
}

/**
 * Get sentiment distribution for a quarter
 */
export async function getSentimentDistribution(quarter?: string): Promise<{
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
}> {
  const whereConditions = [isNotNull(employeeMetrics.sentiment)];

  if (quarter) {
    whereConditions.push(eq(employeeMetrics.surveyQuarter, quarter));
  }

  const results = await db
    .select({
      sentiment: employeeMetrics.sentiment,
      count: sql<number>`count(*)`,
    })
    .from(employeeMetrics)
    .where(and(...whereConditions))
    .groupBy(employeeMetrics.sentiment);

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  results.forEach((row) => {
    if (row.sentiment === 'positive') positive = row.count;
    else if (row.sentiment === 'neutral') neutral = row.count;
    else if (row.sentiment === 'negative') negative = row.count;
  });

  const total = positive + neutral + negative;

  return {
    positive,
    neutral,
    negative,
    total,
    positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0,
    neutralPercentage: total > 0 ? Math.round((neutral / total) * 100) : 0,
    negativePercentage: total > 0 ? Math.round((negative / total) * 100) : 0,
  };
}
