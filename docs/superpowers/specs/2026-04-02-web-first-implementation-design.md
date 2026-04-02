---
title: Web-First Implementation Design
audience: [developer, architect]
category: architecture
status: draft
related: [adr-059, adr-026, adr-049, adr-033, web-first, knowledge-base, blob-storage]
---

# Web-First Implementation Design

## Context

ADR-059 shifts VariScout from a Teams-first to a web-first application. The Teams removal branch (`feature/adr-059-teams-removal`) has already deleted ~6,200 lines of Teams SDK, OBO flow, adaptive cards, channel drive, and Graph API code. This spec defines the complete architecture for what replaces it.

**Why:** Enterprise manufacturing CTOs resist third-party apps requesting `Files.ReadWrite.All` and 4 other admin-consent Graph API scopes. Customer-hosted webapp with EasyAuth (`User.Read` only, user-consent) eliminates this friction entirely.

## Product Model

Three tiers, per-deployment flat fee, unlimited users in tenant:

| Tier         | Price   | Deployment             | Storage               | AI              | KB                  |
| ------------ | ------- | ---------------------- | --------------------- | --------------- | ------------------- |
| **PWA**      | Free    | Static site            | Session only          | None            | None                |
| **Standard** | €79/mo  | Customer's Azure (ARM) | IndexedDB + export    | Customer's AOAI | None                |
| **Team**     | €199/mo | Customer's Azure (ARM) | IndexedDB + Blob sync | Customer's AOAI | Per-project unified |

- Everyone logs in with existing Microsoft ID (EasyAuth, `User.Read` only)
- No "VariScout accounts" — identity = Entra ID
- VariScout hosts nothing — all infrastructure in customer's subscription
- €10 individual tier evaluated and dropped (would require VariScout-hosted infra)

## 1. Auth & Identity

**Decision:** EasyAuth only, `User.Read` scope, user-consent, zero admin consent.

- No Teams SDK, no OBO, no Graph API
- Anyone in the Entra ID tenant can access the deployed app
- Auth module isolated in `apps/azure/src/auth/` — simplified to EasyAuth-only token caching
- `getCurrentUser()` returns user info from `/.auth/me` endpoint

**What was removed:** Teams SSO, OBO token exchange, multi-scope Graph tokens, JWT decoding, Teams context resolution.

## 2. Data & Storage

### Standard Tier

- **IndexedDB** for local persistence (existing, unchanged)
- **Manual export/import** of `.vrs` project files for sharing
- No cloud sync — projects live in one browser

### Team Tier

- **IndexedDB** + **Azure Blob Storage** sync (replaces OneDrive/SharePoint)
- Projects sync to customer's Blob Storage container
- Metadata sidecar (`.meta.json`) for project metadata

### Storage Architecture

`StorageAdapter` interface abstracts storage operations:

```typescript
interface StorageAdapter {
  save(projectId: string, data: ProjectData): Promise<void>;
  load(projectId: string): Promise<ProjectData>;
  list(): Promise<ProjectMetadata[]>;
  delete(projectId: string): Promise<void>;
}
```

- Azure Blob implementation now
- Interface enables future providers (S3, GCP) without app changes
- Components never import `@azure/*` directly — all access through adapter
- SAS token endpoint on Express.js server (`/api/storage-token`)

### Blob Storage Structure

```
variscout-projects/
├── {userId}/
│   ├── {projectId}/
│   │   ├── project.vrs              ← project data
│   │   ├── project.meta.json        ← metadata sidecar
│   │   ├── knowledge-index.json     ← unified knowledge index
│   │   ├── references/              ← uploaded reference docs
│   │   ├── attachments/             ← finding attachments
│   │   └── reports/                 ← published reports
```

## 3. AI Integration

**Decision:** Customer's own Azure OpenAI, provider-agnostic abstractions.

