import { describe, it, expect } from 'vitest';
import { computeCtaState, type ResponsePathKind } from '../responsePathCta';

const ALL_PATHS: ResponsePathKind[] = ['quick-action', 'focused-investigation', 'charter'];

describe('computeCtaState — all canvas response paths are always-available', () => {
  for (const path of ALL_PATHS) {
    it(`${path} is active when handler wired`, () => {
      expect(computeCtaState({ path, hasHandler: true })).toEqual({ kind: 'active' });
    });

    it(`${path} is hidden when no handler is wired`, () => {
      expect(computeCtaState({ path, hasHandler: false })).toEqual({ kind: 'hidden' });
    });
  }
});
