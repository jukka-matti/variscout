---
title: 'AI Integration Strategy'
description: 'AI integration specs decomposed into project docs (ADR-019, workflow, architecture, design system). Brainstorming artifacts remain in docs/superpowers/specs/.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_ai_strategy.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

AI integration brainstorming completed 2026-03-14. Two design specs decomposed and integrated into project docs:

1. **AI Integration Strategy** → distributed to:
   - `docs/07-decisions/adr-019-ai-integration.md` — architectural decision
   - `docs/03-features/workflows/ai-assisted-analysis.md` — user-facing workflow
   - `docs/05-technical/architecture/ai-architecture.md` — technical architecture
   - `docs/06-design-system/components/ai-components.md` — component UX specs

2. **Investigation Workflow Enhancement** → distributed to:
   - `docs/07-decisions/adr-015-investigation-board.md` — "Revision: Closed-Loop Investigations" section added
   - `docs/03-features/workflows/investigation-to-action.md` — extended with suspected cause, actions, outcome, 5-column board, Teams auto-posting
   - `docs/06-design-system/components/findings.md` — new component spec

3. **AI Architecture Readiness Review** (2026-03-14):
   - `docs/05-technical/architecture/ai-readiness-review.md` — new strategic review doc
   - Updates to ai-architecture.md: ProcessContext type, factor role inference, Foundry IQ, buildAIContext(), glossary grounding
   - Updates to adr-019-ai-integration.md: context enrichment, Foundry IQ, competitive positioning
   - Updates to ai-assisted-analysis.md: process context, knowledge accumulation, 8-step investigation workflow
   - Updates to specifications.md: removed blanket "No AI" claim, added Azure AI features section
   - Updates to philosophy.md: two-product AI philosophy (PWA=no AI, Azure=optional AI augments)
   - Updates to storage.md: ProcessContext type in AnalysisState contract
   - Updates to authentication.md: Cognitive Services scope for AI
   - Updates to data-flow.md: AI context layer diagram
   - Updates to data-input.md: factor role inference in auto-mapping
   - Updates to market-analysis.md: Minitab AI competitive positioning, ISO 9001:2026 + EU AI Act
   - Updates to technical index.md + CLAUDE.md: ai-readiness-review added

Original brainstorming specs remain in `docs/superpowers/specs/` as artifacts.

Cross-references updated: feature-parity.md, CLAUDE.md, all 4 index files (decisions, features, design system, technical).

**Why:** Architecture-readiness + strategic direction. Not immediate implementation.

**How to apply:** When working on findings, AI features, or Teams integration, reference the distributed docs (not the superpowers specs). ADR-019 status is "Proposed" — implementation requires separate planning. The ai-readiness-review.md is the comprehensive strategic assessment to read first.
