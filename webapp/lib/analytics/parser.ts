import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FILE_SCHEMAS, type FileType, PII_FIELDS } from '@/lib/types/data-sources';

/** Generic data row for parsed files */
type ParsedRow = Record<string, string | number | boolean | null | undefined>;

export interface ParseResult {
  success: boolean;
  data?: ParsedRow[];
  columns?: string[];
  rowCount?: number;
  errors?: string[];
}

/**
 * Parse CSV file
 */
export function parseCSV(fileContent: string): ParseResult {
  try {
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (result.errors.length > 0) {
      return {
        success: false,
        errors: result.errors.map((e) => e.message),
      };
    }

    return {
      success: true,
      data: result.data,
      columns: result.meta.fields || [],
      rowCount: result.data.length,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV'],
    };
  }
}

/**
 * Parse Excel file
 */
export function parseExcel(fileBuffer: Buffer): ParseResult {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
      UTC: false,
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        errors: ['Excel file is empty'],
      };
    }

    // Extract columns and normalize
    const firstRow = jsonData[0] as ParsedRow;
    const columns = Object.keys(firstRow).map((col) =>
      col.trim().toLowerCase().replace(/\s+/g, '_')
    );

    // Normalize all row keys
    const normalizedData = jsonData.map((row) => {
      const normalized: ParsedRow = {};
      Object.entries(row as ParsedRow).forEach(([key, value]) => {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        normalized[normalizedKey] = value;
      });
      return normalized;
    });

    return {
      success: true,
      data: normalizedData,
      columns,
      rowCount: normalizedData.length,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse Excel'],
    };
  }
}

/**
 * Validate file schema against expected columns
 */
export function validateSchema(
  columns: string[],
  fileType: FileType
): { valid: boolean; errors: string[] } {
  const expectedColumns = FILE_SCHEMAS[fileType];
  const errors: string[] = [];

  // Check for missing required columns
  const missingColumns = expectedColumns.filter((col) => !columns.includes(col));

  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detect PII in column names
 */
export function detectPIIColumns(columns: string[]): string[] {
  return columns.filter((col) => PII_FIELDS.some((piiField) => col.includes(piiField)));
}

/**
 * Mask PII in data for preview
 */
export function maskPII(data: ParsedRow[]): ParsedRow[] {
  return data.map((row) => {
    const maskedRow: ParsedRow = {};

    Object.entries(row).forEach(([key, value]) => {
      if (PII_FIELDS.some((piiField) => key.includes(piiField))) {
        // Mask PII fields
        if (typeof value === 'string') {
          maskedRow[key] = '***';
        } else {
          maskedRow[key] = null;
        }
      } else {
        maskedRow[key] = value;
      }
    });

    return maskedRow;
  });
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

/**
 * Validate file type
 */
export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.csv', '.xlsx', '.xls'].includes(ext);
}
