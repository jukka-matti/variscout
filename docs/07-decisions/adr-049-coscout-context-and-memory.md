---
title: 'ADR-049: CoScout Knowledge Catalyst — Visual Context & Active Insight Capture'
---

# ADR-049: CoScout Knowledge Catalyst — Visual Context & Active Insight Capture

**Status:** Accepted
**Date:** 2026-03-24

## Context

CoScout conversations are session-only — closing the browser loses everything. The initial design (PR #33) proposed conversation persistence, process memory (`ProcessLearning` type), and multimodal file/image paste.

A 5-perspective evaluation (AI practices, UX, architecture, security, domain fit) identified 9 must-fix issues: prompt injection via document text, pdf.js CVE risk, token budget overflow, `store:true` image retention, Team merge conflicts, undefined store ownership, and missing negative learnings.

Through systematic brainstorming, we discovered a fundamental insight: **VariScout's investigation model (findings, questions/hypotheses, synthesis, actions, outcomes) already serves as CoScout's durable memory.** Every session, CoScout receives the full question/investigation context via `buildCoScoutInput()`. Conversation persistence saves the chat log, not the knowledge.

Industry research validated this direction:

- Microsoft Copilot stores conversations in per-user Exchange mailboxes, separate from documents
- GitHub Copilot deliberately does not persist conversations (top community request, unbuilt)
- Figma Make is the only product embedding conversations in project files — users report performance degradation and privacy concerns

**Conclusion:** Instead of persisting conversations, make CoScout better at capturing knowledge into the existing investigation model during conversations.

### Related decisions

- ADR-019: AI Integration (ProcessContext with issueStatement, factor roles, phase-aware coaching)
- ADR-026: Knowledge Base (SharePoint + Azure AI Search for Team plan)
- ADR-029: AI Action Tools (proposal pattern, phase gating)
- ADR-041: Zustand Feature Stores (aiStore for AI state)
- ADR-047: Analysis Mode Strategy (mode-aware coaching hints)

## Decision

Seven capabilities that enhance CoScout's knowledge capture without persisting conversations:

**1. Image Paste** — Paste/drop images into CoScout. `detail: 'auto'`, `store: false` for privacy. Max 2 images per message. Session-scoped. Save to finding via existing photoUpload pattern.

**2. Retrieve Finding Attachments** — New `get_finding_attachment` tool. CoScout retrieves and analyzes photos/files on findings. Bidirectional flow with image paste.

**3. Save Insight as Finding** — Bookmark any CoScout message → creates a Finding with `source: { chart: 'coscout', messageId }`. Quick dialog for "new finding" or "comment on existing." No new data type.

**4. Auto-Suggested Insights** — New `suggest_save_finding` tool. CoScout proactively proposes saving insights as findings. Phase-gated to INVESTIGATE/IMPROVE. Renders as ActionProposalCard. Includes negative learnings (failed approaches, per ISO 10.2).

**5. Session-Close Save Prompt** — Advisory modal on panel/page close when unsaved insights exist. Checklist of key observations. One-click dismiss.

**6. File Attachments on Finding Comments** — Finding comments support file attachments (images, PDF, Excel, CSV). Team: SharePoint upload via photoUpload. Standard: local reference. CoScout sees metadata via get_finding_attachment. No text extraction.

**7. Token Budget Upgrade** — 8K → 12K with prioritized degradation pipeline. 8 priority levels. `budgetContext()` trims from bottom up. CoScout-sourced finding nudge adds ~100-200 tokens.

### Scope boundaries

- **No conversation persistence** — The investigation model IS the memory
- **No ProcessLearning type** — Insights are findings
- **No file paste into CoScout** — KB search handles document context
- **No pdf.js/mammoth.js** — No new dependencies, no CVE risk
- **No separate storage layer** — No new IndexedDB stores or OneDrive files

### Tier placement

| Feature                      | Standard  | Team         |
| ---------------------------- | --------- | ------------ |
| Image paste                  | Yes       | Yes          |
| Save image to finding        | Local ref | + SharePoint |
| Get finding attachment       | Yes       | Yes          |
| Save insight as finding      | Yes       | Yes (shared) |
| Auto-suggested insights      | Yes       | Yes          |
| Session-close save prompt    | Yes       | Yes          |
| File attachments on comments | Local     | + SharePoint |
| Token budget 12K             | Yes       | Yes          |

## Consequences

### Positive

- All 9 must-fix evaluation findings resolved (7 by elimination, 2 by design)
- Zero new data types — insights use existing Finding infrastructure
- Zero new storage layers — no merge complexity added
- Zero new dependencies — no bundle size impact
- Knowledge capture happens during the natural investigation flow, not as a separate activity
- Visual evidence (gemba photos, screenshots) enriches AI reasoning
- File attachments on findings create documentary evidence chain for compliance

### Negative

- No conversation history across sessions — users start fresh each time they open CoScout
- Session-close save prompt adds a modal interruption (mitigated: advisory, one-click dismiss)
- Token budget increase (12K) raises per-request cost ~50% (mitigated: degradation pipeline ensures efficient usage)
- `store: false` for images means those messages can't participate in Responses API server-side chains (mitigated: context rebuild on each turn already works)

## Implementation

Design spec: [2026-03-24-coscout-knowledge-catalyst-design.md](../superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md)

### Key files

- `packages/core/src/ai/types.ts` — MessageAttachment, FindingSource extension
- `packages/core/src/ai/prompts/coScout.ts` — budgetContext(), new tools, finding nudge
- `packages/core/src/ai/actionTools.ts` — tool type entries
- `packages/core/src/ai/responsesApi.ts` — multimodal content parts
- `packages/ui/src/components/CoScoutPanel/` — paste, bookmark, save-to-finding, close prompt
- `packages/ui/src/components/FindingsWindow/FindingComments.tsx` — file attachments
- `packages/hooks/src/useAICoScout.ts` — multimodal send, insight tracking
- `apps/azure/src/services/photoUpload.ts` — extend for non-image files
