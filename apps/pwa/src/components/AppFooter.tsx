import React from 'react';

interface AppFooterProps {
  filteredCount: number;
  totalCount: number;
}

/**
 * Application footer showing data privacy message and row counts
 */
const AppFooter: React.FC<AppFooterProps> = ({ filteredCount, totalCount }) => {
  return (
    <footer className="h-8 border-t border-slate-800 bg-slate-900 flex items-center px-4 sm:px-6 text-[10px] text-slate-500 justify-between">
      <div className="hidden sm:block">100% Browser-Based | Your Data Stays On Your Device</div>
      <div className="sm:hidden">Offline-First PWA</div>
      <div className="flex gap-2 sm:gap-4">
        <span>
          Rows: {filteredCount}/{totalCount}
        </span>
        <span className="hidden sm:inline">v1.0.0</span>
      </div>
    </footer>
  );
};

export default AppFooter;
