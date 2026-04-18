---
title: 'Investigation Wall — River-Roots Design'
status: draft
date: 2026-04-19
audience: [developer, designer, analyst]
category: architecture
related:
  [
    investigation-spine,
    evidence-map,
    frame-process-map,
    suspected-cause,
    causal-graph,
    coscout,
    question-driven-eda,
    hmw-brainstorm,
  ]
---

# Investigation Wall — River-Roots Design

## Problem

VariScout shipped the FRAME workspace on 2026-04-18 with a river-styled SIPOC Process Map (ADR-070). Three weeks earlier (2026-04-05), ADR-066 made Evidence Map the center of the Investigation workspace — a factor-centric graph with nodes sized by R²adj and edges for causal/correlation links.

A Claude Design handoff (`~/Downloads/process-thinking 2/`) delivered five HTML prototypes. The primary, "Investigation on the River", proposes a second visual paradigm for the Investigation workspace: a **hypothesis-centric Wall** — Problem condition at the top, hypotheses arrayed below a waterline with embedded mini-chart evidence, AND/OR/NOT gates composing them into convergence branches, tributary chips live from ProcessMap, and a "missing evidence · the detective move nobody ships" critique strip.

The Wall is **not a replacement** for Evidence Map. Both are projections of the same `SuspectedCause` + `CausalLink` + `Finding` + `Question` graph. Evidence Map answers _"which factors matter?"_ Wall answers _"which hypotheses are we betting on, what evidence holds them, and what's missing?"_

## Scope

This spec delivers the full-vision Wall as a **view toggle inside Investigation**. It preserves ADR-066 (Map remains default) and ADR-053 (question-driven diamond intact). It re-uses ADR-061's append-only SSE pattern for hub comments. It extends ADR-029's 25-tool CoScout registry with 2 new tools. No enum migrations. Two external dependencies are named honestly and parked: live presence (needs new protocol) and per-step Cpk (needs FRAME schema extension).

## Goals

1. Give the analyst a hypothesis-centric canvas that turns suspected causes into **disconfirmable claims**, not labels.
2. Surface investigation gaps proactively — missing disconfirmation, orphan questions, uncovered high-R² columns — via CoScout critique, not manual audit.
3. Preserve existing entry points (FRAME upfront hypotheses, SCOUT Factor Intelligence, any-phase observation via `QuestionLinkPrompt`) and add the Wall as a fourth.
4. Bind investigation graph to ProcessMap by derivation (column → tributary); allow explicit override via `tributaryIds?`.
5. Stay deterministic (no `Math.random`), type-safe (B1/B2/B3 boundaries), terminology-compliant (never "root cause" — use "contribution/convergence/causation").

## Non-goals

- **Live presence / shared mutations.** Requires a new connect/heartbeat/CRDT protocol beyond ADR-061's append-only shape. Separate spec.
- **Per-step Cpk / capability flow.** Requires `ProcessMap.nodes[].{lsl, usl, target}` per step. FRAME schema extension; separate spec.
- **Replacing Evidence Map.** ADR-066 stays; Wall is a toggle, not a replacement.
- **Miro/Jira/chatbot-with-charts analogues.** The Wall is a focused investigation canvas, not a general-purpose board or task tracker.

## Design overview

### Workspace integration

- **Where**: Investigation workspace (existing, per ADR-066). New view toggle `Map | Wall` in the workspace header, persisted per project in `wallLayoutStore`. Default = Map (no behavior change for existing users).
- **Top bar**: workspace tabs unchanged — `Overview · Frame · Scout · Investigate · Improve · Report`. The Map/Wall toggle lives inside Investigate.
- **Toolbar** (top-right of the canvas, grouped by intent):
  - Create: `+ New hypothesis   + New question`
  - Compute: `↻ Run AND-check` (contextual: disabled with zero gates selected; per-gate or all-gates based on selection)
  - View: `◈ Snap river   ⌖ Fit`

### Canvas (virtual 2000×1400 SVG, pan/zoom)

