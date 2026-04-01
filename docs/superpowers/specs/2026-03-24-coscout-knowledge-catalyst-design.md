---
title: 'Design: CoScout Knowledge Catalyst'
status: draft
---

# Design: CoScout Knowledge Catalyst

**Date:** 2026-03-24
**Status:** Draft
**Replaces:** `2026-03-24-coscout-context-and-memory-design.md` (previous approach)
**Related ADRs:** ADR-019, ADR-026, ADR-029, ADR-041, ADR-047, ADR-049

---

## Key Insight

VariScout's investigation model **is** the memory system. Every CoScout conversation already receives the full investigation context on every turn: findings, hypotheses, synthesis, actions, outcomes, staged comparison data, Knowledge Base results, and process context. Conversation persistence saves the chat log, not the knowledge.

If CoScout actively captures insights into findings during conversations, there is nothing to lose when the session ends. The investigation model is the durable layer. The conversation is the ephemeral catalyst.

---

## Design Principles

| Principle                           | Implication                                              |
| ----------------------------------- | -------------------------------------------------------- |
| No new data types                   | Insights route through existing `Finding` infrastructure |
| No new storage layers               | No IndexedDB stores, no OneDrive conversation files      |
| No new dependencies                 | No pdf.js, no mammoth.js                                 |
| Conversations are ephemeral         | The investigation model is the memory                    |
| Knowledge capture, not chat capture | Save the insight, not the transcript                     |
| Analyst in control                  | All capture requires explicit analyst action             |

---

## What Exists Today

### Context Pipeline

CoScout receives structured context on every turn via `buildAIContext()` and the 3-tier prompt architecture:

| Mechanism                                                   | Scope         | Persistence                  | AI-accessible                  |
| ----------------------------------------------------------- | ------------- | ---------------------------- | ------------------------------ |
| `ProcessContext` (description, problemStatement, synthesis) | Per-project   | AnalysisState blob           | Yes (Tier 2 context)           |
| Findings with status, comments, tags                        | Per-project   | AnalysisState blob           | Yes (summary in Tier 2)        |
| Hypothesis tree with validation status                      | Per-project   | AnalysisState blob           | Yes (full tree in Tier 2)      |
| Actions with owners, due dates, completion                  | Per-project   | AnalysisState blob           | Yes (progress in Tier 2)       |
| Finding outcomes (cpkBefore/cpkAfter)                       | Per-project   | AnalysisState blob           | Yes (in investigation context) |
| Staged comparison deltas                                    | Per-project   | AnalysisState blob           | Yes (Tier 3 dynamic)           |
| Published scouting reports                                  | Cross-project | SharePoint + Azure AI Search | Yes (on-demand KB search)      |
| CoScout conversations                                       | Session       | React state only             | N/A (ephemeral)                |

### Existing CoScout Tools (ADR-029)

**Read tools (6):** `get_chart_data`, `get_statistical_summary`, `suggest_knowledge_search`, `get_available_factors`, `compare_categories`, `search_project`

**Action tools (10):** `apply_filter`, `clear_filters`, `switch_factor`, `create_finding`, `create_hypothesis`, `suggest_action`, `suggest_improvement_idea`, `share_finding`, `publish_report`, `notify_action_owners`, `navigate_to`

### Existing UI Touchpoints

- **NarrativeBar** — Dashboard-level AI summary with quick-ask
- **CoScoutPanel** — Full conversation interface (slide-in/popout)
- **DashboardSummaryCard** — AI summary on Project Dashboard
- **ActionProposalCard** — Inline confirmation cards for action tool proposals
- **ProjectStatusCard** — "Welcome back" context on Project Dashboard
- **WhatsNewSection** — Changes-since-last-visit summary

---

## AI Memory Maturity Model

| Level   | Name                   | Description                                             | Status                                |
| ------- | ---------------------- | ------------------------------------------------------- | ------------------------------------- |
| **0**   | Stateless              | No memory across sessions                               | Current baseline                      |
| **0.5** | Investigation-grounded | Full investigation model in every prompt                | **Current (already built)**           |
| **1**   | Persistent Dialogue    | Chat logs saved and replayed                            | **NOT pursued** (see rationale below) |
| **2**   | Curated Knowledge      | Active insight capture into durable investigation model | **This design**                       |
| **3**   | Autonomous Learning    | Cross-project extraction, pattern libraries             | Future (via KB expansion)             |

