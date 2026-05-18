---
title: 'structural-absence-guard-pattern'
description: 'Architecture-test pattern (denylist substring grep) is a tripwire not a wall; implement with read-once cache + per-name regex; branded types are the durable answer when the rule earns it'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 05b4b1838f8830a2
origin-session-id: 68d82568-69c3-42c8-a2b1-5bede1d8483c
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_structural_absence_guard_pattern.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Architecture tests that enforce ADR invariants by structural absence (denylist of forbidden function/identifier names) are **tripwires, not walls**. They catch the obvious case (a contributor — human or LLM-assisted — reaches for `aggregateCpk`) but do not catch creative renamings (`unifiedQualityIndex()` doing the same forbidden math), are substring-grep-not-AST, and are typically per-package scope.

**Why:** When PR B (post-#168) refactored `architecture.noCrossInvestigationAggregation.test.ts` (ADR-073 enforcement), I initially proposed bumping the vitest timeout. User rejected: "i dont want a cheap fix, but to fix the root cause!" Then questioned whether the test pattern itself was load-bearing: "should we consider if the test is actually needed?" The honest answer was: yes (LLM-dev makes the denylist particularly valuable as a tripwire), but the implementation was wasteful (3040 sync reads per run from 16 it() blocks × ~190 files). Refactor + honest docs + propose durable answer.

**How to apply:**
- **Implementation**: read-once cache in `beforeAll` + per-name regex against cached strings. Preserves per-name `it()` granularity for failure reporting. Drops from O(n × forbidden_names) to O(n). Adding name #17 doesn't change cost curve. Canonical example: `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts` post PR #171.
- **Anti-pattern**: re-reading files inside each `it()` block. Causes turbo-concurrent-load flake.
- **Frame honestly**: docstring + investigations.md entry should call out denylist + substring-grep + narrow-scope limits explicitly. Don't let the test read as more enforcement than it is.
- **Durable answer**: type-level enforcement (branded opaque types like `ProcessHubId` at `packages/core/src/processHub.ts`). When the rule earns the engineering investment, propose branded type + typed constructor in a `docs/investigations.md` entry. For Cpk: see [[branded-cpk-type-durable-replacement]] in investigations.md (added by PR #171).
- **Companion docs**: `docs/05-technical/implementation/testing.md` "Architecture Tests (Structural-Absence Guards)" section is the canonical guide. `.claude/rules/testing.md` cross-references it.
- **Two instances in codebase**: this vitest test (ADR-073, 16 forbidden names) + `scripts/check-level-boundaries.sh` (ADR-074, forbidden imports). Same pattern, different implementation.

Related: [[feedback_no_backcompat_clean_architecture]], [[feedback_systemic_before_patching]], [[feedback_contribution_not_causation]].
