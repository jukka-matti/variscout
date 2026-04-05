import { describe, it, expect } from 'vitest';
import { buildModeWorkflow } from '../prompts/coScout/modes';
import { buildStandardWorkflow } from '../prompts/coScout/modes/standard';
import { buildCapabilityWorkflow } from '../prompts/coScout/modes/capability';
import { buildPerformanceWorkflow } from '../prompts/coScout/modes/performance';
import { buildYamazumiWorkflow } from '../prompts/coScout/modes/yamazumi';
import type { JourneyPhase } from '../types';

const ALL_PHASES: JourneyPhase[] = ['frame', 'scout', 'investigate', 'improve'];

describe('Mode coaching modules', () => {
  describe('buildStandardWorkflow', () => {
    it('uses SPC terminology: Cpk and control limit', () => {
      const result = buildStandardWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('cpk');
      expect(lower).toContain('control limit');
    });

    it('uses eta-squared and R-squared-adj', () => {
      const result = buildStandardWorkflow('scout');
      const lower = result.toLowerCase();
      expect(lower).toContain('eta-squared');
      expect(lower).toContain('r-squared-adj');
    });

    it('produces non-empty output for each phase', () => {
      for (const phase of ALL_PHASES) {
        const result = buildStandardWorkflow(phase);
        expect(result.length).toBeGreaterThan(100);
      }
    });

    it('does not contain dynamic stats values', () => {
      for (const phase of ALL_PHASES) {
        const result = buildStandardWorkflow(phase);
        // Should not contain specific numeric values from runtime data
        expect(result).not.toMatch(/\d+\.\d{3,}/); // no high-precision floats
      }
    });
  });

  describe('buildCapabilityWorkflow', () => {
    it('uses centering and spread terminology', () => {
      const result = buildCapabilityWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('centering');
      expect(lower).toContain('spread');
    });

    it('discusses Cpk vs Cp interpretation', () => {
      const result = buildCapabilityWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('cpk');
      expect(lower).toContain('cp');
    });

    it('covers subgroup stability', () => {
      const result = buildCapabilityWorkflow('scout');
      const lower = result.toLowerCase();
      expect(lower).toContain('subgroup');
    });

    it('advises when to investigate shifts vs consistency', () => {
      const result = buildCapabilityWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('shift');
    });

    it('produces non-empty output for each phase', () => {
      for (const phase of ALL_PHASES) {
        const result = buildCapabilityWorkflow(phase);
        expect(result.length).toBeGreaterThan(100);
      }
    });

    it('does not contain dynamic stats values', () => {
      for (const phase of ALL_PHASES) {
        const result = buildCapabilityWorkflow(phase);
        expect(result).not.toMatch(/\d+\.\d{3,}/);
      }
    });
  });

  describe('buildPerformanceWorkflow', () => {
    it('uses channel terminology', () => {
      const result = buildPerformanceWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('channel');
    });

    it('mentions worst-channel Cpk', () => {
      const result = buildPerformanceWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('worst-channel');
    });

    it('covers cross-channel correlation', () => {
      const result = buildPerformanceWorkflow('scout');
      const lower = result.toLowerCase();
      expect(lower).toContain('cross-channel');
    });

    it('mentions equipment-specific investigation', () => {
      const result = buildPerformanceWorkflow('investigate');
      const lower = result.toLowerCase();
      expect(lower).toContain('equipment');
    });

    it('produces non-empty output for each phase', () => {
      for (const phase of ALL_PHASES) {
        const result = buildPerformanceWorkflow(phase);
        expect(result.length).toBeGreaterThan(100);
      }
    });

    it('does not contain dynamic stats values', () => {
      for (const phase of ALL_PHASES) {
        const result = buildPerformanceWorkflow(phase);
        expect(result).not.toMatch(/\d+\.\d{3,}/);
      }
    });
  });

  describe('buildYamazumiWorkflow', () => {
    it('uses takt and waste terminology', () => {
      const result = buildYamazumiWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('takt');
      expect(lower).toContain('waste');
    });

    it('uses VA ratio terminology', () => {
      const result = buildYamazumiWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('va ratio');
    });

    it('does NOT use SPC terms as positive analysis instructions', () => {
      for (const phase of ALL_PHASES) {
        const result = buildYamazumiWorkflow(phase);
        // Yamazumi may reference SPC terms negatively ("Never use Cpk") or as
        // cross-references ("lean counterpart to Cpk"), but should never use
        // them as positive diagnostic instructions.
        // Strip the "Never use..." and "counterpart to..." lines, then check remainder
        const stripped = result
          .split('\n')
          .filter(line => !line.includes('Never use') && !line.includes('counterpart to'))
          .join('\n');
        expect(stripped).not.toMatch(/\bCpk\b/);
        expect(stripped.toLowerCase()).not.toContain('nelson rule');
        expect(stripped.toLowerCase()).not.toContain('specification limit');
      }
    });

    it('explicitly tells CoScout not to use SPC terminology', () => {
      const result = buildYamazumiWorkflow('frame');
      const lower = result.toLowerCase();
      expect(lower).toContain('never use cpk');
    });

    it('covers waste classification (VA, NVA Required, Waste, Wait)', () => {
      const result = buildYamazumiWorkflow('frame');
      expect(result).toContain('VA');
      expect(result).toContain('NVA Required');
      expect(result).toContain('Waste');
      expect(result).toContain('Wait');
    });

    it('mentions kaizen in improve phase', () => {
      const result = buildYamazumiWorkflow('improve');
      const lower = result.toLowerCase();
      expect(lower).toContain('kaizen');
    });

    it('produces non-empty output for each phase', () => {
      for (const phase of ALL_PHASES) {
        const result = buildYamazumiWorkflow(phase);
        expect(result.length).toBeGreaterThan(100);
      }
    });

    it('does not contain dynamic stats values', () => {
      for (const phase of ALL_PHASES) {
        const result = buildYamazumiWorkflow(phase);
        expect(result).not.toMatch(/\d+\.\d{3,}/);
      }
    });
  });

  describe('buildModeWorkflow dispatcher', () => {
    it('dispatches standard mode correctly', () => {
      const result = buildModeWorkflow('standard', 'frame');
      expect(result).toContain('Standard');
      expect(result.toLowerCase()).toContain('cpk');
    });

    it('dispatches performance mode correctly', () => {
      const result = buildModeWorkflow('performance', 'frame');
      expect(result).toContain('Multi-Channel');
      expect(result.toLowerCase()).toContain('channel');
    });

    it('dispatches yamazumi mode correctly', () => {
      const result = buildModeWorkflow('yamazumi', 'frame');
      expect(result).toContain('Yamazumi');
      expect(result.toLowerCase()).toContain('takt');
    });

    it('produces non-empty output for all mode x phase combinations', () => {
      const modes = ['standard', 'performance', 'yamazumi'] as const;
      for (const mode of modes) {
        for (const phase of ALL_PHASES) {
          const result = buildModeWorkflow(mode, phase);
          expect(result.length).toBeGreaterThan(100);
        }
      }
    });
  });
});
