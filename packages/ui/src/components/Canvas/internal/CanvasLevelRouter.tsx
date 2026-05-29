import React from 'react';
import {
  isCanvasLensValidAtLevel,
  suggestCanvasLevelForLens,
  type CanvasLensId,
  type CanvasStepCardModel,
} from '@variscout/hooks';
import {
  type DataRow,
  type Finding,
  type Hypothesis,
  type Question,
  type MessageCatalog,
} from '@variscout/core';
import type { ColumnTypeMap } from '@variscout/core/findings';
import type { CanvasLevel } from '@variscout/core/canvas';
import type { ProcessMap } from '@variscout/core/frame';
import type { ProcessHubId } from '@variscout/core/processHub';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import type { Locale } from '@variscout/core';
import type { ChipRailEntry } from '../../ChipRail';
import type { CanvasAnalyzeFocus } from '@variscout/hooks';
import type { LogActionPayload } from '../../QuickAction';
import { LODSwitcher } from './LODSwitcher';
import { SystemLevelView } from './SystemLevelView';
import { AuthorL3View } from './AuthorL3View';
import { LocalMechanismView } from './LocalMechanismView';
import { NoFocalStepPrompt } from './NoFocalStepPrompt';
import { LENS_LABEL_KEY } from './CanvasLensPicker';

// Defined here to avoid circular import with Canvas/index.tsx
export type CanvasL3Archetype = 'b0' | 'b1';

const CANVAS_LEVEL_LABEL_KEY: Record<CanvasLevel, keyof MessageCatalog> = {
  l1: 'canvas.mobile.system',
  l2: 'canvas.mobile.process',
  l3: 'canvas.mobile.step',
};

export interface CanvasLevelRouterProps {
  // Shared identity
  hubId: ProcessHubId;
  map: ProcessMap;
  // Current viewport state
  currentLevel: CanvasLevel;
  focalStepId: string | undefined;
  rawLens: CanvasLensId;
  resolvedLens: CanvasLensId;
  locale: Locale;
  // L2 content comes from the parent (Canvas manages this surface)
  l2Content: React.ReactNode;
  // L1 props
  rows: readonly DataRow[];
  stepCards: readonly CanvasStepCardModel[];
  systemQuestions: ReadonlyArray<Question>;
  hypotheses: ReadonlyArray<Hypothesis>;
  findings: ReadonlyArray<Finding>;
  usl?: number;
  lsl?: number;
  target?: number;
  cpkTarget?: number;
  onOpenScout?: (hubId: ProcessHubId) => void;
  // L3 author props
  chips: ChipRailEntry[];
  canPlaceChips: boolean;
  onPlaceChip?: (chipId: string, stepId: string) => void;
  onKeyboardChipPickUp?: (chipId: string) => void;
  onKeyboardChipDrop?: (stepId: string) => void;
  // L3 read props
  columnTypes: ColumnTypeMap;
  problemCpk?: number;
  eventsPerWeek?: number;
  availableColumns: string[];
  activeColumns?: ReadonlyArray<string>;
  onOpenWall?: () => void;
  onSelectWallHub?: (hubId: string) => void;
  onOpenInvestigationFocus?: (focus: CanvasAnalyzeFocus) => void;
  onOpenColumnDetail?: (column: string, stepId: string) => void;
  onLogQuickAction?: (stepId: string, payload: LogActionPayload) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  // L3 archetype routing (b0 = read-only LocalMechanismView; b1 = AuthorL3View)
  resolvedL3Archetype: CanvasL3Archetype;
}

/**
 * Routes canvas content across L1 / L2 / L3 levels and handles the lens-level
 * validity gate. Pure presentation — no store reads, no hooks besides what the
 * sub-components own internally.
 */
export function CanvasLevelRouter({
  hubId,
  map,
  currentLevel,
  focalStepId,
  rawLens,
  resolvedLens,
  locale,
  l2Content,
  rows,
  stepCards,
  systemQuestions,
  hypotheses,
  findings,
  usl,
  lsl,
  target,
  cpkTarget,
  onOpenScout,
  chips,
  canPlaceChips,
  onPlaceChip,
  onKeyboardChipPickUp,
  onKeyboardChipDrop,
  columnTypes,
  problemCpk,
  eventsPerWeek,
  availableColumns,
  activeColumns,
  onOpenWall,
  onSelectWallHub,
  onOpenInvestigationFocus,
  onOpenColumnDetail,
  onLogQuickAction,
  onFocusedInvestigation,
  onCharter,
  resolvedL3Archetype,
}: CanvasLevelRouterProps): React.JSX.Element {
  const lensValidAtCurrentLevel = isCanvasLensValidAtLevel(rawLens, currentLevel);
  const suggestedLevel = suggestCanvasLevelForLens(rawLens, currentLevel);

  if (!lensValidAtCurrentLevel) {
    return (
      <div
        className="bg-surface-background p-6 text-sm font-medium text-content-secondary"
        data-testid="canvas-lens-level-empty-state"
      >
        {formatMessage(locale, 'canvas.lensPicker.invalidAtLevel', {
          lens: getMessage(locale, LENS_LABEL_KEY[rawLens]),
          currentLevel: getMessage(locale, CANVAS_LEVEL_LABEL_KEY[currentLevel]),
          suggestedLevel: getMessage(locale, CANVAS_LEVEL_LABEL_KEY[suggestedLevel]),
        })}
      </div>
    );
  }

  const l1Content = (
    <div data-canvas-level="l1">
      <SystemLevelView
        hubId={hubId}
        map={map}
        rows={rows}
        stepCards={stepCards}
        questions={systemQuestions}
        hypotheses={hypotheses}
        findings={findings}
        activeLens={resolvedLens}
        measureSpecs={
          map.ctsColumn ? { [map.ctsColumn]: { usl, lsl, target, cpkTarget } } : undefined
        }
        onOpenScout={onOpenScout}
      />
    </div>
  );

  const authorL3Content = focalStepId ? (
    <AuthorL3View
      hubId={hubId}
      focalStepId={focalStepId}
      map={map}
      chips={chips}
      disabled={!canPlaceChips}
      onPlaceChip={onPlaceChip}
      onKeyboardChipPickUp={onKeyboardChipPickUp}
      onKeyboardChipDrop={onKeyboardChipDrop}
    />
  ) : (
    <NoFocalStepPrompt hubId={hubId} map={map} />
  );

  const readL3Content = focalStepId ? (
    <LocalMechanismView
      hubId={hubId}
      focalStepId={focalStepId}
      map={map}
      rows={rows}
      outcomeColumn={map.ctsColumn}
      columnTypes={columnTypes}
      findings={[...findings]}
      problemCpk={problemCpk ?? 0}
      eventsPerWeek={eventsPerWeek ?? 0}
      activeColumns={activeColumns ?? availableColumns}
      onOpenWall={onOpenWall}
      onSelectWallHub={onSelectWallHub}
      onOpenInvestigationFocus={onOpenInvestigationFocus}
      onOpenColumnDetail={onOpenColumnDetail}
      onLogQuickAction={onLogQuickAction}
      onFocusedInvestigation={onFocusedInvestigation}
      onCharter={onCharter}
    />
  ) : (
    <NoFocalStepPrompt hubId={hubId} map={map} />
  );

  const l3ContentBody = resolvedL3Archetype === 'b1' ? authorL3Content : readL3Content;

  const l3Content = (
    <div className="bg-surface-background" data-canvas-level="l3">
      {l3ContentBody}
    </div>
  );

  return <LODSwitcher currentLevel={currentLevel} l1={l1Content} l2={l2Content} l3={l3Content} />;
}