| Band             | y-range  | Contents                                                                                                                                                |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem          | 0–260    | Problem condition card (CTS column, live Cpk, events/wk)                                                                                                |
| Waterline        | ~280     | Dashed labeled divider                                                                                                                                  |
| Hypothesis       | 320–880  | Hub cards with embedded interactive mini-charts + status-tinted borders; question pills; gate nodes (◇ AND / ◇ OR / ⊘ NOT) connecting down from Problem |
| Evidence         | 900–1280 | Finding chips, gemba chips, best-subsets suggestion card, tethered by dashed lines to parent hub                                                        |
| Tributary footer | 1300+    | Live chip row from `processMap.tributaries`; each chip labeled with column + referencing hypotheses (derived); orphan tributaries dimmed                |

A collapsed "missing evidence" digest bar sits below the canvas. Per-hypothesis `⚠` badges are the primary gap signal; the bar is a secondary expandable list.

### Right rail — single evolving narrator pane

One surface that evolves, hideable with `⌘/` (collapses to a notification dot):

1. **First sessions** — coach track with dismissible tutorial cards ("Brush an I-chart to pin a finding").
2. **Steady state** — CoScout thread: ambient suggestions, best-subsets candidates, disconfirmation nags, stale-question reminders. Chronological feed.
3. **When collab ships (future spec)** — human messages interleave with CoScout in the same surface.

No separate panels for "What the analyst does", "Team presence", "Mobile/touch" — those deck-rhetoric surfaces collapse into this one pane (or, for mobile copy, into responsive behavior, not chrome).

### Five node types (the Wall's units)

| Unit              | Shape                                                               | Data source                                    | Key interactions                                                                                                                        |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Problem condition | Red-bordered rect, top-center                                       | Derived from `processMap.ctsColumn` + live Cpk | Click → open CTS I-chart; attaches `problemContributionTree?` gate root                                                                 |
| Hypothesis (hub)  | Rounded rect, status-tinted border, embedded interactive mini-chart | `SuspectedCause`                               | Click → expand (questions + all findings); right-click → status, delete, promote-to-causal; drag → reposition; drop onto gate → compose |
| Question pill     | Small pill with `?` glyph                                           | `Question` not yet in any `hub.questionIds`    | Click → detail; right-click → _Promote to hypothesis_                                                                                   |
| Finding chip      | Chip under parent hub, tethered by dashed line                      | `Finding` in `hub.findingIds`                  | Click → replay chart; right-click → detach, re-assign, delete                                                                           |
| Gate              | ◇ AND / ◇ OR / ⊘ NOT glyph                                          | `GateNode` in `problemContributionTree`        | Click → Run AND-check for this branch; right-click → convert AND↔OR, negate, delete                                                     |

## Data model additions

All optional fields with no-op migrations; existing projects load unchanged.

```ts
// packages/core/src/findings/types.ts

export type ComparisonOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'in';

export type ConditionLeaf = {
  kind: 'leaf';
  column: string;
  op: ComparisonOp;
  value: string | number | [number, number] | string[];
};

export type ConditionBranch = {
  kind: 'and' | 'or' | 'not';
  children: HypothesisCondition[];
};

export type HypothesisCondition = ConditionLeaf | ConditionBranch;

export interface SuspectedCause {
  // ...existing fields unchanged...
  /** Auto-derived from first finding's findingSource on creation; analyst-editable. */
  condition?: HypothesisCondition;
  /** Explicit ProcessMap binding. Falls back to column-matching derivation when absent. */
  tributaryIds?: string[];
  /** Timestamped team discussion on the hypothesis. Same shape as FindingComment. */
  comments?: FindingComment[];
}

// Gate tree over hub refs, single tree per investigation
export type GateNode =
  | { kind: 'hub'; hubId: string }
  | { kind: 'and' | 'or' | 'not'; children: GateNode[] };

// packages/stores/src/investigationStore.ts
export interface InvestigationStore {
  // ...existing...
  problemContributionTree?: GateNode;
}
```

### New feature store (UI state only, not domain)

```ts
// packages/stores/src/wallLayoutStore.ts
export interface WallLayoutStore {
  viewMode: 'map' | 'wall';
  nodePositions: Record<NodeId, { x: number; y: number }>;
  selection: Set<NodeId>;
  openChartClusters: Record<TributaryId, ChartClusterState>;
  zoom: number;
  pan: { x: number; y: number };
  railOpen: boolean;
  undoHistory: Patch[]; // 50-step, ephemeral (not persisted)
  andCheckResults: Record<GateNodePath, { holds: number; total: number; at: number }>;
  pendingComments: PendingComment[]; // SSE offline queue
}
```

