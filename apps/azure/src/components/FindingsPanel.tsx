import React, { useState, useCallback, useEffect } from 'react';
import { FindingsPanelBase, type FindingsPanelBaseProps } from '@variscout/ui';
import type { FindingAssignee, FindingSource } from '@variscout/core';
import { hasTeamFeatures } from '@variscout/core';
import { AssigneeInput } from './AssigneeInput';
import { getEasyAuthUser } from '../auth/easyAuth';

const RESIZE_CONFIG = {
  storageKey: 'variscout-azure-findings-panel-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

interface FindingsPanelProps extends Omit<FindingsPanelBaseProps, 'resizeConfig'> {
  /** Callback to persist assignee on a finding */
  onSetFindingAssignee?: (id: string, assignee: FindingAssignee | null) => void;
  /** Navigate to the chart that sourced a finding */
  onNavigateToChart?: (source: FindingSource) => void;
}

const FindingsPanel: React.FC<FindingsPanelProps> = ({
  onSetFindingAssignee,
  onNavigateToChart,
  ...props
}) => {
  const [assigningFindingId, setAssigningFindingId] = useState<string | null>(null);
  const [currentUserUpn, setCurrentUserUpn] = useState<string | undefined>();

  useEffect(() => {
    getEasyAuthUser().then(user => {
      if (user?.email) setCurrentUserUpn(user.email);
    });
  }, []);

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

  const renderAssignSlot = useCallback(
    (findingId: string) => {
      if (findingId !== assigningFindingId) return null;
      return (
        <div
          className="mt-1.5 border border-edge rounded-lg p-2 bg-surface"
          data-testid="assign-inline"
        >
          <div className="text-xs text-content-secondary mb-1.5">Assign to:</div>
          <AssigneeInput
            selected={null}
            onSelect={handlePersonSelect}
            onClear={() => setAssigningFindingId(null)}
            placeholder="Search people..."
          />
        </div>
      );
    },
    [assigningFindingId, handlePersonSelect]
  );

  const renderActionAssigneePicker = useCallback(
    (onSelect: (a: FindingAssignee) => void) => (
      <div className="mt-0.5">
        <AssigneeInput
          selected={null}
          onSelect={onSelect}
          onClear={() => {}}
          placeholder="Assign action to..."
        />
      </div>
    ),
    []
  );

  return (
    <FindingsPanelBase
      {...props}
      resizeConfig={RESIZE_CONFIG}
      onAssignFinding={onSetFindingAssignee ? handleAssignFinding : undefined}
      renderAssignSlot={onSetFindingAssignee ? renderAssignSlot : undefined}
      onNavigateToChart={onNavigateToChart}
      renderActionAssigneePicker={hasTeamFeatures() ? renderActionAssigneePicker : undefined}
      currentUserUpn={currentUserUpn}
    />
  );
};

export default FindingsPanel;
