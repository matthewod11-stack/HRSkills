# Analytics API Guide

> **Complete guide to the unified analytics endpoint**

**Last Updated:** 2025-11-09
**Feature:** Phase 2 API Consolidation - Unified Analytics
**Status:** Production Ready

---

## Overview

The unified analytics endpoint consolidates **8 analytics APIs** into a single endpoint with metric-based routing. This dramatically simplifies the API surface while maintaining all functionality.

**Endpoint:** `GET /api/analytics`

**Consolidates:**
- `/api/analytics/headcount` ✅
- `/api/analytics/attrition` ✅
- `/api/analytics/nine-box` ✅
- `/api/analytics/metrics` ✅
- `/api/analytics/errors` ✅
- `/api/performance/analyze` ✅
- Plus 2 new metrics: diversity, compensation

**Benefits:**
- Single endpoint for all analytics
- Consistent query parameter pattern
- Unified response format
- CSV export support
- Flexible filtering and grouping

---

## Quick Start

### Basic Usage

```bash
# Headcount metrics
GET /api/analytics?metric=headcount

# Attrition for last 90 days
GET /api/analytics?metric=attrition&dateRange=last_90_days

# Nine-box grid for Engineering
GET /api/analytics?metric=nine-box&department=Engineering

# Export diversity metrics to CSV
GET /api/analytics?metric=diversity&format=csv
```

### With Authentication

```typescript
const response = await fetch('/api/analytics?metric=headcount', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();
console.log(data.data.total); // 247 employees
```

---

## API Reference

### Request

**Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| `metric` | string | ✅ | The metric to calculate | `headcount`, `attrition`, `nine-box`, `diversity`, `performance`, `engagement`, `compensation`, `costs` |
| `department` | string | ❌ | Filter by department | Any department name |
| `location` | string | ❌ | Filter by location | Any location name |
| `dateRange` | string | ❌ | Date range for time-series metrics | `ytd`, `qtd`, `mtd`, `last_30_days`, `last_90_days`, `last_6_months`, `last_12_months`, `custom` |
| `startDate` | string | ❌ | Start date for custom range | ISO date: `2024-01-01` |
| `endDate` | string | ❌ | End date for custom range | ISO date: `2024-12-31` |
| `groupBy` | string | ❌ | Group results by dimension | `department`, `location`, `level`, `manager` |
| `format` | string | ❌ | Output format | `json` (default), `csv` |

### Response (JSON)

```typescript
interface AnalyticsResponse {
  success: boolean;
  metric: string;
  data: any; // Varies by metric (see below)
  metadata: {
    generatedAt: string;
    filters: {
      metric: string;
      department: string;
      location: string;
      dateRange: string;
      groupBy: string;
    };
    dataPoints: number;
    dataSource: string;
  };
}
```

### Response (CSV)

When `format=csv`, returns CSV file with appropriate headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="headcount-2024-11-09.csv"

