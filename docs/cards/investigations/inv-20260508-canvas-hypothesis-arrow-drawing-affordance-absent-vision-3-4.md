---
title: 'Canvas hypothesis-arrow drawing affordance absent (vision §3.4)'
purpose: remember
tier: card
status: archived
date: 2026-05-08
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-06
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-08 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Canvas hypothesis-arrow drawing affordance absent (vision §3.4)

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §3.4 commits to user-authored hypothesis arrows: _"users may **optionally draw a hypothesis arrow** from one column (or one step) to another."_ Hypothesis arrows are first-class authoring; promoted (evidence-crossed-threshold) → node markers; draft → faint arrows. `useCanvasInvestigationOverlays` projects pre-existing `CausalLink` entities as faint dashed SVG arrows (read-side only). The user-facing **drawing gesture** does not exist anywhere on the canvas.

**Possible directions:**

- Drawing gesture: Mode 2 (structural authoring) toolbar gains a "Draw hypothesis" tool. Click source step/column → drag → release on target → opens a tiny inline form ("I suspect [X] affects [Y]" + free-text `because...`).
- Promoted vs draft visual distinction: drafts = faint dashed arrows (current); promoted = node markers ON the affected step (separate visual primitive — needs design).
- Suspected causes as node markers: Codex renders as inline badges inside step cards; spec calls for node markers. Either accept the badge pattern (document deviation) or rework.
- Storage: new draft hypotheses → `CausalLink` entities in `useInvestigationStore` (existing graph).

**Promotion path:** PR8d of the canvas migration sequence. Requires Spec 4 brainstorm extension covering the drawing-mode gesture (overlap with structural-arrow drawing — same primitive, different semantic), promoted-vs-draft visual, and column-vs-step source/target. ~8 tasks.

**Resolution:** PR8-8d ([PR #140](https://github.com/jukka-matti/variscout/pull/140)) — Canvas gains a dedicated draw-hypothesis tool, step/column endpoints, drag and keyboard authoring flows, a focused draft popover with optional question linking, causal-link store wiring in PWA/Azure shells, remove affordances on hypothesis links, and promoted suspected-cause node markers.
