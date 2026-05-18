---
title: 'Use ADR-defined terminology everywhere'
description: 'When ADRs define specific terms, use them consistently in ALL docs — "contextually correct" is not enough'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_terminology_consistency.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When ADRs establish specific terminology, use that terminology consistently throughout all documentation — even in places where the old term is "contextually correct."

**Why:** The user explicitly corrected the assumption that terminology issues could be skipped because they were "contextually acceptable." Their response: terms that "would make everything better if we edit them to reflect the real concepts and principles we have just defined." Defined terminology must be enforced everywhere.

**How to apply:** After establishing new terminology through ADRs or positioning, grep for ALL uses of old terms across docs/ and update systematically. Don't rationalize leaving old terms in place — if the new term exists, use it. Key examples:
1. "structured investigation for process improvement" not "lightweight variation analysis tool" (Positioning Bible, Apr 2026)
2. "question" not "hypothesis" in user-facing docs (ADR-053)
3. "Issue Statement" (input) vs "Problem Statement" (output) (ADR-053)
4. Full positioning audit completed Apr 2 2026 — 21 files aligned. See `project_doc_audit_apr2.md`.
