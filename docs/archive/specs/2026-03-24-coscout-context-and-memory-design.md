# Design: CoScout Conversation Context & Process Memory

## Context

Two complementary gaps limit CoScout's effectiveness as an investigation partner:

1. **Context poverty** — Users cannot share visual or documentary evidence (gemba photos, SOP excerpts, error logs, competitor charts) with CoScout. They must describe everything in text, losing precision.

2. **Amnesia** — CoScout conversations are session-only (`useState` in `useAICoScout`). Close the browser, lose the conversation. More fundamentally, process learnings discovered during investigations exist only as implicit knowledge in findings and synthesis fields — CoScout cannot reference them proactively.

Quality professionals expect AI assistants to accumulate context like a human colleague would. After investigating nozzle clogging on Machine A in January, the analyst expects CoScout to recall that experience when similar patterns appear in March. Today, every session starts from zero.

### What exists today

| Mechanism                             | Scope         | Persistence                  | AI-accessible              |
| ------------------------------------- | ------------- | ---------------------------- | -------------------------- |
| `ProcessContext.synthesis`            | Per-project   | AnalysisState blob           | Yes (Tier 2 context)       |
| Finding outcomes (cpkBefore/cpkAfter) | Per-project   | AnalysisState blob           | Partially (summary counts) |
| Hypothesis tree + validation          | Per-project   | AnalysisState blob           | Yes (Tier 2 context)       |
| Published scouting reports            | Cross-project | SharePoint + Azure AI Search | Yes (on-demand KB search)  |
| CoScout conversations                 | Session       | React state only             | N/A (ephemeral)            |

### Gap analysis

| Need                                  | Current state                 | Impact                                                |
| ------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| Share visual evidence                 | Not possible                  | Analyst describes defect photos in text — imprecise   |
| Share document excerpts               | Not possible                  | Must summarize SOPs/emails manually                   |
| Resume conversation after page reload | Lost                          | Investigation continuity broken                       |
| Reference past learnings              | Only via KB (Team, on-demand) | CoScout cannot proactively reference prior experience |
| Save key insights from conversation   | Manual finding creation only  | Valuable insights buried in ephemeral chat            |

---

## Design Decisions

- **Per-project memory** — Learnings stored in `AnalysisState.learnings[]`, scoped to the project. Cross-project memory deferred to future work (likely via Knowledge Base expansion, not a new system).
- **Analyst-controlled capture** — All memory creation requires explicit analyst action (bookmark or confirm auto-suggestion). No silent background capture. Aligns with "analyst in control" principle (ADR-019).
- **Multimodal via Responses API** — Image support leverages existing GPT-5.4-mini vision capabilities. No custom image processing infrastructure needed.
- **Session-first, persist later** — Pasted files/images are session-scoped by default. Optional "Save to project" for Team plan SharePoint storage. Keeps Standard plan simple.
- **Token-budget aware** — All new context (learnings, pasted text, attachments) operates within CoScout's existing ~8K token budget. Relevance filtering ensures the most useful context fits.
- **Phase-gated memory suggestions** — Auto-suggest "save a learning" only in INVESTIGATE and IMPROVE phases where substantive process insights emerge.

---

## Theme A: Conversation Context Enrichment

### A1: Image/Photo Paste in CoScout

Users paste or drop images (gemba photos, screenshots, external charts) into the CoScout chat input. The image is sent as a base64 content part alongside the text message.

**UX flow:**

```
User pastes image (Ctrl+V or drag-and-drop)
  → Thumbnail preview appears below input field
  → User adds optional text: "Is this nozzle wear pattern typical?"
  → Send → Image + text sent as multimodal input to Responses API
  → CoScout responds with visual analysis
  → Image displayed inline in conversation history
```

**Architecture:**

```typescript
// Extend CoScoutMessage to support attachments
interface CoScoutMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: MessageAttachment[]; // NEW
  // ...existing fields
}

interface MessageAttachment {
  type: 'image' | 'file';
  mimeType: string;
  name?: string;
  // For images: base64 data URI (session) or OneDrive URL (persisted)
  dataUri?: string; // Session-scoped, cleared on persist to save space
  driveItemId?: string; // After "Save to project" (Team plan)
  thumbnailUri?: string; // Small preview, safe to persist in AnalysisState
}
```

**Responses API integration:**

```typescript
// In responsesApi.ts — extend input building
function buildMultimodalInput(text: string, attachments?: MessageAttachment[]) {
  if (!attachments?.length) return text;
  return [
    ...attachments
      .filter(a => a.type === 'image')
      .map(a => ({
        type: 'input_image' as const,
        image_url: a.dataUri,
        detail: 'low' as const, // Cost-efficient for quality photos
      })),
    { type: 'input_text' as const, text },
  ];
}
```

