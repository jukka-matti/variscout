---
title: 'Process Hub Workstream'
description: 'Major workstream — process hub as organizational container; phases 1-6 shipped to main; spec promoted to delivered 2026-04-27 after partial chrome walk + 153 deterministic tests covering all 8 ACs'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 2b19bf38-eb48-4091-80be-723e7510adae
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_process_hub.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Process Hub Workstream State (2026-04-26)

Process Hub is the organizational layer of VariScout — the container around investigations, with cadence review, evidence sources, and (eventually) sustainment + control handoff. Roadmap defined in `docs/superpowers/specs/2026-04-26-unified-process-hub-methodology-roadmap.md` (status: in-progress).

## Phases shipped or active on main

- **Phase 1** Methodology hierarchy refresh — partially landed via prior commits (Constitution, Methodology, EDA Mental Model, FRAME, QDE 2.0 alignment).
- **Phase 2** Cadence review board — `ProcessHubReviewPanel` (six queues + three depth buckets). Delivered.
- **Phase 3** Question bands — three semantic bands (Requirement / Change signals / Focus) on top of cadence panel. Delivered.
- **Phase 4** Process moments — Cp/Cpk windows tied to stages; core logic in `packages/core/src/processMoments.ts` with tests; UI surfacing minimal. Delivery-grade core, scaffolding UI.
- **Phase 5** Evidence Sources + Data Profiles + Signal Cards — `evidenceSources.ts`, `signalCards.ts`, `ProcessHubEvidencePanel`, IndexedDB v5, Blob sync (`blobClient.ts` with SAS caching). Delivery-grade.
- **Phase 6** Sustainment & Control Handoff — spec drafted at `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md` (status: draft). Recommends extending `ProcessHubReviewPanel` with sustainment queue + new question band; new types `SustainmentRecord`, `SustainmentReview`, `ControlHandoff`. NO code yet.

**Why:** Process Hub is the operating spine for process owners; it's how teams move from individual investigations to recurring process review. Phases 3-5 clustered into one commit (`89cd6d9d`) because they share the Evidence Source abstraction.

**How to apply:** When working on process-hub features, default to extending `packages/core/src/processHub.ts` builders (`buildProcessHubCadence`, queue helpers) rather than duplicating. UI lives in `apps/azure/src/components/ProcessHubReviewPanel.tsx` (~550 LOC; flag for extraction when it grows further). Storage: IndexedDB via `apps/azure/src/services/localDb.ts`, Blob via `blobClient.ts`. Customer-owned data principle (ADR-059) — no PII in App Insights events.

## Phase 6 spec PROMOTED to `delivered` on 2026-04-27

Spec frontmatter at `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md` flipped to `status: delivered` + `delivered: 2026-04-27`. F-6 closed.

**Verification breakdown:**
- **Deterministic (153 tests, all green):** core sustainment + paths (39), schema.v6 + sustainmentStorage (14), Phase 6 components/pages/services (78), processHub + evidenceSources (22). Covers all 8 acceptance criteria functionally.
- **Visual seam (chrome):** AC #1 confirmed — flipping investigation status to `resolved` renders "Set up sustainment cadence" prompt in editor. Coffee Moisture sample, vite dev at :5173.
- **AC #6 (CoScout PII-clean):** vacuously satisfied — sustainment fields are not wired into any AI context builder yet (consistent with spec open-question #4 deferring CoScout proactivity). No PII surface.
- **AC #8 (blob namespace):** confirmed in `packages/core/src/sustainment.ts:307-343` (`process-hubs/{hubId}/sustainment/...` path constructors) and `apps/azure/src/services/blobClient.ts:444-470` (consumers).
- **Index reconciliation:** `docs/superpowers/specs/index.md` Phase 6 row still says "in progress" — left untouched because the file already has unstaged operating-model edits the user wants to keep separate. User reconciles index when committing operating-model branch.

