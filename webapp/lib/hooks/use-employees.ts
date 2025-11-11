import { useCallback } from 'react';
import useSWR from 'swr';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

type EmployeesResponse = {
  employees: MasterEmployeeRecord[];
};

interface UseEmployeesOptions {
  enabled?: boolean;
}

async function fetchEmployees(url: string): Promise<EmployeesResponse> {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message =
      (errorPayload as { error?: string }).error ??
      `Failed to fetch employees (HTTP ${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

export function useEmployeesData(options?: UseEmployeesOptions) {
  const shouldFetch = options?.enabled ?? true;

  const { data, error, isLoading, isValidating, mutate } = useSWR<EmployeesResponse>(
    shouldFetch ? '/api/employees' : null,
    fetchEmployees,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const addEmployee = useCallback(
    async (
      employee: Partial<MasterEmployeeRecord>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('/api/employees', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employee),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          const errorMessage =
            (result as { error?: string }).error ??
            `Failed to create employee (HTTP ${response.status})`;
          return { success: false, error: errorMessage };
        }

        await mutate();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create employee',
        };
      }
    },
    [mutate]
  );

  const bulkUpdateEmployees = useCallback(
    async (
      updates: Partial<MasterEmployeeRecord>[]
    ): Promise<{ success: boolean; updated: number; error?: string }> => {
      try {
        const response = await fetch('/api/employees', {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          const errorMessage =
            (result as { error?: string }).error ??
            `Failed to update employees (HTTP ${response.status})`;
          return { success: false, updated: 0, error: errorMessage };
        }

        await mutate();
        return {
          success: true,
          updated: (result as { updated?: number }).updated ?? updates.length,
        };
      } catch (error) {
        return {
          success: false,
          updated: 0,
          error: error instanceof Error ? error.message : 'Failed to update employees',
        };
      }
    },
    [mutate]
  );

  const bulkDeleteEmployees = useCallback(
    async (ids: string[]): Promise<{ success: boolean; deleted: number; error?: string }> => {
      try {
        const response = await fetch('/api/employees', {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ employee_ids: ids }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          const errorMessage =
            (result as { error?: string }).error ??
            `Failed to delete employees (HTTP ${response.status})`;
          return { success: false, deleted: 0, error: errorMessage };
        }

        await mutate();
        return {
          success: true,
          deleted: (result as { deleted?: number }).deleted ?? ids.length,
        };
      } catch (error) {
        return {
          success: false,
          deleted: 0,
          error: error instanceof Error ? error.message : 'Failed to delete employees',
        };
      }
    },
    [mutate]
  );

  return {
    employees: data?.employees ?? [],
    isLoading: shouldFetch ? Boolean(isLoading ?? (!data && !error)) : false,
    isValidating,
    error,
    refresh,
    addEmployee,
    bulkUpdateEmployees,
    bulkDeleteEmployees,
  };
}
