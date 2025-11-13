/**
 * eNPS Survey Data Seeding Script
 *
 * Generates realistic eNPS survey data for active employees across multiple quarters.
 * Creates:
 * - Survey scores (0-10)
 * - Survey categories (Promoter/Passive/Detractor)
 * - Survey comments for sentiment analysis
 * - Quarterly trends
 *
 * Usage:
 *   npm run seed:enps              # Generate data for last 4 quarters
 *   npm run seed:enps -- --quarters 8  # Generate data for last 8 quarters
 *   npm run seed:enps -- --dry-run # Preview without writing
 */

import { db } from '../webapp/lib/db';
import { employees, employeeMetrics } from '../webapp/db/schema';
import { eq } from 'drizzle-orm';

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const quartersArg = args.find((arg) => arg.startsWith('--quarters'));
const quartersToGenerate = quartersArg
  ? parseInt(quartersArg.split('=')[1] || args[args.indexOf(quartersArg) + 1] || '4')
  : 4;

console.log('📊 eNPS Survey Data Seeding Script');
console.log('====================================');
console.log(`Generating data for ${quartersToGenerate} quarters`);
if (isDryRun) console.log('🔍 DRY RUN MODE - No data will be written\n');

// Sample positive comments
const positiveComments = [
  'Great company culture and supportive team environment.',
  'Excellent work-life balance and flexible scheduling.',
  'Leadership really cares about employee development.',
  'Love the innovative projects and growth opportunities.',
  'Best team I\'ve ever worked with!',
  'The benefits package is outstanding.',
  'Management is transparent and communicative.',
  'Proud to work here - great mission and values.',
  'Fantastic learning opportunities and career growth.',
  'The company really invests in its people.',
  'Work is challenging but rewarding.',
  'Great compensation and recognition programs.',
  'Strong sense of community and collaboration.',
  'The leadership team is approachable and supportive.',
  'I feel valued and appreciated here.',
];

// Sample neutral comments
const neutralComments = [
  'The job is fine, nothing particularly great or bad.',
  'It\'s a steady paycheck with decent benefits.',
  'Some good days, some challenging days.',
  'The work is what I expected when I joined.',
  'It\'s okay, but there\'s room for improvement.',
  'I appreciate some aspects, but others could be better.',
  'The company has its ups and downs.',
  'Decent place to work overall.',
  'It meets my basic needs for now.',
  'Neither particularly excited nor disappointed.',
];

// Sample negative comments
const negativeComments = [
  'Communication from leadership needs significant improvement.',
  'Work-life balance is poor, too much overtime expected.',
  'Career growth opportunities are limited.',
  'Compensation is below market rate.',
  'Too much micromanagement and bureaucracy.',
  'The workload is unsustainable.',
  'Not enough recognition for hard work.',
  'Decision-making is too slow and unclear.',
  'Outdated technology and tools.',
  'High turnover in my department is concerning.',
  'Lack of transparency from upper management.',
  'Benefits could be much better.',
  'The company culture has deteriorated recently.',
  'Not enough investment in employee development.',
  'Processes are inefficient and frustrating.',
];

/**
 * Generate a quarter string (e.g., "Q3 2024")
 */
function generateQuarter(offsetQuarters: number): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate quarter
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  // Adjust for offset
  let targetQuarter = currentQuarter - offsetQuarters;
  let targetYear = currentYear;

  while (targetQuarter <= 0) {
    targetQuarter += 4;
    targetYear -= 1;
  }

  while (targetQuarter > 4) {
    targetQuarter -= 4;
    targetYear += 1;
  }

  return `Q${targetQuarter} ${targetYear}`;
}

/**
 * Generate eNPS score with realistic distribution
 * Returns a score weighted towards promoters (realistic for most companies)
 */
function generateScore(): number {
  const rand = Math.random();

  // 50% promoters (9-10)
  if (rand < 0.5) {
    return Math.random() < 0.6 ? 9 : 10;
  }
  // 30% passives (7-8)
  else if (rand < 0.8) {
    return Math.random() < 0.5 ? 7 : 8;
  }
  // 20% detractors (0-6)
  else {
    return Math.floor(Math.random() * 7); // 0-6
  }
}

/**
 * Categorize score into Promoter/Passive/Detractor
 */
