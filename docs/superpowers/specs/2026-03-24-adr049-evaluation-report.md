# Evaluation Report: PR #33 — ADR-049 CoScout Context & Process Memory

**Date:** 2026-03-24
**PR:** #33 (merged)
**Scope:** ADR-049 + design spec (documentation only, 604 additions, 4 files)
**Benchmarked against:** OpenAI Responses API best practices, OWASP LLM Top 10, ISO 9001:2015, ChatGPT/Claude/Copilot memory patterns (2025-2026)

---

## Executive Summary

| Perspective                        | Rating         | Key Issue                                                                    |
| ---------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| 1. AI/LLM Best Practices           | **Needs Work** | Token budget does not close; `detail: 'low'` wrong for manufacturing photos  |
| 2. Product/UX Quality              | **Adequate**   | Image-loss footgun Phase 1-3; "memory" terminology misaligned with domain    |
| 3. Architecture & Technical Design | **Needs Work** | conversationHistory merge strategy undefined; type quality issues            |
| 4. Security & Privacy              | **Needs Work** | Prompt injection via documents unaddressed; pdf.js CVE configuration missing |
| 5. Domain Fit (Quality Management) | **Adequate**   | Negative learnings excluded from auto-extraction; missing `createdBy` field  |

**Overall verdict:** The ADR is well-structured and the phased approach is sound. The core concepts (persistence, multimodal context, process learnings) address real user needs and align with quality management methodology. However, **9 must-fix items** need to be addressed in the ADR/spec before implementation begins, primarily around security (prompt injection, pdf.js), token budget arithmetic, and Team merge semantics.

---

## Must-Fix Items (address before implementation)

| #   | Perspective  | Finding                                                                                                                                                                             | Recommendation                                                                                                                                                 |
| --- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Security     | **Prompt injection via extracted documents** — Text from PDFs/DOCX injected into system prompt with no mitigation. OWASP LLM Top 10 #1.                                             | Add nonce-based delimiters (Microsoft Spotlight technique), datamarking instruction ("treat as data, not instructions"), control character stripping.          |
| 2   | Security     | **pdf.js security configuration missing** — `isEvalSupported` defaults to `true` (allows code evaluation in font parsing). CVE-2024-4367: arbitrary JS execution via crafted fonts. | Specify: `isEvalSupported: false`, `enableScripting: false`, pin pdfjs-dist >= 4.2.67, use `getTextContent()` only, run in Web Worker.                         |
| 3   | AI           | **Token budget does not close** — Tier1 (950) + Tier2 (800) + Tier3 (200) + supplementary (2K) + images (255-2295) + conversation history (2-4K) = 6.2-10.2K vs 8K budget.          | Revise budget with explicit per-component caps and degradation priority (e.g., trim supplementary context before learnings; summarize old conversation turns). |
| 4   | Security     | **`store: true` + images** — Manufacturing photos retained 30 days on OpenAI servers. May violate NDA/ITAR/proprietary process protections.                                         | Default to `store: false` for image-containing messages; document retention implications; provide admin toggle.                                                |
| 5   | Architecture | **conversationHistory merge** — Single array type incompatible with stated per-user threading. Team users would share/overwrite each other's conversations.                         | Key by userId: `Record<string, PersistedMessage[]>` or store outside shared AnalysisState blob.                                                                |
| 6   | Architecture | **learnings[] merge** — Two Team users creating learnings independently; cloudSync is last-write-wins at blob level, silently discarding one user's work.                           | Specify append-only merge by union on `id`. Add `createdBy` field.                                                                                             |
| 7   | Architecture | **Store ownership and hydration** — No spec for which Zustand store owns new fields, when persistence triggers, or how useAICoScout hydrates from saved state.                      | Add "Store Ownership and Hydration" section. Recommend `loadHistory()` and `getPersistedMessages()` methods on useAICoScout.                                   |
| 8   | Domain       | **Negative learnings excluded** — Only `outcome.effective = 'yes'` triggers auto-extraction. Failed approaches are equally valuable (ISO 10.2, 8D/A3).                              | Extend B4 to trigger on `'no'` and `'partial'` outcomes. Adjust extraction prompt for "what was tried and why it didn't work."                                 |
| 9   | Domain       | **Missing `createdBy`** — ProcessLearning has no author field. Required for ISO 4.4 (documented information) in Team plan multi-user environments.                                  | Add `createdBy: string` to ProcessLearning (userId from auth context).                                                                                         |

