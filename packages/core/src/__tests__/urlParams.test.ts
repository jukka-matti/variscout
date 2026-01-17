import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { filtersToSearchParams, searchParamsToFilters, buildShareableUrl } from '../urlParams';

describe('urlParams', () => {
  describe('filtersToSearchParams', () => {
    it('converts single filter to search params', () => {
      const filters = { Machine: ['A', 'B'] };
      const params = filtersToSearchParams(filters);

      expect(params.getAll('filter')).toEqual(['Machine:A,B']);
    });

    it('converts multiple filters to search params', () => {
      const filters = { Machine: ['A'], Shift: ['Day', 'Night'] };
      const params = filtersToSearchParams(filters);

      const filterParams = params.getAll('filter');
      expect(filterParams).toHaveLength(2);
      expect(filterParams).toContain('Machine:A');
      expect(filterParams).toContain('Shift:Day,Night');
    });

    it('handles empty filters', () => {
      const filters = {};
      const params = filtersToSearchParams(filters);

      expect(params.getAll('filter')).toEqual([]);
    });

    it('skips empty value arrays', () => {
      const filters = { Machine: ['A'], Shift: [] };
      const params = filtersToSearchParams(filters);

      expect(params.getAll('filter')).toEqual(['Machine:A']);
    });

    it('encodes special characters', () => {
      const filters = { 'Factor Name': ['Value/With/Slashes', 'Value&Amp'] };
      const params = filtersToSearchParams(filters);

      const filterStr = params.getAll('filter')[0];
      // Should be URL-encoded
      expect(filterStr).toContain('Factor%20Name');
      expect(filterStr).toContain('Value%2FWith%2FSlashes');
      expect(filterStr).toContain('Value%26Amp');
    });

    it('handles numeric values', () => {
      const filters = { Year: [2023, 2024] };
      const params = filtersToSearchParams(filters);

      expect(params.getAll('filter')).toEqual(['Year:2023,2024']);
    });
  });

  describe('searchParamsToFilters', () => {
    it('parses single filter from params', () => {
      const params = new URLSearchParams('filter=Machine:A,B');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({ Machine: ['A', 'B'] });
    });

    it('parses multiple filters from params', () => {
      const params = new URLSearchParams('filter=Machine:A&filter=Shift:Day,Night');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({
        Machine: ['A'],
        Shift: ['Day', 'Night'],
      });
    });

    it('handles empty params', () => {
      const params = new URLSearchParams('');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({});
    });

    it('decodes special characters', () => {
      const params = new URLSearchParams('filter=Factor%20Name:Value%2FWith%2FSlashes,Value%26Amp');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({
        'Factor Name': ['Value/With/Slashes', 'Value&Amp'],
      });
    });

    it('ignores malformed filter params (no colon)', () => {
      const params = new URLSearchParams('filter=NoColon&filter=Valid:A');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({ Valid: ['A'] });
    });

    it('handles empty values after colon', () => {
      const params = new URLSearchParams('filter=Empty:');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({});
    });

    it('handles colon in value', () => {
      const params = new URLSearchParams('filter=Time:10:30,11:45');
      const filters = searchParamsToFilters(params);

      expect(filters).toEqual({
        Time: ['10:30', '11:45'],
      });
    });
  });

  describe('round-trip serialization', () => {
    it('preserves filters through serialize/parse cycle', () => {
      const original = {
        Machine: ['A', 'B', 'C'],
        Shift: ['Day'],
        Operator: ['John Doe', 'Jane Smith'],
      };

      const params = filtersToSearchParams(original);
      const parsed = searchParamsToFilters(params);

      expect(parsed).toEqual(original);
    });

    it('preserves special characters through round-trip', () => {
      const original = {
        'Factor/Name': ['Value & Special', 'Another=Value'],
      };

      const params = filtersToSearchParams(original);
      const parsed = searchParamsToFilters(params);

      expect(parsed).toEqual(original);
    });

    it('handles unicode characters', () => {
      const original = {
        Machine: ['Máquina 1', '机器2', 'מכונה'],
      };

      const params = filtersToSearchParams(original);
      const parsed = searchParamsToFilters(params);

      expect(parsed).toEqual(original);
    });
  });

  describe('buildShareableUrl', () => {
    it('builds URL with filters', () => {
      const url = buildShareableUrl('https://variscout.app/', { Machine: ['A'] });

      expect(url).toBe('https://variscout.app/?filter=Machine%3AA');
    });

    it('preserves existing non-filter params', () => {
      const url = buildShareableUrl('https://variscout.app/?sample=coffee', { Machine: ['A'] });

      expect(url).toContain('sample=coffee');
      expect(url).toContain('filter=Machine%3AA');
    });

    it('replaces existing filter params', () => {
      const url = buildShareableUrl('https://variscout.app/?filter=Old:Value', { Machine: ['A'] });

      expect(url).not.toContain('Old');
      expect(url).toContain('filter=Machine%3AA');
    });

    it('handles empty filters', () => {
      const url = buildShareableUrl('https://variscout.app/?sample=coffee', {});

      expect(url).toBe('https://variscout.app/?sample=coffee');
    });

    it('handles URL with hash', () => {
      const url = buildShareableUrl('https://variscout.app/#/dashboard', { Machine: ['A'] });

      expect(url).toContain('filter=Machine%3AA');
      expect(url).toContain('#/dashboard');
    });
  });
});
