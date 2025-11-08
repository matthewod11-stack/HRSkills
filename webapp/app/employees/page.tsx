'use client';

import { EmployeeTableEditor } from '@/components/custom/EmployeeTableEditor';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logComponentError } from '@/lib/errorLogging';

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {/* Floating background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        <ErrorBoundary
          level="page"
          onError={(error, errorInfo) => {
            logComponentError(error, errorInfo, 'EmployeesPage');
          }}
        >
          <EmployeeTableEditor />
        </ErrorBoundary>
      </div>
    </div>
  );
}
