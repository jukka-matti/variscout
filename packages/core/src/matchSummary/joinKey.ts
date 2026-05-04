import type { JoinKeyCandidate } from './types';

const KEY_HEURISTIC = /^(.+_id|lot|batch|serial|part)$/i;
const NAME_WEIGHT = 0.4;
const VALUE_WEIGHT = 0.6;
const MIN_NAME_SCORE = 0.3;
const MIN_TOTAL_SCORE = 0.2;

function nameScore(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;
  if (al.includes(bl) || bl.includes(al)) return 0.7;
  if (KEY_HEURISTIC.test(al) && KEY_HEURISTIC.test(bl)) return 0.5;
  return 0;
}

function valueOverlap(
  hubRows: ReadonlyArray<Record<string, unknown>>,
  hubCol: string,
  newRows: ReadonlyArray<Record<string, unknown>>,
  newCol: string
): number {
  const hubVals = new Set<string>();
  for (const r of hubRows) {
    const v = r[hubCol];
    if (v !== undefined && v !== null) hubVals.add(String(v));
  }
  if (hubVals.size === 0) return 0;
  const newVals = new Set<string>();
  for (const r of newRows) {
    const v = r[newCol];
    if (v !== undefined && v !== null) newVals.add(String(v));
  }
  if (newVals.size === 0) return 0;
  let hits = 0;
  for (const v of newVals) if (hubVals.has(v)) hits++;
  return hits / newVals.size;
}

export function rankJoinKeyCandidates(
  hubColumns: readonly string[],
  hubRows: ReadonlyArray<Record<string, unknown>>,
  newColumns: readonly string[],
  newRows: ReadonlyArray<Record<string, unknown>>
): JoinKeyCandidate[] {
  const candidates: JoinKeyCandidate[] = [];
  for (const hubCol of hubColumns) {
    for (const newCol of newColumns) {
      const ns = nameScore(hubCol, newCol);
      // Skip pairs with no name signal AND no key-heuristic match. Keeps the
      // candidate set tractable on wide schemas.
      if (ns < MIN_NAME_SCORE && !KEY_HEURISTIC.test(hubCol)) continue;
      const vo = valueOverlap(hubRows, hubCol, newRows, newCol);
      const totalScore = ns * NAME_WEIGHT + vo * VALUE_WEIGHT;
      if (totalScore < MIN_TOTAL_SCORE) continue;
      candidates.push({
        hubColumn: hubCol,
        newColumn: newCol,
        nameMatchScore: ns,
        valueOverlapPct: vo,
        cardinalityCompatible: true,
        totalScore,
      });
    }
  }
  return candidates.sort((a, b) => b.totalScore - a.totalScore);
}
