/**
 * FactorIntelligencePanel — container for the 3-layer Factor Intelligence system.
 *
 * Progressively reveals:
 *   Layer 1: Best subsets ranking (which factor combinations matter?)
 *   Layer 2: Main effects (how does each factor affect the outcome?)
 *   Layer 3: Interactions (do factors interact?)
 *
 * Evidence gating:
 *   Layer 2 shows only when Layer 1 has R²adj > 0.05
 *   Layer 3 shows only when Layer 2 has ≥2 significant factors
 */
import React from 'react';
import type {
  BestSubsetsResult,
  MainEffectsResult,
  InteractionEffectsResult,
  FactorMainEffect,
} from '@variscout/core/stats';
import { useTranslation } from '@variscout/hooks';
import BestSubsetsCard from './BestSubsetsCard';
import MainEffectsPlot from './MainEffectsPlot';
import InteractionPlot from './InteractionPlot';

export interface FactorIntelligencePanelProps {
  /** Layer 1: Best subsets result */
  bestSubsets: BestSubsetsResult | null;
  /** Layer 2: Main effects result */
  mainEffects: MainEffectsResult | null;
  /** Layer 3: Interaction effects result */
  interactionEffects: InteractionEffectsResult | null;
  /** Called when user clicks a factor subset for drill-down */
  onSubsetClick?: (factors: string[]) => void;
  /** Called when user clicks "Investigate" on a significant factor */
  onInvestigateFactor?: (effect: FactorMainEffect) => void;
}

/** Minimum R²adj to unlock Layer 2 */
const LAYER2_THRESHOLD = 0.05;

const LAYER_COLORS = ['bg-indigo-500', 'bg-green-500', 'bg-amber-500'];
const LAYER_COLORS_INACTIVE = 'bg-surface-tertiary';

const FactorIntelligencePanel: React.FC<FactorIntelligencePanelProps> = ({
  bestSubsets,
  mainEffects,
  interactionEffects,
  onSubsetClick,
  onInvestigateFactor,
}) => {
  // Evidence gating
  const bestR2adj = bestSubsets?.subsets[0]?.rSquaredAdj ?? 0;
  const showLayer2 = bestR2adj > LAYER2_THRESHOLD && mainEffects !== null;
  const showLayer3 =
    showLayer2 &&
    (mainEffects?.significantCount ?? 0) >= 2 &&
    interactionEffects !== null &&
    interactionEffects.interactions.length > 0;

  const { t, tf } = useTranslation();

  // Nothing to show
  if (!bestSubsets || bestSubsets.subsets.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 py-3" data-testid="factor-intelligence-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-content">{t('fi.title')}</span>
          <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold">
            {bestSubsets.totalFactors} factors · {bestSubsets.n} obs
          </span>
        </div>

        {/* Layer progress indicator */}
        <div className="flex gap-1">
          {[1, 2, 3].map(layer => {
            const active =
              layer === 1 || (layer === 2 && showLayer2) || (layer === 3 && showLayer3);
            return (
              <div
                key={layer}
                className={`w-2 h-2 rounded-full transition-colors ${
                  active ? LAYER_COLORS[layer - 1] : LAYER_COLORS_INACTIVE
                }`}
                title={`Layer ${layer}${active ? ' (active)' : ' (locked)'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Layer 1: Best Subsets Ranking */}
      <BestSubsetsCard result={bestSubsets} onSubsetClick={onSubsetClick} />

      {/* Layer 2: Main Effects (evidence-gated) */}
      {showLayer2 && (
        <MainEffectsPlot result={mainEffects} onInvestigateFactor={onInvestigateFactor} />
      )}

      {/* Layer 2 locked message */}
      {!showLayer2 && bestSubsets.subsets.length > 0 && (
        <div className="text-[0.6875rem] text-content-muted italic py-1">
          {tf('fi.layer2Locked', {
            threshold: Number.isFinite(LAYER2_THRESHOLD)
              ? (LAYER2_THRESHOLD * 100).toFixed(0)
              : '—',
          })}
          {bestR2adj > 0 &&
            Number.isFinite(bestR2adj) &&
            // eslint-disable-next-line variscout/no-tofixed-on-stats -- guarded by Number.isFinite(bestR2adj) above
            tf('fi.layer2Current', { value: (bestR2adj * 100).toFixed(1) })}
        </div>
      )}

      {/* Layer 3: Interactions (evidence-gated) */}
      {showLayer3 && (
        <InteractionPlot
          interactions={interactionEffects!.interactions.filter(
            i => i.isSignificant || i.deltaRSquared > 0.01
          )}
        />
      )}

      {/* Layer 3 locked message */}
      {showLayer2 && !showLayer3 && (
        <div className="text-[0.6875rem] text-content-muted italic py-1">
          {t('fi.layer3Locked')}
          {mainEffects && tf('fi.layer3Current', { count: String(mainEffects.significantCount) })}
        </div>
      )}
    </div>
  );
};

export default FactorIntelligencePanel;
