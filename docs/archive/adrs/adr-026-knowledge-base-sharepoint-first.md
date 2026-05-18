---
tier: stable
purpose: remember
title: 'ADR-026: Knowledge Base Strategy — SharePoint-First with Remote Retrieval'
layer: L5
---

# ADR-026: Knowledge Base Strategy — SharePoint-First with Remote Retrieval

**Status**: Superseded by [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md)
**Date**: 2026-03-17

> **Status: Superseded by [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md)** (2026-04-02)
> The SharePoint-first approach is replaced by Foundry IQ with Blob Storage knowledge source. Documents are uploaded directly to Blob Storage and auto-indexed by Foundry IQ. The Knowledge Catalyst (ADR-049) continues to capture investigation insights into findings.
> **Deciders**: Product team
> **Amends**: [ADR-022: Knowledge Layer Architecture](adr-022-knowledge-layer-architecture.md)

---

## Context

ADR-022 established a dual-path Knowledge Base architecture:

1. **Path 1**: Dedicated Azure AI Search `findings` index with semantic ranking
2. **Path 2**: Foundry IQ agentic retrieval for SharePoint documents

After analyzing cost, security, user value, and the latest Foundry IQ capabilities (including **Remote SharePoint knowledge sources**), we identified a simpler, cheaper, and more secure architecture.

### Resolved Design Questions

| #   | Question            | Decision                                                       | Rationale                                                                                                         |
| --- | ------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Document format     | Markdown now, `.docx` later                                    | Markdown is interim; `.docx` adds Copilot searchability and Word editability                                      |
| 2   | Folder location     | Same as save folder (default) + custom override                | Zero config for common case, per-project override for power users                                                 |
| 3   | Intent detection    | LLM function call (`suggest_knowledge_search`) → user confirms | Layered UX: analytical answer first, then "💡 Search Knowledge Base?"; keyword heuristic as UI fallback (ADR-028) |
| 4   | Report versioning   | Ask user on re-publish                                         | Dialog: "Create new version or replace?"                                                                          |
| 5   | Auth for SharePoint | Reuse `getGraphTokenWithScopes()` OBO                          | Already built in `graphToken.ts`. Just add SP scope to allowlist.                                                 |
| 6   | Folder picker       | OneDrive File Picker v8 — unified across app                   | Native SharePoint UX for KB scope, data import, project open/save                                                 |
| 7   | Scope storage       | Per-project in `AnalysisState.knowledgeSearchFolder`           | Different projects can search different document libraries                                                        |
| 8   | Document upload     | No in-app upload                                               | SharePoint is the DMS; VariScout publishes reports only                                                           |

### Problems with the Original Design

- **€65/month** AI Search Basic tier cost — regardless of usage
- **No row-level security** on the `findings` index — problematic for multi-division orgs
- **Index population never built** — chicken-and-egg problem
- **Every CoScout message triggered search** — wasteful when most questions are about current data

### Existing Architecture to Leverage

VariScout already has a natural scope boundary via Teams integration ([ADR-016](adr-016-teams-integration.md)). The AI Integration Strategy defines two use cases:

1. **Improvement Team** — Teams channel for a project. SharePoint folder contains fault trees (FMEA), SOPs, process maps. Knowledge accumulates as findings are added.
2. **Daily Process Owner** — Standing docs in SharePoint: control plans, FMEA, equipment specs. VariScout detects violations, CoScout references the fault tree.

In both cases, the **channel's SharePoint folder is the natural scope** — it contains exactly the documents relevant to that team's work.

## Decision

**Pivot to Remote SharePoint with intent-based, folder-scoped search.**

Three key principles:

### 1. Remote SharePoint (Not Indexed)

Use Foundry IQ **Remote SharePoint** knowledge sources — queries SharePoint live via the Copilot Retrieval API, respecting per-user permissions.

| Dimension          | Remote SharePoint               | Indexed SharePoint            |
| ------------------ | ------------------------------- | ----------------------------- |
| **Permissions**    | ✅ Per-user (token passthrough) | App-level                     |
| **Purview labels** | ✅ Honored                      | Not enforced                  |
| **Data freshness** | ✅ Real-time                    | Indexer delay                 |
| **Setup**          | Simple                          | 3-step Entra app registration |
| **Index cost**     | ✅ €0                           | Uses AI Search storage        |
| **Rate limits**    | 200 req/user/hour               | Scales with tier              |

