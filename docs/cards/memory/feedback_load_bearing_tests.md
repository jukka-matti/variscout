---
title: 'feedback_load_bearing_tests'
description: 'Make integration/behavior tests discriminate — a green test that can''t fail for the right reason proves nothing. Add a negative control (a distractor the correct behavior must reject), not just a presence check.'
purpose: remember
tier: card
status: active
date: 2026-06-05
topic: [memory, feedback]
related: []
verified-against-commit: 7712f1edb
last-verified: 2026-06-05
source-hash: b4f1d3edbe82b95e
origin-session-id: ba40152a-6f7e-4293-8f2a-9d88791516dd
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_load_bearing_tests.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When writing or reviewing an integration/behavior test, ask: **could this pass for the wrong reason?** A test that asserts the expected element/value is merely *present* often can't distinguish the real behavior from a degenerate path that produces the same surface.

**Why:** CS-8 (2026-06-03). The per-scope re-rank test rendered `ModelBuilderBand` drilled to one scope and asserted `Machine` was kept. But `Machine` was the ONLY eligible candidate in that scope (the drilled factor was excluded as `constantFactors`) — so a broken band that ignored the scope's rows and just showed every eligible factor would have passed identically. The test proved nothing about re-ranking. The **adversarial final review caught it; the per-task spec+quality review had waved it through** (structurally green ≠ discriminating). Fix: add a junk **`Noise`** candidate the engine must REJECT in the drilled scope, and assert it is NOT kept — now the assertion *requires* real per-scope recomputation.

**How to apply:**
- For "X is selected/computed correctly" tests, put a **negative control** in the same input — a plausible alternative the correct behavior must EXCLUDE — and assert both the inclusion AND the exclusion.
- Sanity-check: "what's the simplest broken implementation that still passes this?" If a no-op or trivial shortcut passes, the test isn't load-bearing.
- This is where the **final adversarial review earns its keep** — a per-task review can pass a test that's green but non-discriminating; the whole-branch reviewer with fresh eyes is more likely to spot it. [[feedback_subagent_grounding_catches_drift]]
- Pairs with deterministic fixtures (no `Math.random`; VariScout core forbids it) so the discrimination is reproducible.
