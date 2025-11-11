import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { db } from '@/lib/db';
import { employees, performanceReviews, employeeMetrics } from '@/db/schema';
import { eq, and, like, or, asc, desc, sql } from 'drizzle-orm';

/**
 * Phase 2: SQLite-powered Employee API
 *
 * Migrated from JSON file storage to SQLite database with Drizzle ORM.
 * Features:
 * - Type-safe queries
 * - Indexed lookups for performance
 * - Transaction support
 * - Consistent data access patterns
 */

/**
 * GET /api/employees
 *
 * Get all employees with optional filtering and sorting
 * Requires: Authentication + 'employees' read permission
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting (standard endpoints: 100 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'fullName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // Build query conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(employees.status, status));
    }

    if (department) {
      conditions.push(eq(employees.department, department));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(employees.fullName, searchPattern),
          like(employees.email, searchPattern),
          like(employees.id, searchPattern)
        )!
      );
    }

    // Execute query with filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    const sortColumn = (employees as any)[sortBy] || employees.fullName;
    const orderByClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const employeesList = await db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(orderByClause);

    // Transform to match Phase 1 API format (for backward compatibility)
    const transformedEmployees = employeesList.map((emp) => ({
      employee_id: emp.id,
      full_name: emp.fullName,
      first_name: emp.firstName,
      last_name: emp.lastName,
      email: emp.email,
      department: emp.department,
      job_title: emp.jobTitle,
      level: emp.level,
      manager_id: emp.managerId,
      hire_date: emp.hireDate,
      termination_date: emp.terminationDate,
      status: emp.status,
      location: emp.location,
      gender: emp.gender,
      race_ethnicity: emp.raceEthnicity,
      employee_type: emp.employmentType,
      data_sources: emp.dataSources ? JSON.parse(emp.dataSources) : [],
      created_at: emp.createdAt,
      updated_at: emp.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      employees: transformedEmployees,
      count: transformedEmployees.length,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}

/**
 * POST /api/employees
 *
 * Create a new employee
 * Requires: Authentication + hr_admin or super_admin role + 'employees' write permission
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (standard endpoints: 100 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();

    // Validate employee_id exists
    if (!body.employee_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'employee_id is required',
        },
        { status: 400 }
      );
    }

    // Check if employee already exists
    const existing = await db
      .select()
      .from(employees)
      .where(eq(employees.id, body.employee_id))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee with this ID already exists',
        },
        { status: 400 }
      );
    }

    // Transform from Phase 1 format to Phase 2
    const newEmployee = {
      id: body.employee_id,
      email: body.email,
      fullName: body.full_name,
      firstName: body.first_name,
      lastName: body.last_name,
      department: body.department,
      jobTitle: body.job_title,
      level: body.level || null,
      managerId: body.manager_id || null,
      location: body.location || null,
      employmentType: body.employee_type || 'Full-time',
      hireDate: body.hire_date,
      terminationDate: body.termination_date || null,
      status: body.status || 'active',
      gender: body.gender || null,
      raceEthnicity: body.race_ethnicity || null,
      compensationCurrency: 'USD',
      compensationBase: body.compensation_base || null,
      dataSources: JSON.stringify(body.data_sources || ['Manual Entry']),
      attributes: JSON.stringify(body.attributes || {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const [inserted] = await db.insert(employees).values(newEmployee).returning();

    // Transform back to Phase 1 format for response
    const response = {
      employee_id: inserted.id,
      full_name: inserted.fullName,
      first_name: inserted.firstName,
      last_name: inserted.lastName,
      email: inserted.email,
      department: inserted.department,
      job_title: inserted.jobTitle,
      level: inserted.level,
      manager_id: inserted.managerId,
      hire_date: inserted.hireDate,
      termination_date: inserted.terminationDate,
      status: inserted.status,
      location: inserted.location,
      employee_type: inserted.employmentType,
      created_at: inserted.createdAt,
      updated_at: inserted.updatedAt,
    };

    return NextResponse.json({
      success: true,
      employee: response,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: {},
    });
  }
}

/**
 * PATCH /api/employees
 *
 * Bulk update multiple employees
 * Requires: Authentication + hr_admin or super_admin role
 */
export async function PATCH(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();
    const updates = body.updates;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Updates must be an array',
        },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    // Process each update in a transaction
    for (const update of updates) {
      if (!update.employee_id) continue;

      // Transform from Phase 1 format to Phase 2
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (update.full_name !== undefined) updateData.fullName = update.full_name;
      if (update.first_name !== undefined) updateData.firstName = update.first_name;
      if (update.last_name !== undefined) updateData.lastName = update.last_name;
      if (update.email !== undefined) updateData.email = update.email;
      if (update.department !== undefined) updateData.department = update.department;
      if (update.job_title !== undefined) updateData.jobTitle = update.job_title;
      if (update.level !== undefined) updateData.level = update.level;
      if (update.manager_id !== undefined) updateData.managerId = update.manager_id;
      if (update.location !== undefined) updateData.location = update.location;
      if (update.employee_type !== undefined) updateData.employmentType = update.employee_type;
      if (update.hire_date !== undefined) updateData.hireDate = update.hire_date;
      if (update.termination_date !== undefined)
        updateData.terminationDate = update.termination_date;
      if (update.status !== undefined) updateData.status = update.status;
      if (update.gender !== undefined) updateData.gender = update.gender;
      if (update.race_ethnicity !== undefined) updateData.raceEthnicity = update.race_ethnicity;

      const result = await db
        .update(employees)
        .set(updateData)
        .where(eq(employees.id, update.employee_id));

      if (result.changes > 0) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'PATCH',
      userId: authResult.user.userId,
    });
  }
}

/**
 * DELETE /api/employees
 *
 * Bulk delete employees
 * Requires: Authentication + super_admin role + 'employees' delete permission
 */
export async function DELETE(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();
    const employeeIds: string[] = body.employee_ids;

    if (!Array.isArray(employeeIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'employee_ids must be an array',
        },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    // Delete each employee (will cascade to related records via ON DELETE CASCADE)
    for (const empId of employeeIds) {
      const result = await db.delete(employees).where(eq(employees.id, empId));

      if (result.changes > 0) {
        deletedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'DELETE',
      userId: authResult.user.userId,
    });
  }
}
