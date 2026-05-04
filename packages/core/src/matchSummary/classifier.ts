import { parseTimeValue } from '../time';
import type { DataCellValue } from '../types';
import type {
  ClassifyPasteContext,
  ClassifyPasteInput,
  JoinKeyCandidate,
  MatchSummaryClassification,
  TemporalAxisCase,
  SourceAxisCase,
  BlockReason,
} from './types';
import { rankJoinKeyCandidates } from './joinKey';

const REPLACE_DUPLICATE_THRESHOLD = 0.7;
const JOINABLE_THRESHOLD = 0.5;
const ONE_DAY_MS = 86_400_000;
/** Threshold log10(ratio) for grain divergence (~ratio of 3.16x). */
const GRAIN_DIVERGENCE_LOG10 = 0.5;

function parseMs(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = parseTimeValue(value as DataCellValue);
  if (!parsed) return undefined;
  const ms = parsed.getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

function rangeOf(
  rows: ReadonlyArray<Record<string, unknown>>,
  col: string
): { startISO: string; endISO: string } | undefined {
  let min = Infinity;
  let max = -Infinity;
  let hasAny = false;
  for (const r of rows) {
    const ms = parseMs(r[col]);
    if (ms === undefined) continue;
    if (ms < min) min = ms;
    if (ms > max) max = ms;
    hasAny = true;
  }
  if (!hasAny) return undefined;
  return { startISO: new Date(min).toISOString(), endISO: new Date(max).toISOString() };
}

function detectGrainMs(
  rows: ReadonlyArray<Record<string, unknown>>,
  col: string
): number | undefined {
  const ts: number[] = [];
  for (const r of rows) {
    const ms = parseMs(r[col]);
    if (ms !== undefined) ts.push(ms);
  }
  if (ts.length < 2) return undefined;
  ts.sort((a, b) => a - b);
  const deltas: number[] = [];
  for (let i = 1; i < ts.length; i++) {
    const d = ts[i] - ts[i - 1];
    if (d > 0) deltas.push(d);
  }
  if (deltas.length === 0) return undefined;
  deltas.sort((a, b) => a - b);
  return deltas[Math.floor(deltas.length / 2)];
}

function classifyTemporal(
  ctx: ClassifyPasteContext,
  input: ClassifyPasteInput,
  newRange: { startISO: string; endISO: string } | undefined
): {
  temporal: TemporalAxisCase;
  overlapRange?: { startISO: string; endISO: string };
  duplicateRate?: number;
} {
  if (!input.newTimeColumn || !newRange) return { temporal: 'no-timestamp' };
  if (!ctx.existingRange) return { temporal: 'append' };

  if (ctx.existingRows && ctx.existingTimeColumn) {
    const existGrain = detectGrainMs(ctx.existingRows, ctx.existingTimeColumn);
    const newGrain = detectGrainMs(input.newRows, input.newTimeColumn);
    if (
      existGrain !== undefined &&
      newGrain !== undefined &&
      Math.abs(Math.log10(newGrain / existGrain)) > GRAIN_DIVERGENCE_LOG10
    ) {
      return { temporal: 'different-grain' };
    }
  }

  const existStart = new Date(ctx.existingRange.startISO).getTime();
  const existEnd = new Date(ctx.existingRange.endISO).getTime();
  const newStart = new Date(newRange.startISO).getTime();
  const newEnd = new Date(newRange.endISO).getTime();

  if (newStart > existEnd) return { temporal: 'append' };
  if (newEnd < existStart) return { temporal: 'backfill' };

  // Replace detection: when ranges overlap and a high proportion of new rows are
  // already present in existing data, treat the paste as a re-send of existing data.
  // Start dates must be close (within one day). End date tolerance is looser — a
  // partial re-export (e.g. first 8 of 10 rows) should still classify as replace
  // when duplicate rate exceeds threshold.
  if (ctx.existingRows && Math.abs(newStart - existStart) < ONE_DAY_MS) {
    const existKeys = new Set(ctx.existingRows.map(r => JSON.stringify(r)));
    let dupes = 0;
    for (const r of input.newRows) {
      if (existKeys.has(JSON.stringify(r))) dupes++;
    }
    const rate = input.newRows.length > 0 ? dupes / input.newRows.length : 0;
    if (rate >= REPLACE_DUPLICATE_THRESHOLD) return { temporal: 'replace', duplicateRate: rate };
  }

  const overlapStart = Math.max(existStart, newStart);
  const overlapEnd = Math.min(existEnd, newEnd);
  if (overlapStart <= overlapEnd) {
    return {
      temporal: 'overlap',
      overlapRange: {
        startISO: new Date(overlapStart).toISOString(),
        endISO: new Date(overlapEnd).toISOString(),
      },
    };
  }
  return { temporal: 'append' };
}

interface SourceClassification {
  source: SourceAxisCase;
  candidates?: JoinKeyCandidate[];
}

function classifySource(
  ctx: ClassifyPasteContext,
  input: ClassifyPasteInput
): SourceClassification {
  const overlapColumns = input.newColumns.filter(c => ctx.hubColumns.includes(c));
  const newColumnsCount = input.newColumns.length - overlapColumns.length;

  if (newColumnsCount === 0 && overlapColumns.length === input.newColumns.length) {
    return { source: 'same-source' };
  }

  // Attempt join-key detection for 'different-source-joinable'. Passes when at least
  // one column pair scores above JOINABLE_THRESHOLD (value overlap weighted 0.6).
  const candidates = rankJoinKeyCandidates(
    ctx.hubColumns,
    ctx.existingRows ?? [],
    input.newColumns,
    input.newRows
  );

  if (candidates.length > 0 && candidates[0].totalScore > JOINABLE_THRESHOLD) {
    return { source: 'different-source-joinable', candidates };
  }
  if (overlapColumns.length === 0) return { source: 'different-source-no-key' };
  return { source: 'mixed' };
}

export function classifyPaste(
  ctx: ClassifyPasteContext,
  input: ClassifyPasteInput
): MatchSummaryClassification {
  const newRange = input.newTimeColumn ? rangeOf(input.newRows, input.newTimeColumn) : undefined;
  const { temporal, overlapRange, duplicateRate } = classifyTemporal(ctx, input, newRange);
  const { source, candidates } = classifySource(ctx, input);

  const blockReasons: BlockReason[] = [];
  if (temporal === 'overlap') blockReasons.push('overlap');
  if (temporal === 'different-grain') blockReasons.push('different-grain');
  if (source === 'different-source-no-key') blockReasons.push('different-source-no-key');

  return {
    source,
    temporal,
    blockReasons,
    existingRange: ctx.existingRange,
    newRange,
    overlapRange,
    duplicateRate,
    candidates,
  };
}
