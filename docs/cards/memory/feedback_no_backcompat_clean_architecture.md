---
title: 'No backward-compatibility constraints — clean architecture wins'
description: 'Don''t hedge designs with optional props or fallback paths to preserve old call sites. Required-by-default contracts, exhaustive types, single-purpose components — refactor existing consumers to match.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: ba75bc5c74116779
origin-session-id: efb5d588-ee52-4005-996f-a8f1d0dca016
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_no_backcompat_clean_architecture.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When designing or refactoring internal package APIs (across `@variscout/core`, `@variscout/ui`, `@variscout/hooks`, `@variscout/stores`, `apps/*`), do **not** optimize for backward compatibility. Optimize for clean architecture, strict types, and single-purpose contracts. Refactor existing call sites to match the new shape — internal consumers are not external customers.

**Why:** During Phase 2 V2 brainstorming (2026-04-27), I proposed making new `ProcessHubCurrentStatePanel` props (response-path actions, evidence aggregation) optional so the existing PR #97 consumer could keep working without changes. The user pushed back: *"we dont need backward compatability! but clean architecture following good coding and architectural practises. just as a principle for now!"* VariScout is pre-production with one Azure consumer per panel; preserving "old behavior" through optional props pollutes the contract, scatters nullable branches through the component code, and weakens the type-system guarantees. The cleaner design makes new props required, refactors the existing consumer to pass them, and keeps each component contract crisp.

**How to apply:**
- Default to **required props** for new behavior. Don't reach for `?:` to spare existing call sites.
- Use **exhaustive discriminated unions** for state/intent shapes; let `assertNever` catch missing branches at compile time.
- Move product-domain semantics (e.g. `ResponsePathAction` discrimination) into `@variscout/core`; keep app-layer adapters thin (e.g. `actionToHref` in apps/azure).
- When introducing a new contract, **update every call site in the same PR** rather than gating with optionality. Per-package vitest + `pnpm --filter @variscout/ui build` catch any missed consumer.
- Skip the "back-compat regression test" — there is no old behavior to regress.
- This principle holds **internally** across the monorepo. External APIs (e.g. saved-project file format, public Azure surface contracts that customers depend on, ADR-defined storage schemas) still need migration thinking. The boundary: in-process TypeScript imports = no back-compat; serialized data crossing time = back-compat.
- "For now" caveat: revisit when VariScout has external integrators consuming the packages directly. Until then, this principle stands.
