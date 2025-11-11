'use client';

import { useReducer, useMemo, useCallback, memo, useState } from 'react';
import { Save, X, Plus, Trash2, ArrowLeft, Eye, ArrowUp, ArrowDown, Search } from 'lucide-react';
import Link from 'next/link';
import { MasterEmployeeRecord, CANONICAL_FIELDS } from '@/lib/types/master-employee';
import { generateEmployeeId } from '@/lib/analytics/column-mapper';
import { useEmployeesData } from '@/lib/hooks/use-employees';
import { AnimatePresence, motion } from 'framer-motion';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// UI State only - employee data comes from global store
interface TableState {
  saving: boolean;
  selectedIds: Set<string>;
  editedCells: Map<string, any>;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  visibleColumns: Set<string>;
}

// UI Actions only - employee mutations go through store
type TableAction =
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SORT'; payload: { field: string | null; order: 'asc' | 'desc' } }
  | { type: 'TOGGLE_SORT'; payload: string }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'SELECT_ALL'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'EDIT_CELL'; payload: { employeeId: string; field: string; value: any } }
  | { type: 'CLEAR_EDITS' }
  | { type: 'TOGGLE_COLUMN'; payload: string };

// ============================================================================
// REDUCER
// ============================================================================

// Reducer now only handles UI state
function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_SAVING':
      return { ...state, saving: action.payload };

    case 'SET_SEARCH':
      return { ...state, searchTerm: action.payload };

    case 'SET_SORT':
      return { ...state, sortField: action.payload.field, sortOrder: action.payload.order };

    case 'TOGGLE_SORT':
      if (state.sortField === action.payload) {
        return { ...state, sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { ...state, sortField: action.payload, sortOrder: 'asc' };

    case 'TOGGLE_SELECT': {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload);
      } else {
        newSelected.add(action.payload);
      }
      return { ...state, selectedIds: newSelected };
    }

    case 'SELECT_ALL': {
      const allIds = new Set(action.payload);
      const isAllSelected = action.payload.every((id) => state.selectedIds.has(id));
      return { ...state, selectedIds: isAllSelected ? new Set() : allIds };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() };

    case 'EDIT_CELL': {
      const { employeeId, field, value } = action.payload;
      const key = `${employeeId}:${field}`;
      const newEditedCells = new Map(state.editedCells);
      newEditedCells.set(key, value);
      return { ...state, editedCells: newEditedCells };
    }

    case 'CLEAR_EDITS':
      return { ...state, editedCells: new Map() };

    case 'TOGGLE_COLUMN': {
      const newVisible = new Set(state.visibleColumns);
      if (newVisible.has(action.payload)) {
        newVisible.delete(action.payload);
      } else {
        newVisible.add(action.payload);
      }
      return { ...state, visibleColumns: newVisible };
    }

    default:
      return state;
  }
}

// ============================================================================
// MEMOIZED ROW COMPONENT
// ============================================================================

interface EmployeeRowProps {
  employee: MasterEmployeeRecord;
  index: number;
  visibleColumns: string[];
  isSelected: boolean;
  editedCells: Map<string, any>;
  onToggleSelect: (id: string) => void;
  onCellEdit: (employeeId: string, field: string, value: any) => void;
  onComplexFieldClick?: (fieldKey: string, value: any) => void;
}

const EmployeeRow = memo(function EmployeeRow({
  employee,
  index,
  visibleColumns,
  isSelected,
  editedCells,
  onToggleSelect,
  onCellEdit,
  onComplexFieldClick,
}: EmployeeRowProps) {
  const handleCheckboxChange = useCallback(() => {
    onToggleSelect(employee.employee_id);
  }, [employee.employee_id, onToggleSelect]);

  return (
    <tr
      className={`border-b border-white/10 hover:bg-white/5 ${isSelected ? 'bg-blue-500/10' : ''}`}
    >
      <td className="px-1 py-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="rounded scale-75"
        />
      </td>
      <td className="px-1 py-0 text-gray-500 text-xs leading-tight">{index + 1}</td>
      {visibleColumns.map((fieldKey) => {
        const cellKey = `${employee.employee_id}:${fieldKey}`;
        // Use edited value if exists, otherwise use employee data
        const value = editedCells.has(cellKey)
          ? editedCells.get(cellKey)
          : (employee as any)[fieldKey];
        const isEdited = editedCells.has(cellKey);

        return (
          <EmployeeCell
            key={fieldKey}
            employeeId={employee.employee_id}
            fieldKey={fieldKey}
            value={value}
            isEdited={isEdited}
            onCellEdit={onCellEdit}
            onComplexFieldClick={onComplexFieldClick}
          />
        );
      })}
    </tr>
  );
});

// ============================================================================
// MEMOIZED CELL COMPONENT
// ============================================================================

interface EmployeeCellProps {
  employeeId: string;
  fieldKey: string;
  value: any;
  isEdited: boolean;
  onCellEdit: (employeeId: string, field: string, value: any) => void;
  onComplexFieldClick?: (fieldKey: string, value: any) => void;
}

