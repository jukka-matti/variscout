---
title: 'VariScout — operational roadmap (RPS V1 SHIPPED; 8f IN FLIGHT 2026-05-13)'
description: 'docs/roadmap.md. Canvas migration + F-series + PR8 + Polish v1 + RPS V1 ALL SHIPPED. 8f canvas viewport design complete (spec + ADR-081 + plan accepted 2026-05-13); implementation in flight, multi-PR on branch canvas-viewport-8f.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 91a3bbddf7457a26
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_variscout_roadmap.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

[Operational roadmap](docs/roadmap.md) (`status: living`) is the canonical "what's next" surface. Decision-log captures the *why* of prioritization changes; roadmap captures the *current sequence*. Heavyweight horizon planning (H0/H1/H2/H3) lives in vision spec §6+.

**Just-shipped chapter (post-canvas-migration era):**

- Canvas migration COMPLETE 2026-05-08 — PR1–PR9 + Polish v1 (PRs #119–#143)
- Data-Flow Foundation F-series 6 of 7 SHIPPED 2026-05-06/07 — F1–F4 (PRs #130–#136). F5 work (`SUSTAINMENT_*` / `CONTROL_HANDOFF_*` HubAction kinds) **now subsumed by RPS V1 PR-RPS-9 + PR-RPS-10**. F6 named-future.
- PR8 Vision Alignment SHIPPED 2026-05-08 — 5 of 6 commitments closed (8a/8b/8d/8e). 8f deferred.
- Canvas Polish v1 SHIPPED 2026-05-08 (PR #143)
- **RPS V1 PR-RPS-1 SHIPPED 2026-05-09 (PR #144)** — naming reconciliation (`SuspectedCause` → `Hypothesis`, 5-state `HypothesisStatus`, `themeTags`) + Wall package re-home (`packages/charts` → `packages/ui`) + ADR-053/064 amendments. 248 files / +2131 / -1954 / 8 commits + 2 follow-up fixes. All ~7027 tests green at merge.
- **RPS V1 PR-RPS-2 SHIPPED 2026-05-09 (PR #147)** — Wall Detective-pack: 5th status + confirm-gate Survey rule. Plan-grounding gap closed (added `Finding.evidenceType` + `Finding.refutes`); Survey module dual-API surface preserved; OneStepAwayBadge UI; squash `45e25c9e`.
- **RPS V1 PR-RPS-3 SHIPPED 2026-05-09 (PR #148)** — Wall Detective-pack: mini-charts inside HypothesisCard. 4 plan-vs-code reconciliations done in plan-mode (CARD_H grow + drop MiniScatter + outcome via WallCanvas prop + theme color names). MiniIChart + MiniBoxplot rendered in `<ChartSlot>`; deterministic dots fallback; squash `d0ad3d48`.
- **RPS V1 PR-RPS-4 SHIPPED 2026-05-09 (PR #149)** — Wall Detective-pack: brush-to-pin + missing-evidence panel. 3 architectural refinements (polymorphic gesture pattern; store-direct `addFinding`; MissingEvidenceDigest deletion in favor of rule-driven panel). E2E deferred via documented test.skip; squash `f2d42fee`.
- **RPS V1 PR-RPS-5 SHIPPED 2026-05-10 (PR #150)** — IP V1 engine: types + HubAction (CREATE/UPDATE/ARCHIVE) + PWA/Azure persistence + Document store + .vrs round-trip + D18 primitives (`useLiveProjection`, `computeSourceHash`, `shouldShowDrift`). Azure Dexie v9→v10 clean break; deep-merge contract locked; squash `29ff5a87`.
- **RPS V1 PR-RPS-6 + PR-RPS-7 SHIPPED 2026-05-10 (PR #152, bundled)** — IP V1: 6-section UI + multi-level Goal + per-app shells + cross-surface badges. Stacking sub-PR #151 (`codex/pr-rps-6 → response-path-system-v1`) rolled into PR-RPS-7's #152 squash `bec29c78`. Internal `94625cdc` exists in feature-branch history but never directly hit main.
- **RPS V1 PR-RPS-8 SHIPPED 2026-05-10 (PR #153)** — Quick Action surface (LogActionModal + RecentActivityPanel) + canvas-card wiring. Path 1 of 5 per spec D14 (orphan ActionItem; dual flavor); squash `8234c757`.
- **RPS V1 PR-RPS-9 SHIPPED 2026-05-13 (PR #154)** — Sustainment V1: `SUSTAINMENT_*` HubAction kinds + auto-fire on IP→Sustain + drift survey rules + Inbox digest. Subsumes F5 sustainment work. [[adr-080-sustainment-auto-fire-pattern]] authored as pattern reference; squash `5f95e6fd`.
- **RPS V1 PR-RPS-10 SHIPPED 2026-05-13 (PR #155)** — Handoff V1: `CONTROL_HANDOFF_*` HubAction kinds + `HandoffForm` + per-app `HandoffPanel` + sponsor signoff (visible-with-lock free / active paid per D9) + 8-station E2E (`apps/azure/e2e/full-lifecycle.spec.ts`). **Closes RPS V1.** Squash `12e1257b`.

**RPS V1 COMPLETE 2026-05-13 — 10 of 10 PRs shipped.** Spec + plan promoted to `delivered`. Decision-log entry pinned. ADR-080 captures the Sustainment-shaped lifecycle pattern.

**8f Canvas Viewport Architecture — design phase COMPLETE 2026-05-13; implementation IN FLIGHT.** Closes the last unmet vision §5.4 commitment (levels-as-pan/zoom). Spec [`2026-05-13-canvas-viewport-architecture-design.md`](docs/superpowers/specs/...) (`status: accepted`) + [ADR-081](docs/07-decisions/adr-081-canvas-viewport-architecture.md) + ADR-074 amendment + plan [`2026-05-13-canvas-viewport-architecture.md`](docs/superpowers/plans/...) all live on main. 13 locked decisions from brainstorm. Implementation: 6 PRs / ~40 tasks on branch `canvas-viewport-8f` (re-cut per PR), Codex sessions with `superpowers:subagent-driven-development`. See [[project_canvas_viewport_8f]] for full status + pre-flight notes.

**Other workstreams (post-RPS-V1):**

- Canvas-filter writers + E2E (slice 4 P3.6 / P4.2 / P4.3) — S, no deps
- Small canvas-UX polish bundle — S, no deps
- 8f canvas viewport architecture — L, needs design conversation (ADR-080 was reserved here but is now taken by Sustainment; pick next free ADR number)
- Security hardening implementation — L, multi-PR rollout
- F6 multi-investigation lifecycle — L+, named-future

**Updated heuristics (post-RPS-V1 brainstorm 2026-05-09):**

1. User-visible value beats foundation by default
2. Honor vision commitments verbatim (`feedback_honor_vision_commitments`)
3. **Step back when piecewise design surfaces structural debt** (`feedback_step_back_for_system_design`) — RPS V1 itself is the precedent
4. **Drop methodology bridges when product has its own opinionated journey** (`feedback_drop_methodology_bridges`)
5. Verify methodology before gating (`feedback_verify_methodology_before_gating`)
6. Tier-gate inside surfaces (`feedback_tier_gate_inside_surface`)
7. Slice cap ~6-8 tasks per PR (`feedback_slice_size_cap`)
8. Brainstorm-first for design-heavy slices
9. Subagent-driven default for execution (`feedback_subagent_driven_default`)
10. **Code-review subagents must check out PR branch before assessing** (`feedback_code_review_subagent_must_checkout_pr_branch`) — RPS V1 PR-RPS-1 review precedent
11. Customer asks accelerate items; foundation fills momentum gaps

**Cross-references:** `docs/roadmap.md`; `docs/decision-log.md`; `docs/investigations.md`; vision spec §6+; `project_response_path_system_v1`; `project_pr8_canvas_vision_alignment`; `project_data_flow_foundation_fseries`.