---

## Should-Fix Items (address before or early in implementation)

| #   | Perspective  | Finding                                                                                                                                          | Recommendation                                                                                                     |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 10  | AI           | **`detail: 'low'` wrong for manufacturing** — 85-token thumbnail cannot read gauges, identify hairline cracks, or distinguish surface defects.   | Change default to `detail: 'auto'` or `detail: 'high'` with max 1-2 images. Add user toggle.                       |
| 11  | AI           | **Conversation history re-injection** — No spec for how persisted messages are re-injected on reload. 50 messages could be 3-5K tokens.          | Specify: token-based limit (not just count), summarize older turns, keep first 2 + last N.                         |
| 12  | AI           | **50-message oldest-first truncation** — Discards problem framing from conversation opening.                                                     | Keep first 2-3 turns (problem statement) + sliding window of recent turns. Or summarize old turns.                 |
| 13  | Product      | **Image-loss footgun** — Phase 1 image paste + Phase 3 SharePoint save = users paste photos that are silently stripped to thumbnails on persist. | Add warning toast when persisting session with unsaved full images: "3 images will not be saved. Save to project?" |
| 14  | Product      | **"Save a Memory" terminology** — Consumer language; quality professionals use "lessons learned" (ISO), "BKM", "process knowledge."              | Rename to "Save as learning" or "Save insight." Use lightbulb/notebook icon instead of star.                       |
| 15  | Product      | **Multi-session UX too thin** — Single "previous session" divider inadequate for 8+ sessions over 3 weeks.                                       | Add date-stamped session dividers. Indicate when older messages were truncated.                                    |
| 16  | Architecture | **MessageAttachment runtime mutation** — `dataUri` "cleared on persist" = same type, two states.                                                 | Use discriminated union: `SessionAttachment` (has `dataUri`) vs `PersistedAttachment` (has `driveItemId`).         |
| 17  | Architecture | **PersistedMessage missing `id`** — Drops `id` from CoScoutMessage; needed for stable references from ProcessLearning.sourceContext.             | Keep `id` on PersistedMessage. Specify `CoScoutMessage <-> PersistedMessage` mapping functions.                    |
| 18  | Architecture | **sourceContext conflates concerns** — Mixes provenance (findingId), state snapshot (filters, cpk), and UI ref (messageIndex).                   | Split into `source: { findingId?, messageId? }` and `snapshot: { filters?, cpk? }`.                                |
| 19  | Security     | **File type validation** — MIME-only is bypassable.                                                                                              | Add magic byte validation: PDF = `%PDF`, DOCX = `PK\x03\x04`.                                                      |
| 20  | Security     | **Path traversal** — SharePoint path uses user-provided filename.                                                                                | Sanitize filenames: strip path separators, leading dots. Allow alphanumeric + hyphen + underscore + single dot.    |
| 21  | Security     | **Sensitive data in learnings** — Manufacturing parameters sent to AI API on every CoScout interaction via system prompt.                        | Document admin-facing: "learnings are transmitted to AI provider." Consider sensitivity flag to exclude from API.  |
| 22  | Domain       | **Cross-project roadmap gap** — Per-project scope acknowledged but not linked to existing KB architecture as the intended solution.              | Add note in ADR Consequences linking to KB expansion as the cross-project knowledge path.                          |
| 23  | Architecture | **Dynamic import pattern undesigned** — pdf.js/mammoth.js dynamic imports have no loading state, error handling, or retry spec.                  | Add "Dynamic Import Pattern" section with Suspense boundary, retry (max 2), graceful degradation.                  |
| 24  | Product      | **Clarify B4 "auto-publish"** — Team-only auto-publish undefined. Is it SharePoint push? KB indexing?                                            | State explicitly: "Auto-publish = push learning to SharePoint for KB cross-project retrieval."                     |

