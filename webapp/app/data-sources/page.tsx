import { DataSourceManager } from '@/components/custom/DataSourceManager';

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-radial-cream text-charcoal overflow-hidden">
      {/* Floating background orbs - warm colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-terracotta/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-sage/12 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-amber/10 rounded-full blur-[100px] animate-pulse delay-500" />
      </div>

      <div className="relative z-10">
        <DataSourceManager />
      </div>
    </div>
  );
}
