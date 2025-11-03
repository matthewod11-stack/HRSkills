# Rippling Integration

Integration layer for Rippling HRIS and ATS.

## Setup

1. Generate API key in Rippling:
   - Go to Settings → API
   - Create new API key
   - Copy the key

2. Add to `.env.local`:
   ```bash
   RIPPLING_API_KEY=your_api_key_here
   RIPPLING_BASE_URL=https://api.rippling.com
   ```

## Available Functions

### Employees (`employees.ts`)

```typescript
import { getAllEmployees, getEmployee, updateEmployee } from './integrations/rippling/employees';

// Get all employees
const employees = await getAllEmployees();

// Get active employees only
const active = await getAllEmployees({ status: 'active' });

// Get employees by department
const engineering = await getAllEmployees({ department: 'Engineering' });

// Get single employee
const employee = await getEmployee('emp_123');

// Update employee
await updateEmployee('emp_123', { title: 'Senior Engineer' });
```

### ATS (`ats.ts`)

```typescript
import { getOpenJobs, getCandidatesByJob, updateCandidateStatus } from './integrations/rippling/ats';

// Get all open jobs
const jobs = await getOpenJobs();

// Get candidates for a job
const candidates = await getCandidatesByJob('job_123');

// Update candidate status
await updateCandidateStatus('cand_456', 'hired');

// Get recently hired candidates (last 7 days)
const recentHires = await getRecentlyHired(7);
```

## API Documentation

Rippling API docs: https://developer.rippling.com/docs

## Rate Limits

- 100 requests per minute
- Cached responses for 5 minutes on read operations
