---
title: 'Dependency Overrides & Upgrade Status'
description: '17 pnpm overrides for transitive vulns, major dep versions, CI/CD action pins (Apr 2 2026)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: b602bc4a7640f0c0
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_dependency_overrides.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## Dependency Override Strategy

pnpm `overrides` in root `package.json` pin transitive dependencies to patched versions. This is the Microsoft-recommended approach for transitive vulnerability remediation. Full table in `docs/05-technical/implementation/security-scanning.md`.

**Why:** Transitive deps (lodash via @visx, xmldom via read-excel-file) lag behind security patches. Direct deps haven't released fixes. Overrides force patched versions within compatible semver ranges.

**How to apply:** When adding overrides, always:
1. Verify the dep is actually in the tree: `pnpm --filter <pkg> why <dep>`
2. Document in the security-scanning.md overrides table
3. Run `pnpm audit --audit-level=high` to verify
4. Review quarterly — remove overrides when upstream catches up

## Current Major Dependency Versions (Apr 2 2026)

| Package | Version | Notes |
|---------|---------|-------|
| astro | 6.1.3 | Both docs + website |
| @astrojs/starlight | 0.38.2 | Docs site |
| lucide-react | 1.7.0 | 132 imports, zero renames needed |
| sharp | 0.34.5 | Docs image optimization |
| react / react-dom | 19.2.3 | Must stay matched |
| @visx/* | 3.12.0 | Latest; v4 alpha has React 19 support |
| vitest | 4.1.2 | Test runner |

## Production Overrides (2)

- `lodash@>=4.0.0 → 4.18.1` — @visx chart library transitive. Prototype pollution fix. Will be resolved by @visx v4.
- `@xmldom/xmldom@<0.8.12 → 0.8.12` — read-excel-file transitive. Entity expansion fix.

## CI/CD Action Pins (SHA-pinned)

| Action | Version | SHA |
|--------|---------|-----|
| azure/login | v3.0.0 | 532459ea530d8321f2fb9bb10d1e0bcf23869a43 |
| actions/cache | v5.0.4 | 668228422ae6a00e4ad889ee87cd7109ec5666a7 |
| azure/webapps-deploy | v3.0.7 | 84a80cfe7e9889f35148ed88c307e6e93bf02578 |
| actions/checkout | v6.0.2 | de0fac2e4500dabe0009e67214ff5f5447ce83dd |
| pnpm/action-setup | v4.4.0 | fc06bc1257f339d1d5d8b3a19a8cae5388b55320 |
| actions/setup-node | v6.3.0 | 53b83947a5a98c8d113130e565377fae1a50d02f |

## Deferred Major Upgrades

None remaining — all major upgrades completed Apr 2 2026.
