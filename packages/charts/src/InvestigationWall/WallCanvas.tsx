/**
 * WallCanvas — Top-level composition component for the Investigation Wall.
 *
 * Assembles ProblemConditionCard (top), HypothesisCard hubs (middle row),
 * open QuestionPills (lower row), TributaryFooter (bottom), and
 * MissingEvidenceDigest (HTML panel below the SVG canvas).
 *
 * Renders EmptyState when no hubs exist.
 */

import React, { useMemo } from 'react';
import type { SuspectedCause, Finding, Question, ProcessMap, GateNode } from '@variscout/core';
import { conditionHasMissingColumn } from '@variscout/core';
import { ProblemConditionCard } from './ProblemConditionCard';
import { HypothesisCard } from './HypothesisCard';
import { QuestionPill } from './QuestionPill';
import { TributaryFooter } from './TributaryFooter';
import { EmptyState } from './EmptyState';
import { MissingEvidenceDigest } from './MissingEvidenceDigest';
import type { WallStatus } from './types';

export interface WallCanvasProps {
  hubs: SuspectedCause[];
  findings: Finding[];
  questions: Question[];
  processMap: ProcessMap;
  problemCpk: number;
  eventsPerWeek: number;
  problemContributionTree?: GateNode;
  gapsByHubId?: Record<string, boolean>;
  gaps?: Array<{ id: string; message: string; hubId?: string }>;
  /**
   * Column keys present in the active dataset. When provided, each hub whose
   * `condition` references a column absent from this set renders a
   * missing-column warning badge on its card.
   */
  activeColumns?: ReadonlyArray<string>;
  onSelectHub?: (id: string) => void;
  onPromoteQuestion?: (id: string) => void;
  onWriteHypothesis?: () => void;
  onPromoteFromQuestion?: () => void;
  onSeedFromFactorIntel?: () => void;
  onFocusHubFromGap?: (id: string) => void;
}

const CANVAS_W = 2000;
const CANVAS_H = 1400;

function deriveDisplayStatus(hub: SuspectedCause, findings: Finding[]): WallStatus {
  if (hub.status === 'confirmed') return 'confirmed';
  if (hub.status === 'not-confirmed') return 'refuted';
  const supporting = hub.findingIds
    .map(id => findings.find(f => f.id === id))
    .filter((f): f is Finding => !!f);
  const hasContradictor = supporting.some(f => f.validationStatus === 'contradicts');
  if (supporting.length >= 1 && !hasContradictor) return 'evidenced';
  return 'proposed';
}

export const WallCanvas: React.FC<WallCanvasProps> = ({
  hubs,
  findings,
  questions,
  processMap,
  problemCpk,
  eventsPerWeek,
  gapsByHubId = {},
  gaps = [],
  activeColumns,
  onSelectHub,
  onPromoteQuestion,
  onWriteHypothesis,
  onPromoteFromQuestion,
  onSeedFromFactorIntel,
  onFocusHubFromGap,
}) => {
  const columnSet = useMemo(
    () => (activeColumns ? new Set(activeColumns) : undefined),
    [activeColumns]
  );
  if (hubs.length === 0) {
    return (
      <EmptyState
        onWriteHypothesis={onWriteHypothesis}
        onPromoteFromQuestion={onPromoteFromQuestion}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
    );
  }

  const problemLabel = processMap.ctsColumn ?? 'CTS';
  const hubY = 400;
  const hubSpacing = CANVAS_W / (hubs.length + 1);

  const openQuestions = questions.filter(
    q => q.status === 'open' && !hubs.some(h => h.questionIds.includes(q.id))
  );

  return (
    <div className="w-full h-full flex flex-col">
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="bg-background text-content flex-1"
        role="img"
        aria-label="Investigation Wall canvas"
      >
        <ProblemConditionCard
          ctsColumn={problemLabel}
          cpk={problemCpk}
          eventsPerWeek={eventsPerWeek}
          x={CANVAS_W / 2}
          y={40}
        />

        <line
          x1={80}
          x2={CANVAS_W - 80}
          y1={280}
          y2={280}
          className="stroke-edge"
          strokeDasharray="4 6"
        />

        {hubs.map((hub, idx) => (
          <HypothesisCard
            key={hub.id}
            hub={hub}
            displayStatus={deriveDisplayStatus(hub, findings)}
            x={hubSpacing * (idx + 1)}
            y={hubY}
            hasGap={gapsByHubId[hub.id]}
            missingColumn={columnSet ? conditionHasMissingColumn(hub.condition, columnSet) : false}
            onSelect={onSelectHub}
          />
        ))}

        {openQuestions.map((q, idx) => (
          <QuestionPill
            key={q.id}
            questionId={q.id}
            text={q.text}
            status={q.status}
            x={200 + idx * 240}
            y={900}
            onPromote={onPromoteQuestion}
          />
        ))}

        <TributaryFooter
          tributaries={processMap.tributaries}
          hubs={hubs}
          y={1300}
          canvasWidth={CANVAS_W}
        />
      </svg>

      <MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHubFromGap} />
    </div>
  );
};
