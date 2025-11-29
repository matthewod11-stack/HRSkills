import { type DataRow, filterByDateRange, groupBy, groupByCount, percentage } from './utils';

export interface AttritionResult {
  overall: {
    totalTerminations: number;
    attritionRate: number;
    voluntaryRate: number;
    involuntaryRate: number;
  };
  byDepartment: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >;
  byLevel: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >;
  byLocation: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >;
  byTerminationType: Record<string, number>;
  byReason: Record<string, number>;
  regrettable?: {
    count: number;
    percentage: number;
  };
  demographics?: {
    byGender?: Record<string, { terminations: number; rate: number }>;
    byRace?: Record<string, { terminations: number; rate: number }>;
  };
}

/**
 * Calculate attrition/turnover metrics
 */
export function calculateAttrition(
  employees: DataRow[],
  turnoverData: DataRow[],
  demographics?: DataRow[],
  startDate?: Date,
  endDate?: Date
): AttritionResult {
  // Filter turnover data by date range if provided
  let filteredTurnover = turnoverData;
  if (startDate || endDate) {
    filteredTurnover = filterByDateRange(turnoverData, 'termination_date', startDate, endDate);
  }

  // Get active employees for denominator
  const activeEmployees = employees.filter(
    (emp) => typeof emp.status === 'string' && emp.status.toLowerCase() === 'active'
  );

  // Calculate average headcount (current + terminated)
  const avgHeadcount = activeEmployees.length + filteredTurnover.length;

  // Overall metrics
  const totalTerminations = filteredTurnover.length;
  const voluntaryTerminations = filteredTurnover.filter(
    (t) =>
      typeof t.termination_type === 'string' && t.termination_type.toLowerCase() === 'voluntary'
  ).length;
  const involuntaryTerminations = filteredTurnover.filter(
    (t) =>
      typeof t.termination_type === 'string' && t.termination_type.toLowerCase() === 'involuntary'
  ).length;

  const overall = {
    totalTerminations,
    attritionRate: percentage(totalTerminations, avgHeadcount, 1),
    voluntaryRate: percentage(voluntaryTerminations, avgHeadcount, 1),
    involuntaryRate: percentage(involuntaryTerminations, avgHeadcount, 1),
  };

  // Attrition by department
  const byDepartment = calculateAttritionByField(employees, filteredTurnover, 'department');

  // Attrition by level
  const byLevel = calculateAttritionByField(employees, filteredTurnover, 'level');

  // Attrition by location
  const byLocation = calculateAttritionByField(employees, filteredTurnover, 'location');

  // Termination type and reasons
  const byTerminationType = groupByCount(filteredTurnover, 'termination_type');
  const byReason = groupByCount(filteredTurnover, 'reason_category');

  const result: AttritionResult = {
    overall,
    byDepartment,
    byLevel,
    byLocation,
    byTerminationType,
    byReason,
  };

  // Regrettable turnover (if field exists)
  const regrettableTerminations = filteredTurnover.filter(
    (t) =>
      t.regrettable === true ||
      (typeof t.regrettable === 'string' && t.regrettable.toLowerCase() === 'yes')
  );

  if (
    regrettableTerminations.length > 0 ||
    filteredTurnover.some((t) => t.regrettable !== undefined)
  ) {
    result.regrettable = {
      count: regrettableTerminations.length,
      percentage: percentage(regrettableTerminations.length, totalTerminations, 1),
    };
  }

  // Demographics breakdown (if available)
  if (demographics && demographics.length > 0) {
    const employeeMap = new Map(employees.map((e) => [e.employee_id, e]));
    const terminatedWithDemographics = filteredTurnover
      .map((t) => {
        const emp = employeeMap.get(t.employee_id);
        const demo = demographics.find((d) => d.employee_id === t.employee_id);
        return { ...t, ...emp, ...demo };
      })
      .filter((t) => t.gender || t.race_ethnicity);

    result.demographics = {
      byGender: calculateDemographicAttrition(
        employees,
        demographics,
        terminatedWithDemographics,
        'gender'
      ),
      byRace: calculateDemographicAttrition(
        employees,
        demographics,
        terminatedWithDemographics,
        'race_ethnicity'
      ),
    };
  }

  return result;
}

