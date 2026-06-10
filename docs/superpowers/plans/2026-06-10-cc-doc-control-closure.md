---
tier: living
purpose: build
title: 'CC-DOC control closure documentation propagation'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, report, docs, adr, wireframes]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
implements:
  - docs/03-features/workflows/control.md
  - docs/03-features/workflows/report.md
  - docs/03-features/workflows/project-dashboard.md
---

# CC-DOC Control Closure Documentation Propagation

## Grounding

- Read the master plan CC-DOC scope and the delivered spec.
- Read `control.md`, `report.md`, `project-dashboard.md`, ADR-080, the ADR index, decision-log, decision-card conventions, and named-view wireframe conventions.
- Checked `gh pr list`; only unrelated dependabot PRs were open.
- Started from `origin/main` after CC-7 merge in dedicated worktree `.worktrees/codex/cc-doc-control-closure`.

## Goal

Propagate the delivered Control closure + Report end-state model into the living docs: live feature docs, ADR supersession, named-view wireframe, decision card/log, and plan/spec lifecycle markers.

## Checklist

- [x] Update Control, Report, and Project Dashboard feature docs to the shipped baseline/re-check/closure model.
- [x] Supersede ADR-080 in place and update the ADR index.
- [x] Add the `control-verification-band` named-view wireframe and asset.
- [x] Mark the spec, master plan, and delivered subplans as delivered.
- [x] Add a decision card and decision-log delivery closeout.
- [x] Run docs validation gates before PR.
