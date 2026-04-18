---
paths:
  - "packages/core/src/ai/prompts/**"
  - "packages/core/src/ai/actionTools.ts"
  - "packages/core/src/ai/**"
---

# CoScout prompt code — editing invariants

- **Entry point**: `assembleCoScoutPrompt()` (tier1 / tier2 / tier3 structure). Do not call the deprecated `buildCoScoutSystemPrompt()` in `coScout/legacy.ts`.
- **25-tool registry**: gating is by phase × mode × tier. New tools must declare all three.
- **Mode-aware methodology**: coaching varies per analysis mode (standard / capability / yamazumi / performance / defect / process-flow). Use the strategy pattern in `@variscout/core/strategy`.
- **Visual grounding markers (ADR-057)**: REF tokens reference chart elements by ID, never raw data rows.
- **Never use "root cause"** in prompts, messages, or tool descriptions — use "contribution" (P5 amended). ESLint rule `no-root-cause-language` is enforced.
- **Never interpret interactions as "moderator/primary"** — use geometric terms (ordinal / disordinal). ESLint rule `no-interaction-moderator` is enforced.

Reference: `.claude/skills/editing-coscout-prompts/SKILL.md`, `docs/07-decisions/adr-068-coscout-cognitive-redesign.md`.
