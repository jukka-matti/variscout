import { describe, it, expect } from 'vitest';
import {
  canvasLevelToProcessLevel,
  processLevelToCanvasLevel,
  type ProcessLevel,
} from '../processLevel';
import type { CanvasLevel } from '../viewport';

/**
 * ProcessLevel ↔ CanvasLevel mapping (ADR-088 #1).
 *
 * Thin naming/routing alias — Outcome/Flow/Local (Y/X/x) onto l1/l2/l3.
 * No store, no state machine. Pure bijection.
 */
describe('canvasLevelToProcessLevel', () => {
  it('maps l1 → Outcome (Y)', () => {
    expect(canvasLevelToProcessLevel('l1')).toBe('Outcome');
  });

  it('maps l2 → Flow (X)', () => {
    expect(canvasLevelToProcessLevel('l2')).toBe('Flow');
  });

  it('maps l3 → Local (x)', () => {
    expect(canvasLevelToProcessLevel('l3')).toBe('Local');
  });
});

describe('processLevelToCanvasLevel', () => {
  it('maps Outcome → l1', () => {
    expect(processLevelToCanvasLevel('Outcome')).toBe('l1');
  });

  it('maps Flow → l2', () => {
    expect(processLevelToCanvasLevel('Flow')).toBe('l2');
  });

  it('maps Local → l3', () => {
    expect(processLevelToCanvasLevel('Local')).toBe('l3');
  });
});

describe('ProcessLevel ↔ CanvasLevel is a bijection', () => {
  const canvasLevels: CanvasLevel[] = ['l1', 'l2', 'l3'];
  const processLevels: ProcessLevel[] = ['Outcome', 'Flow', 'Local'];

  it('round-trips every CanvasLevel back to itself', () => {
    for (const level of canvasLevels) {
      expect(processLevelToCanvasLevel(canvasLevelToProcessLevel(level))).toBe(level);
    }
  });

  it('round-trips every ProcessLevel back to itself', () => {
    for (const level of processLevels) {
      expect(canvasLevelToProcessLevel(processLevelToCanvasLevel(level))).toBe(level);
    }
  });
});
