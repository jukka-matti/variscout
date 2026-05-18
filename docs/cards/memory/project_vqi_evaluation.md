---
title: 'VQI Holistic Evaluation'
description: 'VariScout Quality Index 16-dimension evaluation. Scored 4.17/5.0 (83.3%) post-ADR-053 re-evaluation (Mar 31). Key gaps: C3 collaborative memory (2.8), anti-pattern detection. prefers-reduced-motion already existed.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_vqi_evaluation.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# VQI Evaluation (updated 2026-03-31)

Original evaluation (Mar 30): 3.88/5.0 (77.6%). Re-scored (Mar 31): **4.17/5.0 (83.3%)** after accounting for ADR-053 question-driven EDA and discovering existing accessibility features.

## Key Score Changes (re-evaluation)

- **C2 Anticipatory Intelligence: 3.0 → 4.0 (+1.0)** — Factor Intelligence generates proactive questions, auto-rules-out, uncovered category detection, phase-adaptive coaching. VQI originally said "AI is reactive only" — incorrect.
- **A3 Accessibility: 3.5 → 4.0 (+0.5)** — ARIA helpers in `accessibility.ts`, `aria-live="polite"` on CoScout, `prefers-reduced-motion` global override already existed in `components.css:411-420`.
- **B4 Methodology Embodiment: 4.0 → 4.3** — Question-driven EDA IS methodology embodiment (Turtiainen's mental model).
- **C5 Cognitive Load: 3.5 → 3.8** — Suggested questions ARE phase-adaptive (5 phases + hypothesis-aware + uncovered categories).

## Remaining Gaps

- **C3 Collaborative Memory (2.8)** — biggest gap. Cross-project search deferred (architectural complexity). No proactive historical surfacing.
- **Anti-pattern detection** — no SCOUT-skipping or premature-conclusion warnings.
- **Skip links** — only remaining A3 gap.
- **LSL > USL validation** — now implemented (Mar 31).

## Improvements Implemented (Mar 31)

1. ADR-054 mode-aware questions (questionStrategy in strategy registry, yamazumi generator, capability/performance rewording)
2. Aggregate coverage metric on QuestionChecklist (progress bar + % explored)
3. LSL ≥ USL validation in SpecsSection
4. CoScout prompt nudge for ruled-out question references
5. Docs updated (ADR-047, accessibility.md, validation.md)

## CoScout Prompt Audit

System prompt is ~1,500-2,500 tokens (dynamic). Found ~360 tokens redundancy: phase guidance written twice, PDCA coaching triple-written, improvement ideas duplicated. Consolidation recommended but not yet done.

**Why:** VQI is the holistic quality framework for evaluating VariScout's competitive position. The investigation model (findings as memory) is the strategic moat, not AI features.

**How to apply:** Reference when planning AI features or competitive positioning. C3 cross-project memory is the highest-impact remaining gap but needs architectural design.
