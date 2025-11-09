#!/usr/bin/env tsx

/**
 * Phase 2: JSON to SQLite Migration Script
 *
 * This script migrates employee data from the Phase 1 JSON file storage
 * to the Phase 2 SQLite database.
 *
 * Features:
 * - Backup existing data before migration
 * - Transform nested JSON to normalized tables
 * - Generate demo data if no existing data found
 * - Validate data integrity after migration
 *
 * Usage:
 *   npm run migrate:json-to-sqlite
 *   npm run migrate:json-to-sqlite -- --dry-run  # Preview without writing
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getDatabase, closeDatabase, getDbStats } from '../webapp/lib/db';
import {
  employees,
  employeeMetrics,
  performanceReviews,
  type NewEmployee,
  type NewEmployeeMetric,
  type NewPerformanceReview,
} from '../webapp/db/schema';
import { randomUUID } from 'crypto';

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const MASTER_DATA_PATH = path.join(DATA_DIR, 'master-employees.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// CLI arguments
const isDryRun = process.argv.includes('--dry-run');

interface MasterEmployeeRecord {
  employee_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  level?: string;
  manager_id?: string | null;
  hire_date: string;
  termination_date?: string | null;
  status: 'active' | 'terminated' | 'leave';
  location?: string;
  gender?: string;
  race_ethnicity?: string;
  employee_type?: string;
  updated_at?: string;
  created_at?: string;
  data_source?: string;
  data_sources?: string[];
  enps_score?: number;
  survey_quarter?: string;
  survey_response_date?: string;
  survey_category?: string;
  performance_reviews?: PerformanceReviewJSON[];
  current_performance_rating?: number;
  [key: string]: any; // Additional fields
}

interface PerformanceReviewJSON {
  review_id: string;
  review_type: string;
  response: string;
  rating?: number;
  rating_scale?: string;
  review_date: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_title?: string;
  question?: string;
}

async function main() {
  console.log('🚀 HR Command Center: JSON → SQLite Migration\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be written\n');
  }

  try {
    // Step 1: Backup existing data
    await backupExistingData();

    // Step 2: Load source data
    const sourceData = await loadSourceData();

    // Step 3: Transform and migrate
    await migrateData(sourceData);

    // Step 4: Validate migration
    await validateMigration();

    // Step 5: Show statistics
    await showStatistics();

    console.log('\n✅ Migration completed successfully!');

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. No data was actually written.');
      console.log('   Run without --dry-run to perform the migration.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

/**
 * Backup existing JSON data
 */
async function backupExistingData() {
  console.log('📦 Step 1: Backing up existing data...');

  if (!existsSync(MASTER_DATA_PATH)) {
    console.log('   No existing data to backup (fresh install)');
    return;
  }

  // Create backup directory
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `master-employees-${timestamp}.json`);

  if (!isDryRun) {
    const data = await readFile(MASTER_DATA_PATH, 'utf-8');
    await writeFile(backupPath, data);
  }

  console.log(`   ✓ Backup created: ${backupPath}`);
}

/**
 * Load source data from JSON
 */
async function loadSourceData(): Promise<MasterEmployeeRecord[]> {
  console.log('\n📂 Step 2: Loading source data...');

  if (!existsSync(MASTER_DATA_PATH)) {
    console.log('   No existing data found. Generating demo data...');
    return generateDemoData();
  }

  const content = await readFile(MASTER_DATA_PATH, 'utf-8');
  const data = JSON.parse(content);

  // Support both array and {employees: [...]} formats
  const records = Array.isArray(data) ? data : data.employees || [];

  console.log(`   ✓ Loaded ${records.length} employee records`);
  return records;
}

/**
 * Generate demo data (100 realistic employees)
 */
