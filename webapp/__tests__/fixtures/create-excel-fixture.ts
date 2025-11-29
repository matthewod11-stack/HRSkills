/**
 * Helper script to create Excel test fixtures
 * Run with: npx tsx __tests__/fixtures/create-excel-fixture.ts
 */

import * as path from 'node:path';
import * as XLSX from 'xlsx';

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
  {
    employee_id: 'E003',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'm.chen@company.com',
    department: 'Engineering',
    level: 'Junior',
    hire_date: new Date('2022-11-30'),
    termination_date: null,
    status: 'Active',
  },
  {
    employee_id: 'E004',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    email: 'emily.r@company.com',
    department: 'Sales',
    level: 'Senior',
    hire_date: new Date('2019-05-10'),
    termination_date: new Date('2024-03-15'),
    status: 'Terminated',
  },
  {
    employee_id: 'E005',
    first_name: 'David',
    last_name: 'Kim',
    email: 'd.kim@company.com',
    department: 'Marketing',
    level: 'Mid',
    hire_date: new Date('2023-01-08'),
    termination_date: null,
    status: 'Active',
  },
];

const edgeCaseData = [
  {
    employee_id: 'E101',
    first_name: 'Test',
    last_name: 'User1',
    email: 'test1@company.com',
    department: 'Engineering',
    level: 'Mid',
    hire_date: new Date('2024-03-10'),
    termination_date: null,
    status: 'Active',
  },
  {
    employee_id: 'E102',
    first_name: 'Test',
    last_name: 'User2',
    email: 'test2@company.com',
    department: 'Product',
    level: 'Senior',
    hire_date: new Date('2023-12-31'),
    termination_date: null,
    status: 'Active',
  },
  {
    employee_id: 'E103',
    first_name: 'Test',
    last_name: 'User3',
    email: 'test3@company.com',
    department: 'Sales',
    level: 'Junior',
    hire_date: null,
    termination_date: null,
    status: 'Active',
  },
  {
    employee_id: 'E104',
    first_name: 'Test',
    last_name: 'User4',
    email: 'test4@company.com',
    department: 'Marketing',
    level: 'Mid',
    hire_date: new Date('2024-11-03'),
    termination_date: new Date('2024-11-04'),
    status: 'Terminated',
  },
  {
    employee_id: 'E105',
    first_name: 'Test',
    last_name: 'User5',
    email: 'test5@company.com',
    department: 'HR',
    level: 'Senior',
    hire_date: new Date('2020-02-29'), // Leap year date
    termination_date: null,
    status: 'Active',
  },
];

interface EmployeeRecord {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  level: string;
  hire_date: Date | null;
  termination_date: Date | null;
  status: string;
}

function createExcelFile(data: EmployeeRecord[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const filepath = path.join(__dirname, filename);
  XLSX.writeFile(wb, filepath);
  console.log(`Created ${filepath}`);
}

// Create fixtures
createExcelFile(sampleData, 'sample-employees.xlsx');
createExcelFile(edgeCaseData, 'sample-employees-edge-cases.xlsx');

console.log('Excel fixtures created successfully!');
