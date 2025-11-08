import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';
import { requireAuth, hasPermission, requireRole, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
const MASTER_DATA_PATH = path.join(DATA_DIR, 'master-employees.json');

/**
 * Load master employee data
 */
async function loadMasterData(): Promise<MasterEmployeeRecord[]> {
  try {
    const content = await readFile(MASTER_DATA_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

/**
 * Save master employee data
 */
async function saveMasterData(data: MasterEmployeeRecord[]): Promise<void> {
  await writeFile(MASTER_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

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

  // Check permissions
  if (!hasPermission(authResult.user, 'employees', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to read employees' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    let employees = await loadMasterData();

    // Apply filters
    if (status) {
      employees = employees.filter(emp => emp.status?.toLowerCase() === status.toLowerCase());
    }

    if (department) {
      employees = employees.filter(emp => emp.department === department);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.employee_id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortBy) {
      employees.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return NextResponse.json({
      success: true,
      employees,
      count: employees.length
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'GET',
      userId: authResult.user.userId
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

  // Check role
  if (!requireRole(authResult.user, 'hr_admin', 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Admin role required to create employees' },
      { status: 403 }
    );
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'employees', 'write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to create employees' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const newEmployee: MasterEmployeeRecord = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate employee_id exists
    if (!newEmployee.employee_id) {
      return NextResponse.json({
        success: false,
        error: 'employee_id is required'
      }, { status: 400 });
    }

    const employees = await loadMasterData();

    // Check if employee already exists
    if (employees.some(emp => emp.employee_id === newEmployee.employee_id)) {
      return NextResponse.json({
        success: false,
        error: 'Employee with this ID already exists'
      }, { status: 400 });
    }

    employees.push(newEmployee);
    await saveMasterData(employees);

    return NextResponse.json({
      success: true,
      employee: newEmployee
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: {} // Employee data not accessible in catch scope
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

  // Check role
  if (!requireRole(authResult.user, 'hr_admin', 'super_admin', 'hr_manager')) {
    return NextResponse.json(
      { success: false, error: 'Admin or manager role required to update employees' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const updates: Partial<MasterEmployeeRecord>[] = body.updates;

    if (!Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        error: 'Updates must be an array'
      }, { status: 400 });
    }

    const employees = await loadMasterData();
    const employeeMap = new Map(employees.map(emp => [emp.employee_id, emp]));

    let updatedCount = 0;

    for (const update of updates) {
      if (!update.employee_id) continue;

      const existing = employeeMap.get(update.employee_id);
      if (existing) {
        const merged = {
          ...existing,
          ...update,
          employee_id: existing.employee_id, // Preserve ID
          updated_at: new Date().toISOString()
        };
        employeeMap.set(existing.employee_id, merged);
        updatedCount++;
      }
    }

    await saveMasterData(Array.from(employeeMap.values()));

    return NextResponse.json({
      success: true,
      updated: updatedCount
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'PATCH',
      userId: authResult.user.userId
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

  // Only super_admin can delete
  if (!requireRole(authResult.user, 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Super admin role required for deletion' },
      { status: 403 }
    );
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'employees', 'delete')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to delete employees' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const employeeIds: string[] = body.employee_ids;

    if (!Array.isArray(employeeIds)) {
      return NextResponse.json({
        success: false,
        error: 'employee_ids must be an array'
      }, { status: 400 });
    }

    const employees = await loadMasterData();
    const idsToDelete = new Set(employeeIds);
    const remaining = employees.filter(emp => !idsToDelete.has(emp.employee_id));

    await saveMasterData(remaining);

    return NextResponse.json({
      success: true,
      deleted: employees.length - remaining.length
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/employees',
      method: 'DELETE',
      userId: authResult.user.userId
    });
  }
}
