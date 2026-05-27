import { describe, expect, it } from 'vitest';
import type { ResponsePathAction } from '@variscout/core';
import { actionToHref } from '../processHubRoutes';

describe('actionToHref', () => {
  it('returns null for unsupported actions', () => {
    const action: ResponsePathAction = { kind: 'unsupported', reason: 'planned' };
    expect(actionToHref(action)).toBeNull();
  });

  it('returns null for unsupported/informational', () => {
    const action: ResponsePathAction = { kind: 'unsupported', reason: 'informational' };
    expect(actionToHref(action)).toBeNull();
  });

  it('builds /editor/:id?intent=focused for open-investigation/focused', () => {
    const action: ResponsePathAction = {
      kind: 'open-analyze',
      analyzeId: 'inv-123',
      intent: 'focused',
    };
    expect(actionToHref(action)).toBe('/editor/inv-123?intent=focused');
  });

  it('builds /editor/:id?intent=chartered for open-investigation/chartered', () => {
    const action: ResponsePathAction = {
      kind: 'open-analyze',
      analyzeId: 'inv-abc',
      intent: 'chartered',
    };
    expect(actionToHref(action)).toBe('/editor/inv-abc?intent=chartered');
  });

  it('builds /editor/:id?intent=quick for open-investigation/quick', () => {
    const action: ResponsePathAction = {
      kind: 'open-analyze',
      analyzeId: 'inv-q',
      intent: 'quick',
    };
    expect(actionToHref(action)).toBe('/editor/inv-q?intent=quick');
  });

  it('builds /editor/:id/sustainment for open-sustainment', () => {
    const action: ResponsePathAction = {
      kind: 'open-control',
      analyzeId: 'inv-s',
    };
    expect(actionToHref(action)).toBe('/editor/inv-s/sustainment');
  });

  it('snapshot — URL shapes are stable', () => {
    expect({
      focused: actionToHref({
        kind: 'open-analyze',
        analyzeId: 'X',
        intent: 'focused',
      }),
      chartered: actionToHref({
        kind: 'open-analyze',
        analyzeId: 'X',
        intent: 'chartered',
      }),
      quick: actionToHref({ kind: 'open-analyze', analyzeId: 'X', intent: 'quick' }),
      sustainment: actionToHref({
        kind: 'open-control',
        analyzeId: 'X',
      }),
      unsupportedPlanned: actionToHref({ kind: 'unsupported', reason: 'planned' }),
      unsupportedInfo: actionToHref({ kind: 'unsupported', reason: 'informational' }),
    }).toMatchSnapshot();
  });

  it('exhaustive switch — adding a new ResponsePathAction kind without a case is a compile error', () => {
    // @ts-expect-error — if this stops erroring, a new ResponsePathAction kind
    // was added in @variscout/core without a matching case in actionToHref.
    expect(() => actionToHref({ kind: 'not-a-real-kind' } as ResponsePathAction)).toThrow();
  });
});
