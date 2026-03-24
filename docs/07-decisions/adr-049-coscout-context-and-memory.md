---
title: 'ADR-049: CoScout Conversation Context & Process Memory'
---

# ADR-049: CoScout Conversation Context & Process Memory

**Status:** Draft
**Date:** 2026-03-24

## Context

CoScout conversations are session-only — `useAICoScout` uses `useState`, and closing the browser loses the entire conversation. The Responses API already uses `store: true` with `previous_response_id` for server-side chaining, but VariScout never retrieves past conversations. Additionally, users cannot share visual or documentary evidence (gemba photos, SOP excerpts, competitor charts) with CoScout — they must describe everything in text.

Quality investigations span days or weeks. Analysts expect an AI assistant to remember prior conversations and accumulate process knowledge over time. Today, every session starts from zero.

Two complementary gaps:

1. **Context poverty** — No multimodal or file context in conversations
2. **Amnesia** — No conversation persistence; no structured process memory

### Related decisions

- ADR-019: AI Integration (ProcessContext, factor roles, phase-aware coaching)
- ADR-026: Knowledge Base (SharePoint + Azure AI Search for Team plan)
- ADR-029: AI Action Tools (proposal pattern, phase gating)
- ADR-041: Zustand Feature Stores (aiStore for AI state)
- ADR-047: Analysis Mode Strategy (mode-aware coaching hints)

## Decision

### Three incremental capabilities

#### 1. Conversation context enrichment

Allow users to paste images and text/file context into CoScout conversations:

- **Image paste** — Base64 content parts sent via Responses API (GPT-5.4-mini vision). Session-scoped by default. Max 3 images per message, `detail: 'low'` (85 tokens).
- **Text/file paste** — Client-side text extraction (PDF via dynamic `pdf.js` import, DOCX via `mammoth.js`). Injected as Tier 3 (Dynamic) context in `buildCoScoutInput()`. Max ~2K tokens per context block.
- **Save to SharePoint** (Team only) — Optional "Save to project" follows the existing `photoUpload.ts` pattern. Offline-queued via `photoQueue` table.

#### 2. Conversation history persistence

Persist conversation history in `AnalysisState.conversationHistory`:

- Max 50 messages persisted (oldest trimmed)
- Images stripped (only thumbnails kept); full images require SharePoint save
- On reload, fresh Responses API chain started (server-side `previous_response_id` expires). Full `buildCoScoutInput()` context ensures continuity.
- Pre-session messages styled with divider
- Standard: IndexedDB. Team: + OneDrive sync.

#### 3. Process learning capture ("Save a Memory")

New `ProcessLearning` type stored in `AnalysisState.learnings[]`:

```typescript
interface ProcessLearning {
  id: string;
  text: string;
  factors?: string[];
  tags?: string[];
  sourceContext: {
    findingId?: string;
    filters?: Record<string, string[]>;
    cpk?: number;
    messageIndex?: number;
  };
  createdAt: number;
  autoExtracted?: boolean;
}
```

Three capture mechanisms:
- **Manual** — Bookmark icon on assistant messages, quick editor for tags/factors
- **Auto-suggested** — New `suggest_save_insight` CoScout tool (INVESTIGATE/IMPROVE phases). Renders as `ActionProposalCard`.
- **Auto-extracted** — On finding resolution with `outcome.effective = 'yes'`, fast-tier summarization prompt generates a learning for analyst review.

Learnings injected into CoScout system prompt as Tier 2 (Semi-static) context. Max 5 most relevant entries (~200-400 tokens). Relevance scored by factor name overlap with current filters.

### Scope boundaries

- **Per-project memory only** — Learnings stored in `AnalysisState`, not cross-project. Cross-project memory deferred to Knowledge Base expansion.
- **Analyst-controlled** — All memory creation requires explicit confirmation. No silent capture.
- **Token-budget aware** — All new context operates within the existing ~8K CoScout token budget.

### Tier placement

| Feature | Standard | Team |
|---------|----------|------|
| Image paste | Yes | Yes |
| Text/file paste | Yes | Yes |
| Conversation persistence | IndexedDB | + OneDrive sync |
| Process learnings | Yes | Yes |
| Auto-suggested insights | Yes | Yes |
| Save attachments to SharePoint | — | Team only |

## Consequences

### Positive

- Conversations survive page reload — table stakes for professional use
- Visual evidence (gemba photos, external charts) enriches AI reasoning
- Structured process memory creates a knowledge accumulation loop
- Auto-suggested insights reduce friction — learnings captured in flow state
- All features build on existing patterns (AnalysisState persistence, photoUpload, ActionProposalCard)

### Negative

- `AnalysisState` blob grows (~5-15KB for conversation history, ~1-2KB for learnings)
- Three-way merge complexity increases (Team plan concurrent edits). Mitigation: per-user conversation threads.
- Token budget pressure from learnings + supplementary context. Mitigation: strict limits (5 learnings, 2K pasted context).
- `pdf.js` adds ~300KB to bundle. Mitigation: dynamic import on first use.

### Risks

- Learning quality may degrade over time (stale learnings from changed processes). Future: periodic "still valid?" prompts.
- Image detail level (`low` vs `high`) affects both cost and AI reasoning quality. Start with `low`, add "Enhance" option.

## Implementation

Design spec: [2026-03-24-coscout-context-and-memory-design.md](../superpowers/specs/2026-03-24-coscout-context-and-memory-design.md)

### Phase 1: Foundation
- B1: Conversation history persistence
- A2: Text/file paste as context
- A1: Image paste in CoScout

### Phase 2: Memory System
- B2: "Save a Memory" (ProcessLearning capture)
- B3: Auto-suggested insights (CoScout tool)
- C1: Learning-aware CoScout prompting

### Phase 3: Scale
- B4: Auto-extracted learnings from resolved findings
- A3: Save attachments to SharePoint (Team)

### Key files

- `packages/core/src/ai/types.ts` — New types
- `packages/hooks/src/types.ts` — AnalysisState extensions
- `packages/hooks/src/useAICoScout.ts` — Persistence + hydration
- `packages/core/src/ai/responsesApi.ts` — Multimodal input
- `packages/core/src/ai/prompts/coScout.ts` — Learning + context injection
- `packages/core/src/ai/actionTools.ts` — `suggest_save_insight` tool
- `packages/ui/src/components/CoScoutPanel/` — Paste handlers, bookmark UI
