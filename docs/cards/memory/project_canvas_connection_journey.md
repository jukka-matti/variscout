---
title: 'canvas-connection-journey'
description: 'Spec 2 of Framing Layer V2 — canvas-based onboarding from paste to ready-to-analyze (Process tab Edit mode). Phases A + B + C + D1 + D2 + D3 + E1 + F1 all shipped (merged via PRs'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 5da402ce5bc6d841
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_canvas_connection_journey.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

> **Vocabulary note (2026-05-27):** PR #218 renamed `Investigation`→`Analyze` (tab), `Analyze (EDA)`→`Explore` (tab), `Sustainment`→`Control` (stage). The body of this memory still uses the OLD names below in spots ("Investigation Wall", "Sustainment" stage references) — these were canonical at write time. The "Investigation Wall" surface name IS preserved post-rename (methodology brand). For current vocabulary truth see [[wv1-nav-rename]] + [[wedge-v1]] 2026-05-27 amendment. The "Explore" references in §3.1.2 chip context menus + the F-phase "→ Explore exit" predate the rename and are now natively coherent.

VariScout's Process tab has two modes: **State** (read-mostly L1/L2/L3 pan-zoom — shipped via 8f Canvas Viewport Architecture, PRs #160–#168) and **Edit** (the canvas-based authoring layer — designed 2026-05-26 in a customer-hat brainstorm session). Spec 2 of the Framing Layer V2 fully specifies Edit mode; PR-CCJ-A1 shipped the first slice (wedge spec amendments + persona doc updates).

**Canonical sources** (read in this order):

- Spec: `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` (707 lines, 10 sections)
- Companion plan: `docs/superpowers/specs/2026-05-26-framing-layer-v2-master-plan.md` (sequences Specs 2 → 5 of Framing Layer V2)
- Implementation master plan: `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` (15 PRs across 8 phases)

**Core design locks (Spec 2):**

- **Canvas is the primary surface; shape is invisible.** Shape categories (multi-step process / product-quality / defect / batch / time-series) NEVER appear in UI — they emerge from where the user connects columns. Inverts Framing Layer Spec §5.3.3 graceful-degradation framing (canvas-as-fallback) to make canvas the front door.
- **Three user cognitive tasks become canvas sections:** "What do I have" (palette) / "What do I want to analyze" (outcomes + factors zones) / "How does it fit the process" (process structure). User's words; user's model.
- **State / Edit mode split.** Spec 2 = Edit mode (the authoring surface that configures the Hub). State mode (L1/L2/L3) = shipped. Edit configures what State renders.
- **Design principle "Reuse existing surfaces over inventing new ones"** — applied 4 times during design (stages 1/3/5 fold into canvas affordances; parsing → chip badges; shape → emergent; bin/calc/time → per-chip context menus). Every application made the design simpler. Promote reflexively.
- **Step-bound symmetry:** outcomes AND factors can be global (drop in zone) OR step-bound (drop on step). Same drag gesture, four positions, two roles.
- **Parsing UX:** auto-detect aggressively, show interpretation directly on chip, override on demand via `▾`. ⚠ only for genuinely-low-confidence cases (mixed formats, < 70% parse rate, truly ambiguous dates without disambiguating values).
- **Inflection-point binning** lives in **Probability Plot lens only** (not histogram — one feature, one home). User can add/remove cuts manually. KDE valley detection OR change-point on sorted data.
- **2-tier ACL:** Lead + Everyone-else (Member + Sponsor functionally identical at ACL layer). NO in-product approval gates; signoff is out-of-band per wedge spec line 288. Sponsor preserved as identity / notification routing / Report attribution — not for gating.
- **Issue Statement vs Problem Statement** are distinct code concepts. Issue captured at Charter (free-text, ≤ 500 chars, `AnalysisBrief.issueStatement`); Problem Statement auto-synthesized in Approach via `buildProblemStatement()` from Watson's 3 Qs, with maturity stages `partial → actionable → with-causes`.
- **Promote-to-Project from 5 entry points** (Home, Explore, Investigation, Canvas L3, Project tab). Same Charter modal; different inherited context per entry.
- **3 response paths at Canvas L3:** Capture as Finding / Investigate / Charter (record → explore → commit gradient). **Retires the wedge spec's "Quick Action".**
- **Exit "→ Explore":** soft gate on Y outcome; destination smart-routes based on configured state (Y only → I-Chart; Y + factor → I-Chart + Boxplot; Y + process structure → step-aware view).
- **Derived chips** (✨ marker): `Lead_time` / `Total_work_time` / `Wait_time` auto-derived from step timings (default home L2 — flow metric); calculated columns from formula builder with batch-ratio + DPMO templates; time decomposition (`Date.week`, `Date.day-of-week`, etc.). Any derived chip can be promoted to L1 by dropping as global outcome.

**Six wedge-spec amendments** accumulated by the brainstorm (enumerated in Spec 2 §8.1):

1. §3.3.4 — retire Quick Action → Capture as Finding (record → explore → commit)
2. §3.2 — Charter UI: "Problem statement" → "Issue statement" (per code vocabulary)
3. §3.0 — retire "promoted from validated hypothesis" framing
4. §4.1 + canAccess.ts — collapse to 2-tier ACL
5. Sponsor persona doc — remove "skips Analyze + Investigation entirely"
6. Tab vocabulary positioning (Explore / Analyze / Control) — DEFERRED to a separate vocabulary session

