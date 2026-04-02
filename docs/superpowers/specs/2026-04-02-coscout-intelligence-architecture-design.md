---
title: 'CoScout Intelligence Architecture'
date: 2026-04-02
status: draft
audience: [developer, architect]
category: architecture
related:
  [
    adr-060,
    adr-022,
    adr-026,
    adr-049,
    adr-053,
    adr-054,
    adr-047,
    adr-057,
    adr-059,
    foundry-iq,
    knowledge-base,
    coscout,
    question-driven-eda,
  ]
---

# CoScout Intelligence Architecture

## Problem Statement

CoScout operates on approximately 15–25% of investigation knowledge. A critical audit of `buildAIContext()` reveals:

- **Finding text**: only key driver text reaches CoScout; ~95% of finding descriptions lost
- **Comments**: zero comment text transmitted
- **Problem statement**: declared in `ProcessContext` but never serialized (dead code)
- **Outcomes**: completely absent — no effectiveness ratings, no before/after Cpk
- **Improvement ideas**: text and selection only; timeframe, cost, risk, direction, rationale all lost
- **Action items**: aggregate progress only; no individual assignees, due dates, or idea linkage
- **External knowledge**: zero access to SOPs, FMEAs, specs, or past project learnings

Additionally, mode-aware question generation (ADR-054) is ~70% complete — the yamazumi question generator is orphaned, performance channel ranking is unimplemented, and evidence sorting is hardcoded to R²adj.

## Decision

