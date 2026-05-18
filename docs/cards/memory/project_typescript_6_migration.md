---
title: 'TypeScript 6 migration'
description: 'VariScout runs TypeScript 6.0.3 on main since 2026-04-30; what made the migration minimal and what''s still needed for TS 7'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3be9aa9b0b1d6284
origin-session-id: aecc3004-2a4e-4e7e-a02a-20d05d9da9ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_typescript_6_migration.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

TS 6.0.3 is live on main (PR #113 squashed `3fb207da`, 2026-04-30). The migration touched 12 files: 9 `package.json` version bumps + `baseUrl` removal from `apps/pwa/tsconfig.json` and `apps/azure/tsconfig.json` + lockfile.

**Why it was tiny.** `tsconfig.base.json` was already TS 6-shaped (`moduleResolution: Bundler`, `esModuleInterop` true, `strict`, ESNext target/module, no classic resolution, ESM throughout). Per-package configs explicitly set `rootDir: "./src"` so the TS 6 rootDir-default change is a no-op. App tsconfigs already pinned a `types` allowlist so the new `types: []` default doesn't bite. The single TS 6 break in the entire monorepo was `TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0` — fixed by deleting the line (paths resolve relative to the tsconfig directory in TS 5.0+, baseUrl was never needed).

**Why:** TS 6 is Microsoft's explicitly-designed transition release before TS 7 (Go-native rewrite). Doing it pre-Microsoft-review and pre-customer-data avoided a harder 5.9 → 7 jump later, follows the path Microsoft validates, and lands us on the latest compiler when submitting to Microsoft.

**How to apply (TS 7 prep):** When TS 7 lands (target late 2026 / early 2027), our config is already paths-only (no baseUrl), strict, Bundler resolution, ESNext, and ESM throughout — the highest-risk migration items are already done. Recheck peer compat for Vite, Vitest, @typescript-eslint, Astro before bumping. `tsconfig.base.json` doesn't set `types` explicitly; if TS 7 tightens further around ambient types, expect leaf packages may need a `types` allowlist (already done in apps).

**Storybook is no longer in the type/peer graph** (removed in PR #112) — the largest historical TS-upgrade lag risk is gone.