PR-CCJ-A1 (3 commits: `4b236204` + `28bbdecd` + `1dd58bea`, all main, 2026-05-26) landed amendments 1–5 in: wedge spec body / Sponsor + Lead personas / ia-nav-model / glossary / ADR-082 migration table. **PR-CCJ-A1.5 PENDING** — doc-sweep follow-up; A1 scope was too narrow. ~10 more canonical anchors still carry stale "Sponsor = Report-only" / "Quick Action" / "promoted from validated hypothesis" framings: `docs/OVERVIEW.md`, `docs/DATA-FLOW.md`, `docs/01-vision/positioning.md`, `docs/01-vision/business-bible.md`, `docs/01-vision/variscout-process/*` (methodology, monitoring, scope-line, four-personas), `docs/03-features/specifications.md`, `docs/07-decisions/adr-082-wedge-architecture.md` line 42 prose, `docs/02-journeys/personas/lead.md` line 63 cascade paragraph. Plus `docs/cards/memory/project_wedge_v1.md` (card — append-only; needs supersession card not in-place edit).

**Implementation roadmap — 15 PRs across 8 phases** (full details in master plan):

| Phase | PRs                            | Size estimate (parallel) |
| ----- | ------------------------------ | ------------------------ |
| A     | A1 ✓ · A2 · A3                 | parallel-safe; 3 days    |
| B     | B1 · B2                        | 7–10 days                |
| C     | C1 · C2 · C3 (sequential)      | 10–14 days               |
| D     | D1 · D2 · D3 (mostly parallel) | 7–10 days                |
| E     | E1                             | 5–7 days                 |
| F     | F1                             | 2–3 days                 |
| G     | G1 (parallel-safe with B–F)    | 5–7 days                 |
| H     | H1                             | 3–4 days                 |

Critical path: A2 → B1 → B2 → C1 → C2 → C3 → E1 → F1 → H1. ~22–28 working days with parallelism; ~30–40 sequential.

**Larger PRs flagged for per-PR `writing-plans` invocation** (likely produce sub-master-plans per `feedback_master_plan_for_multi_subsystem_specs`): B2 (chips + parsing), C3 (process model emergence), D2 (calc engine + modal), E1 (5 entry-point adapters), G1 (inflection detection + UI).

**Cross-cutting concerns** to resolve BEFORE implementation touches L2 journey docs:

- **Vocabulary positioning** — Explore / Analyze / Control naming call (sponsor of: separate session)
- **Lead JTBD restructure** — activity-framed (Frame / Drill / Improve / Verify) vs lifecycle-framed (current). Doc-only fix.
- **Project = IP terminology cleanup** — collapse the muddle in code (`projectsByHub` legacy holdover) and docs.

**Customer validation precondition** (wedge spec §8.3) — surface this design with ≥ 1 improvement-specialist customer BEFORE Phase B investment scales up. Phase A can ship without; Phase B's investment is large enough to justify pausing for validation.

**5 vision-violation findings** from the 2026-05-26 customer-hat walkthrough (logged in `docs/ephemeral/investigations.md`):

1. Mode-1 (quick-analyze) invisible in L2 journeys
2. Lead JTBD lifecycle-framed instead of activity-framed
3. Project = IP muddle ("promoted from hypothesis" framing wrong)
4. Tab vocabulary positioning
5. Sponsor visibility too restrictive (RESOLVED by A1 in wedge spec + personas + ia-nav-model + glossary; A1.5 will propagate)

None of the 5 findings was caught by the morning's 5-lens parallel audit. Pattern: customer-hat reading catches what audit ceremony can't. Companion to [[feedback_audit_findings_need_design_triage]].

**Walkthrough artifact:** `/tmp/variscout-walkthrough.html` was the visual artifact used during the customer-hat session. Transient — not in repo. The visual companion session also produced ~12 mockup HTML files in `.superpowers/brainstorm/58329-1779807568/content/` (gitignored, may be cleaned on session expiry).

**Tasks tracked** (as of 2026-05-27):

- #22 PR-CCJ-A1 — COMPLETED
- #23 PR-CCJ-A2 (canAccess code collapse) — COMPLETED (PR #215)
- #24 PR-CCJ-A3 (IP step-bound types) — COMPLETED (PR #216)
- #25 PR-CCJ-B1 (EditModeShell + canEditCanvas gate) — COMPLETED (PR #217)
- #26 PR-CCJ-B2 (chip + palette + parsing UX) — **COMPLETED**: B2.1 SHIPPED (PR #219, `cd56261a`), B2.2 SHIPPED (PR #220, `dfa84ceb`), B2.3 SHIPPED (PR #221, `a961d867`). Whole master-of-master delivered 2026-05-27.
- #27–#36 — PR-CCJ-C1 through H1 PENDING with dependencies set per master plan
- #37 Mode 1 journey doc — PENDING (cross-cutting)
- #38 Vocabulary positioning session — COMPLETED (closed by PR-WV1-NAV / PR #218 — see [[wv1-nav-rename]])
- #39 Lead JTBD restructure — PENDING (cross-cutting)
- #40 Project = IP cleanup — PENDING (cross-cutting)
- #41 PR-CCJ-A1.5 (doc-sweep follow-up) — COMPLETED
- #42 MEMORY.md update (Spec 2 design session) — COMPLETED
- #43 PR-WV1-NAV (vocabulary rename) — COMPLETED 2026-05-27, PR #218