**Deferred to a follow-up interactive walk (file as F-8 if issues surface):** full Flow A configuration, Flow B-D execution (verdict logging, drifting+escalate, handoff record), bucket-split visual rendering with overdue/due/recently-reviewed colors, mobile + dark + fi locale spot checks, duplicate-render quirk visual confirmation. Functional contract for all of these is covered by the 78 Phase 6 component/page tests.

## Phase 6 SHIPPED to main on 2026-04-27 — PR #93 squash-merged as `be9511b9`

All 20 tasks (1–6 core, 7–10 storage, 11–17 UI, 18–19 lifecycle, 20 review + final-review fixes) complete and merged. Local feature branch deleted. Spec status promoted to `in-progress` (commit `e01693b7`); chrome-walk acceptance is the gate for `delivered`.

**Final landed PR:** 28 commits squashed into `be9511b9`. **Diff:** 34 files, +3509 / -67 lines. **Tests:** ~5800 across the monorepo, all green. **Build:** clean. **pr-ready-check:** all checks passed.

**Final-review fixes folded in pre-merge:**
- `be6e4045` — load existing sustainment record in Editor entry (prevents duplicates).
- `9263391a` — clear `meta.sustainment` projection when investigation reopens (M-3).

**Phases delivered:**
- **Phase A (core):** `src/sustainment.ts` (types + cadence helpers + selectors + 4 blob path helpers); `src/processHubReview.ts` leaf to break the cycle; `processHub.ts` extended with sustainment lane in `buildProcessHubCadence` + `buildProcessHubRollups` + `ProcessHubContextContract.sustainment` summary; `ProjectMetadata.sustainment?` added in Phase D Task 18.
- **Phase B (storage):** IndexedDB v6 + 3 new stores; localDb CRUD; blob client paths + cloud sync; useStorage facade exposed.
- **Phase C (UI):** `ProcessHubSustainmentRegion` (3 sections: due / handoff candidates / setup); 3 popover editors (`SustainmentRecordEditor`, `SustainmentReviewLogger`, `ControlHandoffEditor`); 4th cadence question band ("Is this control still holding?"); Dashboard lazy-loads records per hub; Editor.sustainment.tsx entry near status override (loads existing record to prevent duplicates).
- **Phase D (lifecycle + review):** projection recompute on record save; tombstone on investigation status reopen; final reviewer Important issue (I-1, duplicate-record risk in Editor entry) addressed in commit `be6e4045`.

**v1 simplifications acknowledged in final review (track for v2):**
- Owner identity uses `{ userId: 'self' | randomUUID, displayName }` placeholder; EasyAuth not threaded into popovers.
- Dashboard sustainment-region clicks navigate to Editor (no in-Dashboard popover state). Editor is v1 management surface.
- Catalog `_index.json` tracks records only; reviews/handoffs addressed by id from records.
- `metadata.sustainment` projection write-back uses project-name == investigationId matching.
- `docs/08-products/index.md` references untracked `presentations/` file (added during Task 10 to satisfy orphan check; user-acknowledged).

**Open follow-ups (deferred, not blocking; track as separate issues if pursued):**
- ✅ F-2: split sustainment region into due / overdue / recently-reviewed — shipped in PR #94 (`9a39a203`).
- ✅ F-3: wire `sustainmentBandAnswer` to `rollup.evidenceSnapshots` — shipped in PR #94.
- ✅ F-5: beef up `schema.v6.test.ts` to seed all 8 v5 stores — shipped in PR #94.
- ✅ F-6: chrome walk + deterministic AC verification — spec promoted to `delivered` 2026-04-27 (see top section for breakdown).
- ✅ F-7: thread EasyAuth identity into the three popovers — shipped in PR #94.

