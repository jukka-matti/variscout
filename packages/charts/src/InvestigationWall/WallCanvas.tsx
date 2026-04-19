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
import { DndContext } from '@dnd-kit/core';
import type {
  SuspectedCause,
  Finding,
  Question,
  ProcessMap,
  GateNode,
  GatePath,
} from '@variscout/core';
import { conditionHasMissingColumn } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import { ProblemConditionCard } from './ProblemConditionCard';
import { HypothesisCard } from './HypothesisCard';
import { DraggableHypothesisCard } from './DraggableHypothesisCard';
import { QuestionPill } from './QuestionPill';
import { TributaryFooter } from './TributaryFooter';
import { EmptyState } from './EmptyState';
import { MissingEvidenceDigest } from './MissingEvidenceDigest';
import { MobileCardList } from './MobileCardList';
import type { WallStatus } from './types';
import { getDocumentLocale } from './hooks/useWallLocale';
import { useWallDragDrop } from './hooks/useWallDragDrop';
import { useWallIsMobile } from './hooks/useWallBreakpoint';

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
  /**
   * When provided, enables drag-drop gate composition. Hubs become draggable
   * sources; gate badges become drop targets. Fired on a valid hub→gate
   * drop — callers should wire this to `investigationStore.composeGate`.
   * When omitted, drag-drop is disabled (HypothesisCard renders without a
   * draggable wrapper, avoiding unused DndContext overhead).
   */
  onComposeGate?: (payload: { hubId: string; gatePath: GatePath }) => void;
  /**
   * View-level zoom factor applied as `scale(zoom)` on the content group.
   * Defaults to 1.0 (identity). Apps thread this from `wallLayoutStore.zoom`.
   * Values typically in [0.2, 3.0]; consumers should clamp before setting.
   */
  zoom?: number;
  /**
   * View-level pan offset applied as `translate(pan.x, pan.y)` on the content
   * group. Defaults to origin. Apps thread this from `wallLayoutStore.pan`.
   */
  pan?: { x: number; y: number };
  /**
   * When true, hubs are grouped by their first matching tributary (intersect
   * `hub.tributaryIds` with `processMap.tributaries[].id`). Each non-empty
   * group renders inside a dashed-outline `<g data-tributary-group>` frame
   * labeled at top-left. Hubs without a matching tributary fall into an
   * "unassigned" group rendered without a frame. Apps thread this from
   * `wallLayoutStore.groupByTributary`.
   */
  groupByTributary?: boolean;
}

/**
 * Canvas dimensions in user-space units. Exported so Minimap and other
 * viewport-overlay primitives can reuse the same coordinate space.
 */