**Next up:** PR-CCJ-E1 (Charter modal + IP-blob persistence — folds in the deferred persistence TODOs from C3 + D1 + D2 + D3). `processSteps` (C3) + `stepTimings` (D1) + `formulaBindings` (D2) + `timeDecompositionBindings` (D3) all live as local React state in CanvasWorkspace with `TODO(PR-CCJ-E1)` markers, so E1 unifies the persistence story for the entire D-series.

**D3 shipped 2026-05-28 — key outcomes** (PR #227, merge `1d0563a1`, 9 logical commits via `--merge`, single-PR with 3 internal phases + 1 sub-hour bug fix + 1 JSDoc refresh):
- **Engine in `@variscout/core/derived/`**: `TimeDecompositionBinding` flat shape `{ id, sourceColumn, dimensions: TimeDimension[], hourGranularityMinutes? }`. `TimeDimension` union = `'year' | 'quarter' | 'month' | 'week' | 'dayOfWeek' | 'hour'`. `HourGranularityMinutes` = `60 | 30 | 15 | 5`. **No external date library** — `packages/core/src/time.ts` already had `parseTimeValue` (ISO/Excel/Unix), `extractTimeComponents` (year/month/week/dayOfWeek/hour), `getISOWeekNumber`. D3 added only **Quarter** extraction (3 lines: `Math.floor(month/3)+1` → `"Q1"-"Q4"`).
- **`computeTimeDecompositionColumns(rows, binding)`**: returns `Record<string, (string | null)[]>` keyed by `derivedTimeColumnName(source, dim, granularity)`. Spec dot+kebab naming verbatim: `Date.year`, `Date.day-of-week`, `Date.hour-15min`. Sub-hour bucketing is **pure `HH:MM`** (computed inline via `Math.floor(getMinutes()/granularity)*granularity` + `padStart`), NOT `formatTimeBucket('minute', N)` which prepends `"Mon DD "` — the original Task 2 used `formatTimeBucket` and was caught by spec reviewer; fix is `55e0ff9f`. **Null propagation per row per dimension** (unparseable date → null for all dimensions in that row; categorical convention, not NaN).
- **`detectTimeColumns(profiles)`**: filters to `primary?.kind === 'date' && status === 'ok'`; returns `{ count, columns } | null` (null for 0 matches). Powers the system-hint banner.
- **`<TimeAsFactorsModal>`** under `packages/ui/.../Workflows/`: FocusTrap shell mirroring CalculatedColumnModal. Two-step modal: Step 1 = radio across `timeColumns` + "Next →" disabled until pick. Step 2 = 6 dimension checkboxes (Year · Quarter · Month · Week · Day of week · Hour) in spec canonical order, with **Hour granularity sub-picker** inline (60/30/15/5 min; disabled with `title="Check Hour to enable granularity"` when Hour unchecked). **Pre-fill on re-open** (Notion/Figma/Linear standard): existingBinding seeds dimensions + granularity + locks sourceColumn; "← Back" button hidden when bypassed. Live preview computes via `computeTimeDecompositionColumns([rows[0]], binding)` and renders `Year: 2025 · Quarter: Q1 · Month: Jan · ...` inline. Save label: `Save · "{source} factors ({N})" →`. Empty state copy: "No time columns detected. Open a column's ⚙ Parsing & format menu to mark a column as a date." 33 modal tests.
- **System-hint banner**: SystemHintBanner already supported `kind: 'time'` (cyan, 💡 icon) from D2's primitive. D3 just pushes the hint into Palette `systemHints` array when `detectTimeColumns(rawProfiles)` returns non-null. **Singular/plural handled**: `"1 time column detected"` vs `"6 time columns detected"`. **Auto-hides** once every detected date column has a `TimeDecompositionBinding` — once user has decomposed everything, the hint stops nagging.
- **CanvasWorkspace integration**: `derivedTimeDecompositionProfiles` synthesized exactly like D1+D2 (`derived: true`, `derivationSource: 'time-decomposition'`, `primary.kind: 'categorical'`). Merged into `editModeProfiles` after `derivedFormulaProfiles`. **New parallel channel: `categoricalValuesByColumn: Record<string, (string | null)[]>`** alongside D1/D2's `numericValuesByColumn` — V1 contains only time-decomposition derived columns; raw categoricals still flow via `rows`. Channel plumbs CanvasWorkspace → EditModeShell → Palette (passthrough only — F1/H1 will wire downstream Analyze/Explore consumers). 9 e2e tests covering happy-path + round-trip + banner hide-on-full-decomposition + singular/plural + no-date-no-banner.
- **Per-chip kebab `use-as-time-factors`** dispatch in CanvasWorkspace: menu item already existed in `columnChipMenuItems.ts` from D2; D3 added the handler branch + `setTimeFactorsModalOpen({ sourceColumn })`. Save handler dedupes by `sourceColumn` (replace, not append). 9 dispatch tests.
- **Consumer audit for `.`-splitting** (T8 first action): grep'd `\.split(['"]\.['"]\)` across the repo — 4 hits in source, ALL on filenames/JWTs (`fileValidation.ts:52`, `responsesApi.ts:235`, `DocumentRow.tsx:13`, `speechService.ts:35`). Zero hits on column names. Derived names ship safe without consumer changes.
- **T7 review nits addressed in T8**: `timeColumns` memoized in CanvasWorkspace; `TimeAsFactorsModal.rows` tightened from `Record<string, unknown>[]` to `ReadonlyArray<Record<string, unknown>>` matching sibling CalculatedColumnModal contract.
- **Plan structure validated**: 8-task plan completed exactly as scoped (vs D2's 11 — confirms scaffolded-by-precursor tasks shrink). T6+T7 combined into single dispatch per plan's "thin task allowance." T8 was the sole Opus dispatch (multi-file integration + new contract + e2e). Final Opus branch review: SHIP-READY with 3 trivial non-blockers filed as H1 candidates (parsing-override + aria-current step indicator + sample-row em-dash for partial-null).
- **Tests delta**: +9 (T1) +23 (T2) +8 (T3) +14 (T4) +16 (T5) +13 (T6+T7) +9 (T8) = **~92 new tests**; full suites green at +2151 LOC across 17 files (core: 3525/3525 · ui: 2590/2590 · hooks: 1190/1190).

**D2 shipped 2026-05-27 — key outcomes** (PR #226, merge `ed9aa671`, 14 commits via `--merge`, single-PR with 3 internal phases + 1 review-driven polish):
- **Engine in `@variscout/core/derived/formula/`**: `FormulaBinding` constrained-shape (NOT arbitrary AST): `{ numerator: FormulaTerm[], denominator: FormulaTerm[], multiplier, templateId?, family? }`. `FormulaTerm` discriminated union `'column' | 'constant'`. `evaluateFormulaRow` + `computeFormulaColumn` mirror D1's `computeLeadTimeColumn` NaN-propagation pattern (division-by-zero → NaN; missing/uncoercible cells → NaN; string-as-number coercion via `Number()`). Augmented columns (`Lead_time` from D1) supplement raw row lookup. All exported from `@variscout/core` root.
- **`FORMULA_TEMPLATES` registry**: 8 templates across 5 families: `batchRatio.totalYield` / `batchRatio.gradeA` / `batchRatio.scrap` / `batchRatio.loss` / `dpmo` / `throughput` / `difference` / `custom`. Each template has `isAvailable(ctx)` + `fillFromContext(ctx, sourceColumn?)` → `FormulaBinding`. Conditional logic family deferred to V2.
- **DPMO via multiplier inversion (canonical Six Sigma)**: `(Defects / Samples) × (1_000_000 / opps_per_unit)`. NO additive constant in denominator (that was the original Task 4 model — caught + fixed before ship). Multiplier defaults to 1_000_000; UI's `Opportunities per unit` input inverts to update multiplier. Engine math is canonical.
- **`detectBatchData(profiles)`**: scans `_kg`/`_g`/`_lb`/`_units`/`_tonnes` suffixes (case-insensitive, word-boundary aware) + `input`/`output`/`grade`/`scrap` keyword patterns. Returns `{ inputColumns, outputColumns, scrapColumns, isLikelyBatch } | null`. Null when no input/output pair detected; only then does the system-hint banner appear.
- **`<CalculatedColumnModal>`** under `packages/ui/.../Workflows/`: FocusTrap shell mirroring StepTimingsModal. Templates tab (default) shows card grid filtered by `isAvailable(ctx)`; Throughput card disabled (NOT hidden) with `title="Capture step timings first"` when no Lead_time (per `feedback_hidden_vs_disabled_cta`). Batch-recommended cards marked `data-recommended` with emerald highlight. Custom tab has click-to-add chip slots (NOT drag-and-drop per modern industry pattern Sigma/Airtable/Notion), CSS fly-in animation (200ms ease-out; jsdom no-ops), per-slot sign-flip + remove on slotted chips. DPMO template surfaces `Opportunities per unit` input in place of raw multiplier. 60 modal tests + 12 `formatFormulaPreview` helper tests.
- **`<SystemHintBanner>`** new primitive under `Palette/`: variants `'batch' | 'time' | 'parsing'` with light-mode color discipline (`bg-emerald-50` + `text-emerald-800`, etc., per `feedback_green_400_light_contrast`). Distinct from `ParsingBanner` (kept untouched). Palette accepts `systemHints: SystemHint[]` prop and renders banners above chip groups. 14 banner + 5 Palette integration tests.
- **Palette derived-group split** (review-driven, `96f1aae6`): `GroupKey` union now `'derived-timings' | 'derived-formula' | 'derived-time-decomposition' | 'derived-fallback'` instead of single `'derived'`. Each `derivationSource` discriminant gets its own section with correct label. Fixes latent bug where Lead_time + Yield_pct would collapse under "DERIVED FROM TIMINGS" header.
- **CanvasWorkspace integration** (`32e3afe0`): new `formulaBindings` + `calcModalOpen` state slots mirror D1's `stepTimings` pattern. `derivedFormulaProfiles` useMemo synthesized from `formulaBindings` + `computeFormulaColumn(rawData, binding, augmentedColumnsForFormulas)` where augmented columns include D1's Lead_time/Total_work_time/Wait_time. Profiles merged into `editModeProfiles`; values NaN-filtered into `numericValuesByColumn`. System hints array driven by `detectBatchData(rawProfiles)`. Kebab `'calculate-from'` dispatch routed through `EditModeShell.onMenuItemSelect`. E2E test: batch data → banner → CTA → modal → Template card → Custom tab pre-fill → Save → Yield_pct chip in palette under DERIVED FROM FORMULA. `TODO(PR-CCJ-E1)` marker for persistence.
- **Final Opus review**: ❌ NEEDS FIXES — 2 Important findings (derived-bucket collapse + missing DPMO opps input). Both fixed inline in `96f1aae6` before final push: 7 new tests + DPMO opps→multiplier inversion UI + bucket split. Re-verified all 2536 ui tests + 3500+ core tests + ui build all green.

**D1 shipped 2026-05-27 — key outcomes** (PR #225, merge `a93a2dad`, 14 commits via `--merge`, single-PR with 3 internal phases):
- **Engine in `@variscout/core/derived/`**: `detectPairedTimingColumns(profiles, steps): PairedTimingColumns[]` matches `<prefix>_start` / `<prefix>_end` date-kind columns to steps by lowercase-name equality + `StepTimingBinding` discriminated union (`'paired' | 'duration'`) + `computeLeadTimeColumn` / `computeTotalWorkTimeColumn` / `computeWaitTimeColumn` pure helpers (return `number[] | null`; null = no derivation; consumer omits chip). All exported from `@variscout/core` root.
- **`<StepTimingsModal>`** under `packages/ui/.../Workflows/`: FocusTrap shell mirroring `AddActionDialog`. Two tabs: By step (default) + By column. Pre-fill via `detectPairedTimingColumns` with cyan-dot `role="img" aria-label="Auto-detected"` indicators that clear on user override. Duration alternative section in by-step view with mutual-exclusion logic (in handlers, not save). Save aggregates paired + duration bindings; partial-paired excluded; Save disabled at 0 timed steps. 73 modal tests.
- **`<EditModeToolbar>`** new component between EditModeShell header + 3-column grid. Single `+ Capture step timings` button (other 3 spec §4.1 buttons deferred to E1/F1/H1 per `feedback_hidden_vs_disabled_cta`). Button disabled with `title="Add steps first"` when no steps materialized.
- **Palette `'derived'` group** with dynamic header `DERIVED FROM TIMINGS` (D2 will add `FORMULA`, D3 will add `TIME`). `<ColumnChip>` `derived` prop renders ✨ marker + `bg-emerald-50` tint (NO `dark:` variant per V1 no-dark-mode invariant — `packages/ui/CLAUDE.md`). `ColumnParsingProfile` extended with optional `derived?: boolean` + `derivationSource?: 'timings'|'formula'|'time-decomposition'`.
- **`<StepBox>` `timingBadge` slot** (reserved in C3) consumed via `<ProcessStructureZone>` `timingByStepId?: Record<string, ReactNode>` forward prop. CanvasWorkspace computes badge content via `formatDuration(meanMs)` returning `42 min` / `1.2 h` / `38 s`.
- **CanvasWorkspace integration** (`f70c1986`): new `stepTimings` + `stepTimingsModalOpen` state slots mirror C3's `processSteps` pattern. Derived columns computed via `useMemo` and merged into both `profiles` and `numericValuesByColumn` so dropped derived chips behave like raw numeric columns. End-to-end test exercises the full flow: drop categorical → toolbar enables → modal pre-fills → Save → derived chips appear in palette + timing badges visible in step boxes. `TODO(PR-CCJ-E1)` marker for persistence.
- **Final Opus review**: ✅ READY TO MERGE — one Minor finding (`dark:bg-emerald-950` violation of V1 no-dark-mode) fixed in `63d8538b` before push.

**C3 shipped 2026-05-27 — key outcomes** (PR #224, merge `33cd0c28`, 11 commits via `--merge`, single-PR variant of original 3-sub-PR master-of-master):

- **3 internal phases as commit boundaries** (Tasks 1-4 process zone + materialization · Tasks 5-8 step-bound drop receivers · Tasks 9-10 visual polish + slot reservations). Single Opus final review at end. Worked cleanly — `feedback_slice_size_cap` exception justified by spec-bounded scope + tight ProcessZone/ coupling.
- `encodeProcessDropId()` — singleton codec `'process-zone:singleton'` (process zone only accepts categorical drop; steps emerge from that drop, not droppable themselves)
- `extractStepsFromCategoricalColumn(columnName, distinctValues): { id, name, order }[]` — deterministic id generation `step-${columnName}-${idx}`; index-driven order; preserves distinct-value sequence
- `handleProcessStructureDrop` — pure router with **process route SHORT-CIRCUITS BEFORE outcome** in `handleEditModeDragEnd`. Categorical lookup in `categoricalDistinctValuesByColumn` is the disambiguator: numeric columns absent → falls through cleanly to outcome route.
- `<ProcessStructureZone>` container — `useDroppable({ id: 'process-zone:singleton' })`; empty hint "Drop a categorical column to define process steps"; cyan-dashed affordance on isOver; sorts steps by `order`; connector arrows (`→` `aria-hidden`) between consecutive steps
- `<StepBox>` primitive — header (order badge + step name + optional `timingBadge` slot + optional `resourceIndicator` slot, both `ReactNode?`) + internal-Y section (`useDroppable({ id: encodeOutcomeDropId({ stepId }) })`) + internal-X section (`useDroppable({ id: encodeFactorDropId({ stepId }) })`). Two `useDroppable` instances per StepBox with independent `isOver` state.
- **`encodeOutcomeDropId` extended to discriminated union** `'singleton' | { stepId: string }` — mirrors the C2 factor codec exactly. Constant renamed `OUTCOME_ZONE_DROP_ID` → `OUTCOME_ZONE_SINGLETON_DROP_ID`. `handleOutcomeDrop` now emits `stepId` (3rd arg) through to `onOutcomeSpecAdd`; ripple through `handleEditModeDragEnd` + `EditModeShell` prop type.
- **`children` prop DELETED from `EditModeShell`** — per `feedback_no_backcompat_clean_architecture`. CanvasWorkspace branches at the State/Edit-mode level instead.
- CanvasWorkspace derives `categoricalDistinctValuesByColumn` live from `columnAnalysis.filter(type === 'categorical')` via existing `levelsFor()` helper. Local `useState<{id,name,order}[]>` carries `processSteps` to QA visible effect; persistence-to-IP-blob TODO references E1.
- **End-to-end integration tests** in `EditModeShell.test.tsx` "describe end-to-end drag-end integration (C3 Task 8 — Approach 1)": direct `handleEditModeDragEnd` invocation with encoded ids; covers categorical→process, numeric→outcome-step, factor→factor-step, numeric→process-falls-through.
- 2316 ui tests + 0 skipped + 0 failed; build clean; Opus final review verdict **YES WITH FOLLOWUPS** — single followup applied (`ecf4dc8e` deleted 6 retired chip-rail-in-Canvas `it.skip` blocks per `feedback_no_backcompat_clean_architecture`). Sub-plan: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-c-3-process-structure-zone.md`.
- C-master sequencer (`2026-05-27-canvas-connection-journey-c-master-plan.md`) updated with collapse-to-single-PR note for §C3.

