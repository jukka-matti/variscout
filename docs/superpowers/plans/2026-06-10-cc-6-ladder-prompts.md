---
tier: living
purpose: build
title: 'CC-6 ladder prompts sub-plan'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, sustainment, prompts, ladder, home]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/superpowers/plans/2026-06-10-cc-5-recheck-editors.md
implements:
  - docs/03-features/workflows/control.md
---

# CC-6 Ladder Prompts Plan

## Grounding

- Read master plan `docs/superpowers/plans/2026-06-10-control-closure-master-plan.md`, CC-6 scope and acceptance.
- Read spec `docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md`, especially re-check rhythm and prompt bullets.
- Read current `packages/core/src/survey/control.ts`, `packages/core/src/survey/handoff.ts`, survey tests, and `packages/ui/src/components/WorkspaceProject/workspaceProjectPresentation.ts`.
- Checked `gh pr list` before starting; only unrelated dependabot PRs were open.
- Started from `origin/main` after CC-5 merge in dedicated worktree `.worktrees/codex/cc-6-ladder-prompts`.

## Goal

Replace remaining cadence/tick/due copy in prompts and Home resume lines with soft ladder suggestions. Suggestions must come from `isCheckSuggested` plus `ladderStep`, drifted records remain analyst-recorded warnings, and no code path may write `ControlRecord.status` or a review verdict automatically.

## Implementation Checklist

- [x] Add failing survey tests for `{nth} verification suggested - re-ingest recent data`, drifted warning copy, and no hint for future suggestions.
- [x] Add Home resume-line tests for `Control: re-ingest to verify - {nth} check suggested`.
- [x] Update `survey/control.ts` to emit ladder-based soft prompts and analyst-recorded drift warnings without tick/due language.
- [x] Keep `survey/handoff.ts` to only the confirmed-sustained-without-handoff prompt, retargeted to recording handoff.
- [x] Update workspace project presentation to accept optional sustainment projection context and avoid cadence/due/overdue language.
- [x] Add grep/negative-control checks for no automatic status/verdict writes and no CC-6-owned overdue/amber/red semantics.
- [x] Run focused core survey tests, workspace presentation tests, app suites as needed, `pnpm build`, `pnpm docs:check`, and `bash scripts/pr-ready-check.sh`.
