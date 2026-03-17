---
title: 'Knowledge Base Search'
---

# Knowledge Base Search

Search past findings and SharePoint documents across your organization to accelerate investigations with institutional knowledge.

---

## Overview

The Knowledge Base feature allows CoScout to search across all indexed findings and connected document libraries (SOPs, procedures) when answering questions. This brings institutional knowledge into every investigation.

**Plan requirement**: Team AI (€279/month)
**Status**: Preview (opt-in via Admin > Knowledge Base)

---

## How It Works

1. **Automatic search**: When you ask CoScout a question, it automatically searches the Knowledge Base before generating a response
2. **Dual-path retrieval**: Searches both indexed findings (semantic search) and connected documents (agentic retrieval via Foundry IQ)
3. **Source attribution**: Results are labeled with their source — `[From: findings]` for past project findings, `[From: SOPs]` for SharePoint documents
4. **Context injection**: Relevant results are injected into CoScout's context, allowing it to reference similar past situations and institutional procedures

---

## Data Sources

### Findings (Automatic)

All findings are automatically indexed to Azure AI Search when projects are saved. The index includes:

- Finding text and suspected cause
- Factor and status
- Statistical context (η², Cpk before/after)
- Actions taken and outcomes

### SharePoint Documents (Optional)

Connect SharePoint document libraries to make SOPs, work instructions, and procedures searchable:

- Uses Azure AI Search's Foundry IQ agentic retrieval
- Requires one-time setup via `infra/scripts/setup-knowledge-base.sh`
- Supports `indexedSharePoint` knowledge source kind

---

## Offline Behavior

The Knowledge Base search degrades gracefully:

- **No network**: Search is silently skipped, CoScout responds with local context only
- **No search endpoint**: Feature is disabled (isKnowledgeBaseAvailable returns false)
- **Search errors**: Logged as warnings, empty results returned — never blocks the conversation
- **No Knowledge Base (404)**: Silently returns empty results

---

## Admin Setup

1. Navigate to **Admin > Knowledge Base** (BookOpen icon in header)
2. Verify all status checks are green:
   - Team AI plan active
   - Search endpoint configured (via ARM template)
   - Preview feature enabled
3. Toggle the preview on/off as needed

For SharePoint document indexing, run the setup script or follow Microsoft's documentation for creating an `indexedSharePoint` knowledge source.

---

## See Also

- [AI Architecture](../../05-technical/architecture/ai-architecture.md)
- [ADR-022: Knowledge Layer Architecture](../../07-decisions/adr-022-knowledge-layer-architecture.md)
- [ARM Template — AI Services](../../08-products/azure/arm-template.md#4-ai-services-team-ai-only)
