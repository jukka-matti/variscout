---
title: 'ADR-060: CoScout Intelligence Architecture'
audience: [developer, architect]
category: architecture
status: stable
---

# ADR-060: CoScout Intelligence Architecture

**Status:** Accepted
**Date:** 2026-04-02
**Supersedes:** ADR-022 (Knowledge Layer Architecture), ADR-026 (Knowledge Base — SharePoint-First)
**Extends:** ADR-049 (CoScout Knowledge Catalyst)
**Completes:** ADR-054 (Mode-Aware Questions)

---

## Context

CoScout operates on approximately 15–25% of investigation knowledge due to gaps in the AI context pipeline. Key issues:

- Problem statement (Watson's 3 questions) declared but never serialized to AI context
- Finding comments, outcomes, and action details completely absent from CoScout context
- External documents (SOPs, FMEAs, specs) inaccessible to CoScout
- ADR-026 (SharePoint-first KB) deferred after ADR-059 removed Graph API permissions
- Mode-aware question generation (ADR-054) ~70% complete: yamazumi generator orphaned, performance ranking unimplemented
- CoScout cannot directly answer investigation questions

Industry research confirms "more context ≠ better" (context poisoning degrades all frontier models). A tiered hot/warm/cold architecture is the established pattern for knowledge-intensive AI assistants.

---

## Decision

Implement a five-pillar CoScout Intelligence Architecture:

### Pillar 1: Hot Context Quality

Fix `buildAIContext()` to include problem statement, enriched finding summaries (top-5 with outcomes), overdue actions, focused question context, and question answer visibility (`manualNote`, `linkedFindingIds`). Position-aware ordering places critical information at context start/end.

### Pillar 2: Investigation Retrieval

Serialize investigation artifacts (findings, answered questions, improvement ideas, conclusions) to Blob Storage as JSONL. Foundry IQ auto-indexes them for on-demand retrieval via `search_knowledge_base` tool.

### Pillar 3: External Document Knowledge Base

Upload SOPs, specs, and FMEAs to Blob Storage via three paths: Knowledge tab in PI panel, CoScout panel drag/drop, and finding comment attachments. Foundry IQ auto-cracks, chunks, embeds, and indexes all file types. Hybrid BM25 + vector + RRF search with semantic reranking. Project-level security filtering via server-computed `projectId` filter. Beta positioning using existing preview gate infrastructure.

### Pillar 4: Question ↔ CoScout Interaction

Add `focusedQuestionId` and `focusedQuestionText` to AI context. Add `answer_question` action tool (INVESTIGATE+ phase-gated, proposal pattern). Wire question answer documents into knowledge index. The `answer_question` tool is hub-aware: when the focused question belongs to a SuspectedCause hub, the proposal card shows the hub context so the analyst can see how the answer affects the hub's aggregate evidence. During the Converging phase, CoScout can also propose hub connections and synthesis refinements (hub creation requires analyst confirmation via `ActionProposalCard`).

### Pillar 5: Mode-Aware Question Completion

Wire yamazumi question generator into pipeline. Implement performance channel ranking questions. Mode-aware evidence sorting via strategy pattern. CoScout validation method awareness (`evidenceLabel`, `validationMethod`, `questionFocus` per mode).

### Search Architecture: Foundry IQ (Beta)

Azure AI Search + Foundry IQ agentic retrieval as primary search backend. `KnowledgeAdapter` interface abstracts the backend with fallback chain: `FoundryIQKnowledgeAdapter` → `AISearchKnowledgeAdapter` → `BlobKnowledgeAdapter`.

---

## Consequences

### Positive

- CoScout operates on full investigation knowledge depth
- External documents searchable alongside investigation artifacts
- Hybrid BM25 + vector search catches exact terms (part numbers, SOP codes) — critical for manufacturing
- Project-level security filtering ensures data isolation
- Knowledge Catalyst (ADR-049) automatically builds KB through normal investigation workflow
- Mode-aware question generation completes the ADR-054 vision

### Negative

- Azure AI Search Basic adds ~€65/month to Team tier infrastructure
- Foundry IQ is in public preview (mitigated by `KnowledgeAdapter` fallback chain)
- Five pillars is a large scope requiring phased implementation

---

## Implementation

Pillars 1, 4, and 5 delivered in Phases 1-2 (code changes only, no infrastructure):

- `buildAIContext()` enriched with all new fields
- Position-aware CoScout prompt rendering
- `answer_question` action tool and handler
- Yamazumi and performance question generators wired
- Mode-aware evidence sorting and validation method awareness

Pillars 2 and 3 require Azure infrastructure deployment (Phases 3-5, pending).
Phase 6 covers documentation updates.

Design spec: `docs/superpowers/specs/2026-04-02-coscout-intelligence-architecture-design.md`

---

## See Also

- [ADR-022: Knowledge Layer Architecture](../archive/adrs/adr-022-knowledge-layer-architecture.md) (superseded)
- [ADR-026: Knowledge Base — SharePoint-First](../archive/adrs/adr-026-knowledge-base-sharepoint-first.md) (superseded)
- [ADR-049: CoScout Knowledge Catalyst](adr-049-coscout-context-and-memory.md) (extended)
- [ADR-054: Mode-Aware Question Strategy](adr-054-mode-aware-question-strategy.md) (completed)
- [ADR-059: Web-First Deployment Architecture](adr-059-web-first-deployment-architecture.md)

## Amendment — 2026-04-28: Process Learning System operating model

The 2026-04-27 operating-model spec
(`docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`)
extends CoScout's grounding from finding/question/process-context to also
include:

- **Process Hub canonical map** (when present) — three-level outcome / flow /
  local-mechanism methodology
- **Evidence Sources, Data Profiles, Snapshots** as recurring evidence (the
  Agent Review Log profile is the first concrete example; CSV/Excel via
  GENERIC_TABULAR_PROFILE shipped in Phase 3 / PR #102)
- **Current Process State** (`packages/core/src/processState.ts`) as a
  parallel central object alongside SuspectedCause hubs, with response-path
  routing (quick action / focused investigation / chartered project /
  sustainment review / control handoff)

CoScout's authority boundary is unchanged: the deterministic stats engine
remains the source of truth for numbers; CoScout grounds context, asks
targeted questions, and proposes actions. The grounding surface has grown;
the principle has not.
