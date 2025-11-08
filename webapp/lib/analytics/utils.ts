import { readFile } from 'fs/promises';
import path from 'path';
import { parseCSV, parseExcel, getFileExtension } from './parser';
import { DataFile, DataMetadata } from '@/lib/types/data-sources';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const METADATA_PATH = path.join(DATA_DIR, 'metadata.json');

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
 */
export async function loadDataFileByType(fileType: string): Promise<any[] | null> {
  // For employee_master, load from the master-employees.json file
  if (fileType === 'employee_master') {
    try {
      const masterFilePath = path.join(DATA_DIR, 'master-employees.json');
      const content = await readFile(masterFilePath, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load master employees:', error);
      return null;
    }
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
