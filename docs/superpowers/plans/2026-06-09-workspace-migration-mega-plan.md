---
tier: ephemeral
purpose: build
title: 'Workspace migration — implementation mega-plan'
status: active
date: 2026-06-09
layer: spec
related:
  - 2026-06-09-workspace-architecture-and-project-formalization-design
  - 2026-06-09-workspace-architecture-roadmap
  - 2026-06-09-coscout-surface-intent-redesign-design
  - adr-082-wedge-architecture
---

# Workspace migration — implementation mega-plan

> **Grounded 2026-06-09.** Reconciles the 9-slice [Workspace roadmap](2026-06-09-workspace-architecture-roadmap.md) against what PRs **#351** (workspace formalization) and **#352/#354** (CoScout) actually shipped, via a 3-lane source audit on `origin/main`. It marks done/partial/not-started, adds two items the roadmap missed, and slices the remainder into **Codex-promptable work-items** in dependency order. Each work-item has greppable/testable acceptance so "done" is never taken on trust.
>
> **Execution protocol (the lesson of this migration):** spec on `main` before code · greppable acceptance in every prompt · **one work-item in flight** · a one-pass post-merge verify before the next · demo-path surfaces (first-session / Process / Explore / Wall / Home) always browser-verified · high-blast-radius items (W6/W7) timed _between_ demos.
>
> **Division of labor:** **Codex owns code** (implement → browser-verify → self-merge). **Claude owns docs + review**, **post-merge, per slice/batch** — the Apply-phase canonical-doc propagation (the `implements:` targets, e.g. W4 → `home.md` + `project-dashboard.md`; W6 → `ia-nav-model.md`) **and** the "how did Codex do" quality review. Doc propagation is deliberately _not_ inside the Codex prompts (Codex docs have drifted; keep prompts code-focused).

## Delivery state (grounded baseline)

