import { describe, it, expect } from 'vitest';
import type { ColumnParsingProfile } from '../../parser/types';
import { detectPairedTimingColumns } from '../detectPairedTimingColumns';

// ---------------------------------------------------------------------------
// Minimal fixture builders
// ---------------------------------------------------------------------------

function makeProfile(
  columnName: string,
  kind: 'numeric' | 'date' | 'categorical' | 'id' | 'text' | null
): ColumnParsingProfile {
  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary: kind === null ? null : { kind, label: kind, detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectPairedTimingColumns', () => {
  it('returns [] for empty profiles and empty steps', () => {
    expect(detectPairedTimingColumns([], [])).toEqual([]);
  });

  it('ignores numeric columns ending in _start (date-kind filter)', () => {
    const profiles = [makeProfile('Count_start', 'numeric'), makeProfile('Count_end', 'numeric')];
    expect(detectPairedTimingColumns(profiles, [])).toEqual([]);
  });

  it('returns 1 pair with matchedStepId set when step name matches prefix', () => {
    const profiles = [makeProfile('Prep_start', 'date'), makeProfile('Prep_end', 'date')];
    const steps = [{ id: 'step-1', name: 'Prep' }];
    const result = detectPairedTimingColumns(profiles, steps);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      prefix: 'Prep',
      startColumn: 'Prep_start',
      endColumn: 'Prep_end',
      matchedStepId: 'step-1',
    });
  });

  it('returns 1 pair with matchedStepId null when no step matches prefix', () => {
    const profiles = [makeProfile('Prep_start', 'date'), makeProfile('Prep_end', 'date')];
    const steps = [{ id: 'step-1', name: 'Mix' }];
    const result = detectPairedTimingColumns(profiles, steps);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      prefix: 'Prep',
      startColumn: 'Prep_start',
      endColumn: 'Prep_end',
      matchedStepId: null,
    });
  });

  it('returns [] when _start exists but _end is missing (unpaired ignored)', () => {
    const profiles = [makeProfile('Prep_start', 'date')];
    expect(detectPairedTimingColumns(profiles, [])).toEqual([]);
  });

  it('matches case-insensitively: PREP_START + prep_end + step Prep → matched', () => {
    const profiles = [makeProfile('PREP_START', 'date'), makeProfile('prep_end', 'date')];
    const steps = [{ id: 'step-99', name: 'Prep' }];
    const result = detectPairedTimingColumns(profiles, steps);
    expect(result).toHaveLength(1);
    expect(result[0].matchedStepId).toBe('step-99');
  });

  it('returns [] when columns are just _start and _end with no prefix', () => {
    const profiles = [makeProfile('_start', 'date'), makeProfile('_end', 'date')];
    expect(detectPairedTimingColumns(profiles, [])).toEqual([]);
  });

  it('returns 2 pairs in alphabetical order when two prefixes present', () => {
    const profiles = [
      makeProfile('Mix_start', 'date'),
      makeProfile('Mix_end', 'date'),
      makeProfile('Fill_start', 'date'),
      makeProfile('Fill_end', 'date'),
    ];
    const steps = [
      { id: 'step-a', name: 'Mix' },
      { id: 'step-b', name: 'Fill' },
    ];
    const result = detectPairedTimingColumns(profiles, steps);
    expect(result).toHaveLength(2);
    // Alphabetical: Fill < Mix
    expect(result[0].prefix).toBe('Fill');
    expect(result[0].matchedStepId).toBe('step-b');
    expect(result[1].prefix).toBe('Mix');
    expect(result[1].matchedStepId).toBe('step-a');
  });
});
