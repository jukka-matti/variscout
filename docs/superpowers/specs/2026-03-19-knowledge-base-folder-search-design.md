---
title: 'Knowledge Base: Document Upload, Folder Selection & Permissions Design'
audience: [engineer, analyst]
category: architecture
status: Active
related: [knowledge-base, sharepoint, coscout, adr-026]
---

# Knowledge Base: Document Upload, Folder Selection & Permissions

**Date**: 2026-03-19
**ADR**: [ADR-026](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md)

---

## Context

ADR-026 established a SharePoint-first Knowledge Base strategy with Remote SharePoint retrieval. This spec evaluates three design questions:

1. How do documents get into the searchable scope?
2. Should users select the search folder?
3. How do permissions work for the user?

---

## Decision 1: No In-App Document Upload UI

Documents reach the searchable scope through two paths:

1. **Team curation** — team members put SOPs, FMEA, 8D reports into the channel's SharePoint folder (via Teams/SharePoint, not VariScout)
2. **Report publishing** — VariScout publishes scouting reports to `/Reports/` subfolder

**Rationale:**

- VariScout is an analysis tool, not a document management system
- Teams/SharePoint has mature upload, versioning, permissions, co-authoring
- Adding upload UI creates scope creep and write-permission complexity

**What to build instead:**

- "Publish to SharePoint" in Report View (already scaffolded)
- Onboarding copy: "Add your quality documents to your Teams channel folder to make them searchable by CoScout"
- "Open in SharePoint" link in Settings and AdminKnowledgeSetup (built)

---

## Decision 2: Auto-Detect + Manual Override

### Default (zero config)

- Channel tab → channel's SharePoint folder (auto-resolved via `channelDrive.ts`)
- Personal tab → user's OneDrive `/VariScout/` folder

### Override

- In **Settings → Knowledge Base**, user can set a custom SharePoint folder path
- Save folder ≠ search folder — they are often the same, but can differ (e.g., shared "Quality Library" site across channels)
- Per-project: stored in `AnalysisState.knowledgeSearchFolder`

### UI

In Settings → Knowledge Base (Team AI plan only):

```
Search scope
  ○ Channel folder (default)
  ○ Custom folder
    [ https://contoso.sharepoint.com/sites/... ]
  ℹ️ Only documents you have access to will appear in search results.
```

**Future enhancement:** Replace text input with `@microsoft/file-browser` component for native SharePoint folder navigation.

---

## Decision 3: Permissions — Token Passthrough

### How It Works

- `searchDocuments()` gets user's delegated token via `getGraphTokenWithScopes(['Sites.Read.All'])`
- Passes it as `x-ms-query-source-authorization` header
- Foundry IQ only returns documents the user can access

### Permission Scenarios

| Scenario                     | What Happens                  | UX                                     |
| ---------------------------- | ----------------------------- | -------------------------------------- |
| User has access to folder    | Results returned normally     | Documents shown with snippets          |
| User has partial access      | Only accessible docs returned | Fewer results, but correct             |
| User has no access to folder | Empty results                 | "No documents found" + help text       |
| Custom folder URL is invalid | API returns 404               | Error: "Folder not found"              |
| Token expired mid-session    | 401 from SP                   | "Sign in again to search documents"    |
| No Copilot license in tenant | Foundry IQ returns 403        | "Knowledge Base requires M365 Copilot" |

**Key principle:** Never show "access denied" for individual documents — just don't return them.

### Scopes

| Scope                 | Purpose                    | Notes                                |
| --------------------- | -------------------------- | ------------------------------------ |
| `Sites.Read.All`      | SharePoint search          | Delegated (only what user can see)   |
| `Files.ReadWrite.All` | Report publish + .vrs save | Already in Team plan scope allowlist |

No new scopes needed.

### Admin Consent

- First use triggers consent prompt for `Sites.Read.All` if not already consented
- `AdminKnowledgeSetup` displays consent requirement in prerequisites

---

## UX Principles

### Progressive Disclosure

1. **Default (zero config):** Channel folder auto-detected → search just works
2. **Power user:** Override folder in Settings → shared Quality Library
3. **Admin:** AdminKnowledgeSetup shows consent status, folder path, Foundry IQ health

### Transparency

- Always show where CoScout is searching: source attribution in results
- Show document source: `[Source: Fault Tree — BOR-001.docx]`
- Show "Only documents you have access to appear" (onboarding)

### No Dead Ends

- 0 results: "No documents found in [folder]. Add SOPs, FMEA, or 8D reports to your channel folder."
- Permission fail: "Sign in again" or "Ask your admin to grant Sites.Read.All"
- No Copilot license: "Knowledge Base requires M365 Copilot in your organization"

---

## AIX (AI Experience) Notes

### Intent Detection Refinement (Built)

Simple keyword heuristic in `CoScoutMessages`: checks last user message for intent keywords (root cause, SOP, procedure, happened before, previous, historical, fault tree, 8D, FMEA, control plan, work instruction, similar, last time, past report, corrective action). Parent can override via `knowledgeIntentDetected` prop.

Show "Search Knowledge Base?" when:

- Last message is assistant response
- Knowledge Base is available AND enabled
- No knowledge docs already shown for this exchange
- User's last message contains a knowledge-intent keyword (or parent overrides)

Don't show when:

- Question is purely about current data (no intent keywords detected)
- User is asking CoScout to explain/summarize
- Knowledge docs already displayed

### Source Attribution in CoScout

1. Cite inline: `"Based on your Fault Tree [📄 BOR-001], top causes include..."`
2. Link to source: clicking citation opens document in SharePoint
3. Distinguish: AI analysis (from stats) vs. institutional knowledge (from docs)

---

## Component Changes

| Component                     | Change                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `AnalysisState` (hooks types) | Added `knowledgeSearchFolder?: string`                                               |
| `DataContext` (Azure)         | Added `knowledgeSearchFolder` state + setter                                         |
| `useKnowledgeSearch` (hooks)  | Added `folderScope` option, passes to search function                                |
| `useEditorAI` (Azure)         | Accepts + passes `knowledgeSearchFolder`; auto-resolves channel folder               |
| `channelDrive.ts` (Azure)     | Added `folderWebUrl` to `ChannelDriveInfo`; captures from Graph API                  |
| `Editor.tsx` (Azure)          | Reads `knowledgeSearchFolder` from DataContext, passes to AI hook                    |
| `SettingsPanel` (Azure)       | Search scope radio + folder path input + "Open in SharePoint" link                   |
| `AdminKnowledgeSetup` (Azure) | Consent requirement, search scope info, "Open channel folder" link                   |
| `CoScoutMessages` (UI)        | Intent keyword detection; "Found N documents" header; `knowledgeIntentDetected` prop |
| `searchService.ts` (Azure)    | Already accepts `folderScope` — now wired end-to-end                                 |
| ADR-026                       | Updated format decision (Markdown interim), intent detection + SP links              |
| `knowledge-base-search.md`    | Added "Search Scope" section; fixed format references                                |

---

## See Also

- [ADR-026: SharePoint-First Knowledge Base](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md)
- [Knowledge Base Search](../../03-features/workflows/knowledge-base-search.md)
- [AI Architecture](../../05-technical/architecture/ai-architecture.md)
