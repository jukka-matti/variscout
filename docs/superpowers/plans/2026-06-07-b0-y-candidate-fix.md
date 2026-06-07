---
tier: ephemeral
purpose: build
title: 'b0 Y-candidate fix — TIME_LIKE_NAME over-exclusion + manual-pick dead-end'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/plans/2026-06-07-fsj-10-writer-collapse.md
  - docs/ephemeral/investigations.md
last-verified: 2026-06-07
verified-against-commit: 241765a2b9ae
---

# b0 Y-Candidate Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un-dead-end the b0 paste path for time-suffixed outcome names. Walked live 2026-06-07 (FSJ-10 gate walk): a pasted `Date/Line/Shift/CycleTime` dataset reaches b0 but the Y picker claims "No numeric columns detected", the manual outcome pick silently no-ops, and the Fix-data wizard's applied Y never propagates back into the b0 candidate state. Root cause + full symptom chain: investigations.md entry "FSJ-10 gate walk: `TIME_LIKE_NAME` regex rejects `CycleTime`" [LOGGED 2026-06-07].

**Architecture:** All three symptoms trace to `packages/core/src/parser/yLikelihood.ts` + the validation seam in `packages/core/src/derived/deriveB0ModeCandidates.ts:79-80`. Fix in core first (pure TS, fully unit-testable), then the thin UI feedback layer. Both apps consume `deriveB0ModeCandidates` through the shared `CanvasWorkspace` — no app-specific writer changes expected (verify, don't assume).

**Tech Stack:** `@variscout/core` parser/derived (pure TS, Vitest), `@variscout/ui` CanvasWorkspace/YPickerSection (RTL), i18n catalog (32 locales, closed interface — see packages/core/CLAUDE.md "Adding a message key is all-or-nothing").

**Worktree:** `.worktrees/fix/b0-y-candidate-rescue` — one branch, one PR.

---

## Constraints (read before coding)

- `packages/core` stays pure TS — no React imports.
- Stats/parser functions return `undefined`, never NaN (ADR-069). Don't fabricate scores.
- New user-facing strings go through the i18n catalog: `MessageCatalog` is a CLOSED interface — a new key must land in `i18n/types.ts` + ALL 32 catalogs (English placeholder convention for non-en).
- Scope verification runs to `pnpm --filter @variscout/core test` / `--filter @variscout/ui test` targeted files (<90s). Do NOT run `pr-ready-check.sh` or full turbo suites from the implementer loop (controller/CI owns that — see feedback_implementer_long_bash_pitfall).
- Do not touch the Map-Your-Data wizard styling (separate investigations entry; separate PR).

## Task 1 — `TIME_LIKE_NAME` stops eating duration outcomes (core)

The regex `/^(…|.*time$|.*date$|…)$/i` hard-excludes any column ending in "time"/"date" from Y candidacy. CycleTime / LeadTime / Downtime / TaktTime are prime Y names in process improvement.

- [ ] RED: add cases to `packages/core/src/parser/__tests__/yLikelihood.test.ts`: `CycleTime`, `LeadTime`, `Cycle_Time`, `downtime` (numeric, hasVariation) MUST rank as Y candidates; exact-token `Time`, `Date`, `Timestamp`, `created_at` MUST stay excluded. Negative control: a genuinely datetime-typed column named `ProcessTime` must also stay excluded (content beats name — see Task 2).
- [ ] GREEN: narrow the name-based exclusion to exact tokens + unambiguous suffixes: keep `time|timestamp|date|datetime|year|month|day|hour|minute|second|.*_at|.*_dt` as full-name matches; DROP `.*time$` and `.*date$`. Rationale comment: name-suffix exclusion produced false positives on duration outcomes (walk 2026-06-07).
- [ ] Consider (judgment call, document either way): a small score _bonus_ for duration-ish names (`cycle`, `lead`, `takt`, `dwell`, `wait`, `process` + time) in `NAME_PATTERN_GROUPS` — cheap and aligns the ranking with process-improvement vocabulary.

## Task 2 — time exclusion keys on content type, not just name (core)

`detectColumns` already classifies date/datetime columns. Verify the b0 path excludes them from Y by **type**, so dropping the name-suffix rule (Task 1) cannot let a real timestamp column through.

- [ ] RED: test that a column whose values parse as dates (type `'date'`/datetime per `ColumnAnalysis`) never appears in `rankYCandidates` output regardless of its name.
- [ ] GREEN: if the existing `column.type !== 'numeric'` guard already covers this (dates aren't `numeric`), convert the red test to a pinning test and note it — no code change needed. Investigate before writing code.

## Task 3 — explicit manual pick accepts any numeric column + visible rejection feedback

`deriveB0ModeCandidates.ts:79-80` honors `selectedOutcome` only if it's in the _ranked_ `yColumnNames`. A user typing the exact name of a numeric column that the heuristic filtered gets a silent no-op.

- [ ] RED (core): `deriveB0ModeCandidates({ …, selectedOutcome: 'CycleTime' })` with the pre-Task-1 lexicon shape (a numeric column outside the ranked set) returns it as `defaultOutcomeColumn` and includes it in `yColumns`. An explicit user pick is authoritative over the heuristic ("tool assists, analyst decides").
- [ ] GREEN: validate `selectedOutcome` against numeric `columnAnalysis`, not the ranked subset; if picked, prepend to `yColumns`.
- [ ] RED (ui): the b0 outcome free-text input, on a name that matches NO column (typo) → visible inline feedback naming the miss ("No column called 'X' — closest: …" or list available numerics); on a non-numeric column name → message explaining why it can't be a Y. No silent state.
- [ ] GREEN: wire the feedback in `YPickerSection` (or the OutcomeNoMatchBanner seam — check which component owns the input; grep `expectedOutcomeNote`). i18n keys per the closed-catalog rule.

## Task 4 — empty-state copy stops lying

"_No numeric columns detected — add or import data to begin_" renders when `yColumns` is empty even though numeric columns exist.

- [ ] RED (ui): with numeric columns present but zero ranked candidates, the empty state must render the "couldn't auto-rank" variant (pick-manually guidance), not "no numeric columns". With genuinely zero numeric columns, the original message stays.
- [ ] GREEN: branch the message on `columnAnalysis.some(c => c.type === 'numeric')`. i18n keys for the new variant.

## Task 5 — wizard-applied Y propagates to b0 (verify the seam, fix if still broken)

After Tasks 1+3 the walk's exact failure may already heal (wizard writes `selectedOutcome`, which Task 3 now honors). Verify rather than assume.

- [ ] RED first, integration-level: simulate the walk — paste-shaped rows with `CycleTime`, no selected outcome → wizard-style apply sets the outcome → assert the b0 candidate state shows the outcome set and "See the data" gating passes. Place the test where the existing FSJ-10 b0 composition tests live (`CanvasWorkspace.test.tsx` / `usePasteImportFlow.landing.test.ts` — follow the existing patterns).
- [ ] If still broken after 1+3: trace which store the wizard writes vs which input `deriveB0ModeCandidates` receives; fix the wiring at the seam, NOT by adding a second writer (FSJ-10 invariant: b0 is the only interactive writer; the wizard hatch may update metadata but the candidate derivation must read the same source of truth).

## Verification (controller-level, after PR opens)

- Full turbo test + build via `bash scripts/pr-ready-check.sh` (controller, not implementer).
- Chrome walk replay: paste the walk dataset (`Date/Line/Shift/CycleTime`, tab-separated) → b0 must list CycleTime as the top Y candidate immediately; typing `CycleTime` in the manual pick must select it; "See the data" enables.

## Stop-line

PR opened against main = stop. Claude reviews, walks, merges (hybrid mode per feedback_codex_implements_claude_orchestrates).
