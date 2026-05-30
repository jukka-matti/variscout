/**
 * wallLayout.ts — the single position authority for the Investigation Wall.
 *
 * IM-4c: before this module, hub/finding placement math was duplicated three
 * ways — inline in `WallCanvas`, re-derived in `Minimap`, and re-derived again
 * in each app's pan-to-node handler. Any layout change had to be mirrored in
 * three places or the Minimap dots + pan target silently drifted off the cards.
 *
 * `computeWallLayout` is a PURE, DETERMINISTIC function (no Date.now /
 * Math.random / argless `new Date`). WallCanvas renders from it; Minimap and
 * both apps' pan-to-node call it with the SAME inputs to get the SAME positions.
 *
 * Coordinate space is the fixed 2000×1400 Wall user-space (see
 * `WallCanvas.CANVAS_W/CANVAS_H`). Every constant below is lifted verbatim from
 * the pre-IM-4c inline WallCanvas math so the refactor preserves pixel behavior:
 *   - hubs: linear `canvasW/(N+1)*(i+1)` at `HUB_Y=400`; tributary bands of
 *     width `canvasW/groupCount` with `GROUP_PAD_X=40` inner padding.
 *   - findings: supporting chips at `hubX-130`, counter at `hubX+130`, stacked
 *     from `BAND_TOP=296` with `CHIP_GAP=52`.
 *   - scope anchor (Problem-condition card head): `(canvasW/2, 40)`.
 *   - factors: shared `FACTOR_Y` band, ordered by contribution (desc).
 *   - orphans (findings linked to no hub): a left-gutter lane at `ORPHAN_X`,
 *     stacked from `ORPHAN_TOP` with `CHIP_GAP`.
 */

export interface WallNodePos {
  x: number;
  y: number;
}

export interface WallEdge {
  fromId: string;
  toId: string;
  kind: 'support' | 'refute' | 'factor';
}

export interface WallLayout {
  /** hypothesisId → position (card anchor top-center). */
  hubPositions: Map<string, WallNodePos>;
  /** findingId → position (chip top-center); includes orphan findings. */
  findingPositions: Map<string, WallNodePos>;
  /** factor key → position (contributing-factors band). */
  factorPositions: Map<string, WallNodePos>;
  /** Problem-condition card head. */
  scopeAnchor: WallNodePos;
  /** Tethers: finding/factor → hub (support / refute / factor). */
  edges: WallEdge[];
  /** Findings linked to no hub, in input order — the orphan lane occupants. */
  orphanFindingIds: string[];
}

export interface WallLayoutHubInput {
  id: string;
  findingIds: string[];
  counterFindingIds?: string[];
  /** Tributary band id (when grouping). Only consulted with `grouping:'tributary'`. */
  groupId?: string;
}

export interface WallLayoutGroup {
  id: string;
  hubIds: string[];
}

export interface WallLayoutArgs {
  hubs: WallLayoutHubInput[];
  findings: { id: string }[];
  factors: { key: string; contribution: number }[];
  /** `'linear'` = single evenly-spaced row; `'tributary'` = grouped vertical bands. */
  grouping: 'linear' | 'tributary';
  /** Ordered non-empty groups (one per band). Required for tributary grouping;
   *  absent/empty → falls back to linear. Mirrors WallCanvas's `tributaryGroups`. */
  groups?: WallLayoutGroup[];
  canvasW: number;
  canvasH: number;
}

/** Minimal hub shape `buildWallLayoutArgs` needs (a structural subset of `Hypothesis`). */
export interface WallLayoutHubLike {
  id: string;
  findingIds: string[];
  counterFindingIds?: string[];
  tributaryIds?: readonly string[];
}

/** Minimal process-map shape `buildWallLayoutArgs` needs for tributary bucketing. */
export interface WallLayoutProcessMapLike {
  tributaries: readonly { id: string }[];
}

export interface BuildWallLayoutArgsInput {
  hubs: readonly WallLayoutHubLike[];
  findings?: readonly { id: string }[];
  factors?: readonly { key: string; contribution: number }[];
  processMap?: WallLayoutProcessMapLike;
  groupByTributary?: boolean;
  canvasW: number;
  canvasH: number;
}

/**
 * Build `WallLayoutArgs` from the raw Wall inputs — the SINGLE place that owns
 * the tributary-bucketing rule (mirrors WallCanvas's `tributaryGroups` memo:
 * bucket each hub by its first matching tributary id, preserve processMap order,
 * unassigned bucket last, drop empty buckets). WallCanvas, Minimap, and both
 * apps' pan-to-node all call this → `computeWallLayout`, so positions can never
 * diverge between renderer, minimap, and pan target.
 */
export function buildWallLayoutArgs(input: BuildWallLayoutArgsInput): WallLayoutArgs {
  const {
    hubs,
    findings = [],
    factors = [],
    processMap,
    groupByTributary,
    canvasW,
    canvasH,
  } = input;

  const hubInputs: WallLayoutHubInput[] = hubs.map(h => ({
    id: h.id,
    findingIds: h.findingIds,
    counterFindingIds: h.counterFindingIds,
  }));

  let grouping: 'linear' | 'tributary' = 'linear';
  let groups: WallLayoutGroup[] | undefined;

  if (groupByTributary && processMap) {
    const tributaryIds = new Set(processMap.tributaries.map(t => t.id));
    const buckets: WallLayoutGroup[] = processMap.tributaries.map(t => ({ id: t.id, hubIds: [] }));
    const unassigned: WallLayoutGroup = { id: '__unassigned__', hubIds: [] };
    for (const hub of hubs) {
      const matchId = hub.tributaryIds?.find(id => tributaryIds.has(id));
      if (matchId) {
        buckets.find(b => b.id === matchId)!.hubIds.push(hub.id);
      } else {
        unassigned.hubIds.push(hub.id);
      }
    }
    const nonEmpty = [...buckets, unassigned].filter(b => b.hubIds.length > 0);
    if (nonEmpty.length > 0) {
      grouping = 'tributary';
      groups = nonEmpty;
    }
  }

  return {
    hubs: hubInputs,
    findings: findings.map(f => ({ id: f.id })),
    factors: factors.map(f => ({ key: f.key, contribution: f.contribution })),
    grouping,
    groups,
    canvasW,
    canvasH,
  };
}

