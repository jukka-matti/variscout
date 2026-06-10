---
tier: living
purpose: build
title: 'CC-7 closure checklist + report sub-plan'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, closure, handoff, report, baseline]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/superpowers/plans/2026-06-10-cc-5-recheck-editors.md
  - docs/superpowers/plans/2026-06-10-cc-6-ladder-prompts.md
implements:
  - docs/03-features/workflows/control.md
---

# CC-7 Closure Checklist + Report Plan

## Grounding

- Read master plan `docs/superpowers/plans/2026-06-10-control-closure-master-plan.md`, CC-7 scope and acceptance.
- Read spec `docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md`, especially section 8.
- Read current `packages/ui/src/components/IPDetail/stages/ControlOverview.tsx`, its tests, `packages/core/src/control.ts`, `packages/core/src/report/ipReport.ts`, and report tests.
- Checked `gh pr list` before starting; only unrelated dependabot PRs were open.
- Started from `origin/main` after CC-6 merge in dedicated worktree `.worktrees/codex/cc-7-closure-report`.
- Attempted to dispatch a read-only subagent reviewer, but the thread limit was reached; proceed locally with focused negative-control tests.

## Goal

Replace the remaining closure checklist with the CC-7 checklist: handoff recorded, owner accepted, ladder walked or analyst override with required reason, and sustainment confirmed. Update the single-project report narrative so "Where we started" can include the frozen baseline anchor and "Did it work?" reads the re-check sequence plus comparison summary instead of verdict-tick copy.

## Implementation Checklist

- [x] Add/adjust ControlOverview tests for complete checklist, blocked states, override reason requirement, and no retired checklist labels.
- [x] Replace `ControlClosureInputs` and checklist rendering with CC-7 fields and derived status text.
- [x] Update Azure/PWA closure input derivation to supply handoff, ladder, and sustainment-confirmed state without automatic writes.
- [x] Add report tests for baseline anchor, re-check sequence, comparison summary, and simplified handoff narrative.
- [x] Update `deriveIPReportNarrative` / cause-row verification labels to use re-check sequence and baseline anchor.
- [x] Run focused UI/core report tests, app control/report tests as needed, `pnpm docs:check`, `pnpm build`, and `bash scripts/pr-ready-check.sh`.