---

## Why Not Conversation Persistence

The investigation model already captures the substance of every conversation:

- `ProcessContext.problemStatement` and `synthesis` capture the framing and conclusions
- `Finding` entries with status, comments, and tags capture observations
- Hypothesis tree with validation captures the analytical reasoning
- Actions with owners and outcomes capture the decisions
- Knowledge Base results persist cross-project learnings

Conversation persistence saves the **transcript**, not the **knowledge**. The existing Project Dashboard (`ProjectStatusCard`, `WhatsNewSection`, `DashboardSummaryCard`) provides the "welcome back" experience without replaying old chat turns.

### Industry Research Findings

| Product               | Memory Approach                                    | Outcome                                                                              |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Microsoft Copilot** | Per-user Exchange mailbox, separate from documents | Works at enterprise scale but couples to Exchange infrastructure                     |
| **GitHub Copilot**    | Deliberately ephemeral                             | Persistence is the top feature request but remains unbuilt; custom instructions only |
| **Cursor**            | Had "Memories" feature, removed it                 | Only `.cursor/rules` persists; automatic memory proved unreliable                    |
| **Windsurf**          | Structured memories/rules only                     | Explicit capture, not automatic extraction                                           |
| **Figma Make**        | Conversations embedded in project files            | Users report performance issues and privacy concerns with embedded chat history      |

The pattern across the industry: automatic memory extraction is unreliable, embedded chat history creates performance and privacy problems, and structured explicit capture (rules, instructions, curated entries) is the approach that works. This aligns with routing insights through VariScout's existing Finding infrastructure.

---

## Capability 1: Image Paste

Allow users to paste or drag-drop images into the CoScout input field for visual discussion.

### UX Flow

```
User pastes image (Ctrl+V) or drags file into input
  -> Thumbnail preview appears below input field (max 120px height)
  -> User types optional text: "Is this nozzle wear pattern typical?"
  -> Send -> Image + text sent as multimodal content to Responses API
  -> CoScout responds with visual analysis
  -> Image displayed inline in conversation (thumbnail)
  -> "Save to finding" button appears on messages containing images
```

### Constraints

| Constraint             | Value            | Rationale                                                                                                                     |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Max images per message | 2                | Token budget (auto detail = 85-765 tokens/image)                                                                              |
| Max file size          | 2 MB             | Reasonable for photos; prevents accidental large file paste                                                                   |
| Accepted formats       | JPEG, PNG        | Magic byte validation (FFD8FF for JPEG, 89504E47 for PNG)                                                                     |
| Vision detail          | `detail: 'auto'` | Model decides resolution; `detail: 'low'` is insufficient for manufacturing photos (gauges, hairline cracks, surface defects) |
| API storage            | `store: false`   | Manufacturing photos must not be retained 30 days on OpenAI servers (NDA/ITAR/proprietary)                                    |
| Lifecycle              | Session-scoped   | Images live in memory only; cleared on panel close or navigation                                                              |

### "Save to Finding" Flow

When a conversation includes images, each message with image content shows a camera icon button. Clicking it:

1. Opens the existing Finding creation dialog (reuse `create_finding` proposal card pattern)
2. Pre-populates finding text from the assistant's image analysis
3. For **Team plan**: uses existing `photoUpload.ts` to upload the full-resolution image to OneDrive (`/VariScout/Photos/{analysisId}/{findingId}/`)
4. For **Standard plan**: stores a local object URL reference on the finding comment (session-scoped; image persists only if the browser session is active)

This reuses the existing `usePhotoComments` hook and `processPhoto()` utility (EXIF stripping, thumbnail generation).

### Technical Implementation

The Responses API request includes image content parts:

```typescript
// In useAICoScout — build multimodal input
const input = [
  {
    role: 'user',
    content: [
      { type: 'input_text', text: userMessage },
      ...images.map(img => ({
        type: 'input_image',
        image_url: img.dataUrl, // base64 data URL
        detail: 'auto',
      })),
    ],
  },
];
```

