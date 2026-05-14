import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CANVAS_LENS_REGISTRY,
  type CanvasLensId,
  isCanvasLensValidAtLevel,
} from '@variscout/hooks';
import type { CanvasLevel } from '@variscout/core/canvas';
import { CanvasLensPicker } from '../CanvasLensPicker';

// useWallLocale reads from document.documentElement[data-locale], falls back to
// 'en'. getMessage falls back to the English catalog for 'en' without
// registerLocaleLoaders, so no locale setup is needed.

const ALL_LENS_IDS: CanvasLensId[] = [
  'default',
  'capability',
  'defect',
  'process-flow',
  'performance',
  'yamazumi',
];

const ALL_LEVELS: CanvasLevel[] = ['l1', 'l2', 'l3'];

// English labels from the catalog (verified from en.ts)
const LENS_ENGLISH_LABELS: Record<CanvasLensId, string> = {
  default: 'Default',
  capability: 'Capability',
  defect: 'Defect',
  'process-flow': 'Process flow',
  performance: 'Performance',
  yamazumi: 'Yamazumi',
};

describe('CanvasLensPicker', () => {
  it('renders all six lenses from CANVAS_LENS_REGISTRY', () => {
    render(<CanvasLensPicker activeLens="default" />);

    for (const id of ALL_LENS_IDS) {
      const label = LENS_ENGLISH_LABELS[id];
      expect(screen.getByRole('button', { name: `${label} lens` })).toBeInTheDocument();
    }
  });

  it('toolbar has aria-label from canvas.lensPicker.ariaLabel ("Canvas lenses")', () => {
    render(<CanvasLensPicker activeLens="default" />);

    expect(screen.getByRole('toolbar', { name: 'Canvas lenses' })).toBeInTheDocument();
  });

  it('each button aria-label uses canvas.lensPicker.lensAriaLabel pattern ("{label} lens")', () => {
    render(<CanvasLensPicker activeLens="default" />);

    for (const id of ALL_LENS_IDS) {
      const label = LENS_ENGLISH_LABELS[id];
      expect(screen.getByRole('button', { name: `${label} lens` })).toBeInTheDocument();
    }
  });

  it.each(ALL_LENS_IDS)(
    'enabled/disabled state for lens "%s" reflects lens.enabled from CANVAS_LENS_REGISTRY',
    lensId => {
      render(<CanvasLensPicker activeLens="default" />);

      const label = LENS_ENGLISH_LABELS[lensId];
      const button = screen.getByRole('button', { name: `${label} lens` });
      const expectedEnabled = CANVAS_LENS_REGISTRY[lensId].enabled;

      if (expectedEnabled) {
        expect(button).toBeEnabled();
      } else {
        expect(button).toBeDisabled();
      }
    }
  );

  it('active lens button has aria-pressed="true"; others have aria-pressed="false"', () => {
    render(<CanvasLensPicker activeLens="capability" />);

    expect(screen.getByRole('button', { name: 'Capability lens' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    for (const id of ALL_LENS_IDS) {
      if (id === 'capability') continue;
      const label = LENS_ENGLISH_LABELS[id];
      expect(screen.getByRole('button', { name: `${label} lens` })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    }
  });

  it('fires onChange(lensId) when an enabled lens is clicked', () => {
    const onChange = vi.fn();
    const enabledLens = ALL_LENS_IDS.find(id => CANVAS_LENS_REGISTRY[id].enabled)!;
    render(<CanvasLensPicker activeLens="default" onChange={onChange} />);

    const label = LENS_ENGLISH_LABELS[enabledLens];
    fireEvent.click(screen.getByRole('button', { name: `${label} lens` }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(enabledLens);
  });

  it('does not fire onChange when a disabled lens is clicked', () => {
    const onChange = vi.fn();
    const disabledLens = ALL_LENS_IDS.find(id => !CANVAS_LENS_REGISTRY[id].enabled)!;
    render(<CanvasLensPicker activeLens="default" onChange={onChange} />);

    const label = LENS_ENGLISH_LABELS[disabledLens];
    const button = screen.getByRole('button', { name: `${label} lens` });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onChange).not.toHaveBeenCalled();
  });
});

/**
 * Parameterized 18-cell matrix: all 3 levels × all 6 lenses.
 * Tests isCanvasLensValidAtLevel as a pure function — the predicate
 * is the runtime source of truth for lens × level validity.
 */
describe('isCanvasLensValidAtLevel — 3 × 6 matrix', () => {
  const cells: Array<[CanvasLevel, CanvasLensId]> = ALL_LEVELS.flatMap(level =>
    ALL_LENS_IDS.map(lensId => [level, lensId] as [CanvasLevel, CanvasLensId])
  );

  it.each(cells)('level=%s lens=%s validity is deterministic', (level, lensId) => {
    // The predicate is the source of truth; verify it is a boolean (not
    // undefined / null) and that it is stable across repeated calls.
    const result = isCanvasLensValidAtLevel(lensId, level);
    expect(typeof result).toBe('boolean');
    expect(isCanvasLensValidAtLevel(lensId, level)).toBe(result);
  });

  it('yamazumi is invalid at l1, valid at l2 and l3', () => {
    expect(isCanvasLensValidAtLevel('yamazumi', 'l1')).toBe(false);
    expect(isCanvasLensValidAtLevel('yamazumi', 'l2')).toBe(true);
    expect(isCanvasLensValidAtLevel('yamazumi', 'l3')).toBe(true);
  });

  it('process-flow is invalid at l1 and l3, valid at l2', () => {
    expect(isCanvasLensValidAtLevel('process-flow', 'l1')).toBe(false);
    expect(isCanvasLensValidAtLevel('process-flow', 'l2')).toBe(true);
    expect(isCanvasLensValidAtLevel('process-flow', 'l3')).toBe(false);
  });

  it('default, capability, defect, performance are valid at all levels', () => {
    const alwaysValidLenses: CanvasLensId[] = ['default', 'capability', 'defect', 'performance'];
    for (const lensId of alwaysValidLenses) {
      for (const level of ALL_LEVELS) {
        expect(isCanvasLensValidAtLevel(lensId, level)).toBe(true);
      }
    }
  });
});