Persisted to IndexedDB per `projectId`. Rehydrates on session start with Snap-to-River default layout if nothing stored.

## Derivations & compute

### Auto-authoring conditions from `findingSource`

`deriveConditionFromFindingSource(source): HypothesisCondition | undefined` — pure, in `@variscout/core`:

| Finding source                                | Derived leaf                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `{chart: 'ichart', anchorX, anchorY}`         | `{leaf, column: <metric>, op: 'gte', value: anchorY}` + optional time-window leaf ANDed |
| `{chart: 'boxplot', category}`                | `{leaf, column: <groupColumn>, op: 'eq', value: category}`                              |
| `{chart: 'pareto', category}`                 | `{leaf, column: <dimensionColumn>, op: 'eq', value: category}`                          |
| `{chart: 'yamazumi', category, activityType}` | `{leaf, column: <activityCol>, op: 'eq', value: category}`                              |
| `{chart: 'probability', anchorX, anchorY}`    | `{leaf, column: <metric>, op: 'between', value: [yMin, yMax]}`                          |
| `{chart: 'coscout'}`                          | `undefined` — CoScout findings aren't brushed                                           |

Multiple findings on one hub → AND over each leaf. Analyst override stored as `hub.condition`; derivation only runs when `hub.condition === undefined`.

### Predicate evaluator

`evaluateCondition(cond: HypothesisCondition, row: DataRow): boolean` — pure, recursive:

- Leaf: column lookup via parser's `toNumericValue` / `toCategoricalValue` (B1). Missing column or type mismatch → `false`. Never throws.
- `and` → `children.every`; `or` → `children.some`; `not` → `!evaluateCondition(children[0], row)` (unary).

### `runAndCheck(rootNode: GateNode, hubs, rows) → { holds, total, matchingRowIndices }`

- `total` = row count in current data window after active filters (honors `FindingContext.activeFilters`).
- Per row: recursively evaluates the gate tree using each hub's `condition`. Hubs with `condition === undefined` evaluate to `false`.
- Cache key: `(gate tree hash, activeFilters hash, data hash)`. Invalidated on structural change.
- Returns deterministic; no randomness. Respects ADR-069 safe-math at the (rare) numeric boundaries.

### ProcessMap binding

`selectHypothesisTributaries(hubId)` selector:

1. If `hub.tributaryIds` is set → return `processMap.tributaries.filter(t => hub.tributaryIds.includes(t.id))`.
2. Else derive: for each finding in `hub.findingIds`, extract the column from its `findingSource`, intersect with `processMap.tributaries[].column`. Dedup, sort by ProcessMap node order.

Used by tributary chips row and Snap-to-River layout.

### Background best-subsets pipeline

Debounced 2s after any hub/finding change. Calls `bestSubsetsRegression()` from `@variscout/core/stats` (ADR-067, two-pass with interaction screening) on the CTS column vs. all columns **not** already cited by any hub's condition leaves. If any candidate has `ΔR²adj > 0.10`, emits a CoScout message of kind `best-subsets-candidate` via the `aiStore` message stream. Respects no-`Math.random` invariant.

### Disconfirmation critique

`proposeDisconfirmationMove(hub, findings, data)` — pure, in `@variscout/core/ai/actions/`:

- Extracts leaf columns from each supporting finding.
- `pickComplementaryBrush()` — for each leaf, produces the opposite value slice (night ↔ day; high ↔ low; supplier B ↔ supplier A).
- Returns suggested chart + brush region as a structured `SuggestedBrush`.
- Gate for emitting: `hub.findingIds.length ≥ 3 && no Finding with validationStatus === 'contradicts'`.

## Interactions & state machine

### Node lifecycles

| Entity           | Transitions                                                                                                                                                                                                                      | Persistence                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Hypothesis (hub) | `suspected` (= Proposed/Evidenced depending on evidence) → `confirmed` OR `not-confirmed` (= Refuted). Analyst-set for confirmed/not-confirmed. Evidenced = display-only projection: `findingIds.length ≥ 1 && no contradictor`. | Existing `SuspectedCause.status` enum unchanged |
| Question         | `open → investigating → answered-yes / ruled-out / partial`                                                                                                                                                                      | Existing, reused                                |
| Finding          | Stateless; `linked` (hub.findingIds ∪ question.linkedFindingIds) or `detached`                                                                                                                                                   | Existing                                        |
| Gate             | Stateless composition over hub IDs / nested gates                                                                                                                                                                                | New `problemContributionTree` field             |

