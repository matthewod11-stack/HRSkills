import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { parseCSV, parseExcel, getFileExtension } from './parser';
import { DataFile, DataMetadata } from '@/lib/types/data-sources';

const DEFAULT_DATA_DIRECTORIES = [
  process.env.ANALYTICS_DATA_DIR,
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), '..', 'data'),
  path.join(process.cwd(), '..', '..', 'data'),
  path.resolve(__dirname, '../../../../../data')
].filter((dir): dir is string => Boolean(dir));

export function resolveDataPath(...segments: string[]): string | null {
  for (const baseDir of DEFAULT_DATA_DIRECTORIES) {
    const candidate = path.join(baseDir, ...segments);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const DATA_DIR = resolveDataPath() ?? path.join(process.cwd(), '..', 'data');
const UPLOADS_DIR = resolveDataPath('uploads') ?? path.join(DATA_DIR, 'uploads');
const METADATA_PATH = resolveDataPath('metadata.json') ?? path.join(DATA_DIR, 'metadata.json');

/**
 * Read metadata.json
 */
export async function readMetadata(): Promise<DataMetadata> {
  try {
    const content = await readFile(METADATA_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { files: [], lastUpdated: null };
  }
}

/**
 * Load and parse a data file by ID
 */
export async function loadDataFile(fileId: string): Promise<any[]> {
  const metadata = await readMetadata();
  const file = metadata.files.find(f => f.fileId === fileId);

  if (!file) {
    throw new Error(`File not found: ${fileId}`);
  }

  const filePath = path.join(UPLOADS_DIR, file.filePath);
  const fileBuffer = await readFile(filePath);
  const ext = getFileExtension(file.filePath);

  let parseResult;
  if (ext === '.csv') {
    const content = fileBuffer.toString('utf-8');
    parseResult = parseCSV(content);
  } else {
    parseResult = parseExcel(fileBuffer);
  }

  if (!parseResult.success || !parseResult.data) {
    throw new Error('Failed to parse file');
  }

  return parseResult.data;
}

/**
 * Load data file by type (finds the most recent upload of that type)
 *
 * @deprecated This function is deprecated for employee_master type.
 * Use SQLite database with Drizzle ORM instead:
 *
 * ```ts
 * import { db } from '@/lib/db'
 * import { employees } from '@/db/schema'
 * const employeeData = await db.select().from(employees)
 * ```
 */
export async function loadDataFileByType(fileType: string): Promise<any[] | null> {
  // DEPRECATED: For employee_master, use SQLite instead
  if (fileType === 'employee_master') {
    console.warn(
      '[DEPRECATED] loadDataFileByType("employee_master") is deprecated. ' +
      'Use SQLite database with Drizzle ORM instead. ' +
      'See /lib/db/index.ts for database access.'
    );
    const candidateFiles = [
      resolveDataPath('master-employees.json'),
      resolveDataPath('backups', 'master-employees.backup.json'),
      resolveDataPath('backups', 'master-employees.backup-sources.json'),
    ].filter((file): file is string => Boolean(file));

    for (const filePath of candidateFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (error) {
        console.warn(`Failed to load mock employee data from ${filePath}:`, error);
      }
    }

    console.error('No employee mock data sources were accessible. Checked paths:', candidateFiles);
    return null;
  }

  // For other file types, use metadata
  const metadata = await readMetadata();

  // Find most recent file of this type
  const file = metadata.files
    .filter(f => f.fileType === fileType)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

  if (!file) {
    return null;
  }

  return loadDataFile(file.fileId);
}

/**
 * Join two datasets on employee_id
 */
export function joinData(
  data1: any[],
  data2: any[],
  key: string = 'employee_id'
): any[] {
  const map2 = new Map(data2.map(row => [row[key], row]));

  return data1.map(row1 => ({
    ...row1,
    ...map2.get(row1[key])
  })).filter(row => row[key]); // Filter out rows without matching key
}

/**
 * Group data by a field and count
 */
export function groupByCount(data: any[], field: string): Record<string, number> {
  const grouped: Record<string, number> = {};

  data.forEach(row => {
    const value = row[field] || 'Unknown';
    grouped[value] = (grouped[value] || 0) + 1;
  });

  return grouped;
}

/**
 * Group data by a field and return rows
 */
export function groupBy(data: any[], field: string): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  data.forEach(row => {
    const value = row[field] || 'Unknown';
    if (!grouped[value]) {
      grouped[value] = [];
    }
    grouped[value].push(row);
  });

  return grouped;
}

/**
 * Calculate percentage
 */
export function percentage(numerator: number, denominator: number, decimals: number = 1): number {
  if (denominator === 0) return 0;
  return parseFloat(((numerator / denominator) * 100).toFixed(decimals));
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
  data: any[],
  dateField: string,
  startDate?: Date,
  endDate?: Date
): any[] {
  return data.filter(row => {
    const rowDate = new Date(row[dateField]);
    if (isNaN(rowDate.getTime())) return false;

    if (startDate && rowDate < startDate) return false;
    if (endDate && rowDate > endDate) return false;

    return true;
  });
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (period) {
    case 'last_30_days':
      start.setDate(now.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(now.getDate() - 90);
      break;
    case 'last_12_months':
      start.setMonth(now.getMonth() - 12);
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
    case 'q1':
      start = new Date(now.getFullYear(), 0, 1);
      end.setMonth(2, 31);
      break;
    case 'q2':
      start = new Date(now.getFullYear(), 3, 1);
      end.setMonth(5, 30);
      break;
    case 'q3':
      start = new Date(now.getFullYear(), 6, 1);
      end.setMonth(8, 30);
      break;
    case 'q4':
      start = new Date(now.getFullYear(), 9, 1);
      end.setMonth(11, 31);
      break;
    default:
      // Default to last 12 months
      start.setMonth(now.getMonth() - 12);
  }

  return { start, end };
}