Implement a five-pillar CoScout Intelligence Architecture (ADR-060) that transforms CoScout from a context-summarizing assistant into a knowledge-grounded investigation partner.

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ Pillar 1: HOT CONTEXT (always in prompt)            │
│ Fix buildAIContext() — summaries and signals         │
│ Budget: ~420 additional tokens of 12K               │
├─────────────────────────────────────────────────────┤
│ Pillar 2: WARM RETRIEVAL (on-demand via tool)       │
│ Investigation artifacts embedded in Foundry IQ      │
│ CoScout retrieves full detail when needed (ReAct)   │
├─────────────────────────────────────────────────────┤
│ Pillar 3: COLD STORAGE (on-demand via same tool)    │
│ External documents (SOPs, FMEAs, specs) in Blob     │
│ Auto-indexed by Foundry IQ from Blob Storage        │
├─────────────────────────────────────────────────────┤
│ Pillar 4: QUESTION ↔ COSCOUT INTERACTION            │
│ Focused question visibility, answer tool, answer    │
│ documents feeding KB                                │
├─────────────────────────────────────────────────────┤
│ Pillar 5: MODE-AWARE QUESTION COMPLETION            │
│ Wire yamazumi generator, performance ranking,       │
│ evidence sorting, validation method awareness       │
└─────────────────────────────────────────────────────┘
```

**Research foundation**: Industry research confirms "more context ≠ better" (Chroma 2025: every frontier model degrades at every input length increment). The three-layer hot/warm/cold architecture follows the tiered retrieval pattern used by Cursor, GitHub Copilot, and enterprise knowledge assistants.

## Pillar 1: Hot Context Quality

### Problem

`buildAIContext()` produces a skeletal summary. CoScout sees finding counts but not content, question status but not evidence, and zero outcomes.

### Changes to `buildAIContext()` and `coScout.ts`

| Field             | Current                      | Proposed                                                            | Est. Tokens |
| ----------------- | ---------------------------- | ------------------------------------------------------------------- | ----------- |
| Problem statement | Dead code (never serialized) | Wire Watson's 3 Qs: measure, direction, scope                       | ~30         |
| Finding summaries | Count + key driver text      | Top-5 by recency: text + status + outcome + comment count           | ~200        |
| Outcomes          | Zero                         | Per resolved finding: effective/partial/not + Cpk delta             | ~50         |
| Overdue actions   | Aggregate `total/done` only  | Top-3 overdue: text + assignee + days overdue                       | ~60         |
| Ideas             | Text + selected              | + direction + timeframe + risk level                                | ~40         |
| Comment signal    | Zero                         | Comment count per finding (not full text — full text via retrieval) | ~20         |
| Focused question  | Indirect via selectedFinding | Direct `focusedQuestionId` + question text                          | ~20         |

**Total additional budget**: ~420 tokens. Fits within existing 12K ceiling.

### Position-Aware Ordering

Research shows 30%+ accuracy drop for information placed in the middle of context versus start/end (architectural limitation of RoPE position embeddings). Context summary ordering:

1. **Start** (highest attention): Problem statement, suspected causes, focused question
2. **Middle**: Finding summaries, question tree, improvement ideas
3. **End** (second-highest attention): Overdue actions, recent findings, outcome summaries

### Files Modified

- `packages/core/src/ai/types.ts` — add `problemStatement`, `focusedQuestionId`, `focusedQuestionText` to `AIContext.investigation`; add `outcomes` to finding summary
- `apps/azure/src/features/ai/useAIOrchestration.ts` (or `buildAIContext` source) — wire new fields from data model
- `packages/core/src/ai/prompts/coScout.ts` — position-aware rendering in `buildSummaryPrompt()`

## Pillar 2: Investigation Retrieval via Foundry IQ

### Problem

When CoScout needs full detail about a specific finding (its comments, attachments, action history, outcome), it has no way to access it. Hot context carries summaries, not depth.

### Solution: Embed Investigation Artifacts

Investigation artifacts are serialized to Blob Storage as structured JSON. Foundry IQ auto-indexes them alongside external documents, making them searchable via the same `search_knowledge_base` tool.

**What gets indexed** (on mutation, debounced 5s, async, non-blocking):

| Artifact             | Trigger                   | Content Indexed                                                                |
| -------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| Finding (full)       | create / update / comment | Text + all comments + attachment metadata + actions + outcome                  |
| Question (answered)  | status → answered         | Question text + answer evidence (η², R²adj) + manual note + linked finding IDs |
| Question (ruled-out) | status → ruled-out        | Question text + why ruled out (negative learning)                              |
| Conclusion           | converging phase          | Synthesis text + suspected causes + evidence chain                             |
| Improvement idea     | create / update           | Text + direction + timeframe + cost + risk + rationale                         |
| Report               | publish action            | Report sections chunked                                                        |

**NOT indexed** (already in hot context or too noisy):

- Open/investigating questions (still being explored — volatile state)
- Raw stats / chart data (numeric, not embeddable as text)
- Filter state changes (transient navigation)

### Blob Storage Layout

```
variscout-projects/{tenantId}/{projectId}/
  project.json              # existing project data
  photos/                   # existing photo uploads
  documents/                # NEW: original uploaded files
    {docId}-{filename}      # e.g., abc123-SOP-103.pdf
  investigation/            # NEW: serialized artifacts for indexing
    findings.jsonl          # one JSON object per finding (full detail)
    questions.jsonl         # answered/ruled-out questions
    ideas.jsonl             # improvement ideas
    conclusions.jsonl       # investigation conclusions
```

JSONL format (one JSON object per line) for efficient append-only updates. Foundry IQ's blob indexer runs on a configurable schedule (e.g., every 5 minutes) to pick up new/changed files. On-demand re-indexing can also be triggered via the indexer REST API after bulk uploads.

### Indexing Trigger

Piggyback on existing `onFindingsChange` / `onQuestionsChange` callbacks:

```
Mutation → onFindingsChange → persistence (IndexedDB)
                            → serialize to Blob (debounced 5s, async)
                            → Foundry IQ auto-indexes on next cycle
```

Failures are silent — eventual consistency is acceptable for search.

## Pillar 3: External Document Knowledge Base

### Problem

Analysts need CoScout to reference SOPs, FMEAs, specification documents, and team member contributions that are not part of the investigation data model.

### Solution: Foundry IQ with Blob Storage Knowledge Source

**Architecture:**

```
Upload Paths (3)                    Blob Storage
├── Knowledge tab (PI panel)   ───→ documents/{docId}-{filename}
├── CoScout panel (drag/drop)  ───→ documents/{docId}-{filename}
└── Finding comment attachment ───→ documents/{docId}-{filename}
                                        │
                                        │ auto-indexed
                                        ▼
                                   Foundry IQ
                                   Knowledge Base
                                   ├── Auto-chunking
                                   ├── Auto-vectorization
                                   │   (text-embedding-3-small)
                                   ├── Hybrid: BM25 + vector + RRF
                                   ├── Semantic reranking
                                   └── Agentic query planning
                                        │
                                        ▼
                                   search_knowledge_base tool
                                   (CoScout decides when to call)
