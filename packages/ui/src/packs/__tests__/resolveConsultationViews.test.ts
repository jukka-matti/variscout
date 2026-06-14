/**
 * CL-5a tests for resolveConsultationViews
 *
 * Verifies:
 * - Each field maps to the correct ResolvedView kind + shape
 * - Absent inputs produce no view
 * - Empty data/groups arrays produce no view (not the same as omitting the field)
 * - Output order is stable: condition → ichart → boxplot
 * - The exact ResolvedView type from buildConsultationPack is used (no redefinition)
 */
import { describe, expect, it } from 'vitest';
import { resolveConsultationViews } from '../resolveConsultationViews';
import type { ResolvedView } from '../buildConsultationPack';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CONDITION = {
  label: 'Day_of_Week = Monday',
  statsText: 'Cpk 0.77 · 12 events',
};

const ICHART_DATA = [
  { x: 1, y: 10.2 },
  { x: 2, y: 10.5 },
  { x: 3, y: 9.8 },
];

const ICHART = {
  title: 'Individual Values — Line 3',
  data: ICHART_DATA,
  mean: 10.2,
  ucl: 11.0,
  lcl: 9.4,
};

const BOXPLOT_GROUPS = [
  { key: 'Monday', q1: 9.5, median: 10.2, q3: 11.0, min: 9.0, max: 11.5 },
  { key: 'Tuesday', q1: 10.0, median: 10.8, q3: 11.3, min: 9.8, max: 11.8 },
];

const BOXPLOT = {
  title: 'Shift comparison',
  groups: BOXPLOT_GROUPS,
};

// ── Single-field mapping ──────────────────────────────────────────────────────

describe('resolveConsultationViews — single field', () => {
  it('maps a condition to a condition ResolvedView', () => {
    const views = resolveConsultationViews({ condition: CONDITION });
    expect(views).toHaveLength(1);
    const v = views[0] as Extract<ResolvedView, { kind: 'condition' }>;
    expect(v.kind).toBe('condition');
    expect(v.label).toBe('Day_of_Week = Monday');
    expect(v.statsText).toBe('Cpk 0.77 · 12 events');
  });

  it('maps an ichart to a chart ResolvedView with chartType ichart', () => {
    const views = resolveConsultationViews({ ichart: ICHART });
    expect(views).toHaveLength(1);
    const v = views[0] as Extract<ResolvedView, { kind: 'chart' }>;
    expect(v.kind).toBe('chart');
    expect(v.chartType).toBe('ichart');
    expect(v.title).toBe('Individual Values — Line 3');
    expect(v.data).toEqual(ICHART_DATA);
    expect(v.mean).toBe(10.2);
    expect(v.ucl).toBe(11.0);
    expect(v.lcl).toBe(9.4);
  });

  it('maps a boxplot to a chart ResolvedView with chartType boxplot', () => {
    const views = resolveConsultationViews({ boxplot: BOXPLOT });
    expect(views).toHaveLength(1);
    const v = views[0] as Extract<ResolvedView, { kind: 'chart' }>;
    expect(v.kind).toBe('chart');
    expect(v.chartType).toBe('boxplot');
    expect(v.title).toBe('Shift comparison');
    expect(v.groups).toEqual(BOXPLOT_GROUPS);
  });
});

// ── Empty / absent inputs ─────────────────────────────────────────────────────

describe('resolveConsultationViews — empty / absent inputs', () => {
  it('returns an empty array when input is {}', () => {
    expect(resolveConsultationViews({})).toHaveLength(0);
  });

  it('omits ichart when data array is empty', () => {
    const views = resolveConsultationViews({
      ichart: { title: 'Empty I-Chart', data: [] },
    });
    expect(views).toHaveLength(0);
  });

  it('omits boxplot when groups array is empty', () => {
    const views = resolveConsultationViews({
      boxplot: { title: 'Empty Boxplot', groups: [] },
    });
    expect(views).toHaveLength(0);
  });

  it('includes condition but omits ichart with empty data', () => {
    const views = resolveConsultationViews({
      condition: CONDITION,
      ichart: { title: 'Empty I-Chart', data: [] },
    });
    expect(views).toHaveLength(1);
    expect(views[0].kind).toBe('condition');
  });
});

// ── Order stability ───────────────────────────────────────────────────────────

describe('resolveConsultationViews — output order', () => {
  it('condition comes before ichart', () => {
    const views = resolveConsultationViews({ condition: CONDITION, ichart: ICHART });
    expect(views).toHaveLength(2);
    expect(views[0].kind).toBe('condition');
    expect(views[1].kind).toBe('chart');
    const chart = views[1] as Extract<ResolvedView, { kind: 'chart' }>;
    expect(chart.chartType).toBe('ichart');
  });

  it('ichart comes before boxplot', () => {
    const views = resolveConsultationViews({ ichart: ICHART, boxplot: BOXPLOT });
    expect(views).toHaveLength(2);
    const [first, second] = views as Array<Extract<ResolvedView, { kind: 'chart' }>>;
    expect(first.chartType).toBe('ichart');
    expect(second.chartType).toBe('boxplot');
  });

  it('all three present: condition → ichart → boxplot', () => {
    const views = resolveConsultationViews({
      condition: CONDITION,
      ichart: ICHART,
      boxplot: BOXPLOT,
    });
    expect(views).toHaveLength(3);
    expect(views[0].kind).toBe('condition');
    const second = views[1] as Extract<ResolvedView, { kind: 'chart' }>;
    const third = views[2] as Extract<ResolvedView, { kind: 'chart' }>;
    expect(second.chartType).toBe('ichart');
    expect(third.chartType).toBe('boxplot');
  });
});
