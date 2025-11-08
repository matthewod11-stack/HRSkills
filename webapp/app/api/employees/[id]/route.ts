import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';
import { handleApiError } from '@/lib/api-helpers';

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
 * GET /api/employees/[id]
 *
 * Get single employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    const employees = await loadMasterData();
    const employee = employees.find(emp => emp.employee_id === employeeId);

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      employee
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: `/api/employees/${params.id}`,
      method: 'GET',
    });
  }
}

/**
 * PATCH /api/employees/[id]
 *
 * Update single employee
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    const updates = await request.json();

    const employees = await loadMasterData();
    const index = employees.findIndex(emp => emp.employee_id === employeeId);

    if (index === -1) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    // Merge updates
    employees[index] = {
      ...employees[index],
      ...updates,
      employee_id: employeeId, // Preserve ID
      updated_at: new Date().toISOString()
    };

    await saveMasterData(employees);

    return NextResponse.json({
      success: true,
      employee: employees[index]
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: `/api/employees/${params.id}`,
      method: 'PATCH',
      requestBody: { employeeId: params.id }
    });
  }
}

/**
 * DELETE /api/employees/[id]
 *
 * Delete single employee
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    const employees = await loadMasterData();
    const filtered = employees.filter(emp => emp.employee_id !== employeeId);

    if (filtered.length === employees.length) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    await saveMasterData(filtered);

    return NextResponse.json({
      success: true,
      message: 'Employee deleted'
    });

  } catch (error: any) {
    return handleApiError(error, {
      endpoint: `/api/employees/${params.id}`,
      method: 'DELETE',
      requestBody: { employeeId: params.id }
    });
  }
}