/**
 * Helper: Calculate attrition rate by a specific field (dept, level, location)
 */
function calculateAttritionByField(
  employees: DataRow[],
  turnoverData: DataRow[],
  field: string
): Record<string, { terminations: number; attritionRate: number }> {
  const result: Record<string, { terminations: number; attritionRate: number }> = {};

  // Get all employees (active + terminated) grouped by field
  const employeeMap = new Map(employees.map((e) => [e.employee_id, e]));

  // Enrich turnover data with employee info
  const enrichedTurnover = turnoverData.map((t) => ({
    ...t,
    ...employeeMap.get(t.employee_id),
  }));

  // Group active employees by field
  const activeByField = groupBy(
    employees.filter((e) => typeof e.status === 'string' && e.status.toLowerCase() === 'active'),
    field
  );

  // Group terminated by field
  const terminatedByField = groupBy(enrichedTurnover, field);

  // Calculate rate for each field value
  const allFieldValues = new Set([
    ...Object.keys(activeByField),
    ...Object.keys(terminatedByField),
  ]);

  allFieldValues.forEach((value) => {
    const activeCount = (activeByField[value] || []).length;
    const terminatedCount = (terminatedByField[value] || []).length;
    const avgHeadcount = activeCount + terminatedCount;

    result[value] = {
      terminations: terminatedCount,
      attritionRate: avgHeadcount > 0 ? percentage(terminatedCount, avgHeadcount, 1) : 0,
    };
  });

  return result;
}

/**
 * Helper: Calculate attrition by demographic field
 */
function calculateDemographicAttrition(
  employees: DataRow[],
  demographics: DataRow[],
  terminatedWithDemographics: DataRow[],
  field: string
): Record<string, { terminations: number; rate: number }> {
  const result: Record<string, { terminations: number; rate: number }> = {};

  // Join active employees with demographics
  const employeeMap = new Map(employees.map((e) => [e.employee_id, e]));
  const _activeEmployees = employees.filter(
    (e) => typeof e.status === 'string' && e.status.toLowerCase() === 'active'
  );
  const activeWithDemographics = demographics
    .filter((d) => {
      if (!employeeMap.has(d.employee_id)) return false;
      const status = employeeMap.get(d.employee_id)?.status;
      return typeof status === 'string' && status.toLowerCase() === 'active';
    })
    .map((d) => ({ ...d, ...employeeMap.get(d.employee_id) }));

  // Group by demographic field
  const activeByDemo = groupBy(activeWithDemographics, field);
  const terminatedByDemo = groupBy(terminatedWithDemographics, field);

  const allDemoValues = new Set([...Object.keys(activeByDemo), ...Object.keys(terminatedByDemo)]);

  allDemoValues.forEach((value) => {
    const activeCount = (activeByDemo[value] || []).length;
    const terminatedCount = (terminatedByDemo[value] || []).length;
    const avgHeadcount = activeCount + terminatedCount;

    result[value] = {
      terminations: terminatedCount,
      rate: avgHeadcount > 0 ? percentage(terminatedCount, avgHeadcount, 1) : 0,
    };
  });

  return result;
}

/**
 * Calculate time-to-fill metrics (requires open positions data)
 */
export interface TimeToFillResult {
  averageDays: number;
  byDepartment: Record<string, number>;
  byLevel: Record<string, number>;
}

