import { describe, it, expect } from 'vitest';
import { buildFindingSharePayload, buildChartSharePayload } from '../shareContent';
import type { Finding } from '@variscout/core';

const BASE_URL = 'https://app.example.com/';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    text: 'High variation in fill head 3',
    createdAt: Date.now(),
    status: 'observed',
    statusChangedAt: Date.now(),
    comments: [],
    context: {
      activeFilters: { 'Fill Head': ['3'] },
      cumulativeScope: 42,
      stats: { mean: 250.1, samples: 30, cpk: 0.8 },
    },
    ...overrides,
  };
}

describe('shareContent', () => {
  describe('buildFindingSharePayload', () => {
    it('builds title from finding text', () => {
      const finding = makeFinding({ text: 'Short note' });
      const payload = buildFindingSharePayload(finding, 'Project', BASE_URL);
      expect(payload.title).toBe('Finding: Short note');
    });

    it('truncates long text in title to 50 chars', () => {
      const longText = 'A'.repeat(80);
      const finding = makeFinding({ text: longText });
      const payload = buildFindingSharePayload(finding, 'P', BASE_URL);
      expect(payload.title.length).toBeLessThanOrEqual('Finding: '.length + 50);
      expect(payload.title).toContain('\u2026');
    });

    it('handles finding with no text', () => {
      const finding = makeFinding({ text: '' });
      const payload = buildFindingSharePayload(finding, 'P', BASE_URL);
      expect(payload.title).toBe('Finding: No note');
    });

    it('includes project and finding ID in URL', () => {
      const finding = makeFinding();
      const payload = buildFindingSharePayload(finding, 'MyProject', BASE_URL);
      expect(payload.url).toContain('project=MyProject');
      expect(payload.url).toContain('finding=f1');
    });

    it('includes Cpk in preview text when available', () => {
      const finding = makeFinding();
      const payload = buildFindingSharePayload(finding, 'P', BASE_URL);
      expect(payload.previewText).toContain('Cpk 0.8');
    });

    it('includes status in preview text', () => {
      const finding = makeFinding({ status: 'investigating' });
      const payload = buildFindingSharePayload(finding, 'P', BASE_URL);
      expect(payload.previewText).toContain('[investigating]');
    });

    it('omits Cpk when stats have no cpk', () => {
      const finding = makeFinding({
        context: { activeFilters: {}, cumulativeScope: null, stats: { mean: 10, samples: 5 } },
      });
      const payload = buildFindingSharePayload(finding, 'P', BASE_URL);
      expect(payload.previewText).not.toContain('Cpk');
    });
  });

  describe('buildChartSharePayload', () => {
    it('builds title with chart label and project', () => {
      const payload = buildChartSharePayload('ichart', 'Project', BASE_URL);
      expect(payload.title).toBe('I-Chart: Project');
    });

    it('maps chart types to display labels', () => {
      expect(buildChartSharePayload('ichart', 'P', BASE_URL).title).toContain('I-Chart');
      expect(buildChartSharePayload('boxplot', 'P', BASE_URL).title).toContain('Boxplot');
      expect(buildChartSharePayload('pareto', 'P', BASE_URL).title).toContain('Pareto');
      expect(buildChartSharePayload('stats', 'P', BASE_URL).title).toContain('Stats');
    });

    it('includes chart type in URL', () => {
      const payload = buildChartSharePayload('boxplot', 'Project', BASE_URL);
      expect(payload.url).toContain('chart=boxplot');
      expect(payload.url).toContain('project=Project');
    });

    it('includes Cpk context in preview when provided', () => {
      const payload = buildChartSharePayload('ichart', 'P', BASE_URL, { cpk: 1.33 });
      expect(payload.previewText).toContain('Cpk 1.3');
    });

    it('includes filter context in preview when provided', () => {
      const payload = buildChartSharePayload('boxplot', 'P', BASE_URL, {
        filters: 'Machine=A',
      });
      expect(payload.previewText).toContain('Machine=A');
    });

    it('handles unknown chart type gracefully', () => {
      const payload = buildChartSharePayload('custom', 'P', BASE_URL);
      expect(payload.title).toBe('custom: P');
    });
  });
});
