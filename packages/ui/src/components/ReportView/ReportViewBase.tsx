import React from 'react';
import {
  X,
  FileText,
  Copy,
  Share2,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

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

type ReportType = 'analysis-snapshot' | 'investigation-report' | 'improvement-story';
type ReportWorkspace = 'analysis' | 'findings' | 'improvement';
type AudienceMode = 'technical' | 'summary';

interface SectionDescriptor {
  id: string;
  stepNumber: number;
  title: string;
  status: 'done' | 'active' | 'future';
  workspace: ReportWorkspace;
}

export interface ReportViewBaseProps {
  processName: string;
  analystName?: string;
  reportType: ReportType;
  sections: SectionDescriptor[];
  activeSectionId: string | null;
  audienceMode?: AudienceMode;
  onAudienceModeChange?: (mode: AudienceMode) => void;
  onScrollToSection: (id: string) => void;
  renderSection: (section: SectionDescriptor) => React.ReactNode;
  onCopyAllCharts?: () => void;
  onPrintReport?: () => void;
  onShareReport?: () => void;
  onPublishToSharePoint?: () => void;
  onPublishReplace?: () => void;
  publishStatus?: 'idle' | 'rendering' | 'uploading' | 'success' | 'error' | 'exists';
  publishError?: string | null;
  onPublishReset?: () => void;
  /** SharePoint web URL of the published report (shown as clickable link on success) */
  publishedUrl?: string | null;
  onClose: () => void;
  canShareViaTeams?: boolean;
  colorScheme?: Partial<ReportViewBaseColorScheme>;
  /** Ref to attach to the scrollable content area (for measuring width) */
  contentRef?: React.RefObject<HTMLDivElement>;
}

const BADGE_COLORS: Record<ReportType, string> = {
  'analysis-snapshot': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  'investigation-report': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'improvement-story': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

const BADGE_LABELS: Record<ReportType, string> = {
  'analysis-snapshot': 'Analysis Snapshot',
  'investigation-report': 'Investigation Report',
  'improvement-story': 'Improvement Story',
};

const WORKSPACE_COLORS: Record<ReportWorkspace, { border: string; text: string; dot: string }> = {
  analysis: {
    border: 'border-l-green-500',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
  findings: {
    border: 'border-l-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  improvement: {
    border: 'border-l-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
};

const WORKSPACE_LABELS: Record<ReportWorkspace, string> = {
  analysis: 'ANALYSIS',
  findings: 'FINDINGS',
  improvement: 'IMPROVEMENT',
};

/** Group sections by workspace, preserving order. */
function groupByWorkspace(
  sections: SectionDescriptor[]
): Array<{ workspace: ReportWorkspace; sections: SectionDescriptor[] }> {
  const groups: Array<{ workspace: ReportWorkspace; sections: SectionDescriptor[] }> = [];
  let currentWorkspace: ReportWorkspace | null = null;

  for (const section of sections) {
    if (section.workspace !== currentWorkspace) {
      currentWorkspace = section.workspace;
      groups.push({ workspace: currentWorkspace, sections: [] });
    }
    groups[groups.length - 1].sections.push(section);
  }

  return groups;
}

export const ReportViewBase: React.FC<ReportViewBaseProps> = ({
  processName,
  analystName,
  reportType,
  sections,
  activeSectionId,
  audienceMode = 'technical',
  onAudienceModeChange,
  onScrollToSection,
  renderSection,
  onCopyAllCharts,
  onPrintReport,
  onShareReport,
  onPublishToSharePoint,
  onPublishReplace,
  publishStatus,
  publishError,
  onPublishReset,
  publishedUrl,
  onClose,
  canShareViaTeams,
  colorScheme,
  contentRef,
}) => {
  const { t } = useTranslation();
  const scheme: ReportViewBaseColorScheme = {
    ...reportViewBaseDefaultColorScheme,
    ...colorScheme,
  };

  const workspaceGroups = groupByWorkspace(sections);

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

        {/* TOC items grouped by workspace */}
        <nav className="flex-1 py-2">
          {workspaceGroups.map(group => {
            const wsColors = WORKSPACE_COLORS[group.workspace];
            return (
              <div key={group.workspace}>
                {/* Workspace group header */}
                <div className={`px-4 py-1.5 mt-2 first:mt-0 border-l-2 ${wsColors.border}`}>
                  <span className={`text-[10px] font-semibold tracking-widest ${wsColors.text}`}>
                    {WORKSPACE_LABELS[group.workspace]}
                  </span>
                </div>

                {/* Section items */}
                {group.sections.map(section => {
                  const isActive = section.id === activeSectionId;
                  return (
                    <button
                      key={section.id}
                      className={`w-full text-left flex items-center gap-2 ${isActive ? scheme.sidebarItemActive : scheme.sidebarItem}`}
                      onClick={() => onScrollToSection(section.id)}
                    >
                      {/* Status dot with workspace color */}
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          section.status === 'done'
                            ? 'bg-green-500'
                            : section.status === 'active'
                              ? wsColors.dot
                              : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                      <span className="truncate">{section.title}</span>
                    </button>
                  );
                })}
              </div>
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
          {onPrintReport && (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              onClick={onPrintReport}
              data-testid="report-save-pdf"
            >
              <Printer size={14} />
              Save as PDF
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
          {onPublishToSharePoint && (
            <>
              {(!publishStatus || publishStatus === 'idle') && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  onClick={onPublishToSharePoint}
                >
                  <Upload size={14} />
                  Publish to SharePoint
                </button>
              )}
              {(publishStatus === 'rendering' || publishStatus === 'uploading') && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400">
                  <Loader2 size={14} className="animate-spin" />
                  {publishStatus === 'rendering' ? 'Rendering report…' : 'Uploading…'}
                </div>
              )}
              {publishStatus === 'success' &&
                (publishedUrl ? (
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    <Check size={14} />
                    Published to SharePoint
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                    <Check size={14} />
                    Published to SharePoint
                  </div>
                ))}
              {publishStatus === 'exists' && onPublishReplace && onPublishReset && (
                <div className="space-y-1">
                  <p className="px-3 py-1 text-xs text-amber-600 dark:text-amber-400">
                    Report already exists in SharePoint.
                  </p>
                  <div className="flex gap-1 px-3">
                    <button
                      className="flex-1 px-2 py-1 text-xs text-white bg-amber-500 hover:bg-amber-600 rounded transition-colors"
                      onClick={onPublishReplace}
                    >
                      Replace
                    </button>
                    <button
                      className="flex-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                      onClick={onPublishReset}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {publishStatus === 'error' && onPublishReset && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={14} />
                    {publishError || 'Publish failed'}
                  </div>
                  <button
                    className="w-full px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    onClick={onPublishReset}
                  >
                    Try again
                  </button>
                </div>
              )}
            </>
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
            aria-label={t('action.close')}
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

          {/* Audience toggle */}
          {onAudienceModeChange && (
            <div
              className="hidden sm:flex items-center rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden"
              data-export-hide
            >
              <button
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  audienceMode === 'technical'
                    ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                onClick={() => onAudienceModeChange('technical')}
              >
                Technical
              </button>
              <button
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  audienceMode === 'summary'
                    ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                onClick={() => onAudienceModeChange('summary')}
              >
                Summary
              </button>
            </div>
          )}

          {/* Mobile TOC dropdown (visible below lg breakpoint) */}
          <select
            className="lg:hidden text-sm bg-transparent border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
            value={activeSectionId ?? ''}
            onChange={e => onScrollToSection(e.target.value)}
            aria-label="Navigate to section"
          >
            {workspaceGroups.map(group => (
              <optgroup key={group.workspace} label={WORKSPACE_LABELS[group.workspace]}>
                {group.sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.status === 'done'
                      ? '\u2713'
                      : section.status === 'active'
                        ? '\u25CF'
                        : '\u25CB'}{' '}
                    {section.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {analystName && (
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {analystName}
            </span>
          )}
        </header>

        {/* Scrollable content */}
        <div className={scheme.content} ref={contentRef}>
          <div className="max-w-4xl mx-auto px-6 py-6">
            {/* Print-only header (hidden on screen) */}
            <div data-report-print-header>
              <div className="flex justify-between text-xs text-slate-500 border-b border-slate-300 pb-2 mb-4">
                <span>{processName}</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {sections.map(section => renderSection(section))}

            {/* Print-only footer (hidden on screen) */}
            <div data-report-print-footer>
              <div className="flex justify-between text-xs text-slate-400 border-t border-slate-300 pt-2 mt-8">
                <span>{analystName ?? ''}</span>
                <span>Generated by VariScout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
