---
tier: living
purpose: build
title: 'Control closure reframe + Report end-state — master plan'
audience: human
status: active
date: 2026-06-10
layer: spec
topic: [control, sustainment, closure, baseline, report, capability, wedge-v1]
related:
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/superpowers/specs/2026-06-09-workspace-architecture-and-project-formalization-design.md
  - docs/07-decisions/adr-080-control-auto-fire-pattern.md
implements:
  - docs/03-features/workflows/control.md
  - docs/03-features/workflows/report.md
---

# Control Closure Reframe + Report End-State — Master Plan

> **For agentic workers:** this is a **master plan** (the PR roadmap), not a single bite-sized task plan. Each PR below gets its **own sub-plan authored at build time** via the VariScout loop: **grounding workflow → sub-plan → subagent build (TDD) → adversarial gate/review → `gh pr merge --merge --delete-branch`**. One worktree per PR. REQUIRED SUB-SKILL for each PR's sub-plan: `superpowers:writing-plans`; for execution: `superpowers:subagent-driven-development`. Steps in sub-plans use checkbox (`- [ ]`) syntax.

**Goal:** Replace Control's calendar-tick verdict machine with **data-driven capability sustainment** (analyst-owned verdicts, frozen baseline + widening ladder, QC-storyboard verification band on the re-ingest loop), and delete the obsolete `HubPortfolioReport` fallback so Report always renders the single-project report.

**Architecture:** Engine in `@variscout/core` (`control/comparison.ts` on `applyWindow` + `calculateStats` — **no new statistics**); chart extension in `@variscout/charts` (phase-split I-Chart); band + editors in `@variscout/ui` (shared by both apps); persistence stays on the R13 direct-save allow-list. The model reshape (CC-2) is an **atomic deletion-cascade** (one Opus dispatch, per-category commits) because it breaks `ControlRecord`/`ControlReview`/`ControlHandoff` consumers across core → hooks → ui → both apps.

**Tech Stack:** React + TypeScript, SVG charts, Zustand, Vitest + RTL (happy-dom), Dexie (clean v1 schemas — pre-production, no data migration), pnpm/turbo monorepo.

**Canonical spec:** [`2026-06-10-control-closure-and-report-endstate-design.md`](../specs/2026-06-10-control-closure-and-report-endstate-design.md). Read the relevant § before any sub-plan. Decisions D1–D6 are settled — do not relitigate in sub-plans.

---

## Build conventions (apply to every PR)

