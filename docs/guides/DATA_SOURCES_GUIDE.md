# Data Sources Guide

## Overview

The Data Sources feature allows you to upload your HR data files (CSV/Excel) and use them for analytics and insights. All data is stored locally on your machine and analyzed securely without sending PII (Personally Identifiable Information) to the Claude API.

---

## How to Upload Data

1. **Navigate to Data Sources**
   - Click the "Data Sources" button in the top-right corner of the chat interface
   - Or visit `http://localhost:3001/data-sources`

2. **Select Data Type**
   - Choose the type of data you're uploading from the dropdown:
     - **Employee Master Data**: Core employee information
     - **Compensation Data**: Salary, bonus, equity details
     - **Demographics Data**: Gender, race/ethnicity (for DEI analysis)
     - **Performance Reviews**: Ratings, review dates
     - **Turnover/Exit Data**: Termination dates and reasons
     - **Survey Responses**: Engagement survey results
     - **Skills Data**: Employee skills and proficiency levels
     - **Org Structure**: Department, team, manager relationships

3. **Upload File**
   - Drag and drop your CSV or Excel file
   - Or click to browse and select

4. **Review Results**
   - Check upload success message
   - Review any validation warnings
   - Click "Preview" to see the first 10 rows (PII masked)

---

## Supported File Formats

- **CSV** (`.csv`)
- **Excel** (`.xlsx`, `.xls`)

---

## Data File Schemas

### Employee Master Data

**Required Columns:**
```csv
employee_id, first_name, last_name, email, department, job_title, level, manager_id, hire_date, status, location
```

**Example:**
```csv
employee_id,first_name,last_name,email,department,job_title,level,manager_id,hire_date,status,location
E001,John,Doe,john.doe@company.com,Engineering,Software Engineer,IC3,M123,2022-01-15,Active,San Francisco
E002,Jane,Smith,jane.smith@company.com,Product,Product Manager,IC4,M124,2021-06-10,Active,New York
```

---

### Compensation Data

**Required Columns:**
```csv
employee_id, base_salary, bonus, equity_value, total_comp, currency, effective_date
```

**Optional Columns:**
```csv
salary_range_min, salary_range_max
```

**Example:**
```csv
employee_id,base_salary,bonus,equity_value,total_comp,currency,effective_date
E001,120000,15000,25000,160000,USD,2024-01-01
E002,140000,20000,30000,190000,USD,2024-01-01
```

---

### Demographics Data

**Required Columns:**
```csv
employee_id, gender, race_ethnicity
```

**Optional Columns:**
```csv
veteran_status, disability_status, lgbtq, age_range
```

**Example:**
```csv
employee_id,gender,race_ethnicity
E001,Male,White
E002,Female,Asian
E003,Non-binary,Black
```

**Note:** This data is never sent to Claude API. Only aggregated statistics (e.g., "38% women in engineering") are used for analysis.

---

### Performance Reviews

**Required Columns:**
```csv
employee_id, review_period, rating, rating_scale, reviewer_id, review_date
```

**Optional Columns:**
```csv
promotion_eligible
```

**Example:**
```csv
employee_id,review_period,rating,rating_scale,reviewer_id,review_date
E001,2024 Annual,Exceeds,1-5,M123,2024-12-15
E002,2024 Annual,Meets,1-5,M124,2024-12-15
```

---

### Turnover/Exit Data

**Required Columns:**
```csv
employee_id, termination_date, termination_type, reason_category
```

**Optional Columns:**
```csv
regrettable, exit_survey_score
```

**Example:**
```csv
employee_id,termination_date,termination_type,reason_category
E003,2024-03-15,Voluntary,Compensation
E004,2024-06-30,Voluntary,Career Growth
```

---

## Privacy & Security

### What Stays Local
- ✅ All raw data files are stored in `/data/uploads/` on your machine
- ✅ Employee names, emails, SSNs, and other PII never leave your computer
- ✅ File previews automatically mask PII fields

### What Gets Sent to Claude
- ✅ Only aggregated metrics (averages, percentages, counts)
- ✅ No individual employee records
- ✅ No PII fields

**Example:**
- ❌ **NOT sent:** "John Doe earns $120,000"
- ✅ **Sent:** "Average salary for Software Engineer III is $145,000"

---

## Using Uploaded Data with Skills

Once you upload data, the HR Command Center will automatically detect when you ask analytics questions and use the appropriate data.

### Examples:

**1. Attrition Analysis**
```
User: "What's our attrition rate this year?"

System:
- Checks for employee_master.csv and turnover.csv
- Calculates: 15.2% overall attrition
- Sends to Claude: "Overall attrition is 15.2%. Voluntary: 12.5%, Involuntary: 2.7%"
- Claude responds with insights and recommendations
```

**2. Pay Equity Audit**
```
User: "Run a pay equity analysis for engineers"

System:
- Checks for employee_master.csv, compensation.csv, demographics.csv
- Runs regression analysis
- Finds: Women paid $6,500 below predicted on average
- Sends to Claude: "Gender pay gap of -$6,500 detected"
- Claude provides remediation recommendations
```

**3. DEI Metrics**
```
User: "What's our diversity representation?"

System:
- Checks for employee_master.csv, demographics.csv
- Calculates: 38% women overall, 25% women in engineering
- Sends to Claude: Aggregated representation percentages
- Claude compares to targets and suggests actions
```

---

## File Management

### View Uploaded Files
- Click "Data Sources" button
- See list of all uploaded files with:
  - File name
  - Data type
  - Number of rows
  - Upload date

### Preview Data
- Click the eye icon (👁️) on any file
- View first 10 rows
- PII fields automatically masked

### Delete Files
- Click the trash icon (🗑️) on any file
- Confirm deletion
- File and metadata removed permanently

---

## Troubleshooting

### Upload Fails: "Missing required columns"

**Problem:** Your CSV doesn't have all required columns for the selected data type.

**Solution:**
1. Check the schema requirements above
2. Ensure column names match exactly (e.g., `employee_id` not `EmployeeID`)
3. Columns are case-insensitive and spaces are converted to underscores

---

### Warning: "Detected PII columns"

**Problem:** Your file contains sensitive data like SSN or date of birth.

**Solution:**
- This is just a warning—upload will succeed
- PII fields are automatically masked in previews
- PII is never sent to Claude API
- Consider removing PII columns before upload if you don't need them

---

### Preview Shows "***" for Names

**Problem:** Employee names appear as `***` in preview.

**Solution:**
- This is expected behavior
- Names are masked to protect privacy
- The actual data is intact and used for analysis

---

## Next Steps

Once you've uploaded your data:

1. **Go back to the chat** (click "HR Command Center" logo or navigate to home)
2. **Select a skill** that uses analytics (e.g., HR Metrics Analyst, DEI Program Designer)
3. **Ask questions** and the system will automatically use your data

**Example questions:**
- "What's our attrition rate by department?"
- "Run a pay equity audit for my engineering team"
- "What percentage of women are in leadership?"
- "Who is eligible for promotion this year?"
- "Show me the performance rating distribution"

---

## Data Persistence

- Uploaded files persist across sessions
- Data is stored in `/data/uploads/`
- Metadata tracked in `/data/metadata.json`
- To reset: manually delete files from `/data/uploads/`

---

## Privacy Commitment

**Your data never leaves your machine except for aggregated, anonymized metrics sent to Claude API for interpretation.**

- No individual employee records
- No PII (names, emails, SSNs, DOB)
- Only statistical summaries

---

## Questions?

If you have questions or need help with data formats, refer to the example CSVs or ask in the chat interface!
