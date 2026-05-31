import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Finding, Hypothesis } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';
import {
  buildIdeaImpacts,
  createAnalyzeFeatureStore,
  createFindingsFeatureStore,
  groupFindingsByChart,
} from '..';

interface StoresPackageJson {
  exports: Record<string, string>;
}

describe('createAnalyzeFeatureStore', () => {
  it('starts with null projection target and expanded hypothesis id', () => {
    const store = createAnalyzeFeatureStore();

    expect(store.getState().projectionTarget).toBeNull();
    expect(store.getState().expandedHypothesisId).toBeNull();
  });

  it('sets, clears, and overwrites projection targets', () => {
    const store = createAnalyzeFeatureStore();
    const first = {
      hypothesisId: 'h-1',
      ideaId: 'i-1',
      ideaText: 'Train operators',
      hypothesisText: 'Shift effect',
    };
    const second = {
      hypothesisId: 'h-2',
      ideaId: 'i-2',
      ideaText: 'Calibrate spindle',
      hypothesisText: 'Spindle wear',
    };

    store.getState().setProjectionTarget(first);
    expect(store.getState().projectionTarget).toEqual(first);
    store.getState().setProjectionTarget(second);
    expect(store.getState().projectionTarget).toEqual(second);
    store.getState().setProjectionTarget(null);
    expect(store.getState().projectionTarget).toBeNull();
  });

  it('sets, clears, and overwrites expanded hypothesis id', () => {
    const store = createAnalyzeFeatureStore();

    store.getState().expandToHypothesis('h-1');
    expect(store.getState().expandedHypothesisId).toBe('h-1');
    store.getState().expandToHypothesis('h-2');
    expect(store.getState().expandedHypothesisId).toBe('h-2');
    store.getState().expandToHypothesis(null);
    expect(store.getState().expandedHypothesisId).toBeNull();
  });

  it('creates independent store instances', () => {
    const firstStore = createAnalyzeFeatureStore();
    const secondStore = createAnalyzeFeatureStore();

    firstStore.getState().expandToHypothesis('h-1');

    expect(firstStore.getState().expandedHypothesisId).toBe('h-1');
    expect(secondStore.getState().expandedHypothesisId).toBeNull();
  });
});

describe('buildIdeaImpacts', () => {
  it('returns an empty map when hypotheses have no ideas', () => {
    const hypotheses = [
      {
        id: 'h-1',
        name: 'Nozzle wear',
        status: 'proposed',
        synthesis: '',
        findingIds: [],
        investigationId: 'general-unassigned',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      },
    ] as Hypothesis[];

    expect(buildIdeaImpacts(hypotheses, undefined, null)).toEqual({});
  });

  it('returns impact entries keyed by idea id when ideas are present', () => {
    const hypotheses = [
      {
        id: 'h-1',
        name: 'Shift effect',
        status: 'proposed',
        synthesis: '',
        findingIds: [],
        investigationId: 'general-unassigned',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
        ideas: [
          {
            id: 'idea-1',
            text: 'Train operators',
            createdAt: 1,
            deletedAt: null,
          },
        ],
      },
    ] as Hypothesis[];

    expect(buildIdeaImpacts(hypotheses, undefined, null)).toHaveProperty('idea-1');
  });
});

describe('createFindingsFeatureStore', () => {
  it('starts with null highlighted finding id and status filter', () => {
    const store = createFindingsFeatureStore();

    expect(store.getState().highlightedFindingId).toBeNull();
    expect(store.getState().statusFilter).toBeNull();
  });

  it('sets, clears, and overwrites highlighted finding id', () => {
    const store = createFindingsFeatureStore();

    store.getState().setHighlightedFindingId('f-1');
    expect(store.getState().highlightedFindingId).toBe('f-1');
    store.getState().setHighlightedFindingId('f-2');
    expect(store.getState().highlightedFindingId).toBe('f-2');
    store.getState().setHighlightedFindingId(null);
    expect(store.getState().highlightedFindingId).toBeNull();
  });

  it('sets, clears, and overwrites status filter', () => {
    const store = createFindingsFeatureStore();

    store.getState().setStatusFilter('observed');
    expect(store.getState().statusFilter).toBe('observed');
    store.getState().setStatusFilter('investigating');
    expect(store.getState().statusFilter).toBe('investigating');
    store.getState().setStatusFilter(null);
    expect(store.getState().statusFilter).toBeNull();
  });

  it('creates independent store instances', () => {
    const firstStore = createFindingsFeatureStore();
    const secondStore = createFindingsFeatureStore();

    firstStore.getState().setHighlightedFindingId('f-1');

    expect(firstStore.getState().highlightedFindingId).toBe('f-1');
    expect(secondStore.getState().highlightedFindingId).toBeNull();
  });
});

describe('groupFindingsByChart', () => {
  it('groups findings by chart source', () => {
    const findings = [
      {
        id: '1',
        text: 'boxplot finding',
        source: { chart: 'boxplot', category: 'A', timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: '2',
        text: 'pareto finding',
        source: { chart: 'pareto', category: 'B', timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: '3',
        text: 'ichart finding',
        source: { chart: 'ichart', anchorX: 0, anchorY: 0, timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: '4',
        text: 'another boxplot finding',
        source: { chart: 'boxplot', category: 'C', timeLens: DEFAULT_TIME_LENS },
      },
    ] as Finding[];

    const result = groupFindingsByChart(findings);

    expect(result.boxplot.map(finding => finding.id)).toEqual(['1', '4']);
    expect(result.pareto.map(finding => finding.id)).toEqual(['2']);
    expect(result.ichart.map(finding => finding.id)).toEqual(['3']);
  });

  it('returns empty arrays for empty input', () => {
    expect(groupFindingsByChart([])).toEqual({ boxplot: [], pareto: [], ichart: [] });
  });

  it('does not group findings without a source', () => {
    const findings = [
      { id: '1', text: 'no source' },
      { id: '2', text: 'undefined source', source: undefined },
    ] as Finding[];

    expect(groupFindingsByChart(findings)).toEqual({ boxplot: [], pareto: [], ichart: [] });
  });
});

describe('feature-factories package boundary', () => {
  it('is exported as a subpath without expanding the root stores barrel', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')
    ) as StoresPackageJson;
    const rootIndex = readFileSync(new URL('../../index.ts', import.meta.url), 'utf-8');

    expect(packageJson.exports['./feature-factories']).toBe('./src/feature-factories/index.ts');
    expect(rootIndex).not.toContain('feature-factories');
    expect(rootIndex).not.toContain('createAnalyzeFeatureStore');
    expect(rootIndex).not.toContain('createFindingsFeatureStore');
  });
});
