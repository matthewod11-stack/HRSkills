const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'master-employees.json');
const BACKUP_PATH = path.join(__dirname, 'data', 'master-employees.backup-sources.json');

console.log('Starting data_sources migration...');

// Read the current data
const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
const employees = JSON.parse(rawData);

console.log(`Found ${employees.length} employees`);

// Create backup
fs.writeFileSync(BACKUP_PATH, rawData);
console.log(`Backup created at: ${BACKUP_PATH}`);

// Migrate each employee
const migratedEmployees = employees.map(emp => {
  // If data_sources doesn't exist, create it from data_source
  if (!emp.data_sources && emp.data_source) {
    return {
      ...emp,
      data_sources: [emp.data_source]
    };
  }
  return emp;
});

// Count migrations
const migrated = migratedEmployees.filter((emp, idx) =>
  !employees[idx].data_sources && emp.data_sources
).length;

console.log(`Migrated ${migrated} employees`);

// Save the migrated data
fs.writeFileSync(DATA_PATH, JSON.stringify(migratedEmployees, null, 2));

console.log('Migration complete!');
console.log(`Updated file: ${DATA_PATH}`);
