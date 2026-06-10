---
tier: ephemeral
purpose: design
title: 'Control closure reframe + Report end-state'
audience: human
category: design-spec
status: delivered
date: 2026-06-10
last-verified: 2026-06-10
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-09-workspace-architecture-and-project-formalization-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/02-journeys/wireframes/control-verification-band.md
  - docs/decision-log.md
supersedes: []
layer: spec
implements:
  - docs/03-features/workflows/control.md
  - docs/03-features/workflows/report.md
  - docs/03-features/workflows/project-dashboard.md
---

# Control closure reframe + Report end-state

> **Build roadmap:** [master plan](../plans/2026-06-10-control-closure-master-plan.md) (RPT-1 + CC-1…CC-7 + CC-DOC).

> **Delivered 2026-06-10.** Implemented across PRs RPT-1, CC-1, CC-2, CC-3, CC-4, CC-5, CC-6, CC-7, and CC-DOC. Named-view wireframe: [control-verification-band](../../02-journeys/wireframes/control-verification-band.md).

> **Accepted design — 2026-06-10.** Resolves the two linked Open Questions from the 2026-06-09 future-Process-code audit (decision-log §2): **(Q1)** Control's verdict model is reframed from calendar-cadence + signal ticks to **data-driven capability sustainment** built on the existing Measure⇄Analyze re-ingest loop, with all verdicts analyst-owned; **(Q2)** the `HubPortfolioReport` / `deriveWorkspaceOverviewReport` fallback is **deleted** — Report always renders the single-project report (every Workspace is always backed by an active Project per the Workspace model). Benchmark-grounded: the verification surface follows QC-storyboard / A3 conventions (effect check = same chart, before vs after, same scale; sustainment = phase-marked run chart), not a net-new capability-trend component.

## 1. Problem

The shipped Control machinery (`packages/core/src/control.ts`) verifies sustainment with a **calendar**: a `cadence` enum drives `nextReviewDue`, `evaluateSustainmentSnapshot` converts evidence-signal severities into `holding`/`drifting` verdicts, and `consecutiveOnTargetTicks` **auto-promotes** the record to `confirmed-sustained` after 4 ticks (auto-demotes on drift). This does not match how analysts actually verify sustainment. The owner's reality: an analyst **re-ingests new data at widening intervals** (≈1 week → 1 month → 3–6 months) and checks _"is post-improvement capability holding vs the pre-improvement baseline, and is it sustaining?"_ The tool's job is to make that comparison legible on each re-ingest — not to run a timer and flip statuses itself.

Adjacent: the Report tab carries a "portfolio" fallback (`deriveHubPortfolioReport`) for the "Workspace with no formalized Project" state — a state that no longer exists under the Workspace model (every Workspace is always backed by an active, soft-formalized Project).

Grounding for both questions was verified against main 2026-06-10 (the audit's priors were wrong ~half the time; this spec's claims were re-checked in both directions — see §10 grounding notes).

## 2. Settled decisions (owner brainstorm 2026-06-10)

| #   | Decision                   | Choice                                                                                                                                                                                                                                                                |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Verification surface shape | **Storyboard band** ("Option C"): phase-split I-Chart on top, before/after comparison panels beneath. Reuses existing chart vocabulary; no `CapabilityGapTrend`-style net-new chart type.                                                                             |
| D2  | Verdict ownership          | **Analyst-owned.** Tool computes evidence only; every re-check verdict and the final `confirmed-sustained` are explicit analyst acts. Auto-promote/demote machinery deleted. Extends the CS-11 "tool assists, analyst decides" invariant to Control.                  |
| D3  | Baseline anchoring         | **Live + frozen anchor.** Analyst sets `improvementDate`; baseline stats are frozen onto the ControlRecord at Control setup; the band recomputes the before-side live while baseline-period rows exist and falls back to the frozen anchor (flagged) when they don't. |
| D4  | Re-check rhythm            | **Widening ladder, analyst-adjustable.** Default `[7, 30, 90, 180]` days; advances on "holding", resets down on "drifted"; drives **soft** "re-ingest to verify" prompts only — no overdue/amber/red. Replaces the `cadence` enum.                                    |
| D5  | Handoff                    | **Simplified record.** Keep surface / system / owner / note / reaction plan; delete the pending→acknowledged→operational status machine and acknowledge-nudges; "owner accepted" becomes a closure-checklist checkbox.                                                |
| D6  | Empty Report state         | **Delete the fallback** (option a). Report always renders the single-project report; informal projects get one soft "formalize" hint line. Close/remove the defensive null-`sessionHub` seam.                                                                         |