- Current model unchanged: API key obtained from EasyAuth bearer token at runtime
- `AIProvider` abstraction for future flexibility (Claude, OpenAI direct, other providers)
- CoScout keeps all 18 existing tools + new `search_knowledge_base` tool (#19)
- **"On Your Data" mode not used** — incompatible with function calling (disables all 18 CoScout tools)

## 4. Unified Knowledge System (Team Tier)

### Core Concept

Knowledge Catalyst (ADR-049) and External KB (ADR-026) merge into a **single knowledge index per project**. Every piece of investigation knowledge — external documents, findings, question answers, conclusions, reports — feeds the same searchable index.

### What Feeds The Index

| Source                                          | Trigger                         | Type Tag     |
| ----------------------------------------------- | ------------------------------- | ------------ |
| Analyst uploads reference doc (SOP, spec, FMEA) | File upload                     | `document`   |
| Team member answers question with document      | Question answer attachment      | `document`   |
| Team member answers question with text          | Question answer save            | `answer`     |
| Analyst creates finding                         | Finding CRUD                    | `finding`    |
| CoScout suggests saving insight (ADR-049)       | `suggest_save_finding` accepted | `finding`    |
| Investigation conclusion written                | Conclusion save                 | `conclusion` |
| Report published                                | Report publish action           | `report`     |

### Knowledge Index Format

One JSON file per project in Blob Storage: `knowledge-index.json`

```typescript
interface KnowledgeIndex {
  version: 1;
  model: 'text-embedding-3-small';
  dimensions: 1536;
  updatedAt: string;
  documents: Array<{
    id: string;
    fileName?: string;
    sourceType: 'document' | 'finding' | 'answer' | 'conclusion' | 'report';
    sourceId?: string; // findingId, questionId, etc.
    uploadedBy?: string;
    uploadedAt: string;
    chunkCount: number;
  }>;
  chunks: Array<{
    id: string;
    documentId: string;
    text: string;
    embedding: number[]; // 1536 floats
    metadata: {
      sourceType: 'document' | 'finding' | 'answer' | 'conclusion' | 'report';
      page?: number;
      section?: string;
      findingId?: string;
      questionId?: string;
    };
  }>;
}
```

### Search Implementation (Option B: Embeddings in Blob Storage)

**Embedding model:** `text-embedding-3-small` (1536 dimensions, $0.02/1M tokens)

**Upload pipeline:**

1. File received at `/api/kb-upload` (or triggered by finding/answer creation)
2. **Crack:** SheetJS for XLSX, mammoth for DOCX, pdf-parse for simple PDFs, Document Intelligence Layout model for complex PDFs with tables ($10/1K pages, free tier: 500 pages/month)
3. **Chunk:** ~500 tokens per chunk, 100 token overlap, tables kept as single chunks
4. **Embed:** Call customer's Azure OpenAI `text-embedding-3-small`
5. **Store:** Append to `knowledge-index.json` in project's Blob Storage folder

**Search pipeline:**

1. CoScout calls `search_knowledge_base(query)`
2. `/api/kb-search` endpoint embeds the query
3. Load `knowledge-index.json` (cached in Express.js memory with LRU eviction)
4. Brute-force cosine similarity + keyword boost (~20 lines)
5. Return top-5 chunks with source attribution

**Keyword boost:** If query contains exact terms found in chunk text (e.g., "SOP-103", part numbers), boost that chunk's score. Closes ~90% of the gap with AI Search's hybrid approach.

**Performance:**

- 500 vectors × 1536 dimensions: <5ms search time
- Index file size: ~16 MB per project (500 chunks)
- Embedding cost per project: ~$0.004 (one-time)
- Monthly infrastructure cost: **$0** (uses existing Blob Storage + AOAI)

### Document Cracking Strategy

| File Type            | Primary                                             | Fallback             | Cost         |
| -------------------- | --------------------------------------------------- | -------------------- | ------------ |
| XLSX (Excel)         | SheetJS — structured rows, preserves column headers | —                    | $0           |
| DOCX                 | mammoth — text + tables as HTML/markdown            | —                    | $0           |
| Markdown             | Raw text                                            | —                    | $0           |
| PDF (text-only)      | pdf-parse                                           | —                    | $0           |
| PDF (tables/scanned) | Azure Document Intelligence Layout                  | pdf-parse (degraded) | $10/1K pages |

`DocumentCracker` interface abstracts the cracking strategy — each file type gets the right handler. When Document Intelligence is available (Team tier, resource deployed), PDFs route through it automatically for best quality. When unavailable (Standard tier, or resource not provisioned), PDFs fall back to pdf-parse.

**Document Intelligence pricing for VariScout scale:**

- Free tier: 500 pages/month (covers ~3-4 project uploads)
- S0 Read model: $1.50/1K pages (text extraction only)
- S0 Layout model: $10/1K pages (text + tables — needed for manufacturing SOPs)
- Typical project (150 pages): $1.50 with Layout model
- Document Intelligence resource deployed via ARM template (Team tier only)

### Security: Per-Project Scoping

- **Default scope:** CoScout searches only the current project's `knowledge-index.json`
- **No cross-project search** in v1 — natural Chinese walls for listed companies (pörssiyhtiö)
- **No `_organization/` shared folder** in v1 — defer org-wide docs
- The "Publish" button is the security boundary for future cross-project search
- Per-project by default = zero admin configuration for security

### Knowledge Catalyst Integration (ADR-049)

ADR-049's 7 capabilities stay as designed. The integration:

1. **Save insight as finding** (existing) — now also embeds finding text into knowledge index
2. **`suggest_save_finding`** (existing) — same: accepted insights → finding + embedding
3. **Finding CRUD hooks** — on create/update, re-embed the finding in the index
4. **Question answer hooks** — on answer save (text or document), embed into index
5. **Report publish** — on publish, chunk report sections and embed

This means Knowledge Catalyst automatically builds the searchable knowledge base through normal investigation workflow. No separate "upload to KB" action needed.

### Source Attribution

Each chunk carries `sourceType` metadata. CoScout cites results with source context:

> "Per SOP-103 §4.2 [📄 document], the tolerance is ±0.01mm. Your colleague Pekka noted [💬 answer] that the new supplier is 0.02mm under. This aligns with your earlier finding [📌 finding] about the January Cpk drop."

### Upgrade Path

`KnowledgeAdapter` interface abstracts the search backend:

```typescript
interface KnowledgeAdapter {
  index(projectId: string, chunks: ChunkWithEmbedding[]): Promise<void>;
  search(projectId: string, query: string, topK?: number): Promise<SearchResult[]>;
  remove(projectId: string, documentId: string): Promise<void>;
}
```

- **v1 (now):** `BlobKnowledgeAdapter` — JSON in Blob Storage, brute-force cosine + keyword boost
- **Future (if cross-project needed):** `AISearchKnowledgeAdapter` — Azure AI Search, hybrid + semantic ranking, justified when searching 10K+ chunks across projects

## 5. Collaboration Model

### Asymmetric Collaboration

The analyst drives; the team contributes evidence:

| Role            | Access                                  | Actions                                                              |
| --------------- | --------------------------------------- | -------------------------------------------------------------------- |
| **Analyst**     | Full tool access                        | Create projects, run analysis, manage findings, use CoScout          |
| **Team member** | Project access via shared link (future) | Answer questions (text + documents), validate findings, view reports |
| **Manager**     | Report access                           | View published reports, approve improvement actions                  |

### How Team Members Contribute

1. Log in with Microsoft ID (EasyAuth, already in tenant)
2. Open the project (Team tier: via Blob Storage shared access)
3. See questions assigned/visible to them
4. Answer with text explanation and/or document upload
5. Their answers + documents feed the unified knowledge index

### Sharing (v1 vs Future)

- **v1:** Team members access via same deployment (same App Service URL). Projects in Blob Storage visible to all tenant users.
- **Future:** Link-based sharing for read-only report access without full app access.

## 6. Platform Strategy

**Decision:** Azure primary, clean abstractions where cheap.

| Layer        | Azure Implementation                      | Interface                  |
| ------------ | ----------------------------------------- | -------------------------- |
| Storage      | Azure Blob Storage SDK                    | `StorageAdapter`           |
| AI           | Azure OpenAI                              | `AIProvider`               |
| Search       | Embeddings in Blob (cosine)               | `KnowledgeAdapter`         |
| Doc cracking | Document Intelligence + SheetJS + mammoth | `DocumentCracker`          |
| Auth         | EasyAuth                                  | Isolated in `auth/` module |

Components never import `@azure/*` directly. Not building multi-cloud, but not hardcoding Azure into business logic. If a customer says "we're on AWS," an S3 adapter can be built without rewriting the app.

## 7. What's NOT In Scope

- **Individual €10/month tier** — would require VariScout-hosted infra (dropped)
- **Cross-project KB search** — deferred to future phase
- **Organization-wide shared documents** — deferred to future phase
- **Real-time collaboration** (WebSocket/CRDT) — not needed for asymmetric model
- **Teams static tab** — optional future, not a code dependency
- **Knowledge Base for Standard tier** — Team tier only (justifies price delta)

## 8. Infrastructure Changes

### ARM Template Updates

| Resource                         | Standard    | Team        | Change                        |
| -------------------------------- | ----------- | ----------- | ----------------------------- |
| App Service                      | B1          | B1/S1       | Unchanged                     |
| Blob Storage                     | New         | New         | Replaces OneDrive             |
| Azure OpenAI                     | Existing    | Existing    | Unchanged                     |
| Document Intelligence            | —           | New (F0/S0) | For PDF table extraction      |
| Azure AI Search                  | —           | **Removed** | Replaced by Blob-based search |
| Azure Functions (token-exchange) | **Removed** | **Removed** | OBO no longer needed          |

### Removed from ARM Template

- Azure Functions (OBO token exchange)
- Azure AI Search (replaced by embeddings in Blob)
- All Graph API-related CSP headers

### Added to ARM Template

- Blob Storage account (or container in existing storage)
- Document Intelligence resource (Team tier, F0 free tier default)
- SAS token generation endpoint configuration

## Verification

### How to Test End-to-End

1. **Auth:** Deploy to App Service, verify EasyAuth login with `User.Read` only
2. **Storage (Standard):** Create project, save, reload browser, verify IndexedDB persistence. Export `.vrs`, import on another browser.
3. **Storage (Team):** Create project, verify sync to Blob Storage. Open in second browser (same tenant), verify project appears.
4. **KB Upload:** Upload a PDF and XLSX to a project. Verify chunks appear in `knowledge-index.json` in Blob Storage.
5. **KB Search:** Ask CoScout a question that requires knowledge from uploaded docs. Verify `search_knowledge_base` tool is called and returns relevant chunks.
6. **Knowledge Catalyst:** Create a finding. Verify it's embedded in the knowledge index. Search for it via CoScout.
7. **Question answers:** Answer a question with text and a document. Verify both are embedded and searchable.
8. **Security:** Open two projects. Verify KB search in project A does not return results from project B.
9. **ARM deployment:** Deploy fresh via ARM template. Verify all resources created correctly for both Standard and Team tiers.
