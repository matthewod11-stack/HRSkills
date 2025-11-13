/**
 * Context Detection Service
 *
 * Analyzes chat messages to determine which context panel to display.
 * Supports: Document Editor, Analytics Charts, Performance Grid
 */

import { ContextPanelData } from '@/components/custom/ContextPanel';

export interface DetectionResult {
  panelData: ContextPanelData | null;
  confidence: number;
}

/**
 * Pattern matching for context detection
 */
const contextPatterns = {
  document: [
    /draft|write|create|generate.*(offer letter|employment letter|offer)/i,
    /draft|write|create|generate.*(pip|performance improvement|improvement plan)/i,
    /draft|write|create|generate.*(job description|jd|job posting)/i,
    /draft|write|create|generate.*(policy|handbook|procedure)/i,
    /draft|write|create|generate.*(email|message|communication)/i,
    /draft|write|create|generate.*(review|evaluation|assessment)/i,
    /write|compose|draft.*(document|letter|memo)/i,
  ],
  analytics: [
    /show|display|what.*(headcount|employee count|staff count)/i,
    /show|display|what.*(attrition|turnover|retention)/i,
    /show|display|what.*(diversity|demographics)/i,
    /show|display|what.*(compensation|salary|pay)/i,
    /show|display|what.*(performance|rating)/i,
    /analyze|analysis.*(trend|metric|data)/i,
    /chart|graph|visualization/i,
    /(headcount|attrition|turnover|diversity).*(trend|over time|by month)/i,
    /compare.*(department|team|group)/i,
  ],
  performance: [
    /talent|9-box|nine box|performance grid|talent review/i,
    /flight risk|high performer|at risk|retention risk/i,
    /succession|succession planning|pipeline/i,
    /performance.*(distribution|breakdown|by level)/i,
    /development needed|underperformer/i,
    /high potential|future leader/i,
    /calibration|talent calibration/i,
  ],
  enps: [
    /show|display|what.*(enps|employee satisfaction|net promoter)/i,
    /enps score|satisfaction score|nps/i,
    /promoter|detractor|passive/i,
    /employee sentiment|engagement survey/i,
    /employee feedback|survey results|satisfaction trend/i,
    /how (satisfied|happy) are (employees|our people)/i,
    /employee morale|workforce sentiment/i,
  ],
};

/**
 * Extract entities from message (department, employee name, date range, etc.)
 */
