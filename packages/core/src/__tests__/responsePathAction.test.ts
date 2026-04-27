import { describe, expect, it } from 'vitest';
import type { ProcessStateItem } from '../processState';
import { deriveResponsePathAction } from '../responsePathAction';

const baseItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Item label',
  ...overrides,
});

const DEFAULT_ID = 'inv-default';

describe('deriveResponsePathAction', () => {
  it('returns unsupported/informational for monitor', () => {
    const action = deriveResponsePathAction(baseItem({ responsePath: 'monitor' }), DEFAULT_ID);
    expect(action).toEqual({ kind: 'unsupported', reason: 'informational' });
  });

  it('returns unsupported/planned for measurement-system-work', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'measurement-system-work' }),
      DEFAULT_ID
    );
    expect(action).toEqual({ kind: 'unsupported', reason: 'planned' });
  });

  it('maps quick-action to open-investigation/quick using defaultInvestigationId', () => {
    const action = deriveResponsePathAction(baseItem({ responsePath: 'quick-action' }), DEFAULT_ID);
    expect(action).toEqual({
      kind: 'open-investigation',
      investigationId: DEFAULT_ID,
      intent: 'quick',
    });
  });

  it('maps focused-investigation to open-investigation/focused', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'focused-investigation' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-investigation',
      investigationId: DEFAULT_ID,
      intent: 'focused',
    });
  });

  it('maps chartered-project to open-investigation/chartered', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'chartered-project' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-investigation',
      investigationId: DEFAULT_ID,
      intent: 'chartered',
    });
  });

  it('maps sustainment-review to open-sustainment/review', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'sustainment-review' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-sustainment',
      investigationId: DEFAULT_ID,
      surface: 'review',
    });
  });

  it('maps control-handoff to open-sustainment/handoff', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'control-handoff' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-sustainment',
      investigationId: DEFAULT_ID,
      surface: 'handoff',
    });
  });

  it('uses item.investigationIds[0] when present (queue items)', () => {
    const action = deriveResponsePathAction(
      baseItem({
        responsePath: 'focused-investigation',
        investigationIds: ['inv-from-item', 'inv-other'],
      }),
      DEFAULT_ID
    );
    expect(action).toMatchObject({ kind: 'open-investigation', investigationId: 'inv-from-item' });
  });

  it('falls back to defaultInvestigationId when item.investigationIds is empty', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'focused-investigation', investigationIds: [] }),
      DEFAULT_ID
    );
    expect(action).toMatchObject({ kind: 'open-investigation', investigationId: DEFAULT_ID });
  });

  it('exhaustive switch — adding a new ProcessStateResponsePath without a case is a compile error', () => {
    // The @ts-expect-error below asserts that passing a plain string (not a valid
    // ProcessStateResponsePath) to deriveResponsePathAction is a type error.
    // If this directive becomes "unused" (i.e. tsc stops erroring here), it means
    // the function's signature was widened unexpectedly — investigate before suppressing.
    // At runtime the invalid value hits assertNever and throws — that is expected behaviour.
    expect(() =>
      // @ts-expect-error — 'not-a-real-response-path' is not assignable to ProcessStateResponsePath
      deriveResponsePathAction(baseItem({ responsePath: 'not-a-real-response-path' }), DEFAULT_ID)
    ).toThrow();
  });
});
