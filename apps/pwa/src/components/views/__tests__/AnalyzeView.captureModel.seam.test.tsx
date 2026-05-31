/**
 * PWA Wall capture-as-Finding SEAM test (FE-1 fix).
 *
 * The PWA Wall reads its findings from `useAnalyzeStore` (the reactive source of
 * truth), but FE-1's original `handleCaptureModel` wrote the captured-model
 * Finding into the SEPARATE `useFindings` engine, so the captured model never
 * reached the PWA Wall. This seam wires `onCaptureModel` to the EXACT routing
 * AnalyzeView now uses — write the Finding + projection into `useAnalyzeStore` —
 * and renders the PRODUCTION WallCanvas with `findings` taken from that store.
 *
 *   - Live wire: tapping Capture lands a Finding in `useAnalyzeStore.findings`
 *     carrying the model snapshot (projection.modelContext), and the unlinked
 *     Finding renders on the Wall's orphan lane (render-through, not a spy).
 *   - Regression guard (the FE-1 bug): if the handler wrote to `useFindings`
 *     instead, `useAnalyzeStore.findings` would stay empty and the Wall node
 *     would be absent → this fails.
 */

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
  };
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas, type WallCanvasModelBuilderProps } from '@variscout/ui';
import type { CapturedModelSnapshot } from '@variscout/ui';
import {
  getAnalyzeInitialState,
  getCanvasViewportInitialState,
  useAnalyzeStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import type { DataRow, FindingProjection } from '@variscout/core';

// Shift dominates Y; Noise + Machine are decoupled junk → vital few = {Shift}.
function scopeRows(): DataRow[] {
  const rows: DataRow[] = [];
  const shiftMean: Record<string, number> = { A: 10, B: 20, C: 30 };
  const wobble = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
  const noiseSeq = ['x', 'x', 'y', 'y', 'x', 'x', 'y', 'y', 'x', 'x', 'y', 'y'];
  for (const s of ['A', 'B', 'C']) {
    for (let r = 0; r < 12; r++) {
      rows.push({ Shift: s, Noise: noiseSeq[r], Y: shiftMean[s] + wobble[r] });
    }
  }
  return rows;
}

/** The EXACT routing AnalyzeView uses: write the captured model into useAnalyzeStore. */
function pwaCaptureModel(snapshot: CapturedModelSnapshot) {
  const r2adjLabel = Number.isFinite(snapshot.rSquaredAdj) ? snapshot.rSquaredAdj.toFixed(2) : '—';
  const store = useAnalyzeStore.getState();
  const finding = store.addFinding(
    `Model: ${snapshot.factors.join(', ')} accounts for the spread (R²adj ${r2adjLabel}) in ${snapshot.scopeLabel}`,
    { activeFilters: {}, cumulativeScope: null }
  );
  const projection: FindingProjection = {
    baselineMean: 0,
    baselineSigma: 0,
    projectedMean: 0,
    projectedSigma: 0,
    meanDelta: 0,
    sigmaDelta: 0,
    simulationParams: { meanAdjustment: 0, variationReduction: 0, presetUsed: 'model-capture' },
    createdAt: new Date('2026-05-31T00:00:00Z').toISOString(),
    modelContext: {
      linkedFactor: snapshot.topFactor ?? undefined,
      rSquaredAdj: snapshot.rSquaredAdj,
      scopeLabel: snapshot.scopeLabel,
    },
  };
  store.setFindingProjection(finding.id, projection);
}

function modelBuilderProps(
  overrides?: Partial<WallCanvasModelBuilderProps>
): WallCanvasModelBuilderProps {
  return {
    candidateFactors: ['Shift', 'Noise'],
    scopeLabel: 'All data',
    onCaptureModel: pwaCaptureModel,
    ...overrides,
  };
}

function renderWall() {
  const findings = useAnalyzeStore.getState().findings;
  return render(
    <WallCanvas
      hubs={[]}
      findings={findings}
      problemCpk={0.8}
      eventsPerWeek={10}
      rows={scopeRows()}
      outcomeColumn="Y"
      modelBuilderProps={modelBuilderProps()}
    />
  );
}

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

describe('PWA Wall capture-as-Finding seam (FE-1 fix)', () => {
  it('tapping Capture lands the model Finding in useAnalyzeStore (the Wall’s store)', () => {
    renderWall();
    fireEvent.click(screen.getByTestId('model-capture'));

    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].text).toContain('Model:');
    // The model snapshot rode along in projection.modelContext.
    expect(findings[0].projection?.modelContext?.linkedFactor).toBe('Shift');
    expect(typeof findings[0].projection?.modelContext?.rSquaredAdj).toBe('number');
  });

  it('the captured-model Finding renders on the PWA Wall (orphan lane) — regression guard', () => {
    function Harness() {
      // Re-read findings from the store on each render so the new orphan node
      // appears after capture (mirrors AnalyzeView's reactive subscription).
      const findings = useAnalyzeStore(s => s.findings);
      return (
        <WallCanvas
          hubs={[]}
          findings={findings}
          problemCpk={0.8}
          eventsPerWeek={10}
          rows={scopeRows()}
          outcomeColumn="Y"
          modelBuilderProps={modelBuilderProps()}
        />
      );
    }
    const { container } = render(<Harness />);
    // No orphan node before capture.
    expect(container.querySelector('[data-wall-orphan-lane]')).toBeNull();

    fireEvent.click(screen.getByTestId('model-capture'));

    const findingId = useAnalyzeStore.getState().findings[0].id;
    const lane = container.querySelector('[data-wall-orphan-lane]');
    expect(lane).not.toBeNull();
    expect(container.querySelector(`[data-wall-node-id="${findingId}"]`)).not.toBeNull();
  });
});