The `store: false` flag is set on the `ResponsesApiRequest` when any message in the conversation contains image content:

```typescript
const request: ResponsesApiRequest = {
  input,
  store: hasImages ? false : true, // Disable server retention for image sessions
  // ... other fields
};
```

### Validation

Magic byte validation occurs before preview render:

```typescript
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
};

function validateImageFile(file: File): boolean {
  // Check magic bytes from first 4 bytes of ArrayBuffer
  // Reject if no match (prevents renamed .exe, etc.)
}
```

---

## Capability 2: Retrieve Finding Attachments (New Tool)

A new read tool that lets CoScout access photos and file metadata already attached to findings.

### Tool Definition

```typescript
{
  type: 'function',
  name: 'get_finding_attachment',
  description:
    'Retrieve photos and file metadata attached to a finding\'s comments. ' +
    'Returns thumbnail URLs (session-scoped) and metadata. ' +
    'Use when the analyst references a finding photo or asks to compare visual evidence.',
  parameters: {
    type: 'object',
    properties: {
      finding_id: {
        type: 'string',
        description: 'ID of the finding to retrieve attachments from',
      },
    },
    required: ['finding_id'],
    additionalProperties: false,
    strict: true,
  },
}
```

### Phase Gating

Always available (not phase-gated). Photos on findings are read-only context.

### Tool Handler Return

```typescript
interface FindingAttachmentResult {
  findingId: string;
  findingText: string;
  attachments: Array<{
    type: 'photo' | 'file';
    filename: string;
    commentText: string;
    commentDate: string;
    /** Base64 thumbnail for photos (session-scoped, from IndexedDB or OneDrive) */
    thumbnailDataUrl?: string;
    /** File metadata only — no content extraction */
    fileSizeBytes?: number;
    mimeType?: string;
  }>;
}
```

### Bidirectional Flow

This creates a bidirectional loop between CoScout conversations and the finding system:

```
Paste image -> Discuss with CoScout -> Save insight as finding (with photo)
                                            |
                                            v
Reopen project -> CoScout reads finding -> get_finding_attachment -> Discuss photo
```

---

## Capability 3: Save Insight as Finding

Allow the analyst to bookmark any CoScout message and save it as a finding or comment.

### No New Types

Insights saved from CoScout are standard `Finding` objects. The only distinction is the `source` field:

```typescript
// Extend FindingSource union (packages/core/src/findings/types.ts)
export type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string }
  | { chart: 'ichart'; anchorX: number; anchorY: number }
  | { chart: 'yamazumi'; category: string; activityType?: string }
  | { chart: 'coscout'; messageId: string }; // NEW
```

### UX: Bookmark Icon

Every CoScout message (user and assistant) gains a bookmark icon (persistent, not hover-only). Clicking it opens a quick dialog:

```
+----------------------------------------------+
|  Save Insight                                 |
|                                               |
|  [Pre-filled text from message, editable]     |
|                                               |
|  ( ) Save as new finding                      |
|  ( ) Add as comment to finding: [dropdown]    |
|  ( ) Add as comment to hypothesis: [dropdown] |
|                                               |
|  [Cancel]                    [Save]           |
+----------------------------------------------+
```

**Defaults:**

- Assistant messages default to "Save as new finding"
- User messages default to "Add as comment to existing finding" (if findings exist)
- If the message references a specific finding/hypothesis (from focus context), pre-select it

**Terminology:** "Save" verb, "Insight" noun. No "memory" language.

### Integration with Existing Tools

CoScout can already propose findings via `create_finding` and hypotheses via `create_hypothesis`. The bookmark icon is the manual complement to those AI-initiated proposals. Both paths produce the same `Finding` type.

---

## Capability 4: Auto-Suggested Insights (New Tool)

A new action tool that lets CoScout proactively propose saving an insight.

### Tool Definition