// ── Layout constants (lifted verbatim from WallCanvas inline math) ───────────
const HUB_Y = 400;
const BAND_TOP = 296;
const CHIP_GAP = 52;
const CHIP_DX = 130; // supporting LEFT (-), counter RIGHT (+)
const SCOPE_ANCHOR_Y = 40;
const GROUP_PAD_X = 40;
const FACTOR_Y = 1300; // contributing-factors band (TributaryFooter row)
const FACTOR_GAP = 220; // horizontal spacing between factor entries
const FACTOR_X0 = 120; // first factor x
const ORPHAN_X = 80; // left-gutter orphan lane column
const ORPHAN_TOP = 296;

/**
 * Compute every node position + tether on the Wall, deterministically.
 */
export function computeWallLayout(args: WallLayoutArgs): WallLayout {
  const { hubs, findings, factors, grouping, groups, canvasW } = args;

  const hubPositions = new Map<string, WallNodePos>();
  const findingPositions = new Map<string, WallNodePos>();
  const factorPositions = new Map<string, WallNodePos>();
  const edges: WallEdge[] = [];

  // ── Hub X positions ────────────────────────────────────────────────────
  const useTributary = grouping === 'tributary' && Array.isArray(groups) && groups.length > 0;
  if (useTributary) {
    const bandWidth = canvasW / groups!.length;
    groups!.forEach((group, bandIdx) => {
      const bandX0 = bandIdx * bandWidth;
      const innerX0 = bandX0 + GROUP_PAD_X;
      const innerW = bandWidth - GROUP_PAD_X * 2;
      const perHub = innerW / (group.hubIds.length + 1);
      group.hubIds.forEach((hubId, i) => {
        hubPositions.set(hubId, { x: innerX0 + perHub * (i + 1), y: HUB_Y });
      });
    });
  } else {
    const spacing = canvasW / (hubs.length + 1);
    hubs.forEach((hub, idx) => {
      hubPositions.set(hub.id, { x: spacing * (idx + 1), y: HUB_Y });
    });
  }

  // ── Per-hub finding positions + edges ──────────────────────────────────
  // Mirrors WallCanvas.renderHubEvidence exactly: SUPPORTING = findingIds minus
  // counters (climb LEFT of the hub anchor); COUNTER = the counterFindingIds set
  // (climb RIGHT), independent of whether they also appear in findingIds. Both
  // count as "linked" so they are NOT treated as orphans.
  const linkedFindingIds = new Set<string>();
  for (const hub of hubs) {
    const hubPos = hubPositions.get(hub.id);
    if (!hubPos) continue; // hub filtered out of a band — skip its evidence
    const counterIds = new Set(hub.counterFindingIds ?? []);
    const supporting = hub.findingIds.filter(id => !counterIds.has(id));
    const counter = [...counterIds];

    supporting.forEach((fid, i) => {
      linkedFindingIds.add(fid);
      findingPositions.set(fid, { x: hubPos.x - CHIP_DX, y: BAND_TOP + i * CHIP_GAP });
      edges.push({ fromId: fid, toId: hub.id, kind: 'support' });
    });
    counter.forEach((fid, i) => {
      linkedFindingIds.add(fid);
      findingPositions.set(fid, { x: hubPos.x + CHIP_DX, y: BAND_TOP + i * CHIP_GAP });
      edges.push({ fromId: fid, toId: hub.id, kind: 'refute' });
    });
  }

  // ── Orphan findings (linked to no hub) → left-gutter lane ───────────────
  const orphanFindingIds: string[] = [];
  findings.forEach(f => {
    if (linkedFindingIds.has(f.id) || findingPositions.has(f.id)) return;
    findingPositions.set(f.id, { x: ORPHAN_X, y: ORPHAN_TOP + orphanFindingIds.length * CHIP_GAP });
    orphanFindingIds.push(f.id);
  });

  // ── Factor band (ordered by contribution desc) ──────────────────────────
  [...factors]
    .sort((a, b) => b.contribution - a.contribution)
    .forEach((factor, i) => {
      factorPositions.set(factor.key, { x: FACTOR_X0 + i * FACTOR_GAP, y: FACTOR_Y });
      // A factor tethers to the highest-contribution hub when one exists; in V1
      // the factor band is informational, so we only emit an edge when there is
      // at least one hub to anchor to (first hub in input order).
      if (hubs.length > 0) {
        edges.push({ fromId: factor.key, toId: hubs[0].id, kind: 'factor' });
      }
    });

  return {
    hubPositions,
    findingPositions,
    factorPositions,
    scopeAnchor: { x: canvasW / 2, y: SCOPE_ANCHOR_Y },
    edges,
    orphanFindingIds,
  };
}