### Core flows

1. **Click tributary chip** → chart cluster opens inline at tributary's x (I-Chart, Boxplot, Pareto, Histogram, Probability Plot). Cluster state in `wallLayoutStore.openChartClusters`.
2. **Brush region / click category** → "Pin finding" appears in chart toolbar → pinning creates `Finding` with populated `findingSource` → chip drops on canvas tethered by dashed line → `QuestionLinkPrompt` (Wall variant) offers four options: _Link to existing hypothesis_ / _Link to existing question_ / _Propose new hypothesis from this finding_ / Skip-with-don't-ask-again.
3. **Right-click finding chip** → _Link to hypothesis_ · _Propose new hypothesis_ · _Detach_ · _Delete_.
4. **Right-click question pill** → _Promote to hypothesis_ (creates hub seeded with question's `linkedFindingIds`; question persists, added to `hub.questionIds`) · _Edit_ · _Delete_.
5. **Drag hub onto gate** → adds to gate's children; gates nest recursively.
6. **Right-click gate** → convert AND↔OR, negate, delete. Root gate attaches to `investigationStore.problemContributionTree`.
7. **Run AND-check** (button or `R`) → evaluates predicate tree, updates HOLDS X/Y on gate badge. Click badge → highlights matching rows on any open chart.
8. **Background best-subsets** → on any structural change, debounced, emits CoScout suggestion when `ΔR²adj > 0.10`.
9. **Disconfirmation nag** → when hub has ≥3 supporters and no contradicting brush, CoScout suggests a specific complementary brush. Click opens the chart with brush pre-highlighted.

### Keyboard

`⌘K` search · `⌘/` toggle rail · `N` new hypothesis · `Q` new question · `R` Run AND-check on selection · `F` fit · `S` snap to river · `1/2/3` set status (proposed/confirmed/refuted) · `Esc` clear · `⌘Z / ⌘⇧Z` undo/redo · `Delete` remove selected (with confirm) · `Tab` focus traversal in visual order.

### Undo/redo

All structural mutations go through patch-based actions in `wallLayoutStore`. 50-step history per session, ephemeral (not persisted — history is UI state, not investigation record).

### Snap-to-River layout

Arranges hypotheses along x-axis by primary tributary's position in `processMap.nodes[]` ordering. Orphan hubs (no tributary match) parked in a rightmost "unmapped" column. Triggered by `S` key or `◈ Snap river` toolbar button.

### Level-of-detail

- Zoom ≥ 0.6: full card with mini-chart.
- Zoom 0.3–0.6: card collapses to status-glyph + hub name.
- Zoom < 0.3: glyph only; gates collapse to dots; tributary footer hides.

## CoScout integration

### Tool registry additions (`packages/core/src/ai/prompts/coScout/tools/registry.ts`, 25 → 27)

```ts
critique_investigation_state: {
  definition: {
    type: 'function',
    name: 'critique_investigation_state',
    description:
      'Identify gaps in the investigation: hypotheses missing disconfirmation attempts, open questions lacking a hypothesis, promising columns not yet hypothesized, stale questions. Returns structured gap array.',
    parameters: { type: 'object', properties: {}, additionalProperties: false, strict: true },
  },
  classification: 'read',
  phases: ['investigate'],
},

propose_hypothesis_from_finding: {
  definition: {
    type: 'function',
    name: 'propose_hypothesis_from_finding',
    description:
      'Create a new hypothesis (SuspectedCause hub) seeded with an existing finding as first evidence. Condition auto-derives from findingSource. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        finding_id: { type: 'string' },
        hypothesis_name: { type: 'string', description: 'Short analyst-ready label' },
      },
      required: ['finding_id', 'hypothesis_name'],
      additionalProperties: false,
      strict: true,
    },
  },
  classification: 'action',
  phases: ['investigate'],
},
```

### Tier 2 coaching prompt (mode-aware, new module in `ai/prompts/coScout/tier2/`)

Applied when investigation phase is active regardless of Wall-vs-Map view (coaching is view-agnostic; the underlying discipline applies to both):

> When the analyst is in the Investigation phase:
>
> - Prioritize disconfirmation over confirmation. Flag hypotheses with ≥3 supporters and no attempted contradictor.
> - For each hypothesis without a guiding question, propose one.
> - When best-subsets reveals a column with ΔR²adj > 0.10 that no hypothesis covers, suggest adding it.
> - Never describe hypotheses as "root causes" — say "contributions" or "suspected causes".
> - Reference chart elements via REF tokens (ADR-057), never raw row indices.
> - Describe interaction findings as ordinal or disordinal — never "moderator" or "primary".

### Visual grounding (ADR-057)

Stable REF tokens exposed by Wall primitives:

- `ref:wall/hub/{hubId}/minichart` — hub card's embedded chart
- `ref:wall/hub/{hubId}/minichart/brush/{findingId}` — brushed highlight region
- `ref:wall/gate/{gatePath}/badge` — HOLDS X/Y badge
- `ref:wall/problem/cpk` — Problem card Cpk label
- `ref:wall/tributary/{tributaryId}` — footer chip

CoScout output referencing these renders as clickable pills that scroll-focus the target.

## Terminology (P5 amended — enforced by ESLint `no-root-cause-language`)

- Never "root cause" in prompts, UI strings, tool descriptions, or comments.
- Use **contribution** (primary), **convergence**, **causation**, **suspected cause** (for hubs specifically).
- The visual root metaphor (roots-below-waterline picture) is retained — it's a picture, not a phrase.
- UI labels: "Convergence branches", "Contribution tree", "Causation gate".

## Collab (V1 subset from ADR-061)

Reuses the ADR-061 SSE append-only pattern for **async hub comments**.

- Each comment event: `comment.appended { scope: 'finding' | 'hub', targetId, comment: FindingComment }`.
- Storage: scoped to the object where the comment was made (`Finding.comments` OR `SuspectedCause.comments`). No data migration; `FindingComment` type unchanged.
- Hub card view: aggregated selector `selectHubCommentStream(hubId)` merges the hub's own comments with comments on all its linked findings, interleaved chronologically, labeled with source.
- Finding chip view: shows only its own comments (unaggregated).
- Offline: posts queue in `wallLayoutStore.pendingComments[]`, flush on SSE reconnect.

Out of V1 (separate spec): live presence avatars, real-time shared gate/hub mutations.

## Tests

| Layer        | Framework                      | Key files                                                                                                                                                           |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure compute | Vitest, deterministic PRNG     | `@variscout/core` — `hypothesisConditionEvaluator.test.ts`, `andCheck.test.ts`, `proposeDisconfirmationMove.test.ts`, `deriveConditionFromFindingSource.test.ts`    |
| Selectors    | Vitest                         | `@variscout/stores` — `wallSelectors.test.ts` (selectHubCommentStream, selectHypothesisTributaries, selectOpenQuestionsWithoutHub, selectQuestionsForHub)           |
| Store        | Vitest                         | `@variscout/stores` — `wallLayoutStore.test.ts` (rehydration, undo/redo patches, IndexedDB persistence, SSE offline queue)                                          |
| Components   | Vitest + React Testing Library | `@variscout/charts` — `InvestigationWall/__tests__/` for HypothesisCard, GateBadge, QuestionPill, WallCanvas, FindingChip, ProblemCard, NarratorRail                |
| Integration  | Vitest + RTL                   | PI Panel Questions tab parity after _Promote to hypothesis_; toggle preserves selection state across `map ↔ wall`                                                   |
| E2E          | Playwright (`claude --chrome`) | `apps/pwa/e2e/wall.spec.ts` — full flow: open Investigation → toggle Wall → create hypothesis → pin finding → compose AND gate → Run AND-check → verify HOLDS badge |

**Invariants:**

- `vi.mock()` BEFORE component imports (infinite-loop prevention).
- No `Math.random` in any new code or test. Seeded PRNG in evaluator tests.
- `toBeCloseTo(expected, precision)` for float assertions in AND-check.
- Stats functions return `number | undefined`, never `NaN` / `Infinity` (ADR-069).
- ESLint `no-root-cause-language` and `no-interaction-moderator` must stay green.

## i18n

New message catalog additions in `packages/core/src/i18n/messages/` (all locales, English first; non-English falls back to English via the existing loader):

```ts
wall: {
  toggle: { map: 'Map', wall: 'Wall' },
  toolbar: {
    newHypothesis: 'New hypothesis',
    newQuestion: 'New question',
    runAndCheck: 'Run AND-check',
    snapRiver: 'Snap to river',
    fit: 'Fit',
  },
  status: { proposed: 'Proposed', evidenced: 'Evidenced', confirmed: 'Confirmed', refuted: 'Refuted' },
  gate: { and: 'AND', or: 'OR', not: 'NOT', holds: 'Holds {{held, number}} of {{total, number}}' },
  problem: { cpk: 'Cpk {{value, number}}', events: '{{count, number}} events/wk' },
  missing: {
    title: 'Missing evidence · the detective move nobody ships',
    noDisconfirmation: '{{hypothesis}} has no disconfirmation attempted. {{suggestion}}',
    noGemba: '{{hypothesis}} has data but no gemba.',
    staleQuestion: '{{question}} has been open {{days, number}} days with no movement.',
    orphanQuestions: "{{count, number}} open questions aren't linked to any hypothesis. Review and promote?",
  },
  empty: {
    title: 'Start with a hypothesis',
    writeOne: 'Write one',
    promoteFromQuestion: 'Promote from a question',
    seedFromFactorIntel: 'Seed 3 from Factor Intelligence',
  },
  coach: {
    brushStep: 'Brush an I-chart region to pin a finding.',
    proposeStep: 'Right-click a finding to propose a hypothesis.',
    connectStep: 'Drag two hypotheses into an AND gate to check convergence.',
  },
}
```

Per `adding-i18n-messages` skill: Intl API for formatting; no string concatenation; tests register their own loaders via `import.meta.glob`.

## Migration

Zero data migration. All schema additions are optional fields that default to `undefined` / `[]` for existing projects. Azure Blob storage keys unchanged. No schema version bump.

| Addition                                      | Migration behavior                                         |
| --------------------------------------------- | ---------------------------------------------------------- |
| `SuspectedCause.condition?`                   | Absent → auto-derives on first Wall render                 |
| `SuspectedCause.tributaryIds?`                | Absent → selector falls back to column-matching derivation |
| `SuspectedCause.comments?`                    | Absent → renders empty thread                              |
| `investigationStore.problemContributionTree?` | Absent → no gate badge on Problem card                     |

## Error states

| Trigger                                        | UI behavior                                                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| No ProcessMap (user skipped FRAME)             | Onboarding overlay: "Build a Process Map in Frame first" with deep link. Canvas disabled.                              |
| No CTS column defined                          | Problem card shows "Set a CTS column in Frame" prompt. Wall usable for hypothesis authoring; AND-check disabled.       |
| Hub has condition but column missing from data | Hub card shows `⚠ Condition references missing column` badge. Excluded from AND-check. Editable via condition builder. |
| AND-check over empty data window               | Badge shows `—/0` (em-dash). No divide-by-zero.                                                                        |
| IndexedDB unavailable                          | `wallLayoutStore` falls back to in-memory. Warning toast on session start. Canvas positions reset on reload.           |
| SSE connection lost                            | Comment thread shows offline indicator. Posts queue in `pendingComments[]`, flush on reconnect.                        |
| Best-subsets compute timeout                   | Silent. Next debounce cycle retries. CoScout suggestion omitted.                                                       |
| Invalid HypothesisCondition after manual edit  | Validation error on save. Reverts to last valid.                                                                       |

## Accessibility

- All interactive nodes focusable; `Tab` order follows Snap-to-River visual flow.
- `aria-label` on every node including status (e.g., `"Hypothesis H1 · confirmed · 3 findings · nozzle runs hot on night shift"`).
- Right-click menus keyboard-accessible via `Shift+F10` / context menu key.
- Canvas zoom/pan via `+`/`-`/arrow keys when canvas focused.
- `prefers-reduced-motion` disables drop-animation for finding chips.
- WCAG AA contrast on all status colors; color never sole differentiator (status text + glyph present).

## Performance

- SVG up to 50 nodes; switches to WebGL at >50 (reuses EvidenceMap threshold).
- AND-check compute cached by structural + filter + data hash. Recomputed only on mutation.
- Mini-charts use existing LTTB downsampled sparkline primitive (per `editing-charts`).
- Best-subsets background job runs on main thread debounced 2s; optional Web Worker offload if CoScout flags it.
- IndexedDB writes batched 200ms.

## Out of scope (named for future specs)

| Deferred                                | Reason                                                                       | Likely spec                                  |
| --------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| Live presence avatars / cursors         | Needs new connect/heartbeat protocol beyond ADR-061's append-only model      | `adr-###-collab-presence`                    |
| Real-time shared mutations (gate edits) | Needs CRDT/OT                                                                | Same as above                                |
| Per-step Cpk / capability flow          | Needs `ProcessMap.nodes[].{lsl, usl, target}`                                | `adr-###-frame-step-specs` (extends ADR-070) |
| Wall → Improve handoff                  | SuspectedCause hubs already drive HMW per ADR-061; only wiring tweaks needed | Follow-on                                    |
| Bayesian probability badges on status   | Interesting but out of vision (status is discrete here)                      | Research                                     |

## Definition of done

- [ ] Toggle `Map | Wall` wired in Investigation workspace (PWA + Azure apps).
- [ ] Problem condition card reads from `processMap.ctsColumn` + live Cpk.
- [ ] Hub cards render with embedded LTTB mini-charts, status-tinted borders (Proposed/Evidenced/Confirmed/Refuted).
- [ ] Question pills render for orphan questions; right-click _Promote to hypothesis_ creates hub with seeded findings.
- [ ] AND-check compute runs; HOLDS X/Y renders on gate badges; click badge highlights matching rows.
- [ ] Auto-condition-derivation from `findingSource` works for all five chart source kinds.
- [ ] Background best-subsets emits CoScout `best-subsets-candidate` suggestions at ΔR²adj > 0.10.
- [ ] Disconfirmation critique emits per-hub nags with complementary brush suggestions.
- [ ] New CoScout tools (`critique_investigation_state`, `propose_hypothesis_from_finding`) registered and gated to `investigate` phase.
- [ ] Tier 2 coaching prompt extended with Investigation discipline bullets.
- [ ] Async hub comments post via SSE using ADR-061 pattern; hub card view aggregates finding comments via selector.
- [ ] Snap-to-river layout, Fit-to-screen, LOD, `⌘K` search, cluster grouping, minimap implemented.
- [ ] Keyboard shortcuts + undo/redo in `wallLayoutStore`.
- [ ] Mobile/tablet list rendering (same graph, second projection).
- [ ] Empty state with three CTAs (Write one / Promote from question / Seed 3 from Factor Intelligence).
- [ ] All listed test layers green; ESLint `no-root-cause-language` + `no-interaction-moderator` green.
- [ ] i18n keys in all locale catalogs (English first, others fallback).
- [ ] ADR-066 parity: default view remains Map; toggle persists per project.
- [ ] E2E `apps/pwa/e2e/wall.spec.ts` passes on `claude --chrome`.

## Open questions

- Gate badge interaction when a gate contains another gate — does clicking the outer badge recursively expand child HOLDS? Proposed: yes, with a small disclosure chevron.
- Mobile interaction for drag-compose gates — two-finger lasso then menu? Confirm with usability test.
- Whether to ship an optional "Hide Evidence Map from toggle" preference for users who commit to Wall workflow.

## References

- Design handoff: `~/Downloads/process-thinking 2/` (Claude Design, 5 HTML prototypes + shared CSS/JS)
- ADR-029 — AI Action Tools for CoScout (25-tool registry)
- ADR-053 — Question-Driven Investigation
- ADR-057 — Visual Grounding (REF markers)
- ADR-061 — HMW Brainstorm & Collaborative Ideation (SSE pattern)
- ADR-066 — Evidence Map as Investigation Workspace Center
- ADR-067 — Unified GLM Regression (two-pass best subsets)
- ADR-068 — CoScout Cognitive Redesign (modular prompts)
- ADR-069 — Three-Boundary Numeric Safety
- ADR-070 — FRAME Workspace & Visual Process Map
