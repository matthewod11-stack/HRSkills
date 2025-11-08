import { TABLE_SCHEMAS, ChartType, QueryIntent } from './config';

/**
 * Build schema context string for Claude prompt
 * Formats table schemas into human-readable markdown
 */
export function buildSchemaContext(dataSources: string[]): string {
  const schemas = dataSources
    .filter(source => TABLE_SCHEMAS[source as keyof typeof TABLE_SCHEMAS])
    .map(source => {
      const schema = TABLE_SCHEMAS[source as keyof typeof TABLE_SCHEMAS];
      const columns = schema.columns
        .map(col => `  - ${col.name} (${col.type}): ${col.description}`)
        .join('\n');
      return `### Table: ${schema.name}\n**Description:** ${schema.description}\n**Columns:**\n${columns}`;
    });

  return schemas.join('\n\n');
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
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER',
    'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE', '--', ';--'
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

  const labels = rows.map(row => String(row[labelKey]));
  const data = rows.map(row => Number(row[valueKey]) || 0);

  const colors = [
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(139, 92, 246, 0.8)',   // purple
    'rgba(236, 72, 153, 0.8)',   // pink
    'rgba(34, 197, 94, 0.8)',    // green
    'rgba(251, 146, 60, 0.8)',   // orange
    'rgba(14, 165, 233, 0.8)',   // cyan
    'rgba(168, 85, 247, 0.8)',   // violet
    'rgba(244, 63, 94, 0.8)',    // rose
  ];

  return {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: valueKey,
        data,
        backgroundColor: chartType === 'pie' ? colors : colors[0],
        borderColor: chartType === 'pie' ? colors : 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.3
      }]
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
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'rgba(255, 255, 255, 1)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 1
        }
      },
      scales: chartType !== 'pie' ? {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      } : undefined
    },
    canPin: true
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
      'Compare to last quarter'
    ],
    comparative: [
      'Show me the trend for each group',
      'Which group changed the most?',
      'Add performance ratings to this'
    ],
    temporal: [
      'What caused the biggest changes?',
      'Compare to industry benchmarks',
      'Show just the last 6 months'
    ],
    filtered: [
      'Compare this to other departments',
      'Show me the full organization',
      'Add tenure breakdown'
    ],
    aggregation: [
      'Show distribution by level',
      'Compare to company average',
      'Highlight outliers'
    ],
    correlation: [
      'Is this relationship significant?',
      'Show me other correlations',
      'Break down by department'
    ]
  };

  return followUps[intent] || [
    'Show me more details',
    'Break this down further',
    'Compare to last period'
  ];
}

/**
 * Populate analysis template with actual data values
 */
export function populateAnalysisTemplate(template: string, rows: any[]): string {
  let result = template;

  if (rows.length === 0) return result;

  // Calculate common metrics for replacement
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const labelKey = keys[0];
  const valueKey = keys[1];

  // Replace common placeholders
  result = result.replace(/{total_count}/g, String(rows.length));
  result = result.replace(/{row_count}/g, String(rows.length));

  // If it's a simple aggregation, add the values
  if (rows.length <= 10) {
    const dataPoints = rows.map(row => `${row[labelKey]}: ${row[valueKey]}`).join(', ');
    result = result.replace(/{data_summary}/g, dataPoints);
  }

  // Find top/max values
  const sortedRows = [...rows].sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));
  if (sortedRows.length > 0) {
    result = result.replace(/{top_[^}]+}/g, (match) => {
      if (match.includes('count')) return String(sortedRows[0][valueKey]);
      return String(sortedRows[0][labelKey]);
    });
  }

  // If the template still has unreplaced placeholders, add the raw data summary
  if (result.includes('{')) {
    result += `\n\nKey findings from ${rows.length} data points:\n`;
    result += JSON.stringify(rows.slice(0, 5), null, 2);
    if (rows.length > 5) result += `\n... and ${rows.length - 5} more`;
  }

  return result;
}
