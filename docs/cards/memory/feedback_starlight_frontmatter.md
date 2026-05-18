---
title: 'Starlight docs require YAML frontmatter'
description: 'All .md files in apps/docs/src/content/docs/ must have YAML frontmatter with at least title field or Astro build fails'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_starlight_frontmatter.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Every `.md` file in `apps/docs/src/content/docs/` MUST have YAML frontmatter with at least a `title:` field. Without it, the Astro Starlight build fails with `InvalidContentEntryDataError`.

**Why:** Starlight content collection schema requires `title`. ADR-057/058/059/060 and 3 plan docs were added without frontmatter, breaking `pnpm docs:build` silently (the docs build wasn't being run regularly).

**How to apply:** When adding new docs to the Starlight site, always include frontmatter:
```yaml
---
title: 'Document Title'
---
```
ADR docs use the extended pattern: `title`, `audience`, `category`, `status`. Also check sidebar slugs in `apps/docs/astro.config.mjs` — renamed/deleted docs leave stale references.
