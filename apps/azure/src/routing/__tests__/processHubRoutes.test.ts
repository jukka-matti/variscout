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
      kind: 'open-investigation',
      investigationId: 'inv-123',
      intent: 'focused',
    };
    expect(actionToHref(action)).toBe('/editor/inv-123?intent=focused');
  });

  it('builds /editor/:id?intent=chartered for open-investigation/chartered', () => {
    const action: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-abc',
      intent: 'chartered',
    };
    expect(actionToHref(action)).toBe('/editor/inv-abc?intent=chartered');
  });

  it('builds /editor/:id?intent=quick for open-investigation/quick', () => {
    const action: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-q',
      intent: 'quick',
    };
    expect(actionToHref(action)).toBe('/editor/inv-q?intent=quick');
  });

  it('builds /editor/:id/sustainment for open-sustainment/review', () => {
    const action: ResponsePathAction = {
      kind: 'open-sustainment',
      investigationId: 'inv-s',
      surface: 'review',
    };
    expect(actionToHref(action)).toBe('/editor/inv-s/sustainment');
  });

  it('builds /editor/:id/sustainment?surface=handoff for open-sustainment/handoff', () => {
    const action: ResponsePathAction = {
      kind: 'open-sustainment',
      investigationId: 'inv-h',
      surface: 'handoff',
    };
    expect(actionToHref(action)).toBe('/editor/inv-h/sustainment?surface=handoff');
  });

  it('snapshot — URL shapes are stable', () => {
    expect({
      focused: actionToHref({
        kind: 'open-investigation',
        investigationId: 'X',
        intent: 'focused',
      }),
      chartered: actionToHref({
        kind: 'open-investigation',
        investigationId: 'X',
        intent: 'chartered',
      }),
      quick: actionToHref({ kind: 'open-investigation', investigationId: 'X', intent: 'quick' }),
      sustainmentReview: actionToHref({
        kind: 'open-sustainment',
        investigationId: 'X',
        surface: 'review',
      }),
      sustainmentHandoff: actionToHref({
        kind: 'open-sustainment',
        investigationId: 'X',
        surface: 'handoff',
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
