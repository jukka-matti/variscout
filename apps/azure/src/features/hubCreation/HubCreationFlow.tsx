/**
 * HubCreationFlow — Azure Mode B framing Stage 1 → Stage 3 router.
 *
 * When entering the mapping screen for the first time on a NEW investigation
 * (isMappingReEdit === false) and no processHubId has been set yet, we gate
 * ColumnMapping behind Stage 1 (HubGoalForm). After the analyst states a goal
 * (or skips), we immediately create a ProcessHub via useNewHubProvision so the
 * hub exists before Stage 3 confirms outcomes and specs.
 *
 * On re-edit (isMappingReEdit === true) or when a hub already exists, Stage 1
 * is skipped and ColumnMapping renders directly.
 *
 * Layout: a full-page mounting point; consumers return this component from
 * their render path (same pattern as PasteScreen / ManualEntry in Editor.tsx).
 */
import React, { useState } from 'react';
import { ColumnMapping, HubGoalForm, type ColumnMappingConfirmPayload } from '@variscout/ui';
import type {
  ColumnAnalysis,
  DataRow,
  DataQualityReport,
  InvestigationCategory,
  StackConfig,
  StackSuggestion,
} from '@variscout/core';
import { useNewHubProvision } from './useNewHubProvision';
import type { ProcessHub } from '@variscout/core/processHub';

export interface HubCreationFlowProps {
  // Mapping passthrough props (subset of ColumnMappingProps the Editor wires)
  columnAnalysis: ColumnAnalysis | null;
  availableColumns: string[];
  previewRows: DataRow[];
  totalRows: number;
  columnAliases: Record<string, string>;
  onColumnRename: (col: string, alias: string) => void;
  initialOutcome: string | null;
  initialFactors: string[];
  datasetName: string;
  onConfirm: (payload: ColumnMappingConfirmPayload) => void;
  onCancel: () => void;
  dataQualityReport?: DataQualityReport | null;
  maxFactors?: number;
  isMappingReEdit: boolean;
  initialCategories?: InvestigationCategory[];
  timeColumn?: string;
  hasTimeComponent?: boolean;
  onTimeExtractionChange?: (config: { extractHour?: boolean; extractDate?: boolean }) => void;
  suggestedStack?: StackSuggestion | null;
  onStackConfigChange?: (config: StackConfig | null) => void;
  rowLimit?: number;
  // Hub context
  /** Current processHubId — when truthy, Stage 1 is already done */
  processHubId?: string | null;
  /** Called once the Stage 1 hub has been created so Editor can sync processContext */
  onHubCreated?: (hub: ProcessHub) => void;
}

/**
 * Sentinel: null = Stage 1 not yet shown; '' = skipped; string = narrative provided
 */
type GoalNarrativeSentinel = string | null;

export function HubCreationFlow({
  columnAnalysis,
  availableColumns,
  previewRows,
  totalRows,
  columnAliases,
  onColumnRename,
  initialOutcome,
  initialFactors,
  datasetName,
  onConfirm,
  onCancel,
  dataQualityReport,
  maxFactors,
  isMappingReEdit,
  initialCategories,
  timeColumn,
  hasTimeComponent,
  onTimeExtractionChange,
  suggestedStack,
  onStackConfigChange,
  rowLimit,
  processHubId,
  onHubCreated,
}: HubCreationFlowProps) {
  // Stage 1 gate: skipped when re-editing or a hub already exists
  const skipStage1 = isMappingReEdit || !!processHubId;
  const [goalNarrative, setGoalNarrative] = useState<GoalNarrativeSentinel>(skipStage1 ? '' : null);

  const { createHubFromGoal } = useNewHubProvision({
    onCreated: hub => onHubCreated?.(hub),
  });

  const handleGoalConfirm = async (narrative: string) => {
    if (narrative.trim()) {
      await createHubFromGoal(narrative);
    }
    setGoalNarrative(narrative);
  };

  const handleGoalSkip = async () => {
    // Skip creates a nameless hub so the investigation still has a hub row
    await createHubFromGoal('');
    setGoalNarrative('');
  };

  // Stage 1: goal form
  if (goalNarrative === null) {
    return (
      <div className="max-w-2xl mx-auto p-6 w-full" data-testid="hub-creation-stage1">
        <HubGoalForm onConfirm={handleGoalConfirm} onSkip={handleGoalSkip} />
      </div>
    );
  }

  // Stage 3: column mapping
  return (
    <ColumnMapping
      columnAnalysis={columnAnalysis}
      availableColumns={availableColumns}
      previewRows={previewRows}
      totalRows={totalRows}
      columnAliases={columnAliases}
      onColumnRename={onColumnRename}
      initialOutcome={initialOutcome}
      initialFactors={initialFactors}
      datasetName={datasetName}
      onConfirm={onConfirm}
      onCancel={onCancel}
      dataQualityReport={dataQualityReport}
      maxFactors={maxFactors}
      mode={isMappingReEdit ? 'edit' : 'setup'}
      initialCategories={initialCategories}
      timeColumn={timeColumn}
      hasTimeComponent={hasTimeComponent}
      onTimeExtractionChange={onTimeExtractionChange}
      showBrief={true}
      suggestedStack={suggestedStack}
      onStackConfigChange={onStackConfigChange}
      rowLimit={rowLimit}
      goalContext={goalNarrative || undefined}
    />
  );
}