function extractEntities(message: string): {
  department?: string;
  dateRange?: string;
  employeeName?: string;
} {
  const entities: any = {};

  // Department extraction
  const deptMatch = message.match(
    /\b(engineering|sales|marketing|product|hr|finance|operations|customer success)\b/i
  );
  if (deptMatch) {
    entities.department =
      deptMatch[1].charAt(0).toUpperCase() + deptMatch[1].slice(1).toLowerCase();
  }

  // Date range extraction
  const dateRangePatterns = {
    last_30_days: /last (30|thirty) days?|past month/i,
    last_90_days: /last (90|ninety) days?|past (3|three) months?|last quarter/i,
    last_6_months: /last (6|six) months?|past half year/i,
    last_12_months: /last (12|twelve) months?|past year|last year/i,
    ytd: /year to date|ytd/i,
    qtd: /quarter to date|qtd/i,
    mtd: /month to date|mtd/i,
  };

  for (const [range, pattern] of Object.entries(dateRangePatterns)) {
    if (pattern.test(message)) {
      entities.dateRange = range;
      break;
    }
  }

  // Employee name extraction (basic - looks for capitalized words after "for" or "with")
  const nameMatch = message.match(/(?:for|with|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) {
    entities.employeeName = nameMatch[1];
  }

  return entities;
}

/**
 * Determine document type from message
 */
function getDocumentType(message: string): string | undefined {
  if (/offer letter|employment letter|offer/i.test(message)) return 'offer_letter';
  if (/pip|performance improvement|improvement plan/i.test(message)) return 'pip';
  if (/job description|jd|job posting/i.test(message)) return 'job_description';
  if (/policy|handbook|procedure/i.test(message)) return 'policy';
  if (/review|evaluation|assessment/i.test(message)) return 'performance_review';
  return 'general';
}

/**
 * Determine analytics metric from message
 */
function getAnalyticsMetric(message: string): string | undefined {
  if (/headcount|employee count|staff count/i.test(message)) return 'headcount';
  if (/attrition|turnover/i.test(message)) return 'attrition';
  if (/diversity|demographics/i.test(message)) return 'diversity';
  if (/compensation|salary|pay/i.test(message)) return 'compensation';
  if (/performance|rating/i.test(message)) return 'performance';
  return 'headcount'; // default
}

/**
 * Determine chart type from message
 */
function getChartType(message: string): 'bar' | 'line' | 'pie' | 'scatter' {
  if (/trend|over time|timeline|history/i.test(message)) return 'line';
  if (/distribution|breakdown|composition|pie/i.test(message)) return 'pie';
  if (/compare|comparison|bar|column/i.test(message)) return 'bar';
  return 'bar'; // default
}

/**
 * Determine performance grid highlights from message
 */
function getPerformanceHighlights(message: string): string[] {
  const highlights: string[] = [];

  if (/flight risk|at risk|retention risk/i.test(message)) {
    highlights.push('flight-risk');
  }
  if (/high performer/i.test(message)) {
    highlights.push('High-High', 'High-Medium');
  }
  if (/future leader|succession/i.test(message)) {
    highlights.push('High-High', 'Medium-High');
  }
  if (/development needed|underperformer/i.test(message)) {
    highlights.push('Low-Low', 'Low-Medium');
  }

  return highlights;
}

/**
 * Main detection function
 *
 * Analyzes a message and returns context panel data if applicable
 */
export function detectContext(message: string, aiResponse?: string): DetectionResult {
  const messageLower = message.toLowerCase();
  let bestMatch: { type: 'document' | 'analytics' | 'performance' | 'enps' | null; confidence: number } = {
    type: null,
    confidence: 0,
  };

  // Check each context type
  for (const [contextType, patterns] of Object.entries(contextPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        const confidence = 85 + Math.random() * 15; // 85-100%
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            type: contextType as 'document' | 'analytics' | 'performance' | 'enps',
            confidence,
          };
        }
      }
    }
  }

  // If no match found or confidence too low, return null
  if (!bestMatch.type || bestMatch.confidence < 70) {
    return { panelData: null, confidence: bestMatch.confidence };
  }

  // Extract entities from message
  const entities = extractEntities(message);

  // Build context panel data based on detected type
  let panelData: ContextPanelData | null = null;

  switch (bestMatch.type) {
    case 'document':
      panelData = {
        type: 'document',
        title: 'Document Editor',
        config: {
          documentType: getDocumentType(message),
        },
        data: {
          employeeName: entities.employeeName,
          content: aiResponse || '', // AI-generated content
        },
      };
      break;

    case 'analytics':
      panelData = {
        type: 'analytics',
        title: 'Analytics',
        config: {
          chartType: getChartType(message),
          filters: {
            department: entities.department,
            dateRange: entities.dateRange || 'last_12_months',
          },
        },
        data: {
          metric: getAnalyticsMetric(message),
        },
      };
      break;

    case 'performance':
      panelData = {
        type: 'performance',
        title: 'Performance Grid',
        config: {
          filters: {
            department: entities.department,
          },
          highlights: getPerformanceHighlights(message),
        },
        data: {},
      };
      break;

    case 'enps':
      panelData = {
        type: 'enps',
        title: 'Employee Satisfaction (eNPS)',
        config: {
          filters: {
            department: entities.department,
            dateRange: entities.dateRange || 'last_12_months',
          },
        },
        data: {},
      };
      break;
  }

  return {
    panelData,
    confidence: bestMatch.confidence,
  };
}

/**
 * Helper to detect context from chat API response
 *
 * This can be called on the backend to include context panel data in the response
 */
export function detectContextFromResponse(
  message: string,
  detectedWorkflow: string,
  aiResponse: string
): ContextPanelData | null {
  // First try message-based detection
  const result = detectContext(message, aiResponse);
  if (result.panelData && result.confidence >= 70) {
    return result.panelData;
  }

  // Fallback: use detected workflow
  const entities = extractEntities(message);

  switch (detectedWorkflow) {
    case 'hiring':
      if (/offer|job description/i.test(message)) {
        return {
          type: 'document',
          title: 'Document Editor',
          config: { documentType: getDocumentType(message) },
          data: { content: aiResponse },
        };
      }
      break;

    case 'performance':
      if (/9-box|talent|grid/i.test(message)) {
        return {
          type: 'performance',
          title: 'Performance Grid',
          config: {
            filters: { department: entities.department },
            highlights: getPerformanceHighlights(message),
          },
          data: {},
        };
      }
      break;

    case 'analytics':
      return {
        type: 'analytics',
        title: 'Analytics',
        config: {
          chartType: getChartType(message),
          filters: {
            department: entities.department,
            dateRange: entities.dateRange || 'last_12_months',
          },
        },
        data: { metric: getAnalyticsMetric(message) },
      };
  }

  return null;
}
