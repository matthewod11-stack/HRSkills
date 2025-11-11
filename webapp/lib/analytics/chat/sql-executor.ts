import Database from 'better-sqlite3';

import { groupByCount, resolveDataPath } from '@/lib/analytics/utils';
import { TABLE_SCHEMAS } from './config';

type SqliteDatabase = InstanceType<typeof Database>;

let cachedDb: SqliteDatabase | null | undefined;

function getPersistentDatabase(): SqliteDatabase | null {
  if (cachedDb !== undefined) {
    return cachedDb;
  }

  cachedDb = null;
  const dbPath = resolveDataPath('hrskills.db');
  if (!dbPath) {
    console.warn('[analytics-chat] No hrskills.db found in data directories');
    return cachedDb;
  }

  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      const row = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count?: number } | undefined;
      if ((row?.count ?? 0) > 0) {
        cachedDb = db;
        return cachedDb;
      }
    } catch (error) {
      console.warn('[analytics-chat] Could not verify employees table in hrskills.db', error);
    }
    db.close();
  } catch (error) {
    console.error('[analytics-chat] Failed to open hrskills.db', error);
  }

  return cachedDb;
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return value
    .split(/\s+/)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

function coerceValueByType(value: any, type: string, columnName: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (type === 'INTEGER') {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (columnName === 'status') {
      if (!trimmed) return null;
      return toTitleCase(trimmed);
    }
    return trimmed;
  }
  return value;
}

function buildInMemoryDatabase(employeeData: any[]): SqliteDatabase | null {
  const schema = TABLE_SCHEMAS.employees;
  if (!schema || !employeeData || employeeData.length === 0) {
    return null;
  }

  const db = new Database(':memory:');
  const columnDefinitions = schema.columns
    .map(column => `${column.name} ${column.type}`)
    .join(', ');

  db.exec(`CREATE TABLE ${schema.name} (${columnDefinitions})`);

  const columnNames = schema.columns.map(column => column.name);
  const placeholders = columnNames.map(() => '?').join(', ');
  const insert = db.prepare(`INSERT INTO ${schema.name} (${columnNames.join(', ')}) VALUES (${placeholders})`);
  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insert.run(columnNames.map((columnName, index) => coerceValueByType(row[columnName], schema.columns[index].type, columnName)));
    }
  });

  insertMany(employeeData);
  return db;
}

function executeSqlAgainstDatabase(sql: string, employeeData: any[]): any[] | null {
  const persistentDb = getPersistentDatabase();
  if (persistentDb) {
    try {
      const statement = persistentDb.prepare(sql);
      return statement.all();
    } catch (error) {
      console.error('[analytics-chat] SQL execution error against persisted DB', error);
    }
  }

  const inMemoryDb = buildInMemoryDatabase(employeeData);
  if (!inMemoryDb) {
    return null;
  }

  try {
    const statement = inMemoryDb.prepare(sql);
    return statement.all();
  } catch (error) {
    console.error('[analytics-chat] SQL execution error against in-memory DB', error);
    return null;
  } finally {
    inMemoryDb.close();
  }
}

/**
 * Execute an analytics query using SQLite.
 * Prefers the packaged hrskills.db when it contains seeded data,
 * falls back to a transient in-memory database hydrated from the mock JSON,
 * and finally reverts to heuristic aggregations if SQL execution fails.
 */
export async function executeQuery(
  sql: string,
  message: string,
  employeeData: any[]
): Promise<any[]> {
  const rowsFromDb = executeSqlAgainstDatabase(sql, employeeData);
  if (Array.isArray(rowsFromDb)) {
    return rowsFromDb;
  }

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
