import { describe, expect, it } from 'vitest';
import { detectTimeColumns } from '../detectTimeColumns';
import type { ColumnParsingProfile } from '../../parser/types';

function profile(overrides: Partial<ColumnParsingProfile>): ColumnParsingProfile {
  return {
    columnName: 'C1',
    status: 'ok',
    confidence: 100,
    primary: { kind: 'numeric', label: 'numeric', detail: {} },
    alternatives: [],
    transformedSamples: [],
    ...overrides,
  };
}

describe('detectTimeColumns', () => {
  it('returns null for empty profiles array', () => {
    expect(detectTimeColumns([])).toBeNull();
  });

  it('returns null when no date-kind profiles', () => {
    const result = detectTimeColumns([
      profile({ columnName: 'A', primary: { kind: 'numeric', label: 'numeric', detail: {} } }),
      profile({
        columnName: 'B',
        primary: { kind: 'categorical', label: 'categorical', detail: {} },
      }),
    ]);
    expect(result).toBeNull();
  });

  it('returns single date column', () => {
    const result = detectTimeColumns([
      profile({ columnName: 'OrderDate', primary: { kind: 'date', label: 'date', detail: {} } }),
    ]);
    expect(result).toEqual({ count: 1, columns: ['OrderDate'] });
  });

  it('returns multiple date columns mixed with non-date', () => {
    const result = detectTimeColumns([
      profile({ columnName: 'Created', primary: { kind: 'date', label: 'date', detail: {} } }),
      profile({ columnName: 'Amount', primary: { kind: 'numeric', label: 'numeric', detail: {} } }),
      profile({ columnName: 'Updated', primary: { kind: 'date', label: 'date', detail: {} } }),
      profile({
        columnName: 'Type',
        primary: { kind: 'categorical', label: 'categorical', detail: {} },
      }),
      profile({ columnName: 'Closed', primary: { kind: 'date', label: 'date', detail: {} } }),
    ]);
    expect(result).toEqual({ count: 3, columns: ['Created', 'Updated', 'Closed'] });
  });

  it('preserves input order', () => {
    const result = detectTimeColumns([
      profile({ columnName: 'Z', primary: { kind: 'date', label: 'date', detail: {} } }),
      profile({ columnName: 'A', primary: { kind: 'date', label: 'date', detail: {} } }),
      profile({ columnName: 'M', primary: { kind: 'date', label: 'date', detail: {} } }),
    ]);
    expect(result?.columns).toEqual(['Z', 'A', 'M']);
  });

  it('excludes date profiles with status !== "ok"', () => {
    const result = detectTimeColumns([
      profile({ columnName: 'Good', primary: { kind: 'date', label: 'date', detail: {} } }),
      profile({
        columnName: 'Warn',
        status: 'warning',
        primary: { kind: 'date', label: 'date', detail: {} },
      }),
      profile({
        columnName: 'Err',
        status: 'error',
        primary: { kind: 'date', label: 'date', detail: {} },
      }),
    ]);
    expect(result).toEqual({ count: 1, columns: ['Good'] });
  });

  it('excludes profiles with primary null', () => {
    const result = detectTimeColumns([
      profile({ columnName: 'OK', primary: { kind: 'date', label: 'date', detail: {} } }),
      {
        columnName: 'NoPrimary',
        status: 'ok',
        confidence: 100,
        primary: null,
        alternatives: [],
        transformedSamples: [],
      },
    ]);
    expect(result).toEqual({ count: 1, columns: ['OK'] });
  });

  it('returns null when all date columns have non-ok status', () => {
    const result = detectTimeColumns([
      profile({
        columnName: 'Bad1',
        status: 'warning',
        primary: { kind: 'date', label: 'date', detail: {} },
      }),
      profile({
        columnName: 'Bad2',
        status: 'error',
        primary: { kind: 'date', label: 'date', detail: {} },
      }),
    ]);
    expect(result).toBeNull();
  });
});
