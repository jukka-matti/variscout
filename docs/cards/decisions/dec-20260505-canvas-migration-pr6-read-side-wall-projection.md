---
title: 'Canvas Migration PR6 read-side Wall projection'
purpose: decide
tier: card
status: active
date: 2026-05-05
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas Migration PR6 read-side Wall projection

PR6 implements the Spec 4 placeholder in [`docs/archive/specs/2026-05-04-canvas-migration-design.md`](archive/specs/2026-05-04-canvas-migration-design.md) as projection sync rather than Canvas-side hypothesis authoring. Canvas now has a session-scoped overlay registry for investigations, hypotheses, suspected causes, and findings, with all overlays defaulting off. Existing Wall entities (`Question`, `Finding`, `SuspectedCause`, and `CausalLink`) remain the source of truth; Canvas derives per-step activity badges, finding pins, suspected-cause markers, and draft hypothesis arrows from assignments, tributaries, question factors, finding filters, hub bindings, and causal-link endpoints. The step overlay lists related investigation items and sends focus requests to the app shell; PWA and Azure open Investigation and expand a linked question when available. PR6 intentionally adds no new persistence schema, loading semantics, Wall layout rewrite, Canvas-side creation/editing, or Analysis route cleanup. _Pinned 2026-05-05._