function generateDemoData(): MasterEmployeeRecord[] {
  console.log('   Generating 100 demo employees...');

  const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations'];
  const locations = ['San Francisco', 'New York', 'Austin', 'Remote', 'London', 'Singapore'];
  const firstNames = ['Sarah', 'Marcus', 'Emily', 'James', 'Maria', 'David', 'Jennifer', 'Michael', 'Lisa', 'Robert'];
  const lastNames = ['Chen', 'Johnson', 'Garcia', 'Smith', 'Rodriguez', 'Martinez', 'Williams', 'Brown', 'Jones', 'Davis'];

  const employees: MasterEmployeeRecord[] = [];

  for (let i = 1; i <= 100; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const department = departments[i % departments.length];

    employees.push({
      employee_id: `EMP${String(i).padStart(3, '0')}`,
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@hrskills.demo`,
      department,
      job_title: `${department} ${i % 3 === 0 ? 'Senior' : i % 2 === 0 ? 'Mid-Level' : 'Junior'} Professional`,
      level: i % 3 === 0 ? 'Senior' : i % 2 === 0 ? 'Mid' : 'Junior',
      manager_id: i > 1 ? `EMP${String(Math.max(1, i - 10)).padStart(3, '0')}` : null,
      hire_date: new Date(2020 + (i % 5), i % 12, 1).toISOString().split('T')[0],
      status: i % 20 === 0 ? 'terminated' : 'active',
      location: locations[i % locations.length],
      gender: i % 2 === 0 ? 'Female' : 'Male',
      employee_type: 'Full-time',
      enps_score: Math.floor(Math.random() * 21) - 10, // -10 to 10
      survey_quarter: 'Q1 2025',
      survey_response_date: new Date(2025, 0, i % 28 + 1).toISOString().split('T')[0],
      survey_category: (i % 3 === 0) ? 'Promoter' : (i % 3 === 1) ? 'Passive' : 'Detractor',
      current_performance_rating: 1 + Math.floor(Math.random() * 5), // 1-5
      performance_reviews: [
        {
          review_id: randomUUID(),
          review_type: 'manager',
          review_date: new Date(2024, 11, i % 28 + 1).toISOString().split('T')[0],
          response: 'Solid performer, meeting all expectations.',
          rating: 1 + Math.floor(Math.random() * 5),
          rating_scale: '1-5',
        }
      ],
      data_sources: ['Demo Data'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`   ✓ Generated ${employees.length} demo employees`);
  return employees;
}

/**
 * Migrate data to SQLite
 */
async function migrateData(records: MasterEmployeeRecord[]) {
  console.log(`\n💾 Step 3: Migrating ${records.length} employees to SQLite...`);

  const db = getDatabase();

  let employeeCount = 0;
  let metricCount = 0;
  let reviewCount = 0;

  for (const record of records) {
    // Transform employee record
    const employee: NewEmployee = {
      id: record.employee_id,
      email: record.email,
      fullName: record.full_name,
      firstName: record.first_name,
      lastName: record.last_name,
      department: record.department,
      jobTitle: record.job_title,
      level: record.level || null,
      managerId: record.manager_id || null,
      location: record.location || null,
      employmentType: record.employee_type || 'Full-time',
      hireDate: record.hire_date,
      terminationDate: record.termination_date || null,
      status: record.status,
      gender: record.gender || null,
      raceEthnicity: record.race_ethnicity || null,
      compensationCurrency: 'USD',
      compensationBase: null,
      dataSources: JSON.stringify(record.data_sources || []),
      attributes: JSON.stringify({
        originalData: Object.keys(record).reduce((acc, key) => {
          if (!['employee_id', 'full_name', 'first_name', 'last_name', 'email',
                'department', 'job_title', 'level', 'manager_id', 'hire_date',
                'termination_date', 'status', 'location', 'gender', 'race_ethnicity',
                'employee_type', 'enps_score', 'survey_quarter', 'survey_response_date',
                'survey_category', 'performance_reviews', 'current_performance_rating',
                'data_sources'].includes(key)) {
            acc[key] = record[key];
          }
          return acc;
        }, {} as Record<string, any>),
      }),
      createdAt: record.created_at || new Date().toISOString(),
      updatedAt: record.updated_at || new Date().toISOString(),
    };

    if (!isDryRun) {
      await db.insert(employees).values(employee).onConflictDoUpdate({
        target: employees.id,
        set: employee,
      });
    }
    employeeCount++;

    // Create metric record if engagement data exists
    if (record.enps_score !== undefined || record.current_performance_rating) {
      const metricDate = record.survey_response_date || record.hire_date;

      const metric: NewEmployeeMetric = {
        employeeId: record.employee_id,
        metricDate,
        enpsScore: record.enps_score || null,
        surveyQuarter: record.survey_quarter || null,
        surveyResponseDate: record.survey_response_date || null,
        surveyCategory: record.survey_category || null,
        performanceRating: record.current_performance_rating || null,
        flightRisk: null, // Will be calculated by analytics
        flightRiskLevel: null,
        performanceForecast: null,
        promotionReadiness: null,
      };

      if (!isDryRun) {
        await db.insert(employeeMetrics).values(metric).onConflictDoNothing();
      }
      metricCount++;
    }

    // Migrate performance reviews
    if (record.performance_reviews && Array.isArray(record.performance_reviews)) {
      for (const review of record.performance_reviews) {
        const performanceReview: NewPerformanceReview = {
          id: review.review_id,
          employeeId: record.employee_id,
          reviewType: review.review_type,
          reviewDate: review.review_date,
          reviewerId: review.reviewer_id || null,
          reviewerName: review.reviewer_name || null,
          reviewerTitle: review.reviewer_title || null,
          question: review.question || null,
          response: review.response,
          rating: review.rating || null,
          ratingScale: review.rating_scale || null,
          createdAt: new Date().toISOString(),
        };

        if (!isDryRun) {
          await db.insert(performanceReviews).values(performanceReview).onConflictDoNothing();
        }
        reviewCount++;
      }
    }
  }

  console.log(`   ✓ Migrated ${employeeCount} employees`);
  console.log(`   ✓ Created ${metricCount} metric records`);
  console.log(`   ✓ Migrated ${reviewCount} performance reviews`);
}

/**
 * Validate migration
 */
async function validateMigration() {
  console.log('\n✅ Step 4: Validating migration...');

  if (isDryRun) {
    console.log('   Skipping validation (dry run mode)');
    return;
  }

  const stats = getDbStats();

  if (!stats) {
    throw new Error('Failed to get database statistics');
  }

  console.log(`   ✓ Employees: ${stats.employees.count}`);
  console.log(`   ✓ Metrics: ${stats.metrics.count}`);
  console.log(`   ✓ Reviews: ${stats.reviews.count}`);

  if (stats.employees.count === 0) {
    throw new Error('Migration failed: No employees in database');
  }
}

/**
 * Show statistics
 */
async function showStatistics() {
  console.log('\n📊 Step 5: Migration Statistics');

  if (isDryRun) {
    console.log('   (Statistics not available in dry run mode)');
    return;
  }

  const stats = getDbStats();

  if (!stats) {
    return;
  }

  console.log('\n   Database Contents:');
  console.log(`   - Employees:        ${stats.employees.count.toLocaleString()}`);
  console.log(`   - Metrics:          ${stats.metrics.count.toLocaleString()}`);
  console.log(`   - Reviews:          ${stats.reviews.count.toLocaleString()}`);
  console.log(`   - Conversations:    ${stats.conversations.count.toLocaleString()}`);
  console.log(`   - Actions:          ${stats.actions.count.toLocaleString()}`);
  console.log(`   - Documents:        ${stats.documents.count.toLocaleString()}`);
  console.log(`   - Insights:         ${stats.insights.count.toLocaleString()}`);

  const dbSizeMB = (stats.dbSize / 1024 / 1024).toFixed(2);
  console.log(`\n   Database Size:      ${dbSizeMB} MB`);
}

// Run migration
main();
