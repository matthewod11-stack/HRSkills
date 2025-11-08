/**
 * Employee Store - Global state management for employee data
 *
 * Features:
 * - Single source of truth for all employee data
 * - 5-minute caching to reduce API calls
 * - localStorage persistence for offline support
 * - Type-safe CRUD operations
 * - Selector functions for filtering/searching
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

// ============================================================================
// AUTH HELPER
// ============================================================================

/**
 * Get auth headers from localStorage
 * This is a workaround since Zustand stores can't directly use React hooks
 */
function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('hr_skills_demo_token');
  if (!token) return {};

  return {
    'Authorization': `Bearer ${token}`,
  };
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EmployeeStore {
  // State
  employees: MasterEmployeeRecord[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setEmployees: (employees: MasterEmployeeRecord[]) => void;
  fetchEmployees: (options?: FetchOptions) => Promise<void>;
  addEmployee: (employee: MasterEmployeeRecord) => Promise<{ success: boolean; error?: string }>;
  updateEmployee: (id: string, updates: Partial<MasterEmployeeRecord>) => Promise<{ success: boolean; error?: string }>;
  bulkUpdateEmployees: (updates: Partial<MasterEmployeeRecord>[]) => Promise<{ success: boolean; updated: number; error?: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeleteEmployees: (ids: string[]) => Promise<{ success: boolean; deleted: number; error?: string }>;
  clearError: () => void;
  invalidateCache: () => void;

  // Selectors
  getEmployeeById: (id: string) => MasterEmployeeRecord | undefined;
  searchEmployees: (query: string) => MasterEmployeeRecord[];
  filterByDepartment: (department: string) => MasterEmployeeRecord[];
  filterByStatus: (status: string) => MasterEmployeeRecord[];
  getActiveEmployees: () => MasterEmployeeRecord[];
  getDepartments: () => string[];
  getEmployeesByManager: (managerId: string) => MasterEmployeeRecord[];
}

interface FetchOptions {
  force?: boolean; // Force refresh even if cache is valid
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  department?: string;
  search?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      // Initial State
      employees: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      // ========================================================================
      // ACTIONS
      // ========================================================================

      /**
       * Set employees directly (used internally or for manual updates)
       */
      setEmployees: (employees) => set({
        employees,
        lastFetched: Date.now(),
        error: null
      }),

      /**
       * Fetch employees from API with caching
       */
      fetchEmployees: async (options = {}) => {
        const { lastFetched } = get();
        const now = Date.now();

        // Check cache validity (skip if force=true)
        if (!options.force && lastFetched && (now - lastFetched) < CACHE_DURATION) {
          console.log('[EmployeeStore] Using cached data');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Build query params
          const params = new URLSearchParams();
          if (options.sortBy) params.append('sortBy', options.sortBy);
          if (options.sortOrder) params.append('sortOrder', options.sortOrder);
          if (options.status) params.append('status', options.status);
          if (options.department) params.append('department', options.department);
          if (options.search) params.append('search', options.search);

          const queryString = params.toString();
          const url = `/api/employees${queryString ? `?${queryString}` : ''}`;

          console.log('[EmployeeStore] Fetching from API:', url);

          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            credentials: 'include', // Include cookies for auth
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch employees' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const data = await response.json();

          set({
            employees: data.employees || [],
            isLoading: false,
            lastFetched: Date.now(),
            error: null
          });

          console.log('[EmployeeStore] Fetched', data.employees?.length || 0, 'employees');

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load employees';
          console.error('[EmployeeStore] Fetch error:', errorMessage);

          set({
            error: errorMessage,
            isLoading: false
          });
        }
      },

      /**
       * Add a new employee
       */
      addEmployee: async (employee) => {
        try {
          const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            credentials: 'include',
            body: JSON.stringify(employee)
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Failed to create employee' };
          }

          // Add to local state
          set((state) => ({
            employees: [...state.employees, data.employee],
            error: null
          }));

          console.log('[EmployeeStore] Added employee:', data.employee.employee_id);

          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
          console.error('[EmployeeStore] Add error:', errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Update a single employee
       */
      updateEmployee: async (id, updates) => {
        try {
          const response = await fetch(`/api/employees/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            credentials: 'include',
            body: JSON.stringify(updates)
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Failed to update employee' };
          }

          // Update local state
          set((state) => ({
            employees: state.employees.map(emp =>
              emp.employee_id === id ? { ...emp, ...updates } : emp
            ),
            error: null
          }));

          console.log('[EmployeeStore] Updated employee:', id);

          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
          console.error('[EmployeeStore] Update error:', errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Bulk update multiple employees
       */
      bulkUpdateEmployees: async (updates) => {
        try {
          const response = await fetch('/api/employees', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            credentials: 'include',
            body: JSON.stringify({ updates })
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return { success: false, updated: 0, error: data.error || 'Failed to update employees' };
          }

          // Create a map of updates for efficient lookup
          const updateMap = new Map(
            updates.map(u => [u.employee_id!, u])
          );

          // Update local state
          set((state) => ({
            employees: state.employees.map(emp => {
              const update = updateMap.get(emp.employee_id);
              return update ? { ...emp, ...update } : emp;
            }),
            error: null
          }));

          console.log('[EmployeeStore] Bulk updated', data.updated, 'employees');

          return { success: true, updated: data.updated };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update employees';
          console.error('[EmployeeStore] Bulk update error:', errorMessage);
          return { success: false, updated: 0, error: errorMessage };
        }
      },

      /**
       * Delete a single employee
       */
      deleteEmployee: async (id) => {
        try {
          const response = await fetch(`/api/employees/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include',
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Failed to delete employee' };
          }

          // Remove from local state
          set((state) => ({
            employees: state.employees.filter(emp => emp.employee_id !== id),
            error: null
          }));

          console.log('[EmployeeStore] Deleted employee:', id);

          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee';
          console.error('[EmployeeStore] Delete error:', errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Bulk delete multiple employees
       */
      bulkDeleteEmployees: async (ids) => {
        try {
          const response = await fetch('/api/employees', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            credentials: 'include',
            body: JSON.stringify({ employee_ids: ids })
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return { success: false, deleted: 0, error: data.error || 'Failed to delete employees' };
          }

          // Remove from local state
          const idsToDelete = new Set(ids);
          set((state) => ({
            employees: state.employees.filter(emp => !idsToDelete.has(emp.employee_id)),
            error: null
          }));

          console.log('[EmployeeStore] Bulk deleted', data.deleted, 'employees');

          return { success: true, deleted: data.deleted };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete employees';
          console.error('[EmployeeStore] Bulk delete error:', errorMessage);
          return { success: false, deleted: 0, error: errorMessage };
        }
      },

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Invalidate cache to force refresh on next fetch
       */
      invalidateCache: () => set({ lastFetched: null }),

      // ========================================================================
      // SELECTORS
      // ========================================================================

      /**
       * Get employee by ID
       */
      getEmployeeById: (id) => {
        return get().employees.find(emp => emp.employee_id === id);
      },

      /**
       * Search employees by name, email, or ID
       */
      searchEmployees: (query) => {
        if (!query.trim()) return get().employees;

        const lowerQuery = query.toLowerCase();
        return get().employees.filter(emp =>
          emp.full_name?.toLowerCase().includes(lowerQuery) ||
          emp.first_name?.toLowerCase().includes(lowerQuery) ||
          emp.last_name?.toLowerCase().includes(lowerQuery) ||
          emp.email?.toLowerCase().includes(lowerQuery) ||
          emp.employee_id?.toLowerCase().includes(lowerQuery) ||
          emp.job_title?.toLowerCase().includes(lowerQuery) ||
          emp.department?.toLowerCase().includes(lowerQuery)
        );
      },

      /**
       * Filter employees by department
       */
      filterByDepartment: (department) => {
        return get().employees.filter(emp => emp.department === department);
      },

      /**
       * Filter employees by status
       */
      filterByStatus: (status) => {
        return get().employees.filter(emp =>
          emp.status?.toLowerCase() === status.toLowerCase()
        );
      },

      /**
       * Get only active employees
       */
      getActiveEmployees: () => {
        return get().employees.filter(emp =>
          !emp.status || emp.status.toLowerCase() === 'active'
        );
      },

      /**
       * Get unique list of departments
       */
      getDepartments: () => {
        const departments = new Set<string>();
        get().employees.forEach(emp => {
          if (emp.department) {
            departments.add(emp.department);
          }
        });
        return Array.from(departments).sort();
      },

      /**
       * Get all employees reporting to a specific manager
       */
      getEmployeesByManager: (managerId) => {
        return get().employees.filter(emp => emp.manager_id === managerId);
      },
    }),
    {
      name: 'employee-storage',
      // Only persist essential data, not loading/error states
      partialize: (state) => ({
        employees: state.employees,
        lastFetched: state.lastFetched
      })
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook to get loading state
 */
export const useEmployeeLoading = () => useEmployeeStore(state => state.isLoading);

/**
 * Hook to get error state
 */
export const useEmployeeError = () => useEmployeeStore(state => state.error);

/**
 * Hook to get all employees
 */
export const useEmployees = () => useEmployeeStore(state => state.employees);

/**
 * Hook to get active employees only
 */
export const useActiveEmployees = () => useEmployeeStore(state => state.getActiveEmployees());

/**
 * Hook to get a specific employee by ID
 */
export const useEmployee = (id: string) => useEmployeeStore(state => state.getEmployeeById(id));

/**
 * Hook to get list of departments
 */
export const useDepartments = () => useEmployeeStore(state => state.getDepartments());
