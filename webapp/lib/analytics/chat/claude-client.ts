import { type Anthropic, createMessage } from '@/lib/api-helpers/anthropic-client';
import { SQL_ANALYSIS_TOOL, type SQLAnalysisResult } from './config';
import { buildSchemaContext } from './utils';

/**
 * Build system prompt for Claude with schema context and guidelines
 */
export function buildSystemPrompt(dataSources: string[], conversationHistory?: any[]): string {
  const schemaContext = buildSchemaContext(dataSources);

  const historyContext =
    conversationHistory && conversationHistory.length > 0
      ? '\n\n**Recent conversation:**\n' +
        conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')
      : '';

  return `You are an expert HR analytics assistant. Your job is to generate SQL queries AND provide analysis guidance for HR data questions.

# Available Database Tables and Schemas

${schemaContext}

# Important Guidelines

- **Only generate SELECT queries** - no INSERT, UPDATE, DELETE, or DDL
- Use proper SQLite syntax (use || for concatenation, strftime for dates)
- Join tables when needed using foreign keys
- Use GROUP BY for aggregations
- Format dates as YYYY-MM-DD
- For date calculations, use julianday() or strftime()
- Be case-insensitive with COLLATE NOCASE or LOWER()
- Always include an explanation of the query

# Query Intent Types

- **simple_metric**: Single value aggregation (COUNT, AVG, SUM)
- **filtered**: Filtered subset with WHERE clause
- **comparative**: Cross-group comparison with GROUP BY
- **temporal**: Time-series data with date grouping
- **aggregation**: Complex multi-level aggregation
- **correlation**: Relationships between multiple metrics

# Analysis Template

In addition to the SQL query, provide an analysis_template that will be used to explain the results.
The template should:
1. Describe what the data shows (use placeholders for actual values)
2. Identify key insights or patterns to look for
3. Suggest implications for HR strategy

Example: "The data shows {department_count} departments with an average headcount of {avg_headcount}. The largest department is {top_department} with {top_count} employees, which represents {top_percentage}% of the workforce."

Generate a SQL query and analysis template to answer the user's question. Use the generate_sql_and_analysis tool.${historyContext}`;
}

/**
 * Call Claude API to generate SQL and analysis
 */
export async function generateSQLAndAnalysis(
  message: string,
  dataSources: string[],
  conversationHistory?: any[]
): Promise<SQLAnalysisResult> {
  const systemPrompt = buildSystemPrompt(dataSources, conversationHistory);

  const response = await createMessage({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    tools: [SQL_ANALYSIS_TOOL],
    tool_choice: { type: 'tool', name: 'generate_sql_and_analysis' },
  });

  // Extract tool use
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolUse || toolUse.name !== 'generate_sql_and_analysis') {
    throw new Error('NO_SQL_GENERATED');
  }

  return toolUse.input as SQLAnalysisResult;
}
