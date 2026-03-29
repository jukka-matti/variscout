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
} from '@variscout/core/stats';
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
}

/** Minimum R²adj to unlock Layer 2 */
const LAYER2_THRESHOLD = 0.05;

const FactorIntelligencePanel: React.FC<FactorIntelligencePanelProps> = ({
  bestSubsets,
  mainEffects,
  interactionEffects,
  onSubsetClick,
}) => {
  // Evidence gating
  const bestR2adj = bestSubsets?.subsets[0]?.rSquaredAdj ?? 0;
  const showLayer2 = bestR2adj > LAYER2_THRESHOLD && mainEffects !== null;
  const showLayer3 =
    showLayer2 &&
    (mainEffects?.significantCount ?? 0) >= 2 &&
    interactionEffects !== null &&
    interactionEffects.interactions.length > 0;

  // Nothing to show
  if (!bestSubsets || bestSubsets.subsets.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-content, #e0e0e0)' }}>
            Factor Intelligence
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              fontWeight: 600,
            }}
          >
            {bestSubsets.totalFactors} factors · {bestSubsets.n} obs
          </span>
        </div>

        {/* Layer progress indicator */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map(layer => {
            const active =
              layer === 1 || (layer === 2 && showLayer2) || (layer === 3 && showLayer3);
            return (
              <div
                key={layer}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: active
                    ? layer === 1
                      ? '#6366f1'
                      : layer === 2
                        ? '#22c55e'
                        : '#f59e0b'
                    : 'var(--color-edge, #2a2a3e)',
                  transition: 'background 0.3s',
                }}
                title={`Layer ${layer}${active ? ' (active)' : ' (locked)'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Layer 1: Best Subsets Ranking */}
      <BestSubsetsCard result={bestSubsets} onSubsetClick={onSubsetClick} />

      {/* Layer 2: Main Effects (evidence-gated) */}
      {showLayer2 && <MainEffectsPlot result={mainEffects} />}

      {/* Layer 2 locked message */}
      {!showLayer2 && bestSubsets.subsets.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-content-tertiary, #666)',
            fontStyle: 'italic',
            padding: '4px 0',
          }}
        >
          Layer 2 (Main Effects) unlocks when R²adj {'>'} {(LAYER2_THRESHOLD * 100).toFixed(0)}%
          {bestR2adj > 0 && ` — currently ${(bestR2adj * 100).toFixed(1)}%`}
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
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-content-tertiary, #666)',
            fontStyle: 'italic',
            padding: '4px 0',
          }}
        >
          Layer 3 (Interactions) unlocks when ≥2 factors are significant
          {mainEffects && ` — currently ${mainEffects.significantCount} significant`}
        </div>
      )}
    </div>
  );
};

export default FactorIntelligencePanel;
