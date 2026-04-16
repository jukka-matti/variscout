import { describe, it, expect } from 'vitest';
import { buildPhaseCoaching } from '../prompts/coScout/phases';
import { buildFrameCoaching } from '../prompts/coScout/phases/frame';
import { buildScoutCoaching } from '../prompts/coScout/phases/scout';
import { buildInvestigateCoaching } from '../prompts/coScout/phases/investigate';
import { buildImproveCoaching } from '../prompts/coScout/phases/improve';
import type { AnalysisMode } from '../../types';

const ALL_MODES: AnalysisMode[] = ['standard', 'yamazumi', 'performance', 'defect'];

describe('Phase coaching modules', () => {
  describe('buildFrameCoaching', () => {
    it('mentions "chart" in frame coaching', () => {
      const result = buildFrameCoaching('standard');
      expect(result.toLowerCase()).toContain('chart');
    });

    it('produces non-empty output for all modes', () => {
      for (const mode of ALL_MODES) {
        const result = buildFrameCoaching(mode);
        expect(result.length).toBeGreaterThan(50);
      }
    });

    it('mentions yamazumi-specific terms for yamazumi mode', () => {
      const result = buildFrameCoaching('yamazumi');
      expect(result.toLowerCase()).toContain('takt');
    });

    it('mentions channel for performance mode', () => {
      const result = buildFrameCoaching('performance');
      expect(result.toLowerCase()).toContain('channel');
    });
  });

  describe('buildScoutCoaching', () => {
    it('mentions "drill" and "finding"', () => {
      const result = buildScoutCoaching('standard');
      const lower = result.toLowerCase();
      expect(lower).toContain('drill');
      expect(lower).toContain('finding');
    });

    it('produces non-empty output for all modes', () => {
      for (const mode of ALL_MODES) {
        const result = buildScoutCoaching(mode);
        expect(result.length).toBeGreaterThan(50);
      }
    });

    it('includes entry scenario routing when provided', () => {
      const result = buildScoutCoaching('standard', 'problem');
      expect(result.toLowerCase()).toContain('factor intelligence');
    });

    it('mentions waste for yamazumi mode', () => {
      const result = buildScoutCoaching('yamazumi');
      expect(result.toLowerCase()).toContain('waste');
    });
  });

  describe('buildInvestigateCoaching', () => {
    it('mentions "question" and "evidence"', () => {
      const result = buildInvestigateCoaching('standard');
      const lower = result.toLowerCase();
      expect(lower).toContain('question');
      expect(lower).toContain('evidence');
    });

    it('produces non-empty output for all modes', () => {
      for (const mode of ALL_MODES) {
        const result = buildInvestigateCoaching(mode);
        expect(result.length).toBeGreaterThan(100);
      }
    });

    it('mentions waste for yamazumi mode', () => {
      const result = buildInvestigateCoaching('yamazumi');
      expect(result.toLowerCase()).toContain('waste');
    });

    it('includes sub-phase coaching for diverging', () => {
      const result = buildInvestigateCoaching('standard', 'diverging');
      expect(result.toLowerCase()).toContain('exploring');
    });

    it('includes hub synthesis coaching for validating', () => {
      const result = buildInvestigateCoaching('standard', 'validating');
      expect(result.toLowerCase()).toContain('suggest_suspected_cause');
    });

    it('includes hub synthesis coaching for converging', () => {
      const result = buildInvestigateCoaching('standard', 'converging');
      expect(result.toLowerCase()).toContain('connect_hub_evidence');
    });

    it('includes Evidence Map coaching', () => {
      const result = buildInvestigateCoaching('standard');
      expect(result.toLowerCase()).toContain('evidence map');
      expect(result.toLowerCase()).toContain('causal link');
    });
  });

  describe('buildImproveCoaching', () => {
    it('mentions "improvement"', () => {
      const result = buildImproveCoaching('standard');
      expect(result.toLowerCase()).toContain('improvement');
    });

    it('produces non-empty output for all modes', () => {
      for (const mode of ALL_MODES) {
        const result = buildImproveCoaching(mode);
        expect(result.length).toBeGreaterThan(100);
      }
    });

    it('includes PDCA coaching', () => {
      const result = buildImproveCoaching('standard');
      expect(result).toContain('PDCA');
    });

    it('includes staged verification guidance', () => {
      const result = buildImproveCoaching('standard');
      expect(result.toLowerCase()).toContain('staged');
      expect(result.toLowerCase()).toContain('variation ratio');
    });

    it('includes HMW brainstorm coaching', () => {
      const result = buildImproveCoaching('standard');
      expect(result.toLowerCase()).toContain('ideation direction');
    });

    it('mentions takt for yamazumi mode', () => {
      const result = buildImproveCoaching('yamazumi');
      expect(result.toLowerCase()).toContain('takt');
    });
  });

  describe('buildPhaseCoaching dispatcher', () => {
    it('dispatches to correct phase', () => {
      const frame = buildPhaseCoaching({ phase: 'frame', mode: 'standard' });
      expect(frame).toContain('FRAME');

      const scout = buildPhaseCoaching({ phase: 'scout', mode: 'standard' });
      expect(scout).toContain('SCOUT');

      const investigate = buildPhaseCoaching({ phase: 'investigate', mode: 'standard' });
      expect(investigate).toContain('INVESTIGATE');

      const improve = buildPhaseCoaching({ phase: 'improve', mode: 'standard' });
      expect(improve).toContain('IMPROVE');
    });

    it('passes investigationPhase to investigate coaching', () => {
      const result = buildPhaseCoaching({
        phase: 'investigate',
        mode: 'standard',
        investigationPhase: 'validating',
      });
      expect(result).toContain('suggest_suspected_cause');
    });

    it('passes entryScenario to scout coaching', () => {
      const result = buildPhaseCoaching({
        phase: 'scout',
        mode: 'standard',
        entryScenario: 'routine',
      });
      expect(result.toLowerCase()).toContain('scanning');
    });
  });

  describe('no dynamic stats values', () => {
    it('does not contain specific numeric stat values', () => {
      for (const phase of ['frame', 'scout', 'investigate', 'improve'] as const) {
        for (const mode of ALL_MODES) {
          const result = buildPhaseCoaching({ phase, mode });
          // Should not contain dynamically computed values like "Cpk = 1.23" or "eta-squared = 0.42"
          // But may contain thresholds like "15%", "1.33", "0.8" which are static guidance
          expect(result).not.toMatch(/samples?:\s*\d+/i);
          expect(result).not.toMatch(/current Cpk:\s*\d+\.\d+/i);
          expect(result).not.toMatch(/mean:\s*\d+\.\d+/i);
        }
      }
    });
  });
});
