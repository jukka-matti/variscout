import React from 'react';
import { X, FileText, Copy, Share2 } from 'lucide-react';

export interface ReportViewBaseColorScheme {
  container: string;
  sidebar: string;
  sidebarItem: string;
  sidebarItemActive: string;
  content: string;
  header: string;
  badge: string;
  footer: string;
}

export const reportViewBaseDefaultColorScheme: ReportViewBaseColorScheme = {
  container: 'fixed inset-0 z-50 flex bg-slate-50 dark:bg-slate-900',
  sidebar:
    'hidden lg:flex w-60 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto',
  sidebarItem:
    'px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors',
  sidebarItemActive:
    'px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 cursor-pointer',
  content: 'flex-1 overflow-y-auto',
  header:
    'sticky top-0 z-10 flex items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
  badge: 'px-2 py-0.5 rounded-full text-xs font-medium',
  footer: 'p-4 border-t border-slate-200 dark:border-slate-700 space-y-2',
};

type ReportType = 'quick-check' | 'deep-dive' | 'full-cycle';

interface SectionDescriptor {
  id: string;
  stepNumber: number;
  title: string;
  status: 'done' | 'active' | 'future';
}

export interface ReportViewBaseProps {
  processName: string;
  analystName?: string;
  reportType: ReportType;
  sections: SectionDescriptor[];
  activeSectionId: string | null;
  onScrollToSection: (id: string) => void;
  renderSection: (section: SectionDescriptor) => React.ReactNode;
  onCopyAllCharts?: () => void;
  onShareReport?: () => void;
  onClose: () => void;
  canShareViaTeams?: boolean;
  colorScheme?: Partial<ReportViewBaseColorScheme>;
}

const BADGE_COLORS: Record<ReportType, string> = {
  'quick-check': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'deep-dive': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'full-cycle': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
};

const BADGE_LABELS: Record<ReportType, string> = {
  'quick-check': 'Quick Check',
  'deep-dive': 'Deep Dive',
  'full-cycle': 'Full Cycle',
};

export const ReportViewBase: React.FC<ReportViewBaseProps> = ({
  processName,
  analystName,
  reportType,
  sections,
  activeSectionId,
  onScrollToSection,
  renderSection,
  onCopyAllCharts,
  onShareReport,
  onClose,
  canShareViaTeams,
  colorScheme,
}) => {
  const scheme: ReportViewBaseColorScheme = {
    ...reportViewBaseDefaultColorScheme,
    ...colorScheme,
  };

  return (
    <div className={scheme.container}>
      {/* Sidebar TOC (desktop only) */}
      <aside className={scheme.sidebar}>
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Sections
          </p>
        </div>

        {/* TOC items */}
        <nav className="flex-1 py-2">
          {sections.map(section => {
            const isActive = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                className={`w-full text-left flex items-center gap-2 ${isActive ? scheme.sidebarItemActive : scheme.sidebarItem}`}
                onClick={() => onScrollToSection(section.id)}
              >
                {/* Tiny status dot */}
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    section.status === 'done'
                      ? 'bg-green-500'
                      : section.status === 'active'
                        ? 'bg-blue-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span className="truncate">{section.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className={scheme.footer}>
          {onCopyAllCharts && (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              onClick={onCopyAllCharts}
            >
              <Copy size={14} />
              Copy All Charts
            </button>
          )}
          {canShareViaTeams && onShareReport && (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              onClick={onShareReport}
            >
              <Share2 size={14} />
              Share Report
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={scheme.header}>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Close report"
          >
            <X size={18} />
          </button>

          <FileText size={18} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />

          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate flex-1">
            {processName}
          </h1>

          <span className={`${scheme.badge} ${BADGE_COLORS[reportType]}`}>
            {BADGE_LABELS[reportType]}
          </span>

          {analystName && (
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {analystName}
            </span>
          )}
        </header>

        {/* Scrollable content */}
        <div className={scheme.content}>
          <div className="max-w-4xl mx-auto px-6 py-6">
            {sections.map(section => renderSection(section))}
          </div>
        </div>
      </div>
    </div>
  );
};
