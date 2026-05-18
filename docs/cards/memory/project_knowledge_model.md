---
title: 'Knowledge Model + CoScout Context Architecture'
description: 'Unified knowledge model (terms + concepts) feeding all consumers; CoScout grounded in VariScout methodology'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 9dfb1128156ded26
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_knowledge_model.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Knowledge model implemented (Mar 2026): unified registry of ~41 vocabulary terms + ~15 methodology concepts in @variscout/core/glossary/.

**Why:** CoScout was grounded in "SPC terminology" instead of VariScout's own framework (Four Lenses, Two Voices, progressive stratification). IDEOI implementation revealed CoScout was blind to improvement ideas.

**How to apply:**
- New types: Concept, KnowledgeEntry, KnowledgeRelation, ConceptCategory in glossary/types.ts
- concepts.ts: ~15 concepts (framework: Four Lenses + individual lenses + Two Voices; principle: Stability Before Capability, Progressive Stratification, Contribution Not Causation; phase: Initial → Diverging → Validating → Converging → Acting)
- knowledge.ts: unified lookup (getEntry, getRelated, getReferencedBy) across terms + concepts
- buildGlossaryPrompt: `{ includeConcepts?: boolean }` option — always enabled in buildAIContext
- CoScout system prompt rewritten: VariScout methodology grounding (not SPC), phase-specific instructions use Lens language
- AIContext.allHypotheses now includes `ideas?` array; converging prompts show existing improvement ideas
- Suggested questions updated: methodology language ("Which lens..."), idea-aware converging questions
- ~18 methodology terms reframed from SPC-identity to VariScout method language
- Docs: methodology.md, knowledge-model.md, ai-context-engineering.md created; glossary.md, ai-architecture.md, ADR-019 updated
- 3 new test files: concepts.test.ts, knowledge.test.ts, buildGlossaryPrompt.test.ts
- All 1077 core tests pass, Azure app builds
