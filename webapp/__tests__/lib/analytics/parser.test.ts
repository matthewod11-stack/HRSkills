/**
 * Unit tests for analytics parser functions
 * Tests CSV and Excel parsing with focus on date handling
 */
import { parseCSV, parseExcel, validateSchema, detectPIIColumns, maskPII } from '@/lib/analytics/parser';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

describe('Analytics Parser', () => {
  describe('parseCSV', () => {
    it('should parse CSV with various date formats', () => {
      const csvContent = `employee_id,first_name,last_name,hire_date,termination_date
E001,John,Smith,2020-01-15,
E002,Sarah,Johnson,03/22/2021,
E003,Michael,Chen,2022-11-30,2024-10-31`;

      const result = parseCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.columns).toContain('hire_date');
      expect(result.columns).toContain('termination_date');
    });

    it('should handle empty date fields', () => {
      const csvContent = `employee_id,first_name,hire_date,termination_date
E001,John,2020-01-15,
E002,Sarah,,`;

      const result = parseCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      // Empty fields should be null or empty
      expect(result.data![1].termination_date).toBeFalsy();
    });

    it('should normalize column names', () => {
      const csvContent = `Employee ID,First Name,Last Name,Hire Date
E001,John,Smith,2020-01-15`;

      const result = parseCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.columns).toEqual([
        'employee_id',
        'first_name',
        'last_name',
        'hire_date'
      ]);
    });

    it('should handle empty CSV', () => {
      const csvContent = '';

      const result = parseCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle malformed CSV', () => {
      const csvContent = 'employee_id,first_name\nE001\nE002,Sarah,Extra,Columns';

      const result = parseCSV(csvContent);

      // PapaParse handles malformed CSV gracefully
      expect(result.success).toBe(true);
    });
  });

  describe('parseExcel', () => {
    it('should parse Excel file with dates', () => {
      // Create a simple workbook with dates
      const data = [
        {
          employee_id: 'E001',
          first_name: 'John',
          last_name: 'Smith',
          hire_date: new Date('2020-01-15'),
          termination_date: null
        },
        {
          employee_id: 'E002',
          first_name: 'Sarah',
          last_name: 'Johnson',
          hire_date: new Date('2021-03-22'),
          termination_date: null
        }
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.columns).toContain('employee_id');
      expect(result.columns).toContain('hire_date');

      // Dates should be parsed (format depends on xlsx settings)
      expect(result.data![0].hire_date).toBeTruthy();
      expect(result.data![1].hire_date).toBeTruthy();
    });

    it('should handle Excel file with null dates', () => {
      const data = [
        {
          employee_id: 'E001',
          first_name: 'John',
          hire_date: new Date('2020-01-15'),
          termination_date: null
        },
        {
          employee_id: 'E002',
          first_name: 'Sarah',
          hire_date: null,
          termination_date: null
        }
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].hire_date).toBeTruthy();
      expect(result.data![1].hire_date).toBeNull();
    });

    it('should handle leap year dates correctly', () => {
      const data = [
        {
          employee_id: 'E001',
          first_name: 'Leap',
          hire_date: new Date('2020-02-29') // Leap year
        }
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer);

      expect(result.success).toBe(true);
      expect(result.data![0].hire_date).toBeTruthy();
    });

    it('should normalize column names', () => {
      const data = [
        {
          'Employee ID': 'E001',
          'First Name': 'John',
          'Hire Date': new Date('2020-01-15')
        }
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer);

      expect(result.success).toBe(true);
      expect(result.columns).toEqual([
        'employee_id',
        'first_name',
        'hire_date'
      ]);
    });

    it('should handle empty Excel file', () => {
      const ws = XLSX.utils.aoa_to_sheet([]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empty');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Excel file is empty');
    });

    it('should handle corrupted buffer gracefully', () => {
      const corruptedBuffer = Buffer.from('not a valid excel file');

      const result = parseExcel(corruptedBuffer);

      expect(result.success).toBe(false);
      expect(result.errors).toBeTruthy();
      expect(result.errors![0]).toContain('Failed to parse Excel');
    });

    it('should handle dates around DST transitions', () => {
      // DST typically occurs in March and November
      const data = [
        {
          employee_id: 'E001',
          event: 'Spring Forward',
          date: new Date('2024-03-10') // DST start in US
        },
        {
          employee_id: 'E002',
          event: 'Fall Back',
          date: new Date('2024-11-03') // DST end in US
        }
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].date).toBeTruthy();
      expect(result.data![1].date).toBeTruthy();
    });
  });

  describe('validateSchema', () => {
    it('should validate employee master schema', () => {
      const columns = ['employee_id', 'first_name', 'last_name', 'email', 'department', 'level'];

      const result = validateSchema(columns, 'employee_master');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing columns', () => {
      const columns = ['employee_id', 'first_name']; // Missing required columns

      const result = validateSchema(columns, 'employee_master');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required columns');
    });
  });

  describe('detectPIIColumns', () => {
    it('should detect PII columns', () => {
      const columns = ['employee_id', 'first_name', 'last_name', 'email', 'ssn', 'phone'];

      const piiColumns = detectPIIColumns(columns);

      expect(piiColumns).toContain('email');
      expect(piiColumns).toContain('ssn');
    });

    it('should handle columns without PII', () => {
      const columns = ['employee_id', 'department', 'level', 'hire_date'];

      const piiColumns = detectPIIColumns(columns);

      expect(piiColumns).toHaveLength(0);
    });
  });

  describe('maskPII', () => {
    it('should mask PII fields', () => {
      const data = [
        {
          employee_id: 'E001',
          first_name: 'John',
          email: 'john@company.com',
          ssn: '123-45-6789'
        }
      ];

      const masked = maskPII(data);

      expect(masked[0].employee_id).toBe('E001');
      expect(masked[0].first_name).toBe('John');
      expect(masked[0].email).toBe('***');
      expect(masked[0].ssn).toBe('***');
    });

    it('should handle non-string PII values', () => {
      const data = [
        {
          employee_id: 'E001',
          email: null
        }
      ];

      const masked = maskPII(data);

      expect(masked[0].email).toBeNull();
    });
  });
});
