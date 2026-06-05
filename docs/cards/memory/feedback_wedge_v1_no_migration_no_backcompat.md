---
title: 'wedge-v1-no-migration-no-backcompat'
description: 'Development-phase principle (until first customer): no old data artifacts exist — no migration scaffolding, no back-compat shims, no forward-compat machinery (version-skew UX, migration seams). Cut clean.'
purpose: remember
tier: card
status: active
date: 2026-06-05
topic: [memory, feedback]
related: []
verified-against-commit: 7712f1edb
last-verified: 2026-06-05
source-hash: 831a98212b581d30
origin-session-id: beeecb0e-3c3a-423f-ac5e-8b429351f010
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_wedge_v1_no_migration_no_backcompat.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Development-phase principle (generalized 2026-06-05 at PO-8a, owner call): until the first real customer, no old `.vrs` files / blobs / Dexie rows exist in the wild. Do not write migration code, grandfathering UI, backward-compatibility shims, OR forward-compatibility machinery (newer-than-reader read-only modes, migration-dispatch seams, version-negotiation UX).** Cut clean. Code rules still apply (TDD, factories, importOriginal, no `--no-verify`, etc.), but the *data + customer* compatibility layer does not exist yet.

**Why:** No users yet (originally confirmed 2026-05-17 for wedge PRs; re-confirmed and **generalized to ALL development-phase PRs 2026-06-05** during PO-8a scoping — "we are still in development phase, so we won't have old vrs files floating around, nor do we need any migration, nor backward compatibility"). Both apps are evergreen web deployments (tenant-wide Azure + hosted PWA) — "old reader meets newer file" is a stale-tab/stale-cache edge whose remedy is a refresh, not a SolidWorks-style installed-software version-skew problem. Compatibility machinery before the first customer is YAGNI debt.

**How to apply:**

- **Schema changes** (`.vrs`, DocumentSnapshot, Dexie, type shapes) — drop/rename fields directly; no `migrateX()` helpers, no silent-map-on-read, no migration-dispatch tables scaffolded "for later". Old rows orphan / old keys deserialize to `undefined` — accepted, documented-by-test where useful (ADR-091 pattern).
- **Version-skew UX** — no read-only modes, no "saved by a newer version" warning systems, no decline-or-branch dialogs for VERSION mismatches. Strict-reject with a clear user-facing message ("refresh the app" hint for version mismatch) is enough. (Concurrency conflicts between LIVE users are different — the PO-8b conflict dialog stays.)
- **API + type shapes** — required props by default; refactor consumers in the same PR. Delete, don't stub. (Strengthens [[feedback_no_backcompat_clean_architecture]].) Supersedes [[feedback_strict_assert_over_silent_migration]] for dev-phase scope: prefer **outright deletion**; loud strict-assert is for CORRUPT data, not old data.
- **Sub-plans + specs** — when a spec proposes compatibility machinery, challenge it against this principle at grounding time (PO-8a's spec §9.3 three-way-branch + migration seam were cut this way, owner-ratified).
- ~~Browser walks — skip for wedge PRs~~ **Superseded**: current practice = `--chrome` verify on UI-touching PRs per the master-plan chrome matrix; rename-only/mechanical PRs may skip with recorded precedent (PO-7).

**Expiry: the first real customer's saved data is permanent history — at that instant this principle flips.** Migration + compatibility discipline activates THEN (designed as its own item, not pre-scaffolded). Canonical doc home: decision-log 2026-06-05 PO-8a entry + ADR-091 amendment.
