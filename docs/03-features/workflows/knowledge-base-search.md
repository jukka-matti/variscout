---
tier: living
purpose: design
title: 'Knowledge Base Search'
journey-phase: [scout, investigate, improve]
audience: human
category: workflow
status: active
---

# Knowledge Base Search

Search your team's documents and investigation artifacts from CoScout to accelerate investigations with institutional knowledge — SOPs, fault trees, past findings, and more.

---

## Overview

The Knowledge Base feature allows CoScout to search a unified knowledge index for relevant documents and investigation artifacts when answering questions. This brings both institutional documents and the team's accumulated investigation knowledge into every conversation.

**Plan requirement**: Azure App (€120/month, Phase 2+)
**Status**: Beta (opt-in via Admin > Knowledge Base)
**Architecture**: [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md)

---

## How It Works

1. **Automatic indexing** — findings, questions, and improvement ideas are automatically indexed as investigation artifacts as your investigation progresses
2. **Document upload** — admins can upload SOPs, procedures, and reference documents via the Knowledge Base admin UI
3. **On-demand search** — when you ask CoScout a question, a "Search Knowledge Base?" button appears after the response. Click it to search your team's knowledge index
4. **Source-attributed results** — results appear as cards with title, snippet preview, source type (document / investigation artifact / answer), and a direct link
5. **Enriched responses** — CoScout cites sources naturally with `[Source: name]` badges, combining your analysis data with institutional knowledge

---

## Search Scope

CoScout searches the Azure AI Search unified knowledge index (Knowledge Catalyst), scoped to the active project via a `projectId` filter computed server-side (`server.js → /api/knowledge-search`). This ensures results are relevant to the current investigation context.

> Results include both project-specific investigation artifacts and shared organizational documents (SOPs, procedures) uploaded by admins.

---

## Data Sources

### Knowledge Catalyst Unified Knowledge Index (ADR-060)

The knowledge index is backed by Blob Storage and organized into three source types:

| Source Type                 | Content                                                                    | How It Gets There                        |
| --------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| **Documents**               | SOPs, work instructions, procedures, fault trees, 8D reports               | Admin uploads via Knowledge Base UI      |
| **Investigation artifacts** | Findings, questions, improvement ideas from active and past investigations | Auto-indexed as investigation progresses |
| **Answers**                 | Team member contributions and recorded answers                             | Contributed via CoScout conversation     |

**Search flow**: CoScout calls `search_knowledge_base` tool → `server.js` computes `projectId` filter → queries Azure AI Search → returns top-5 results with source type attribution → formatted via `formatKnowledgeContext()` into CoScout prompt.

**No M365 Copilot license required**: Azure AI Search connects to Blob Storage directly — no Remote SharePoint knowledge source needed.

---

## Offline Behavior

The Knowledge Base search degrades gracefully:

- **No network**: Search button is hidden, CoScout responds with local context only
- **No search endpoint**: Feature is disabled (`isKnowledgeBaseAvailable` returns false)
- **Search errors**: Logged as warnings, empty results returned — never blocks the conversation
- **No Knowledge Base (404)**: Silently returns empty results

---

## Admin Setup

1. Navigate to **Admin > Knowledge Base** (BookOpen icon in header)
2. Verify all status checks are green:
   - Azure App active (Phase 2+ feature)
   - Search endpoint configured (via ARM template — Azure AI Search service)
   - Beta feature enabled
3. Upload organizational documents (SOPs, procedures, reference docs) via the document upload UI — Azure AI Search indexes from Blob Storage automatically; no Remote SharePoint knowledge source needed
4. Click **Test Search Connectivity** to verify the Azure AI Search index
5. Toggle the beta feature on/off as needed

---

## See Also

- [AI Architecture](../../05-technical/architecture/ai-architecture.md)
- [ADR-060: CoScout Intelligence Architecture](../../07-decisions/adr-060-coscout-intelligence-architecture.md) (current knowledge architecture)
- [ADR-022: Knowledge Layer Architecture](../../archive/adrs/adr-022-knowledge-layer-architecture.md) (original)
- [ADR-026: SharePoint-First Knowledge Base](../../archive/adrs/adr-026-knowledge-base-sharepoint-first.md) (superseded by ADR-060)
- [ARM Template — AI Services](../../08-products/azure/arm-template.md#4-ai-services-all-plans)
