/**
 * Employee Store Tests
 *
 * Tests for the employee store functionality including:
 * - CRUD operations
 * - Caching behavior
 * - Selector functions
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmployeeStore } from '../employee-store';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

// Mock fetch globally
global.fetch = jest.fn();

describe('Employee Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEmployeeStore.setState({
      employees: [],
      isLoading: false,
      error: null,
      lastFetched: null
    });

    // Clear fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Basic State Management', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useEmployeeStore());

      expect(result.current.employees).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastFetched).toBe(null);
    });

    it('should set employees directly', () => {
      const { result } = renderHook(() => useEmployeeStore());

      const mockEmployees: MasterEmployeeRecord[] = [
        {
          employee_id: 'EMP001',
          full_name: 'John Doe',
          department: 'Engineering',
          job_title: 'Software Engineer'
        },
        {
          employee_id: 'EMP002',
          full_name: 'Jane Smith',
          department: 'Design',
          job_title: 'Product Designer'
        }
      ];

      act(() => {
        result.current.setEmployees(mockEmployees);
      });

      expect(result.current.employees).toHaveLength(2);
      expect(result.current.employees[0].full_name).toBe('John Doe');
      expect(result.current.lastFetched).not.toBe(null);
    });
  });

  describe('fetchEmployees', () => {
    it('should fetch employees from API', async () => {
      const mockEmployees = [
        { employee_id: 'EMP001', full_name: 'John Doe', department: 'Engineering' },
        { employee_id: 'EMP002', full_name: 'Jane Smith', department: 'Design' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, employees: mockEmployees })
      });

      const { result } = renderHook(() => useEmployeeStore());

      await act(async () => {
        await result.current.fetchEmployees();
      });

      expect(result.current.employees).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });

      const { result } = renderHook(() => useEmployeeStore());

      await act(async () => {
        await result.current.fetchEmployees();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should use cache within 5 minutes', async () => {
      const mockEmployees = [
        { employee_id: 'EMP001', full_name: 'John Doe' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, employees: mockEmployees })
      });

      const { result } = renderHook(() => useEmployeeStore());

      // First fetch
      await act(async () => {
        await result.current.fetchEmployees();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second fetch within 5 minutes - should use cache
      await act(async () => {
        await result.current.fetchEmployees();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should bypass cache with force option', async () => {
      const mockEmployees = [
        { employee_id: 'EMP001', full_name: 'John Doe' }
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, employees: mockEmployees })
      });

      const { result } = renderHook(() => useEmployeeStore());

      // First fetch
      await act(async () => {
        await result.current.fetchEmployees();
      });

      // Force refresh
      await act(async () => {
        await result.current.fetchEmployees({ force: true });
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Selector Functions', () => {
    beforeEach(() => {
      const mockEmployees: MasterEmployeeRecord[] = [
        {
          employee_id: 'EMP001',
          full_name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          department: 'Engineering',
          job_title: 'Software Engineer',
          status: 'Active'
        },
        {
          employee_id: 'EMP002',
          full_name: 'Jane Smith',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          department: 'Design',
          job_title: 'Product Designer',
          status: 'Active'
        },
        {
          employee_id: 'EMP003',
          full_name: 'Bob Johnson',
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob@example.com',
          department: 'Engineering',
          job_title: 'Senior Engineer',
          status: 'Terminated'
        }
      ];

      useEmployeeStore.setState({ employees: mockEmployees });
    });

    it('should get employee by ID', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const employee = result.current.getEmployeeById('EMP001');

      expect(employee).toBeDefined();
      expect(employee?.full_name).toBe('John Doe');
    });

    it('should return undefined for non-existent ID', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const employee = result.current.getEmployeeById('EMP999');

      expect(employee).toBeUndefined();
    });

    it('should search employees by name', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const results = result.current.searchEmployees('john');

      expect(results).toHaveLength(2); // John Doe and Bob Johnson
      expect(results.find(e => e.employee_id === 'EMP001')).toBeDefined();
      expect(results.find(e => e.employee_id === 'EMP003')).toBeDefined();
    });

    it('should search employees by email', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const results = result.current.searchEmployees('jane@example.com');

      expect(results).toHaveLength(1);
      expect(results[0].employee_id).toBe('EMP002');
    });

    it('should filter by department', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const engineers = result.current.filterByDepartment('Engineering');

      expect(engineers).toHaveLength(2);
      expect(engineers.every(e => e.department === 'Engineering')).toBe(true);
    });

    it('should filter by status', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const active = result.current.filterByStatus('active');

      expect(active).toHaveLength(2);
      expect(active.every(e => e.status?.toLowerCase() === 'active')).toBe(true);
    });

    it('should get only active employees', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const active = result.current.getActiveEmployees();

      expect(active).toHaveLength(2);
      expect(active.find(e => e.employee_id === 'EMP003')).toBeUndefined();
    });

    it('should get unique departments', () => {
      const { result } = renderHook(() => useEmployeeStore());
      const departments = result.current.getDepartments();

      expect(departments).toEqual(['Design', 'Engineering']);
    });
  });

  describe('CRUD Operations', () => {
    it('should add employee', async () => {
      const newEmployee: MasterEmployeeRecord = {
        employee_id: 'EMP001',
        full_name: 'New Employee',
        department: 'Marketing'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, employee: newEmployee })
      });

      const { result } = renderHook(() => useEmployeeStore());

      let addResult;
      await act(async () => {
        addResult = await result.current.addEmployee(newEmployee);
      });

      expect(addResult).toEqual({ success: true });
      expect(result.current.employees).toHaveLength(1);
    });

    it('should update employee', async () => {
      // Set initial state
      useEmployeeStore.setState({
        employees: [
          { employee_id: 'EMP001', full_name: 'John Doe', job_title: 'Engineer' }
        ]
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useEmployeeStore());

      await act(async () => {
        await result.current.updateEmployee('EMP001', { job_title: 'Senior Engineer' });
      });

      const updated = result.current.getEmployeeById('EMP001');
      expect(updated?.job_title).toBe('Senior Engineer');
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useEmployeeStore());

      act(() => {
        useEmployeeStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache', () => {
      const { result } = renderHook(() => useEmployeeStore());

      act(() => {
        useEmployeeStore.setState({ lastFetched: Date.now() });
      });

      expect(result.current.lastFetched).not.toBe(null);

      act(() => {
        result.current.invalidateCache();
      });

      expect(result.current.lastFetched).toBe(null);
    });
  });
});
