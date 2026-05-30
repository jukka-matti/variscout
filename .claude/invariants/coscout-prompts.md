---
paths:
  - "packages/core/src/ai/prompts/**"
  - "packages/core/src/ai/actionTools.ts"
  - "packages/core/src/ai/**"
related: [coscout-ax-design]
---

# CoScout prompts — non-negotiables

- **Entry point: `assembleCoScoutPrompt()`** — the sole prompt-assembly entry point (`legacy.ts` deleted 2026-05-30, ADR-068 complete).
- **Every new tool in `tools/registry.ts` declares `phases`** + optional `tier: 'team'`. Ungated tools leak across phases/tiers.
- **REF markers reference chart elements**, never raw data values (ADR-057, customer-owned data).
- **Never "root cause"** — say "contribution" / "suspected cause" / "mechanism" (P5 amended). ESLint `no-root-cause-language` enforces.
- **Tier 1 stays session-invariant** — moving content tier1 ↔ tier3 breaks prompt-cache hit rate.

Detailed architecture + tier model + mode coaching: `packages/core/CLAUDE.md`.

See also: [coscout-ax-design](../../docs/01-vision/coscout-ax-design.md) — canonical AX-design surface (persona, tier-gating, knowledge architecture, safety, eval discipline).
