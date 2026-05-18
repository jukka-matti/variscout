---
title: 'verify-review-claims-against-code'
description: 'Subagent reviewers can misread atomic mutation sequences. When a review flags "code does X" and the fix seems obvious, re-read the actual code path including ordering of store mutations before dispatching a fix subagent.'
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

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_verify_review_claims_against_code.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Subagent reviewers (especially design / spec-compliance ones reading code without running it) can misread atomic sequences of store mutations. They see "the code calls `setLevel('l2')` here" and conclude "the user ends up at L2," missing that a subsequent `setZoom(2.5)` in the same function (or the same React event) runs atomically before the next render — final state may be L3 with empty `focalStepId`.

**Why:** Reviewers reason file-by-file and line-by-line. A multi-line sequence like `setLevel('l2'); setZoom(2.5);` looks like "two actions, both apply" but in React + Zustand it's one synchronous batch, and the next render reflects the final state — which can differ from any individual line's apparent intent. Especially common in canvas / viewport / animation surfaces that thread imperative updates through hooks.

**How to apply:** When a reviewer flags "code does X, spec wants Y" and the fix looks like a one-liner:
1. **Read the call site and any caller** before dispatching a fix subagent.
2. Trace the full sequence of store mutations triggered by the user action.
3. Ask: "after all batched mutations run, what does the next render see?"
4. If the answer matches the spec → reviewer misread; close as resolved-on-reread.
5. If the answer doesn't match → fix is real.

Concrete precedent: 8f followup MEDIUM #10 — reviewer claimed mobile L3 "redirects to L2 + zoom=2.5 instead of step-list." Actual sequence: `setLevel('l2')` then `setZoom(2.5)` then exit handler — but the final state was `currentLevel:'l3', focalStepId:undefined, zoom:2.5` because `setLevel('l2')` and `setZoom` ran atomically and `NoFocalStepPrompt` already rendered the step-list at L3. Implementer correctly closed as "already correct" after re-reading; dispatching a fix subagent without the recheck would have produced spurious code churn.

Related: [[feedback_systemic_before_patching]] (fix root cause not symptom), [[feedback_design_aligned_fixes]] (patch to intent not reviewer), [[feedback_check_shipped_patterns_first]].
