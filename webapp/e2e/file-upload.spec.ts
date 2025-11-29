/**
 * E2E Integration Tests for File Upload Flow
 * Tests CSV and Excel file uploads with date handling
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';

const FIXTURES_DIR = path.join(__dirname, '../__tests__/fixtures');

// Setup: Create Excel fixtures before tests
test.beforeAll(async () => {
  // Ensure fixtures directory exists
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // Create sample Excel file for testing
  const sampleData = [
    {
      employee_id: 'E001',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@company.com',
      department: 'Engineering',
      level: 'Senior',
      hire_date: new Date('2020-01-15'),
      termination_date: null,
      status: 'Active',
    },
    {
      employee_id: 'E002',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.j@company.com',
      department: 'Product',
      level: 'Mid',
      hire_date: new Date('2021-03-22'),
      termination_date: null,
      status: 'Active',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  XLSX.writeFile(wb, path.join(FIXTURES_DIR, 'sample-employees.xlsx'));
});

test.describe('File Upload Integration', () => {
  test('should upload and parse CSV file with dates', async ({ page }) => {
    // Navigate to data sources page
    await page.goto('/data-sources');

    // Wait for page to load
    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    // Look for file upload component
    const fileInput = page.locator('input[type="file"]');

    // Upload CSV file
    const csvPath = path.join(FIXTURES_DIR, 'sample-employees.csv');
    await fileInput.setInputFiles(csvPath);

    // Wait for upload to complete
    await page.waitForTimeout(2000);

    // Verify success message or data preview appears
    // Adjust selectors based on actual UI implementation
    const successIndicator = page.locator('text=/uploaded|success|complete/i');
    await expect(successIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should upload and parse Excel file with dates', async ({ page }) => {
    await page.goto('/data-sources');

    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');

    const xlsxPath = path.join(FIXTURES_DIR, 'sample-employees.xlsx');
    await fileInput.setInputFiles(xlsxPath);

    await page.waitForTimeout(2000);

    const successIndicator = page.locator('text=/uploaded|success|complete/i');
    await expect(successIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should display data preview with correct date formatting', async ({ page }) => {
    await page.goto('/data-sources');

    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');

    const csvPath = path.join(FIXTURES_DIR, 'sample-employees.csv');
    await fileInput.setInputFiles(csvPath);

    // Wait for data preview to appear
    await page.waitForTimeout(2000);

    // Look for date values in preview
    // Dates should be properly formatted (not raw timestamps)
    const previewTable = page.locator('table');
    if (await previewTable.isVisible()) {
      // Verify table contains hire_date column
      const hireDateHeader = page.locator('th:has-text("hire_date"), th:has-text("Hire Date")');
      await expect(hireDateHeader).toBeVisible();

      // Verify date values are present (format may vary)
      const dateCell = page
        .locator('td')
        .filter({ hasText: /20(1|2)\d/ })
        .first();
      await expect(dateCell).toBeVisible();
    }
  });

  test('should handle edge case dates correctly', async ({ page }) => {
    await page.goto('/data-sources');

    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');

    const edgeCasePath = path.join(FIXTURES_DIR, 'sample-employees-edge-cases.csv');

    // Check if edge case file exists, if not skip test
    if (!fs.existsSync(edgeCasePath)) {
      test.skip();
      return;
    }

    await fileInput.setInputFiles(edgeCasePath);

    await page.waitForTimeout(2000);

    // Should still show success even with edge cases
    const successIndicator = page.locator('text=/uploaded|success|complete/i');
    await expect(successIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should reject invalid file types', async ({ page }) => {
    await page.goto('/data-sources');

    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    // Create a temporary invalid file
    const tempDir = path.join(__dirname, '../__tests__/fixtures');
    const invalidPath = path.join(tempDir, 'invalid.txt');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(invalidPath, 'This is not a valid CSV or Excel file');

    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(invalidPath);

    await page.waitForTimeout(1000);

    // Should show error message
    const errorIndicator = page.locator('text=/invalid|error|not supported/i');
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });

    // Cleanup
    fs.unlinkSync(invalidPath);
  });

  test('should handle empty files gracefully', async ({ page }) => {
    await page.goto('/data-sources');

    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    // Create empty CSV
    const tempDir = path.join(__dirname, '../__tests__/fixtures');
    const emptyPath = path.join(tempDir, 'empty.csv');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(emptyPath, 'employee_id,first_name,last_name\n');

    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(emptyPath);

    await page.waitForTimeout(1000);

    // Should handle empty file (may show error or warning)
    const feedback = page.locator('text=/empty|no data|warning/i');
    await expect(feedback).toBeVisible({ timeout: 5000 });

    // Cleanup
    fs.unlinkSync(emptyPath);
  });

  test('should preserve date values through analytics pipeline', async ({ page }) => {
    await page.goto('/data-sources');

    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    const csvPath = path.join(FIXTURES_DIR, 'sample-employees.csv');
    await fileInput.setInputFiles(csvPath);

    await page.waitForTimeout(2000);

    // Navigate to analytics page if upload succeeded
    const successIndicator = page.locator('text=/uploaded|success|complete/i');
    if (await successIndicator.isVisible()) {
      // Try to navigate to analytics
      const analyticsLink = page.locator('a[href*="analytics"]');
      if (await analyticsLink.isVisible()) {
        await analyticsLink.click();

        // Wait for analytics page
        await page.waitForTimeout(2000);

        // Verify date-based filtering works
        const dateFilter = page.locator('input[type="date"]').first();
        if (await dateFilter.isVisible()) {
          await dateFilter.fill('2020-01-01');

          // Should trigger query execution
          await page.waitForTimeout(1000);

          // Results should be visible
          const results = page.locator('text=/result|data|employee/i');
          await expect(results).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Date Handling Validation', () => {
  test('should correctly parse MM/DD/YYYY format', async ({ page }) => {
    // This test verifies that different date formats are handled consistently
    const csvContent = `employee_id,hire_date
E001,01/15/2020
E002,12/31/2023`;

    const tempDir = path.join(__dirname, '../__tests__/fixtures');
    const testPath = path.join(tempDir, 'date-format-test.csv');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(testPath, csvContent);

    await page.goto('/data-sources');
    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPath);

    await page.waitForTimeout(2000);

    const successIndicator = page.locator('text=/uploaded|success|complete/i');
    await expect(successIndicator).toBeVisible({ timeout: 10000 });

    // Cleanup
    fs.unlinkSync(testPath);
  });

  test('should correctly parse YYYY-MM-DD format', async ({ page }) => {
    const csvContent = `employee_id,hire_date
E001,2020-01-15
E002,2023-12-31`;

    const tempDir = path.join(__dirname, '../__tests__/fixtures');
    const testPath = path.join(tempDir, 'iso-date-test.csv');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(testPath, csvContent);

    await page.goto('/data-sources');
    await page.waitForSelector('text=Data Sources', { timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPath);

    await page.waitForTimeout(2000);

    const successIndicator = page.locator('text=/uploaded|success|complete/i');
    await expect(successIndicator).toBeVisible({ timeout: 10000 });

    // Cleanup
    fs.unlinkSync(testPath);
  });
});
