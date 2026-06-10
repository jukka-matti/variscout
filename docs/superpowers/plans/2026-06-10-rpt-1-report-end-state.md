---
tier: living
purpose: build
title: 'RPT-1 report end-state sub-plan'
audience: agent
status: active
date: 2026-06-10
layer: spec
topic: [report, workspace, fallback, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
implements:
  - docs/03-features/workflows/report.md
---

# RPT-1 Report End-State Sub-Plan

- [x] Replace fallback tests with expected single-project Report behavior and informal header hint coverage.
- [x] Run targeted tests to record the expected red failures.
- [x] Delete core portfolio report derivation/types and report-area portfolio exports/aliases.
- [x] Delete shared UI portfolio component/test and expose the header hint through `ReportViewBase`.
- [x] Remove PWA/Azure fallback branches, route fresh informal workspaces to the single-project report, and replace the PWA null-`sessionHub` fallback with an invariant.
- [x] Run scoped verification commands and grep for obsolete report-area portfolio naming.
- [x] Commit from the assigned worktree/branch after the branch guard passes.
