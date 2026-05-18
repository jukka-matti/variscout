---
title: 'active-ip-cascade-pattern'
description: 'Every wedge V1 verb tab uses the active-IP cascade pattern: useActiveIPContext(sessionHub) for scope + empty-state guidance pointing to Home when no active IP. Mirror this across PR-WV1-3/4/5/6.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 48cc1748b48f337d
origin-session-id: 13d849fb-ae7d-4093-90ea-a9bff40322cf
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_active_ip_cascade_pattern.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The wedge V1 amendment locked a canonical pattern for every active-IP-scoped verb tab (Process / Analyze / Investigation / Improve / Report). New verb tabs in downstream wedge PRs should follow this pattern verbatim.

**The pattern:**

1. **Scope from active IP** — read via `useActiveIPContext(sessionHub)` from `@variscout/stores`. Returns `{ activeIP, activeIPScope, setActiveIP, clearActiveIP, ... }`. Components consume `activeIP` as their scoping prop; the surrounding orchestration (PWA `App.tsx`, Azure `Editor.tsx`) injects it.

2. **Two-branch root component** — at the tab's entry, a `<TabRoot>` component switches on `activeIP === null`:
   - With active IP → render the tab's working surface scoped to that IP.
   - Without active IP → render `<NoActiveProjectGuidance>`-style empty state with "Go to Home" button. Single `role="alert"` panel; informative copy; no functionality that misleads the user into thinking free-roaming work is available.

3. **No bespoke list views** — the full project list lives on the Home launchpad (PR-PT-6). Verb tabs do NOT show "all projects" or "all hubs" — they are always scoped to one IP.

**Canonical implementations to mirror:**

- **Improve tab** (PR-WV1-2 amendment): `packages/ui/src/components/Improve/ImproveTabRoot.tsx` + `NoActiveProjectGuidance.tsx`. Switches between `<ImproveStage>` and the guidance state.
- **Analyze / Investigation** (PR-PT-7): scoped via the cascade; the IP-context chip surfaces which project is active.
- **Report** (PR-PT-9): IP-scoped report when active; Hub portfolio when no active IP (this one is the EXCEPTION — Report has a legitimate cross-IP portfolio view because reporting summarizes outcomes).

**How to apply in future PRs:**

- **PR-WV1-3 (Investigation Wall + Measurement Plans)**: Investigation tab already follows the pattern via PR-PT-7. New Measurement Plan UI should land INSIDE the active-IP-scoped Wall, not as a new top-level tab. If Inbox simplification adds new entry points, use `<NoActiveProjectGuidance>`-style empty state.
- **PR-WV1-4 (Canvas response paths + persona-routing deletion)**: Persona routing retires; replace with active-IP cascade if persona was the gating mechanism for any verb-tab content.
- **PR-WV1-5 (tier-gating retirement + nav reorder)**: When nav reorders, every tab still follows the cascade pattern. Don't accidentally introduce a free-roaming surface during the reorder cleanup.

**Why this matters:**

The wedge V1 spec originally collapsed Improve into Project detail because the team thought free-roaming Improve had no real journey. The user's mid-execution objection ("we have Analyze + Investigation tabs still, why not Improve?") surfaced the actual rule: **every verb tab follows the cascade + empty-state pattern**. Improve had a legitimate journey; the spec collapsed it by accident. Don't repeat that mistake when designing later wedge tabs.

Companion to `feedback_journey_first_then_ui` (map journey × persona × cognitive shape before UI mechanics) and `project_wedge_v1` (the locked wedge V1 surface anatomy, amended 2026-05-16). The amendment spec is at `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md`.
