import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FindingsPanelBase, type FindingsPanelBaseProps } from '@variscout/ui';
import type { FindingAssignee } from '@variscout/core';
import PeoplePicker from './PeoplePicker';

const RESIZE_CONFIG = {
  storageKey: 'variscout-azure-findings-panel-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

interface FindingsPanelProps extends Omit<FindingsPanelBaseProps, 'resizeConfig'> {
  /** Callback to persist assignee on a finding */
  onSetFindingAssignee?: (id: string, assignee: FindingAssignee | null) => void;
}

const FindingsPanel: React.FC<FindingsPanelProps> = ({ onSetFindingAssignee, ...props }) => {
  const [assigningFindingId, setAssigningFindingId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    if (!assigningFindingId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAssigningFindingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [assigningFindingId]);

  const handleAssignFinding = useCallback((findingId: string) => {
    setAssigningFindingId(prev => (prev === findingId ? null : findingId));
  }, []);

  const handlePersonSelect = useCallback(
    (assignee: FindingAssignee) => {
      if (assigningFindingId && onSetFindingAssignee) {
        onSetFindingAssignee(assigningFindingId, assignee);
      }
      setAssigningFindingId(null);
    },
    [assigningFindingId, onSetFindingAssignee]
  );

  return (
    <div className="relative flex flex-col">
      <FindingsPanelBase
        {...props}
        resizeConfig={RESIZE_CONFIG}
        onAssignFinding={onSetFindingAssignee ? handleAssignFinding : undefined}
      />

      {/* PeoplePicker popover — floating over the findings panel */}
      {assigningFindingId && (
        <div
          ref={popoverRef}
          className="absolute top-12 left-4 right-4 z-50 bg-surface border border-edge rounded-xl shadow-lg p-3"
          data-testid="assign-popover"
        >
          <div className="text-xs text-content-secondary mb-2">Assign to:</div>
          <PeoplePicker
            selected={null}
            onSelect={handlePersonSelect}
            onClear={() => setAssigningFindingId(null)}
            placeholder="Search people..."
          />
        </div>
      )}
    </div>
  );
};

export default FindingsPanel;
