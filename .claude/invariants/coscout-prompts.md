---
paths:
  - "packages/core/src/ai/prompts/**"
  - "packages/core/src/ai/actionTools.ts"
  - "packages/core/src/ai/**"
---

# CoScout prompts — non-negotiables

- **Entry point: `assembleCoScoutPrompt()`.** `buildCoScoutSystemPrompt()` in `legacy.ts` is deprecated (test backward-compat only).
- **Every new tool in `tools/registry.ts` declares `phases`** + optional `tier: 'team'`. Ungated tools leak across phases/tiers.
- **REF markers reference chart elements**, never raw data values (ADR-057, customer-owned data).
- **Never "root cause"** — say "contribution" / "suspected cause" / "mechanism" (P5 amended). ESLint `no-root-cause-language` enforces.
- **Tier 1 stays session-invariant** — moving content tier1 ↔ tier3 breaks prompt-cache hit rate.

Detailed architecture + tier model + mode coaching: `packages/core/CLAUDE.md`.
