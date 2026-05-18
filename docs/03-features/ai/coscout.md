---
title: 'CoScout AI Orchestration'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: workflow
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# CoScout AI Orchestration

## Problem

An LLM assistant in an EDA tool must not recompute statistics, must respect customer-data boundaries, and must adapt its prompt scope to whichever investigation phase the analyst is in — otherwise it leaks context across phases, hallucinates numeric claims, or undermines the stats engine's authority.

## Capability claim

CoScout assembly is centralized in `assembleCoScoutPrompt()` (replacing the deprecated `buildCoScoutSystemPrompt()`), with tiered prompts under `packages/core/src/ai/prompts/coScout/` (Tier 1 session-invariant for prompt-cache, Tier 3 per-session); the Azure app orchestrates calls via `useAIOrchestration` + `aiStore` in `apps/azure/src/features/ai/`, and the V1 Response Path System (shipped 2026-05-13) routes 5 canvas response paths through this prompt surface with Sustainment auto-fire per ADR-080.

## Intent diagram

TBD — Mermaid sequence to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/core/src/ai/__tests__/` and `apps/azure/src/features/ai/__tests__/` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/core/src/ai/`, `packages/core/src/ai/prompts/coScout/`, `apps/azure/src/features/ai/aiStore.ts`, `apps/azure/src/features/ai/useAIOrchestration.ts`
- **Tests**: `packages/core/src/ai/__tests__/`, `apps/azure/src/features/ai/__tests__/`
- **Related**: `docs/03-features/ai/visual-grounding.md`, `docs/07-decisions/adr-068-coscout-cognitive-redesign.md`, `docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md`
