import { describe, it, expect } from 'vitest';
import {
  parseActionMarkers,
  stripActionMarkers,
  computeFilterPreview,
  hashFilterStack,
  generateProposalId,
  isDuplicateProposal,
} from '../actionTools';
import type { FilterAction } from '../../navigation';
import type { DataRow, SpecLimits } from '../../types';
import type { ActionProposal } from '../actionTools';

// ── Test data ───────────────────────────────────────────────────────────

const rawData: DataRow[] = [
  { Weight: 10, Machine: 'A' },
  { Weight: 12, Machine: 'A' },
  { Weight: 20, Machine: 'B' },
  { Weight: 22, Machine: 'B' },
];

function makeFilterAction(
  overrides: Partial<FilterAction> & { factor: string; values: (string | number)[] }
): FilterAction {
  return {
    id: 'f1',
    type: 'filter',
    source: 'boxplot',
    timestamp: Date.now(),
    label: 'Test filter',
    ...overrides,
  };
}

function makeProposal(overrides: Partial<ActionProposal>): ActionProposal {
  return {
    id: 'proposal-1',
    tool: 'apply_filter',
    params: { factor: 'Machine', value: 'A' },
    preview: {},
    status: 'pending',
    filterStackHash: '0',
    timestamp: Date.now(),
    ...overrides,
  };
}

// ── parseActionMarkers ──────────────────────────────────────────────────

describe('parseActionMarkers', () => {
  it('returns empty array for text without markers', () => {
    expect(parseActionMarkers('No markers here')).toEqual([]);
  });

  it('parses single marker', () => {
    const text = 'Try this [ACTION:apply_filter:{"factor":"Machine","value":"A"}] for details.';
    const result = parseActionMarkers(text);

    expect(result).toHaveLength(1);
    expect(result[0].tool).toBe('apply_filter');
    expect(result[0].params).toEqual({ factor: 'Machine', value: 'A' });
    expect(result[0].fullMatch).toBe('[ACTION:apply_filter:{"factor":"Machine","value":"A"}]');
    expect(result[0].startIndex).toBe(9);
  });

  it('parses multiple markers in same text', () => {
    const text =
      'First [ACTION:apply_filter:{"factor":"Machine","value":"A"}] ' +
      'then [ACTION:create_finding:{"title":"High variation"}]';
    const result = parseActionMarkers(text);

    expect(result).toHaveLength(2);
    expect(result[0].tool).toBe('apply_filter');
    expect(result[1].tool).toBe('create_finding');
    expect(result[1].params).toEqual({ title: 'High variation' });
  });

  it('skips malformed JSON gracefully', () => {
    const text =
      'Bad [ACTION:apply_filter:{not json}] and good [ACTION:apply_filter:{"factor":"X"}]';
    const result = parseActionMarkers(text);

    expect(result).toHaveLength(1);
    expect(result[0].params).toEqual({ factor: 'X' });
  });
});

// ── stripActionMarkers ──────────────────────────────────────────────────

describe('stripActionMarkers', () => {
  it('returns original text when no markers', () => {
    expect(stripActionMarkers('Hello world')).toBe('Hello world');
  });

  it('strips single marker from text', () => {
    const text = 'Try this [ACTION:apply_filter:{"factor":"Machine","value":"A"}] for details.';
    expect(stripActionMarkers(text)).toBe('Try this  for details.');
  });

  it('strips multiple markers from text', () => {
    const text = 'Start [ACTION:apply_filter:{"a":1}] middle [ACTION:create_finding:{"b":2}] end';
    expect(stripActionMarkers(text)).toBe('Start  middle  end');
  });
});

// ── computeFilterPreview ────────────────────────────────────────────────

describe('computeFilterPreview', () => {
  it('returns zero stats for empty data', () => {
    const result = computeFilterPreview([], 'Weight', [], null);
    expect(result).toEqual({ samples: 0, mean: 0, stdDev: 0 });
  });

  it('computes correct mean and count for simple data', () => {
    const result = computeFilterPreview(rawData, 'Weight', [], { factor: 'Machine', value: 'A' });

    expect(result.samples).toBe(2);
    expect(result.mean).toBeCloseTo(11, 5);
    expect(result.stdDev).toBeGreaterThan(0);
  });

  it('applies existing filter stack + proposed filter', () => {
    // First filter to Machine=A via stack, then no additional proposed filter
    const stack: FilterAction[] = [makeFilterAction({ factor: 'Machine', values: ['A'] })];
    const result = computeFilterPreview(rawData, 'Weight', stack, null);

    expect(result.samples).toBe(2);
    expect(result.mean).toBeCloseTo(11, 5);
  });

  it('includes cpk when specs provided', () => {
    const specs: SpecLimits = { usl: 25, lsl: 5 };
    const result = computeFilterPreview(rawData, 'Weight', [], null, specs);

    expect(result.samples).toBe(4);
    expect(result.cpk).toBeDefined();
    expect(typeof result.cpk).toBe('number');
  });
});

// ── hashFilterStack ─────────────────────────────────────────────────────

describe('hashFilterStack', () => {
  it('returns same hash for same stack', () => {
    const stack: FilterAction[] = [makeFilterAction({ factor: 'Machine', values: ['A'] })];
    expect(hashFilterStack(stack)).toBe(hashFilterStack(stack));
  });

  it('returns different hash for different stacks', () => {
    const stackA: FilterAction[] = [makeFilterAction({ factor: 'Machine', values: ['A'] })];
    const stackB: FilterAction[] = [makeFilterAction({ factor: 'Machine', values: ['B'] })];
    expect(hashFilterStack(stackA)).not.toBe(hashFilterStack(stackB));
  });

  it('handles empty stack', () => {
    const hash = hashFilterStack([]);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});

// ── generateProposalId ──────────────────────────────────────────────────

describe('generateProposalId', () => {
  it('returns unique IDs on subsequent calls', () => {
    const id1 = generateProposalId();
    const id2 = generateProposalId();
    expect(id1).not.toBe(id2);
  });

  it('starts with "proposal-"', () => {
    expect(generateProposalId()).toMatch(/^proposal-/);
  });
});

// ── isDuplicateProposal ─────────────────────────────────────────────────

describe('isDuplicateProposal', () => {
  it('returns false for empty array', () => {
    expect(isDuplicateProposal([], 'apply_filter', { factor: 'Machine' })).toBe(false);
  });

  it('returns true for matching pending proposal', () => {
    const existing: ActionProposal[] = [
      makeProposal({
        status: 'pending',
        tool: 'apply_filter',
        params: { factor: 'Machine', value: 'A' },
      }),
    ];
    expect(isDuplicateProposal(existing, 'apply_filter', { factor: 'Machine', value: 'A' })).toBe(
      true
    );
  });

  it('returns false for matching but already applied proposal', () => {
    const existing: ActionProposal[] = [
      makeProposal({
        status: 'applied',
        tool: 'apply_filter',
        params: { factor: 'Machine', value: 'A' },
      }),
    ];
    expect(isDuplicateProposal(existing, 'apply_filter', { factor: 'Machine', value: 'A' })).toBe(
      false
    );
  });
});
