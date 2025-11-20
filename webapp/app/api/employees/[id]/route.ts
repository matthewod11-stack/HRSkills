import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { employees, employeeMetrics, performanceReviews } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/employees/[id]
 *
 * Get single employee by ID with metrics and reviews
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employeeId = (await params).id;

    // Query employee with related data
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    // Get employee metrics
    const metrics = await db
      .select()
      .from(employeeMetrics)
      .where(eq(employeeMetrics.employeeId, employeeId));

    // Get performance reviews
    const reviews = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.employeeId, employeeId));

    return NextResponse.json({
      success: true,
      employee: {
        ...employee,
        metrics,
        performanceReviews: reviews,
      },
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: `/api/employees/${(await params).id}`,
      method: 'GET',
    });
  }
}

/**
 * PATCH /api/employees/[id]
 *
 * Update single employee
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employeeId = (await params).id;
    const updates = await request.json();

    // Check if employee exists
    const [existingEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    // Update employee with timestamp
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employees.id, employeeId))
      .returning();

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: `/api/employees/${(await params).id}`,
      method: 'PATCH',
    });
  }
}

/**
 * DELETE /api/employees/[id]
 *
 * Soft delete employee (set status to terminated)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employeeId = (await params).id;

    // Check if employee exists
    const [existingEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    // Soft delete: set status to terminated
    const [deletedEmployee] = await db
      .update(employees)
      .set({
        status: 'terminated',
        terminationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employees.id, employeeId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Employee marked as terminated',
      employee: deletedEmployee,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: `/api/employees/${(await params).id}`,
      method: 'DELETE',
    });
  }
}
