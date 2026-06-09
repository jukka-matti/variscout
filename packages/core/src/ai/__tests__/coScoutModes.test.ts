import { describe, it, expect } from 'vitest';
import { buildModeWorkflow } from '../prompts/coScout/modes';
import { buildStandardWorkflow } from '../prompts/coScout/modes/standard';
import { buildCapabilityWorkflow } from '../prompts/coScout/modes/capability';
import { buildPerformanceWorkflow } from '../prompts/coScout/modes/performance';
import { buildDefectWorkflow } from '../prompts/coScout/modes/defect';
import type { CoScoutSurface } from '../prompts/coScout';

const NON_ANALYZE_SURFACES: CoScoutSurface[] = ['process', 'explore', 'report'];
const RETIRED_PHASE_LABELS = /\b(FRAME|SCOUT|INVESTIGATE|IMPROVE)\s+phase\b/i;

function expectAnalyzeWorkflow(result: string): void {
  expect(result.length).toBeGreaterThan(100);
  expect(result).not.toMatch(RETIRED_PHASE_LABELS);
  expect(result).not.toMatch(/\d+\.\d{3,}/);
}

describe('Mode coaching modules', () => {
  describe('buildStandardWorkflow', () => {
    it('uses SPC terminology only on the Analyze surface', () => {
      const result = buildStandardWorkflow('analyze');
      const lower = result.toLowerCase();
      expect(lower).toContain('cpk');
      expect(lower).toContain('control limit');
      expect(lower).toContain('eta-squared');
      expect(lower).toContain('r-squared-adj');
      expectAnalyzeWorkflow(result);
    });
  });

  describe('buildCapabilityWorkflow', () => {
    it('uses capability diagnostics only on the Analyze surface', () => {
      const result = buildCapabilityWorkflow('analyze');
      const lower = result.toLowerCase();
      expect(lower).toContain('centering');
      expect(lower).toContain('spread');
      expect(lower).toContain('cpk');
      expect(lower).toContain('subgroup');
      expectAnalyzeWorkflow(result);
    });
  });

  describe('buildPerformanceWorkflow', () => {
    it('uses channel terminology only on the Analyze surface', () => {
      const result = buildPerformanceWorkflow('analyze');
      const lower = result.toLowerCase();
      expect(lower).toContain('channel');
      expect(lower).toContain('worst-channel');
      expect(lower).toContain('cross-channel');
      expectAnalyzeWorkflow(result);
    });
  });

  describe('buildDefectWorkflow', () => {
    it('uses defect terminology only on the Analyze surface', () => {
      const result = buildDefectWorkflow('analyze');
      const lower = result.toLowerCase();
      expect(lower).toContain('defect rate');
      expect(lower).toContain('pareto');
      expect(lower).not.toContain('cpk');
      expectAnalyzeWorkflow(result);
    });
  });

  describe('buildModeWorkflow dispatcher', () => {
    it('returns no mode workflow outside the Analyze surface', () => {
      for (const surface of NON_ANALYZE_SURFACES) {
        expect(buildModeWorkflow('standard', surface)).toBe('');
        expect(buildModeWorkflow('performance', surface)).toBe('');
        expect(buildModeWorkflow('defect', surface)).toBe('');
      }
    });

    it('dispatches all Analyze-surface modes correctly', () => {
      expect(buildModeWorkflow('standard', 'analyze')).toContain('Standard');
      expect(buildModeWorkflow('performance', 'analyze')).toContain('Multi-Channel');
      expect(buildModeWorkflow('defect', 'analyze')).toContain('Defect Analysis Mode');
    });
  });
});