- **One worktree per PR** — `.worktrees/<branch>/`; main session stays at repo root.
- **Per-PR loop:** grounding (read code + the relevant spec §) → sub-plan (`docs/superpowers/plans/2026-06-10-cc-N-*.md`) → subagent TDD build → adversarial review (negative-control tests, not presence-only) → run the **app test suites** (Azure filter = `@variscout/azure-app`, PWA, ui, core — the CS-12 lesson: builds alone miss red app tests) → `bash scripts/pr-ready-check.sh` green → merge `--merge` (never `--squash`).
- **PWA + Azure parity per PR**, or an explicit logged deferral. Control surfaces exist in both apps (`ProcessHubControlRegion` Azure; `ControlPanel`/`useControlPanelModel` shared).
- **Vocabulary:** user-facing copy says Workspace/Project — never "hub" (storage identifiers/blob paths keep `hubId`; that's fine). Verdict language ("holding"/"drifted") appears only on analyst-written entities, never as tool-asserted claims. Never "root cause" (ESLint enforces).
- **Analyst-owned verdicts everywhere (D2):** no code path may write `ControlRecord.status` or a `ControlReview.verdict` without an explicit analyst action. Adversarial reviewers should hunt for sneaky auto-writes.
- **Model sizing:** CC-2 = Opus (atomic cascade); CC-4 = Opus (multi-file UI integration); the rest Sonnet; final-branch reviews Opus per repo policy.

## Partial-integration policy

This initiative spans engine → chart primitive → band → apps. Explicitly allowed intermediate states:

- **CC-1** lands `computeSustainmentComparison` + `ControlBaseline` with **zero UI consumers** (pure, fully unit-tested). Allowed.
- **CC-2** leaves Control surfaces rendering a **minimal interim status line** (record status + last re-check) where the tick/verdict chrome used to be; the band arrives in CC-4. Allowed — the interim must compile, pass app suites, and contain no tick/cadence residue.
- **CC-3**'s phase-split I-Chart may merge **unconsumed** (storybook-style test coverage in `@variscout/charts`). Allowed.
- NOT allowed: shipping CC-5/CC-6 behaviors (ladder advance, prompts) before CC-2's model exists; any PR that leaves a deleted-API import dangling.

---

## Phases & PR map

| Phase                        | PR         | Title                                                                                        | Depends on        | Model    |
| ---------------------------- | ---------- | -------------------------------------------------------------------------------------------- | ----------------- | -------- |
| **0 · Independent deletion** | **RPT-1**  | Delete the `HubPortfolioReport` fallback + null-`sessionHub` seam (spec §9)                  | —                 | Sonnet   |
| **1 · Engine (additive)**    | **CC-1**   | `computeSustainmentComparison` + `ControlBaseline` type (spec §5, §4.1 baseline shape)       | —                 | Sonnet   |
|                              | **CC-3**   | Phase-split I-Chart extension (marker, stair-step limits, flags) (spec §6 top band)          | —                 | Sonnet   |
| **2 · Model cascade**        | **CC-2**   | Control model reshape — atomic deletion cascade (spec §4, §2 D2/D4/D5)                       | CC-1              | **Opus** |
| **3 · Surfaces**             | **CC-4**   | `ControlVerificationBand` + before/after panels, mounted in both apps (spec §6)              | CC-1,2,3          | **Opus** |
|                              | **CC-5**   | Editors rewrite: `ControlRecordEditor` (date/ladder/baseline-freeze) + `ControlReviewLogger` | CC-2 (CC-4 ideal) | Sonnet   |
| **4 · Rhythm + closure**     | **CC-6**   | Soft prompts + recompute triggers (survey rewrite, Home card line, applyAction rewire) (§7)  | CC-2              | Sonnet   |
|                              | **CC-7**   | Closure checklist + Report integration (spec §8)                                             | CC-2, CC-5        | Sonnet   |
| **Apply**                    | **CC-DOC** | Doc propagation: feature docs, ADR-080 supersession, wireframe, decision-log closeout        | all above         | Sonnet   |

Parallelizable: RPT-1, CC-1, CC-3 are mutually independent and can run as a parallel wave (one worktree each). CC-2 starts only after CC-1 merges.

---

## PR details

### RPT-1 — Delete the Report fallback (spec §9)

**Scope:** Pure deletion + one hint line. Independent of the CC series — land first.

- Delete `deriveHubPortfolioReport` + `HubPortfolioReport` types/rows (`packages/core/src/report/ipReport.ts:330–364`) and the UI component, plus aliases: `deriveWorkspaceOverviewReport` / `WorkspaceOverviewReportModel` (core `index.ts` ~830/840), `WorkspaceOverviewReport(Props)` (ui `index.ts` ~521).
- Delete the `hub-portfolio` report section from both apps: Azure `ReportView.tsx` (~:130 obfuscated `` `hub-${'port'}${'folio'}` `` id + ~:794 render) and PWA `ReportView.tsx:323` `!workspaceProject` branch.
- Replace the defensive null-`sessionHub` fallback in PWA `App.tsx:764` `handleMappingConfirmToHub` with the non-null assumption + a dev-time invariant error (grounded unreachable: all entry paths run `ensureSessionProject`).
- Add the informal-project hint line to the Report header (both apps): "Formalize this Workspace to add charter context to this report" — gated on the project being informal (not formalized), one line, no new surface.
- Sweep residual "portfolio" naming in the report area.

**Acceptance:** grep `-i "portfolio"` in `packages/core/src/report/`, both `ReportView`s, and barrels returns nothing; both ReportView test suites green with the branch deleted; Report renders the single-project report for a fresh FSJ auto-project.

**Sub-plan:** [`2026-06-10-rpt-1-report-end-state.md`](2026-06-10-rpt-1-report-end-state.md). Verify at grounding time whether any test fixtures construct project-less hubs and rewrite them to carry the auto-project.

### CC-1 — Comparison engine (spec §5)

Sub-plan: [2026-06-10-cc-1-sustainment-comparison.md](2026-06-10-cc-1-sustainment-comparison.md).

**Scope:** Additive only. New `packages/core/src/control/comparison.ts` (new `control/` dir; existing `control.ts` untouched in this PR):

- `ControlBaseline` interface (spec §4.1 shape) + `SustainmentComparison` output type (before `live|frozen`-sourced stats, after stats or null, per-phase I-chart limits, deltas, optional defect category counts).
- `computeSustainmentComparison(input)` built on `applyWindow` (`timeline/applyWindow.ts`) + `calculateStats` (`stats/basic.ts`). Degradations: no specs → no `cpk` fields, mean/σ only (same posture as `computeFindingWindowDrift`); no `timeColumn` → before always frozen, after = full dataset, `phases` undefined; before-window n below the engine's existing small-n guard → frozen fallback with `source: 'frozen'`.
- `freezeBaseline(rows, timeColumn, improvementDate, measure, specs)` helper producing a `ControlBaseline` (used by CC-5's setup flow).

**Tests (TDD):** live vs frozen before-side selection; no-specs degradation; no-timeColumn degradation; defect-mode breakdown; stair-step phase limits match `calculateStats` limits per window; deterministic fixtures (no `Math.random` — repo testing rule).

**Acceptance:** core suite green; zero imports from UI/apps (enforce: no barrel export to ui yet is fine, but export from core index so CC-2/4 can consume).

### CC-2 — Control model reshape: atomic deletion cascade (spec §4)

**Sub-plan:** [`2026-06-10-cc-2-control-model-cascade.md`](2026-06-10-cc-2-control-model-cascade.md).

**Scope:** The breaking PR. Per the repo's atomic-sweep carve-out: **one Opus implementer** with Architect → Migration → Validator internal phases and per-category commits — do not split into sub-dispatches.

Model changes (`packages/core`):

- `ControlRecord`: add `improvementDate`, `baseline`, `ladder`, `ladderStep`, `nextCheckSuggestedAt?`; `status` narrows to `'verifying' | 'confirmed-sustained' | 'drifted'`. Delete `cadence`/`ControlCadence`, `consecutiveOnTargetTicks`, `hasOverride`, `nextReviewDue`, `latestVerdict` (derive from latest live review; `latestReviewAt`/`latestReviewId` may stay as denormalized pointers).
- Delete `evaluateSustainmentSnapshot`, `applyControlTick`, `nextDueFromCadence`, `isControlDue`, `isControlOverdue`. Add `isCheckSuggested(record, now)` (soft; true when `nextCheckSuggestedAt <= now`; soft-deleted → false) + `advanceLadder` / `resetLadder` pure helpers (advance on holding capped at last rung; reset on drifted; inconclusive = no-op).
- `ControlReview`: add `verdict: 'holding' | 'drifted' | 'inconclusive'`, `nowStats`, `dataStamp` (spec §4.2).
- `ControlHandoff`: delete `status`/`ControlHandoffStatus`, `acknowledgedAt`, `ownerAcknowledgement`, `retainControlReview`. Keep surface/system/owner/recordedBy/handoffDate/description/referenceUri/reactionPlan/escalationPath.
- Actions (`actions/controlActions.ts`): delete `SUSTAINMENT_TICK_EVALUATED`; add `SUSTAINMENT_RECHECK_LOGGED` (record + review pair, analyst-initiated); keep CREATE/UPDATE/ARCHIVE/CONFIRM/MARK_DRIFTED.
- `projectMetadata.ts` `ControlMetadataProjection`: reshape `cadence`/`nextReviewDue`/`latestVerdict` → `ladderStep`/`nextCheckSuggestedAt`/`status` (verify PO-8b merge-preserving save still round-trips).

Consumer inventory to rewire (grounded 2026-06-10 — verify again at sub-plan time, both directions):

| Consumer                                                                       | Treatment in CC-2                                                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/azure/.../ControlReviewLogger.tsx`                                       | minimal: log review with analyst verdict; due-date recompute deleted (full rewrite = CC-5)                                     |
| `apps/azure/.../ControlRecordEditor.tsx`                                       | minimal: cadence form fields removed, improvementDate field added (full rewrite = CC-5)                                        |
| `apps/azure/.../ControlHandoffEditor.tsx`                                      | drop acknowledge/status fields                                                                                                 |
| `apps/azure/.../ProcessHubControlRegion.tsx`                                   | interim status line (status + last re-check + `isCheckSuggested` soft hint); overdue/amber/red states deleted                  |
| `apps/azure/pages/Editor.tsx` (+`Editor.control.tsx`) closure inputs           | rewire `cadenceAssigned`→ladder-present; acknowledgement-derived items → checkbox placeholder (full checklist = CC-7)          |
| `packages/hooks/useControlPanelModel.ts` + PWA `ControlPanel`                  | same interim treatment, shared                                                                                                 |
| `packages/core/survey/control.ts` + `survey/handoff.ts`                        | tick-progression + acknowledge-nudge hints deleted; drift hints retarget analyst-recorded verdicts (full prompt rework = CC-6) |
| both apps' `persistence/applyAction.ts` (`evaluateControlRecordsForSnapshot`)  | auto-tick body deleted; leave a recompute-suggestion stub (wired fully in CC-6)                                                |
| `packages/core/report/ipReport.ts` `verificationLabel` + `selectIPReportScope` | read latest review verdict instead of `latestVerdict`/ticks (narrative upgrade = CC-7)                                         |
| `apps/azure/services/controlStorage` + Dexie schemas (both apps)               | field changes; bump Dexie version **only if** indexed fields change (blob fields expected — verify)                            |

**Tests:** delete the ~25 cadence/tick/due specs in `control.test.ts`; add ladder progression (advance/reset/cap/inconclusive), `isCheckSuggested`, reshape shape-pins; `controlReadiness` specs must survive **unchanged** (they're verdict-model-independent — treat as a negative control). Run all app suites.

**Acceptance:** repo-wide grep for `consecutiveOnTargetTicks|ControlCadence|applyControlTick|evaluateSustainmentSnapshot|nextDueFromCadence|isControlOverdue|ownerAcknowledgement|retainControlReview|SUSTAINMENT_TICK_EVALUATED` returns nothing outside docs/archive; full turbo test green.

### CC-3 — Phase-split I-Chart (spec §6 top band)

**Sub-plan:** [`2026-06-10-cc-3-phase-ichart.md`](2026-06-10-cc-3-phase-ichart.md).

**Scope:** Extend the I-Chart rendering in `@variscout/charts` (grounding: locate the exact component; the Values⇄Capability toggle lives in `ConnectedStepCapabilityView` — the band needs the plain I-Chart primitive) with optional props: `phaseSplit?: { atISO: string; label?: string }`, per-phase center line + limits (stair-step), and `eventFlags?: Array<{ atISO: string; label: string }>` (re-check ▼ markers). Purely additive props — existing call sites unaffected (negative-control test: render without new props is pixel/DOM-identical).

**Acceptance:** charts suite green; new props covered (marker position, two limit segments, flags render + clip), no consumer regression.

### CC-4 — Verification band (spec §6)

**Sub-plan:** [`2026-06-10-cc-4-verification-band.md`](2026-06-10-cc-4-verification-band.md).

**Scope:** New `packages/ui/src/components/ControlVerificationBand/` composing CC-1 (comparison) + CC-3 (chart):

- Top: phase-split I-Chart (improvement marker, stair-step limits, re-check flags from the ControlReview sequence).
- Bottom: same-scale before/after panels — boxplot/histogram pair + spec-limit line for continuous; paired Paretos (shared Y) for defect mode, fed by `defectBreakdown`/`defects`. Cpk / n / deltas as annotations only.
- States: no post-improvement rows → "re-ingest data after {date} to verify"; frozen before-side → "baseline snapshot · {date}" label; ladder-walked → soft "consider confirming sustained & closing".
- Mount in both apps' Control stage, replacing the CC-2 interim status line (`ProcessHubControlRegion` Azure; PWA `ControlPanel` region). "Log re-check" button wires to the (CC-2-era) logger.
- Band recomputes from current `rawData` via a `useSustainmentComparison` hook in `@variscout/hooks` (project rows + record in, memoized comparison out).

**Reference visual:** the accepted Option-C mockup (brainstorm artifact `.superpowers/brainstorm/30777-1781079603/content/control-verification-layout.html`); CC-DOC converts it into a named-view wireframe under `docs/02-journeys/wireframes/`.

**Acceptance:** band renders in both apps (chrome-verify Azure; PWA parity or logged deferral); reviewer pair verifies the built interaction against the wireframe (repo wireframes-in-spec rule); empty/edge states covered by RTL tests; app suites green.

### CC-5 — Editors rewrite (spec §6 last bullets)

**Sub-plan:** [`2026-06-10-cc-5-recheck-editors.md`](2026-06-10-cc-5-recheck-editors.md).

**Scope:**

- `ControlRecordEditor` → Control setup: improvement date picker, measure binding (default: the project's outcome column), ladder editor (chip row of intervals, default 7/30/90/180, add/remove/edit), **baseline freeze preview** (shows the `freezeBaseline` result before save), owner field stays.
- `ControlReviewLogger` → re-check logger: verdict radio (holding/drifted/inconclusive), observation textarea; `nowStats` + `dataStamp` frozen automatically from the live comparison (display them read-only in the form); the free-text `snapshotId` input deleted; on save dispatch `SUSTAINMENT_RECHECK_LOGGED` + apply `advanceLadder`/`resetLadder` + recompute `nextCheckSuggestedAt`.
- Shared `useControlPanelModel` updated so PWA gets the same flows.

**Acceptance:** setup → freeze → re-check round-trip test (create record with frozen baseline; log holding re-check; ladder advanced; suggested date moved to next rung); drifted re-check resets ladder; both app suites green.

### CC-6 — Rhythm + prompts (spec §7)

**Sub-plan:** [`2026-06-10-cc-6-ladder-prompts.md`](2026-06-10-cc-6-ladder-prompts.md).

**Scope:**

- Rewrite `survey/control.ts`: hints become "{nth} verification suggested — re-ingest recent data" (from `isCheckSuggested` + `ladderStep`); analyst-recorded `drifted` verdict → warning hint; delete remaining tick-progression copy. `survey/handoff.ts`: keep only the "confirmed-sustained without handoff → suggest recording one" hint, retargeted.
- Home resume-last card: one line when `isCheckSuggested` ("Control: re-ingest to verify — {n}th check suggested"). Soft styling — never amber/red/overdue.
- Rewire both apps' `applyAction.ts` snapshot hook from the CC-2 stub to suggestion-recompute; ensure the band/hook recomputes on **any `rawData` change** (the no-snapshot file-append path counts — same posture as `useReingestAutoLink`).

**Acceptance:** negative control — no code path flips record status or writes a verdict (grep + tests); prompt strings localized per i18n conventions; app suites green.

### CC-7 — Closure checklist + Report integration (spec §8)

**Scope:**

- Closure checklist (Editor closure inputs both apps): **handoff recorded** · **operational owner accepted** (plain checkbox, trusted) · **ladder walked or analyst override with required reason** · **sustainment confirmed** (`confirmed-sustained` set by analyst). Closing fires nothing automatically.
- Report: "Did it work?" reads the re-check sequence + comparison summary (replacing the verdict-tick `verificationLabel` text); "What we standardized + learned" reads the simplified handoff (unchanged shape); "Where we started" gains the `ControlRecord.baseline` quantitative anchor when present.

**Acceptance:** report narrative snapshot tests updated; closure blocked-states tested (e.g., override requires reason); app suites green.

### CC-DOC — Apply-phase propagation

**Scope (per-initiative-at-delivery doc discipline):**

- Update `docs/03-features/workflows/control.md` + `report.md` (+ `project-dashboard.md` Control region description) to the shipped model.
- **Supersede/amend ADR-080** (Sustainment auto-fire pattern — retired by D2 analyst-owned verdicts); decide at grounding whether to mint a new ADR for data-driven sustainment or amend ADR-080 in place (use `pnpm docs:amend`).
- Add the named-view wireframe for the verification band under `docs/02-journeys/wireframes/` (from the Option-C mockup), link it from the spec.
- Flip spec + this plan to `status: delivered`; decision-log Session-Backlog row closed; investigations.md entries for anything deferred (e.g., converting Control writes to HubActions).

---

## Risks & watch-items

- **CC-2 blast radius:** the consumer inventory above is grounded but the audit lesson stands — _"looks dead/live" was wrong ~half the time_. The CC-2 sub-plan MUST re-verify every consumer with Explore before the dispatch, both directions.
- **`ControlMetadataProjection` round-trip:** PO-8b's merge-preserving `ProjectMetadata` save explicitly keeps Control `sustainment` — reshaping the projection must not break the 412-conflict merge path (test it).
- **Dexie:** schemas are clean v1 pre-production (PR #360) — no data migration, but confirm no Control field is indexed before skipping the version bump.
- **Parallel work:** check `gh pr list` before each PR for in-flight demo-readiness / Codex chains touching `Editor.tsx`, Home, or Report surfaces; `Editor.tsx` is large and merge-conflict-prone — keep CC-2's edits surgical.
- **No-CoScout dependency:** every flow works manually; CoScout Control coaching is out of scope (its surface/tool work is the CoScout redesign's lane).

## Sequencing summary

Wave 1 (parallel): **RPT-1 · CC-1 · CC-3** → **CC-2** (atomic, Opus) → Wave 3 (parallel where staffing allows): **CC-4 · CC-5** → Wave 4: **CC-6 · CC-7** (parallel) → **CC-DOC**. Final-branch Opus review on every PR per repo policy.
