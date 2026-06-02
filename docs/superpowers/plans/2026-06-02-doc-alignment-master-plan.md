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

| Wave  | Scope                                                    | Primary docs                                                                                                                                                                                                                          | Depends on | Status                                             |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| **0** | Cross-cutting + governance                               | `specifications.md` (slim), `ia-nav-model.md` (de-personalize), `USER-JOURNEYS.md` (Analyze sub-journey), `eda-mental-model.md` (L1 §2–7), archive `question-driven-analyze.md`, stub triage, **Apply-phase sensor** in the validator | —          | **✅ COMPLETE** · `2026-06-02-doc-align-wave-0.md` |
| **1** | Investigation Surface / Analyze (the journey rewrite)    | refresh `analyze-wall.md`; new `investigation-surface.md`; model-builder / test-plan / disconfirmation / What-If as sections                                                                                                          | Wave 0     | not started                                        |
| **2** | Save / Load / Access (R6 contract)                       | refresh `data/{storage,export,acl,etag-concurrency,cloud-sync}.md` stubs; new `data/save-and-load.md`                                                                                                                                 | Wave 0     | not started                                        |
| **3** | Findings / Collaboration + CoScout                       | new `findings-hypotheses.md`, `collaboration.md`; refresh `ai/coscout.md`                                                                                                                                                             | Wave 1     | not started                                        |
| **4** | Remaining surfaces                                       | new `home.md`, `report.md`; refresh Process/Explore/Improve/Project + Measurement-Plan + Values⇄Capability                                                                                                                            | Waves 1–3  | not started                                        |
| **5** | Developer / architecture docs (L4 / package `CLAUDE.md`) | thin factories, `wallLayout`, `FindingSource`, `buildAIContext`, viewport store, dirty-state fingerprint                                                                                                                              | Waves 1–4  | not started                                        |

Dependencies are soft (terminology lineage), not hard blocks — but execute in order so shared vocabulary settles before downstream waves inherit it.

## Per-wave notes

- **Wave 0 is highest-leverage:** `specifications.md` + `ia-nav-model.md` are inherited (stale) by 4 tabs' cross-references, and the Apply-phase sensor stops the backlog recurring for every later Wave. Do it first.
- **Wave 1 absorbs the cluster-1 capabilities** (model-builder, test-plan triad, disconfirmation, What-If, Evidence Map, Focus lens) as **sections within** `analyze-wall.md` + a new `investigation-surface.md` spine — not 9 separate docs (see spec §3 "one doc or many").
- **`question-driven-analyze.md` stays superseded-in-place** (banner → `investigation-surface.md`). Wave 1 strengthened the pointer + flagged the index entry, but **deferred the physical `git mv`** to the Play 1b folder restructure: the doc is honestly superseded + points to the canonical replacement, so moving it now would churn ~20 inbound links across specs/plans/feature-docs for cosmetic gain. The folder restructure relocates it (and the rest) coherently.
- **Waves 1–5 sub-plans are written just-in-time** — after the prior wave lands, re-grounded against the then-current `main`. Do not pre-write them (plan-as-you-execute; avoids baking in drift).

## Status tracker (update as waves land)

- [x] Wave 0 — cross-cutting + governance — **COMPLETE 2026-06-02** (commits `0b0d4cc0`…`e24fbdba`)
- [x] Wave 1 — Investigation Surface / Analyze — **COMPLETE 2026-06-02** (commits `94acf2aa`…`9e70a9df`; adversarial review: accurate)
- [x] Wave 2 — Save / Load / Access — **COMPLETE 2026-06-02** (commits `7f6945d0`…`818de70b`; review: accurate). Stubs were grounding-verified accurate (audit over-flagged); authored `save-and-load.md` + stamped/linked the 5 stubs; full stub-body completion deferred to M3.
- [x] Wave 3 — Findings / Collaboration + CoScout — **COMPLETE 2026-06-02** (commits `a7b42ce2`…`26954a6e`+fixup; review: accurate). New `findings-hypotheses.md` + `collaboration.md`; fixed `ai-context-engineering.md` deleted-fn refs (the Wave 0 T7 deferral); stamped `coscout.md`.
- [x] Wave 4 — remaining surfaces — **COMPLETE 2026-06-02** (commits `fe9d52c0`…`6ae88307`; review caught + fixed 2 grounding errors in report.md). New `home.md` + `report.md`; fixed `improvement-workspace.md` (SuspectedCause/Question→Hypothesis); the other refresh docs were grounding-verified accurate + stamped.
- [x] Wave 5 — developer / architecture docs — **COMPLETE 2026-06-02** (commits `6102a4cb`…`0ecd5d51`; review caught + fixed 2 precision errors). 2 net-new L4 notes (`app-feature-factories-pattern`, `persistence-internals`); the rest was already covered by Waves 1–4 (no duplication).

## ✅ ALL 6 WAVES COMPLETE — 2026-06-02

The doc-alignment initiative is delivered. `investigations.md` "Doc + user-journey alignment" entry marked `[RESOLVED 2026-06-02]`; `decision-log.md` records completion **and lifts the R-series freeze** (product refactoring may resume). Recurrent theme across the run: the original coverage audit **over-flagged** repeatedly — grounding-against-code before each wave found most docs less stale than claimed, and the per-wave adversarial reviews caught the handful of genuine errors (the PWA-print claim, the 7-vs-8 sections, `createAction`, the ETag backoff). Net new canonical docs: `investigation-surface`, `findings-hypotheses`, `collaboration`, `save-and-load`, `home`, `report` + 2 L4 notes; refreshed `analyze-wall`, `eda-mental-model`, `ia-nav-model`, `specifications`, `USER-JOURNEYS*`, `improvement-workspace`, `ai-context-engineering` + data stubs; superseded `question-driven-analyze`; shipped the **Apply-phase sensor** so the backlog can't silently recur.

**Follow-up — DONE 2026-06-02 (commit `a759da68`):** flipped the upstream `2026-05-29-investigation-surface` (← IM-0…IM-7, PRs #243–#263) + `2026-05-31-factors-evaluation` (← FE-1/2a/2b, PRs #260–#262) specs `draft → delivered` with `delivered-by` + ✅ Delivered banners (all PRs verified merged first); repointed factors-evaluation `implements:` off the prior Wall _spec_ onto the real doc homes (`analyze-wall.md` + `findings-hypotheses.md`); stamped the 4 lagging implements targets. **Apply-phase sensor is now fully green (947 docs, 0 WARN).** A separate Wave-6 coherence pass (commit `6ca89f14`) cleared the 5 residual stale docs (constitution / positioning / methodology / analyze-to-action / improvement-workspace) the completeness audit surfaced + the feature-index graph gaps. Remaining Category-3 follow-ups (CoScout-Tools / Hub-Creation / Admin-Hub / Process-Hub-views docs; Voice Input deferred) are tracked in `investigations.md` for Apply-on-edit — see the "Doc + user-journey alignment" entry.
