import { groupByCount, groupBy, percentage } from './utils';

export interface HeadcountResult {
  totalHeadcount: number;
  byDepartment: Record<string, number>;
  byLevel: Record<string, number>;
  byLocation: Record<string, number>;
  byStatus: Record<string, number>;
  demographics?: {
    byGender?: Record<string, number>;
    byRace?: Record<string, number>;
  };
}

/**
 * Calculate headcount metrics from employee data
 */
export function calculateHeadcount(employees: any[], demographics?: any[]): HeadcountResult {
  // Filter to active employees only
  const activeEmployees = employees.filter(
    (emp) => emp.status && emp.status.toLowerCase() === 'active'
  );

  const result: HeadcountResult = {
    totalHeadcount: activeEmployees.length,
    byDepartment: groupByCount(activeEmployees, 'department'),
    byLevel: groupByCount(activeEmployees, 'level'),
    byLocation: groupByCount(activeEmployees, 'location'),
    byStatus: groupByCount(employees, 'status'),
  };

  // Add demographics if available
  if (demographics && demographics.length > 0) {
    // Join with demographics
    const employeeMap = new Map(activeEmployees.map((e) => [e.employee_id, e]));
    const activeDemographics = demographics.filter((d) => employeeMap.has(d.employee_id));

    result.demographics = {
      byGender: groupByCount(activeDemographics, 'gender'),
      byRace: groupByCount(activeDemographics, 'race_ethnicity'),
    };
  }

  return result;
}

/**
 * Calculate headcount by department and level (cross-tab)
 */
export function calculateHeadcountByDeptAndLevel(
  employees: any[]
): Record<string, Record<string, number>> {
  const activeEmployees = employees.filter(
    (emp) => emp.status && emp.status.toLowerCase() === 'active'
  );

  const grouped = groupBy(activeEmployees, 'department');
  const result: Record<string, Record<string, number>> = {};

  Object.entries(grouped).forEach(([dept, emps]) => {
    result[dept] = groupByCount(emps, 'level');
  });

  return result;
}

/**
 * Calculate headcount growth/trends
 */
export function calculateHeadcountTrends(
  employees: any[],
  turnoverData?: any[]
): {
  currentHeadcount: number;
  hires?: number;
  terminations?: number;
  netChange?: number;
  growthRate?: number;
} {
  const activeEmployees = employees.filter(
    (emp) => emp.status && emp.status.toLowerCase() === 'active'
  );

  const result = {
    currentHeadcount: activeEmployees.length,
  };

  if (turnoverData && turnoverData.length > 0) {
    // Calculate hires in the period (employees hired in last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);

    const hires = activeEmployees.filter((emp) => {
      const hireDate = new Date(emp.hire_date);
      return hireDate >= oneYearAgo;
    }).length;

    // Count terminations in last 12 months
    const terminations = turnoverData.filter((t) => {
      const termDate = new Date(t.termination_date);
      return termDate >= oneYearAgo;
    }).length;

    const netChange = hires - terminations;
    const previousHeadcount = activeEmployees.length - netChange;
    const growthRate = previousHeadcount > 0 ? percentage(netChange, previousHeadcount, 1) : 0;

    return {
      ...result,
      hires,
      terminations,
      netChange,
      growthRate,
    };
  }

  return result;
}

/**
 * Calculate manager-to-employee ratios (span of control)
 */
export function calculateSpanOfControl(employees: any[]): {
  averageSpan: number;
  byManager: Record<string, { manager: string; directReports: number }>;
  totalManagers: number;
} {
  const activeEmployees = employees.filter(
    (emp) => emp.status && emp.status.toLowerCase() === 'active'
  );

  // Group by manager
  const byManager = groupBy(activeEmployees, 'manager_id');

  // Remove entries without manager (likely executives)
  delete byManager['Unknown'];
  delete byManager['null'];
  delete byManager[''];

  const managerDetails: Record<string, { manager: string; directReports: number }> = {};
  let totalDirectReports = 0;

  Object.entries(byManager).forEach(([managerId, reports]) => {
    const manager = activeEmployees.find((e) => e.employee_id === managerId);
    managerDetails[managerId] = {
      manager: manager ? `${manager.first_name} ${manager.last_name}` : managerId,
      directReports: reports.length,
    };
    totalDirectReports += reports.length;
  });

  const totalManagers = Object.keys(managerDetails).length;
  const averageSpan =
    totalManagers > 0 ? parseFloat((totalDirectReports / totalManagers).toFixed(1)) : 0;

  return {
    averageSpan,
    byManager: managerDetails,
    totalManagers,
  };
}