const EmployeeCell = memo(function EmployeeCell({
  employeeId,
  fieldKey,
  value,
  isEdited,
  onCellEdit,
  onComplexFieldClick,
}: EmployeeCellProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCellEdit(employeeId, fieldKey, e.target.value);
    },
    [employeeId, fieldKey, onCellEdit]
  );

  // Handle complex data types (arrays, objects)
  const displayValue = useMemo(() => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (typeof value === 'object') {
      return '[Object]';
    }
    return String(value);
  }, [value]);

  // Don't allow editing of complex fields
  const isComplexField = Array.isArray(value) || (typeof value === 'object' && value !== null);

  const handleClick = useCallback(() => {
    if (isComplexField && onComplexFieldClick) {
      onComplexFieldClick(fieldKey, value);
    }
  }, [isComplexField, fieldKey, value, onComplexFieldClick]);

  return (
    <td className={`px-1 py-0 ${isEdited ? 'bg-yellow-500/10' : ''}`}>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onClick={handleClick}
        disabled={isComplexField}
        className={`w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 px-1 py-0 text-sm leading-tight ${isComplexField ? 'cursor-pointer hover:bg-white/5' : ''} disabled:opacity-70`}
        placeholder={fieldKey === 'employee_id' ? 'Required' : '—'}
        title={isComplexField ? 'Click to view details' : ''}
      />
    </td>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EmployeeTableEditor() {
  const {
    employees,
    isLoading,
    error: employeesError,
    refresh,
    addEmployee,
    bulkUpdateEmployees,
    bulkDeleteEmployees,
  } = useEmployeesData();

  // Local UI state
  const [state, dispatch] = useReducer(tableReducer, {
    saving: false,
    selectedIds: new Set<string>(),
    editedCells: new Map<string, any>(),
    sortField: 'employee_id',
    sortOrder: 'asc' as 'asc' | 'desc',
    searchTerm: '',
    visibleColumns: new Set<string>([
      'employee_id',
      'full_name',
      'email',
      'department',
      'job_title',
      'level',
      'status',
      'hire_date',
    ]),
  });

  // Complex field modal state
  const [complexFieldModal, setComplexFieldModal] = useState<{
    fieldKey: string;
    value: any;
  } | null>(null);

  // Column dropdown state
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // Memoized column list
  const allColumns = useMemo(() => {
    return Object.entries(CANONICAL_FIELDS).map(([key, meta]) => ({
      key,
      label: meta.display_name,
      category: meta.category,
    }));
  }, []);

  const visibleColumnsArray = useMemo(
    () => Array.from(state.visibleColumns),
    [state.visibleColumns]
  );

  // Memoized filtered and sorted employees (from global store)
  const displayedEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply search
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.full_name?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.employee_id?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term)
      );
    }

    // Apply sort
    if (state.sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[state.sortField!];
        const bVal = (b as any)[state.sortField!];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return state.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [employees, state.searchTerm, state.sortField, state.sortOrder]);

  // Callbacks
  const handleCellEdit = useCallback((employeeId: string, field: string, value: any) => {
    dispatch({ type: 'EDIT_CELL', payload: { employeeId, field, value } });
  }, []);

  const handleToggleSelect = useCallback((employeeId: string) => {
    dispatch({ type: 'TOGGLE_SELECT', payload: employeeId });
  }, []);

  const handleSort = useCallback((field: string) => {
    dispatch({ type: 'TOGGLE_SORT', payload: field });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = displayedEmployees.map((emp) => emp.employee_id);
    dispatch({ type: 'SELECT_ALL', payload: allIds });
  }, [displayedEmployees]);

  const handleSave = async () => {
    if (state.editedCells.size === 0) return;

    dispatch({ type: 'SET_SAVING', payload: true });

    try {
      // Group edits by employee
      const updates: Record<string, Partial<MasterEmployeeRecord>> = {};

      state.editedCells.forEach((value, key) => {
        const [employeeId, field] = key.split(':');
        if (!updates[employeeId]) {
          updates[employeeId] = { employee_id: employeeId };
        }
        updates[employeeId][field as keyof MasterEmployeeRecord] = value;
      });

      // Use store's bulk update
      const result = await bulkUpdateEmployees(Object.values(updates));

      if (result.success) {
        dispatch({ type: 'CLEAR_EDITS' });
        alert(`✓ Saved ${result.updated} employee records`);
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to save changes');
      console.error('Save error:', error);
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleAddEmployee = async () => {
    const newEmployee: MasterEmployeeRecord = {
      employee_id: generateEmployeeId(),
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to store
    const result = await addEmployee(newEmployee);

    if (result.success) {
      // Mark all visible fields as edited so user can fill them in
      state.visibleColumns.forEach((field) => {
        handleCellEdit(newEmployee.employee_id, field, (newEmployee as any)[field]);
      });
    } else {
      alert(`Failed to add employee: ${result.error}`);
    }
  };

  const handleDeleteSelected = async () => {
    if (state.selectedIds.size === 0) return;
    if (!confirm(`Delete ${state.selectedIds.size} employee(s)?`)) return;

    // Use store's bulk delete
    const result = await bulkDeleteEmployees(Array.from(state.selectedIds));

    if (result.success) {
      dispatch({ type: 'CLEAR_SELECTION' });
      alert(`✓ Deleted ${result.deleted} employee(s)`);
    } else {
      alert(`Failed to delete: ${result.error}`);
    }
  };

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    dispatch({ type: 'TOGGLE_COLUMN', payload: columnKey });
  }, []);

  const handleComplexFieldClick = useCallback((fieldKey: string, value: any) => {
    setComplexFieldModal({ fieldKey, value });
  }, []);

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-red-300">Unable to load employees</h2>
          <p className="text-sm text-red-200">
            {employeesError instanceof Error ? employeesError.message : 'Please try again later.'}
          </p>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 text-white p-6">
      <div className="max-w-[98%] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/data-sources"
              className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-xl border-2 border-white/20 bg-white/10 transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Data Sources
            </Link>
            <h1 className="text-3xl font-bold">Employee Records</h1>
            <p className="text-gray-400 mt-1">
              {employees.length} employees • {state.editedCells.size} unsaved changes
            </p>
          </div>

          <div className="flex gap-3">
            {state.editedCells.size > 0 && (
              <>
                <button
                  onClick={async () => {
                    dispatch({ type: 'CLEAR_EDITS' });
                    await refresh();
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-red-500/30 bg-red-500/20 px-4 py-2 transition-colors hover:bg-red-500/30"
                >
                  <X className="w-4 h-4" />
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={state.saving}
                  className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-2 font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {state.saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="employee-search" className="sr-only">
              Search employees by name, title, or department
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              aria-hidden="true"
            />
            <input
              id="employee-search"
              type="search"
              placeholder="Search employees..."
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              aria-label="Search employees"
              aria-describedby="search-results-count"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border-2 border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <div id="search-results-count" className="sr-only" role="status" aria-live="polite">
              {displayedEmployees.length} employees found
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleAddEmployee}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>

          {state.selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 rounded-lg border-2 border-red-500/30 bg-red-500/20 px-4 py-2 transition-colors hover:bg-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({state.selectedIds.size})
            </button>
          )}

          {/* Column Visibility */}
          <div className="relative">
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border-2 border-white/10 rounded-lg hover:border-white/20 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Columns
            </button>
            {isColumnDropdownOpen && (
              <div className="fixed right-4 top-auto mt-2 w-64 bg-gray-800 border-2 border-white/20 rounded-lg p-3 shadow-xl z-50 max-h-96 overflow-y-auto">
                {allColumns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 py-1 hover:bg-white/5 px-2 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={state.visibleColumns.has(col.key)}
                      onChange={() => toggleColumnVisibility(col.key)}
                      className="rounded"
                    />
                    <span className="text-sm">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Virtualized Table */}
        <div className="bg-white/5 border-2 border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-1 py-0.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={
                        state.selectedIds.size === displayedEmployees.length &&
                        displayedEmployees.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded scale-75"
                    />
                  </th>
                  <th className="px-1 py-0.5 text-left w-10 text-xs leading-tight">#</th>
                  {visibleColumnsArray.map((fieldKey) => {
                    const meta = CANONICAL_FIELDS[fieldKey];
                    if (!meta) return null;

                    return (
                      <th
                        key={fieldKey}
                        className="px-1 py-0.5 text-left font-semibold whitespace-nowrap cursor-pointer hover:bg-white/5 text-xs leading-tight"
                        onClick={() => handleSort(fieldKey)}
                      >
                        <div className="flex items-center gap-1">
                          {meta.display_name}
                          {state.sortField === fieldKey &&
                            (state.sortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>

            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <tbody>
                  {displayedEmployees.map((employee, index) => (
                    <EmployeeRow
                      key={employee.employee_id}
                      employee={employee}
                      index={index}
                      visibleColumns={visibleColumnsArray}
                      isSelected={state.selectedIds.has(employee.employee_id)}
                      editedCells={state.editedCells}
                      onToggleSelect={handleToggleSelect}
                      onCellEdit={handleCellEdit}
                      onComplexFieldClick={handleComplexFieldClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {displayedEmployees.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No employees found</p>
            {state.searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
          </div>
        )}
      </div>

      {/* Complex Field Modal */}
      <AnimatePresence>
        {complexFieldModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setComplexFieldModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border-2 border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {CANONICAL_FIELDS[complexFieldModal.fieldKey]?.display_name ||
                    complexFieldModal.fieldKey}
                </h3>
                <button
                  onClick={() => setComplexFieldModal(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-auto flex-1">
                {Array.isArray(complexFieldModal.value) ? (
                  <div className="space-y-4">
                    {complexFieldModal.value.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="text-sm font-semibold text-blue-400 mb-2">
                          Item {index + 1}
                        </div>
                        <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : typeof complexFieldModal.value === 'object' ? (
                  <pre className="text-sm whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(complexFieldModal.value, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-300">{String(complexFieldModal.value)}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
