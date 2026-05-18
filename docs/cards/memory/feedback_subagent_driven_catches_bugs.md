---
title: 'Subagent-driven development reliably catches mid-stream bugs'
description: 'Per-task spec + code reviewer dispatches (superpowers:subagent-driven-development) reliably catch real bugs the implementer missed; trust the protocol, fix what reviewers flag.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 2f64518ad7a2fea4
origin-session-id: efb5d588-ee52-4005-996f-a8f1d0dca016
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_subagent_driven_catches_bugs.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When executing an implementation plan via `superpowers:subagent-driven-development`, dispatch the spec reviewer AND code-quality reviewer per task even when the work feels straightforward. The protocol catches real bugs that compile-clean tests don't see, and the cost of dispatching reviewers is small compared to the cost of those bugs reaching main.

**Why:** During Phase 2 V2 closure execution (2026-04-27), the per-task review discipline caught six real issues that would otherwise have shipped:
1. **`routing/` violated `apps/azure/CLAUDE.md` FSD rule** — moved to `lib/` before merge.
2. **Telemetry `hubId` field actually contained an investigation ID** — ADR-059 PII leak; fixed by passing `rollup.hub.id`.
3. **`Math.random()` in a test fixture** — `packages/core/CLAUDE.md` hard rule violation; replaced with sequential counter.
4. **Missing `@ts-expect-error` compile-time exhaustiveness tests** at 2 boundaries — added.
5. **`assertNever` helper was uncommitted** (only in working dir) — local tests passed, CI would have failed; recovery commit added.
6. **Missing Space-key activation test** + a11y `title` attribute caveat — added.

None of these were caught by `pnpm test` because the failures aren't in the product behavior — they're in code-quality/security/convention compliance. The TDD-passing implementer doesn't notice because they're focused on the test cases at hand. Fresh-context reviewers, prompted to verify against repo conventions and read actual code, do.

**How to apply:**
- For each meaningful unit of work, dispatch implementer → spec reviewer → code-quality reviewer per the skill protocol. Skip combining only when the change is genuinely trivial (≤20 LOC additive, no new files, mirrors a vetted pattern). Even then, do at least a single combined review.
- Trust reviewer findings. If the reviewer flags something with confidence ≥80, dispatch a fix subagent (or fix directly if small) before proceeding to the next task.
- Reviewers occasionally disagree (e.g., one says "include `safeTrackEvent` in useCallback deps", the next says "don't"). When opinions split on stylistic concerns, the protocol's value is in catching the items that *aren't* stylistic.
- Final-PR holistic review (after all tasks complete) catches cross-cutting concerns the per-task reviews miss — ALWAYS dispatch one at the end of a multi-task PR.
- The cost of a fresh subagent dispatch is low (~30s setup). Don't optimize it away.