department,count,percentage
Engineering,89,36.03
Sales,56,22.67
...
```

---

## Metrics

### 1. Headcount

**Usage:**
```bash
GET /api/analytics?metric=headcount
GET /api/analytics?metric=headcount&department=Engineering
GET /api/analytics?metric=headcount&groupBy=department
```

**Response:**
```json
{
  "success": true,
  "metric": "headcount",
  "data": {
    "total": 247,
    "byDepartment": {
      "Engineering": 89,
      "Sales": 56,
      "Product": 34,
      "Marketing": 28,
      "HR": 12,
      "Finance": 10,
      "Operations": 18
    },
    "byLocation": {
      "San Francisco": 120,
      "New York": 67,
      "Remote": 60
    },
    "trends": [
      { "date": "2024-01", "count": 235 },
      { "date": "2024-02", "count": 241 },
      { "date": "2024-03", "count": 247 }
    ],
    "spanOfControl": {
      "average": 7.2,
      "byManager": {
        "MGR001": 12,
        "MGR002": 8,
        "MGR003": 5
      }
    }
  },
  "metadata": {
    "generatedAt": "2024-11-09T10:30:00Z",
    "filters": {
      "metric": "headcount",
      "department": "all",
      "location": "all",
      "dateRange": "last_12_months",
      "groupBy": "none"
    },
    "dataPoints": 4,
    "dataSource": "SQLite"
  }
}
```

**Department-Specific:**
```bash
GET /api/analytics?metric=headcount&department=Engineering
```

```json
{
  "data": {
    "total": 89,
    "department": "Engineering",
    "byLevel": {
      "Senior": 34,
      "Mid": 42,
      "Junior": 13
    },
    "trends": [...]
  }
}
```

---

### 2. Attrition

**Usage:**
```bash
GET /api/analytics?metric=attrition
GET /api/analytics?metric=attrition&dateRange=last_90_days
GET /api/analytics?metric=attrition&department=Sales&dateRange=qtd
```

**Response:**
```json
{
  "success": true,
  "metric": "attrition",
  "data": {
    "overall": {
      "totalTerminations": 23,
      "attritionRate": 9.3,
      "voluntaryRate": 6.1,
      "involuntaryRate": 3.2
    },
    "byDepartment": {
      "Engineering": {
        "terminations": 8,
        "attritionRate": 9.0,
        "headcount": 89
      },
      "Sales": {
        "terminations": 9,
        "attritionRate": 16.1,
        "headcount": 56
      }
    },
    "byLevel": {
      "Senior": { "attritionRate": 5.2 },
      "Mid": { "attritionRate": 11.3 },
      "Junior": { "attritionRate": 18.7 }
    },
    "byLocation": {
      "San Francisco": { "attritionRate": 8.3 },
      "New York": { "attritionRate": 10.4 },
      "Remote": { "attritionRate": 11.7 }
    }
  },
  "metadata": {
    "generatedAt": "2024-11-09T10:30:00Z",
    "filters": {
      "metric": "attrition",
      "department": "all",
      "dateRange": "last_12_months",
      "groupBy": "none"
    },
    "dataPoints": 4,
    "dataSource": "SQLite"
  }
}
```

**Date Ranges:**
- `ytd` - Year to date (Jan 1 - today)
- `qtd` - Quarter to date (Q start - today)
- `mtd` - Month to date (Month start - today)
- `last_30_days` - Last 30 days
- `last_90_days` - Last 90 days
- `last_6_months` - Last 6 months
- `last_12_months` - Last 12 months (default)
- `custom` - Custom range (requires `startDate` and `endDate`)

---

### 3. Nine-Box Grid

**Usage:**
```bash
GET /api/analytics?metric=nine-box
GET /api/analytics?metric=nine-box&department=Engineering
```

**Response:**
```json
{
  "success": true,
  "metric": "nine-box",
  "data": {
    "grid": [
      {
        "performance": "High",
        "potential": "High",
        "count": 23,
        "category": "Future Leader",
        "employees": [
          {
            "id": "EMP001",
            "name": "Sarah Chen",
            "department": "Engineering",
            "aiPerformanceScore": 4.5,
            "aiPotentialScore": 3.2,
            "managerRating": 4,
            "ratingInflation": 0.5
          }
        ]
      },
      {
        "performance": "High",
        "potential": "Medium",
        "count": 34,
        "category": "High Performer",
        "employees": [...]
      }
      // ... 7 more cells
    ],
    "summary": {
      "highPerformers": 67,
      "coreEmployees": 145,
      "developmentNeeded": 35,
      "totalAnalyzed": 247,
      "avgRatingInflation": 0.32
    }
  }
}
```

**Categories:**
| Performance | Potential | Category | Action |
|-------------|-----------|----------|--------|
| High | High | Future Leader | Succession planning |
| High | Medium | High Performer | Expand responsibilities |
| High | Low | Solid Performer | Retention focus |
| Medium | High | Key Talent | Development opportunities |
| Medium | Medium | Growth Potential | Coaching & mentorship |
| Medium | Low | Core Employee | Skill development |
| Low | High | Inconsistent | Performance improvement |
| Low | Medium | Development Needed | PIP consideration |
| Low | Low | Underperformer | PIP or exit |

---

### 4. Diversity

**Usage:**
```bash
GET /api/analytics?metric=diversity
GET /api/analytics?metric=diversity&department=Engineering
```

**Response:**
```json
{
  "success": true,
  "metric": "diversity",
  "data": {
    "gender": {
      "counts": {
        "Male": 147,
        "Female": 89,
        "Non-binary": 8,
        "Not Specified": 3
      },
      "percentages": {
        "Male": 59.51,
        "Female": 36.03,
        "Non-binary": 3.24,
        "Not Specified": 1.21
      }
    },
    "ethnicity": {
      "counts": {
        "Asian": 89,
        "White": 78,
        "Hispanic": 45,
        "Black": 23,
        "Other": 9,
        "Not Specified": 3
      },
      "percentages": {
        "Asian": 36.03,
        "White": 31.58,
        "Hispanic": 18.22,
        "Black": 9.31,
        "Other": 3.64,
        "Not Specified": 1.21
      }
    },
    "total": 247
  }
}
```

---

### 5. Performance

**Usage:**
```bash
GET /api/analytics?metric=performance
GET /api/analytics?metric=performance&department=Engineering
```

**Response:**
```json
{
  "success": true,
  "metric": "performance",
  "data": {
    "average": 3.72,
    "distribution": {
      "5": 34,
      "4": 89,
      "3": 98,
      "2": 23,
      "1": 3
    },
    "total": 247,
    "analyzed": 247
  }
}
```

---

### 6. Compensation

**Usage:**
```bash
GET /api/analytics?metric=compensation
GET /api/analytics?metric=compensation&groupBy=department
```

**Response:**
```json
{
  "success": true,
  "metric": "compensation",
  "data": {
    "average": {
      "base": 125000,
      "bonus": 18750,
      "equity": 25000,
      "total": 168750
    },
    "byDepartment": {
      "Engineering": {
        "base": 3125000,
        "bonus": 468750,
        "equity": 625000,
        "count": 25,
        "averageBase": 125000,
        "averageBonus": 18750,
        "averageEquity": 25000
      },
      "Sales": {
        "base": 2800000,
        "bonus": 560000,
        "equity": 280000,
        "count": 28,
        "averageBase": 100000,
        "averageBonus": 20000,
        "averageEquity": 10000
      }
    },
    "byLevel": {
      "Senior": {
        "averageBase": 175000,
        "averageBonus": 26250,
        "averageEquity": 50000
      },
      "Mid": {
        "averageBase": 120000,
        "averageBonus": 18000,
        "averageEquity": 20000
      },
      "Junior": {
        "averageBase": 85000,
        "averageBonus": 8500,
        "averageEquity": 10000
      }
    },
    "total": 247
  }
}
```

---

### 7. Engagement (Placeholder)

**Usage:**
```bash
GET /api/analytics?metric=engagement
```

**Response:**
```json
{
  "success": true,
  "metric": "engagement",
  "data": {
    "score": 0,
    "participation": 0,
    "byDepartment": {},
    "message": "Engagement metrics require survey data. This is a placeholder."
  }
}
```

**Note:** This metric requires engagement survey data integration. Placeholder returns empty data.

---

### 8. Costs

**Usage:**
```bash
GET /api/analytics?metric=costs
```

**Response:**
```json
{
  "success": true,
  "metric": "costs",
  "data": {
    "totalCompensation": 41681250,
    "byDepartment": {
      "Engineering": { "averageBase": 125000, ... },
      "Sales": { "averageBase": 100000, ... }
    },
    "employees": 247,
    "message": "Cost metrics based on compensation data. Add benefits and overhead for complete picture."
  }
}
```

---

## Filtering & Grouping

### Department Filter

```bash
# All attrition metrics for Sales
GET /api/analytics?metric=attrition&department=Sales
```

### Location Filter

```bash
# Headcount in San Francisco
GET /api/analytics?metric=headcount&location=San Francisco
```

### Group By Department

```bash
# Headcount grouped by department
GET /api/analytics?metric=headcount&groupBy=department
```

### Date Range Filter

```bash
# Attrition for Q4 2024
GET /api/analytics?metric=attrition&dateRange=custom&startDate=2024-10-01&endDate=2024-12-31
```

### Combined Filters

```bash
# Nine-box grid for Engineering, grouped by level
GET /api/analytics?metric=nine-box&department=Engineering&groupBy=level
```

---

## CSV Export

### Export to CSV

Add `format=csv` to any query:

```bash
# Export headcount to CSV
GET /api/analytics?metric=headcount&format=csv