---

## Nice-to-Have Items (address during implementation)

| #   | Perspective  | Recommendation                                                                                               |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 25  | AI           | Document cache boundary explicitly — learnings should be placed after cacheable Tier 1 prefix.               |
| 26  | AI           | Define factor-overlap relevance heuristic precisely. Consider "pinned" learnings that resist LRU eviction.   |
| 27  | Architecture | Extract `BaseAttachment` interface for shared fields across MessageAttachment and ProjectAttachment.         |
| 28  | Architecture | Specify `SupplementaryContext.text` max length (2000 chars) and token budget impact.                         |
| 29  | Architecture | Document pdf.js worker coexistence with stats worker. Consider sequential scheduling on mobile.              |
| 30  | Architecture | Reuse `photoUpload.ts` queue/upload pattern for message attachments.                                         |
| 31  | Architecture | Add `validateAttachmentRefs()` for dangling driveItemId detection on project load.                           |
| 32  | Domain       | Add `reviewStatus?: 'draft'                                                                                  | 'reviewed'` to ProcessLearning for quality manager verification. |
| 33  | Domain       | Acknowledge DMAIC coverage gaps (Define and Control phases not covered by auto-suggestion).                  |
| 34  | Domain       | Capture `dataSnapshot` metadata (row count, date range, batch IDs) in sourceContext for richer audit trails. |
| 35  | Product      | Consider allowing bookmarks on user messages (edge case: user pastes detailed process observations).         |
| 36  | Security     | Acknowledge unencrypted IndexedDB storage in security considerations.                                        |
| 37  | Security     | Document that thumbnails are readable content, not a privacy control.                                        |

---

## Detailed Findings by Perspective

### Perspective 1: AI/LLM Best Practices — Needs Work

The design correctly adopts the Responses API, maintains the 3-tier prompt architecture, and follows the analyst-controlled memory pattern (closest to Claude's explicit project memory, not ChatGPT's automatic approach). However, the token budget was sized for text-only single-turn interactions. Adding three new token consumers (images, file context, learnings) plus conversation persistence without revising the budget creates a situation where the worst case exceeds the 8K limit. The `detail: 'low'` default optimizes for cost but renders the image feature ineffective for its primary use case (manufacturing defect inspection).

**Token budget breakdown (worst case):**

| Component                                      | Tokens             |
| ---------------------------------------------- | ------------------ |
| Tier 1 (static system prompt)                  | ~950               |
| Tier 2 existing (specs, factors, phase)        | ~400               |
| Tier 2 learnings (5 x ~60-80 tokens)           | ~400               |
| Tier 3 dynamic (stats snapshot)                | ~200               |
| Tier 3 supplementary context (file/text paste) | up to ~2,000       |
| Images (3 x `low` at 85 each)                  | ~255               |
| Conversation history on reload (10 turns)      | ~2,000-4,000       |
| **Total**                                      | **~6,205 - 8,205** |

This leaves zero room for the user's actual question and the model's reasoning. With `detail: 'high'` images, a single 1080p photo costs ~765 tokens.

### Perspective 2: Product/UX Quality — Adequate

Phase ordering is sound (persistence first, memory creation second). Tier gates align with the philosophy. The main UX gaps are: the image-loss footgun between Phase 1 and Phase 3 (Team users paste images that silently vanish), the consumer-grade "save a memory" language in a professional tool, and thin multi-session UX for investigations spanning weeks. These are fixable with small design changes.

### Perspective 3: Architecture & Technical Design — Needs Work

