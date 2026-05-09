import { describe, expect, it } from 'vitest';

import {
  CANVAS_H,
  CANVAS_W,
  HypothesisCard,
  WallCanvas,
  WALL_MOBILE_BREAKPOINT,
  useWallIsMobile,
} from '../../../index';
import type { WallStatus } from '../../../index';

describe('InvestigationWall public exports', () => {
  it('exposes wall components, hooks, constants, and types from @variscout/ui', () => {
    const status: WallStatus = 'proposed';

    expect(status).toBe('proposed');
    expect(WallCanvas).toBeTypeOf('function');
    expect(HypothesisCard).toBeTypeOf('function');
    expect(useWallIsMobile).toBeTypeOf('function');
    expect(WALL_MOBILE_BREAKPOINT).toBe(768);
    expect(CANVAS_W).toBeGreaterThan(0);
    expect(CANVAS_H).toBeGreaterThan(0);
  });
});