**Constraints:**

- Max 3 images per message (token budget)
- Max 2MB per image (base64 in memory)
- `detail: 'low'` by default (85 tokens/image); user can expand to `'high'` for detailed inspection
- Images not persisted by default — session-only until "Save to project" (A3)

**Tier**: Standard (AI processing) + Team (SharePoint save via A3)

### A2: Text/File Paste as Context

Users paste text blocks or attach small files (PDF, CSV, TXT, DOCX) as supplementary context. Text is extracted client-side and injected into the CoScout system prompt.

**UX flow:**

```
User clicks 📎 or pastes multi-line text (>3 lines triggers context mode)
  → "Add as context" chip appears: [📄 SOP-4521.pdf (2 pages)] [✕]
  → Context badge persists across messages in the session
  → User asks: "Does our SOP cover this failure mode?"
  → CoScout sees the SOP text in its system prompt
```

**Architecture:**

```typescript
// New field in CoScout input building
interface SupplementaryContext {
  label: string; // Display name (filename or "Pasted text")
  text: string; // Extracted content (truncated to ~2K tokens)
  addedAt: number; // Timestamp
}

// In buildCoScoutInput() — inject as Tier 3 (Dynamic) context
function buildSupplementaryContextBlock(contexts: SupplementaryContext[]): string {
  if (!contexts.length) return '';
  return contexts.map(c => `[Supplementary context: ${c.label}]\n${c.text}`).join('\n\n');
}
```

**File handling (client-side only):**

- **TXT/CSV**: Direct `FileReader.readAsText()`
- **PDF**: `pdf.js` text extraction (already a Vite-compatible library)
- **DOCX**: `mammoth.js` for text extraction
- Token limit: 2K tokens max per context block (truncated with "... [truncated]" marker)
- Multiple contexts allowed (up to 3), total budget ~4K tokens within the 8K CoScout budget

**Tier**: Standard | **Complexity**: S

### A3: Save Attachments to SharePoint

"Save to project" button on conversation attachments. Uploads to the project's SharePoint folder and stores a reference in `AnalysisState`.

**Architecture:**

- Follows `photoUpload.ts` pattern: Graph token → resolve drive path → upload to `/VariScout/Attachments/{projectId}/{filename}`
- Offline: queued in `photoQueue` table (already in IndexedDB schema)
- Reference: `AnalysisState.attachments?: ProjectAttachment[]`
- Saved attachments become searchable via Knowledge Base (already indexes SharePoint)

```typescript
interface ProjectAttachment {
  id: string;
  name: string;
  mimeType: string;
  driveItemId: string;
  thumbnailUri?: string; // Small preview for inline display
  sourceContext?: {
    messageIndex?: number; // Which conversation message
    findingId?: string; // If linked to a finding
  };
  createdAt: number;
  createdBy?: string;
}
```

**Tier**: Team only | **Complexity**: M | **Dependencies**: A1 or A2

---

## Theme B: Conversation Memory

### B1: Conversation History Persistence

Persist CoScout conversation history as part of the project's `AnalysisState`.

**Architecture:**

```typescript
// Extend AnalysisState
interface AnalysisState {
  // ...existing fields
  conversationHistory?: PersistedMessage[]; // NEW
}

// Lightweight persistence format (strip base64 images, keep thumbnails)
interface PersistedMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{
    type: string;
    name?: string;
    thumbnailUri?: string;
    driveItemId?: string;
  }>;
  timestamp: number;
  bookmarked?: boolean;
}
```

**Hydration flow:**

```
Project opens → load AnalysisState → extract conversationHistory
  → useAICoScout({ initialMessages: history })
  → Display past messages (read-only styling for pre-session messages)
  → New messages appended normally
  → On save → serialize messages back to AnalysisState (debounced)
```

**Key decisions:**

- **Server-side chain expires** — `previous_response_id` from past sessions is stale. On reload, CoScout starts a fresh API chain but the UI shows history. The full `buildCoScoutInput()` context ensures continuity without relying on server-side history.
- **Max 50 messages persisted** — oldest trimmed on save. Quality investigations rarely produce 50+ meaningful exchanges.
- **Images stripped** — Only `thumbnailUri` persisted (tiny). Full images require A3 (SharePoint save) for persistence.
- **Pre-session messages styled differently** — dimmed or with a "Previous session" divider, so the user knows the conversation boundary.

**Tier**: Standard (IndexedDB) + Team (OneDrive sync) | **Complexity**: M

### B2: "Save a Memory" — Process Learning Capture

