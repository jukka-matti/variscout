---
title: 'wedge-v1-no-migration-no-backcompat'
description: 'Wedge V1 has no users yet — no migration scaffolding, no grandfathering, no back-compat shims; also skip browser walks for wedge engineering PRs'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: beeecb0e-3c3a-423f-ac5e-8b429351f010
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_wedge_v1_no_migration_no_backcompat.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

For all wedge V1 engineering PRs (PR-WV1-1 through PR-WV1-6 and any post-V1 cleanup before public launch), **do not write migration code, grandfathering UI, communication artifacts, or backward-compatibility shims**. Cut clean. Code rules still apply (TDD, factories, importOriginal, no `--no-verify`, etc.), but the *data + customer* compatibility layer does not.

**Why:** Wedge V1 has no users yet. ADR-082's economic model assumes a near-empty customer base; the user confirmed explicitly 2026-05-17 ("no need for migration, no backward compatibility for now"). Writing migration code or grandfathering UI is YAGNI debt that slows the wedge.

**How to apply:**

- **`.vrs` schema changes** — drop fields directly; no `migrateX()` idempotent helpers, no "silent map on read" logic. The codebase has prior migration helpers (`migrateTeamToMembers`, `migrateFindingStatus`) from earlier work — don't model new ones on those for wedge V1 changes. (Keep the existing ones; they served pre-wedge users.) Supersedes [[feedback_strict_assert_over_silent_migration]] for the wedge V1 scope: prefer **outright deletion** over either strict-assert or silent migration.
- **Marketplace + pricing** (PR-WV1-6) — flip the manifest to single €99 SKU; do NOT build `MigrationPrompt` UI, grandfather countdowns, in-product banners, FAQ docs, or email templates. Just commit the new manifest.
- **API + type shapes** — required props by default; refactor consumers in the same PR. Don't stub deleted functions to return defaults; delete them and update consumers. (This already aligned with [[feedback_no_backcompat_clean_architecture]] — this entry strengthens it for wedge V1: even if it would have been "harmless" to stub, don't.)
- **Browser walks** — skip them for wedge engineering PRs. `pr-ready-check.sh` green + Opus final code review is enough. (Counter-instructs [[feedback_verify_before_push]] for the wedge work specifically; restore browser walk verification for post-wedge feature PRs that change visual UX.)
- **Sub-plans + PR bodies** — when writing wedge sub-plans, omit "browser walk" from verification sections + PR templates. Test plan = `pnpm test` + `pnpm build` + `pr-ready-check.sh` green.

**Scope:** Wedge V1 stack (PR-WV1-1 through PR-WV1-6) + post-V1 cleanup PRs until public launch. Reassess after the first paying customer or public Marketplace listing — at that point migration + UX-walk discipline reactivate.
