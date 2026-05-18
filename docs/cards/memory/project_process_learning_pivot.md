---
title: 'Process Learning System pivot (2026-04-26/27) — superseded by vision spec 2026-05-03'
description: 'Major product framing shift via Codex-synthesized specs. SUPERSEDED 2026-05-03 by canonical vision spec. The pivot''s substance (three-level methodology, five response paths, Process Hub as operating spine) survives in vision §2 + §3; its standalone specs are archived. Devil''s-advocate critique at ~/.claude/plans/i-would-need-to-drifting-hummingbird.md.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 38028b260809f5ad
origin-session-id: 86a56343-170c-4e74-b36c-f6ef64738dc3
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_process_learning_pivot.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**SUPERSEDED 2026-05-03.** The canonical product vision is now `docs/superpowers/specs/2026-05-03-variscout-vision-design.md`. The two standalone pivot specs below are archived to `docs/archive/specs/` with `status: superseded`. Read the vision spec first; this entry is historical context.

Codex synthesized four specs from a Watson dialogue + Xerox QIP/PSP research that reframe VariScout from a mode-first stats tool to a "Process Learning System."

**Specs originally introduced (status as of 2026-05-03):**
- `docs/archive/specs/2026-04-27-process-learning-operating-model-design.md` — **archived** 2026-05-03 (absorbed into vision §2 methodology + §4 journey)
- `docs/archive/specs/2026-04-27-product-method-roadmap-design.md` — **archived** 2026-05-03 (horizons collapsed; vision is one whole, sequencing is implementation per the no-V1/V2/V3-phasing rule)
- `docs/superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md` — still active; folded into vision's "Hub with cadence" semantics (vision §3.1 + §7)
- `docs/superpowers/specs/2026-04-26-unified-process-hub-methodology-roadmap.md` — still active; companion methodology roadmap, cross-refs the vision

Plus modified `docs/01-vision/methodology.md`, `docs/DATA-FLOW.md`, `docs/USER-JOURNEYS.md`, `docs/llms.txt`.

**Key claims:**
- Three process-learning levels: System/Outcome → Flow/Process Model → Local Mechanism/Evidence (a rename of the existing Y/X/x EDA model from `eda-mental-model.md` Section 5.2 — NOT an invention from Watson's Makigami)
- Process Hub = operating home for one process; cadence + memory layer
- Process Measurement System = designed measure/evidence/snapshot/trust/cadence
- Current Process State = process-owner review surface (already implemented as `CurrentProcessState` items with `ProcessStateLens` enum)
- Five response paths: quick action / focused investigation / charter / sustainment / handoff
- "Interface, not integration" wedge — no SQL/MES/QMS deep integration
- Modes become "instrument sets" in user-facing language (code stays `mode`)

**Devil's-advocate critique:** `~/.claude/plans/i-would-need-to-drifting-hummingbird.md` (research artifact, not in repo). Captures rigor / feasibility / coherence concerns including the full 22-point transcript-vs-spec drift memo. Top 5 strongest objections:
1. Three-level model is a faithful rename of existing Y/X/x — "Makigami" branding adds the risk
2. Concrete methodology gains from transcript got abstracted (Δ(Cp-Cpk) chart, n<30 sample-size guard, observed-vs-expected unification, entity→activity→experience as flow-level structure)
3. Cp/Cpk aggregation safety is verbal promise, not engine rule (contradicts "deterministic stats engine is authority" invariant)
4. "Modes in code, instrument sets in UX" violates terminology-consistency rule from feedback memory
5. `feature/hub-review-signals` branch has 176 LOC of unmerged code with state taxonomy that doesn't match new Current Process State shape

**How to apply:** When future sessions touch pivot-era concepts (three-level model, response paths, Process Measurement System, Current Process State), read the vision spec at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` FIRST — that's authoritative. The devil's-advocate critique remains useful for known methodology gaps not yet closed by the vision (e.g., n<30 sample-size guard explicitness, observed-vs-expected unification depth). The Layered Process View component (`project_layered_process_view.md`) was a partial resolution; the vision now supersedes it with the continuous canvas.
