'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Save, X, Plus, Trash2, ArrowLeft, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown,
  Search, Filter, Download, Upload
} from 'lucide-react';
import Link from 'next/link';
import { MasterEmployeeRecord, CANONICAL_FIELDS } from '@/lib/types/master-employee';
import { generateEmployeeId } from '@/lib/analytics/column-mapper';

interface EditedCell {
  employeeId: string;
  field: string;
  value: any;
}

export function EmployeeTableEditor() {
  const [employees, setEmployees] = useState<MasterEmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedCells, setEditedCells] = useState<Map<string, any>>(new Map());
  const [sortField, setSortField] = useState<string | null>('employee_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'employee_id', 'full_name', 'email', 'phone', 'department', 'job_title',
    'level', 'status', 'hire_date', 'relationship'
  ]));

  // Default visible columns for initial display
  const defaultColumns = ['employee_id', 'full_name', 'email', 'phone', 'department', 'job_title', 'level', 'status', 'hire_date', 'relationship'];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all possible columns from canonical fields
  const allColumns = useMemo(() => {
    return Object.entries(CANONICAL_FIELDS).map(([key, meta]) => ({
      key,
      label: meta.display_name,
      category: meta.category
    }));
  }, []);

  // Filter and sort employees
  const displayedEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.full_name?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term)
      );
    }

    // Apply sort
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [employees, searchTerm, sortField, sortOrder]);

  const handleCellEdit = (employeeId: string, field: string, value: any) => {
    const key = `${employeeId}:${field}`;
    const newEditedCells = new Map(editedCells);
    newEditedCells.set(key, value);
    setEditedCells(newEditedCells);

    // Update local state immediately for UX
    setEmployees(prev => prev.map(emp =>
      emp.employee_id === employeeId
        ? { ...emp, [field]: value }
        : emp
    ));
  };

  const handleSave = async () => {
    if (editedCells.size === 0) return;

    setSaving(true);

    try {
      // Group edits by employee
      const updates: Record<string, Partial<MasterEmployeeRecord>> = {};

      editedCells.forEach((value, key) => {
        const [employeeId, field] = key.split(':');
        if (!updates[employeeId]) {
          updates[employeeId] = { employee_id: employeeId };
        }
        updates[employeeId][field as keyof MasterEmployeeRecord] = value;
      });

      // Send bulk update
      const response = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: Object.values(updates) })
      });

      const result = await response.json();

      if (result.success) {
        setEditedCells(new Map());
        alert(`✓ Saved ${result.updated} employee records`);
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to save changes');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = () => {
    const newEmployee: MasterEmployeeRecord = {
      employee_id: generateEmployeeId(),
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEmployees(prev => [newEmployee, ...prev]);

    // Mark all fields as edited for new employee
    visibleColumns.forEach(field => {
      const key = `${newEmployee.employee_id}:${field}`;
      editedCells.set(key, (newEmployee as any)[field]);
    });
    setEditedCells(new Map(editedCells));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Delete ${selectedIds.size} employee(s)?`)) return;

    try {
      const response = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_ids: Array.from(selectedIds) })
      });

      const result = await response.json();

      if (result.success) {
        setEmployees(prev => prev.filter(emp => !selectedIds.has(emp.employee_id)));
        setSelectedIds(new Set());
        alert(`✓ Deleted ${result.deleted} employee(s)`);
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to delete employees');
      console.error('Delete error:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === displayedEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedEmployees.map(emp => emp.employee_id)));
    }
  };

  const toggleSelect = (employeeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedIds(newSelected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading employees...</p>
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
            <Link href="/data-sources">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 mb-3 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Data Sources
              </motion.button>
            </Link>
            <h1 className="text-3xl font-bold">Employee Records</h1>
            <p className="text-gray-400 mt-1">
              {employees.length} employees • {editedCells.size} unsaved changes
            </p>
          </div>

          <div className="flex gap-3">
            {editedCells.size > 0 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditedCells(new Map());
                    loadEmployees();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/30 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Discard Changes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border-2 border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddEmployee}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </motion.button>

          {selectedIds.size > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.size})
            </motion.button>
          )}

          {/* Column Visibility */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border-2 border-white/10 rounded-lg hover:border-white/20 transition-colors">
              <Eye className="w-4 h-4" />
              Columns
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border-2 border-white/20 rounded-lg p-3 hidden group-hover:block z-10 max-h-96 overflow-y-auto">
              {allColumns.map(col => (
                <label key={col.key} className="flex items-center gap-2 py-1 hover:bg-white/5 px-2 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.key)}
                    onChange={() => toggleColumnVisibility(col.key)}
                    className="rounded"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border-2 border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === displayedEmployees.length && displayedEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left w-10">#</th>
                  {Array.from(visibleColumns).map(fieldKey => {
                    const meta = CANONICAL_FIELDS[fieldKey];
                    if (!meta) return null;

                    return (
                      <th
                        key={fieldKey}
                        className="px-3 py-3 text-left font-semibold whitespace-nowrap cursor-pointer hover:bg-white/5"
                        onClick={() => handleSort(fieldKey)}
                      >
                        <div className="flex items-center gap-2">
                          {meta.display_name}
                          {sortField === fieldKey && (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayedEmployees.map((employee, idx) => (
                  <tr
                    key={employee.employee_id}
                    className={`border-b border-white/10 hover:bg-white/5 ${
                      selectedIds.has(employee.employee_id) ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(employee.employee_id)}
                        onChange={() => toggleSelect(employee.employee_id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    {Array.from(visibleColumns).map(fieldKey => {
                      const value = (employee as any)[fieldKey];
                      const cellKey = `${employee.employee_id}:${fieldKey}`;
                      const isEdited = editedCells.has(cellKey);

                      return (
                        <td
                          key={fieldKey}
                          className={`px-3 py-2 ${isEdited ? 'bg-yellow-500/10' : ''}`}
                        >
                          <input
                            type="text"
                            value={value ?? ''}
                            onChange={(e) => handleCellEdit(employee.employee_id, fieldKey, e.target.value)}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-2 py-1"
                            placeholder={fieldKey === 'employee_id' ? 'Required' : '—'}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {displayedEmployees.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No employees found</p>
            {searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
          </div>
        )}
      </div>
    </div>
  );
}
