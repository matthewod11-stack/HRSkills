import { TABLE_SCHEMAS, ChartType, QueryIntent } from './config';

/**
 * Build schema context string for Claude prompt
 * Formats table schemas into human-readable markdown
 */
export function buildSchemaContext(dataSources: string[]): string {
  const schemas = dataSources
    .filter((source) => TABLE_SCHEMAS[source as keyof typeof TABLE_SCHEMAS])
    .map((source) => {
      const schema = TABLE_SCHEMAS[source as keyof typeof TABLE_SCHEMAS];
      const columns = schema.columns
        .map((col) => `  - ${col.name} (${col.type}): ${col.description}`)
        .join('\n');
      return `### Table: ${schema.name}\n**Description:** ${schema.description}\n**Columns:**\n${columns}`;
    });

  return schemas.join('\n\n');
}

/**
 * Normalize SQL column names - converts display names with spaces to actual column names with underscores
 * Example: "survey comment" -> "survey_comment"
 */
export function normalizeSQLColumnNames(sql: string): string {
  // Map of common display names to actual column names
  const columnNameMap: Record<string, string> = {
    'survey comment': 'survey_comment',
    'survey Comment': 'survey_comment',
    'Survey Comment': 'survey_comment',
    'survey quarter': 'survey_quarter',
    'survey Quarter': 'survey_quarter',
    'Survey Quarter': 'survey_quarter',
    'survey response date': 'survey_response_date',
    'survey Response Date': 'survey_response_date',
    'Survey Response Date': 'survey_response_date',
    'survey category': 'survey_category',
    'survey Category': 'survey_category',
    'Survey Category': 'survey_category',
    'enps score': 'enps_score',
    'enps Score': 'enps_score',
    'ENPS Score': 'enps_score',
    'performance rating': 'performance_rating',
    'performance Rating': 'performance_rating',
    'Performance Rating': 'performance_rating',
    'performance forecast': 'performance_forecast',
    'performance Forecast': 'performance_forecast',
    'Performance Forecast': 'performance_forecast',
    'potential rating': 'potential_rating',
    'potential Rating': 'potential_rating',
    'Potential Rating': 'potential_rating',
    'sentiment confidence': 'sentiment_confidence',
    'sentiment Confidence': 'sentiment_confidence',
    'Sentiment Confidence': 'sentiment_confidence',
    'sentiment analyzed at': 'sentiment_analyzed_at',
    'sentiment Analyzed At': 'sentiment_analyzed_at',
    'Sentiment Analyzed At': 'sentiment_analyzed_at',
    'metric date': 'metric_date',
    'metric Date': 'metric_date',
    'Metric Date': 'metric_date',
    'employee id': 'employee_id',
    'employee Id': 'employee_id',
    'Employee Id': 'employee_id',
    'first name': 'first_name',
    'first Name': 'first_name',
    'First Name': 'first_name',
    'last name': 'last_name',
    'last Name': 'last_name',
    'Last Name': 'last_name',
    'hire date': 'hire_date',
    'hire Date': 'hire_date',
    'Hire Date': 'hire_date',
    'termination date': 'termination_date',
    'termination Date': 'termination_date',
    'Termination Date': 'termination_date',
    'termination reason': 'termination_reason',
    'termination Reason': 'termination_reason',
    'Termination Reason': 'termination_reason',
    'manager id': 'manager_id',
    'manager Id': 'manager_id',
    'Manager Id': 'manager_id',
    'review date': 'review_date',
    'review Date': 'review_date',
    'Review Date': 'review_date',
    'review type': 'review_type',
    'review Type': 'review_type',
    'Review Type': 'review_type',
    'reviewer id': 'reviewer_id',
    'reviewer Id': 'reviewer_id',
    'Reviewer Id': 'reviewer_id',
    'review text': 'review_text',
    'review Text': 'review_text',
    'Review Text': 'review_text',
    'response date': 'response_date',
    'response Date': 'response_date',
    'Response Date': 'response_date',
  };

  let normalized = sql;

  // Replace column names with spaces (case-insensitive)
  for (const [displayName, columnName] of Object.entries(columnNameMap)) {
    // Match column names in various SQL contexts: SELECT, WHERE, ORDER BY, GROUP BY, etc.
    // Use word boundaries and handle quoted identifiers
    const patterns = [
      // Unquoted: "survey comment" or `survey comment` or [survey comment]
      new RegExp(`\\b${displayName.replace(/\s+/g, '\\s+')}\\b`, 'gi'),
      // Quoted with double quotes: "survey comment"
      new RegExp(`"${displayName.replace(/\s+/g, '\\s+')}"`, 'gi'),
      // Quoted with backticks: `survey comment`
      new RegExp(`\`${displayName.replace(/\s+/g, '\\s+')}\``, 'gi'),
      // Quoted with brackets: [survey comment]
      new RegExp(`\\[${displayName.replace(/\s+/g, '\\s+')}\\]`, 'gi'),
    ];

    for (const pattern of patterns) {
      normalized = normalized.replace(pattern, columnName);
    }
  }

  return normalized;
}

/**
 * Validate SQL query for security
 * Ensures only SELECT queries are allowed and blocks dangerous operations
 */
