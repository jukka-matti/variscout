---
tier: living
purpose: design
title: 'Home — the entry surface'
audience: both
status: active
date: 2026-06-02
last-verified: 2026-06-09
verified-against-commit: 160991867
layer: L3
kind: workflow
topic: [home, entry, workspace, invitations, wedge-v1]
serves:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/ia-nav-model.md
related:
  - docs/03-features/workflows/project-dashboard.md
  - docs/03-features/workflows/collaboration.md
  - docs/03-features/data/save-and-load.md
  - docs/02-journeys/ia-nav-model.md
---

# Home — the entry surface

Home is where a session starts. It opens or creates **Workspaces**; it does not start a Hub portfolio or an active-IP focus mode. The Home surface **diverges sharply by app**: PWA is a training funnel, Azure is a **resume-last-Workspace + create-new** surface backed by durable storage (W4 retired the hub×analysis portfolio browser).

```mermaid
flowchart TD
  subgraph PWA["PWA Home — training funnel"]
    S[Sample datasets] --> W[Work session]
    P[Paste / manual entry] --> W
    V[Import .vrs] --> W
    W -.session-only · export-only.-> V
  end
  subgraph AZ["Azure Home — resume-last + create-new"]
    R[Resume last Workspace<br/>most-recently-modified] --> O[Open Workspace]
    N[Start new · sample / paste / .vrs / file] --> O
    L[Open another Workspace<br/>listProjects] --> O
    O --> Cascade[Workspace context<br/>→ Process/Explore/Analyze/Improve]
  end
```

## PWA Home — training funnel

`HomeScreen` (`apps/pwa/src/components/HomeScreen.tsx`) shows **sample datasets**, a **paste-from-Excel** primary action, a manual-entry link, and a **`.vrs` import** button. It is **session-only** — there is no saved-document list; `.vrs` export is the only durable path (R6d export-only). The `PendingInvitesBanner` renders at the top, keyed to the hardcoded single-user `'analyst@local'`.

## Azure Home — resume-last + create-new

The Azure Home (`apps/azure/src/pages/Dashboard.tsx`, the `'home'` view) leads with a **Resume last Workspace** card — `resumeProject`, the most-recently-modified saved project — alongside **start a new Workspace** (sample dataset, paste-from-Excel, `.vrs` import, file browse) and **open another Workspace** (the `listProjects` list, no longer a hub×analysis portfolio browser). It derives its product shape through `deriveWorkspaceViewModel` (`@variscout/hooks`). Documents are durable (IndexedDB + Blob); formalized Project access is roster-gated ([save-and-load.md §Access](../data/save-and-load.md)).

## Workspace context

Opening data creates/opens a Workspace that is always backed by one active Project record. `useActiveIPContext(hub, { userId })` is now a compatibility wrapper that returns the Workspace's attached Project directly; it no longer represents user-selectable focus, free-roaming, or exit behavior. Full rules: [ia-nav-model.md §Workspace Context Rules](../../02-journeys/ia-nav-model.md).

## Pending invites

`PendingInvitesBanner` (`packages/ui/src/components/Home/`) lists pending `Invitation`s with Accept/Decline. It is **transient** — rehydrated on mount (`rehydrateInvites`), expand/collapse is local state, and there is **no cross-tab real-time sync** (cross-device persistence is F5-deferred). Accept/decline mutates `useProjectMembershipStore` (localStorage). See [collaboration.md](collaboration.md).

## Azure vs PWA

|                                              | Azure (€120)  | PWA (free)                      |
| -------------------------------------------- | ------------- | ------------------------------- |
| Resume-last-Workspace card                   | ✓             | — (session-only)                |
| Open-another-Workspace list (`listProjects`) | ✓ (durable)   | — (session-only)                |
| Sample datasets / training funnel            | ✓ (start-new) | ✓                               |
| `.vrs` import / export                       | ✓             | ✓ (export-only durability)      |
| `PendingInvitesBanner`                       | ✓             | ✓ (single-user `analyst@local`) |

## Not yet built (do not document as live)

Home does **not** own a project focus selector; `PendingInvitesBanner` has no cross-tab real-time sync (F5 rehydrate only); the PWA has no saved-document list (R6d export-only).

## See also

- [project-dashboard.md](project-dashboard.md) — the in-Workspace Project overview surface (resume / status / what's-new).
- [collaboration.md](collaboration.md) — invitations + roster. · [save-and-load.md](../data/save-and-load.md) — durability + access.
- [ia-nav-model.md](../../02-journeys/ia-nav-model.md) — the 7-tab nav + Workspace context.
