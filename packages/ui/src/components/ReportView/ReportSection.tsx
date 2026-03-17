import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { ReportStepMarker } from './ReportStepMarker';

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
  sectionRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  onCopyAsSlide?: () => void;
  copyFeedback?: boolean;
  defaultOpen?: boolean;
  colorScheme?: Partial<ReportSectionColorScheme>;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  id,
  stepNumber,
  title,
  status,
  sectionRef,
  children,
  onCopyAsSlide,
  copyFeedback,
  defaultOpen,
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

  return (
    <div id={id} ref={sectionRef} className={`${scheme.container} ${isFuture ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div
        className={scheme.header}
        onClick={handleToggle}
        role={isFuture ? undefined : 'button'}
        aria-expanded={isFuture ? undefined : isOpen}
      >
        <ReportStepMarker stepNumber={stepNumber} status={status} />

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
      {isOpen && !isFuture && <div className={scheme.content}>{children}</div>}
    </div>
  );
};
