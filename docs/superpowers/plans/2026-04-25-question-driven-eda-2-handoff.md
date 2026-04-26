---
title: Question-Driven EDA 2.0 — Session Handoff
audience: [engineer, product]
category: implementation
status: draft
date: 2026-04-25
related:
  [
    question-driven-eda-2,
    current-understanding,
    mechanism-branches,
    signal-cards,
    survey,
    investigation-wall,
    process-flow,
    yamazumi,
    design-system,
    accessibility,
  ]
---

# Question-Driven EDA 2.0 — Session Handoff

## Current State

The methodology spec has been written, verified, and committed.

- Spec: `docs/superpowers/specs/2026-04-25-question-driven-eda-2-design.md`
- Companion spec: `docs/superpowers/specs/2026-04-25-process-flow-yamazumi-integration-design.md`
- UI concept extraction: `docs/superpowers/specs/2026-04-25-claude-design-ui-concept-extraction.md`
- Branch workspace phase plan:
  `docs/superpowers/plans/2026-04-25-qde-2-branch-workspace.md`
- Spec index updated: `docs/superpowers/specs/index.md`
- Commit: `db09060c docs: add question-driven eda 2 spec`
- Verification run: `pnpm docs:check` passed during the commit hook.

An isolated feature worktree was created before the session was paused:

- Worktree: `.worktrees/qde2-mechanism-branches`
- Branch: `feature/qde2-mechanism-branches`
- Base commit: `db09060c`

No implementation plan has been written yet. No product code changes for QDE 2.0 have been made.

## Product Direction To Preserve

The accepted direction is:

```text
Issue / Concern
-> Current Understanding
-> Problem Condition
-> Clues
-> Suspected Mechanism Branches
-> Next Move
-> deeper loop or improvement
```

Key decisions:

- The user works with **branches of understanding**, not raw object types.
- `SURVEY` is a horizontal evaluator across phases, not only an import screen.
- Existing analysis modes should be reframed as **instrument sets** selected by data shape and question.
- The first spec from this session is part of the same design: Process Flow locates the constraint, scoped-step Yamazumi explains waste inside it, and QDE 2.0 turns both outputs into clues and next moves inside Mechanism Branches.
- The Claude Design UI concepts should be used through tracked design-system patterns, not copied directly from deck styling.
- Investigation is not only evidence collection; it is process understanding and may surface missing deeper data.
- Measurement trust enters through **Signal Cards**, not a resurrected standalone Gage R&R mode.
- Cp/Cpk should stay simple: show Cp and Cpk over authored process moments, with average Cp/Cpk by stage.
- The issue-to-problem-statement flow stays, but Problem Statement becomes an approved output of Current Understanding, not an upfront form.

## Immediate Next Step

Use `superpowers:writing-plans` to write the implementation plan at:

```text
docs/superpowers/plans/2026-04-25-question-driven-eda-2-implementation.md
```

The plan should be phased. Do not attempt the whole spec in one PR.

Recommended implementation slices:

1. Design-system foundation for investigation workspaces, Signal Cards, AI-independent proposal UX, and alternate structured views.
2. Vocabulary and Current Understanding.
3. Branch-based Investigation UI projection.
4. Survey evaluator foundation.
5. Signal Cards foundation.
6. Cp/Cpk process moments in Subgroup Builder / capability view.

## Important Guardrails

- Do not collapse all analysis modes into one implementation.
- Do not expose `Finding`, `Question`, `Hypothesis`, `Gate`, `SignalCard`, and `Evidence` as equal user-facing objects.
- Do not add Gage R&R as a top-level mode.
- Do not claim mechanisms are confirmed before post-action verification.
- Do not turn p-values, missing disconfirmation, weak power, or weak trust into
  rigid compliance gates. Surface them as advisory prompts for practical next
  moves.
- Keep deterministic logic as authority; CoScout may draft, suggest, and explain.
- Preserve browser-only processing and existing store/package boundaries.
- Treat documentation as part of implementation. Each slice should update the
  affected methodology, product workflow, design-system, ADR/spec, and
  user-journey docs in the same PR or commit series as the code.

## Context References

Read these before planning:

- `docs/superpowers/specs/2026-04-25-question-driven-eda-2-design.md`
- `docs/superpowers/specs/2026-04-25-claude-design-ui-concept-extraction.md`
- `docs/06-design-system/patterns/investigation-workspaces.md`
- `docs/06-design-system/patterns/qde2-ui-view-contracts.md`
- `docs/06-design-system/components/signal-branch-components.md`
- `docs/01-vision/eda-mental-model.md`
- `docs/01-vision/references/turtiainen-2019-eda-mental-model.md`
- `docs/03-features/workflows/question-driven-investigation.md`
- `docs/superpowers/specs/2026-04-04-investigation-spine-design.md`
- `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`
- `docs/superpowers/specs/2026-04-25-process-flow-yamazumi-integration-design.md`
- `docs/07-decisions/adr-010-gagerr-deferral.md`
- `docs/07-decisions/adr-070-frame-workspace.md`

## Resume Commands

From the main repo:

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/qde2-mechanism-branches
git status --short
pnpm docs:check
```

If continuing plan-writing only, product tests are not required before writing the plan. Before implementing product code, run the appropriate baseline tests in the worktree.