**C2 shipped 2026-05-27 — key outcomes** (PR #223, merge `3451a5ec`, 9 commits via `--merge`):

- `ImprovementProjectFactorControl.stepId?: string` added to `packages/core/src/improvementProject/types.ts:46` (direct add, no migration helper per `feedback_wedge_v1_no_migration_no_backcompat`; mirrors the existing `OutcomeGoal.stepId` precedent)
- `<FactorChip>` — factor name + target-condition pill + step-binding indicator (blue `global` pill via `bg-blue-50 text-blue-700` paired tokens vs neutral `step <id>` via `bg-surface-secondary`)
- `<FactorSpecsPopover>` — target-condition free-text input + step-binding `<select>` (Global / per-step from `steps` prop); Escape + backdrop close mirroring `OutcomeSpecsPopover`
- `<FactorZone>` — `useDroppable({ id: 'factor-zone:global' })`; mutual-exclusion popover state; keys controls by `factor` name (no id field yet — sufficient for now)
- `encodeFactorDropId('global' | { stepId })` — discriminated-union codec; produces `'factor-zone:global'` or `'factor-zone:step:<stepId>'`; per-step IDs are reserved for C3 consumers
- `handleFactorDrop({ activeId, overId, onFactorControlAdd })` — pure drag-end router; returns boolean for short-circuit composition
- **`handleEditModeDragEnd`** — NEW composer that chains `handleOutcomeDrop` + `handleFactorDrop`. Lives at `packages/ui/src/components/Canvas/EditMode/handleEditModeDragEnd.ts`.
- **Architectural correction (Task 8 by Opus implementer):** the plan assumed `Canvas/index.tsx` wraps `<EditModeShell>` for DnD purposes, but `CanvasWorkspace.tsx:691` actually wraps Canvas INSIDE EditModeShell. Resolution: EditModeShell now owns its own `<DndContext onDragEnd={handleEditModeDragEnd}>` around its children (line 85). Canvas's existing inner `<DndContext>` at `index.tsx:784` for chip→step remains untouched. `@dnd-kit/core` nested contexts work independently — chips inside Canvas's tree fire Canvas's handler; column chips from Palette (outside Canvas) fire EditModeShell's handler. **This completed the deferred-from-C1 wiring atomically.**
- `EditModeShell` — 5 new optional props (`factorControls?`, `steps?`, `onFactorControlAdd?`, `onFactorControlUpdate?` + the existing C1 outcome props); FactorZone replaces the previous "Factor zone arrives in C2" placeholder
- `CanvasWorkspace.tsx:691` does NOT yet forward outcome/factor callbacks down to `<EditModeShell>` — flagged as E1 (Charter modal) work per the C-master plan
- 2271 ui tests + 3398 core tests + pr-ready-check.sh + Opus final review APPROVED. Sub-plan archived: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-c-2-factor-zone.md`
- Opus reviewer NITs deferred to H1 polish: viewport clamping on both `OutcomeSpecsPopover` + `FactorSpecsPopover` (consistent with C1); minor font-cadence inconsistency between `FactorChip` (`text-base`) and `OutcomeCard` (`text-sm`) factor-name pills

**C1 shipped 2026-05-27 — key outcomes** (PR #222, merge `b12e5e6e`, 10 commits via `--merge`):

**C1 shipped 2026-05-27 — key outcomes** (PR #222, merge `b12e5e6e`, 10 commits via `--merge`):

- `OutcomeCard` — outcome chip primitive with direction indicator (`↑↓=` from `characteristicType`) + 4 spec pills (`target / LSL / USL / Cpk` with em-dash fallback) + `⚙` button emitting anchor via `getBoundingClientRect()`
- `OutcomeSpecsPopover` (renamed from `SpecsPopover` to disambiguate from the legacy PI-Panel `SpecsPopover` deletion rule in `packages/ui/CLAUDE.md`) — fixed-position editor; per spec §3.2.1: LSL disabled when `smallerIsBetter`, USL disabled when `largerIsBetter`, Cpk default 1.33; mirrors `ParsingOverridePopover` for Escape + backdrop close
- `OutcomeZone` container — `useDroppable({ id: 'outcome-zone:singleton' })`, cyan-dashed `isOver` affordance, horizontal wrap for multi-outcome (per §3.2.2 no "primary" hierarchy), mutual-exclusion popover state via single `openSpecs: { specId, anchor } | null` slot
- `deriveDefaultSpecs(values, characteristicType)` — pure helper; mean-as-target for `nominalIsBest`, undefined target for smaller/largerIsBetter (user must set USL/LSL respectively), Cpk always 1.33
- `encodeOutcomeDropId()` — singleton codec returning `'outcome-zone:singleton'` (mirrors B2's `column:<name>` codec shape with `is*` + `decode*` companions)
- `handleOutcomeDrop({ activeId, overId, numericValuesByColumn, onOutcomeSpecAdd })` — pure drag-end router extracted to `packages/ui/src/components/Canvas/EditMode/handleOutcomeDrop.ts`. Unit-tested. **NOT YET WIRED at `Canvas/index.tsx`'s `handleDragEnd`** — C2 must bundle the wiring or column-drop-creates-outcome stays inert. The shared `DndContext` lives at `packages/ui/src/components/Canvas/index.tsx:784`.
- `EditModeShell` — new props `outcomeSpecs?` + `onOutcomeSpecAdd?` + `onOutcomeSpecUpdate?` (all optional, non-breaking); top placeholder replaced with `<OutcomeZone>`; thinner "Factor zone arrives in C2" hint preserved
- **Hidden landmine fixed:** `CharacteristicType` barrel collision in `@variscout/core`. Legacy `types.ts` `CharacteristicType = 'nominal' | 'smaller' | 'larger'` and new `processHub.ts` `CharacteristicType = 'nominalIsBest' | 'smallerIsBetter' | 'largerIsBetter'` both lived in the barrel. Resolved by keeping `OutcomeSpec` in the barrel, importing `CharacteristicType` from `@variscout/core/processHub` subpath in C1 consumers. Full SSOT consolidation of the legacy type is investigation work for later (touches `SpecEditor`, `CharacteristicTypeSelector`, `inferCharacteristicType`).
- 2228 ui tests + tsc + vite build green; `pr-ready-check.sh` green; Opus final reviewer APPROVED_WITH_CONCERNS (concerns: deferred Canvas wiring documented above; viewport clamping for narrow screens deferred to H1; CLAUDE.md `SpecsPopover` rule clarified in main commit `080c7ddd`).
- Sub-plan archived in main: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-c-1-outcome-zone.md`. Phase C master sequencer: `2026-05-27-canvas-connection-journey-c-master-plan.md`.

**B2.3 shipped 2026-05-27 — key outcomes** (PR #221, merge `a961d867`, 7 commits via `--merge`):

- `ColumnChipContextMenu` — per-kind item lists (numeric / time / categorical / id / text) per spec §3.1.2, fixed position at caller-provided anchor, auto-focus first menuitem, Escape + invisible-backdrop close. Mirrors `EvidenceMapContextMenu/NodeContextMenu` pattern.
- `ParsingOverridePopover` — primary interpretation + confidence + 3 transformed samples + ranked alternatives + "Apply to similar →" affordance. Outside-click + Escape close. Pure controlled (no internal state). Emits `onChoose(name, interpretation)` and `onApplyToSimilar(name, interpretation)` callbacks.
- `ParsingBanner` — aggregate ⚠ banner when `warningCount >= 3` (constant `WARNING_BANNER_THRESHOLD = 3` in Palette). Amber tokens. "Review" CTA fires `onReviewAllWarnings`.
- `columnChipMenuItems.ts` — static `getMenuItemsForKind(kind)` config returning `{ id, label }[]` per spec §3.1.2.
- `Palette` owns the overlay state via single discriminated-union slot `OpenOverlay = { kind: 'menu' | 'popover'; columnName; anchor }`. Mutual exclusion: opening menu closes popover and vice versa.
- `ColumnChip` callback signature CHANGED: `onOverrideOpen` and `onContextMenuOpen` now emit `(columnName, anchor)` instead of just `(columnName)`. Anchor is computed via `getBoundingClientRect()` on the button click.
- `EditModeShell` props refactored: removed the now-obsolete `onColumnOverrideOpen` / `onColumnContextMenuOpen` (Palette owns overlays internally); added `onMenuItemSelect`, `onOverrideAccept`, `onApplyToSimilar`, `onReviewAllWarnings`.
- All menu-item actions stub to controller-provided callbacks (no destinations wired in B2.3): D2 wires Calculate, D3 wires Use-as-time-factors, F1 wires View-in-Explore, G1 wires Bin. Hub-memoization of overrides also deferred — `onOverrideAccept` is a callback only.
- 32 new tests; full `@variscout/ui` suite 2191 tests + tsc + vite build all green.
- Final Opus reviewer: APPROVED. Two 🟡 flagged-then-accepted deferrals logged to `docs/ephemeral/investigations.md`: viewport clamping (NodeContextMenu pattern not yet ported) + ParsingBanner `role="status"` vs `role="alert"` semantics — both targeted for H1 polish.
- Sub-plan archived in main: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-3-popover-banner-menu.md`

**B2.2 shipped 2026-05-27 — key outcomes** (PR #220, merge `dfa84ceb`, 8 commits via `--merge`):

- `Palette` container at `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx` — buckets `ColumnParsingProfile[]` into canonical groups `Numeric → Categorical → Time / ID → Other`, omits empty groups, renders an empty-state hint when no profiles
- `ColumnGroup` primitive with `{Label} · {count}` header
- `ColumnChip` with parsing badge (✓/⚠/✗ — 700/50 paired tokens) + interpretation line + numeric sparkline (inline 24-bar SVG, local `NumericSparkline` helper) + dnd-kit `useDraggable` drag handle (`⋮⋮`) + stubbed `▾`/`⋮` callbacks + `dropped` / `ghostSuggested` visual states (factor/outcome/process hint pill)
- `encodeColumnDragId` codec (`column:` prefix) consistent with existing `encodeChipDragId` / `encodeHubDraggableId` patterns
- Test factory `createTestColumnParsingProfile` in `packages/ui/src/test-utils/`
- `EditModeShell` accepts optional `profiles` + `numericValuesByColumn` + column-event callback props; placeholder paragraph replaced with `<Palette>`
- 46 Palette-suite tests + 9 EditModeShell tests + full ui suite (2159 tests) + tsc + vite build all green
- Two informed deltas from the master sequencer: **dnd-kit instead of native HTML5 DnD** (repo convention) and **`numericValues?: number[]` prop on chip** (since `ColumnParsingProfile` has no distribution data — Palette extracts per-column arrays from `rows`). Both decisions documented in the B2.2 sub-plan
- Final Opus reviewer: APPROVED with no critical / important findings (3 cosmetic nits only)
- Sub-plan archived in main: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-2-column-chip-palette.md`

**B2.1 shipped 2026-05-27 — key outcomes** (PR #219, merge `cd56261a`, 10 commits via `--merge`):

- `profileColumns(rows)` in `@variscout/core/parser/parsingProfile.ts` — candidate-list architecture: gathers every interpretation that parses ≥ 1 non-null value across 5 lanes (ID → numeric → affix → date → categorical), picks top-by-parseCount as `primary`, rest become `alternatives`.
- Status downgrades to `'warning'` on parse rate < 70%, rival interpretation (mixed format), or ambiguous slash-date.
- Three review-driven fixes landed during the PR: (1) US wins over EU on comma-only ambiguous columns (`['1,234','5,678']` → numbers, not 1.234), (2) Date overflow round-trip guard rejects `'2024-13-01'`/`'2024-02-30'`, (3) ID status stays `'ok'` when leading-zero IDs also parse as plain integers.
- New types: `ColumnParsingProfile`, `ParsingStatus`, `ParsingInterpretation`, `ParsingAlternative` — all exported from `@variscout/core/parser` barrel.
- 35 parsingProfile tests + full `@variscout/core` suite (3398 tests) green.
- **Important for B2.2:** `ColumnAnalysis.name` (legacy detection surface) vs `ColumnParsingProfile.columnName` (new) divergence — B2.2 plan must either reconcile to one field name or explicitly document that ColumnAnalysis is the legacy-detection surface and ColumnParsingProfile is the canonical Spec 2 type. Final Opus reviewer flagged this as Important but not a B2.1 blocker. See [[feedback_atomic_sweep_cleanup_loops]] — cross-commit consistency issues like this are exactly what the final-branch reviewer catches.

**B2 master-of-master sequencer:** `docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-master-plan.md` — decomposes B2 into 3 sub-PRs (B2.1 ✓ · B2.2 · B2.3). Each sub-PR gets its own sub-plan written when the prior ships, not all upfront, per `feedback_master_plan_for_multi_subsystem_specs`.

**Related:** [[wedge-v1]], [[feedback_audit_findings_need_design_triage]], [[feedback_step_back_for_system_design]], [[feedback_subagent_grounding_catches_drift]], [[feedback_master_plan_for_multi_subsystem_specs]], [[feedback_one_worktree_per_agent]], [[feedback_subagent_driven_default]], [[feedback_wedge_v1_no_migration_no_backcompat]], [[feedback_prefer_pragmatic_over_formal]].