export function calculateTimeToFill(requisitions: DataRow[]): TimeToFillResult {
  // Calculate time-to-fill for filled positions
  const filledRequisitions = requisitions.filter(
    (req) =>
      typeof req.status === 'string' &&
      req.status.toLowerCase() === 'filled' &&
      req.open_date &&
      req.fill_date
  );

  const timeToFillDays = filledRequisitions.map((req) => {
    const openDate = new Date(req.open_date);
    const fillDate = new Date(req.fill_date);
    return Math.floor((fillDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
  });

  const averageDays =
    timeToFillDays.length > 0
      ? Math.round(timeToFillDays.reduce((sum, days) => sum + days, 0) / timeToFillDays.length)
      : 0;

  // By department
  const byDepartment: Record<string, number> = {};
  const deptGroups = groupBy(filledRequisitions, 'department');
  Object.entries(deptGroups).forEach(([dept, reqs]) => {
    const deptDays = reqs.map((req) => {
      const openDate = new Date(req.open_date);
      const fillDate = new Date(req.fill_date);
      return Math.floor((fillDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    byDepartment[dept] =
      deptDays.length > 0
        ? Math.round(deptDays.reduce((sum, days) => sum + days, 0) / deptDays.length)
        : 0;
  });

  // By level
  const byLevel: Record<string, number> = {};
  const levelGroups = groupBy(filledRequisitions, 'level');
  Object.entries(levelGroups).forEach(([level, reqs]) => {
    const levelDays = reqs.map((req) => {
      const openDate = new Date(req.open_date);
      const fillDate = new Date(req.fill_date);
      return Math.floor((fillDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    byLevel[level] =
      levelDays.length > 0
        ? Math.round(levelDays.reduce((sum, days) => sum + days, 0) / levelDays.length)
        : 0;
  });

  return {
    averageDays,
    byDepartment,
    byLevel,
  };
}

/**
 * Calculate retention metrics (complement of attrition)
 */
export interface RetentionResult {
  overallRetentionRate: number;
  byTenure: Record<
    string,
    {
      count: number;
      retentionRate: number;
    }
  >;
  newHireRetention: {
    hired: number;
    retained: number;
    retentionRate: number;
  };
}

export function calculateRetention(
  employees: DataRow[],
  turnoverData: DataRow[],
  periodMonths: number = 12
): RetentionResult {
  const activeEmployees = employees.filter(
    (emp) => typeof emp.status === 'string' && emp.status.toLowerCase() === 'active'
  );

  // Calculate period start date
  const periodStartDate = new Date();
  periodStartDate.setMonth(periodStartDate.getMonth() - periodMonths);

  // Filter turnover to period
  const periodTurnover = filterByDateRange(turnoverData, 'termination_date', periodStartDate);

  // Overall retention
  const totalHeadcount = activeEmployees.length + periodTurnover.length;
  const overallRetentionRate = percentage(activeEmployees.length, totalHeadcount, 1);

  // Retention by tenure
  const byTenure: Record<string, { count: number; retentionRate: number }> = {};

  activeEmployees.forEach((emp) => {
    if (!emp.hire_date) return;

    const hireDate = new Date(emp.hire_date);
    const tenureYears = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));

    let tenureBucket = 'Unknown';
    if (tenureYears < 1) tenureBucket = '<1 year';
    else if (tenureYears < 3) tenureBucket = '1-3 years';
    else if (tenureYears < 5) tenureBucket = '3-5 years';
    else tenureBucket = '5+ years';

    if (!byTenure[tenureBucket]) {
      byTenure[tenureBucket] = { count: 0, retentionRate: 0 };
    }
    byTenure[tenureBucket].count++;
  });

  // Calculate retention rates for each bucket
  Object.keys(byTenure).forEach((bucket) => {
    // This is simplified - actual retention rate would need historical cohort data
    byTenure[bucket].retentionRate = 100; // Placeholder
  });

  // New hire retention (hired in last 12 months and still active)
  const newHires = activeEmployees.filter((emp) => {
    if (!emp.hire_date) return false;
    const hireDate = new Date(emp.hire_date);
    return hireDate >= periodStartDate;
  });

  const newHireTerminations = periodTurnover.filter((t) => {
    const emp = employees.find((e) => e.employee_id === t.employee_id);
    if (!emp || !emp.hire_date) return false;
    const hireDate = new Date(emp.hire_date);
    return hireDate >= periodStartDate;
  });

  const totalNewHires = newHires.length + newHireTerminations.length;
  const newHireRetention = {
    hired: totalNewHires,
    retained: newHires.length,
    retentionRate: totalNewHires > 0 ? percentage(newHires.length, totalNewHires, 1) : 0,
  };

  return {
    overallRetentionRate,
    byTenure,
    newHireRetention,
  };
}