export function validateSQL(sql: string): { valid: boolean; error?: string } {
  const normalized = sql.trim().toUpperCase();

  // Only SELECT queries allowed
  if (!normalized.startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  // Block dangerous operations
  const dangerousPatterns = [
    'DROP',
    'DELETE',
    'INSERT',
    'UPDATE',
    'ALTER',
    'CREATE',
    'TRUNCATE',
    'EXEC',
    'EXECUTE',
    '--',
    ';--',
  ];

  for (const pattern of dangerousPatterns) {
    if (normalized.includes(pattern)) {
      return { valid: false, error: `Dangerous operation detected: ${pattern}` };
    }
  }

  return { valid: true };
}

/**
 * Select appropriate chart type based on query intent and data size
 */
export function selectChartType(intent: QueryIntent, rowCount: number): ChartType {
  if (intent === 'temporal') return 'line';
  if (intent === 'correlation') return 'scatter';
  if (intent === 'simple_metric' && rowCount <= 7) return 'pie';
  return 'bar';
}

/**
 * Generate Chart.js configuration for visualizing query results
 */
export function generateChartConfig(intent: QueryIntent, rows: any[]): any {
  if (rows.length === 0) return null;

  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  const chartType = selectChartType(intent, rows.length);

  const labels = rows.map((row) => String(row[labelKey]));
  const data = rows.map((row) => Number(row[valueKey]) || 0);

  const colors = [
    'rgba(59, 130, 246, 0.8)', // blue
    'rgba(139, 92, 246, 0.8)', // purple
    'rgba(236, 72, 153, 0.8)', // pink
    'rgba(34, 197, 94, 0.8)', // green
    'rgba(251, 146, 60, 0.8)', // orange
    'rgba(14, 165, 233, 0.8)', // cyan
    'rgba(168, 85, 247, 0.8)', // violet
    'rgba(244, 63, 94, 0.8)', // rose
  ];

  return {
    type: chartType,
    data: {
      labels,
      datasets: [
        {
          label: valueKey,
          data,
          backgroundColor: chartType === 'pie' ? colors : colors[0],
          borderColor: chartType === 'pie' ? colors : 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType === 'pie',
          position: 'bottom' as const,
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'rgba(255, 255, 255, 1)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 1,
        },
      },
      scales:
        chartType !== 'pie'
          ? {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              },
              x: {
                grid: {
                  color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              },
            }
          : undefined,
    },
    canPin: true,
  };
}

/**
 * Generate contextual follow-up question suggestions
 */
export function generateFollowUps(intent: QueryIntent, query: string): string[] {
  const followUps: Record<string, string[]> = {
    simple_metric: [
      'Show me the trend over time',
      'Break this down by department',
      'Compare to last quarter',
    ],
    comparative: [
      'Show me the trend for each group',
      'Which group changed the most?',
      'Add performance ratings to this',
    ],
    temporal: [
      'What caused the biggest changes?',
      'Compare to industry benchmarks',
      'Show just the last 6 months',
    ],
    filtered: [
      'Compare this to other departments',
      'Show me the full organization',
      'Add tenure breakdown',
    ],
    aggregation: ['Show distribution by level', 'Compare to company average', 'Highlight outliers'],
    correlation: [
      'Is this relationship significant?',
      'Show me other correlations',
      'Break down by department',
    ],
  };

  return (
    followUps[intent] || [
      'Show me more details',
      'Break this down further',
      'Compare to last period',
    ]
  );
}

/**
 * Populate analysis template with actual data values
 */
export function populateAnalysisTemplate(template: string, rows: any[]): string {
  if (rows.length === 0) return template;

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  if (keys.length === 0) {
    return 'I analyzed your data but the result set did not include any columns to summarize.';
  }

  const labelKey = keys[0];
  const valueKey = keys[1] ?? keys[0];

  const formatValue = (value: any) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  };

  let populated = template
    .replace(/{total_count}/g, String(rows.length))
    .replace(/{row_count}/g, String(rows.length));

  if (rows.length <= 10) {
    const dataPoints = rows
      .map((row) => `${formatValue(row[labelKey])}: ${formatValue(row[valueKey])}`)
      .join('; ');
    populated = populated.replace(/{data_summary}/g, dataPoints);
  }

  const sortedRows = [...rows].sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));
  if (sortedRows.length > 0) {
    populated = populated.replace(/{top_[^}]+}/g, (match) => {
      if (match.includes('count') || match.includes('value')) {
        return formatValue(sortedRows[0][valueKey]);
      }
      return formatValue(sortedRows[0][labelKey]);
    });
  }

  // If any placeholders remain, fall back to a clean human-readable summary
  if (/{[^}]+}/.test(populated) || populated.trim().length === 0) {
    const topRows = rows.slice(0, Math.min(rows.length, 5));
    const listItems = topRows
      .map((row) => `- ${formatValue(row[labelKey])}: ${formatValue(row[valueKey])}`)
      .join('\n');

    const additionalNote =
      rows.length > topRows.length
        ? `\n- …and ${rows.length - topRows.length} more categories`
        : '';

    const hasNumericValue = rows.some((row) => Number.isFinite(Number(row[valueKey])));
    const totalValue = hasNumericValue
      ? rows.reduce((sum, row) => {
          const value = Number(row[valueKey]);
          return Number.isFinite(value) ? sum + value : sum;
        }, 0)
      : null;

    const totalLine =
      totalValue !== null ? `\n- Total across all categories: ${totalValue.toLocaleString()}` : '';

    populated = [
      `Here’s what I found across ${rows.length} data point${rows.length === 1 ? '' : 's'}:`,
      listItems,
      additionalNote,
      totalLine,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return populated.trim();
}
