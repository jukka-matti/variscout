import React from 'react';
import { Pin } from 'lucide-react';
import type { Finding } from '@variscout/core';
import FindingCard from './FindingCard';

export interface FindingsLogProps {
  /** List of findings to display */
  findings: Finding[];
  /** Edit a finding's note */
  onEditFinding: (id: string, text: string) => void;
  /** Delete a finding */
  onDeleteFinding: (id: string) => void;
  /** Click a finding card to restore its filter state */
  onRestoreFinding: (id: string) => void;
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** ID of the finding that matches current active filters (if any) */
  activeFindingId?: string | null;
}

/**
 * Scrollable list of analyst findings.
 * Shows empty state with guidance when no findings exist.
 */
const FindingsLog: React.FC<FindingsLogProps> = ({
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  columnAliases,
  activeFindingId,
}) => {
  if (findings.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-surface-tertiary/50 flex items-center justify-center mb-3">
          <Pin size={18} className="text-content-muted" />
        </div>
        <p className="text-sm text-content-secondary mb-1">No findings yet</p>
        <p className="text-xs text-content-muted leading-relaxed max-w-[240px]">
          Pin interesting filter combinations as you explore. Click the pin button in the breadcrumb
          bar to save your current view.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" data-testid="findings-list">
      {findings.map(finding => (
        <FindingCard
          key={finding.id}
          finding={finding}
          onEdit={onEditFinding}
          onDelete={onDeleteFinding}
          onRestore={onRestoreFinding}
          columnAliases={columnAliases}
          isActive={finding.id === activeFindingId}
        />
      ))}
    </div>
  );
};

export default FindingsLog;
