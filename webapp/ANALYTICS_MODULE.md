# Analytics Module - Chat-Style Data Exploration

**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2025-11-04

---

## Overview

The Analytics module provides a conversational interface for exploring HR data. Users ask questions in natural language, and Claude generates SQL queries, executes them, and presents insights with interactive visualizations.

### Key Features

- **Chat-Style Interface**: Matches the existing ChatInterface UI with 40/60 split layout
- **AI-Powered SQL Generation**: Anthropic Claude generates safe, validated SQL queries
- **Auto-Generated Visualizations**: Chart.js charts automatically selected based on query type
- **Conversational Follow-ups**: Suggested next questions based on query intent
- **Security First**: SQL validation, read-only queries, caching
- **Responsive UI**: Dark theme with glassmorphic design matching the main dashboard

---

## Architecture

### Frontend (`/webapp/app/analytics/page.tsx`)

**Layout:**
- **Left Panel (40%)**: Chat interface with messages and input
- **Right Panel (60%)**: Chart visualization area

**Features:**
- Real-time messaging with typing indicators
- Data source selection (Employees, Reviews, eNPS)
- Suggested follow-up questions
- Chart rendering with Chart.js
- Message history with timestamps
- Copy to clipboard for responses

### Backend (`/webapp/app/api/analytics/chat/route.ts`)

**Flow:**
1. Receive user question + selected data sources
2. Build schema context for selected tables
3. Call Claude with SQL generation tool
4. Validate generated SQL (security checks)
5. Execute query against database (currently mocked)
6. Generate chart configuration based on results
7. Generate AI explanation of insights
8. Return response with chart + explanation + follow-ups

**Security:**
- Only SELECT queries allowed
- Blocks DROP, DELETE, INSERT, UPDATE, ALTER, etc.
- SQL injection prevention
- Input validation
- Rate limiting ready

**Caching:**
- In-memory cache with 30-minute TTL
- Cache key: `message + dataSources`
- Reduces API costs for repeated queries

---

## Usage

### Accessing Analytics

1. Navigate to the main dashboard
2. Click "Analytics" in Quick Actions (left sidebar)
3. Or go directly to `/analytics`

### Asking Questions

**Simple Metrics:**
```
"How many employees do we have?"
"What's the average tenure?"
"How many open positions?"
```

**Department Analysis:**
```
"What's our department distribution?"
"Show me headcount by department"
"Compare departments by size"
```

**Trends:**
```
"Show me attrition trends over time"
"How has headcount changed this year?"
"Performance rating trends by quarter"
```

**Comparisons:**
```
"Compare eNPS scores by department"
"Which department has the highest performance ratings?"
"Compare tenure across levels"
```

### Data Source Selection

Toggle data sources in the header:
- **👥 Employees**: Employee master data
- **📊 Reviews**: Performance reviews
- **📈 eNPS**: Employee survey responses

Only selected data sources will be available for queries.

---

## Technical Details

### SQL Generation with Claude

The API uses Claude's tool calling feature to generate structured SQL:

```typescript
const SQL_GENERATION_TOOL: Anthropic.Tool = {
  name: 'generate_sql_query',
  description: 'Generate a SQLite query to answer HR analytics questions',
  input_schema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'The SQLite SELECT query' },
      intent: {
        type: 'string',
        enum: ['simple_metric', 'filtered', 'comparative', 'temporal', 'aggregation', 'correlation']
      },
      explanation: { type: 'string' }
    },
    required: ['sql', 'intent', 'explanation']
  }
};
```

**Query Intents:**
- `simple_metric`: Single value (COUNT, AVG, SUM)
- `filtered`: Filtered subset with WHERE
- `comparative`: Group comparison (GROUP BY)
- `temporal`: Time series (date-based)
- `aggregation`: Complex multi-level aggregation
- `correlation`: Multi-metric relationships

### Chart Selection Logic

```typescript
function selectChartType(intent: string, rowCount: number): ChartType {
  if (intent === 'temporal') return 'line';
  if (intent === 'correlation') return 'scatter';
  if (intent === 'simple_metric' && rowCount <= 7) return 'pie';
  return 'bar'; // Default
}
```

**Chart Types:**
- **Bar**: Comparisons, distributions
- **Line**: Trends over time
- **Pie**: Simple breakdowns (<7 items)
- **Scatter**: Correlations (future)

### Database Schema