# Export attrition by department to CSV
GET /api/analytics?metric=attrition&groupBy=department&format=csv
```

### Frontend Download

```typescript
async function downloadAnalyticsCSV(metric: string, filters: any) {
  const params = new URLSearchParams({
    metric,
    format: 'csv',
    ...filters,
  });

  const response = await fetch(`/api/analytics?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${metric}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Usage
downloadAnalyticsCSV('headcount', { department: 'Engineering' });
```

---

## Error Handling

### Missing Metric

```bash
GET /api/analytics
```

```json
{
  "success": false,
  "error": "Missing required parameter: metric",
  "validMetrics": [
    "headcount",
    "attrition",
    "nine-box",
    "diversity",
    "performance",
    "engagement",
    "compensation",
    "costs"
  ]
}
```

### Unknown Metric

```bash
GET /api/analytics?metric=unknown
```

```json
{
  "success": false,
  "error": "Unknown metric: unknown",
  "validMetrics": [...]
}
```

### No Data

```bash
GET /api/analytics?metric=headcount
```

```json
{
  "success": false,
  "error": "No employee data found. Please upload employee data or run the migration."
}
```

### Insufficient Permissions

```bash
GET /api/analytics?metric=compensation
```

```json
{
  "success": false,
  "error": "Insufficient permissions to access analytics"
}
```

---

## Frontend Integration

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface AnalyticsFilters {
  metric: string;
  department?: string;
  location?: string;
  dateRange?: string;
  groupBy?: string;
}

export function useAnalytics(filters: AnalyticsFilters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams(
          Object.entries(filters).filter(([_, v]) => v !== undefined)
        );

        const response = await fetch(`/api/analytics?${params}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}

// Usage
function HeadcountWidget() {
  const { data, loading, error } = useAnalytics({
    metric: 'headcount',
    department: 'Engineering',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Engineering Headcount</h2>
      <p>Total: {data.data.total}</p>
    </div>
  );
}
```

### Dashboard Component

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsDashboard() {
  const [metric, setMetric] = useState('headcount');
  const [department, setDepartment] = useState('all');

  const { data, loading, error } = useAnalytics({ metric, department });

  return (
    <div className="analytics-dashboard">
      <div className="controls">
        <select value={metric} onChange={(e) => setMetric(e.target.value)}>
          <option value="headcount">Headcount</option>
          <option value="attrition">Attrition</option>
          <option value="nine-box">Nine-Box Grid</option>
          <option value="diversity">Diversity</option>
          <option value="performance">Performance</option>
          <option value="compensation">Compensation</option>
        </select>

        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="all">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
          <option value="Product">Product</option>
        </select>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {data && <MetricVisualization data={data} />}
    </div>
  );
}
```

---

## Performance

### Caching

The analytics endpoint uses SQLite queries optimized with indexes. Response times:

- **Headcount:** < 50ms
- **Attrition:** < 100ms
- **Nine-Box:** < 200ms (calculates for all employees)
- **Diversity:** < 50ms
- **Performance:** < 50ms
- **Compensation:** < 75ms

### Query Optimization

**Use groupBy for aggregated data:**
```bash
# Instead of multiple requests
GET /api/analytics?metric=headcount&department=Engineering
GET /api/analytics?metric=headcount&department=Sales
GET /api/analytics?metric=headcount&department=Product

# Use groupBy once
GET /api/analytics?metric=headcount&groupBy=department
```

**Filter early:**
```bash
# Better: Filter at API level
GET /api/analytics?metric=nine-box&department=Engineering

# Worse: Fetch all and filter client-side
GET /api/analytics?metric=nine-box
```

---

## Migration from Old Endpoints

### Before (Phase 1)

```typescript
// Multiple endpoints
const headcount = await fetch('/api/analytics/headcount');
const attrition = await fetch('/api/analytics/attrition');
const nineBox = await fetch('/api/analytics/nine-box');
```

### After (Phase 2)

```typescript
// Single endpoint with metric parameter
const headcount = await fetch('/api/analytics?metric=headcount');
const attrition = await fetch('/api/analytics?metric=attrition');
const nineBox = await fetch('/api/analytics?metric=nine-box');
```

### Backward Compatibility

Old endpoints still work for 6 months (redirect to new endpoint):

```bash
# Old endpoint (deprecated, redirects)
GET /api/analytics/headcount
→ Redirects to: GET /api/analytics?metric=headcount

# New endpoint (recommended)
GET /api/analytics?metric=headcount
```

---

## Examples

### Example 1: Dashboard KPIs

```typescript
async function fetchDashboardKPIs() {
  const [headcount, attrition, performance] = await Promise.all([
    fetch('/api/analytics?metric=headcount'),
    fetch('/api/analytics?metric=attrition&dateRange=qtd'),
    fetch('/api/analytics?metric=performance'),
  ]);

  const [hc, att, perf] = await Promise.all([
    headcount.json(),
    attrition.json(),
    performance.json(),
  ]);

  return {
    totalEmployees: hc.data.total,
    attritionRate: att.data.overall.attritionRate,
    avgPerformance: perf.data.average,
  };
}
```

### Example 2: Department Deep Dive

```typescript
async function getDepartmentAnalytics(department: string) {
  const params = new URLSearchParams({ department });

  const [headcount, attrition, nineBox] = await Promise.all([
    fetch(`/api/analytics?metric=headcount&${params}`),
    fetch(`/api/analytics?metric=attrition&${params}&dateRange=ytd`),
    fetch(`/api/analytics?metric=nine-box&${params}`),
  ]);

  return {
    headcount: await headcount.json(),
    attrition: await attrition.json(),
    nineBox: await nineBox.json(),
  };
}
```

### Example 3: Export All Metrics

```typescript
async function exportAllMetrics() {
  const metrics = ['headcount', 'attrition', 'diversity', 'performance', 'compensation'];

  for (const metric of metrics) {
    const response = await fetch(`/api/analytics?metric=${metric}&format=csv`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metric}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { GET } from '@/app/api/analytics/route';
import { NextRequest } from 'next/server';

describe('Unified Analytics API', () => {
  it('should return headcount metrics', async () => {
    const request = new NextRequest('http://localhost/api/analytics?metric=headcount');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metric).toBe('headcount');
    expect(data.data.total).toBeGreaterThan(0);
  });

  it('should filter by department', async () => {
    const request = new NextRequest('http://localhost/api/analytics?metric=headcount&department=Engineering');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.department).toBe('Engineering');
  });

  it('should return CSV format', async () => {
    const request = new NextRequest('http://localhost/api/analytics?metric=headcount&format=csv');
    const response = await GET(request);

    expect(response.headers.get('Content-Type')).toBe('text/csv');
  });

  it('should return error for invalid metric', async () => {
    const request = new NextRequest('http://localhost/api/analytics?metric=invalid');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toContain('Unknown metric');
  });
});
```

---

## Troubleshooting

### No data returned

**Check:**
1. Employee data exists in database
2. Filters are not too restrictive
3. User has analytics permissions

### Slow queries

**Solutions:**
1. Add database indexes (already configured)
2. Use `groupBy` instead of multiple requests
3. Filter early (at API level, not client-side)

### CSV export fails

**Check:**
1. Data is not too large (>10,000 rows)
2. Browser allows file downloads
3. Content-Type header is correct

---

## Next Steps

1. **Add caching** - Cache responses for 5 minutes
2. **Add pagination** - For large datasets (>1,000 rows)
3. **Add webhooks** - Real-time updates when data changes
4. **Add GraphQL** - For flexible client-side queries

---

**Questions?** See the [API Reference](./API_REFERENCE_V2.md) or [Migration Guide](./API_MIGRATION_GUIDE.md).
