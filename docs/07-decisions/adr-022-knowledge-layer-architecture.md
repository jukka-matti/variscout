---
title: 'ADR-022: Knowledge Layer Architecture'
---

# ADR-022: Knowledge Layer Architecture

**Status**: Superseded by [ADR-060](adr-060-coscout-intelligence-architecture.md)
**Date**: 2026-03-16
**Deciders**: Product team

> **Status: Superseded by [ADR-060](adr-060-coscout-intelligence-architecture.md)** (2026-04-02)
> The Azure AI Search findings indexer is replaced by Foundry IQ unified knowledge index that covers both investigation artifacts and external documents.

> [!IMPORTANT]
> **Amended by ADR-026 (2026-03-17)**: The dedicated findings index and indexed SharePoint approach
> described below has been replaced by a SharePoint-first strategy using Remote SharePoint knowledge
> sources and report publishing. See [ADR-026](adr-026-knowledge-base-sharepoint-first.md) for the
> current architecture.

---

## Context

Quality teams accumulate institutional knowledge through investigation findings — root causes identified, actions taken, outcomes measured. This knowledge currently lives within individual projects, invisible to other teams analyzing similar processes.

The Team plan (€199/month) needs a knowledge layer that:

1. Makes past findings searchable across projects and teams
2. Optionally indexes SharePoint documents (SOPs, procedures) for richer context
3. Integrates seamlessly with CoScout conversations
4. Maintains tenant isolation (no cross-tenant data leakage)

## Decision

Use **Azure AI Search with Foundry IQ agentic retrieval** as the knowledge layer. This is a managed service approach — no custom vector DB, no self-hosted RAG pipeline.

### Architecture

```
Save Project → indexFindingsToSearch() → Azure Function (index-findings)
                                              ↓
                                    Azure AI Search (findings index)
                                              ↓
CoScout question → useKnowledgeSearch → searchRelatedFindings() (semantic)
                                      → searchDocuments() (agentic retrieval)
                                              ↓
                                    formatKnowledgeContext() → CoScout prompt
```

### Key Design Decisions

1. **HTTP trigger indexer (not webhook)**: The `index-findings` Azure Function is called directly after saves. Simpler than event subscriptions — no Event Grid setup, no webhook registration. The function is debounced (5s) client-side.

2. **Batch-replace indexing (not incremental)**: Each save sends ALL findings for the project. The function deletes stale documents and re-indexes. This ensures consistent state and handles deletions without tombstone tracking.

3. **ExtractedData output mode (not AnswerSynthesis)**: The agentic retrieval API returns raw chunks rather than synthesized answers. This lets CoScout reason over the raw context with full investigation awareness, rather than getting a pre-formulated answer.

4. **2025-11-01-preview API**: Uses the latest agentic retrieval API with Foundry IQ Knowledge Bases. Provides MCP endpoint, reasoning effort control, and multi-source support (search index + SharePoint).

5. **Preview-gated (not deferred)**: Ships behind `isPreviewEnabled('knowledge-base')` toggle. Customers opt in via Admin > Knowledge Base. This allows real-world validation before GA.

6. **Dual-path search**: Findings use direct semantic search (fast, structured). Documents use agentic retrieval (slower, more flexible). Both run in parallel via `Promise.all` in the hook.

## Alternatives Considered

### Custom Vector DB (Pinecone, Weaviate)

- **Rejected**: Additional infrastructure to manage, separate billing, no SharePoint connector. Azure AI Search is already provisioned and Azure-native.

### Azure Cognitive Search without Foundry IQ

- **Rejected**: Would work for findings but lacks document understanding (chunking, agentic reasoning) for SharePoint. Foundry IQ adds significant value for document retrieval.

### Client-side search (Lunr, MiniSearch)

- **Rejected**: Can't search across projects/teams (data isolated in IndexedDB). No cross-tenant aggregation possible.

### Deferred to later phase

- **Rejected**: Preview gate achieves the same goal (controlled rollout) while shipping actual functionality. Deferred means no real-world feedback.

## Consequences

### Positive

- Quality teams can reference institutional knowledge during investigations
- CoScout responses become more grounded in organizational experience
- SharePoint SOPs are surfaced in context (not siloed)
- Graceful degradation — feature is additive, never blocks core analysis

### Negative

- Additional cost: ~€65-85/month for AI Search + AI Services (already included in Team pricing)
- Search quality depends on finding text quality (garbage in, garbage out)
- Preview API (2025-11-01-preview) may change before GA
- Agentic retrieval latency (~1-3s) adds to CoScout response time

### Risks

- Preview API breaking changes — mitigated by soft failure (returns empty array on error)
- Stale index — mitigated by batch-replace on every save
- Tenant isolation breach — mitigated by Azure AI Search per-tenant deployment (each customer has own search instance)

---

## See Also

- [AI Architecture](../05-technical/architecture/ai-architecture.md)
- [ADR-019: AI Integration](adr-019-ai-integration.md)
- [ADR-026: SharePoint-First Knowledge Base](adr-026-knowledge-base-sharepoint-first.md)
- [Knowledge Base Search Workflow](../03-features/workflows/knowledge-base-search.md)
- [ARM Template — AI Services](../08-products/azure/arm-template.md)
