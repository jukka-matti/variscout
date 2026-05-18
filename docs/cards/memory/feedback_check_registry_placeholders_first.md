---
title: 'check-registry-placeholders-first'
description: 'Before expanding a spec matrix to fix "missing" cells, check whether registry entries marked `enabled:false` with "Future X" descriptions are intentional placeholders rather than bugs. Amend the spec, don''t grow the implementation.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: b2d446f3-2832-4671-8701-d919d7fc03c1
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_check_registry_placeholders_first.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a retrospective flags "spec promised N cells, code ships M < N," **don't immediately reach for expansion**. Run `git log --follow -p` on the registry definition and inspect the original commit:

- If entries shipped with `enabled: false` AND descriptions explicitly labeling them as "Future X lens" / "Future Y mode" / "Coming in V2" — these are **intentional V2 placeholders**, not bugs. Spec was over-promised at original ship.
- If entries shipped fully enabled AND were later toggled off — those ARE bugs; expand path is correct.

**Why:** Specs frequently aspire to the full surface area while implementations ship incrementally. The placeholder pattern (registry stub + `enabled:false` + "Future" label) is a deliberate signal that the cell is reserved for later work, deliberately hidden from users to avoid empty-state UX. Expanding without checking intent silently rewrites the V1/V2 contract.

**How to apply:** Whenever a retrospective or design-vs-code audit identifies cells that "should ship but don't," do this 3-step check before touching code:
1. Find the registry/map/table entry in question.
2. Read its inline description and `enabled` flag.
3. `git log --follow -p` to confirm original intent.

If placeholder: amend the spec to mark cells deferred-V2 + log decision-log entry. If genuine bug: ship the expansion. Concrete precedent: 8f followup HIGH #4 (lens × level matrix) — spec §10 over-promised; `performance` + `yamazumi` lenses were "Future ... lens" placeholders. AMEND path was correct; expand would have rewritten the original ship's V1/V2 split.

Related: [[feedback_honor_vision_commitments]] (don't hedge on locked decisions), [[feedback_check_shipped_patterns_first]] (verify shipped state before re-designing), [[feedback_design_aligned_fixes]] (patch to match intent, not to silence the reviewer).
