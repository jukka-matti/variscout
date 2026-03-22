import React, { useState, useCallback } from 'react';
import type { HypothesisStatus } from '@variscout/core';
import { HYPOTHESIS_STATUS_LABELS, interpretEvidence } from '@variscout/core';

// ============================================================================
// Validation Task Section (gemba/expert)
// ============================================================================

export interface ValidationTaskSectionProps {
  hypothesisId: string;
  validationTask?: string;
  taskCompleted?: boolean;
  manualNote?: string;
  onSetValidationTask?: (id: string, task: string) => void;
  onCompleteTask?: (id: string) => void;
  onSetManualStatus?: (id: string, status: HypothesisStatus, note?: string) => void;
}

export const ValidationTaskSection: React.FC<ValidationTaskSectionProps> = ({
  hypothesisId,
  validationTask,
  taskCompleted,
  manualNote,
  onSetValidationTask,
  onCompleteTask,
  onSetManualStatus,
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [noteInput, setNoteInput] = useState(manualNote ?? '');

  const handleTaskKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = taskInput.trim();
        if (trimmed && onSetValidationTask) {
          onSetValidationTask(hypothesisId, trimmed);
          setTaskInput('');
        }
      }
    },
    [hypothesisId, taskInput, onSetValidationTask]
  );

  // State 1: No task yet
  if (!validationTask) {
    return (
      <div className="ml-6 mt-1.5" data-testid={`validation-task-section-${hypothesisId}`}>
        <input
          type="text"
          className="w-full text-xs bg-transparent border-b border-edge text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 py-0.5"
          placeholder="What needs to be checked?"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onKeyDown={handleTaskKeyDown}
          data-testid={`validation-task-input-${hypothesisId}`}
        />
      </div>
    );
  }

  // State 2: Task exists but not completed
  if (!taskCompleted) {
    return (
      <div className="ml-6 mt-1.5" data-testid={`validation-task-section-${hypothesisId}`}>
        <label className="flex items-center gap-2 text-xs text-content cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-edge"
            onChange={() => onCompleteTask?.(hypothesisId)}
            data-testid={`validation-task-complete-${hypothesisId}`}
          />
          <span>{validationTask}</span>
        </label>
      </div>
    );
  }

  // State 3: Task completed — show strikethrough, note input, and status buttons
  return (
    <div
      className="ml-6 mt-1.5 space-y-1.5"
      data-testid={`validation-task-section-${hypothesisId}`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-400">&#10003;</span>
        <span className="text-content-muted line-through">{validationTask}</span>
      </div>
      <textarea
        className="w-full text-xs bg-transparent border border-edge rounded px-2 py-1 text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 resize-none"
        placeholder="What did you observe?"
        rows={2}
        value={noteInput}
        onChange={e => setNoteInput(e.target.value)}
        data-testid={`validation-task-note-${hypothesisId}`}
      />
      <div className="flex items-center gap-1.5">
        <button
          className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25"
          onClick={() => onSetManualStatus?.(hypothesisId, 'supported', noteInput || undefined)}
          data-testid={`validation-status-supported-${hypothesisId}`}
        >
          Supported
        </button>
        <button
          className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25"
          onClick={() => onSetManualStatus?.(hypothesisId, 'contradicted', noteInput || undefined)}
          data-testid={`validation-status-contradicted-${hypothesisId}`}
        >
          Contradicted
        </button>
        <button
          className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
          onClick={() => onSetManualStatus?.(hypothesisId, 'partial', noteInput || undefined)}
          data-testid={`validation-status-partial-${hypothesisId}`}
        >
          Partial
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Status Tooltip Helper
// ============================================================================

export interface AnovaEvidence {
  etaSquared: number;
  pValue: number;
  totalN: number;
  groupCount: number;
  evidenceLevel: string;
}

export function buildStatusTooltip(
  status: HypothesisStatus,
  evidence: AnovaEvidence | undefined,
  formatStat: (v: number, d?: number) => string
): string {
  const statusLabel = HYPOTHESIS_STATUS_LABELS[status];
  if (!evidence) return statusLabel;

  const interpretation = interpretEvidence({
    etaSquared: evidence.etaSquared,
    pValue: evidence.pValue,
    totalN: evidence.totalN,
    groupCount: evidence.groupCount,
  });

  const lines = [
    statusLabel,
    `Contribution: ${formatStat(evidence.etaSquared * 100, 1)}%`,
    `Evidence: ${interpretation.evidenceLevel} (n=${evidence.totalN})`,
    interpretation.message,
  ];

  if (interpretation.evidenceLevel === 'weak' || interpretation.evidenceLevel === 'insufficient') {
    lines.push('Consider gemba or expert validation');
  }

  return lines.join('\n');
}