function categorizeScore(score: number): string {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

/**
 * Generate a comment based on score
 */
function generateComment(score: number): string {
  if (score >= 9) {
    // Promoters
    return positiveComments[Math.floor(Math.random() * positiveComments.length)];
  } else if (score >= 7) {
    // Passives
    return neutralComments[Math.floor(Math.random() * neutralComments.length)];
  } else {
    // Detractors
    return negativeComments[Math.floor(Math.random() * negativeComments.length)];
  }
}

/**
 * Generate survey response date within a quarter
 */
function generateResponseDate(quarter: string): string {
  const [q, year] = quarter.split(' ');
  const quarterNum = parseInt(q.replace('Q', ''));

  // Calculate start month (0-indexed)
  const startMonth = (quarterNum - 1) * 3;

  // Random day within the quarter (survey typically happens mid-quarter)
  const monthOffset = Math.floor(Math.random() * 3);
  const dayOffset = Math.floor(Math.random() * 28) + 1;

  const date = new Date(parseInt(year), startMonth + monthOffset, dayOffset);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function seedENPSData() {
  try {
    // Get all active employees
    const activeEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.status, 'active'));

    if (activeEmployees.length === 0) {
      console.error('❌ No active employees found. Please seed employee data first.');
      process.exit(1);
    }

    console.log(`Found ${activeEmployees.length} active employees\n`);

    const surveyData: any[] = [];
    let totalInserted = 0;

    // Generate data for each quarter
    for (let quarterOffset = 0; quarterOffset < quartersToGenerate; quarterOffset++) {
      const quarter = generateQuarter(quarterOffset);
      console.log(`Generating survey data for ${quarter}...`);

      // Participation rate: 70-90% (more recent quarters have higher participation)
      const participationRate = 0.7 + (quarterOffset === 0 ? 0.2 : Math.random() * 0.1);
      const participatingEmployees = activeEmployees.filter(
        () => Math.random() < participationRate
      );

      console.log(`  Participation: ${participatingEmployees.length}/${activeEmployees.length} (${Math.round(participationRate * 100)}%)`);

      let promoters = 0;
      let passives = 0;
      let detractors = 0;

      for (const employee of participatingEmployees) {
        const score = generateScore();
        const category = categorizeScore(score);
        const comment = generateComment(score);
        const responseDate = generateResponseDate(quarter);

        // Count categories
        if (category === 'Promoter') promoters++;
        else if (category === 'Passive') passives++;
        else detractors++;

        const metricDate = responseDate; // Use survey date as metric date

        surveyData.push({
          employeeId: employee.id,
          metricDate,
          enpsScore: score,
          surveyQuarter: quarter,
          surveyResponseDate: responseDate,
          surveyCategory: category,
          surveyComment: comment,
          // Sentiment will be null initially (to be analyzed by AI)
          sentiment: null,
          sentimentConfidence: null,
          sentimentAnalyzedAt: null,
        });
      }

      const enpsScore = Math.round(
        ((promoters - detractors) / participatingEmployees.length) * 100
      );

      console.log(`  eNPS Score: ${enpsScore >= 0 ? '+' : ''}${enpsScore}`);
      console.log(`  Breakdown: ${promoters} Promoters, ${passives} Passives, ${detractors} Detractors\n`);
    }

    if (isDryRun) {
      console.log(`\n🔍 DRY RUN: Would insert ${surveyData.length} survey responses`);
      console.log('Sample data:');
      console.log(JSON.stringify(surveyData.slice(0, 3), null, 2));
      return;
    }

    // Insert data in batches
    const batchSize = 50;
    for (let i = 0; i < surveyData.length; i += batchSize) {
      const batch = surveyData.slice(i, i + batchSize);

      await Promise.all(
        batch.map((data) =>
          db
            .insert(employeeMetrics)
            .values(data)
            .onConflictDoUpdate({
              target: [employeeMetrics.employeeId, employeeMetrics.metricDate],
              set: {
                enpsScore: data.enpsScore,
                surveyQuarter: data.surveyQuarter,
                surveyResponseDate: data.surveyResponseDate,
                surveyCategory: data.surveyCategory,
                surveyComment: data.surveyComment,
              },
            })
        )
      );

      totalInserted += batch.length;
      process.stdout.write(`\rInserting: ${totalInserted}/${surveyData.length}`);
    }

    console.log(`\n\n✅ Successfully seeded ${totalInserted} eNPS survey responses`);
    console.log('\n📝 Next steps:');
    console.log('  1. View eNPS data in the dashboard');
    console.log('  2. Click the "Employee Satisfaction (eNPS)" tile');
    console.log('  3. Run sentiment analysis: POST /api/analytics/enps-sentiment');
    console.log('\nExample chat queries:');
    console.log('  - "Show me eNPS trends"');
    console.log('  - "What is our employee satisfaction score?"');
    console.log('  - "Display eNPS by department"');
  } catch (error) {
    console.error('\n❌ Error seeding eNPS data:', error);
    process.exit(1);
  }
}

// Run the script
seedENPSData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
