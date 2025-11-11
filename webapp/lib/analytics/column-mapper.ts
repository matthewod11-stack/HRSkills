import stringSimilarity from 'string-similarity';
import { CANONICAL_FIELDS, ColumnMapping, FieldMetadata } from '../types/master-employee';

/**
 * Normalize column name for matching
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, ' ') // Replace underscores, hyphens, spaces with single space
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

/**
 * Detect data type from sample values
 */
function detectDataType(values: any[]): string {
  if (values.length === 0) return 'string';

  // Remove null/undefined values
  const validValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (validValues.length === 0) return 'string';

  // Check if all values are numbers
  const allNumbers = validValues.every((v) => !isNaN(Number(v)));
  if (allNumbers) return 'number';

  // Check if all values are booleans
  const booleanValues = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'];
  const allBooleans = validValues.every((v) => booleanValues.includes(String(v).toLowerCase()));
  if (allBooleans) return 'boolean';

  // Check if values look like dates
  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}|^\d{2}-\d{2}-\d{4}/;
  const allDates = validValues.every((v) => datePattern.test(String(v)));
  if (allDates) return 'date';

  // Check if values look like arrays (comma-separated)
  const allArrays = validValues.every((v) => String(v).includes(',') || String(v).includes(';'));
  if (allArrays) return 'array';

  return 'string';
}

/**
 * Smart mapping of upload columns to canonical fields
 */
export function mapColumnsToCanonical(
  uploadColumns: string[],
  sampleData: Record<string, any>[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  for (const sourceColumn of uploadColumns) {
    const normalized = normalizeColumnName(sourceColumn);

    // Extract sample values for this column
    const sampleValues = sampleData.map((row) => row[sourceColumn]).slice(0, 10);

    const detectedType = detectDataType(sampleValues);

    // Try to find best canonical field match
    let bestMatch: { field: string; confidence: number } | null = null;
    let highestScore = 0;

    for (const [fieldName, fieldMeta] of Object.entries(CANONICAL_FIELDS)) {
      // Check exact match first
      if (normalized === normalizeColumnName(fieldMeta.canonical_name)) {
        bestMatch = { field: fieldName, confidence: 1.0 };
        break;
      }

      // Check aliases
      for (const alias of fieldMeta.aliases) {
        const normalizedAlias = normalizeColumnName(alias);

        // Exact alias match
        if (normalized === normalizedAlias) {
          bestMatch = { field: fieldName, confidence: 1.0 };
          break;
        }

        // Fuzzy match using string similarity
        const similarity = stringSimilarity.compareTwoStrings(normalized, normalizedAlias);
        if (similarity > highestScore) {
          highestScore = similarity;
          bestMatch = { field: fieldName, confidence: similarity };
        }
      }

      if (bestMatch && bestMatch.confidence === 1.0) break;
    }

    // Only accept matches with confidence > 0.7
    const MIN_CONFIDENCE = 0.7;
    const mapping: ColumnMapping = {
      source_column: sourceColumn,
      canonical_field: bestMatch && bestMatch.confidence >= MIN_CONFIDENCE ? bestMatch.field : null,
      confidence: bestMatch ? bestMatch.confidence : 0,
      is_custom: !bestMatch || bestMatch.confidence < MIN_CONFIDENCE,
      data_type: detectedType,
      sample_values: sampleValues.slice(0, 3),
    };

    mappings.push(mapping);
  }

  return mappings;
}

/**
 * Validate employee ID exists in data
 */
export function findEmployeeIdColumn(mappings: ColumnMapping[]): string | null {
  const employeeIdMapping = mappings.find((m) => m.canonical_field === 'employee_id');
  return employeeIdMapping?.source_column || null;
}

/**
 * Split full name into first and last names
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return { first_name: '', last_name: '' };
  } else if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  } else {
    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
    };
  }
}

/**
 * Apply column mappings to transform row data
 */
export function applyMapping(
  row: Record<string, any>,
  mappings: ColumnMapping[]
): Record<string, any> {
  const transformed: Record<string, any> = {};

  for (const mapping of mappings) {
    const value = row[mapping.source_column];

    if (mapping.canonical_field) {
      // Map to canonical field
      transformed[mapping.canonical_field] = value;

      // Special handling: if full_name mapped but no first/last, split it
      if (mapping.canonical_field === 'full_name' && value) {
        const { first_name, last_name } = splitFullName(String(value));
        if (!transformed.first_name) transformed.first_name = first_name;
        if (!transformed.last_name) transformed.last_name = last_name;
      }
    } else if (mapping.is_custom) {
      // Store in custom_fields
      if (!transformed.custom_fields) {
        transformed.custom_fields = {};
      }
      transformed.custom_fields[mapping.source_column] = value;
    }
  }

  // Auto-generate full_name if we have first + last but not full
  if (!transformed.full_name && (transformed.first_name || transformed.last_name)) {
    transformed.full_name = [transformed.first_name, transformed.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // Add metadata
  transformed.updated_at = new Date().toISOString();

  return transformed;
}

/**
 * Generate a unique employee ID if missing
 */
export function generateEmployeeId(): string {
  // Generate format: EMP-XXXXXX (6 random alphanumeric chars)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'EMP-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Infer employee ID from row data if not explicitly mapped
 */
export function inferEmployeeId(row: Record<string, any>): string | null {
  // Try common patterns
  const possibleIdFields = [
    'employee_id',
    'employeeid',
    'emp_id',
    'empid',
    'id',
    'hris_id',
    'hrisid',
    'user_id',
    'userid',
    'email',
  ];

  for (const field of possibleIdFields) {
    const value = row[field];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }

  // If email exists, use that as fallback
  if (row.email && String(row.email).trim()) {
    return String(row.email).trim();
  }

  return null;
}
