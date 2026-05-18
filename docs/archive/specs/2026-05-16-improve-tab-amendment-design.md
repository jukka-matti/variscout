---
title: 'Wedge V1 amendment — Improve as top-level verb tab, Project as singular noun'
status: archived
date: 2026-05-16
last-verified: 2026-05-17
purpose: remember
tier: ephemeral
audience: agent
topic: [wedge, nav, ax]
related:
  - 2026-05-16-wedge-architecture-design
  - adr-082-wedge-architecture
---

# Wedge V1 amendment — Improve as top-level verb tab, Project as singular noun

> 🗄 **Archived 2026-05-17** — the Improve-tab amendment is now incorporated into the canonical [wedge architecture spec](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) (7-tab nav, Improve as top-level verb tab). This file preserves the point-in-time amendment narrative for institutional knowledge. Phase 2 doc-discipline forbids `*-amendment-*.md` files under `docs/superpowers/specs/`; relocated to `docs/archive/specs/`.

## Context

The wedge V1 spec (`2026-05-16-wedge-architecture-design.md` §3.1–3.3) locked a 6-tab workflow nav — `[Home] [Projects] [Process] [Analyze] [Investigation] [Report]` — and folded the legacy Improve workspace into Projects detail as a stage. PR-WV1-2 was mid-execution to deliver that fold-in: Tasks 0–5 had shipped (canAccess wiring, stage rename `Sustainment+Handoff → Improve+Sustainment`, `ImproveStage` simple action tracker, `ImproveStageAdvanced` PDCA workbench, Advanced toggle, Handoff close-logic folded into Sustainment closure). Task 6 was about to retire the top-level Improve tab.

During mid-execution review, the user surfaced a sharp design objection: the wedge V1 nav keeps **Analyze** and **Investigation** as top-level verb tabs (with active-IP cascade per PR-PT-7), but removes **Improve** entirely. That asymmetry is hard to defend — improvement work is the _doing_ verb of a chartered project; it deserves the same first-class verb treatment as data exploration and question-driven inquiry. Removing it forces specialists to drill into Project detail every time they want to update an action — even though the IP-context chip already tells them which project they're in.

This amendment restores Improve as a top-level verb tab, makes the Project tab singular (active-IP-scoped, matching the cascade pattern), removes the Improve stage from Project detail (since the same UI now lives at the top level), and preserves every other wedge V1 decision unchanged.

## Decision summary

1. **7-tab nav order:** `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]`. Wedge V1 §3.1's 6-tab list is superseded.
2. **Project tab is singular.** Active-IP-centric — it shows ONE project's lifecycle, matching how Analyze / Investigation / Improve / Report behave under the PR-PT-7 cascade. The full project _list_ lives on the Home launchpad (already shipped per PR-PT-6).
3. **Project detail has 3 stage tabs**, not 4: `Charter / Approach / Sustainment`. The `'improve'` stage is removed. Sustainment continues to absorb Handoff close-logic per Task 5.
4. **Improve tab is a top-level verb workspace.** With an active IP, it renders the simple action tracker (default) + Advanced PDCA workbench (toggle). Without an active IP, it renders a guidance state directing the user to Home to pick or charter a project. Implementations of `<ImproveStage>` + `<ImproveStageAdvanced>` from PR-WV1-2 Tasks 2-4 are reused verbatim — only the routing surface changes.
5. **Improvement actions are project-scoped data.** `ActionItem.parentImprovementProjectId` continues to anchor each action to one IP. The Improve tab filters to the active IP's actions via the same cascade that PR-PT-7 uses for other verb tabs. Cross-IP action views are out of V1 scope.

## Surface responsibilities

