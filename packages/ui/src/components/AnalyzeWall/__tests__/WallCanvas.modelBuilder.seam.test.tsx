/**
 * WallCanvas model-builder SEAM test (Factors & Evaluation Increment 1).
 *
 * Proves the vital-few model-builder band is wired through the PRODUCTION Wall
 * path — NOT a leaf with injected stats. The REAL WallCanvas receives the
 * scope's rows + candidate factors + outcome Y via `modelBuilderProps` and mounts
 * the REAL `ModelBuilderBand`, which runs the REAL `computeBestSubsets` engine.
 *
 * A dead wiring (band not mounted by WallCanvas, or rows/outcome not threaded)
 * FAILS these: the vital-few would not be pre-selected, the R²adj header would be
 * absent, toggling would not change the model, the snap-back would not restore,
 * and capture-as-Finding would not fire with the model snapshot.
 */
import React, { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasModelBuilderProps } from '../WallCanvas';
import type { CapturedModelSnapshot } from '../ModelBuilderBand';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { DataRow } from '@variscout/core';

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

// One hub so the Wall renders its body (the band coexists with hubs/footer, like
// TributaryFooter — it mounts inside the SVG body, not the empty-state CTA).
const hub = createHypothesis('Setup variation', '', []);

// Shift dominates Y; Noise + Machine are decoupled junk → vital few = {Shift}.
function scopeRows(): DataRow[] {
  const rows: DataRow[] = [];
  const shiftMean: Record<string, number> = { A: 10, B: 20, C: 30 };
  const wobble = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
  const noiseSeq = ['x', 'x', 'y', 'y', 'x', 'x', 'y', 'y', 'x', 'x', 'y', 'y'];
  const machineSeq = ['m1', 'm1', 'm1', 'm1', 'm2', 'm2', 'm1', 'm1', 'm1', 'm1', 'm2', 'm2'];
  for (const s of ['A', 'B', 'C']) {
    for (let r = 0; r < 12; r++) {
      rows.push({
        Shift: s,
        Noise: noiseSeq[r],
        Machine: machineSeq[r],
        Y: shiftMean[s] + wobble[r],
      });
    }
  }
  return rows;
}

function baseModelBuilderProps(
  overrides?: Partial<WallCanvasModelBuilderProps>
): WallCanvasModelBuilderProps {
  return {
    candidateFactors: ['Shift', 'Noise', 'Machine'],
    scopeLabel: 'All data',
    ...overrides,
  };
}

describe('WallCanvas — model-builder band seam', () => {
  it('mounts the band through the Wall and pre-selects the vital few (real engine)', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps()}
      />
    );
    // The band mounted via the production WallCanvas path.
    expect(screen.getByTestId('model-builder-band')).toBeTruthy();
    // Vital-few (Shift) is pre-selected above the line — engine ran on real rows.
    expect(
      within(screen.getByTestId('model-kept')).getByTestId('model-kept-factor-Shift')
    ).toBeTruthy();
    // R²adj header rendered (dead wiring would show empty/too-few, not this).
    expect(screen.getByTestId('model-r2adj').textContent).toMatch(/R²adj\s+\d/);
  });

  it('does NOT mount the band when modelBuilderProps is omitted', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
      />
    );
    expect(screen.queryByTestId('model-builder-band')).toBeNull();
  });

  it('toggling a candidate through the Wall changes the rendered R²adj header live', () => {
    const parseR2 = (s: string | null) => parseFloat((s ?? '').replace(/[^\d.]/g, ''));
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps()}
      />
    );
    const before = parseR2(screen.getByTestId('model-r2adj').textContent);
    fireEvent.click(screen.getByTestId('model-candidate-factor-Noise'));
    // Noise is now kept (the toggle flowed through the mounted band).
    expect(
      within(screen.getByTestId('model-kept')).getByTestId('model-kept-factor-Noise')
    ).toBeTruthy();
    // Over-adding junk does not improve R²adj.
    expect(parseR2(screen.getByTestId('model-r2adj').textContent)).toBeLessThanOrEqual(
      before + 1e-9
    );
  });

  it('snap-back through the Wall restores the suggested model', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps()}
      />
    );
    expect(screen.queryByTestId('model-use-suggested')).toBeNull();
    fireEvent.click(screen.getByTestId('model-candidate-factor-Noise'));
    fireEvent.click(screen.getByTestId('model-use-suggested'));
    expect(screen.queryByTestId('model-use-suggested')).toBeNull();
    expect(
      within(screen.getByTestId('model-candidates')).getByTestId('model-candidate-factor-Noise')
    ).toBeTruthy();
  });

  it('capture-as-Finding through the Wall produces a Finding carrying the model snapshot', () => {
    // Harness mirrors the apps: onCaptureModel creates a Finding + stamps the
    // model snapshot into its projection.modelContext. A dead wiring (snapshot
    // not threaded) would leave the Finding without rSquaredAdj/linkedFactor.
    const created: Array<{ rSquaredAdj?: number; linkedFactor?: string; scopeLabel?: string }> = [];
    function Harness() {
      const [, setTick] = useState(0);
      const onCaptureModel = (snapshot: CapturedModelSnapshot) => {
        created.push({
          rSquaredAdj: snapshot.rSquaredAdj,
          linkedFactor: snapshot.topFactor ?? undefined,
          scopeLabel: snapshot.scopeLabel,
        });
        setTick(t => t + 1);
      };
      return (
        <WallCanvas
          hubId={'test-hub' as never}
          hubs={[hub]}
          findings={[]}
          problemCpk={0.8}
          eventsPerWeek={10}
          rows={scopeRows()}
          outcomeColumn="Y"
          modelBuilderProps={baseModelBuilderProps({ onCaptureModel })}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByTestId('model-capture'));
    expect(created).toHaveLength(1);
    expect(created[0].linkedFactor).toBe('Shift');
    expect(created[0].scopeLabel).toBe('All data');
    expect(typeof created[0].rSquaredAdj).toBe('number');
  });

  it('chips a scope-constant factor when the scope drilled on it', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps({
          constantFactors: ['Machine'],
          scopeLabel: 'Machine=m1',
        })}
      />
    );
    expect(screen.getByTestId('model-constant-factor-Machine')).toBeTruthy();
    expect(screen.queryByTestId('model-candidate-factor-Machine')).toBeNull();
  });
});
