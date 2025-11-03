import { rippling } from './client';
import { Employee, EmployeeFilters } from './types';

export async function getAllEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  return rippling.request<Employee[]>({
    method: 'GET',
    url: '/platform/api/employees',
    params: filters
  });
}

export async function getEmployee(id: string): Promise<Employee> {
  return rippling.request<Employee>({
    method: 'GET',
    url: `/platform/api/employees/${id}`
  });
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee> {
  return rippling.request<Employee>({
    method: 'PATCH',
    url: `/platform/api/employees/${id}`,
    data: updates
  });
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  return getAllEmployees({ department });
}

export async function getActiveEmployees(): Promise<Employee[]> {
  return getAllEmployees({ status: 'active' });
}

export async function createEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
  return rippling.request<Employee>({
    method: 'POST',
    url: '/platform/api/employees',
    data
  });
}