| Tab               | Role                                                                                                                 | Active-IP behavior                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Home**          | Project picker + launchpad (Mira's day-start)                                                                        | Sets active IP via launchpad cards; full list lives here |
| **Project**       | Active project's lifecycle authoring with 3 stage tabs (Charter / Approach / Sustainment)                            | Required — empty state directs to Home                   |
| **Process**       | Process Hub view scoped to active IP                                                                                 | Required — empty state directs to Home                   |
| **Analyze**       | Data analysis surface, scoped to active IP                                                                           | Required — empty state directs to Home                   |
| **Investigation** | Question-driven EDA scoped to active IP                                                                              | Required — empty state directs to Home                   |
| **Improve**       | Daily execution surface — simple action tracker (default) + Advanced PDCA workbench (toggle)                         | Required — empty state directs to Home                   |
| **Report**        | Overview / Technical reporting, scoped to active IP (or Hub portfolio when no IP set, per existing PR-PT-9 behavior) | Required for IP-scoped views                             |

Every non-Home tab follows the same pattern: with active IP, show the scoped working surface; without active IP, show a brief guidance state pointing back to Home. Improve adopts this pattern; it does NOT get a free-roaming "all projects" or "all ideas" view.

## Improve tab UX

### With active IP

Renders `<ImproveStage>` (the component built in PR-WV1-2 Task 2):

- **Default view (simple tracker):** Action list scoped to active IP. Shows title (`text`), owner (`assignedTo?.displayName`), due date (`dueAt`), status (`open | in-progress | done`), and the linked suspected cause name where derivable from `parentImprovementIdeaId`.
- **Add action button** gated by `canAccess(currentUserId, members, 'edit-improve')`.
- **Per-row Mark-done / Remove buttons** with the same canAccess gate.
- **"Advanced" toggle** in the header. Clicking it renders `<ImproveStageAdvanced>` (the component from Task 3): `ImprovementContextPanel` (causes), `BrainstormModal` + `IdeaGroupCard` (ideas), `PrioritizationMatrix` + `WhatIfExplorer` (prioritization + projection). All five primitives are scoped to the active IP.
- **"Simple view" toggle** returns to the tracker.

The IP-context chip at the top of the page surfaces which project is active (per PR-PT-7 pattern). Users can switch projects from Home or via the chip's switch affordance.

### Without active IP

Renders a guidance state — single section, single role="alert" panel:

> **No active project**
>
> Improvement work happens inside a chartered project. Pick a project from Home, or create a new one to start tracking actions and ideating with the PDCA workbench.
>
> **[Go to Home]**

This mirrors how PR-WV1-1's `NoAccessRedirect` handles the ACL empty state — informative, action-oriented, no functionality that could mislead the user into thinking free-roaming ideation is available.

## Project tab structure

Project detail (the surface that opens when the active IP is set and the user clicks the Project tab):

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Home  ●Active  Project: Heads 5-8 Cpk shortfall   │
│ Goal · invited team avatars · Invite                         │
├──────────────────────┬──────────────────────────────────────┤
│ Stages:              │ Overview / Sections toggle           │
│   • Charter          │                                       │
│   • Approach         │  (stage body — render switch)         │
│   • Sustainment      │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

3 stage tabs. The `'improve'` stage is removed from `StageName`, `STAGE_ORDER`, the `LABEL` map, and `deriveStageState`. PR-WV1-2 Task 1's prior rename `Sustainment+Handoff → Improve+Sustainment` is replaced by a simpler `Sustainment+Handoff → Sustainment` (Handoff folds into Sustainment closure per Task 5).

Stage progression semantics under the new 3-stage model:

| IP state                        | Charter   | Approach   | Sustainment |
| ------------------------------- | --------- | ---------- | ----------- |
| `status === 'draft'`            | `current` | `upcoming` | `upcoming`  |
| `status === 'active'`           | `done`    | `current`  | `upcoming`  |
| `status === 'closed'`           | `done`    | `done`     | `current`   |
| `sustainmentConfirmed === true` | `done`    | `done`     | `done`      |

The previous `improveComplete` signal (introduced in Task 1) retires — there is no Improve stage to gate.

## Impact on PR-WV1-2 in-flight work

PR-WV1-2 was 5 tasks deep when this amendment landed. Disposition per task:

| Task                                                            | Prior status                                 | Disposition under amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task 0** — Wire `canAccess` at consumer call sites            | Done                                         | **Keep verbatim.** ACL wiring is unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Task 1** — Stage rename + `migrateImprovementProjectMetadata` | Done (renamed to 4 stages incl. `'improve'`) | **Partial rework.** Stage list flattens further — `StageName` becomes `'charter'                                                                                                                                                                                                                                                                                                                                                                                                                        | 'approach' | 'sustainment'`. `STAGE_ORDER`is the same 3 values.`LABEL`map drops the`'improve'`entry.`StageStateInputs.improveComplete`retires.`deriveStageState`simplifies per the table above.`migrateImprovementProjectMetadata`is unchanged — it does`team[] → members[]` cutover only, never touched stage names. |
| **Task 2** — Build `ImproveStage` simple tracker                | Done                                         | **Keep component verbatim.** Routing moves: the component is rendered by the top-level Improve tab handler instead of by `IPDetailPage`. The Improve tab handler reads active IP from the cascade.                                                                                                                                                                                                                                                                                                      |
| **Task 3** — Build `ImproveStageAdvanced` PDCA workspace        | Done                                         | **Keep verbatim.** Reused identically inside the Improve tab when Advanced toggle is on.                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Task 4** — Advanced toggle                                    | Done                                         | **Keep verbatim.** Toggle behavior unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Task 5** — Fold Handoff into Sustainment closure              | Done                                         | **Keep verbatim.** Handoff fold stands. Sustainment is now the project's closure stage.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Task 6** — _Was:_ retire top-level Improve tab                | Pending                                      | **Rewritten.** New scope: (a) wire the existing `'improve'` tab handler in both apps to render `<ImproveStage>` with the active IP's actions + members + currentUserId, OR the empty-state guidance when no active IP; (b) rename `workspace.projects` i18n key to `workspace.project` (singular) across all locale files; (c) update the i18n message text in each locale to "Project" (singular); (d) un-prefix `_handoffInputs` / `_onOpenLegacyHandoff` cleanup that Task 5 absorbed remains as-is. |
| **Task 7** — Final verification + decision-log amendment        | Pending                                      | **Updated copy.** Decision-log amendment captures this amendment-of-an-amendment honestly: wedge §3.1 6-tab nav is superseded by 7-tab nav with Improve restored; `'improve'` stage removed from Project detail; Project (singular) noun.                                                                                                                                                                                                                                                               |

Specifically removed from Project detail:

- `<ImproveStage>` rendering inside the `'improve'` case of `IPDetailPage.tsx`'s stage router (Task 2's wiring at the IP detail level is reverted).
- The 3 optional callback props `onActionAdd` / `onActionUpdate` / `onActionRemove` on `IPDetailPageProps` are removed (those props move to the top-level Improve tab handler).
- The new "Improve stage routing" integration test in `IPDetailPage.test.tsx` is removed (no `'improve'` stage to route).

