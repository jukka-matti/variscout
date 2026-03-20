import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { ReportStepMarker } from './ReportStepMarker';

type ReportWorkspace = 'analysis' | 'findings' | 'improvement';

const WORKSPACE_BORDER_COLORS: Record<ReportWorkspace, string> = {
  analysis: 'border-l-green-500',
  findings: 'border-l-amber-500',
  improvement: 'border-l-purple-500',
};

export interface ReportSectionColorScheme {
  container: string;
  header: string;
  title: string;
  content: string;
  copyButton: string;
}

export const reportSectionDefaultColorScheme: ReportSectionColorScheme = {
  container: 'border-b border-slate-200 dark:border-slate-700',
  header: 'flex items-center gap-3 py-4 cursor-pointer select-none',
  title: 'text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1',
  content: 'pb-6 space-y-4',
  copyButton:
    'p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors',
};

export interface ReportSectionProps {
  id: string;
  stepNumber: number;
  title: string;
  status: 'done' | 'active' | 'future';
  workspace?: ReportWorkspace;
  sectionRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  onCopyAsSlide?: () => void;
  copyFeedback?: boolean;
  defaultOpen?: boolean;
  /** When true, section renders open regardless of local state (used for print export) */
  forceOpen?: boolean;
  colorScheme?: Partial<ReportSectionColorScheme>;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  id,
  stepNumber,
  title,
  status,
  workspace,
  sectionRef,
  children,
  onCopyAsSlide,
  copyFeedback,
  defaultOpen,
  forceOpen,
  colorScheme,
}) => {
  const scheme: ReportSectionColorScheme = {
    ...reportSectionDefaultColorScheme,
    ...colorScheme,
  };

  const isFuture = status === 'future';
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen ?? !isFuture);

  const handleToggle = () => {
    if (!isFuture) {
      setIsOpen(prev => !prev);
    }
  };

  const borderClass = workspace ? `border-l-2 ${WORKSPACE_BORDER_COLORS[workspace]} pl-3` : '';

  return (
    <div
      id={id}
      ref={sectionRef}
      data-report-section
      className={`${scheme.container} ${borderClass} ${isFuture ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div
        className={scheme.header}
        onClick={handleToggle}
        role={isFuture ? undefined : 'button'}
        aria-expanded={isFuture ? undefined : isOpen}
      >
        <ReportStepMarker stepNumber={stepNumber} status={status} workspace={workspace} />

        <span className={scheme.title}>{title}</span>

        {/* Copy as slide button */}
        {onCopyAsSlide && !isFuture && (
          <button
            className={scheme.copyButton}
            onClick={e => {
              e.stopPropagation();
              onCopyAsSlide();
            }}
            aria-label={`Copy "${title}" as slide`}
            title="Copy as slide"
            data-export-hide
          >
            {copyFeedback ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}

        {/* Chevron */}
        {!isFuture && (
          <span className="text-slate-400 dark:text-slate-500" data-export-hide>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </div>

      {/* Content */}
      {(forceOpen || (isOpen && !isFuture)) && <div className={scheme.content}>{children}</div>}
    </div>
  );
};