**Employees Table:**
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  department TEXT,
  level TEXT,
  subteam TEXT,
  hire_date TEXT,
  status TEXT,
  termination_date TEXT,
  termination_reason TEXT,
  manager_id INTEGER
);
```

**Reviews Table:**
```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  review_date TEXT,
  review_type TEXT,
  reviewer_id INTEGER,
  review_text TEXT,
  performance_band_actual TEXT,
  potential_band_actual TEXT
);
```

**eNPS Responses Table:**
```sql
CREATE TABLE enps_responses (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  score INTEGER,
  comment TEXT,
  quarter TEXT,
  response_date TEXT,
  category TEXT,
  department TEXT
);
```

---

## Components

### Main Page Component

**File:** `/webapp/app/analytics/page.tsx`

**State Management:**
- `messages`: Chat message history
- `input`: Current user input
- `isTyping`: Loading indicator
- `sessionId`: Unique session identifier
- `selectedDataSources`: Active data sources
- `currentChart`: Current chart configuration

**Key Functions:**
- `handleSend()`: Sends message to API
- `toggleDataSource()`: Enables/disables data sources
- `renderChart()`: Renders Chart.js component
- `copyToClipboard()`: Copies response text

### API Route

**File:** `/webapp/app/api/analytics/chat/route.ts`

**Functions:**
- `buildSchemaContext()`: Generates schema description for Claude
- `validateSQL()`: Security validation of generated SQL
- `selectChartType()`: Determines appropriate chart type
- `generateChartConfig()`: Creates Chart.js configuration
- `generateFollowUps()`: Suggests contextual next questions

### Chart Configuration

**File:** `/webapp/lib/chartjs-config.ts`

Registers Chart.js components for client-side rendering:
- CategoryScale, LinearScale
- PointElement, LineElement, BarElement, ArcElement
- Title, Tooltip, Legend, Filler

---

## Styling

The analytics module matches the existing HR Command Center design:

**Colors:**
- Background: `bg-gradient-to-br from-black via-gray-950 to-black`
- Panels: `backdrop-blur-2xl bg-black/40 border-2 border-white/30`
- Accents: Blue (primary), Purple (secondary), Green (user), Pink (tertiary)

**Layout:**
- Glassmorphic cards with blur effects
- Floating orb backgrounds
- Border glow on hover
- Smooth animations with Framer Motion

**Chat Design:**
- User messages: Green gradient, right-aligned
- Assistant messages: Blue/purple gradient, left-aligned
- Avatars: Rounded squares with gradients
- Input: Bottom-fixed with gradient border

---

## Current Limitations

1. **Mock Data**: Currently returns mock results (need to connect to real database)
2. **No Persistence**: Sessions not saved to database
3. **Basic Caching**: In-memory cache (use Redis for production)
4. **No Rate Limiting**: Add rate limiting middleware
5. **Limited Error Handling**: Expand error messages and recovery

---

## Future Enhancements

### Short-term
- [ ] Connect to real SQLite database
- [ ] Add session persistence
- [ ] Implement chart pinning/saving
- [ ] Export chart as image
- [ ] Add more chart types (doughnut, radar)

### Medium-term
- [ ] Natural language explanations for charts
- [ ] Drill-down interactions
- [ ] Query history
- [ ] Saved queries/reports
- [ ] Share analysis via link

### Long-term
- [ ] Predictive analytics
- [ ] ML-powered insights
- [ ] Custom dashboard builder
- [ ] Scheduled reports
- [ ] Slack/email integration

---

## Testing

### Manual Testing

1. **Start dev server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000/analytics`
3. **Test queries**:
   - "How many employees do we have?"
   - "What's our department distribution?"
   - "Show me performance ratings by level"

### Expected Behavior

- Chat interface loads with welcome message
- User can type and send messages
- Assistant responds with insights
- Chart appears in right panel
- Suggested follow-ups displayed
- Data sources can be toggled

### Error Scenarios

- Empty message: No action
- No data sources selected: Error message
- Invalid SQL: Validation error
- API error: User-friendly error message

---

## Deployment

### Environment Variables

```env
ANTHROPIC_API_KEY=your_api_key_here
```

### Build

```bash
cd webapp
npm run build
```

### Production Considerations

1. **Database**: Connect to production database
2. **Caching**: Use Redis instead of in-memory
3. **Rate Limiting**: Add rate limiter middleware
4. **Monitoring**: Track query performance
5. **Logging**: Log SQL queries and errors
6. **Security**: Audit SQL validation logic

---

## Files Created/Modified

### New Files
- `/webapp/app/analytics/page.tsx` - Main analytics page
- `/webapp/app/api/analytics/chat/route.ts` - Analytics API endpoint
- `/webapp/lib/chartjs-config.ts` - Chart.js registration

### Modified Files
- `/webapp/app/page.tsx` - Added Analytics quick action
- `/webapp/package.json` - Added chart.js dependencies

### Dependencies Added
- `chart.js` - Chart rendering library
- `react-chartjs-2` - React wrapper for Chart.js

---

## Support

For issues or questions:
1. Check the implementation guide above
2. Review the code comments
3. Test with the example queries
4. Check browser console for errors

---

**Built with:**
- Next.js 14+
- React 18+
- Anthropic Claude Sonnet 4
- Chart.js 4.x
- Framer Motion
- TailwindCSS