export const CANVAS_W = 2000;
export const CANVAS_H = 1400;

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
  onComposeGate,
  zoom = 1,
  pan = { x: 0, y: 0 },
  groupByTributary = false,
}) => {
  const locale = getDocumentLocale();
  const columnSet = useMemo(
    () => (activeColumns ? new Set(activeColumns) : undefined),
    [activeColumns]
  );
  // Tributary clustering: bucket each hub by its first matching tributary.
  // Unmatched hubs (no tributaryIds, or none intersecting processMap) drop
  // into an "unassigned" bucket rendered without a frame. Order matches
  // processMap.tributaries, with unassigned always last. Empty buckets drop.
  // Computed unconditionally — returns null when disabled so the render path
  // falls back to the default linear layout.
  const tributaryGroups = useMemo(() => {
    if (!groupByTributary) return null;
    const tributaries = processMap.tributaries;
    const tributaryById = new Map(tributaries.map(t => [t.id, t]));
    type Bucket = {
      tributary: (typeof tributaries)[number] | null;
      hubs: SuspectedCause[];
    };
    const buckets: Bucket[] = tributaries.map(t => ({ tributary: t, hubs: [] }));
    const unassigned: Bucket = { tributary: null, hubs: [] };
    for (const hub of hubs) {
      const matchId = hub.tributaryIds?.find(id => tributaryById.has(id));
      if (matchId) {
        const b = buckets.find(bk => bk.tributary?.id === matchId);
        b!.hubs.push(hub);
      } else {
        unassigned.hubs.push(hub);
      }
    }
    return [...buckets, unassigned].filter(b => b.hubs.length > 0);
  }, [groupByTributary, hubs, processMap.tributaries]);

  const dndEnabled = Boolean(onComposeGate);
  const { onDragEnd } = useWallDragDrop({ onDrop: onComposeGate });
  const isMobile = useWallIsMobile();

  // Mobile (<768px): swap the 2000×1400 SVG for a vertical card stack.
  // MissingEvidenceDigest still renders below the list on mobile so gap
  // coaching stays visible. MobileCardList handles its own empty state,
  // so this branch supersedes the hubs-empty short-circuit below.
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col">
        <MobileCardList
          hubs={hubs}
          findings={findings}
          questions={questions}
          onSelectHub={onSelectHub}
          onWriteHypothesis={onWriteHypothesis}
          onPromoteFromQuestion={onPromoteFromQuestion}
          onSeedFromFactorIntel={onSeedFromFactorIntel}
        />
        <MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHubFromGap} />
      </div>
    );
  }

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

  const renderHubAt = (hub: SuspectedCause, x: number) => {
    const hubProps = {
      hub,
      displayStatus: deriveDisplayStatus(hub, findings),
      x,
      y: hubY,
      hasGap: gapsByHubId[hub.id],
      missingColumn: columnSet ? conditionHasMissingColumn(hub.condition, columnSet) : false,
      zoomScale: zoom !== 1 ? zoom : undefined,
      onSelect: onSelectHub,
    };
    return dndEnabled ? (
      <DraggableHypothesisCard key={hub.id} {...hubProps} />
    ) : (
      <HypothesisCard key={hub.id} {...hubProps} />
    );
  };

  const body = (
    <div className="w-full h-full flex flex-col">
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="bg-background text-content flex-1"
        role="img"
        aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
      >
        <g data-wall-viewport transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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

          {tributaryGroups
            ? (() => {
                // Slice the canvas horizontally into equal-width bands, one per
                // non-empty group. Each band draws its own frame (when a
                // tributary is known) and distributes its hubs evenly within
                // the inner padding.
                const GROUP_PAD_X = 40;
                const bandWidth = CANVAS_W / tributaryGroups.length;
                return tributaryGroups.map((group, bandIdx) => {
                  const bandX0 = bandIdx * bandWidth;
                  const innerX0 = bandX0 + GROUP_PAD_X;
                  const innerW = bandWidth - GROUP_PAD_X * 2;
                  const perHub = innerW / (group.hubs.length + 1);
                  return (
                    <g
                      key={group.tributary?.id ?? '__unassigned__'}
                      data-tributary-group={group.tributary?.id ?? 'unassigned'}
                    >
                      {group.tributary && (
                        <>
                          <rect
                            x={bandX0 + GROUP_PAD_X / 2}
                            y={hubY - 40}
                            width={bandWidth - GROUP_PAD_X}
                            height={260}
                            rx={12}
                            className="fill-transparent stroke-edge"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={bandX0 + GROUP_PAD_X / 2 + 12}
                            y={hubY - 20}
                            className="fill-content-muted text-xs font-mono uppercase tracking-wide"
                          >
                            {group.tributary.label ?? group.tributary.column}
                          </text>
                        </>
                      )}
                      {group.hubs.map((hub, i) => renderHubAt(hub, innerX0 + perHub * (i + 1)))}
                    </g>
                  );
                });
              })()
            : hubs.map((hub, idx) => renderHubAt(hub, hubSpacing * (idx + 1)))}

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
        </g>
      </svg>

      <MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHubFromGap} />
    </div>
  );

  // Only mount DndContext when drag-drop is enabled — keeps the tree lean
  // and avoids unused pointer-event listeners in the legacy/read-only case.
  return dndEnabled ? <DndContext onDragEnd={onDragEnd}>{body}</DndContext> : body;
};
