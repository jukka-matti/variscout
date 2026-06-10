---
tier: living
purpose: build
title: 'CC-5 re-check editors sub-plan'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, sustainment, editors, ladder, verification]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/superpowers/plans/2026-06-10-cc-4-verification-band.md
implements:
  - docs/03-features/workflows/control.md
---

# CC-5 Re-check Editors Plan

## Grounding

- Read master plan `docs/superpowers/plans/2026-06-10-control-closure-master-plan.md`, CC-5 scope and acceptance.
- Read spec `docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md`, especially Control model fields and spec section 6 editor bullets.
- Read package context and current code for `packages/core`, `packages/hooks`, `packages/ui`, `apps/azure`, and `apps/pwa`.
- Checked `gh pr list` before starting; only unrelated dependabot PRs were open.
- Started from `origin/main` after CC-4 merge in dedicated worktree `.worktrees/codex/cc-5-recheck-editors`.

## Goal

Rewrite the Control setup and re-check editors so analysts explicitly freeze the baseline, bind the measure, edit the verification ladder, and log re-checks whose stats/data stamp are frozen from the live comparison. The shared hook must own the same dispatch flow for Azure and PWA.

## Implementation Checklist

1. Add failing tests for setup freeze preview/save and re-check logging without a snapshot text input.
2. Extend `ControlForm` props and UI:
   - improvement date picker
   - measure binding
   - ladder interval editor
   - baseline freeze preview before save
   - owner display preserved
   - verdict radio + observation logger
   - read-only `nowStats` and `dataStamp`
3. Extend `useControlPanelModel`:
   - accept broader record patches for setup fields
   - add shared `logRecheck` helper
   - dispatch `SUSTAINMENT_RECHECK_LOGGED`
   - apply `advanceLadder` on holding and `resetLadder` on drifted
   - leave inconclusive ladder unchanged
4. Wire Azure and PWA Control panels to pass raw data context, comparison, and shared log callback into `ControlForm`.
5. Run focused gates:
   - UI Control form tests
   - hooks `useControlPanelModel` tests
   - Azure/PWA Control panel tests
   - Azure/PWA `applyAction.control` suites if touched by behavior
6. Run final gates: `pnpm build`, `pnpm docs:check`, `bash scripts/pr-ready-check.sh`.

## Review Notes

- Negative control: no free-text `snapshotId` logger field returns.
- Negative control: re-check logging does not automatically confirm sustained; only drifted verdict marks the record as `drifted`.
- Keep all behavior browser/local-data compatible.