```

### Foundry IQ Configuration

**Knowledge Base**: One per customer deployment (Azure Marketplace).

**Knowledge Source**: `azureBlob` type, pointing to `variscout-projects` container.

**Embedding Model**: `text-embedding-3-small` (1536 dimensions, $0.02/1M tokens) — via customer's Azure OpenAI deployment.

**Retrieval Reasoning Effort**: `low` (single-pass LLM query planning, 3 subqueries max). Upgrade to `medium` (iterative with retry) if quality warrants it.

**Supported File Types** (auto-cracked by Foundry IQ): PDF, DOCX, XLSX, CSV, JSON, JSONL, Markdown, HTML, RTF, PPTX, XML, plain text.

**Key simplification**: Foundry IQ handles chunking, embedding, and indexing automatically. No SheetJS, mammoth, pdf-parse, or Document Intelligence needed in server.js.

### Project-Level Security Filtering

Each document and investigation artifact carries a `projectId` metadata field. Queries are filtered server-side:

```
User logs in (EasyAuth)
  → server.js extracts user identity from bearer token
  → determines accessible project IDs
  → queries Foundry IQ with filter: projectIds/any(p:search.in(p, '{ids}'))
  → returns only results from authorized projects
```

Filter is computed **server-side** — users cannot bypass it. One index per customer, `projectId` filter per query.

### Server.js Endpoints

| Endpoint         | Method | Purpose                                                                                                |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `/api/kb-upload` | POST   | Receive file, store in Blob `documents/`, return document metadata                                     |
| `/api/kb-search` | POST   | Compute projectId filter from EasyAuth, query Foundry IQ, return top-5 results with source attribution |
| `/api/kb-list`   | GET    | List indexed documents for a project (for Knowledge tab UI)                                            |
| `/api/kb-delete` | DELETE | Remove document from Blob (Foundry IQ auto-removes from index)                                         |

### Source Attribution

Each result carries `sourceType` metadata. CoScout cites results with source context:

> "Per SOP-103 §4.2 [📄 document], the tolerance is ±0.01mm. Your colleague Pekka noted [💬 answer] that the new supplier is 0.02mm under. This aligns with your earlier finding [📌 finding] about the January Cpk drop."

### Upload Paths

**Path 1: Knowledge tab in PI panel** (primary for reference documents)

- New tab in PI panel overflow menu (alongside Data, What-If)
- Upload button, document list with metadata (name, type, uploader, date, size)
- Preview, download, and delete actions
- Shows all indexed documents for the current project

**Path 2: CoScout panel** (contextual upload during conversation)

- Drag/drop or attach button in CoScout input area
- File uploaded to Blob, auto-indexed by Foundry IQ
- CoScout immediately informed: "I've received your document. I can search it for relevant information."

**Path 3: Finding comment attachments** (evidence alongside findings)

- Existing ADR-049 capability #6
- Files uploaded to `documents/` alongside comment metadata
- Auto-indexed by Foundry IQ — searchable across the project

### Cost Analysis

| Component                                       | Monthly Cost                        |
| ----------------------------------------------- | ----------------------------------- |
| Azure AI Search Basic (required for Foundry IQ) | ~€65                                |
| Foundry IQ agentic retrieval                    | Free tier: 50M tokens/month         |
| LLM query planning (Azure OpenAI)               | ~€5 (estimated 2,000 queries/month) |
| Embedding generation (text-embedding-3-small)   | ~€0.01 (one-time per project)       |
| Blob Storage for documents                      | ~€0.02                              |
| **Total**                                       | **~€70/month**                      |

Added to Team tier (€199/month) = 35% uplift, justified by professional-grade knowledge search.

### KnowledgeAdapter Fallback

`KnowledgeAdapter` interface abstracts the search backend:

```typescript
interface KnowledgeAdapter {
  index(projectId: string, chunks: ChunkWithMetadata[]): Promise<void>;
  search(projectId: string, query: string, options?: SearchOptions): Promise<SearchResult[]>;
  remove(projectId: string, documentId: string): Promise<void>;
  list(projectId: string): Promise<DocumentEntry[]>;
}

