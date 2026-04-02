import { describe, it, expect } from 'vitest';
import {
  parseDeepLink,
  buildFindingLink,
  buildChartLink,
  buildSubPageId,
  parseSubPageId,
  buildProjectLink,
  buildQuestionLink,
  buildImprovementLink,
  buildOverviewLink,
  validateDeepLink,
} from '../deepLinks';

describe('deepLinks', () => {
  describe('parseDeepLink', () => {
    it('parses project + finding params', () => {
      const result = parseDeepLink('?project=MyAnalysis&finding=abc123');
      expect(result).toEqual({
        project: 'MyAnalysis',
        findingId: 'abc123',
        questionId: null,
        chart: null,
        mode: null,
        tab: null,
      });
    });

    it('parses project + chart params', () => {
      const result = parseDeepLink('?project=Test&chart=boxplot');
      expect(result).toEqual({
        project: 'Test',
        findingId: null,
        questionId: null,
        chart: 'boxplot',
        mode: null,
        tab: null,
      });
    });

    it('returns nulls for empty search string', () => {
      const result = parseDeepLink('');
      expect(result).toEqual({
        project: null,
        findingId: null,
        questionId: null,
        chart: null,
        mode: null,
        tab: null,
      });
    });

    it('returns null chart for invalid chart type', () => {
      const result = parseDeepLink('?project=X&chart=pie');
      expect(result).toEqual({
        project: 'X',
        findingId: null,
        questionId: null,
        chart: null,
        mode: null,
        tab: null,
      });
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

    it('parses question param', () => {
      const result = parseDeepLink('?project=P&question=abc123');
      expect(result.questionId).toBe('abc123');
      expect(result.findingId).toBeNull();
    });

    it('parses mode=improvement', () => {
      const result = parseDeepLink('?project=P&mode=improvement');
      expect(result.mode).toBe('improvement');
    });

    it('parses mode=report', () => {
      const result = parseDeepLink('?project=P&mode=report');
      expect(result.mode).toBe('report');
    });

    it('parses tab=overview', () => {
      const result = parseDeepLink('?project=P&tab=overview');
      expect(result.tab).toBe('overview');
    });

    it('returns null tab for invalid tab value', () => {
      const result = parseDeepLink('?project=P&tab=dashboard');
      expect(result.tab).toBeNull();
    });

    it('does not parse tab=overview as view param (no collision with popout routing)', () => {
      // tab= and view= are separate params; tab=overview must not set any view-related field
      const result = parseDeepLink('?project=P&tab=overview');
      expect(result.tab).toBe('overview');
      // Confirm there is no 'view' field on the result
      expect('view' in result).toBe(false);
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

  describe('buildProjectLink', () => {
    it('builds a URL with only the project param', () => {
      const url = buildProjectLink('https://app.example.com/', 'proj-001');
      expect(url).toBe('https://app.example.com/?project=proj-001');
    });

    it('does not add finding, chart, mode, or tab params', () => {
      const url = buildProjectLink('https://app.example.com/', 'proj-001');
      const parsed = new URL(url);
      expect(parsed.searchParams.get('finding')).toBeNull();
      expect(parsed.searchParams.get('chart')).toBeNull();
      expect(parsed.searchParams.get('mode')).toBeNull();
      expect(parsed.searchParams.get('tab')).toBeNull();
    });
  });

  describe('buildQuestionLink', () => {
    it('builds a URL with project and question params', () => {
      const url = buildQuestionLink('https://app.example.com/', 'proj-001', 'q-42');
      expect(url).toBe('https://app.example.com/?project=proj-001&question=q-42');
    });

    it('does not include view param', () => {
      const url = buildQuestionLink('https://app.example.com/', 'p', 'q');
      expect(url).not.toContain('view=');
    });
  });

  describe('buildImprovementLink', () => {
    it('builds a URL with project and mode=improvement', () => {
      const url = buildImprovementLink('https://app.example.com/', 'proj-001');
      expect(url).toBe('https://app.example.com/?project=proj-001&mode=improvement');
    });
  });

  describe('buildOverviewLink', () => {
    it('uses tab=overview, not view=overview', () => {
      const url = buildOverviewLink('https://app.example.com/', 'proj-001');
      expect(url).toContain('tab=overview');
      expect(url).not.toContain('view=overview');
    });

    it('builds a URL with project and tab=overview', () => {
      const url = buildOverviewLink('https://app.example.com/', 'proj-001');
      expect(url).toBe('https://app.example.com/?project=proj-001&tab=overview');
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

    it('builds subPageId with question', () => {
      const id = buildSubPageId('Project', { questionId: 'q-99' });
      expect(id).toBe('project=Project&question=q-99');
    });

    it('builds subPageId with mode=improvement', () => {
      const id = buildSubPageId('Project', { mode: 'improvement' });
      expect(id).toBe('project=Project&mode=improvement');
    });

    it('builds subPageId with tab=overview', () => {
      const id = buildSubPageId('Project', { tab: 'overview' });
      expect(id).toBe('project=Project&tab=overview');
    });
  });

  describe('parseSubPageId', () => {
    it('round-trips with buildSubPageId for finding', () => {
      const id = buildSubPageId('MyProject', { findingId: 'abc' });
      const parsed = parseSubPageId(id);
      expect(parsed).toEqual({
        project: 'MyProject',
        findingId: 'abc',
        questionId: null,
        chart: null,
        mode: null,
        tab: null,
      });
    });

    it('round-trips with buildSubPageId for chart', () => {
      const id = buildSubPageId('P', { chart: 'pareto' });
      const parsed = parseSubPageId(id);
      expect(parsed).toEqual({
        project: 'P',
        findingId: null,
        questionId: null,
        chart: 'pareto',
        mode: null,
        tab: null,
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

    it('round-trips with buildSubPageId for question', () => {
      const id = buildSubPageId('Proj', { questionId: 'q-7' });
      const parsed = parseSubPageId(id);
      expect(parsed.questionId).toBe('q-7');
      expect(parsed.findingId).toBeNull();
    });

    it('round-trips with buildSubPageId for mode=improvement', () => {
      const id = buildSubPageId('Proj', { mode: 'improvement' });
      const parsed = parseSubPageId(id);
      expect(parsed.mode).toBe('improvement');
    });

    it('round-trips with buildSubPageId for tab=overview', () => {
      const id = buildSubPageId('Proj', { tab: 'overview' });
      const parsed = parseSubPageId(id);
      expect(parsed.tab).toBe('overview');
    });
  });

  describe('validateDeepLink', () => {
    const existingProjects = new Set(['proj-001', 'proj-002']);
    const projectExists = (id: string) => existingProjects.has(id);

    it('returns valid when params have no project', () => {
      const result = validateDeepLink(
        { project: null, findingId: null, questionId: null, chart: null, mode: null, tab: null },
        projectExists,
        false
      );
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid when project exists (Team plan)', () => {
      const result = validateDeepLink(
        {
          project: 'proj-001',
          findingId: null,
          questionId: null,
          chart: null,
          mode: null,
          tab: null,
        },
        projectExists,
        false
      );
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid when project exists (Standard plan)', () => {
      const result = validateDeepLink(
        {
          project: 'proj-002',
          findingId: null,
          questionId: null,
          chart: null,
          mode: null,
          tab: null,
        },
        projectExists,
        true
      );
      expect(result.valid).toBe(true);
    });

    it('returns project-not-found with Team plan error message when project missing on Team plan', () => {
      const result = validateDeepLink(
        {
          project: 'proj-missing',
          findingId: null,
          questionId: null,
          chart: null,
          mode: null,
          tab: null,
        },
        projectExists,
        false
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('project-not-found');
      expect(result.errorMessage).toBe('This project may have been moved or deleted.');
    });

    it('returns project-not-found with Standard plan error message when project missing on Standard plan', () => {
      const result = validateDeepLink(
        {
          project: 'proj-missing',
          findingId: null,
          questionId: null,
          chart: null,
          mode: null,
          tab: null,
        },
        projectExists,
        true
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('project-not-found');
      expect(result.errorMessage).toBe(
        'This project was not found locally. Standard plan projects are stored on this device only — Team plan enables shared access.'
      );
    });
  });
});
