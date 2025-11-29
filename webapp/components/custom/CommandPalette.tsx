'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, FileText, Search, Settings, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const commands = [
  { icon: Users, label: 'View All Employees', category: 'Navigation' },
  { icon: FileText, label: 'Generate Report', category: 'Actions' },
  { icon: Calendar, label: 'Schedule Interview', category: 'Actions' },
  { icon: TrendingUp, label: 'Analytics Dashboard', category: 'Navigation' },
  { icon: Settings, label: 'System Settings', category: 'Settings' },
  { icon: Users, label: 'Add New Employee', category: 'Actions' },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((prev) => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="backdrop-blur-2xl bg-black/90 border-2 border-white/30 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b-2 border-white/20">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
                />
                <kbd className="px-2 py-1 bg-white/5 border border-white/20 rounded text-xs text-gray-400">
                  ESC
                </kbd>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">No results found</div>
                ) : (
                  filteredCommands.map((cmd, index) => {
                    const Icon = cmd.icon;
                    return (
                      <motion.div
                        key={cmd.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selected === index
                            ? 'bg-blue-500/20 border-2 border-blue-500/70'
                            : 'hover:bg-white/5 border-2 border-transparent hover:border-white/20'
                        }`}
                        onMouseEnter={() => setSelected(index)}
                        onClick={onClose}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white">{cmd.label}</p>
                          <p className="text-xs text-gray-500">{cmd.category}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
