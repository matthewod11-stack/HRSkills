import { groupByCount } from '@/lib/analytics/utils';

/**
 * Execute a simple analytics query against employee data
 * This is a simplified in-memory implementation
 * TODO: Replace with actual SQLite execution when available
 */
export async function executeQuery(
  sql: string,
  message: string,
  employeeData: any[]
): Promise<any[]> {
  let rows: any[] = [];

  // Simple query parsing (can be expanded to use actual SQL parser/executor)
  // For now, we'll use keyword matching to determine which aggregation to run
  if (message.toLowerCase().includes('department')) {
    const grouped = groupByCount(employeeData, 'department');
    rows = Object.entries(grouped).map(([department, count]) => ({
      department,
      count
    }));
  } else if (message.toLowerCase().includes('level')) {
    const grouped = groupByCount(employeeData, 'level');
    rows = Object.entries(grouped).map(([level, count]) => ({
      level,
      count
    }));
  } else if (message.toLowerCase().includes('status')) {
    const grouped = groupByCount(employeeData, 'status');
    rows = Object.entries(grouped).map(([status, count]) => ({
      status,
      count
    }));
  } else {
    // Default: department distribution
    const grouped = groupByCount(employeeData, 'department');
    rows = Object.entries(grouped).map(([department, count]) => ({
      department,
      count
    }));
  }

  return rows;
}

/**
 * Check if query execution returned any results
 */
export function hasResults(rows: any[]): boolean {
  return rows.length > 0;
}

/**
 * Get metadata about query execution
 */
export function getQueryMetadata(rows: any[], startTime: number) {
  return {
    rowsReturned: rows.length,
    executionTime: Date.now() - startTime,
    cached: false
  };
}
