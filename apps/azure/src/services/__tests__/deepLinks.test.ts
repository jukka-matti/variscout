import { describe, it, expect } from 'vitest';
import {
  parseDeepLink,
  buildFindingLink,
  buildChartLink,
  buildSubPageId,
  parseSubPageId,
} from '../deepLinks';

describe('deepLinks', () => {
  describe('parseDeepLink', () => {
    it('parses project + finding params', () => {
      const result = parseDeepLink('?project=MyAnalysis&finding=abc123');
      expect(result).toEqual({
        project: 'MyAnalysis',
        findingId: 'abc123',
        chart: null,
        mode: null,
      });
    });

    it('parses project + chart params', () => {
      const result = parseDeepLink('?project=Test&chart=boxplot');
      expect(result).toEqual({
        project: 'Test',
        findingId: null,
        chart: 'boxplot',
        mode: null,
      });
    });

    it('returns nulls for empty search string', () => {
      const result = parseDeepLink('');
      expect(result).toEqual({ project: null, findingId: null, chart: null, mode: null });
    });

    it('returns null chart for invalid chart type', () => {
      const result = parseDeepLink('?project=X&chart=pie');
      expect(result).toEqual({ project: 'X', findingId: null, chart: null, mode: null });
    });

    it('validates all chart types', () => {
      for (const chart of ['ichart', 'boxplot', 'pareto', 'stats']) {
        const result = parseDeepLink(`?chart=${chart}&project=P`);
        expect(result.chart).toBe(chart);
      }
    });

    it('handles URL-encoded project names', () => {
      const result = parseDeepLink('?project=My%20Analysis&finding=f1');
      expect(result.project).toBe('My Analysis');
    });

    it('handles special characters in finding ID', () => {
      const result = parseDeepLink('?project=X&finding=abc-123_def');
      expect(result.findingId).toBe('abc-123_def');
    });
  });

  describe('buildFindingLink', () => {
    it('builds a URL with project and finding params', () => {
      const url = buildFindingLink('https://app.example.com/', 'Analysis1', 'f-001');
      expect(url).toBe('https://app.example.com/?project=Analysis1&finding=f-001');
    });

    it('encodes special characters in project name', () => {
      const url = buildFindingLink('https://app.example.com/', 'My Analysis', 'f1');
      expect(url).toContain('project=My+Analysis');
    });
  });

  describe('buildChartLink', () => {
    it('builds a URL with project and chart params', () => {
      const url = buildChartLink('https://app.example.com/', 'Test', 'ichart');
      expect(url).toBe('https://app.example.com/?project=Test&chart=ichart');
    });
  });

  describe('buildSubPageId', () => {
    it('builds subPageId with finding', () => {
      const id = buildSubPageId('Project', { findingId: 'f1' });
      expect(id).toBe('project=Project&finding=f1');
    });

    it('builds subPageId with chart', () => {
      const id = buildSubPageId('Project', { chart: 'boxplot' });
      expect(id).toBe('project=Project&chart=boxplot');
    });

    it('builds subPageId with project only', () => {
      const id = buildSubPageId('Project', {});
      expect(id).toBe('project=Project');
    });
  });

  describe('parseSubPageId', () => {
    it('round-trips with buildSubPageId for finding', () => {
      const id = buildSubPageId('MyProject', { findingId: 'abc' });
      const parsed = parseSubPageId(id);
      expect(parsed).toEqual({
        project: 'MyProject',
        findingId: 'abc',
        chart: null,
        mode: null,
      });
    });

    it('round-trips with buildSubPageId for chart', () => {
      const id = buildSubPageId('P', { chart: 'pareto' });
      const parsed = parseSubPageId(id);
      expect(parsed).toEqual({
        project: 'P',
        findingId: null,
        chart: 'pareto',
        mode: null,
      });
    });

    it('handles subPageId with leading ?', () => {
      const parsed = parseSubPageId('?project=X&finding=y');
      expect(parsed.project).toBe('X');
      expect(parsed.findingId).toBe('y');
    });

    it('handles subPageId without leading ?', () => {
      const parsed = parseSubPageId('project=X&chart=stats');
      expect(parsed.project).toBe('X');
      expect(parsed.chart).toBe('stats');
    });
  });
});
