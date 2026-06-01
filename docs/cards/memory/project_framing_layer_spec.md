---
title: 'Framing Layer Spec (Spec 1 of canvas-detail decomposition) — ARCHIVED 2026-05-26'
description: 'docs/archive/specs/2026-05-03-framing-layer-design.md (status archived 2026-05-26 under wedge V1 / ADR-082). V1 delivered partially — slices 1+2+3 fully shipped; slice 4 Pareto→Stage5 chain retired as unwired scaffolding (PR'
purpose: remember
tier: card
status: active
date: 2026-06-01
topic: [memory, project]
related: []
verified-against-commit: fe1b0755
last-verified: 2026-06-01
source-hash: 44238374dcd90c89
origin-session-id: 503ee542-f216-48e3-9706-8b2aaf6de3ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_framing_layer_spec.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## ARCHIVED 2026-05-26 — wedge V1 supersession

Spec frontmatter flipped `status: active` → `status: archived` (PR #210). Wedge V1 (ADR-082) defines 3 canvas response paths (Investigate / Quick Action / Charter) triggered from canvas L2→L3 — supersedes the slice-4 Pareto-bar-click → StageFiveModal chain.

**Slice 4 disposition (PR #210):**

- **Retired** (deleted, no app ever wired): `ParetoMakeScopeButton` component + tests; `onMakeInvestigationScope` + `onScopeFilterClick` props on `ParetoChartWrapperBase`; `useStepDefectPareto` hook + tests; `buildIssueStatement` helper.
- **Retained** (live production consumers): `StepDefectIndicator` (CanvasStepCard), `useCanvasFilters` + `useSessionCanvasFilters` + `CanvasFilterChips` (CanvasWorkspace), `ScopeFilter` type, `StageFiveModal` itself (Mode B Stage 3 + on-demand canvas chrome).
- **`existingRange` carry-forward** from slice 3 was already closed before this archive (Azure + PWA both pass `mostRecentSnapshot?.rowTimestampRange` to `classifyPaste`).

**Future canvas-filter writers**, if ever needed, must be re-designed under the wedge response-path model — not by reviving this spec. See `docs/decision-log.md` §1 "Framing Layer slice 4 archive" 2026-05-26 entry for the full retired-vs-retained inventory.

**Historical content below preserved as durable design context.**

---

The first concrete spec from the canvas-detail decomposition. Covers everything BEFORE canvas authoring proper. Lives at `docs/superpowers/specs/2026-05-03-framing-layer-design.md` (status: draft, commit `7d4ebf1b`).

**Two-layer model:**

- Hub-level (durable across investigations): process goal narrative + outcome measure(s) + specs (customer-driven, no σ-based suggestions) + primary scope dimensions
- Investigation-level (episodic): Issue → Question → Hypothesis (CTP→CTQ shape) → Evidence → Finding

The mental model the analyst learns over years: *"Why does this process exist? How is it doing against that purpose? Where is it deviating? Is the deviation explained? Did our action close the gap?"* — Watson VOC at the door of the product.

**Mode B — first-time Hub creation, 5 stages:**

1. Goal narrative (free-text + scaffold chips: "+Purpose / +Customer / +What matters")
2. Paste/upload (existing UX)
3. Outcome confirmation with inline distribution sparkline + data quality + per-candidate inline specs (no σ defaults — placeholders say "from customer spec") + primary scope dimensions sub-step
4. Canvas first paint (Spec 2 territory; this spec ends here)
5. Investigation entry (floating modal, optional, with "skip → observation-triggered EDA" path → Constitution P5 entry point #3)

**Mode A — reopening existing Hub, 3 sub-cases:**

- A.1 reopen-only → straight to canvas
- A.2-paste → match-summary card with timeline preview + 2-axis classifier (source × temporal); blocks on overlap and different-grain
- A.2-evidence-source → background ingestion with "X new snapshots ↑" indicator (Azure-only per Q8)

**Match-summary card 2-axis classifier:**

- Source axis: same source / different source · joinable via shared key / different source · no key (suggest new Hub) / mixed
- Temporal axis: append / backfill / overlap (BLOCK) / replace / no timestamp / different grain (BLOCK)
- Block cases force user to choose; never silently merge incompatible data
- Reuses shipped `suggestNodeMappings` engine + `TimelineWindow` primitive

**Multi-source via shared keys:**

- Hub spine = process line; multiple sources (production telemetry + QC inspection + maintenance logs) join via lot_id / batch_id / part_id / serial
- Per-source provenance per row (source / origin / imported_at / row_timestamp / snapshot_id / join_key)
- Per-source independent timelines (V1; V2 derives lot windows from telemetry)
- Industry analogs: Celonis case ID, fact+dim foreign keys, time-series + event correlation

**Defect data + Pareto on canvas:**

- Multi-anchor: per-step rejects (anchored to step nodes) + end-of-line / outcome defects (pinned at right)
- Per-step mini-Pareto chips render on step cards with rejection data
- System Pareto card on outcome pin with TWO pickers in the header:
  - Group by (X axis): defect_type / product_id / lot_id / supplier / etc.
  - Weighted by (Y axis): adapts to active mode lens (count / time / cost / severity / Cpk gap / %OOS / σ-distance / time)
- Click bar → canvas-wide scope filter; multi-select supported
- "Make this the investigation scope" → promotes to Stage 5 with issue auto-filled
- Edge case (no group-by dimension): Pareto card omitted; canvas stays clean
- Without defect data: Pareto Y axis becomes %OOS / Cpk gap / σ-distance — same scope-selection mechanic, capability-mode flavor

**Three composable canvas filter states:**

| State | Source | Persistence |
| --- | --- | --- |
| Time window | TimelineWindow filter | Per-investigation |
| Scope filter | Pareto bar selection (or chip add) | Per-investigation |
| Pareto group-by | Picker setting | Per chart card; investigation-scoped |

All declarative, all composable, no new aggregation primitives. ADR-073 holds: per-(node × context-tuple × scope) buckets stay heterogeneity-aware.

**Engine reuse — almost no new infrastructure:**

- `detectColumns()` + `inferMode()` — Stage 3 outcome detection
- `validateData()` + DataQualityReport — inline missing-pct + NaN/Inf flags
- `suggestNodeMappings` — match-summary card column-shape match
- `SpecEditor` + `InlineSpecEditor` — Stage 3 spec inputs
- `TimelineWindow` primitive — match-summary timeline preview
- `ParetoChart` + `StepErrorPareto` — canvas-attached Pareto
- `useFilterHandlers` / `applyFilter` — cross-chart filter propagation extended to canvas
- Investigation entities (Question, SuspectedCause, CausalLink, Finding) — investigation-grammar primitives

**New surfaces this spec introduces:**

- Framing card / Stages 1, 3, 5 forms in the entry-to-canvas path
- Match-summary card with two-axis classifier
- Join-key suggestion sub-card for multi-source detection
- Per-row provenance fields
- `primaryScopeDimensions` Hub config field
- Pareto two-picker header (group-by + weighted-by)
- "Make this the investigation scope" affordance from Pareto selection

**Out of scope (sibling specs):**

- Spec 2 — Manual canvas authoring (drag-to-connect, sub-step grouping, branch/join)
- Spec 3 — Cards / drill-down / mode lenses (drill-down floating overlay UX, mode-lens reskin)
- Spec 4 — Canvas overlays (investigations / hypotheses / suspected causes / findings) + Wall projection sync
- Spec 5 — IndexedDB persistence schema for PWA Hub-of-one

**V1 / V2 delivery phasing (§15 of spec):**

V1 = the design above. V2 = auto-detect join keys via value overlap (no name heuristic), hierarchical temporal alignment (lot windows), late-arriving data reconciliation, time-travel queries, composite group-by (heatmap Pareto), Pareto trend over time, severity-weighted axis (Watson G11 methodology addendum), linked Hubs (Option C), industry templates, "Paste spec table" bulk import.

**Verification (§16):** explicit acceptance criteria for end-to-end Mode B + Mode A + defect/Pareto + graceful degradation + engine reuse + methodology guards (CI-checkable: no σ-based LSL/USL suggestions; no silent merge on overlap or different-grain; per-row provenance present; ADR-073 structural absence preserved).

**Visual companion mockups** archived locally at `.superpowers/brainstorm/6149-1777834116/content/` (gitignored): framing-layer-flow-v4.html (Stage 3 inline specs); mode-a-temporal-alignment.html; multi-source-join.html; pareto-on-canvas.html; pareto-multi-product.html; pareto-no-defects.html.

**Predecessor brainstorm:** vision §8 walkthrough at `~/.claude/plans/lets-do-this-next-rustling-simon.md`. Inherits Q0 + Q1–Q11 anchors.

**Next:** writing-plans cycle for V1 implementation slice. Likely sliced further within V1 (Hub data model + Stage 1/2/3 + canvas first paint as the smallest end-to-end → then Mode A.2-paste + match-summary card → then multi-source + Pareto-on-canvas).

## Q8 revised (2026-05-03 commit 1ffc5d92)

Original Q8 wording was too aggressive. R6d supersedes the intermediate browser-persistence option before launch: PWA is session-only, and durable PWA work is user-owned `.vrs` export/import only. `.vrs` files double as **shareable training scenarios** — trainers package datasets + Hub state for students to import via LMS / email. Constitution P1 (browser-only processing) and P8 (no AI in free tier) preserved. Companies still use Azure tier for centralized + secure persistence per ADR-059. `apps/pwa/CLAUDE.md` now defines PWA durability as `.vrs` backup/share/start-import only.

## Slice 1 — MERGED 2026-05-04 (PR #121)

Plan at `docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1.md`. Branch `framing-layer-v1-slice-1` squash-merged to main via PR #121 (20 commits → 1). Subagent-driven execution: Sonnet for most implementer + spec/quality reviewer dispatches; Opus for two integration tasks (PWA App.tsx + Azure ProcessHubView wiring) + final code-reviewer.

**Locked decisions** are permanent at `docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1-decisions.md` (D1 AnalysisBrief unchanged; D2 PWA persistence opt-in; D3 multi-outcome validateData; D4 deterministic goal-context biasing; D5 Mode A.1 reopen gated by opt-in flag).

**Foundation shipped on main:**

- ProcessHub schema gains `processGoal?: string`, `outcomes?: OutcomeSpec[]`, `primaryScopeDimensions?: string[]`. New `OutcomeSpec` interface + `CharacteristicType = 'nominalIsBest' | 'smallerIsBetter' | 'largerIsBetter'` (in `processHub.ts`, distinct from the pre-existing `CharacteristicType = 'nominal' | 'smaller' | 'larger'` in `core/types.ts` — disambiguated via new `@variscout/core/processHub` sub-path export, NOT root barrel).
- `extractHubName` (≤50 char word-boundary truncation of first sentence).
- `detectColumns` accepts `goalContext?: string`; deterministic keyword-overlap bonus added at weight 0.5 on top of existing scoring. New `core/parser/stopwords.ts` with `tokenize` helper.
- `validateData` refactored from single-outcome to `outcomeColumns: string[]` returning `perOutcome: Record<string, PerOutcomeQuality>`. ALL 9 production callers updated in same PR (no back-compat overload, per `feedback_no_backcompat_clean_architecture`).
- `inferOutcomeCharacteristicType` + `defaultSpecsFor` + `DataStats` (in `core/specs/characteristicTypeDefaults.ts`). **Renamed** from plan's `inferCharacteristicType` to avoid collision with existing `inferCharacteristicType(specs: SpecLimits)` in `core/types.ts`.
- `suggestPrimaryDimensions` (cardinality 3–50 + 13 name-keywords).
- `.vrs` round-trip serialization: `vrsExport(hub, rawData?, metadata?)` + `vrsImport(json)` + `VrsFile` type + `VRS_VERSION = '1.0'`.
- 6 UI components in `@variscout/ui`: `HubGoalForm`, `OutcomeCandidateRow` (with inline `Sparkline`), `PrimaryScopeDimensionsSelector`, `OutcomeNoMatchBanner`, `GoalBanner`, `OutcomePin` (uses `formatStatistic`, NOT `.toFixed` — ESLint `variscout/no-tofixed-on-stats` enforces).
- PWA: Dexie database `variscout-pwa` v1 (tables `hubs` + `meta`); `hubRepository` opt-in API; `SaveToBrowserButton` + `VrsExportButton` + `VrsImportButton`; `sessionStore` React Context (hub + rawData + goalNarrative sentinel `null`/`''`/string); `App.tsx` injects HubGoalForm Stage 1 between paste and ColumnMapping; Mode A.1 reopen restores Hub from IDB on opt-in flag true.
- Azure: `GoalBanner` (read-only) mounted above ProcessHubView tabs; Dexie schema bumped 6→7 (no-op).
- Spec `docs/superpowers/specs/2026-05-03-framing-layer-design.md` status flipped draft→active.

**Deferred to slice 2** (decision-log row 136):

- Stage 3 ColumnMapping refactor — wiring `OutcomeCandidateRow` / `PrimaryScopeDimensionsSelector` / `OutcomeNoMatchBanner` into the existing ColumnMapping flow. Plan only sketched Stage3Mapping pseudocode.
- Canvas first-paint `OutcomePin` rendering — waits on `hub.outcomes` being populated, which Stage 3 refactor delivers.
- **Mounting the three PWA buttons** in chrome — they're tested + scaffolded but currently unreachable from the UI. Final reviewer flagged this as Important; explicit slice-2 surfacing call needed.
- Azure `HubCreationFlow` + Dashboard "+ New Hub" — plan was sketch-only.
- Mode B Playwright E2E (`.skip`-ed at `apps/pwa/e2e/modeB.e2e.spec.ts`).
- `GoalBanner.onChange` wiring on Azure side (ProcessHubView doesn't currently receive a hub-update callback).

**TODO markers in shipped code:** one in `apps/pwa/src/App.tsx` (`handleMappingConfirmWithGoal`) and one in `apps/azure/src/components/ProcessHubView.tsx` — both labeled `TODO(slice-2)`.

## Slice 2 — MERGED via PR #122 (Mode B close-the-loop)

Renamed from spec §17's "slice 2 (everything)" to just the close-the-loop scope. ColumnMapping refactor to canonical Hub-level mapper (multi-outcome `OutcomeSpec[]` + `primaryScopeDimensions[]` payload), Azure HubCreationFlow shipped, PWA framing toolbar mounted, ProcessHubView amber CTA → Editor paste flow (decision-log entry 2026-05-04 supersedes the plan's inline-panel design — see `feedback_check_shipped_patterns_first`). Two Azure E2E tests skipped pending portfolio-state fixtures (closed in slice 3).

## Slice 3 — MERGED via PR #123 + docs follow-up PR #124

Combined original-slice-2 carry-forward (match-summary card + evidence-source ingestion + Stage 5 modal + provenance) **plus** original-slice-3 (multi-source via shared keys) **plus** the 2 portfolio-state E2E unskips. 33 commits across 6 phases (P0–P5).

**Architectural facts (durable):**
- **D6 (ADR-077):** snapshot-level provenance fields (`origin`, `importedAt`, optional `rowTimestampRange`) on `EvidenceSnapshot`. Per-row `RowProvenanceTag = { source, joinKey }` only attaches via sidecar `Map<rowIndex, RowProvenanceTag>` on the analysis store, only when a multi-source join occurs. Single-source paste pays no per-row tax. Industry-standard fact-table + dimension-table pattern; ADR-073 honored via per-source independent timelines.
- **D9 (ADR-077):** `MatchSummaryCard` from `@variscout/ui` replaces `confirmReplaceIfNeeded` for paste-into-existing-Hub when `isProcessHubComplete(hub) === true`. File upload + sample-load paths retain `window.confirm` (out of scope per spec §17).
- **D7:** `StageFiveModal` collects `AnalysisBrief` (issue / question / hypothesisDraft) — `AnalysisBrief` now lives at `@variscout/core/findings` (moved from UI per slice-1 D1 promise). "Open investigation →" creates Question via existing `addQuestion` action; "Skip" lands on canvas. `+ New investigation` button on canvas chrome opens the same modal in `mode-a-on-demand`.
- **D8:** Azure A.2-evidence-source uses on-open polling — `useEvidenceSourceSync` reads cursor from new `evidenceSourceCursors` Dexie table (compound key `[hubId+sourceId]`, schema v8), fetches `listEvidenceSnapshotsFromCloud`, computes diff, exposes `newCount`/`newSnapshotIds`/`markSeen`. Webhooks/scheduled pulls deferred to V2.
- **`@variscout/core/matchSummary` sub-path** holds the entire engine: `classifyPaste` (2-axis classifier), `rankJoinKeyCandidates`, `createSnapshotProvenance` factory (50K-row safe via fused min/max + canonical `parseTimeValue`), `archiveReplacedRows` helper.
- **`useStageFiveOpener` hook** intentionally duplicated in PWA + Azure for slice 3 (slice 4 may dedupe to `@variscout/ui/hooks/`).
- **`Editor.startPasteOnMount` prop** wires the "Add framing" CTA on incomplete-hub portfolio cards through to a paste-textarea-ready Editor view.

**Carry-forward to slice 4:**
- Defect anchoring (multi-anchor) + canvas-attached Pareto (per-step mini + system) with two pickers (group-by + weighted-by) + Y-axis adapts to mode lens
- Three composable canvas filter states UI (time window + scope + Pareto group-by chip rows)
- **`existingRange` wiring** — both wedges in `usePasteImportFlow.ts` and `useEditorDataFlow.ts` currently pass `existingRange: undefined` to `classifyPaste`, which means the overlap-replace path is structurally correct + unit-tested but **unreachable from real user paste flow** until the active hub's most-recent `EvidenceSnapshot.rowTimestampRange` is threaded into the context. Logged in `docs/decision-log.md` 2026-05-04 entry.
- Promote framing-layer spec from `status: active` → `status: delivered` (deferred per `docs/decision-log.md` 2026-05-04 entry; promote after slice 4 lands).
- Optional: dedupe the `useStageFiveOpener` hook to `@variscout/ui/hooks/`.

**Slice 4 entry point:** brainstorm session can start from spec §9 (defect anchoring + Pareto integration) and §10 (three composable filter states). Engine reuse patterns: `ParetoChart` + `StepErrorPareto` from production-line-glance C2 already shipped. Mode-lens Y-axis adaptation per `analysisStrategy.ts` is the dispatch pattern.
