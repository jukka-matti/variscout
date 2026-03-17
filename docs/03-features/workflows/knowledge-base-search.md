---
title: 'Knowledge Base Search'
---

# Knowledge Base Search

Search your team's SharePoint documents from CoScout to accelerate investigations with institutional knowledge — SOPs, fault trees, past reports, and more.

---

## Overview

The Knowledge Base feature allows CoScout to search your team's SharePoint folder for relevant documents when answering questions. This brings institutional knowledge into every investigation.

**Plan requirement**: Team AI (€279/month)
**Status**: Preview (opt-in via Admin > Knowledge Base)
**Architecture**: [ADR-026](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md)

---

## How It Works

1. **Publish reports** — when you publish a scouting report from the Report view, it's saved as a Markdown file in the team's SharePoint folder alongside `.vrs` files
2. **On-demand search** — when you ask CoScout a question, a "💡 Search Knowledge Base?" button appears after the response. Click it to search your team's SharePoint documents
3. **Document results** — results appear as cards with document title, snippet preview, source path, and direct link to the original document
4. **Enriched responses** — CoScout cites sources naturally with `[Source: name]` badges, combining your analysis data with institutional knowledge

---

## Data Sources

### SharePoint Documents (Remote SharePoint)

Documents in the team's SharePoint folder are searchable via Azure AI Search's **Remote SharePoint** knowledge sources:

- Published scouting reports (Markdown)
- SOPs, work instructions, procedures
- Past 8D reports, fault tree documents
- Any document the user has access to in SharePoint

**Access control**: Uses per-user SharePoint permissions via user token passthrough — users can only find documents they have access to.

**No indexer required**: Remote SharePoint accesses documents on demand with user credentials, so there are no indexer costs or crawl delays.

### Findings (Deprecated)

> [!NOTE]
> The dedicated findings index from ADR-022 has been replaced by published reports in SharePoint (ADR-026). The `searchRelatedFindings()` function returns an empty array.

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
   - Team AI plan active
   - Search endpoint configured (via ARM template)
   - Preview feature enabled
3. Click **Test Search Connectivity** to verify the Remote SharePoint knowledge source
4. Toggle the preview on/off as needed

For setting up the Remote SharePoint knowledge source, follow Microsoft's documentation:
[Remote SharePoint Knowledge Source Setup](https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote)

---

## See Also

- [AI Architecture](../../05-technical/architecture/ai-architecture.md)
- [ADR-022: Knowledge Layer Architecture](../../07-decisions/adr-022-knowledge-layer-architecture.md) (original, amended by ADR-026)
- [ADR-026: SharePoint-First Knowledge Base](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md)
- [ARM Template — AI Services](../../08-products/azure/arm-template.md#4-ai-services-team-ai-only)