interface SearchOptions {
  sourceTypes?: SourceType[];
  topK?: number;
  projectFilter?: string[];
}
```

**Primary**: `FoundryIQKnowledgeAdapter` — agentic retrieval via Foundry IQ Knowledge Base API.

**Fallback** (if Foundry IQ preview breaks): `AISearchKnowledgeAdapter` — direct Azure AI Search hybrid query (same underlying search, minus agentic query planning).

**Emergency fallback**: `BlobKnowledgeAdapter` — brute-force cosine + keyword boost on JSON in Blob Storage (€0/month, degraded quality).

### Beta Positioning

Knowledge features launch as **beta**, using existing preview gate infrastructure:

- `isPreviewEnabled('knowledge-base')` — opt-in toggle in admin settings
- `PreviewBadge` component on Knowledge tab and document search UI
- No SLA promise — aligns with Foundry IQ's own preview status
- When Foundry IQ reaches GA → remove beta badge, promote to stable

### ARM Template Changes

| Resource                            | Standard | Team           | Change                         |
| ----------------------------------- | -------- | -------------- | ------------------------------ |
| Azure AI Search Basic               | —        | New            | Required for Foundry IQ        |
| Azure AI Search semantic ranker     | —        | Enabled        | Required for agentic retrieval |
| Azure OpenAI text-embedding-3-small | —        | New deployment | For vectorization              |

**Removed** (from ADR-022/026 era): Azure Functions (OBO token-exchange), Foundry IQ remote SharePoint knowledge source configuration.

## Pillar 4: Question ↔ CoScout Interaction

### Problem

CoScout cannot directly answer questions, doesn't know which question the analyst is focused on, and can't see why questions were answered or ruled out.

### Fix 1: Focused Question Visibility

Add to `AIContext.investigation`:

```typescript
focusedQuestionId?: string;
focusedQuestionText?: string;
```

Populated from the investigation store's `focusedQuestionId` state. CoScout knows what the analyst is investigating right now, enabling contextual suggestions:

> "You're focused on 'Does Shift affect Cpk?' — let me check the data for Shift."

### Fix 2: Question Answer Visibility

Add `manualNote` to question context for answered/ruled-out questions in `allQuestions`:

```typescript
allQuestions?: Array<{
  // existing fields...
  manualNote?: string;     // NEW: why this was answered/ruled-out
  linkedFindingIds?: string[];  // NEW: supporting findings
}>;
```

CoScout sees **why** a question was answered, not just that it was.

### Fix 3: Answer Question Tool (New Action Tool)

New action tool `answer_question` in INVESTIGATE+ phase:

```typescript
{
  type: 'function',
  name: 'answer_question',
  parameters: {
    question_id: string,           // required
    status: 'answered' | 'ruled-out',  // required
    note: string,                  // required: explanation
    finding_id?: string            // optional: link to supporting finding (recommended when evidence exists)
  }
}
```

Uses proposal pattern — CoScout proposes, analyst confirms via `ActionProposalCard`:

> "The ANOVA shows η²=0.23 for Shift. I suggest marking this as answered: 'Shift explains 23% of variation, with Night shift showing highest mean.'"

Phase-gated to INVESTIGATE+. CoScout cannot auto-answer — analyst always confirms.

### Fix 4: Question Answer Documents Feed KB

When a team member answers a question:

- **Text answer**: serialized to `investigation/questions.jsonl` in Blob → auto-indexed by Foundry IQ as `sourceType: 'answer'`
- **Document answer**: file stored in `documents/` → auto-indexed as `sourceType: 'document'` with `questionId` metadata

This means Knowledge Catalyst (ADR-049) automatically builds the searchable knowledge base through normal investigation workflow. No separate "upload to KB" action needed.

## Pillar 5: Mode-Aware Question Completion

### Problem

Mode-aware question generation (ADR-054) is ~70% complete. Three critical gaps:

1. Yamazumi question generator exists but is not wired into the pipeline
2. Performance channel ranking generator is defined but not implemented
3. Evidence sorting is hardcoded to R²adj in all modes

### Fix 1: Wire Yamazumi Question Generator

In `useQuestionGeneration.ts`, add mode routing:

```typescript
if (mode === 'yamazumi') {
  return generateYamazumiQuestions(yamazumiData, taktTime);
} else {
  return generateQuestionsFromRanking(bestSubsets, { mode });
}
```

Input: `YamazumiBarData[]` from `useYamazumiChartData()` + optional `taktTime` from specs.

Output: Lean-specific questions — takt compliance, waste composition, waste drivers, temporal stability, kaizen targeting. Already implemented in `packages/core/src/yamazumi/questions.ts` and tested.

### Fix 2: Performance Channel Ranking

Implement `generateChannelRankingQuestions()` for `mode === 'performance'`:

```typescript
function generateChannelRankingQuestions(channels: ChannelResult[]): GeneratedQuestion[] {
  // Rank channels by worst Cpk
  // Generate questions: "Why does Channel 7 have Cpk=0.83?"
  // Auto-rule-out channels with Cpk > 1.67 (excellent)
}
```

Follows same pattern as `generateQuestionsFromRanking` but uses `channelCpk` as evidence metric.

### Fix 3: Evidence Sorting by Mode

Replace hardcoded R²adj sorting in `QuestionsTabView.tsx` and `QuestionRow.tsx`:

```typescript
// Before (hardcoded):
const sort = (a, b) => (b.evidence?.rSquaredAdj ?? -1) - (a.evidence?.rSquaredAdj ?? -1);

