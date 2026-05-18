---
title: 'Canvas replaces Frame + Analysis tabs (Q0, 2026-05-03)'
description: 'Top-level nav post-vision-spec is [Hubs] [Canvas] [Investigation] [Improvement] [Report]. Canvas is the spatial scanning home; Investigation / Improvement / Report keep own surfaces because they have distinct cognitive shapes. Wall is dual-home. JourneyPhase retires as nav driver but stays internal in core types.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 503ee542-f216-48e3-9706-8b2aaf6de3ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_canvas_replaces_tabs.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The most load-bearing single decision from the 2026-05-03 §8 walk-through is **Q0** — the structural prerequisite the spec didn't explicitly ask but every other §8 question depended on.

**Decision:** Canvas eats the **Frame** and **Analysis** tabs (both retire as top-level routes). The other three top-level destinations stay:

- **Investigation** — 3-column workspace shipped today (PI Panel | Wall / Evidence Map | CoScout). Different cognitive shape from canvas (diving / hypothesis-led / 30 min – hours) so it stays its own surface.
- **Improvement** — scenario / what-if / plan / verify. Speculative, days–weeks. Different cognitive shape; today's `ImprovementWindow` popout pattern stays.
- **Report** — frozen narrative auto-generated from canvas + investigations + improvements. Different cognitive shape (frozen, communication-focused).

**Top-level nav post-cutover:** `[ Hubs ]   [ Canvas ]   [ Investigation ]   [ Improvement ]   [ Report ]`. (`Hubs` is today's Overview/Dashboard renamed.)

**Wall is dual-home (Q4):** canonical destination in the Investigation tab AND a toggleable canvas overlay (same data, two views). Resolves the spec's "vs" framing as a false choice.

**Why this is the right cognitive cut:**

| Surface                                                  | Cognitive shape           | Time scale         | Live or frozen          |
| -------------------------------------------------------- | ------------------------- | ------------------ | ----------------------- |
| Canvas (process map / cadence / drill-down)              | scanning + bridge         | seconds–minutes    | live                    |
| Investigation (Wall, Evidence Map, Questions, SC hubs)   | diving, hypothesis-led    | 30 min – hours     | live                    |
| Improvement                                              | speculative, scenario     | days – weeks       | live (scenario-space)   |
| Report                                                   | communication, narrative  | minutes to read    | **frozen snapshot**     |
| Frame (map authoring) — same job as Analysis             | structural, model-bldg    | minutes onboarding | live → folds into Canvas |

Frame + Analysis are the same job (look at live map + current state). The other three each have a distinct shape and warrant their own destination.

**`JourneyPhase = 'frame' | 'scout' | 'investigate' | 'improve'`** stays in `packages/core/src/types` because Investigation continues to use phase-based CoScout tool gating internally. It just stops driving the top-level nav.

**Canvas content (replaces Frame + Analysis):**

- Spatial DAG with branch + join + two-level nesting + context propagation (§3.3 commitments 4–7).
- Step cards with mini-chart + Cpk-or-mean±σ + drift + investigation/improvement counts.
- Mode lenses (capability / yamazumi / defect / performance / process-flow) re-skin cards (§5.4); levels (System / Flow / Local) are orthogonal — canvas pan/zoom, not a picker (Q3).
- Overlay toggles: investigations / hypotheses / suspected causes / recent findings. With overlays off → clean live map. With overlays on → IS the Wall view.
- Click step → floating overlay drill-down with 5 response-path CTAs (Q1).

**Code consequences — actual delivery state post-PR8 + PR9 (2026-05-08):**

- DELETED via PR9 #142 (`fd2e9966`): `packages/ui/src/components/LayeredProcessView/` (5 files) + `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` (orphaned stub; canonical home stays at `Canvas/internal/ProcessMapBase`).
- PRESERVED with documented deviation: `apps/pwa/src/components/views/FrameView.tsx` + `apps/azure/src/components/editor/FrameView.tsx` are now ~170-line thin route shells mounting `<CanvasWorkspace/>` (PR8 sub-PR 8e wired `onOpenWall` through them). Per `feedback_check_shipped_patterns_first` the strangler-pattern facade is the right home for store-wiring + tier guards. Vision §6 "delete legacy canvas-rendering FrameView" commitment honored because canvas rendering moved to `<CanvasWorkspace/>` — the shells now hold a different responsibility.
- NOT in PR8/PR9 scope (still open): `FrameViewB0`, Frame + Analysis tab buttons in AppHeader (PWA + Azure). Original ADR-070 amendment listed them; verify state if revisiting.
- DELIVERED in PR8: top-level `Canvas` route + `<CanvasWorkspace/>` component; `<CanvasStepOverlay/>` for floating-overlay drill-down (8a); canvas overlay rail with 5 toggles including the Wall mirror (8e); manual canvas authoring + drag-hypothesis tool (8d); drift indicator + time-series mini-chart (8b).
- §5.4 levels-as-pan/zoom (8f) deferred to its own canvas viewport architecture spec + ADR-080 per PR8 master plan D2.

Strangler pattern complete: Canvas is the only canvas-shaped surface in the codebase. Full migration arc captured in ruflo `architecture/canvas-migration-pr8-pr9-shipped`.

**Decision pinned in:** `docs/decision-log.md` §1 Replayed Decisions, "2026-05-03 — Vision §8 open questions resolved + Q0 added." Vision spec §6 ("What's superseded") explicitly retires Frame + Analysis tabs. ADR-070 (FRAME workspace) amended 2026-05-03 with full supersession note.

**Walkthrough transcript:** `~/.claude/plans/lets-do-this-next-rustling-simon.md` — has the full alternatives-considered (canvas-replaces-all-5-tabs / canvas-inside-Frame-tab-only / phase-as-state-property) and the cognitive-shape rationale that picked the 5-tab-with-2-retired option.