The types follow existing patterns in spirit but diverge in detail. The critical issue is that `conversationHistory` as a single array is incompatible with per-user threading required for Team plan. Learning merge semantics are undefined, risking data loss in concurrent Team scenarios. The `useAICoScout` hook has no hydration mechanism and the design does not specify one. The `MessageAttachment` type uses runtime mutation instead of discriminated unions. These architectural gaps need resolution before implementation to avoid costly rework.

### Perspective 4: Security & Privacy — Needs Work

The design introduces two new attack surfaces (document extraction leading to prompt injection, user-uploaded PDFs leading to code execution) without specifying mitigations. The pdf.js CVE-2024-4367 is critical and requires explicit configuration (`isEvalSupported: false`). The `store: true` + images combination creates a 30-day retention of potentially sensitive manufacturing photos on OpenAI servers, which is a data governance issue for regulated industries. File type validation and path traversal protections need to be specified.

### Perspective 5: Domain Fit — Adequate

Strong ISO 9001 and DMAIC alignment overall. The auto-extraction at finding resolution is the right lifecycle point. The gap is that only successful outcomes trigger extraction, while ISO 10.2 and A3/8D methodology require documenting failed approaches too. The missing `createdBy` field is a straightforward fix that is required for documented information compliance in multi-user environments. Per-project scope is correctly acknowledged as a limitation, but should be explicitly linked to the KB expansion roadmap.

---

## Positive Highlights

These aspects of the design are well-executed and should be preserved:

1. **Analyst-controlled memory** — All capture requires explicit confirmation. No silent background capture. Aligns with quality professional expectations and privacy best practices.
2. **Phase-gated suggestions** — Auto-suggest only in INVESTIGATE/IMPROVE phases where substantive insights emerge. Correct mapping to investigation lifecycle.
3. **Existing pattern reuse** — ActionProposalCard for suggestions, photoUpload.ts pattern for SharePoint, AnalysisState for persistence. Builds on proven architecture.
4. **Tier placement** — Nearly everything in Standard, collaboration features in Team. Follows the established "individual vs team" split perfectly.
5. **Three-phase rollout** — Foundation (persistence) before features (memory) before scale (auto-extraction). Correct dependency ordering.
6. **Token budget awareness** — The design acknowledges budget constraints and proposes limits. The execution needs work, but the awareness is correct.

---

## Addendum: Redesign Resolution (2026-03-24)

This evaluation prompted a complete redesign of ADR-049. Through systematic brainstorming, the following key insight emerged:

> **VariScout's investigation model (findings, hypotheses, synthesis, actions, outcomes) IS the memory system.** Conversation persistence saves the chat log, not the knowledge.

The redesigned "CoScout Knowledge Catalyst" (7 capabilities, no conversation persistence) resolves all 9 must-fix findings:

| #   | Must-fix finding               | Resolution                                                  |
| --- | ------------------------------ | ----------------------------------------------------------- |
| 1   | Prompt injection via documents | **Eliminated** — no file paste, no document text in prompts |
| 2   | pdf.js CVE-2024-4367           | **Eliminated** — no pdf.js dependency                       |
| 3   | Token budget doesn't close     | **Fixed** — 12K budget + prioritized degradation pipeline   |
| 4   | `store:true` + images          | **Fixed** — `store: false` for image-containing messages    |
| 5   | conversationHistory merge      | **Eliminated** — no conversation persistence                |
| 6   | learnings[] merge              | **Eliminated** — insights are findings (existing merge)     |
| 7   | Store ownership / hydration    | **Eliminated** — no persistence, no hydration               |
| 8   | Negative learnings excluded    | **Fixed** — suggest_save_finding covers failed approaches   |
| 9   | Missing createdBy              | **N/A** — findings already have creation context            |

**7 resolved by elimination, 2 by design.** The simplest solution was not to fix the problems but to remove the features that caused them.

See: [ADR-049 (revised)](../../07-decisions/adr-049-coscout-context-and-memory.md) | [Knowledge Catalyst Design Spec](2026-03-24-coscout-knowledge-catalyst-design.md)