// After (mode-aware):
const metric = strategy.questionStrategy.evidenceMetric;
const sort = (a, b) => (b.evidence?.[metric] ?? -1) - (a.evidence?.[metric] ?? -1);
```

| Mode        | Sort By             | Label       |
| ----------- | ------------------- | ----------- |
| standard    | `rSquaredAdj`       | R²adj       |
| capability  | `cpkImpact`         | Cpk impact  |
| yamazumi    | `wasteContribution` | Waste %     |
| performance | `channelCpk`        | Channel Cpk |

### Fix 4: CoScout Validation Method Awareness

Add mode's `validationMethod` and `questionFocus` to CoScout system prompt:

```typescript
const qs = strategy.questionStrategy;
// Inject into system prompt:
// "For this analysis mode, the primary evidence metric is {qs.evidenceLabel}."
// "Questions are validated using {qs.validationMethod}."
// "Focus on: {qs.questionFocus}"
```

CoScout understands that yamazumi questions validate via takt compliance (not ANOVA), and performance questions focus on channel health diagnostics.

## What This ADR Supersedes

- **ADR-022** (Knowledge Layer Architecture) — Azure AI Search + Foundry IQ agentic retrieval for findings indexer. Superseded: Foundry IQ now indexes both documents and investigation artifacts from Blob Storage, replacing the manual indexer pipeline.
- **ADR-026** (Knowledge Base — SharePoint-First) — Remote SharePoint knowledge sources. Superseded: SharePoint access removed per ADR-059; documents now uploaded directly to Blob Storage and indexed by Foundry IQ.

**ADR-049** (CoScout Knowledge Catalyst) remains **accepted** — its 7 capabilities are preserved and enhanced. The Knowledge Catalyst's "investigation model IS the memory" insight is validated and extended: investigation artifacts now also feed the searchable knowledge index.

## What's NOT in Scope

- **Cross-project KB search** — deferred to future phase (requires org-wide index)
- **Organization-wide shared documents** — deferred (no `_organization/` folder in v1)
- **Real-time collaboration** (WebSocket/CRDT) — not needed for asymmetric model
- **Knowledge Base for Standard tier** — Team tier only (justifies price delta)
- **Dual-model routing** (fast/reasoning tier) — separate concern
- **Usage tracking / token metrics** — separate concern

## Consequences

### Positive

- CoScout operates on full investigation knowledge depth, not skeletal summaries
- External documents (SOPs, FMEAs, specs) searchable alongside investigation artifacts
- Hybrid BM25 + vector + semantic reranking provides best-in-class search quality
- Exact term matching (part numbers, SOP codes) works via BM25 — critical for manufacturing
- Project-level security filtering ensures data isolation within customer deployments
- Knowledge Catalyst (ADR-049) automatically builds KB through normal investigation workflow
- Mode-aware question generation completes the ADR-054 vision
- CoScout can propose answering questions — reducing analyst friction
- Beta positioning manages customer expectations while Foundry IQ is in preview

### Negative

- Azure AI Search Basic adds ~€65/month to Team tier infrastructure cost
- Foundry IQ is in public preview — API may change, no SLA (mitigated by KnowledgeAdapter fallback)
- Investigation artifact serialization to Blob adds background I/O (mitigated by debouncing + async)
- Five pillars is a large scope — implementation should be phased
- Additional server.js endpoints increase Express server complexity

### Risks

| Risk                                      | Likelihood | Impact | Mitigation                                                         |
| ----------------------------------------- | ---------- | ------ | ------------------------------------------------------------------ |
| Foundry IQ preview breaks                 | Medium     | High   | KnowledgeAdapter fallback to AISearchKnowledgeAdapter              |
| Foundry IQ never reaches GA               | Low        | High   | Drop to Azure AI Search hybrid (same quality minus query planning) |
| Index grows beyond Blob performance       | Low        | Medium | Upgrade to Azure AI Search S1 or add partitions                    |
| Token budget exceeded with richer context | Low        | Medium | budgetContext priority trimming already handles this               |
| Concurrent Blob writes from team members  | Medium     | Low    | JSONL append-only format + ETags for optimistic concurrency        |

## Implementation Phases

### Phase 1: Hot Context Quality (Pillar 1)

Fix `buildAIContext()` gaps. No infrastructure changes. Immediate CoScout improvement.

**Files**: `types.ts`, `buildAIContext` source, `coScout.ts`

### Phase 2: Question Interaction + Mode Completion (Pillars 4 + 5)

Wire focused question, answer tool, yamazumi generator, performance ranking, evidence sorting.

**Files**: `useQuestionGeneration.ts`, `coScout.ts`, `QuestionsTabView.tsx`, `QuestionRow.tsx`, `analysisStrategy.ts`

### Phase 3: Knowledge Base Infrastructure (Pillar 3)

Deploy Azure AI Search + Foundry IQ in ARM template. Server.js endpoints. Knowledge tab UI.

**Files**: ARM template, `server.js`, new `KnowledgeAdapter` interface, Knowledge tab components

### Phase 4: Investigation Retrieval (Pillar 2)

Serialize investigation artifacts to Blob. Wire `onFindingsChange`/`onQuestionsChange` to Blob serialization. Connect to same Foundry IQ index.

**Files**: orchestration hooks, Blob serialization utilities, `search_knowledge_base` tool handler

### Phase 5: Upload Paths + Document Management (Pillar 3 completion)

CoScout panel file attachment, finding comment KB wiring, document preview/download in Knowledge tab.

**Files**: CoScout panel components, finding comment handlers, Knowledge tab list/preview components

### Phase 6: Documentation Updates

Update all affected documentation to reflect ADR-060 changes. Organized by priority.

**Critical (ADR lifecycle):**

- `docs/07-decisions/adr-022-knowledge-layer-architecture.md` — status → "Superseded by ADR-060"
- `docs/07-decisions/adr-026-knowledge-base-sharepoint-first.md` — status → "Superseded by ADR-060", remove "needs new backend" note
- `docs/07-decisions/adr-049-coscout-context-and-memory.md` — add "Extended by ADR-060" note
- `docs/07-decisions/index.md` — add ADR-060 entry, update ADR-022/026 status to Superseded
- Create `docs/07-decisions/adr-060-coscout-intelligence-architecture.md` — formal ADR from design spec

**High (architecture docs — content revisions):**

- `docs/05-technical/architecture/ai-architecture.md` — replace Azure AI Search diagram with Foundry IQ, update Layer 2 description
- `docs/05-technical/architecture/ai-journey-integration.md` — Layer 4: "Remote SharePoint" → "Foundry IQ unified index"
- `docs/05-technical/architecture/ai-context-engineering.md` — add Pillar 1 fields (problemStatement, focusedQuestionId, outcomes), position-aware ordering, updated token estimates
- `docs/03-features/workflows/knowledge-base-search.md` — full rewrite: data sources, admin setup, Foundry IQ backend

**Medium (product docs):**

- `docs/08-products/feature-parity.md` — KB status "Deferred" → "Beta (ADR-060)"
- `docs/08-products/azure/blob-storage-sync.md` — add `documents/` + `investigation/` to storage structure
- `docs/08-products/azure/arm-template.md` — update resource table (AI Search for Foundry IQ), remove stale Graph scope references

**Low (specs & routing):**

- `docs/superpowers/specs/index.md` — add new spec entry
- `docs/superpowers/specs/2026-04-02-web-first-implementation-design.md` — add ADR-060 cross-reference to §4
- `docs/superpowers/specs/2026-03-19-knowledge-base-folder-search-design.md` — add "Superseded by ADR-060" update callout
- `docs/superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md` — add "Extended by ADR-060" note
- `CLAUDE.md` — add AI knowledge architecture row to task→doc mapping table
- `docs/03-features/workflows/question-driven-investigation.md` — note about mode-aware completion + answer_question tool

## Verification

### Unit Tests

- `buildAIContext` returns enriched findings, problem statement, outcomes, focused question
- `KnowledgeAdapter` interface contract tests (index, search, remove, list)
- `answer_question` tool handler creates correct proposal
- Yamazumi question generator called when `mode === 'yamazumi'`
- Performance channel ranking generates mode-appropriate questions
- Evidence sorting uses correct metric per mode

### Integration Tests

- File upload → Blob Storage → Foundry IQ indexed → searchable via `search_knowledge_base`
- Finding create → serialized to Blob → indexed → searchable
- Question answered → serialized to Blob → indexed → searchable
- ProjectId filter correctly scopes results to authorized projects
- Beta gate prevents access when `isPreviewEnabled('knowledge-base')` is false

### E2E Verification

- Upload SOP document via Knowledge tab → CoScout cites it in conversation
- Create finding with comments → search returns finding with full detail
- Answer question with document → document appears in Knowledge tab + searchable
- Switch to yamazumi mode → questions show waste/takt focus
- Switch to performance mode → questions show channel ranking

## Key Files Reference

| File                                                      | Purpose                                           |
| --------------------------------------------------------- | ------------------------------------------------- |
| `packages/core/src/ai/types.ts`                           | AIContext interface (Pillar 1 changes)            |
| `packages/core/src/ai/prompts/coScout.ts`                 | System prompt, tools, context rendering           |
| `apps/azure/src/features/ai/useAIOrchestration.ts`        | Context assembly orchestration                    |
| `apps/azure/src/features/ai/readToolHandlers.ts`          | Tool handler implementations                      |
| `packages/hooks/src/useQuestionGeneration.ts`             | Question pipeline (Pillar 5)                      |
| `packages/core/src/yamazumi/questions.ts`                 | Yamazumi question generator (already implemented) |
| `packages/core/src/analysisStrategy.ts`                   | Strategy pattern with questionStrategy            |
| `packages/ui/src/components/ProcessIntelligencePanel/`    | Questions UI (evidence sorting)                   |
| `apps/azure/server.js`                                    | KB endpoints (upload, search, list, delete)       |
| `infra/mainTemplate.json`                                 | ARM template (AI Search + embedding deployment)   |
| `packages/hooks/src/useKnowledgeSearch.ts`                | KB search hook (rewire to Foundry IQ)             |
| `apps/azure/src/services/searchService.ts`                | Search service (replace Foundry IQ client)        |
| `apps/azure/src/components/admin/AdminKnowledgeSetup.tsx` | Admin KB UI (update for Foundry IQ)               |