### 2. Intent-Based Triggering (Not Every Message)

CoScout **already has** everything about the current investigation via the AI context — stats, findings, hypotheses, variation contributions, filters, investigation phase. SharePoint search adds value only when the user needs **institutional knowledge** (historical or procedural).

**What CoScout already knows (no search needed):**

- Current Cpk, mean, stdDev, out-of-spec %
- Which factors contribute most to variation
- All findings, hypotheses, and actions
- Investigation phase and drill path
- Process context (user-described)

**When SharePoint search adds value:**

| Intent                   | Example Prompt              | Why SharePoint Helps                         |
| ------------------------ | --------------------------- | -------------------------------------------- |
| Root cause investigation | "What could be the reason?" | Fault tree in SharePoint lists known causes  |
| Historical reference     | "Has this happened before?" | Past VariScout reports show similar patterns |
| Procedure lookup         | "What does the SOP say?"    | Work instructions, control plans in folder   |
| Action planning          | "What worked last time?"    | Past 8D reports, resolved investigations     |

**When SharePoint search does NOT help:**

| Intent              | Example Prompt                    | Why Not                             |
| ------------------- | --------------------------------- | ----------------------------------- |
| Data interpretation | "What does this chart show?"      | Stats already in context            |
| Summary             | "Summarize my findings"           | Findings already in context         |
| General SPC         | "What is Cpk?"                    | Domain knowledge, no docs needed    |
| Next steps          | "What should I investigate next?" | Phase + contributions already known |

**UX pattern — layered response:**

```
User: "What could be the reason for this Cpk drop?"

CoScout (immediate, from current context):
  "Based on your variation analysis, Machine contributes
   34% and Operator 22%..."

  💡 "Search team documents for similar patterns?"
  [Search Knowledge Base]

User clicks → CoScout searches team's SharePoint folder:

  "I found relevant documents:
   📄 Fault Tree — Boring Process (BOR-001)
      Top causes: tool wear, fixture clamping, material hardness
   📄 8D Report — Cpk Drop Line 3 (Mar 2025)
      Resolved by adjusting coolant concentration 6% → 8%"
```

### 3. Channel-Folder-Scoped (Not Entire Tenant)

Search is scoped to the **Teams channel's SharePoint folder** — the same folder that already contains the team's `.vrs` project files and photos ([ADR-016](adr-016-teams-integration.md)).

```
Teams Channel: "Fill Line Improvement"
  └── SharePoint: /sites/QualityTeam/Shared Documents/Fill Line/
        ├── VariScout/           ← .vrs project files (existing)
        ├── Photos/              ← investigation photos (existing)
        ├── Reports/             ← published VariScout reports (new)
        ├── Fault Trees/         ← team's FMEA docs
        ├── Control Plans/       ← team's control plans
        └── 8D Reports/         ← team's past investigations
```

Knowledge search KQL filter:

```
path:"https://contoso.sharepoint.com/sites/QualityTeam/Shared Documents/Fill Line"
```

**Why folder-scoped:**

| Scope              | What Gets Searched  | Problem                                  |
| ------------------ | ------------------- | ---------------------------------------- |
| Entire tenant      | All SharePoint      | HR, finance, legal docs — noise, privacy |
| Entire site        | One SharePoint site | Marketing decks, meeting notes — noise   |
| **Channel folder** | Team's quality docs | ✅ Relevant, bounded, team-curated       |

The team **curates** what's in their folder. If they put a fault tree there, they're saying "this is relevant to our quality work."

### Architecture

```
Investigation complete → Report View (existing)
                              ↓
                     "Publish to SharePoint" (new)
                              ↓
              Graph API → channel's SharePoint folder /Reports/
                              ↓
              Remote SharePoint knowledge source (Foundry IQ)
                  ↓ KQL filter scopes to channel folder
                  ↓ passes user token via xMsQuerySourceAuthorization
              Copilot Retrieval API queries SharePoint live
                  ↓ returns only documents the user can access
              CoScout receives knowledge context (on demand)
```

### Licensing

| Path                        | Cost                      | Requirement                  |
| --------------------------- | ------------------------- | ---------------------------- |
| **M365 Copilot license**    | $30/user/month (included) | Full access                  |
| **Pay-as-you-go** (preview) | Metered consumption       | ≥1 Copilot license in tenant |

