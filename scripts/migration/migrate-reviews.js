const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MASTER_FILE = path.join(DATA_DIR, 'master-employees.json');
const BACKUP_FILE = path.join(DATA_DIR, 'master-employees.backup.json');

async function migrateReviews() {
  console.log('🔄 Starting review data migration...');

  // Read current data
  const rawData = fs.readFileSync(MASTER_FILE, 'utf-8');
  const employees = JSON.parse(rawData);

  console.log(`📊 Found ${employees.length} employee records`);

  // Create backup
  fs.writeFileSync(BACKUP_FILE, rawData);
  console.log(`💾 Backup created at ${BACKUP_FILE}`);

  // Migrate each employee
  const migratedEmployees = employees.map(emp => {
    const {
      reviewer_id,
      reviewer_name,
      reviewer_title,
      question,
      response,
      review_type,
      current_performance_rating,
      ...restOfEmployee
    } = emp;

    const newEmployee = {
      ...restOfEmployee,
      current_performance_rating
    };

    // If review data exists, convert to array format
    if (review_type || response || reviewer_id) {
      const review = {
        review_id: `${emp.employee_id}_${review_type || 'unknown'}_${Date.now()}`,
        review_type: review_type?.toLowerCase() || 'manager',
        reviewer_id,
        reviewer_name,
        reviewer_title,
        question,
        response,
        rating: current_performance_rating,
        rating_scale: '1-5',
        review_date: emp.survey_response_date || new Date().toISOString()
      };

      newEmployee.performance_reviews = [review];
    }

    return newEmployee;
  });

  // Write migrated data
  fs.writeFileSync(MASTER_FILE, JSON.stringify(migratedEmployees, null, 2));
  console.log(`✅ Migration complete! ${migratedEmployees.length} employees migrated`);
  console.log(`📝 Review arrays created for employees with review data`);
}

migrateReviews().catch(console.error);