```typescript
{
  type: 'function',
  name: 'suggest_save_finding',
  description:
    'Proactively suggest saving a key insight as a finding. Use when the conversation ' +
    'reveals a significant process observation, a validated hypothesis conclusion, ' +
    'or a negative learning (approach tried and found ineffective). ' +
    'The analyst sees a confirmation card and can edit before saving.',
  parameters: {
    type: 'object',
    properties: {
      insight_text: {
        type: 'string',
        description:
          'Concise insight text, e.g., "Nozzle 3 shows 2x variation of other nozzles — ' +
          'cleaning frequency is the likely root cause (eta-squared 0.42)"',
      },
      reasoning: {
        type: 'string',
        description:
          'Why this insight is worth saving — helps analyst decide. ' +
          'E.g., "This explains 42% of total variation and directly informs the improvement plan."',
      },
      suggested_hypothesis_id: {
        type: ['string', 'null'],
        description:
          'If the insight relates to a specific hypothesis, provide its ID to link them. Null otherwise.',
      },
    },
    required: ['insight_text', 'reasoning', 'suggested_hypothesis_id'],
    additionalProperties: false,
    strict: true,
  },
}
```

### Phase Gating

Available in **INVESTIGATE** and **IMPROVE** phases only. These are the phases where substantive process insights emerge.

| Phase       | Available |
| ----------- | --------- |
| FRAME       | No        |
| SCOUT       | No        |
| INVESTIGATE | Yes       |
| IMPROVE     | Yes       |

### Rendering

Renders as `ActionProposalCard` (existing pattern). The card shows:

- Lightbulb icon + "Save insight" label
- `insight_text` as editable content
- `reasoning` as secondary text (non-editable, informational)
- "Apply" creates a new `Finding` with `source: { chart: 'coscout', messageId }`
- "Dismiss" marks the proposal as dismissed (standard `ProposalStatus` flow)

### Prompt Guidance

The system prompt instructs CoScout when to use this tool:

```
Insight capture guidance (INVESTIGATE/IMPROVE phases):
- Use suggest_save_finding when the conversation reveals:
  - A validated hypothesis conclusion (supported or refuted)
  - A quantitative process insight (specific eta-squared, Cpk shift, or defect rate)
  - A negative learning (approach tried and found ineffective — equally valuable)
  - A root cause identification with supporting evidence
  - A cross-factor interaction discovered during drill-down
- Include negative learnings: "Adjusting temperature had no effect on variation
  (eta-squared < 0.01)" is as valuable as positive findings.
- Do NOT suggest saving generic observations or restating what's already in findings.
- Limit to 1-2 suggestions per conversation to avoid prompt fatigue.
```

### ActionToolName Extension

```typescript
export type ActionToolName =
  | 'apply_filter'
  | 'clear_filters'
  | 'switch_factor'
  | 'create_hypothesis'
  | 'create_finding'
  | 'suggest_action'
  | 'suggest_improvement_idea'
  | 'suggest_save_finding' // NEW
  | 'share_finding'
  | 'publish_report'
  | 'notify_action_owners'
  | 'navigate_to';
```

---

## Capability 5: Session-Close Save Prompt

A lightweight prompt when the analyst closes a CoScout session that may contain unsaved insights.

### Trigger Conditions

The prompt appears when **any** of these are true:

1. CoScout used `suggest_save_finding` and at least one proposal is still `pending`
2. The analyst bookmarked a message but did not complete the save
3. The conversation exceeds 5 turns and no findings were created during the session

### Trigger Events

- CoScout panel close (X button or slide-away)
- Page navigation away from the analysis
- Browser `beforeunload` (best-effort, limited by browser restrictions)

### UI

```
+----------------------------------------------+
|  Save insights before closing?                |
|                                               |
|  [ ] "Nozzle 3 shows 2x variation..."        |
|  [ ] "Temperature adjustment ineffective..."  |
|                                               |
|  [Close without saving]     [Save selected]   |
+----------------------------------------------+
```

The checklist items come from:

1. Pending `suggest_save_finding` proposals (pre-checked)
2. Bookmarked but unsaved messages (pre-checked)

### Behavior

- **Advisory, not blocking** — the analyst can always close without saving
- "Save selected" creates findings for checked items in bulk
- "Close without saving" dismisses the modal and closes the panel
- If no trigger conditions are met, the panel closes silently (no prompt)

### State Tracking

The `aiStore` tracks session engagement:

