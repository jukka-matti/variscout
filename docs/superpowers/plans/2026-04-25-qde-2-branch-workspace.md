---
title: QDE 2.0 Branch Workspace Phase Plan
audience: [engineer, product]
category: implementation
status: delivered
date: 2026-04-25
related: [question-driven-eda-2, mechanism-branches, investigation-wall]
---

# QDE 2.0 Branch Workspace Phase Plan

## Scope

This phase reframes the existing Investigation Wall as the Mechanism Branch
workspace. Mechanism Branch is a projection over `SuspectedCause`, linked
questions, linked findings, and optional process context. It is not a new domain
store and not a separate persisted top-level entity.

## Implementation Shape

- Add optional branch-facing fields to `SuspectedCause` for readiness/status,
  branch-level `nextMove`, counter-clue references, and open-check references.
- Add a pure core projection helper that creates `MechanismBranchViewModel`
  objects from hubs, questions, findings, and optional process context.
- Update Wall cards and mobile card lists to speak in Mechanism Branch language
  and show suspected mechanism, supporting clues, counter-clues, open checks,
  readiness, and next move.
- Let the Wall render without `processMap`; process-map tributary grouping is an
  enhancement when available.
- Persist branch-level next moves through the existing suspected-cause update
  path.
- Keep investigation-level `processContext.nextMove` as the Process Hub summary
  line, editable separately from branch next moves.
- Reuse existing CoScout suspected-cause proposal flow; accepted proposals become
  branch-visible content.

## Out Of Scope

- New CoScout branch tools.
- Signal Card implementation.
- Survey evaluator implementation.
- Measurement-study planning.
- Control Plan Lite.
- A fifth domain Zustand store.

## Verification Targets

- Core projection tests for support/counter clues, open checks, readiness, and
  legacy hub compatibility.
- Charts/UI tests for Branch language, card sections, no-process-map rendering,
  mobile structured branch cards, and process-map grouping.
- Azure/PWA integration tests for chart-first investigations without a process
  map and branch next-move persistence.
- Documentation and repository checks: `pnpm docs:check`, `pnpm check:i18n`,
  targeted package tests, Azure build, and `bash scripts/pr-ready-check.sh`.