Bookmark icon on CoScout assistant messages. Creates a structured `ProcessLearning` record.

**UX flow:**

```
CoScout says: "Machine A's nozzle clogging correlates with lot changes
from Supplier B — η² = 0.34, suggesting 34% of variation explained."

User clicks ⭐ bookmark icon on that message
  → Quick editor slides in:
    Text: [pre-filled from message, editable]
    Tags: [auto-suggested: "nozzle", "Machine A", "Supplier B"]
    Factors: [Machine, Supplier] (auto-detected from active filters)
  → User clicks "Save learning"
  → Toast: "Process learning saved"
  → ⭐ icon stays filled (visual indicator)
```

**Architecture:**

```typescript
interface ProcessLearning {
  id: string;
  text: string; // Analyst-approved summary
  factors?: string[]; // Associated factor columns
  tags?: string[]; // Free-form categorization
  sourceContext: {
    findingId?: string; // If linked to a finding
    filters?: Record<string, string[]>; // Filters active at capture
    cpk?: number; // Cpk at time of insight
    messageIndex?: number; // Source conversation message
  };
  createdAt: number;
  autoExtracted?: boolean; // From B4 (auto-extraction)
}

// Stored in AnalysisState
interface AnalysisState {
  // ...existing fields
  learnings?: ProcessLearning[]; // NEW
}
```

**AI context injection (C1):**

```typescript
// In buildAIContext() — Tier 2 (Semi-static) layer
function buildLearningsContext(learnings: ProcessLearning[]): string {
  if (!learnings?.length) return '';
  const relevant = learnings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5); // Max 5 most recent
  return `Process learnings from this investigation:\n${relevant
    .map(l => `- ${l.text}${l.factors?.length ? ` [factors: ${l.factors.join(', ')}]` : ''}`)
    .join('\n')}`;
}
```

**Tier**: Standard | **Complexity**: M | **Dependencies**: None (enhanced by B1)

### B3: Auto-Suggested Insights from Conversation

New CoScout tool `suggest_save_insight`. After substantive exchanges, CoScout proactively suggests saving a learning.

**Tool definition:**

```typescript
{
  name: 'suggest_save_insight',
  description: 'Suggest saving a reusable process learning from the conversation.',
  parameters: {
    type: 'object',
    properties: {
      insight_text: { type: 'string', description: 'Concise process learning (1-2 sentences)' },
      suggested_tags: { type: 'array', items: { type: 'string' } },
      reasoning: { type: 'string', description: 'Why this is worth remembering' },
    },
    required: ['insight_text', 'reasoning'],
    additionalProperties: false,
  },
}
```

**Behavior:**

- Phase-gated: INVESTIGATE and IMPROVE only
- Renders as `ActionProposalCard` (existing pattern) — analyst can edit text before confirming
- System prompt instruction: "When you identify reusable process knowledge (a pattern, a validated cause-effect relationship, or an effective improvement approach), use `suggest_save_insight` to propose saving it."
- Deduplication: check similarity against existing learnings before suggesting

**Tier**: Standard | **Complexity**: S | **Dependencies**: Requires B2 (ProcessLearning store)

### B4: Auto-Extracted Learnings from Resolved Findings

When a finding reaches "resolved" with `outcome.effective = 'yes'`, auto-generate a structured learning summary.

**Trigger point:**

```typescript
// In useFindings, after updateStatus('resolved')
if (finding.outcome?.effective === 'yes') {
  const learning = await extractLearning(finding, aiContext);
  // Present for review (not auto-saved)
  showLearningReviewModal(learning);
}
```

**Extraction prompt (fast tier, nano):**

```
Summarize this resolved quality investigation finding in 1-2 sentences
as a reusable process learning. Include the cause, the action taken,
and the measured improvement.

Finding: {finding.text}
Suspected cause: {suspectedCause}
Actions: {actions}
Cpk: {cpkBefore} → {cpkAfter}
```

**Tier**: Standard (local) + Team (auto-publish to SharePoint reports) | **Complexity**: S | **Dependencies**: Requires B2 type

---

## Theme C: Learning-Aware CoScout Context

### C1: Per-Project Learning Injection

Inject accumulated learnings into CoScout's system prompt so it can reference past experience.

**Prompt engineering:**

```
## Process learnings from this investigation

These are verified insights the analyst has saved during this analysis.
Reference them when relevant — they represent confirmed process knowledge.

- Nozzle clogging on Machine A correlates with lot changes from Supplier B (η²=0.34)
  [factors: Machine, Supplier]
- Shift changeover adds 12 minutes average cycle time, primarily wait time
  [factors: Shift, Operator]
```

