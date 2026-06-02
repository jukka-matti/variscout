---
tier: ephemeral
purpose: build
title: 'Documentation Alignment — Master Plan (wave sequencer)'
audience: both
status: active
date: 2026-06-02
layer: spec
---

# Documentation Alignment — Master Plan (wave sequencer)

> **For agentic workers:** This is the execution sequencer for the [documentation-alignment design spec](../specs/2026-06-02-documentation-alignment-design.md). It is NOT a task-level plan — each Wave gets its own bite-sized sub-plan (`docs/superpowers/plans/2026-06-02-doc-align-wave-N.md`) written **just-in-time** via `superpowers:writing-plans`. Re-check `main` and ground every doc against shipped code before writing (`feedback_subagent_grounding_catches_drift`).

**Goal:** sequence the doc-alignment initiative so each Wave produces a self-contained, mergeable batch of canonical docs, in priority order, against a frozen code state.

**Design SSOT:** [`2026-06-02-documentation-alignment-design.md`](../specs/2026-06-02-documentation-alignment-design.md) — coverage matrix, cluster→doc map, architecture, governance. This plan does not repeat it; it tracks execution.

**Method (per Wave):** write the Wave's sub-plan via `superpowers:writing-plans` → execute **single-implementer** (coherence across docs matters; parallel writers collide on the shared tree + lint-staged — see `feedback_one_worktree_per_agent`) → gate on `pnpm docs:check:frontmatter` + `pnpm docs:check` → commit per task (docs-direct-to-main). Adopt SDD frontmatter (`last-verified` + `verified-against-commit`, `kind:`/`serves:`/`implements:`, intent diagrams) on every doc touched/created.

**Freeze:** product refactoring (the R-series) is paused until this initiative completes (decision-log 2026-06-02). Docs are written against the frozen post-R6e/R6f state.

---

## Wave sequence

| Wave  | Scope                                                    | Primary docs                                                                                                                                                                                                                          | Depends on | Status                                                   |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------- |
| **0** | Cross-cutting + governance                               | `specifications.md` (slim), `ia-nav-model.md` (de-personalize), `USER-JOURNEYS.md` (Analyze sub-journey), `eda-mental-model.md` (L1 §2–7), archive `question-driven-analyze.md`, stub triage, **Apply-phase sensor** in the validator | —          | **planned** → sub-plan: `2026-06-02-doc-align-wave-0.md` |
| **1** | Investigation Surface / Analyze (the journey rewrite)    | refresh `analyze-wall.md`; new `investigation-surface.md`; model-builder / test-plan / disconfirmation / What-If as sections                                                                                                          | Wave 0     | not started                                              |
| **2** | Save / Load / Access (R6 contract)                       | refresh `data/{storage,export,acl,etag-concurrency,cloud-sync}.md` stubs; new `data/save-and-load.md`                                                                                                                                 | Wave 0     | not started                                              |
| **3** | Findings / Collaboration + CoScout                       | new `findings-hypotheses.md`, `collaboration.md`; refresh `ai/coscout.md`                                                                                                                                                             | Wave 1     | not started                                              |
| **4** | Remaining surfaces                                       | new `home.md`, `report.md`; refresh Process/Explore/Improve/Project + Measurement-Plan + Values⇄Capability                                                                                                                            | Waves 1–3  | not started                                              |
| **5** | Developer / architecture docs (L4 / package `CLAUDE.md`) | thin factories, `wallLayout`, `FindingSource`, `buildAIContext`, viewport store, dirty-state fingerprint                                                                                                                              | Waves 1–4  | not started                                              |

Dependencies are soft (terminology lineage), not hard blocks — but execute in order so shared vocabulary settles before downstream waves inherit it.

## Per-wave notes

- **Wave 0 is highest-leverage:** `specifications.md` + `ia-nav-model.md` are inherited (stale) by 4 tabs' cross-references, and the Apply-phase sensor stops the backlog recurring for every later Wave. Do it first.
- **Wave 1 absorbs the cluster-1 capabilities** (model-builder, test-plan triad, disconfirmation, What-If, Evidence Map, Focus lens) as **sections within** `analyze-wall.md` + a new `investigation-surface.md` spine — not 9 separate docs (see spec §3 "one doc or many").
- **Wave 1 also physically archives `question-driven-analyze.md`** (Wave 0 superseded it in place) — `git mv` to `docs/archive/workflows/` + repoint its ~20 inbound links, done coherently when the Analyze-cluster docs (`analyze-to-action`, `analysis-journey-map`, `analyze-lifecycle-map`, `index`, `yamazumi`, `improvement-workspace`, …) are rewritten. Doing it in Wave 0 would have broken ~20 links + touched Wave-1-owned docs prematurely.
- **Waves 1–5 sub-plans are written just-in-time** — after the prior wave lands, re-grounded against the then-current `main`. Do not pre-write them (plan-as-you-execute; avoids baking in drift).

## Status tracker (update as waves land)

- [ ] Wave 0 — cross-cutting + governance
- [ ] Wave 1 — Investigation Surface / Analyze
- [ ] Wave 2 — Save / Load / Access
- [ ] Wave 3 — Findings / Collaboration + CoScout
- [ ] Wave 4 — remaining surfaces
- [ ] Wave 5 — developer / architecture docs

When all six land: flip the upstream specs (`2026-05-29-investigation-surface`, `2026-05-31-factors-evaluation`) to `delivered`, close the `investigations.md` "Doc + user-journey alignment" entry, and record initiative completion in `decision-log.md` (which also re-opens the R-series freeze).
