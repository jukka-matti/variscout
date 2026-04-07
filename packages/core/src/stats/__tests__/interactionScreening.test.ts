import { describe, it, expect } from 'vitest';
import {
  screenInteractionPair,
  classifyInteractionPattern,
  assignPlotAxes,
} from '../interactionScreening';
import type { DataRow } from '../../types';

// ---------------------------------------------------------------------------
// Test data generators
// ---------------------------------------------------------------------------

/**
 * makeInteractionData — cont×cat with ORDINAL interaction.
 * Machine A slope +2.0/unit, Machine B slope +0.5/unit.
 * Same direction, different magnitude. ~50 rows.
 */
function makeInteractionData(): DataRow[] {
  const rows: DataRow[] = [];
  // 25 rows for Machine A, 25 for Machine B
  for (let i = 0; i < 25; i++) {
    const temp = i * 2; // 0, 2, 4, ... 48
    rows.push({
      Temperature: temp,
      Machine: 'A',
      Yield: 10 + 2.0 * temp + (Math.random() - 0.5) * 0.5,
    });
  }
  for (let i = 0; i < 25; i++) {
    const temp = i * 2;
    rows.push({
      Temperature: temp,
      Machine: 'B',
      Yield: 5 + 0.5 * temp + (Math.random() - 0.5) * 0.5,
    });
  }
  return rows;
}

/**
 * makeNoInteractionData — Parallel slopes (both +1.5/unit), different intercepts.
 */
function makeNoInteractionData(): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < 25; i++) {
    const temp = i * 2;
    rows.push({
      Temperature: temp,
      Machine: 'A',
      Yield: 10 + 1.5 * temp + (Math.random() - 0.5) * 0.2,
    });
  }
  for (let i = 0; i < 25; i++) {
    const temp = i * 2;
    rows.push({
      Temperature: temp,
      Machine: 'B',
      Yield: 3 + 1.5 * temp + (Math.random() - 0.5) * 0.2,
    });
  }
  return rows;
}

/**
 * makeDisordinalData — Machine A slope +1.5, Machine B slope -1.0. Lines cross.
 */
function makeDisordinalData(): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < 25; i++) {
    const temp = i * 2;
    rows.push({
      Temperature: temp,
      Machine: 'A',
      Yield: 10 + 1.5 * temp + (Math.random() - 0.5) * 0.3,
    });
  }
  for (let i = 0; i < 25; i++) {
    const temp = i * 2;
    rows.push({
      Temperature: temp,
      Machine: 'B',
      Yield: 50 - 1.0 * temp + (Math.random() - 0.5) * 0.3,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// screenInteractionPair
// ---------------------------------------------------------------------------

describe('screenInteractionPair', () => {
  it('detects significant cont×cat interaction in makeInteractionData', () => {
    const data = makeInteractionData();
    const result = screenInteractionPair(
      data,
      'Yield',
      [
        { name: 'Temperature', type: 'continuous' },
        { name: 'Machine', type: 'categorical' },
      ],
      'Temperature',
      'Machine'
    );

    expect(result.isSignificant).toBe(true);
    expect(result.pValue).toBeLessThan(0.1);
    expect(result.interactionType).toBe('cont×cat');
    expect(result.deltaRSquaredAdj).toBeGreaterThan(0);
    // factors should be alphabetically sorted
    expect(result.factors).toEqual(['Machine', 'Temperature']);
  });

  it('rejects interaction in makeNoInteractionData', () => {
    const data = makeNoInteractionData();
    const result = screenInteractionPair(
      data,
      'Yield',
      [
        { name: 'Temperature', type: 'continuous' },
        { name: 'Machine', type: 'categorical' },
      ],
      'Temperature',
      'Machine'
    );

    expect(result.isSignificant).toBe(false);
    expect(result.pValue).toBeGreaterThan(0.1);
  });
});

// ---------------------------------------------------------------------------
// classifyInteractionPattern
// ---------------------------------------------------------------------------

describe('classifyInteractionPattern', () => {
  it('returns ordinal for makeInteractionData (same direction, different slopes)', () => {
    const data = makeInteractionData();
    const pattern = classifyInteractionPattern(data, 'Yield', 'Temperature', 'Machine');
    expect(pattern).toBe('ordinal');
  });

  it('returns disordinal for makeDisordinalData (crossing lines)', () => {
    const data = makeDisordinalData();
    const pattern = classifyInteractionPattern(data, 'Yield', 'Temperature', 'Machine');
    expect(pattern).toBe('disordinal');
  });
});

// ---------------------------------------------------------------------------
// assignPlotAxes
// ---------------------------------------------------------------------------

describe('assignPlotAxes', () => {
  it('puts continuous on x for cont×cat (continuous listed first)', () => {
    const result = assignPlotAxes('Temperature', 'continuous', 'Machine', 'categorical');
    expect(result.plotXAxis).toBe('Temperature');
    expect(result.plotSeries).toBe('Machine');
    expect(result.rationale).toBe('continuous-on-x');
  });

  it('puts continuous on x even when listed second', () => {
    const result = assignPlotAxes('Machine', 'categorical', 'Temperature', 'continuous');
    expect(result.plotXAxis).toBe('Temperature');
    expect(result.plotSeries).toBe('Machine');
    expect(result.rationale).toBe('continuous-on-x');
  });

  it('puts more levels on x for cat×cat', () => {
    const result = assignPlotAxes(
      'Machine',
      'categorical',
      'Product',
      'categorical',
      ['A', 'B', 'C'],
      ['X', 'Y']
    );
    expect(result.plotXAxis).toBe('Machine'); // 3 levels > 2 levels
    expect(result.plotSeries).toBe('Product');
    expect(result.rationale).toBe('more-levels-on-x');
  });

  it('puts first factor on x for cont×cont', () => {
    const result = assignPlotAxes('Temperature', 'continuous', 'Pressure', 'continuous');
    expect(result.plotXAxis).toBe('Temperature');
    expect(result.plotSeries).toBe('Pressure');
    expect(result.rationale).toBe('continuous-on-x');
  });
});
