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

  it('maps quick-action to open-analyze/quick using defaultAnalyzeId', () => {
    const action = deriveResponsePathAction(baseItem({ responsePath: 'quick-action' }), DEFAULT_ID);
    expect(action).toEqual({
      kind: 'open-analyze',
      analyzeId: DEFAULT_ID,
      intent: 'quick',
    });
  });

  it('maps focused-analyze to open-analyze/focused', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'focused-analyze' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-analyze',
      analyzeId: DEFAULT_ID,
      intent: 'focused',
    });
  });

  it('maps chartered-project to open-analyze/chartered', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'chartered-project' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-analyze',
      analyzeId: DEFAULT_ID,
      intent: 'chartered',
    });
  });

  it('maps control-review to open-control', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'control-review' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-control',
      analyzeId: DEFAULT_ID,
    });
  });

  it('uses item.analyzeIds[0] when present (queue items)', () => {
    const action = deriveResponsePathAction(
      baseItem({
        responsePath: 'focused-analyze',
        analyzeIds: ['inv-from-item', 'inv-other'],
      }),
      DEFAULT_ID
    );
    expect(action).toMatchObject({ kind: 'open-analyze', analyzeId: 'inv-from-item' });
  });

  it('falls back to defaultAnalyzeId when item.analyzeIds is empty', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'focused-analyze', analyzeIds: [] }),
      DEFAULT_ID
    );
    expect(action).toMatchObject({ kind: 'open-analyze', analyzeId: DEFAULT_ID });
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
