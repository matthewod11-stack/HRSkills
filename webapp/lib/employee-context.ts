/**
 * Intelligent employee data context generation
 * Only includes relevant employee data based on the query to reduce token costs
 */

export interface Employee {
  employee_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  department?: string;
  manager_name?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Determines if a query needs employee data
 */
export function needsEmployeeData(query: string): boolean {
  const patterns = [
    /\bshow\b/i,
    /\blist\b/i,
    /\bfind\b/i,
    /\bwho\b/i,
    /\bcount\b/i,
    /\banalyze\b/i,
    /\bhow many\b/i,
    /\bemployee(s)?\b/i,
    /\bteam\b/i,
    /\bdepartment\b/i,
    /\bmanager\b/i,
    /\breport(s|ing)?\b/i,
  ];

  return patterns.some((pattern) => pattern.test(query));
}

/**
 * Filters employees based on query context
 */
export function filterRelevantEmployees(employees: Employee[], query: string): Employee[] {
  const queryLower = query.toLowerCase();

  // Extract department mentions
  const departments = [
    'engineering',
    'eng',
    'product',
    'design',
    'marketing',
    'sales',
    'finance',
    'hr',
    'operations',
    'ops',
    'legal',
  ];

  for (const dept of departments) {
    if (queryLower.includes(dept)) {
      const filtered = employees.filter((emp) => emp.department?.toLowerCase().includes(dept));
      if (filtered.length > 0) {
        return filtered;
      }
    }
  }

  // Extract name mentions (First Last format)
  const nameMatch = query.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
  if (nameMatch) {
    const name = nameMatch[1];
    const filtered = employees.filter((emp) => {
      const fullName = emp.full_name || `${emp.first_name} ${emp.last_name}`;
      return fullName.includes(name);
    });
    if (filtered.length > 0) {
      return filtered;
    }
  }

  // Extract job title mentions
  const titlePatterns = ['manager', 'engineer', 'designer', 'director', 'vp', 'ceo', 'cto', 'cfo'];
  for (const title of titlePatterns) {
    if (queryLower.includes(title)) {
      const filtered = employees.filter((emp) => emp.job_title?.toLowerCase().includes(title));
      if (filtered.length > 0) {
        return filtered.slice(0, 50); // Limit to 50
      }
    }
  }

  // Default: return all (will be limited by caller)
  return employees;
}

/**
 * Analyzes query to determine which employee fields are relevant
 * Uses semantic keyword matching to minimize token usage
 */
export function analyzeRequiredFields(query: string): string[] {
  const queryLower = query.toLowerCase();
  const requiredFields = new Set<string>(['employee_id', 'full_name', 'first_name', 'last_name']);

  // Field pattern mapping - what keywords indicate which fields are needed
  const fieldPatterns: Record<string, string[]> = {
    // Job & Role
    job_title: ['title', 'role', 'position', 'job'],
    department: ['department', 'dept', 'team', 'org', 'division'],
    manager_name: ['manager', 'reports to', 'supervisor', 'boss', 'reporting'],
    level: ['level', 'seniority', 'grade', 'band'],

    // Compensation
    salary: ['salary', 'pay', 'compensation', 'comp', 'earnings'],
    base_salary: ['base', 'base pay', 'base salary'],
    bonus: ['bonus', 'incentive', 'variable pay'],
    equity: ['equity', 'stock', 'rsu', 'options'],
    total_compensation: ['total comp', 'total compensation', 'tc'],

    // Time & Status
    hire_date: ['tenure', 'hire date', 'start date', 'hired', 'joined', 'anniversary'],
    termination_date: ['termination', 'terminated', 'left', 'exit', 'departure'],
    status: ['status', 'active', 'terminated', 'inactive', 'employment status'],

    // Demographics (for DEI analysis)
    gender: ['gender', 'women', 'men', 'diversity', 'dei', 'female', 'male'],
    ethnicity: ['ethnicity', 'race', 'diversity', 'dei', 'underrepresented', 'demographic'],
    location: ['location', 'office', 'site', 'remote', 'geo', 'where'],
    age: ['age', 'generation', 'generational'],

    // Performance
    performance_rating: ['performance', 'rating', 'review', 'evaluation', 'score'],
    promotion_date: ['promotion', 'promoted', 'advancement'],
    last_review_date: ['review', 'last review', 'performance review'],

    // Contact
    email: ['email', 'contact', 'reach'],
    phone: ['phone', 'contact', 'call'],
  };

  // Score each field based on query content
  for (const [field, keywords] of Object.entries(fieldPatterns)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        requiredFields.add(field);
        break;
      }
    }
  }

  // Context-aware additions
  if (queryLower.includes('turnover') || queryLower.includes('attrition')) {
    requiredFields.add('hire_date');
    requiredFields.add('termination_date');
    requiredFields.add('status');
  }

  if (queryLower.includes('headcount') || queryLower.includes('count')) {
    // For simple counts, only need minimal fields
    return ['employee_id', 'status', 'department'];
  }

  if (queryLower.includes('diversity') || queryLower.includes('dei')) {
    requiredFields.add('gender');
    requiredFields.add('ethnicity');
    requiredFields.add('department');
    requiredFields.add('level');
  }

  if (queryLower.includes('tenure') || queryLower.includes('retention')) {
    requiredFields.add('hire_date');
    requiredFields.add('department');
    requiredFields.add('manager_name');
  }

  return Array.from(requiredFields);
}