## 3. Model

Control is the closure stage of a single Workspace's single Project (Hub↔Project is 1:1; "hub" is internal storage vocabulary only — never a user-facing noun in any new surface). The Measure⇄Analyze re-ingest loop **is** the verification mechanism:

1. At Control setup the analyst marks the **improvement date** and the tool freezes the **baseline** (pre-improvement stats) onto the ControlRecord.
2. At widening intervals the analyst **re-ingests recent data** (any existing path: paste / file / Evidence-Source snapshot).
3. The **verification band** recomputes before → after → now from the data and renders the comparison.
4. The analyst **logs a re-check** (`ControlReview`): holding / drifted / inconclusive, with the now-stats frozen onto the review.
5. After the ladder is walked (or analyst override), the analyst sets **confirmed-sustained** and closes via the **closure checklist** (handoff recorded · owner accepted · sustainment confirmed).

## 4. Data model changes (`packages/core`)

### 4.1 ControlRecord — the baseline anchor

New fields:

```ts
improvementDate: string;            // ISO date — the phase line; analyst-set, required at setup
baseline: ControlBaseline;          // frozen at setup — the auditable "where we started"
ladder: number[];                   // days between suggested re-checks; default [7, 30, 90, 180]; analyst-editable
ladderStep: number;                 // 0-based position; advances on 'holding', resets to 0 on 'drifted'
nextCheckSuggestedAt?: string;      // computed: lastVerifiedAt + ladder[ladderStep]; soft only
status: 'verifying' | 'confirmed-sustained' | 'drifted';  // analyst-written ONLY

interface ControlBaseline {
  capturedAt: number;               // when frozen
  window: { startISO: string; endISO: string };  // the baseline period
  measure: string;                  // outcome column the comparison is bound to
  n: number;
  mean: number;
  sigma: number;
  cpk?: number;                     // absent when no specs
  specsSnapshot?: { usl?: number; lsl?: number; target?: number };
  defectBreakdown?: Array<{ category: string; count: number }>;  // defect mode — feeds paired Paretos
}
```

Deleted fields/functions: `cadence` (+ `ControlCadence`), `consecutiveOnTargetTicks`, `hasOverride`, `nextReviewDue`, and the `latestVerdict` field itself (the latest verdict is derived from the most recent live ControlReview — one source of truth); `evaluateSustainmentSnapshot`, `applyControlTick`, `nextDueFromCadence`, `isControlDue`, `isControlOverdue`. Replacement predicate: a single soft `isCheckSuggested(record, now)`. (`latestReviewAt`/`latestReviewId` may stay as denormalized pointers if the storage layer needs them.)

Kept: `projectId`/`hubId` join keys (storage-level), `owner`, `controlHandoffId`, EntityBase soft-delete, blob paths (`process-hubs/{hubId}/sustainment/...` — internal storage vocabulary, fine to keep).

`isControlEligible` / `isControlled` (controlReadiness.ts) survive unchanged — they are fact-based predicates independent of the verdict model.

### 4.2 ControlReview — becomes the re-check

Keeps `recordId`, `projectId`, `hubId`, `reviewedAt`, `reviewer`, `observation`. Gains:

```ts
verdict: 'holding' | 'drifted' | 'inconclusive';   // analyst-chosen
nowStats: { window: { startISO: string; endISO: string }; n: number; mean: number; sigma: number; cpk?: number };
dataStamp: { rowCount: number; rowTimestampRange?: { startISO: string; endISO: string }; snapshotId?: string };
```