**Token budget:** ~200-400 tokens in Tier 2 (Semi-static). Refreshed when learnings change. Max 5 entries, most recent first. If more than 5 exist, relevance-score by overlap between learning factors and current active filters.

**Tier**: Standard | **Complexity**: S | **Dependencies**: Requires B2

---

## Roadmap

### Phase 1: Foundation (Weeks 1-3)

| Option | Description                | Complexity |
| ------ | -------------------------- | ---------- |
| **B1** | Conversation persistence   | M          |
| **A2** | Text/file paste as context | S          |
| **A1** | Image paste in CoScout     | M          |

**Rationale:** B1 is the highest-impact single improvement — conversations surviving page reload is table stakes. A2 and A1 round out the "richer context" story.

### Phase 2: Memory System (Weeks 4-7)

| Option | Description              | Complexity |
| ------ | ------------------------ | ---------- |
| **B2** | "Save a memory"          | M          |
| **B3** | Auto-suggested insights  | S          |
| **C1** | Learning-aware prompting | S          |

**Rationale:** B2 is the core memory primitive. B3 makes it frictionless. C1 closes the loop so CoScout actually uses the learnings.

### Phase 3: Scale & Polish (Weeks 8-11)

| Option | Description                    | Complexity |
| ------ | ------------------------------ | ---------- |
| **B4** | Auto-extracted learnings       | S          |
| **A3** | Save attachments to SharePoint | M          |

**Rationale:** B4 automates knowledge capture from the existing finding lifecycle. A3 completes the evidence chain for Team plan ISO traceability.

### Dependency graph

```
A1 (Image) ──────────────> A3 (Save to SharePoint)
A2 (Text Paste) ─────────> A3

B1 (Persistence) [standalone foundation]

B2 ("Save a Memory") ───> B3 (Auto-Suggest, needs store)
                        ──> B4 (needs ProcessLearning type)
                        ──> C1 (Learning-Aware Prompting)
```

---

## Tier placement summary

| Feature                       | Standard (€79/mo) | Team (€199/mo)  |
| ----------------------------- | ----------------- | --------------- |
| Conversation persistence (B1) | IndexedDB         | + OneDrive sync |
| Image paste (A1)              | Yes               | Yes             |
| Text/file paste (A2)          | Yes               | Yes             |
| "Save a memory" (B2)          | Yes               | Yes             |
| Auto-suggested insights (B3)  | Yes               | Yes             |
| Learning-aware prompting (C1) | Project-local     | Project-local   |
| Auto-extracted learnings (B4) | Yes               | + Auto-publish  |
| Save attachments (A3)         | —                 | Team only       |

---

## Key files for implementation

| File                                                           | Changes                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/core/src/ai/types.ts`                                | `MessageAttachment`, `ProcessLearning`, `SupplementaryContext` types |
| `packages/hooks/src/types.ts`                                  | Extend `AnalysisState` with `conversationHistory`, `learnings`       |
| `packages/hooks/src/useAICoScout.ts`                           | `initialMessages` hydration, persistence callbacks                   |
| `packages/core/src/ai/responsesApi.ts`                         | Multimodal content part support                                      |
| `packages/core/src/ai/prompts/coScout.ts`                      | Learning context block, supplementary context block                  |
| `packages/core/src/ai/buildAIContext.ts`                       | New `learnings` field in AIContext                                   |
| `packages/core/src/ai/actionTools.ts`                          | `suggest_save_insight` tool definition                               |
| `packages/ui/src/components/CoScoutPanel/CoScoutPanelBase.tsx` | Paste handler, file drop, attachment preview                         |
| `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`  | Bookmark icon, attachment rendering, pre-session divider             |
| `apps/azure/src/features/ai/aiStore.ts`                        | Learning state, conversation persistence bridge                      |
| `apps/azure/src/services/photoUpload.ts`                       | Pattern to follow for A3 attachment uploads                          |

---

## Open questions

1. **Conversation history and three-way merge** — If two Team users chat with CoScout on the same project, how do conversation histories merge? Options: (a) per-user conversation threads, (b) merged timeline, (c) last-writer-wins. Recommendation: (a) per-user, keyed by `userId`.

2. **Learning quality over time** — As learnings accumulate, older ones may become stale (process changed, equipment replaced). Should learnings have an expiry or "still valid?" periodic prompt?

3. **PDF extraction library** — `pdf.js` adds ~300KB to the bundle. Worth it for A2, or gate behind dynamic import? Recommendation: dynamic import, loaded on first use.

4. **Image detail level** — `detail: 'low'` (85 tokens) vs `'high'` (765 tokens per tile). Default to low with an "Enhance" button? Or let the model auto-detect?