/**
 * Filters employee data to only include relevant fields
 * This is the key optimization - reduces tokens by excluding unnecessary fields
 */
export function filterEmployeeFields(
  employees: Employee[],
  requiredFields: string[]
): Partial<Employee>[] {
  return employees.map((emp) => {
    const filtered: Partial<Employee> = {};
    for (const field of requiredFields) {
      if (field in emp) {
        filtered[field] = emp[field];
      }
    }
    return filtered;
  });
}

/**
 * Generates optimized employee context for the system prompt
 * Returns empty string if employee data is not needed
 * ENHANCED: Now includes field-level filtering for semantic optimization
 */
export function generateEmployeeContext(employees: Employee[], query: string): string {
  // Strategy 1: Check if query needs employee data
  if (!needsEmployeeData(query)) {
    return ''; // Save 2,000-5,000 tokens
  }

  // Strategy 2: Filter to relevant employees
  const relevantEmployees = filterRelevantEmployees(employees, query);

  // Strategy 3: Limit to 50 employees max
  const limitedEmployees = relevantEmployees.slice(0, 50);

  // Strategy 4: ENHANCED - Analyze which fields are actually needed
  const requiredFields = analyzeRequiredFields(query);

  // Strategy 5: ENHANCED - Filter to only include required fields
  const optimizedEmployees = filterEmployeeFields(limitedEmployees, requiredFields);

  // Active employees only
  const activeEmployees = optimizedEmployees.filter(
    (emp: Partial<Employee>) => !emp.status || emp.status.toLowerCase() === 'active'
  );

  if (activeEmployees.length === 0) {
    return '';
  }

  // Generate summary statistics
  const departments = [...new Set(employees.map((emp) => emp.department).filter(Boolean))];
  const totalCount = employees.length;
  const activeCount = employees.filter(
    (emp) => !emp.status || emp.status.toLowerCase() === 'active'
  ).length;

  let context = `\n\n---\n\n# Employee Data Context\n\n`;
  context += `You have access to real employee data:\n\n`;
  context += `- **Total Employees**: ${totalCount}\n`;
  context += `- **Active Employees**: ${activeCount}\n`;
  context += `- **Departments**: ${departments.join(', ')}\n`;
  context += `- **Included Fields**: ${requiredFields.join(', ')}\n\n`;

  if (limitedEmployees.length < activeCount) {
    context += `**Note**: Showing ${limitedEmployees.length} most relevant employees for this query.\n\n`;
  }

  context += `When answering questions about employees, departments, or team composition, reference this actual data.\n\n`;
  context += `Here is the employee roster:\n\n`;

  // Add condensed employee data with only relevant fields
  const employeeSummary = activeEmployees
    .map((emp: Partial<Employee>) => {
      const fullName =
        emp.full_name ||
        (emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : 'Unknown');
      const fields = requiredFields
        .filter(
          (f) =>
            f !== 'employee_id' &&
            f !== 'full_name' &&
            f !== 'first_name' &&
            f !== 'last_name' &&
            f in emp
        )
        .map((f) => `${f}: ${emp[f]}`)
        .join(', ');

      return `- ${fullName} (${emp.employee_id})${fields ? ': ' + fields : ''}`;
    })
    .join('\n');

  context += employeeSummary;

  return context;
}

/**
 * Estimates token count for employee context
 * Useful for monitoring and optimization
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