> [!IMPORTANT]
> Pay-as-you-go requires **at least one M365 Copilot license** active in the tenant.

### Touchpoints Where Knowledge Search Is Useful

| Touchpoint                             | Value         | Integration                                         |
| -------------------------------------- | ------------- | --------------------------------------------------- |
| **CoScout** — root cause questions     | 🟢 High       | Intent-detected suggestion → user confirms → search |
| **CoScout** — "ask about this finding" | 🟢 High       | Same path, finding text as search context           |
| Dashboard, charts, settings            | 🔴 Not needed | Current data analysis doesn't need external docs    |

### What's Already Built

| Component                                               | Status |
| ------------------------------------------------------- | ------ |
| `ReportViewBase` (5-section report UI)                  | ✅     |
| `useReportSections` (report type derivation)            | ✅     |
| `buildReportPrompt` (AI narrative generation)           | ✅     |
| `useShareReport` (Teams sharing, extend for SP publish) | ✅     |
| `searchDocuments()` (Foundry IQ agentic retrieval)      | ✅     |
| `useKnowledgeSearch` (hook with search + state)         | ✅     |
| `useEditorAI` (CoScout `onBeforeSend` enrichment)       | ✅     |
| `AdminKnowledgeSetup` (status + preview toggle)         | ✅     |
| Teams channel file storage (`.vrs`, photos)             | ✅     |

### What's New to Build

1. **"Publish to SharePoint" button** — in report footer (scaffolded, handler wired)
2. **Report renderer** — sections → `.docx` (deferred; Markdown interim)
3. **Graph API upload** — to channel's `/Reports/` folder (built in `reportUpload.ts`)
4. **Search scope selection** — Settings → Knowledge Base → channel folder (default) or custom path
5. **Per-project scope storage** — `AnalysisState.knowledgeSearchFolder` (built)
6. **Remote SharePoint knowledge source provisioning** — admin setup
7. **Intent detection** — LLM-driven via `suggest_knowledge_search` function call tool (ADR-028); keyword heuristic retained as UI fallback when AI is unavailable (built)
8. **Token scope expansion** — add Graph/SharePoint scope for `xMsQuerySourceAuthorization`
9. **"Open in SharePoint" link** — opens channel's SharePoint folder in browser (built)

## Alternatives Considered

### Search entire tenant

- **Rejected**: Noise, privacy, irrelevant results. Quality docs are in the team's folder.

### Auto-search on every CoScout message

- **Rejected**: Wasteful. Most questions are about current data (already in context). Adds latency, API calls, cost for no value.

### Use Indexed SharePoint (not Remote)

- **Rejected for default**: Doesn't respect per-user permissions or Purview labels. Kept as edge-case fallback.

### Keep dedicated findings search index

- **Rejected**: Custom RBAC duplicates SharePoint permissions. No indexer built. Reports in SharePoint contain the same knowledge.

## Consequences

### Positive

- **Per-user security** via SharePoint permissions + Purview labels
- **Team-scoped** — only relevant quality docs, no tenant-wide noise
- **Intent-based** — zero wasted API calls for routine analysis
- **Real-time** — published reports immediately searchable
- **Tangible output** — reports usable for audits, onboarding, knowledge transfer
- **Leverages existing Teams architecture** — folder scope = channel scope

### Negative

- **Copilot prerequisite** — ≥1 Copilot license in tenant for pay-as-you-go
- **Text-only retrieval** — charts/images in reports not searchable
- **Rate limits** — 200 req/user/hour (sufficient for intent-based usage)
- **File format constraint** — Markdown interim; `.docx` planned for better Copilot searchability

### Risks

- Pay-as-you-go is preview — pricing may change
- Intent detection may miss some relevant queries — fallback: manual "Search KB" button
- Customer must configure channel folder path (mitigate: auto-detect from Teams context)

---

## See Also

- [ADR-022: Knowledge Layer Architecture](adr-022-knowledge-layer-architecture.md) (amended by this ADR)
- [ADR-016: Microsoft Teams Integration](adr-016-teams-integration.md) (channel file storage)
- [ADR-024: Scouting Report](adr-024-scouting-report.md)