The `<ImproveStage>` component itself, its tests, `<ImproveStageAdvanced>`, and the Advanced toggle all live in `packages/ui/src/components/IPDetail/stages/` today. Either leave them there (the path becomes archaeologically inaccurate but the file path is internal) OR move to `packages/ui/src/components/Improve/`. Recommendation: **move** during Task 6 to keep the codebase shape honest — these components no longer belong to IP detail.

## Journey × persona × cognitive shape

Per `feedback_journey_first_then_ui`, the asymmetry the wedge V1 created (Analyze + Investigation as top-level verbs, Improve folded inside) is justified only if Improve has no real journey outside a project. The brainstorm surfaced the opposite: improvement work IS the daily verb for a specialist. The Improve tab makes that daily journey first-class.

**V1 Specialist daily journey, post-amendment:**

1. Open app → Home → pick today's project (sets active IP)
2. Click Project tab → check stage status, edit Charter / Approach / Sustainment as needed
3. Click Analyze tab → run capability/control charts on the active IP's data
4. Click Investigation tab → drill into outstanding questions for the active IP
5. Click Improve tab → update action statuses, add new actions, ideate via the Advanced toggle when needed
6. Click Report tab → see how the active IP is tracking against goal

Each tab is a lens on the _same_ project. The active-IP cascade (already wired in PR-PT-7) means switching tabs doesn't lose context — the chip carries the project's name across all surfaces. The user objection that drove this amendment ("we have analysis, investigate etc tabs still") was exactly right: those tabs already represent the verb-shaped daily journey for the specialist; Improve belongs alongside them.

