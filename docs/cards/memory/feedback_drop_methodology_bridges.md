---
title: 'Drop methodology bridges when product has opinionated native journey'
description: 'External methodology bridges (DMAIC, QC Story, Toyota TBP, A3) are noise when the product has its own committed methodology + primitives + vocabulary'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_drop_methodology_bridges.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When the product has its own committed methodology (a journey + primitives + opinionated vocabulary), **external methodology bridges are noise, not stakeholder accommodation**. Drop them; use product-native vocabulary.

**Why:** Per RPS V1 brainstorm 2026-05-09 — initial Improvement Project V1 design used QC Story / Toyota TBP as a "methodology bridge for stakeholder familiarity." User pushback ("we don't need to commit to DMAIC for GBs! we can redefine how to do process improvement projects") revealed: VariScout already has FRAME→SCOUT→INVESTIGATE→IMPROVE (Constitution P1) + Watson 2019 / Turtiainen question-driven EDA (ADR-053) + own primitives (Hub, OutcomeSpec, Hypothesis, Finding, ImprovementIdea, SustainmentRecord, ControlHandoff) + Survey cross-phase layer.

Layering DMAIC / QC Story on top of this didn't aid stakeholder familiarity — it forked the vocabulary. Users (LSSGB students, trainers, consultants, mature-Hub analysts) don't need a translation layer; they need to learn one consistent product methodology that captures the same essential ideas in a coherent way.

**Bridge methodologies are appropriate when:**
- Product is brand new + has no own methodology yet → bridge methodology IS the methodology
- Product positions itself as a UI for an existing methodology (e.g., "Trello for Scrum") → bridge IS the value prop
- Product targets a regulatory market that requires a specific methodology vocabulary (e.g., FDA-regulated GxP wants DMAIC explicitly)

**Bridge methodologies are noise when:**
- Product has shipped its own methodology and is establishing it as the brand's voice
- Product's own primitives already capture the same concepts with cleaner names
- Two parallel vocabularies (own + bridged) would dilute both
- Cited per `feedback_honor_vision_commitments`: hedging multiplies mental models

**How to apply:**
- When designing a new artifact / surface / feature, ask: does the product already have its own opinionated methodology that this feature fits into?
- If yes: use product-native vocabulary at every UI surface. Document methodology lineage (where ideas came from) in design specs for engineers, but DO NOT surface it in UI copy.
- If no: a bridge methodology may be appropriate; commit fully (don't half-bridge).

Per RPS V1 D2: dropped DMAIC + QC Story + Toyota TBP + A3 from UI copy. Hypothesis lineage acknowledged in spec (scientific method downstream role) but UI surface uses VariScout-native names.

Related:
- `feedback_honor_vision_commitments` — when in doubt, honor verbatim
- `feedback_terminology_consistency` — ADR-defined terms must be used everywhere