(F-1 and F-4 were folded inline pre-merge of #93.)

**Post-delivery findings (2026-04-27, not blocking promotion but tracked separately):**
See [Phase 6 Deferred Findings](project_phase_6_deferred_findings.md) for S1 (text-color-400 contrast), S3 (editor form pattern), S4 (cross-section duplicate render), **S5 (Logger + HandoffEditor unmounted in v1)**, and deferred quick-fixes Q1/Q2. S5 is the largest blocker for Phase 6 v2 — Flow B/C/D from the spec cannot be executed by a real user yet. Helper-copy fix (`32a05b38`) and Q3-Q5 in `SustainmentRecordEditor` (`f5b1fdaa`) shipped during the same session.

## PR #94 SHIPPED to main on 2026-04-27 — squash-merged as `9a39a203`

Bundles 4 phase-6 follow-ups: F-2 (`selectSustainmentBuckets` core helper + 3-bucket UI region), F-3 (snapshot-context appended to `sustainmentBandAnswer`), F-5 (full v5 store seeding in migration test), F-7 (EasyAuth `currentUser` prop required across 3 editors + `SustainmentEntryRow` fetches via `getEasyAuthUser()`). Also folded a chore commit fixing a pre-existing tsc error in `sustainmentStorage.test.ts` (vitest didn't catch it; tsc-on-build did) and a code-review fix dropping `userId` from `operationalOwner` (the field was conflating submitter identity with the named operational owner). Diff: 16 files, +798 / -132 lines. Tests: 2799 core + 918 azure-app, all green. Build: clean.

---

## Should-fix follow-ups: RESOLVED in commit `582f5211` (2026-04-26)

All five reviewer items addressed in a single fix bundle:
1. Duplicate `<SectionHeader>` → cadence labels demoted to eyebrow paragraphs.
2. N+1 evidence fan-out → lazy-load only the selected hub via `loadEvidenceForHub`.
3. `processMoments.ts` Cp/Cpk → routes through `safeDivide` (ADR-069).
4. `ProcessHubEvidencePanel.tsx` test file → 6 cases covering source CRUD, snapshot severity, validation errors.
5. `evidenceSignals` sort → severity primary (red > amber > green > neutral), capturedAt secondary.

Subagent review verdict: safe-to-merge, no must/should-fix. Two open nice-to-haves remain: explicit numeric-safety test for processMoments edge cases (`usl === lsl`); audit `useStorage()` return-ref stability for the new `useCallback` deps. Both deferred.

Four of five nice-to-haves landed in commits 4b0415e7 + 690cb909 (2026-04-26):
- Panel split: 549 LOC → 106 + 37 + 363 + 93 LOC (orchestrator + questions + queues + format helpers)
- formatPlural() helper added to @variscout/core/i18n via Intl.PluralRules; applied at 4 call sites; NaN/Infinity guard added in 690cb909
- Ghost hub naming: synthesizeOrphanHub() returns 'Unknown hub' instead of raw hubId
- Severity-by-rate for false greens: 0 → green, ≤1% → amber, >1% → red (FALSE_GREEN_AMBER_RATE = 0.01)

DEFERRED: full apps/azure i18n sweep — entire azure UI is hardcoded English, not just process hub. Larger effort tracked separately.

## Decisions resolved 2026-04-26

- **InvestigationStatus** follows override-on-derived contract: `investigationStatusFromJourneyPhase()` derives natural status from journey phase; `metadata.investigationStatus` stores optional override that wins when present. Single resolver source of truth at `packages/core/src/projectMetadata.ts:195` (`processContext?.investigationStatus ?? investigationStatusFromJourneyPhase(phase)`). Follow-up: extract `resolveInvestigationStatus()` helper, audit call sites that fall back to literal `'scouting'` (which masks FRAME phase).
- **ADR-072** Process Hub storage and CoScout context boundary accepted; supersedes ADR-021/030/043, amends ADR-004/059.

## Spec promotion status (2026-04-26)

9 specs promoted from draft via commit `8d77e757`:
- Wall + FRAME → Delivered
- Process Hub design / use cases / QDE 2.0 / Unified roadmap / Evidence Sources / Investigation Workspace Reframing / CoScout Intelligence Architecture → In progress

Phase 6 spec added to index in `cd92a233`.
