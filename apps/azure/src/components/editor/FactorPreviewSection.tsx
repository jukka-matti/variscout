/**
 * FactorPreviewSection — One-time Factor Intelligence overlay.
 *
 * Shown once when Factor Intelligence first completes (bestSubsets available,
 * 2+ factors, analysis view active, not yet dismissed). Renders a compact
 * Evidence Map preview with a call-to-action to start investigating the top factor.
 *
 * Reads from projectStore, sessionStore, and panelsStore directly.
 * Accepts `bestSubsets` as a prop because it is computed in the parent
 * (useQuestionGeneration) and shared with PISection and DashboardSection.
 */

import React, { useCallback, useMemo } from 'react';
import { EvidenceMapBase } from '@variscout/charts';
import { FactorPreviewOverlay } from '@variscout/ui';
import { computeMainEffects, computeInteractionEffects } from '@variscout/core';
import { resolveMode } from '@variscout/core/strategy';
import type { BestSubsetsResult } from '@variscout/core/stats';
import { useEvidenceMapData, useFilteredData } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import { usePanelsStore } from '../../features/panels/panelsStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACTOR_PREVIEW_MAP_SIZE = { width: 620, height: 360 };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FactorPreviewSectionProps {
  /** Best-subsets regression result from useQuestionGeneration (null while pending). */
  bestSubsets: BestSubsetsResult | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FactorPreviewSection: React.FC<FactorPreviewSectionProps> = ({ bestSubsets }) => {
  const factors = useProjectStore(s => s.factors);
  const outcome = useProjectStore(s => s.outcome);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const { filteredData } = useFilteredData();

  const activeView = usePanelsStore(s => s.activeView);
  const factorPreviewDismissed = usePanelsStore(s => s.factorPreviewDismissed);
  const dismissFactorPreview = usePanelsStore(s => s.dismissFactorPreview);

  const resolved = resolveMode(analysisMode ?? 'standard');
  const hasFactorIntelligenceForPreview = bestSubsets !== null && factors.length >= 2;
  const data = filteredData ?? [];

  const mainEffectsForPreview = useMemo(() => {
    if (!hasFactorIntelligenceForPreview || !outcome || !data.length) return null;
    return computeMainEffects(data, outcome, factors);
  }, [hasFactorIntelligenceForPreview, data, outcome, factors]);

  const interactionsForPreview = useMemo(() => {
    if (!hasFactorIntelligenceForPreview || !outcome || !data.length) return null;
    return computeInteractionEffects(data, outcome, factors);
  }, [hasFactorIntelligenceForPreview, data, outcome, factors]);

  const evidenceMapDataForPreview = useEvidenceMapData({
    bestSubsets: hasFactorIntelligenceForPreview ? bestSubsets : null,
    mainEffects: mainEffectsForPreview,
    interactions: interactionsForPreview,
    containerSize: FACTOR_PREVIEW_MAP_SIZE,
    mode: resolved,
  });

  const showFactorPreview =
    !factorPreviewDismissed &&
    activeView === 'analysis' &&
    hasFactorIntelligenceForPreview &&
    !evidenceMapDataForPreview.isEmpty;

  const topFactor = bestSubsets?.subsets[0]?.factors[0] ?? null;

  const topFactorR2 = useMemo(() => {
    if (!topFactor || !bestSubsets) return 0;
    const singleFactorSubset = bestSubsets.subsets.find(
      s => s.factors.length === 1 && s.factors[0] === topFactor
    );
    return singleFactorSubset?.rSquaredAdj ?? bestSubsets.subsets[0]?.rSquaredAdj ?? 0;
  }, [topFactor, bestSubsets]);

  const handleFactorPreviewStart = useCallback(
    (factor: string) => {
      usePanelsStore.getState().setHighlightedFactor(factor);
      dismissFactorPreview();
    },
    [dismissFactorPreview]
  );

  if (!showFactorPreview || !topFactor) return null;

  return (
    <FactorPreviewOverlay
      evidenceMap={
        <EvidenceMapBase
          parentWidth={FACTOR_PREVIEW_MAP_SIZE.width}
          parentHeight={FACTOR_PREVIEW_MAP_SIZE.height}
          outcomeNode={evidenceMapDataForPreview.outcomeNode}
          factorNodes={evidenceMapDataForPreview.factorNodes}
          relationshipEdges={evidenceMapDataForPreview.relationshipEdges}
          equation={evidenceMapDataForPreview.equation}
          causalEdges={[]}
          convergencePoints={[]}
          enableZoom={false}
          compact={false}
        />
      }
      topFactor={topFactor}
      topFactorR2={topFactorR2}
      modelR2={bestSubsets!.subsets[0]?.rSquaredAdj ?? 0}
      factorCount={factors.length}
      onStartWithFactor={handleFactorPreviewStart}
      onDismiss={dismissFactorPreview}
    />
  );
};
