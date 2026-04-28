---
title: 'ADR-068: CoScout Cognitive Redesign'
audience: [engineer]
category: architecture
status: stable
related: [coscout, ai-integration, prompt-caching, tiered-prompts]
---

# ADR-068: CoScout Cognitive Redesign

**Status:** Accepted  
**Date:** 2026-04-05  
**Supersedes:** Accumulated prompt additions from ADR-019, 029, 047, 049, 053, 054, 060, 064, 065, 067

## Context

CoScout's system prompt grew to 1,691 lines across 10 ADRs. Each added a feature layer without holistic redesign, creating:

- Contradictions (brainstorm coaching vs tool schema, dual suspected cause systems)
- Redundancies (phase instructions ×2, mode terminology ×3)
- Invisible capabilities (best model equation, drill scope, Evidence Map topology computed but never surfaced)
- Phase overload (1,691 lines sent regardless of analyst's current phase)

## Decision

Replace the monolithic `coScout.ts` with a modular `coScout/` directory. Key changes:

1. **Phase-adaptive prompts** assembled by `assembleCoScoutPrompt(phase, mode, surface, context)` returning typed `CoScoutPromptTiers` (tier1Static/tier2SemiStatic/tier3Dynamic)
2. **Typed tool registry** — all tools defined once with compile-time handler completeness
3. **Prompt tier enforcement** — tier1 is session-invariant (cached), tier2 changes on investigation state, tier3 changes per turn
4. **Sub-phase reasoning effort** — converging=high, validating=medium, verification=high
5. **Contradiction resolutions** — suspected causes: hubs only; brainstorm: optional cost/risk; confidence: respects staged sample size

## Consequences

- Phase × mode coaching is one coherent block per file, not accumulated layers
- Every coaching instruction grounded in visible data context
- ~430-530 lines per request instead of 1,691
- Prompt caching (10x token savings) protected by type system
- Legacy functions preserved for backward compatibility during migration

## Implementation

- Phase 1 (Foundation): Modular prompts, tool registry, tier types, reasoning config
- Phase 2 (Intelligence): Context enrichment, question pipeline, proactive coaching, KB wiring
- Design spec: `docs/archive/specs/2026-04-05-coscout-cognitive-redesign-design.md`
- Regression tests: `packages/core/src/ai/__tests__/promptTierSafety.test.ts`

## Amendment — 2026-04-28: Level-aware coaching alongside mode-aware coaching

The 2026-04-27 operating-model spec
(`docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`)
introduces a three-level methodology (outcome / flow / local-mechanism)
layered onto the existing mode-aware coaching. Modes stay modes (in code
and copy — see W4 terminology resolution); the addition is a level-aware
coaching surface that asks "what process-understanding level are we at?"
before "which mode?".

Migration shape: the per-mode prompt modules in
`packages/core/src/ai/prompts/coScout/` add level-aware overlays as the
spec's Process Hub canonical map matures. Mode inference
(`resolveMode()` and `getStrategy()` in `packages/core/src/strategy/`)
remains the dispatch point. The level overlay is grounding context, not
a replacement for the mode strategy.

Implementation lands incrementally as Plans B/C/D for the production-line-
glance dashboard ship the canonical-map and per-step capability primitives.
See `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`.