**Cross-IP work** (compare prioritization matrices across past projects, build a portfolio-level idea library) is **NOT** added by this amendment. The Improve tab is single-IP-scoped. If portfolio-level Improve patterns become real V2 work, the spec can add an Analyze-tab pivot (per wedge §3.3's existing note that "What-If may re-emerge in Analyze later") or a dedicated portfolio surface.

## What this amendment supersedes

- **Wedge V1 spec §3.1** 6-tab nav `[Home] [Projects] [Process] [Analyze] [Investigation] [Report]` → superseded by 7-tab nav with Improve restored + Project singular.
- **Wedge V1 spec §3.2** "Project detail = 4 stages — `Charter / Approach / Improve / Sustainment`" → superseded by 3 stages `Charter / Approach / Sustainment`.
- **Wedge V1 spec §3.3** "Improve stage UI = simple action tracker by default; PDCA workbench + What-If accessible via an 'Advanced' toggle (progressive disclosure)" → the toggle behavior is preserved verbatim, but it lives in the top-level Improve tab instead of inside the Improve stage of Project detail.
- **Decision-log 2026-05-16 wedge entry §(1)** "Improve tab removed as top-level; becomes a stage inside Projects detail" → reversed. Improve restored as a top-level tab; Projects renamed to Project (singular).
- **Decision-log 2026-05-16 wedge entry §(3)** "idea board / action conversion retire" → preserved. Free-roaming cross-IP idea board still retires. Improve tab is single-IP-scoped, not a free-roaming surface. Within an active IP, the PDCA workbench is fully available behind the Advanced toggle.

The wedge meta-decisions (single-product specialist tool, Lead/Member/Sponsor membership ACLs, single €99 SKU, Hub internal-only, three response paths, ADR-080 sustainment auto-fire pattern) are **not** affected. ADR-082 stays in force.

## What this amendment preserves

- Coherence design 2026-05-14's verb/noun split is restored. The pre-wedge analysis ("Improve = legacy ImprovementView / PDCA workbench" + "Projects = new IP lifecycle + detail page" + "deliberate verb/noun split because the two surfaces serve genuinely different jobs") was correct; the wedge V1's collapse went too far.
- PR-PT-6 active-IP launchpad on Home — unchanged.
- PR-PT-7 active-IP cascade through verb tabs — extended to include the restored Improve tab.
- PR-PT-8 team workspace right rail — unchanged. Still rendered inside Project detail.
- PR-PT-9 Report tab IP-scoped vs. Hub portfolio behavior — unchanged.
- Wedge spec §4 project membership model + canAccess truth table — unchanged. The Improve tab uses `canAccess(currentUserId, members, 'edit-improve')` exactly as the Improve stage would have.
- Wedge spec §6 (single €99 SKU, Azure tenant-wide) — unchanged.

## Open questions for V2 (not blockers for this amendment)

1. **Process tab in 7-tab nav.** The wedge V1 spec brought "Process" as a tab for the canvas viewport (per ADR-081). This amendment preserves the Process tab. If wedge V2 redesigns Process navigation, it can be revisited then.
2. **What-If re-emergence in Analyze.** Per wedge §3.3, "What-If may re-emerge in Analyze later." The Improve tab's Advanced toggle still includes the `WhatIfExplorer` primitive. The Analyze tab does not yet surface What-If. Whether it should ever — and how that would relate to the Improve tab's What-If — is V2 work.
3. **Cross-IP improvement patterns.** Not addressed by V1. If specialists run multiple projects in parallel and want pattern-matching across them, a future Analyze pivot or portfolio surface may be needed. Track in `docs/investigations.md` if the question recurs.

## Acceptance criteria

This amendment lands when:

1. PWA + Azure apps render 7 tabs in the order `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]`.
2. The `workspace.project` i18n key is added (replacing the `workspace.projects` key); all 32 locale files show "Project" (singular) in their language.
3. Clicking the Improve tab with an active IP renders `<ImproveStage>` for that IP, with the Advanced toggle reaching `<ImproveStageAdvanced>`.
4. Clicking the Improve tab WITHOUT an active IP renders the guidance state with a "Go to Home" button.
5. Project detail stage tabs show 3 stages — `Charter / Approach / Sustainment` — with no `'improve'` stage button visible anywhere.
6. The `migrateImprovementProjectMetadata` helper (already shipped) continues to fold legacy `team[] → members[]` at hydration without touching stage data.
7. Sustainment continues to absorb Handoff close-logic (Task 5's work stands).
8. All `canAccess(currentUserId, members, action)` gates continue to enforce Lead / Member / Sponsor permissions identically to PR-WV1-1.
9. Tests in `packages/core`, `packages/stores`, `packages/ui` (touched suites), `apps/pwa`, `apps/azure` all green; `pnpm build` green across all 5 packages/apps; `bash scripts/pr-ready-check.sh` green.
10. Browser walk covers: pick project from Home → see Project tab show 3 stages → click Improve tab → see scoped tracker → toggle Advanced → see PDCA workbench → exit IP → click Improve tab → see guidance state.
