---
title: 'CoScout Knowledge Catalyst'
description: 'ADR-049 fully implemented (PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 0e5e2ae5162723ca
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_knowledge_catalyst.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-049 originally proposed conversation persistence, ProcessLearning type, and file paste for CoScout. A 5-perspective evaluation found 9 must-fix issues. Through brainstorming (2026-03-24), the design was fundamentally rethought.

**Key architectural insight:** VariScout's investigation model (findings, hypotheses, synthesis, actions, outcomes) IS the memory system. CoScout receives the full investigation context on every turn. Conversation persistence saves the chat log, not the knowledge.

**Why:** Industry research confirms: Microsoft Copilot stores conversations separately from documents; GitHub Copilot deliberately doesn't persist conversations; Figma Make (only product embedding conversations in project files) sees performance/privacy issues. VariScout takes the strongest position: conversations are ephemeral by design.

**How to apply:** When designing CoScout features, route knowledge through the existing Finding infrastructure rather than creating parallel storage. The investigation model is the single source of truth.

**Revised scope (7 capabilities):**
1. Image paste (`detail: 'auto'`, `store: false`, session-scoped)
2. Get finding attachment tool (bidirectional with image paste)
3. Save insight as finding (bookmark → Finding with `source.type: 'coscout'`)
4. Auto-suggested insights (`suggest_save_finding` tool, INVESTIGATE/IMPROVE)
5. Session-close save prompt (advisory modal)
6. File attachments on finding comments (Team: SharePoint)
7. Token budget 12K with prioritized degradation

**What was eliminated (and why):**
- Conversation persistence — investigation model IS the memory
- ProcessLearning type — insights are findings
- File paste (PDF/DOCX) — KB search handles documents; pdf.js adds CVE risk
- Separate storage layer — no new IndexedDB stores or OneDrive files

**Implementation (PR #34, merged 2026-03-24, 21 commits, 91 files, +4,222/-350 lines):**

Key files created/modified:
- `packages/core/src/ai/imageValidation.ts` — magic byte validation (JPEG/PNG), 2MB limit, `fileToDataUrl`
- `packages/core/src/ai/fileValidation.ts` — PDF/XLSX/CSV/TXT validation, `sanitizeFilename`
- `packages/core/src/ai/budgetContext.ts` — 8-level prioritized degradation, word-count heuristic (1.3x)
- `packages/core/src/ai/prompts/coScout.ts` — insight capture guidance, finding nudge, `buildCoScoutInput` multimodal
- `packages/core/src/ai/responsesApi.ts` — `store: false` when images present
- `packages/core/src/findings/types.ts` — `FindingSource: { chart: 'coscout', messageId }`, `CommentAttachment`
- `packages/ui/src/components/CoScoutPanel/ImagePreview.tsx` — paste/drop thumbnail UI
- `packages/ui/src/components/CoScoutPanel/SaveInsightDialog.tsx` — bookmark → new finding or comment
- `packages/ui/src/components/CoScoutPanel/SessionClosePrompt.tsx` — advisory checklist modal
- `packages/ui/src/components/FindingsLog/FindingComments.tsx` — paperclip file attachment UI
- `apps/azure/src/features/ai/aiStore.ts` — AISessionState tracking (turn count, pending proposals)
- `apps/azure/src/features/ai/useToolHandlers.ts` → `readToolHandlers.ts` (includes `get_finding_attachment`)
- `apps/azure/src/components/editor/EditorDashboardView.tsx` — session-close wiring, image forwarding

Tests: ~80 new tests across budgetContext, imageValidation, fileValidation, promptTemplates, aiStore, ImagePreview, SaveInsightDialog, SessionClosePrompt

Code review fixes (post-PR): handleCoScoutSend image forwarding, BookmarkPlus icon, formatPreview case, addFindingComment return type, get_finding_attachment file support, params.insight_text fallback, handleNavigateToChart coscout guard.
