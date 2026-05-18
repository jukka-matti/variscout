---
title: 'Framing-layer spec §10 amendment: per-investigation filter persistence → per-session for V1'
purpose: decide
tier: card
status: active
date: 2026-05-04
topic: ['decisions', 'archived', 'canvas', 'capability']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Framing-layer spec §10 amendment: per-investigation filter persistence → per-session for V1

Spec §10 (now archived at `docs/archive/specs/2026-05-03-framing-layer-design.md`) prescribed that the three composable canvas filter states (Time window / Scope filter / Pareto group-by) persist per-investigation via `ProcessHubInvestigation.metadata`. Slice 4 P3.6 retro + canvas-architecture brainstorm (2026-05-04) revealed: (a) investigations don't yet exist as loaded entities anywhere in production (PWA has no investigation concept; Azure stores them historically without an "open / switch active investigation" affordance); (b) slice 4's `useCanvasFilters` hook + metadata fields were future-proofing for a layer that wasn't built; (c) `ProcessHubCapabilityTab` already uses raw `useState<TimelineWindow>` at hub level with an explicit comment about the architectural mismatch; (d) industry best practice (Figma/Miro/canvas tools) treats filter / lens / selection as **view state — session-scoped, not document-state**. **Decision: amend spec §10 — canvas filters live in the View layer (session-scoped, transient, reset on reload) per `docs/archive/specs/2026-05-04-canvas-migration-design.md` Decision 2 (three-layer state separation: Document / Annotation / View). Slice 4's `ProcessHubInvestigationMetadata.scopeFilter` and `paretoGroupBy` fields stay in the type system as the future "save this view" persistence target — but V1 doesn't write to them. Investigation overlay (the explicit "promote view → annotation" affordance) lands in a future spec when investigations become first-class loaded entities (separate brainstorm).** _Pinned 2026-05-04._