```typescript
interface AISessionState {
  /** Count of suggest_save_finding proposals in this session */
  pendingSaveProposals: number;
  /** Message IDs bookmarked but not yet saved */
  unsavedBookmarks: string[];
  /** Total conversation turns this session */
  turnCount: number;
  /** Whether any findings were created via CoScout tools this session */
  findingsCreatedThisSession: boolean;
}
```

---

## Capability 6: File Attachments on Finding Comments (Team)

Extend finding comments to support file attachments beyond photos.

### Supported File Types

| Type       | Extensions | Magic Bytes       | Max Size |
| ---------- | ---------- | ----------------- | -------- |
| Image      | .jpg, .png | FFD8FF / 89504E47 | 2 MB     |
| PDF        | .pdf       | 25504446 (`%PDF`) | 10 MB    |
| Excel      | .xlsx      | 504B0304 (`PK`)   | 10 MB    |
| CSV        | .csv       | N/A (text)        | 5 MB     |
| Plain text | .txt       | N/A (text)        | 1 MB     |

### Upload Pattern

Reuses the existing `photoUpload.ts` pattern:

```
OneDrive path: /VariScout/Attachments/{analysisId}/{findingId}/{filename}
```

The existing `PhotoUploadResult` interface generalizes to `AttachmentUploadResult`:

```typescript
interface AttachmentUploadResult {
  driveItemId: string;
  webUrl?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}
```

### CoScout Access

The `get_finding_attachment` tool (Capability 2) returns metadata for all attachment types. CoScout sees the filename, size, MIME type, and the comment text — but **not** the file content. There is no text extraction. The analyst describes the file content in conversation if needed.

### Tier Placement

| Feature                       | Standard           | Team                    |
| ----------------------------- | ------------------ | ----------------------- |
| Image attachments (local ref) | Yes                | Yes                     |
| Image upload to OneDrive      | No                 | Yes                     |
| Non-image file attachments    | No                 | Yes (SharePoint upload) |
| `get_finding_attachment` tool | Yes (local photos) | Yes (all types)         |

### No Text Extraction

Files are stored and retrieved, not parsed. This eliminates:

