import { describe, expect, it } from 'vitest';

import { CANVAS_H, CANVAS_W, HypothesisCard, WallCanvas } from '../../../index';
import type { HypothesisStatus } from '@variscout/core';
import type * as UiPublicApi from '../../../index';

type RemovedExportName = `Wall${'Status'}`;
type RemovedStatusIsNotExported = RemovedExportName extends keyof typeof UiPublicApi ? false : true;

describe('AnalyzeWall public exports', () => {
  it('exposes wall components, constants, and types from @variscout/ui', () => {
    const status: HypothesisStatus = 'needs-disconfirmation';
    const removedStatusIsNotExported: RemovedStatusIsNotExported = true;

    expect(status).toBe('needs-disconfirmation');
    expect(removedStatusIsNotExported).toBe(true);
    expect(WallCanvas).toBeTypeOf('function');
    expect(HypothesisCard).toBeTypeOf('function');
    expect(CANVAS_W).toBeGreaterThan(0);
    expect(CANVAS_H).toBeGreaterThan(0);
  });
});
