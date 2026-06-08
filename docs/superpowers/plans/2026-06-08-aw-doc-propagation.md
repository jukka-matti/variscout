---
tier: ephemeral
purpose: build
title: 'AW-DOC — Analyze Wall delivery documentation propagation'
audience: human
status: delivered
date: 2026-06-08
last-reviewed: 2026-06-08
layer: spec
topic: [analyze, wall, docs, adr, decision-log]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/07-decisions/adr-066-evidence-map-analyze-center.md
implements:
  - docs/03-features/workflows/analyze-wall.md
  - docs/03-features/workflows/investigation-surface.md
---

# AW-DOC Propagation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Propagate the delivered Analyze Wall redesign into canonical docs after AW-1 through AW-9 landed.

**Architecture:** This is a docs-only Apply step on `main`: update current-state L3 workflow docs in place, append an ADR amendment to ADR-066, add decision cards, then regenerate `docs/decision-log.md`. Do not create side-amendment specs; keep the design spec as the design history and make product docs describe the shipped state.

**Tech Stack:** Markdown frontmatter, decision-card substrate, `pnpm docs:rebuild`, `pnpm docs:check`.

---

### Task 1: Supersede ADR-066 In Place

**Files:**

- Modify: `docs/07-decisions/adr-066-evidence-map-analyze-center.md`

- [ ] **Step 1: Add a reader-first amendment banner**

  Insert immediately after the H1:

  ```markdown
  > Accepted 2026-04-05 | Amended 2026-06-08 (see Amendments at bottom).
  ```

- [ ] **Step 2: Append the AW-DOC amendment**

  Add a `## Amendment — 2026-06-08` block at the bottom stating that ADR-066's "Evidence Map owns center/default" decision is superseded for the Analyze central surface by the canvas-first Wall + Causes model. Preserve the original ADR body as historical context.

- [ ] **Step 3: Verify no ADR body rewrite occurred**

  Run:

  ```bash
  git diff -- docs/07-decisions/adr-066-evidence-map-analyze-center.md
  ```

  Expected: only a top banner and bottom amendment are added.

### Task 2: Update Canonical L3 Workflow Docs

**Files:**

- Modify: `docs/03-features/workflows/analyze-wall.md`
- Modify: `docs/03-features/workflows/investigation-surface.md`

- [ ] **Step 1: Update `analyze-wall.md` frontmatter freshness**

  Set:

  ```yaml
  last-verified: 2026-06-08
  verified-against-commit: 027927efe
  ```

- [ ] **Step 2: Rewrite Wall composition sections**

  In `analyze-wall.md`, make the current state explicit:
  - Analyze lands on Wall, not Map.
  - Primary lenses are Wall and Causes; Findings remains available as the findings list/board.
  - Evidence Map is demoted to Report/read-only advanced narrative use; `CausalLink` authoring is not the default Analyze path.
  - The Wall is canvas-first with a thin Overall Problem Header, compact floating controls, current scope + switcher, left object-detail drawer, and Azure-only right CoScout drawer.
  - `% viewport that is canvas` is the acceptance metric used for the redesign.

- [ ] **Step 3: Update `investigation-surface.md` frontmatter freshness**

  Set:

  ```yaml
  last-verified: 2026-06-08
  verified-against-commit: 027927efe
  ```

- [ ] **Step 4: Rewrite the Analyze spine description**

  In `investigation-surface.md`, describe the Wall as the default Analyze projection and the Evidence Map as an advanced/report projection of the same graph. Keep WHERE/WHY, flat scopes, and contribution terminology unchanged.

### Task 3: Add Decision Cards And Regenerate Aggregate

**Files:**

- Create: `docs/cards/decisions/dec-20260608-analyze-wall-canvas-first-delivered.md`
- Modify: `docs/decision-log.md` via `pnpm docs:rebuild`

- [ ] **Step 1: Add a decision card**

  Create one card capturing the delivered AW decisions: Wall default + Map demotion, current-scope switcher instead of lineage trail, two-drawer model, `% viewport = canvas` metric, and CS-15 additive Explore handoff coordination.

- [ ] **Step 2: Rebuild generated docs**

  Run:

  ```bash
  pnpm docs:rebuild
  ```

  Expected: `docs/decision-log.md` is regenerated with the new card.

### Task 4: Validate And Commit

**Files:**

- All files touched by Tasks 1-3.

- [ ] **Step 1: Run docs validation**

  Run:

  ```bash
  pnpm docs:check
  git diff --check
  rg -n "root[[:space:]-]cause|moderat[[:alpha:]]{2,}" docs/superpowers/plans/2026-06-08-aw-doc-propagation.md docs/07-decisions/adr-066-evidence-map-analyze-center.md docs/03-features/workflows/analyze-wall.md docs/03-features/workflows/investigation-surface.md docs/cards/decisions/dec-20260608-analyze-wall-canvas-first-delivered.md
  ```

  Expected: docs checks pass, whitespace check is clean, and the forbidden-term scan returns no matches.

- [ ] **Step 2: Commit direct to main**

  Run the branch guard first:

  ```bash
  pwd
  git rev-parse --abbrev-ref HEAD
  ```

  Expected: repo root and `main`.

  Then commit:

  ```bash
  git add docs/superpowers/plans/2026-06-08-aw-doc-propagation.md docs/07-decisions/adr-066-evidence-map-analyze-center.md docs/03-features/workflows/analyze-wall.md docs/03-features/workflows/investigation-surface.md docs/cards/decisions/dec-20260608-analyze-wall-canvas-first-delivered.md docs/decision-log.md
  git commit -m "docs(analyze): propagate Analyze Wall delivery"
  ```

## Self-Review

- Master-plan AW-DOC coverage: ADR-066 supersession, `analyze-wall.md`, `investigation-surface.md`, decision-log/cards, Map demotion, lineage-trail demotion, two-drawer model, viewport metric, and CS-15 coordination are covered.
- Placeholder scan: no `TBD`, `TODO`, or deferred unspecified steps.
- Type consistency: docs use existing terms `ProblemStatementScope`, `ConditionLeaf`, `CausalLink`, `Finding`, and `Hypothesis`.