- pdf.js dependency and its CVE surface (CVE-2024-4367)
- mammoth.js dependency
- Prompt injection via extracted document text (OWASP LLM Top 10 #1)
- Token budget pressure from injected document content

The analyst provides context about file contents in their own words, which naturally filters for relevance.

---

## Capability 7: Token Budget Upgrade

Increase the CoScout context budget and add structured degradation.

### Budget: 8K to 12K

The current 8K budget was sized for text-only interactions. With image tokens (85-765 per image at `detail: 'auto'`) and richer investigation context, 12K provides headroom.

### Token Budget Allocation

| Priority | Component                                          | Typical   | Max       | Notes                                   |
| -------- | -------------------------------------------------- | --------- | --------- | --------------------------------------- |
| P0       | System instructions (static prefix)                | 950       | 950       | Cacheable (>1024 tokens)                |
| P1       | Mode + methodology coaching                        | 200       | 300       | From `getStrategy().aiToolSet`          |
| P2       | Tool definitions                                   | 400       | 600       | Phase-gated subset                      |
| P3       | Process context + specs + factors                  | 300       | 500       | Tier 2 semi-static                      |
| P4       | Investigation context (findings, hypotheses, tree) | 400       | 800       | Tier 2, scales with project             |
| P5       | CoScout-sourced finding nudge                      | 100       | 200       | New (see below)                         |
| P6       | Stats + violations + staged comparison             | 200       | 400       | Tier 3 dynamic                          |
| P7       | Images (0-2 at `detail: 'auto'`)                   | 0         | 1530      | 765 tokens max per image                |
| P8       | Current session turns (sliding window)             | 1500      | 3000      | Newest turns preserved                  |
|          | **Total typical**                                  | **~4050** |           |                                         |
|          | **Total max (worst case)**                         |           | **~8280** | Well within 12K                         |
|          | **Headroom**                                       |           | **~3720** | For KB results, glossary, focus context |

### Prioritized Degradation

When the assembled context exceeds 12K tokens (estimated via word-count heuristic at 1.3 tokens/word), components are trimmed in reverse priority order:

| Trim Level | Action                                           | Tokens Freed |
| ---------- | ------------------------------------------------ | ------------ |
| 1          | Trim older session turns (keep first 2 + last 3) | ~1000-2000   |
| 2          | Truncate investigation context to summary counts | ~400         |
| 3          | Remove glossary fragment                         | ~200         |
| 4          | Remove Knowledge Base results                    | ~300         |
| 5          | Remove staged comparison details                 | ~200         |
| 6          | Summarize findings to count + key drivers only   | ~200         |
| 7          | Remove focus context                             | ~100         |
| 8          | Reduce system instructions to minimal variant    | ~300         |

### budgetContext() Function

```typescript
// packages/core/src/ai/budgetContext.ts

interface BudgetResult {
  /** Assembled context within budget */
  context: string;
  /** Components that were trimmed */
  trimmedComponents: string[];
  /** Estimated token count */
  estimatedTokens: number;
}

function budgetContext(components: ContextComponent[], maxTokens: number = 12000): BudgetResult {
  // Word-count heuristic: tokens ≈ words × 1.3
  // Assemble in priority order, trim from bottom when over budget
}
```

### CoScout-Sourced Finding Nudge

A new ~100-200 token context block injected at P5 priority. When the current project contains findings with `source.chart === 'coscout'`, a brief nudge is added:

```
Previous CoScout insights saved as findings:
- "Nozzle 3 shows 2x variation" (investigating, linked to H-002)
- "Temperature adjustment ineffective" (analyzed, tagged low-impact)
Build on these — don't repeat them.
```

This gives CoScout awareness of its own prior contributions without replaying conversation history.

---

## How Evaluation Findings Are Resolved

The [evaluation report](2026-03-24-adr049-evaluation-report.md) identified 9 must-fix items in the previous design. This design resolves all of them:

| #   | Finding                                   | Resolution                                                                                                |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Prompt injection via extracted documents  | **Eliminated** — no file text extraction, no pdf.js, no document content in prompts                       |
| 2   | pdf.js CVE (CVE-2024-4367)                | **Eliminated** — no pdf.js dependency                                                                     |
| 3   | Token budget does not close               | **Fixed** — 12K budget with 8-level prioritized degradation and `budgetContext()` function                |
| 4   | `store: true` + images (30-day retention) | **Fixed** — `store: false` for all image-containing messages                                              |
| 5   | conversationHistory merge strategy        | **Eliminated** — no conversation persistence, no merge problem                                            |
| 6   | learnings[] merge (last-write-wins)       | **Eliminated** — insights saved as findings, which already have merge-safe IDs                            |
| 7   | Store ownership and hydration             | **Eliminated** — no new stores, no new persistence fields                                                 |
| 8   | Negative learnings excluded               | **Fixed** — `suggest_save_finding` explicitly covers failed approaches                                    |
| 9   | Missing `createdBy` field                 | **N/A** — findings already carry context (creation timestamp, investigation status, comments with author) |

### Additional Evaluation Items Resolved

| #   | Finding                                    | Resolution                                                                                     |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 10  | `detail: 'low'` wrong for manufacturing    | **Fixed** — `detail: 'auto'` (model decides, 85-765 tokens)                                    |
| 11  | Conversation history re-injection          | **Eliminated** — no persistence                                                                |
| 12  | 50-message oldest-first truncation         | **Eliminated** — no persistence                                                                |
| 13  | Image-loss footgun (paste now, lose later) | **Eliminated** — images are session-scoped; "Save to finding" is the explicit persistence path |
| 14  | "Save a Memory" terminology                | **Fixed** — "Save insight" terminology                                                         |
| 16  | MessageAttachment runtime mutation         | **Eliminated** — no attachment persistence type needed                                         |
| 19  | File type validation (MIME-only bypass)    | **Fixed** — magic byte validation for all file types                                           |
| 21  | Sensitive data in learnings                | **Eliminated** — no automatic extraction to AI-transmitted learnings                           |

---

## Security Mitigations

| Threat                             | Mitigation                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Image data retention on AI servers | `store: false` for all image-containing messages                                                               |
| Prompt injection via file content  | No file text extraction — files stored and retrieved, never injected into prompts                              |
| Malicious file upload              | Magic byte validation for all accepted types (JPEG, PNG, PDF, XLSX, CSV, TXT)                                  |
| pdf.js CVE surface                 | No pdf.js dependency                                                                                           |
| mammoth.js supply chain            | No mammoth.js dependency                                                                                       |
| Filename path traversal            | Sanitize filenames: strip path separators, leading dots; allow alphanumeric + hyphen + underscore + single dot |
| Image session leakage              | Images exist only in JavaScript memory; cleared on panel close, navigation, or page unload                     |
| Over-sharing via attachments       | File attachments on findings are Team-only (SharePoint, governed by existing OneDrive permissions)             |

---

## Key Files to Modify

### Core Package (`packages/core/`)

| File                        | Change                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/findings/types.ts`     | Extend `FindingSource` union with `{ chart: 'coscout'; messageId: string }`                                                                                        |
| `src/ai/actionTools.ts`     | Add `'suggest_save_finding'` to `ActionToolName`, add `parseActionMarkers` support                                                                                 |
| `src/ai/prompts/coScout.ts` | Add `suggest_save_finding` tool definition, add `get_finding_attachment` tool definition, add insight capture guidance to system prompt, update phase gating table |
| `src/ai/responsesApi.ts`    | Support multimodal `input_image` content parts, conditional `store: false`                                                                                         |
| `src/ai/budgetContext.ts`   | **New file** — token budget estimation and prioritized degradation                                                                                                 |
| `src/ai/types.ts`           | Extend `CoScoutMessage` with optional `images?: ImageAttachment[]`                                                                                                 |

### UI Package (`packages/ui/`)

| File                                                 | Change                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/CoScoutPanel/CoScoutMessages.tsx`    | Inline image thumbnails, bookmark icon on each message                  |
| `src/components/CoScoutPanel/ActionProposalCard.tsx` | Add `suggest_save_finding` to `TOOL_CONFIG` (lightbulb icon, editable)  |
| `src/components/CoScoutPanel/ImagePreview.tsx`       | **New file** — thumbnail preview below input (max 120px, remove button) |
| `src/components/CoScoutPanel/SaveInsightDialog.tsx`  | **New file** — quick dialog for bookmark-to-finding flow                |
| `src/components/CoScoutPanel/SessionClosePrompt.tsx` | **New file** — checklist modal for unsaved insights                     |

### Hooks Package (`packages/hooks/`)

| File                  | Change                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `src/useAICoScout.ts` | Image paste handling, `store: false` logic, session engagement tracking |

### Azure App (`apps/azure/`)

| File                            | Change                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `src/features/ai/aiStore.ts`    | Add `AISessionState` fields (pendingSaveProposals, unsavedBookmarks, turnCount)   |
| `src/features/ai/wiring.ts`     | Wire `get_finding_attachment` tool handler, wire `suggest_save_finding` execution |
| `src/hooks/usePhotoComments.ts` | Generalize to support non-photo attachments (Team only)                           |
| `src/services/photoUpload.ts`   | Generalize upload path for non-photo file types                                   |

### Existing Patterns to Reuse

| Pattern                   | Source                                                           | Reuse                                                 |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `ActionProposalCard`      | `packages/ui/src/components/CoScoutPanel/ActionProposalCard.tsx` | Render `suggest_save_finding` proposals               |
| `parseActionMarkers()`    | `packages/core/src/ai/actionTools.ts`                            | Parse `[ACTION:suggest_save_finding:{...}]` markers   |
| `photoUpload.ts`          | `apps/azure/src/services/photoUpload.ts`                         | Upload images/files from findings to OneDrive         |
| `usePhotoComments`        | `apps/azure/src/hooks/usePhotoComments.ts`                       | Photo processing pipeline (EXIF strip, thumbnail)     |
| `processPhoto()`          | `apps/azure/src/utils/photoProcessing.ts`                        | Image preprocessing before upload                     |
| `createPhotoAttachment()` | `@variscout/core`                                                | Photo attachment factory                              |
| `FindingSource`           | `packages/core/src/findings/types.ts`                            | Discriminated union for source tracking               |
| `buildCoScoutTools()`     | `packages/core/src/ai/prompts/coScout.ts`                        | Phase-gated tool registration                         |
| Proposal pattern          | ADR-029                                                          | Tool computes preview, renders card, analyst confirms |

---

## Tier Placement

| Capability                              | Free (PWA)  | Standard           | Team                   |
| --------------------------------------- | ----------- | ------------------ | ---------------------- |
| 1. Image paste in CoScout               | N/A (no AI) | Yes                | Yes                    |
| 2. `get_finding_attachment` tool        | N/A         | Yes (local photos) | Yes (all types)        |
| 3. Save insight as finding (bookmark)   | N/A         | Yes                | Yes                    |
| 4. `suggest_save_finding` tool          | N/A         | Yes                | Yes                    |
| 5. Session-close save prompt            | N/A         | Yes                | Yes                    |
| 6. File attachments on finding comments | N/A         | Images (local ref) | All types (SharePoint) |
| 7. Token budget upgrade (12K)           | N/A         | Yes                | Yes                    |

All CoScout capabilities require an AI endpoint (Standard or Team). The only Team-exclusive aspect is SharePoint file storage for non-image attachments.

---

## Out of Scope

| Item                                      | Why                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Conversation persistence**              | Investigation model is the memory; chat transcripts are ephemeral catalysts                                  |
| **ProcessLearning type**                  | Insights saved as standard `Finding` entries (no new type)                                                   |
| **File paste (PDF/DOCX text extraction)** | Eliminates pdf.js CVE, mammoth.js dependency, prompt injection vector, and token budget pressure             |
| **SupplementaryContext type**             | No supplementary context block needed; images go directly to API, insights go to findings                    |
| **Separate storage layer**                | No new IndexedDB tables or OneDrive conversation files                                                       |
| **Auto-extraction from outcomes**         | Manual + tool-suggested capture only; automatic extraction proved unreliable in industry (Cursor removed it) |
| **Cross-project memory**                  | Deferred to Knowledge Base expansion (ADR-026); per-project scope only                                       |
| **Conversation search / history browser** | No persisted conversations to search                                                                         |

---

## Implementation Sequence

### Phase 1: Foundation (capabilities 3, 4, 7)

Highest value, lowest risk. No new UI paradigms — extends existing patterns.

1. Extend `FindingSource` with `coscout` variant
2. Add `suggest_save_finding` tool definition and prompt guidance
3. Add `suggest_save_finding` to `ActionProposalCard` config
4. Implement `budgetContext()` with 12K budget and degradation
5. Add CoScout-sourced finding nudge to context pipeline
6. Add bookmark icon to `CoScoutMessages`
7. Build `SaveInsightDialog`

### Phase 2: Multimodal (capabilities 1, 2)

Image support with careful session scoping.

1. Add image paste/drop handling to CoScout input
2. Build `ImagePreview` component
3. Implement multimodal content parts in Responses API client
4. Add `store: false` conditional logic
5. Add `get_finding_attachment` tool definition and handler
6. Wire "Save to finding" for images via existing photo pipeline

### Phase 3: Session Intelligence (capability 5)

Session-close prompt once insight capture is proven useful.

1. Add `AISessionState` tracking to `aiStore`
2. Build `SessionClosePrompt` component
3. Wire trigger conditions to panel close and navigation events

### Phase 4: File Attachments (capability 6)

Team-only enhancement, extends existing upload infrastructure.

1. Generalize `photoUpload.ts` for non-image file types
2. Add magic byte validation for PDF, XLSX, CSV, TXT
3. Extend finding comment UI with file attachment button
4. Update `get_finding_attachment` handler to return file metadata

---

## Success Metrics

| Metric                  | Measurement                                                             | Target                                                     |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Insight capture rate    | Findings created via CoScout (bookmark + tool) / total CoScout sessions | > 15% of sessions produce a finding                        |
| Nudge effectiveness     | Sessions where CoScout references prior CoScout-sourced findings        | > 30% of returning sessions                                |
| Image usage             | Sessions with at least one image paste                                  | > 10% of sessions (when manufacturing photos are relevant) |
| Session-close save rate | Insights saved via session-close prompt / prompts shown                 | > 25%                                                      |
| Token budget health     | Sessions hitting degradation level 3+                                   | < 5%                                                       |
