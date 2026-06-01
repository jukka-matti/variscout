---
title: 'VariScout Product Vision'
description: 'Canonical vision spec at docs/superpowers/specs/2026-05-03-variscout-vision-design.md. Hub IS canvas IS logic map. §8 + Q0 resolved 2026-05-03 — Canvas replaces Frame + Analysis tabs; Investigation / Improvement / Report keep own surfaces; R6d makes PWA session-only with .vrs durability. FRAME canvas detail spec is the next brainstorming target.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 50730819473e5593
origin-session-id: d634a930-572b-46ae-aa5c-97fe4d2db39f
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_variscout_vision.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The single canonical product vision spec, written 2026-05-03 from a brainstorm and §8 resolved 2026-05-03 in a follow-up walk-through. Lives at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (status: accepted). Supersedes the 2026-04-27 operating-model + product-method-roadmap specs (now in `docs/archive/specs/`; the roadmap doc re-tagged as a delivery-sequence reference, not a vision document).

**Core thesis:** "The map is the product." A Process Hub IS its logic map. Every dataset belongs to a Hub. Hubs persist across investigations, snapshots, and time.

**Key commitments locked in the spec:**

- **Methodology spine** (§2): three-level model (System/Outcome → Process Flow → Local Mechanism); observed-vs-expected universal lens; ADR-073 + contribution-not-causation + sample-size honesty + target-relative Cpk + geometric interaction language; **five response paths** (quick action / focused investigation / charter / sustainment / handoff).

- **Hub = Canvas = Logic Map** (§3): one persistent map per process line; the canvas is a directed acyclic graph with branch + join + two-level nesting (parallel/sequential modifier) + context propagation. **10 canvas commitments** in §3.3 are load-bearing.

- **One continuous canvas** replaces today's Frame + Analysis tabs (per Q0). The river-SIPOC / `LayeredProcessView` / `LayeredProcessViewWithCapability` components get absorbed into the Canvas as a mode lens. The river metaphor and "tributary" / "CTS" jargon retired user-facing (see `docs/glossary.md` retired-terms section). Engine + data model survive; surface is rebuilt.

- **Cards-with-inline-mini-charts per step**, click → drill-down (per Q1: floating overlay anchored near clicked card, blurred-canvas backdrop). Mode lenses replace the separate Analysis tab; modes (yamazumi / performance / defect / process-flow / capability) become reskins of the canvas, not separate pages. Levels (System/Flow/Local) are orthogonal — canvas pan/zoom, not a picker (Q3).

- **Hypotheses are an optional canvas overlay** (§3.4 + Q11). Promoted hypotheses (ADR-064 SuspectedCause hubs past evidence threshold) render as node markers; draft hypotheses render as faint arrows. Default off; toggle in the canvas overlay rail alongside investigations / suspected causes / recent findings.

**§8 + Q0 resolved 2026-05-03 — 12 locked decisions:**

| #  | Headline                                                                                                                                                |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q0 | **Canvas eats Frame + Analysis tabs.** Investigation / Improvement / Report keep own surfaces. Wall is dual-home. `JourneyPhase` retires as nav driver. |
| Q1 | **Drill-down = modern floating overlay** anchored near clicked card with blurred backdrop. Mobile slides up from bottom. CoScout untouched.             |
| Q2 | Small `[✎]` icon on card → inline `SpecEditor`. **Card display falls back to `mean ± σ + n` + `+ Add specs` chip** when specs are absent.                |
| Q3 | Baseline overlays always shown; mode = opt-in re-skin. **Levels are orthogonal axes**, not a picker (canvas pan/zoom).                                  |
| Q4 | **Wall is dual-home**: destination in Investigation tab AND a canvas overlay. Same data, two views.                                                      |
| Q5 | **No CoScout map drafting in V1.** Manual click/drag/connect canvas authoring as first-class design concern.                                            |
| Q6 | Horizons live outside the vision spec (delivery-sequence reference). Vision = destination; horizons = path.                                              |
| Q7 | **Hard cutover, no migration window.** No users yet to preserve. Deletes happen in the same PR.                                                          |
| Q8 | **PWA = session-only with `.vrs` durability after R6d.** Azure adds cloud sync + multi-Hub + cadence + CoScout + team features.                         |
| Q9 | `lazyWithRetry` on Canvas component. ADR-075 autoUpdate stays. No prompt-mode SW.                                                                        |
| Q10 | **`docs/glossary.md` is canonical** for all VariScout terminology (incl. retired tributary / CTS). methodology.md cross-refs it.                         |
| Q11 | Optional canvas overlay. Promoted hypotheses → node markers; draft hypotheses → faint arrows. Default off.                                              |

**What stays unchanged:** production-line-glance C2 engine (per-(node × context-tuple) capability, PR #107) is the math under the canvas; investigation graph data model (questions/hypotheses/findings); Hub data model; per-characteristic spec model; PWA + Azure dual deployment; CoScout coaching architecture; Evidence Source concept (folded into "Hub with cadence"); customer-owned-data principle (ADR-059); pop-out pattern (`usePopoutChannel`); PWA SW behavior (autoUpdate + skipWaiting per ADR-075).

**Spec edits landed 2026-05-03 (commit `f12e8b1a`):** vision §3.4 / §5.2 / §5.3 / §5.4 / §5.6 / §5.7 / §6 / §7 / §8 rewritten in place; §8 replaced "open questions" with a "resolved decisions" table; frontmatter status promoted draft → accepted. ADR-070 amended with 2026-05-03 supersession note (FRAME tab retired). Decision-log §1 appended with the 2026-05-03 §8-resolution entry.

**Doc follow-ups landed 2026-05-03 (commit `c8a7c763`), amended by R6d on 2026-06-01:** `docs/glossary.md` got "Process methodology terms" + "Retired terms" sections; `docs/01-vision/methodology.md` now cross-references the glossary; ADR-068 amended with mode-vs-level orthogonality note (Q3); ADR-059 now records PWA export-only durability; roadmap doc re-tagged as delivery-sequence reference (Q6).

**Decision-log pin** at `docs/decision-log.md` §1 Replayed Decisions: "2026-05-03 — Vision §8 open questions resolved + Q0 (structural prerequisite) added."

**Brainstorm transcript:** `~/.claude/plans/i-would-like-to-composed-rose.md` (the original spec brainstorm). **§8 walk-through transcript:** `~/.claude/plans/lets-do-this-next-rustling-simon.md` (the resolution session — full rationale + alternatives rejected).

**FRAME canvas detail spec** (the 10 commitments × surfaces translated into detailed UX with drag affordances, hit-test rules, animation, mobile, and exact card layouts) is the next brainstorming target. Inheriting the 12 locked decisions plus R6d, the spec should focus on: manual canvas authoring UX (drag-to-connect, multi-select sub-step grouping, branch/join discoverability — Q5's first-class concern), the floating-overlay drill-down component design, the canvas overlay rail, and `.vrs`-based PWA scenario handoff.
