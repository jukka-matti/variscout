---
title: 'Canvas hypothesis-arrow drawing (PR8 sub-PR 8d) brainstorm locked, with master-plan deviation on tool placement'
purpose: decide
tier: card
status: active
date: 2026-05-07
topic: ['decisions', 'supersession', 'canvas', 'investigation']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---

> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas hypothesis-arrow drawing (PR8 sub-PR 8d) brainstorm locked, with master-plan deviation on tool placement

Six decisions + F4 layer assignment locked at [`docs/archive/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md`](archive/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md): pointer-event state machine + SVG rubber-band (Q1, web-grounded vs `@dnd-kit/core` and HTML5 DnD per tldraw / Excalidraw / Figma convention); single union gesture rendered step-to-step (Q2, granularity falls out of grabbed handle; data model already column-keyed); node-marker pip on card chrome replaces Codex's inline count badge for promoted hypotheses (Q3, web-grounded vs Figma comment-pin pattern; honors `feedback_fix_absorbed_violations_at_seam`); floating popover at gesture release point (Q4, continuity with §5.3 drilldown + Spec 2 auto-step-create tooltip; no right-rail collision per C3 supersession); two-step commit + no Cmd+Z + explicit delete via arrow detail (Q5, F4 layer separation forbids cross-store undo without dedicated investigationStore undo stack); top-level mode-agnostic persistent tool that auto-enables Hypotheses overlay (Q6, **deviates from master plan §4 8d note** that placed it in mode-2 / StructuralToolbar — reframed because mode-2 is canonical-map authoring while hypothesis arrows are investigation-graph authoring; matches Figma UI3 / tldraw / Excalidraw convention; user-confirmed deviation); active-tool state in View layer (Q7, resets to `'select'` on reload — no major canvas tool persists tool selection across sessions; rejects original brief's `usePreferencesStore` claim). Plan-time deferrals: step-grabbed-source column resolution (3-way risk #1), chained-add UX, marker icon shape, `floating-ui` vs `@radix-ui/react-popover`. **Out of scope for 8d:** 8e Wall mirror, 8f viewport architecture, retroactive Spec 4 doc covering PR6 read-side projections, `useSessionCanvasFilters` migration to `useViewStore`, marker clustering (coupled to 8f). Implementation plan to be written in a fresh session per `superpowers:writing-plans`; ~8 tasks per master plan §4 8d; subagent-driven execution per `feedback_subagent_driven_default`. Closes investigations.md "Canvas hypothesis-arrow drawing affordance absent (vision §3.4)". _Pinned 2026-05-07._