The ordered sequence of ControlReviews is the audit trail of re-checks (and feeds the re-check flags on the band + Report's "Did it work?").

### 4.3 ControlHandoff — simplified

Kept: `surface` (9-value enum — feeds Report's "What we standardized"), `systemName`, `operationalOwner`, `recordedBy`, `handoffDate`, `description`, `referenceUri`, `reactionPlan`, `escalationPath`, soft-delete. Deleted: `status` (`ControlHandoffStatus`), `acknowledgedAt`, `ownerAcknowledgement`, `retainControlReview`, and the survey/handoff.ts 7-day acknowledge nudge (rule 2). The "record a handoff" hint after `confirmed-sustained` (rule 1) survives, retargeted to the new status field.

### 4.4 Actions

`SUSTAINMENT_TICK_EVALUATED` is deleted. New/retained action kinds: `SUSTAINMENT_RECORD_CREATE/UPDATE/ARCHIVE` (now carrying baseline/ladder fields), `SUSTAINMENT_RECHECK_LOGGED` (record + review pair, analyst-initiated), `SUSTAINMENT_CONFIRM`, `SUSTAINMENT_MARK_DRIFTED`. Control writes stay on the R13 direct-save allow-list as today; converting them to dispatched HubActions is out of scope.

## 5. Engine — `computeSustainmentComparison` (pure)

New module `packages/core/src/control/comparison.ts`:

```ts
function computeSustainmentComparison(input: {
  rows: DataRow[];
  timeColumn: string | null;
  improvementDate: string;
  baseline: ControlBaseline;
  specs?: { usl?: number; lsl?: number };
}): SustainmentComparison;

interface SustainmentComparison {
  before: { source: 'live' | 'frozen'; n: number; mean: number; sigma: number; cpk?: number };
  after: { n: number; mean: number; sigma: number; cpk?: number } | null; // null when no post-improvement rows
  phases: { beforeLimits?: PhaseLimits; afterLimits?: PhaseLimits }; // stair-step I-chart limits per phase
  deltas: { meanPct?: number; sigmaPct?: number; cpkDelta?: number };
  defects?: { before: CategoryCount[]; after: CategoryCount[] }; // defect mode
}
```

Rules:

- Built entirely on existing primitives: `applyWindow` (`timeline/applyWindow.ts`) for windowing, `calculateStats` (`stats/basic.ts`) for mean/σ/Cpk/limits. **No new statistics.**
- Before-side: live recompute from rows `< improvementDate` when ≥ a minimum n (reuse the engine's existing small-n guards); otherwise the frozen `baseline`, with `source: 'frozen'` so the UI labels it "baseline snapshot · {date}".
- No spec limits → Cpk fields absent; comparison degrades to mean/σ (same degradation pattern as `computeFindingWindowDrift`).
- No `timeColumn` → before-side is always frozen, after-side is the full current dataset, phases unavailable (band renders panels only).
- **No suggested verdict.** The output is evidence; verdict language ("holding") appears only on analyst-written entities.

## 6. UI — the verification band

`ControlVerificationBand` (new, `packages/ui`), mounted in the Project tab's Control stage in **both apps** (replacing the verdict/tick chrome in `ProcessHubControlRegion` / `ControlPanel`'s status area):

- **Top: phase-split I-Chart.** Existing I-Chart rendering extended with: vertical improvement-date marker, stair-step center line + limits per phase (from `phases`), re-check flags (▼ at each ControlReview's `reviewedAt`). This phase-split extension is the main net-new chart work.
- **Bottom: before/after panels, same scale.** Continuous measures: boxplot (or histogram) pair with shared axis + spec-limit line; defect mode: paired Paretos at shared Y scale. Cpk / n / deltas render as **annotations** (QC-storyboard convention — capability is never its own chart).
- **"Log re-check"** opens the rewritten `ControlReviewLogger`: analyst picks verdict + writes observation; `nowStats` + `dataStamp` are frozen automatically from the current comparison. The free-text `snapshotId` input is deleted.
- `ControlRecordEditor` is rewritten: improvement date, measure binding, ladder editor (chip row of intervals), baseline freeze preview — replacing the cadence/due-date form.

Empty/edge states: no post-improvement rows yet → after-side renders "re-ingest data after {improvementDate} to verify"; frozen-only before-side carries the "baseline snapshot" label.

## 7. Rhythm + prompts

- After a "holding" re-check: `ladderStep + 1` (capped at last rung), `nextCheckSuggestedAt = reviewedAt + ladder[ladderStep]`. After "drifted": `ladderStep = 0`, record status set by the analyst's accompanying call. "Inconclusive" leaves the ladder unchanged.
- Ladder fully walked → the band shows "consider confirming sustained & closing" (soft).
- `isCheckSuggested` feeds: a rewritten `survey/control.ts` hint ("{nth} verification suggested — re-ingest recent data") and a line on the Home resume-last card. **Never** amber/red/overdue; the overdue grace-day machinery is deleted.
- Recompute trigger: the band recomputes on **any `rawData` change** (same posture as `useReingestAutoLink`), not only on EvidenceSnapshot arrival — this keeps the no-snapshot file-append path (`useDataMerge`) counted. `evaluateControlRecordsForSnapshot` in both apps' `applyAction.ts` is rewired from auto-tick to suggestion-recompute only.

## 8. Closure + Report integration

Closure checklist (replacing the Editor's current derived inputs): **handoff recorded** · **operational owner accepted** (checkbox, trusted not tracked) · **ladder walked** (or analyst override with a required reason) · **sustainment confirmed** (analyst sets `confirmed-sustained`). Closing the project fires nothing automatically.

Report (single-project engine, untouched in structure):

- "Did it work?" reads the re-check sequence + comparison summary (replacing `verificationLabel`'s verdict-tick text).
- "What we standardized + learned" reads the simplified handoff (surface + systemName), as today.
- "Where we started" can read `ControlRecord.baseline` as the quantitative anchor.

## 9. Q2 — Report end-state (deletions)

The Workspace model guarantees every Workspace an active Project, so the "no project" Report state cannot occur. Delete:

- `deriveHubPortfolioReport` + `HubPortfolioReport` types/rows/component (`packages/core/src/report/ipReport.ts:330`, ui component) and the aliases `deriveWorkspaceOverviewReport` / `WorkspaceOverviewReportModel` / `WorkspaceOverviewReport(Props)` (core/index.ts ~830/840, ui/index.ts ~521).
- The `hub-portfolio` report section in both apps, including Azure's obfuscated `` `hub-${'port'}${'folio'}` `` id (`ReportView.tsx:130/:794`) and the PWA `!workspaceProject` branch (`ReportView.tsx:323`).
- The defensive null-`sessionHub` fallback inside `handleMappingConfirmToHub` (`apps/pwa/src/App.tsx:764`) — verified unreachable (every entry path runs `ensureSessionProject`); replace with the non-null assumption (and a dev-time invariant error if violated).

Add: when the backing project is still informal, the Report header carries one soft hint line ("Formalize this Workspace to add charter context to this report"). No separate empty-state surface. Residual "portfolio" naming in the report area is removed as part of the deletion.

## 10. Grounding notes (verified on main, 2026-06-10)

- No pre-improvement baseline exists anywhere on ControlRecord/project today; the only baseline fields are `Finding.projection.baseline*` (finding-local). `CapabilityGapTrend` confirmed absent.
- Appended data keeps history: merge paths produce `rawData` containing old + new rows with time-derived columns re-extracted — so live before/after windowing is computable with `applyWindow`. But the **file-append path creates no EvidenceSnapshot** (only paste/Evidence-Source do), hence D-rule: recompute on rawData change, not snapshots; snapshots' `importedAt`/`rowTimestampRange` enrich `dataStamp` when present.
- `applyAction.ts` already calls `evaluateControlRecordsForSnapshot` on `EVIDENCE_ADD_SNAPSHOT` — the hook point exists, currently feeding the wrong model.
- The review-board cut (PR #359) already flattened `ProcessHubControlRegion` to single-project; this spec replaces its verdict internals, not its mounting.
- PWA `App.tsx:764` null-`sessionHub` seam verified unreachable post-W-series (#358): all entry paths (`landOnProcess`/`landVrsOnProcess`/`landPasteOnProcess`) guarantee a live project via `ensureSessionProject`.
- Schemas were reset to clean v1 pre-launch (PR #360): no IDB data migration needed; Dexie version bump only if indexed fields change (these are blob fields — not expected).

## 11. Testing

- Delete with the machinery: `control.test.ts` cadence/tick/due specs (~25 of 54), `controlReadiness` specs survive.
- New core tests: `computeSustainmentComparison` (live vs frozen before-side, no-specs degradation, no-timeColumn degradation, defect-mode breakdown, phase limits), ladder progression (advance/reset/cap/inconclusive), `isCheckSuggested`, closure-checklist predicates.
- UI tests: band empty/edge states, re-check logging freezes nowStats, ladder editor.
- App tests: both apps' `applyAction.control` suites rewritten for suggestion-recompute; ReportView suites lose the portfolio branch. Per the CS-12 lesson, the deletion cascade validator must run **app test suites**, not just builds.

## 12. Out of scope

- Converting Control writes to dispatched HubActions (R13 exception stands).
- Multi-project Control anything (named-future VariScout Process; decision-log §3).
- MSA/stability gating on the comparison (trust stays a soft caveat per the investigation-model design).
- Internal `ProcessHub`/blob-path renames.