| Roadmap slice                               | Status                  | Note                                                                                                                                                                                              |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Product Model Lock (docs)                 | ✅ done                 | corrected spec (PR #353) + Codex doc edits                                                                                                                                                        |
| 2 User-facing vocabulary                    | 🟡 partial              | plural "Projects / New Project" copy remains → folded into W4/W5                                                                                                                                  |
| 3 Behavior Simplification                   | 🟡 partial              | #351 did the core (auto-activation, sessionStorage cleared-state dance, Exit/Switch/Free-roaming all removed; `setActiveIP`/`clearActiveIP` neutered to no-ops). Dead **wiring** remains → **W1** |
| 4 Workspace view-model                      | ❌ not started          | zero `WorkspaceViewModel`; shells read `ProcessHub`/`improvementProject` directly → **W2**                                                                                                        |
| 5 Analysis Scope strengthening              | 🟡 partial              | store exists + wired into CoScout context; needs a verify pass → folded into W2 verify                                                                                                            |
| 6 Shell refactor                            | ❌ not started          | `Editor.tsx` ~2671 / `App.tsx` ~1886 untouched → **W6**                                                                                                                                           |
| 7 Dead residue cleanup                      | ❌ not started          | `activeIPStore` write-only/read-by-nobody but undeleted; `useActiveIPContext` hollowed but present; `ActiveIP/` UI dir + naming sweep → **W3**                                                    |
| 8 Optional internal rename                  | ❌ not started          | `ProcessHub` + verb-keyed views → **W7**                                                                                                                                                          |
| 9 CoScout                                   | 🟢 separate track       | #352 redesign + #354 phase-retirement + **#355 loop-wide surface mounts** all shipped; only **eval-hardening** remains                                                                            |
| **NEW: Home/Project-portfolio realignment** | ❌ not started, unowned | Azure `pages/Dashboard.tsx` still a hub×analysis portfolio; `OtherProjectsList` + portfolio half of `useProjectOverview` are fossils → **W4**                                                     |
| **NEW: view-naming reconcile**              | ❌ not started          | Azure `activeView:'dashboard'` is a stale alias for Home; PWA uses `'home'` (divergent) → **W5**                                                                                                  |

## Work-items (dependency order)

> Each `W#` = one Codex prompt. Acceptance lines are written to be greppable/testable.

### W1 — Active-IP wiring cleanup (finishes Slice 3) · low risk · no deps

The behavior is gone; the **dead wiring** that fed it remains and confuses the surface.

- **Scope (remove):** the `onExitActiveIP` handlers (`Editor.tsx:2050,2388`; `App.tsx:1250,1640`); the `onExitIP`/`onExitActiveIP` prop chains through `AppHeader.tsx` + `ReportView.tsx` + `IPContextChip` + `ActiveIPLaunchpadCard`; the 7 no-op `clearActiveIP()` calls (`Editor.tsx:2051,2289,2389`; `App.tsx:1251,1561,1641`); the inert `useActiveIPStore.getState().setActiveIP(...)` writes in `apps/azure/src/lib/landing.ts:67` + `apps/pwa/src/lib/landing.ts:128`; the unused `onExitIP`/`onSelectIP`/`activeProjectId` props on `ActiveIPLaunchpadCardProps` + their call-site args; evaluate `useClearScopeOnIPSwitch` (`Editor.tsx:563`, `App.tsx:186`) + `setActiveIP(projectId)` (`Editor.tsx:2174`) for removal (both now no-ops over a non-switching id).
- **Acceptance:** `git grep -nE "onExitIP|onExitActiveIP|clearActiveIP|Free roaming|Switch IP" -- apps packages/ui` returns only tests; `landing.ts` in both apps no longer imports/calls `useActiveIPStore`; `pnpm --filter @variscout/azure-app test` + `--filter @variscout/pwa test` green; browser-verify Home + Report unchanged.

### W2 — Workspace view-model adapter (Slice 4 + Slice 5 verify) · net-new · unblocks W3/W4

Isolate the product shape from the storage shape — the seam that lets later refactors not rewrite the same surfaces twice.

- **Scope:** define `WorkspaceViewModel { workspaceId; title; project: ProjectSummary; isFormalized; analysisScope; capabilities }` derived over `ProcessHub` + its `improvementProject`. **`isFormalized` already exists** — reuse `isFormalizedProject()` + the `metadata.formalizedAt` marker shipped in #351 (`packages/core/src/improvementProject/predicates.ts`); do not re-decide. Migrate direct readers: `ProjectsTabView.tsx:47,120-122`; `Editor.tsx:2124-2128,2145`; `Dashboard.tsx:46-49,116`. Guardrails (roadmap §4): the view model must NOT own Azure save / PWA export semantics and must NOT create a shared mega-shell.
- **Verify Slice 5 in passing:** confirm `useAnalysisScopeStore` is the single lens consumed by Explore/Process/Analyze/Report/CoScout; note any surface still reading drill-path/activeChart instead.
- **Acceptance:** `WorkspaceViewModel` type + derivation exist with unit tests (incl. a negative control: an Untitled, solo, no-`formalizedAt` project derives `isFormalized:false`); named shells consume it; Azure `Editor.test.tsx` + PWA `App.test.tsx` green.

### W3 — Active-IP dead-residue deletion (Slice 7) · after W1 + W2 · medium blast radius

- **Scope:** delete `packages/stores/src/activeIPStore.ts` (write-only, zero live readers) + its export (`packages/stores/src/index.ts:99-100`) + the `packages/stores/CLAUDE.md` row; collapse/rename `useActiveIPContext` into the W2 Workspace-Project accessor (drop the `setActiveIP`/`clearActiveIP`/`scope`/`activeState`/`isIPScoped` no-op surface); rename `packages/ui/src/components/ActiveIP/` → a `Workspace` namespace; remove `useClearScopeOnIPSwitch`; sweep the `ActiveIP*`/`activeIP*`/`DEFAULT_ACTIVE_IP_USER_ID` identifier residue in `Editor.tsx`/`App.tsx`/`AppHeader`/`ReportView`.
- **Acceptance:** `git grep -nE "activeIPStore|useActiveIPContext|ActiveIPLaunchpadCard|DEFAULT_ACTIVE_IP_USER_ID" -- apps packages` returns nothing live; `pnpm build` (tsc) green across packages + apps; tests green; browser-verify Home/Project/Report.

### W4 — Home/Project-portfolio realignment (NEW) · after W2 · demo-adjacent

Bring Home + the project surfaces to "one Workspace = one Project, no portfolio."

- **Owner decision (locked 2026-06-09): resume-last.** Azure Home is **resume-last-Workspace + create-new** — NOT a Workspace list, NOT a portfolio. On open: land in the most-recent Workspace; offer "New Workspace" + a lightweight "open another" affordance (e.g. recent, not a full portfolio browser). No hub×analysis grid.
- **Scope:** replace Azure `pages/Dashboard.tsx`'s hub-dropdown + analysis-card portfolio (`:271-302`, header `:175-178`, per-hub filter `:112-122`, "New Hub" `:186`) with the **resume-last + create-new** entry, consuming `WorkspaceViewModel`; make `App.tsx`'s auto-redirect resume the last Workspace instead of routing to a portfolio (`App.tsx:242-250`), and drop `mode="portfolio"` / "Go to Portfolio" framing (`:274,291`); delete `OtherProjectsList.tsx` + its render/props in `ProjectDashboard.tsx:25-27,218-224`; trim `useProjectOverview.ts` to drop the `listProjects()` portfolio fan-out (keep `lastViewedAt` — it now drives resume-last). Fold the **Slice 2 vocabulary** sweep here (plural "Projects"→Workspace framing in `ProjectsTabView`, PWA `HomeScreen` copy).
- **Acceptance:** no `OtherProjectsList`/`onViewPortfolio`/"Portfolio" / hub-dropdown in non-test code; Home resumes the last Workspace + offers "New Workspace"; `git grep -niE "portfolio|process hubs" -- apps/azure/src` returns only legitimate VariScout-Process/named-future references (not the live Home); browser-verify resume-last + create-new + the first-session flow not regressed.

### W5 — View-naming reconcile (NEW) · low risk · parallel-safe (any time)

- **Scope:** rename Azure `activeView:'dashboard'` → `'home'` (`panelsStore.ts:14,135` + `showDashboard`→`showHome`; `AppHeader.tsx:29,203,214`; `Editor.tsx:1184,2118,2306`) to match the PWA key + the "Home" label; fix the stale "aligned with Azure" comment at PWA `panelsStore.ts:6`; optionally add an explicit `activeView==='explore'` render branch (`Editor.tsx:~2344` currently renders Explore as the unnamed `else`). Leave `'frame'`/`'sustainment'` for W7.
- **Acceptance:** Azure + PWA use the same Home key; `git grep "'dashboard'" -- apps/azure/src/features/panels apps/azure/src/pages/Editor.tsx` returns nothing; tests green.

### W6 — Shell refactor (Slice 6) · high blast radius · between demos

- **Scope:** extract the 9-way `activeView` render switch (`Editor.tsx:2082-2404`, ~320 LOC) into `<EditorViewSwitch>` / per-view route components (`EditorDashboardView` is the precedent); extract handler closures + data-projection memos into `useEditorHandlers`/`useEditorDataProjections`; relocate view-scoped effects (`:1461`,`:1489`) into their views; mirror in PWA `App.tsx`. Target ADR-078's ~40-LOC route-shell.
- **Acceptance:** `Editor.tsx`/`App.tsx` materially smaller; the view switch is a single extracted component; all shell + routing + panel tests green; full browser walk of every tab.

### W7 — Optional internal rename (Slice 8) · highest blast radius · last/optional

- **Scope:** `'frame'`→`'process'`, `'sustainment'`→`'control'` view keys (NOT the `${hub.id}:sustainment` Control _domain_ join keys — leave those); and, only if justified, the `ProcessHub` storage rename (persistence/snapshots/exports/repository APIs — its own high-blast-radius plan + migration tests).
- **Acceptance:** per-rename greps clean; persistence/snapshot/export/import tests green.

## Sequence

```
W1 ─▶ W2 ─▶ ┬─▶ W3
            └─▶ W4 (after owner micro-decision)
W5  (parallel-safe, any time — low-risk quick win)
W6  (after W2–W4 settle; between demos)
W7  (last; optional)
```

CoScout (track 9) runs independently and is nearly complete: phase-retirement (#354) + loop-wide surface mounts (#355) shipped; only the **eval-hardening** prompt remains.

## Per-item Codex prompt

Each `W#` promotes to one Codex prompt built from its Scope + Acceptance, plus the standard footer: _ground first (confirm the listed file:lines still match); branch → PR → browser-verify where a surface changes → `gh pr merge --merge --delete-branch` (not --squash); author your own sub-plan; one phase in flight._ Claude writes each prompt at dispatch time and does the one-pass post-merge verify.
