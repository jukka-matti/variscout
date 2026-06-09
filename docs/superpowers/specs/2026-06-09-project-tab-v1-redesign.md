---
tier: living
purpose: design
title: Project tab V1 redesign
audience: human
category: design-spec
status: active
last-reviewed: 2026-06-09
layer: spec
implements:
  - docs/01-vision/product-overview.md
  - docs/02-journeys/ia-nav-model.md
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/personas/member.md
  - docs/02-journeys/personas/sponsor.md
  - docs/03-features/workflows/project-dashboard.md
  - docs/03-features/workflows/collaboration.md
---

# Project tab V1 redesign

## 1. What this spec covers

This spec redesigns the Project tab so it matches the current V1 wedge:

- VariScout V1 is one product for improvement specialists.
- A Project is the formal project file: Charter, roster, lifecycle status, Control closure, and Report context.
- The seven workflow tabs remain `Home -> Project -> Process -> Explore -> Analyze -> Improve -> Report`.
- The Project tab orients the team and records formal project state. It routes analytical work to Process, Explore, Analyze, Improve, and Report instead of duplicating those surfaces.

This is a design proposal, not an implementation plan. Code work should start only after this spec is approved and an implementation plan applies the L1/L2/L3 documentation deltas first.

## 2. Discovery summary

### Product drift

The current canonical V1 docs mostly agree on the desired product model:

- `docs/OVERVIEW.md` says a Project wraps analysis with formal lifecycle and team membership.
- `docs/01-vision/product-overview.md` says quick analysis can become a Project, and Project is the optional formal wrapper.
- `docs/02-journeys/personas/sponsor.md` says Sponsor can read Explore and Analyze when they want to engage directly, while active gestures stay bounded to review and acknowledgement.

Two doc areas still carry stale framing:

- `docs/02-journeys/ia-nav-model.md` still explains the workflow as an "active-IP cascade" in user-facing terms, including language that treats an Improvement Project as something distinct from Project selection.
- `docs/02-journeys/personas/lead.md` still says the active-IP cascade lights up downstream tabs, which keeps the Project/IP split alive in the journey language.

### Code drift

The current Project implementation is functionally honest but conceptually mixed:

- `packages/ui/src/components/IPDetail/IPDetailHeader.tsx` shows `All Improvement Projects`.
- `IPDetailStageTabs.tsx` labels the tablist as `IP lifecycle stages`.
- `CharterOverview.tsx` renders an `Investigation` CTA even though the tab is now Analyze and the Wall is the recognizable surface. It also has duplicate `data-testid="charter-continue-analyze"` buttons.
- `CharterOverview.tsx` replaced dead lineage counts with the static text `Hypotheses + findings live on the Wall`, which avoids false counts but gives no live project signal.
- `ApproachOverview.tsx` is more live than Charter because it projects cause rows from hypotheses, ideas, and actions, but it still reads as a working dashboard without a clear contract for what belongs here versus Analyze and Improve.
- `ControlOverview.tsx` still exposes `Start Handoff`, even though Handoff is folded into Control closure in current V1 language.
- `IPDetailPage.tsx` special-cases Sponsor into a Report-only placeholder and hides Project stage tabs, contradicting current Sponsor journey docs that give Sponsors read-only project visibility throughout the lifecycle.
- `apps/pwa/src/components/ProjectsTabView.tsx` and `apps/azure/src/components/ProjectsTabView.tsx` both mount the same shared `IPDetailPage`, so the main UI fix belongs in `@variscout/ui` with app wrappers only passing existing data and callbacks.

### Available primitives

The redesign can reuse existing data and patterns:

- `groupHypothesesByStatus()` in `@variscout/core/findings` is the canonical hypothesis status grouping.
- `ProjectStatusCard` already uses status-dot/count chips for findings and hypotheses.
- `ApproachOverview` already derives per-cause action state through `projectCauses()`.
- The Wall already owns Measurement Plans and hypothesis-level ActionItems. Project should summarize them when supplied, not edit them.
- `IPDetailTeamRail` and Charter membership UI already hold roster/signoff affordances.

## 3. Design approaches considered

### Approach A: Project as status cockpit

Project becomes a compact dashboard: lifecycle health, issue, goal, evidence counts, actions, Control readiness, and team status.

Pros:

- High signal when reopening a project.
- Makes stale static pointers easy to replace with live chips.
- Helps Lead and Sponsor answer "where are we?" quickly.

Cons:

- Risks duplicating Analyze, Improve, and Report.
- Can become a second dashboard if every verb tab asks to surface its own detail here.

### Approach B: Project as workflow launchpad

Project mainly orients the user and routes them into the next verb tab. Stage panels are simple, with prominent jump-outs.

Pros:

- Preserves clean tab ownership.
- Minimizes new data plumbing.
- Easy to explain: Project is the table of contents for the work.

Cons:

- Too thin for Sponsors and returning Leads.
- Leaves the current "inert pointer" problem mostly unsolved.

### Approach C: Project as collaboration dossier

Project becomes the formal project file: Charter, roster, lifecycle record, linked evidence summary, approval notes, Control closure, and Report readiness.

Pros:

- Best match for the wedge: Project is the collaboration wrapper and signoff-able file.
- Gives Sponsor and Member a stable place to understand context.
- Keeps the formal artifacts separate from the analytical work surfaces.

Cons:

- Needs careful boundaries so it does not reimplement Analyze/Improve.
- Requires role-aware read/edit behavior beyond the current Sponsor placeholder.

### Recommendation

Use Approach C with a light cockpit layer.

The Project tab should be the formal project dossier, with live status chips at the top of each stage. It should answer:

- What is this project trying to improve?
- Who is involved?
- Which lifecycle stage is active?
- What formal project decisions or missing artifacts need attention?
- Where should I go next to do the work?

It should not answer every analytical question inline. Detailed evidence stays on the Wall, process context stays in Process/Explore, actions stay in Improve, and narrative output stays in Report.

## 4. Surface contract

### Project list state

The unselected Project tab stays a project list, but visible copy should use `Project`, not `Improvement Project`.

Required changes:

- Empty state: "No Projects yet" remains acceptable.
- Back link: `All Improvement Projects` becomes `All Projects`.
- Test IDs may keep `ip-*` names during this slice if renaming would cause churn, but visible text and ARIA labels should say Project.

### Project header

The header becomes a project dossier header:

- Back link: `All Projects`.
- Status chip: `DRAFT`, `ACTIVE`, `CLOSED`.
- Title and goal summary.
- Day counter.
- Roster avatars and Invite action.

Do not add a second top-level dashboard card inside the header. The header should remain compact and scannable.

### Lifecycle tabs

The stage tabs stay `Charter`, `Approach`, `Control`.

Required changes:

- `aria-label="IP lifecycle stages"` becomes `Project lifecycle stages`.
- Code enum value `sustainment` can stay as an internal identifier for this slice; visible label remains `Control`.
- Locked/upcoming/done states stay as they are unless implementation finds inaccessible behavior.

### Stage overview pattern

Each stage overview should have the same structure:

1. Stage banner: one sentence on stage purpose and current attention item.
2. Live chips: compact, count-backed status chips from already-owned data.
3. Formal project content: only the records that belong in the Project file.
4. Continue row: jump-outs into the correct verb tab.

This makes the Project tab a dossier with a light cockpit, not a duplicated analysis workspace.

## 5. Stage details

### Charter overview

Purpose: align the project file before the team does deeper work.

Formal content:

- Issue statement or inherited issue snapshot.
- Goal summary.
- Team roster and invite control.
- Linked evidence summary, not a separate evidence editor.

Live chips:

- Issue: present / missing.
- Goal: present / missing.
- Team: Lead, Member, Sponsor counts.
- Wall: hypothesis count by status using `groupHypothesesByStatus()` if hypotheses are passed.
- Measurement Plans: open / in progress / complete if plans are passed.

Navigation:

- `Investigation` CTA becomes `Analyze Wall`.
- `Analyze - capability check` stays if the target is the Analyze tab capability view, but it should use unique test IDs.
- If no linked evidence exists, the Wall chip should say `No Wall evidence yet` and route to Analyze.

### Approach overview

Purpose: summarize how the team is moving from evidence toward selected improvement actions.

Formal content:

- Goal summary.
- Cause/action rows from `projectCauses()`, but only as a status summary.
- Selected idea/action progress where available.

Live chips:

- Hypotheses by status.
- Measurement Plans: open / in progress / complete.
- Actions: open / in progress / done.
- Cause rows: pending idea / in progress / resolved / ruled out.

Navigation:

- `Wall` becomes `Analyze Wall`.
- `Analyze - Flow Focus` becomes a concrete Analyze jump-out label only if the app can honor that target; otherwise use `Analyze evidence`.
- `Process - L2 Flow View` becomes `Process map`.
- `Open in Improve workbench` remains a cause-row action because detailed action editing belongs in Improve.

### Control overview

Purpose: show whether the improvement held and whether the project can close.

Formal content:

- Cadence tick history.
- Per-cause in-control evidence when provided.
- Closure checklist folded from the former Handoff stage.
- Report readiness and export actions when provided.

Required copy change:

- `Start Handoff` is removed or renamed to a Control action such as `Start closure`, `Complete Control`, or `Prepare closeout`.

Live chips:

- Control status: pending / holding / drifted / closed, derived from `ControlRecord.status`.
- Cadence: consecutive on-target ticks.
- Closure: N of 4 checklist items complete.
- Report: ready / needs closure / final available when callers provide enough data.

Navigation:

- `Process - monitor drift`.
- `Analyze - capability latest`.
- `Report - final summary`.

No user-facing Handoff label should remain in the Project tab.

## 6. Role behavior

### Lead

Lead has the full Project dossier:

- Edit Charter sections.
- Manage roster.
- Advance lifecycle when implementation supports it.
- Jump out to every verb tab.
- Request/record signoff where Azure provides callbacks.

### Member

Member has read access to Project formal content plus contribution access where already permitted:

- Read Charter and roster.
- See stage status and live chips.
- Jump to Analyze for evidence contribution and Improve for assigned actions.
- No roster management.
- No lifecycle advancement.

### Sponsor

Sponsor should not be reduced to a Report-only placeholder inside Project.

Sponsor Project view should be read-only:

- Read Charter, goal, roster, stage status, linked evidence chips, action progress, Control status, and Report readiness.
- Use jump-outs to read Analyze, Improve, and Report when allowed by the surrounding app.
- No editing, invite, remove-member, stage advancement, or action mutation.

This aligns with the current Sponsor journey: Sponsors are read-mostly, not report-only. The code can still distinguish Sponsor by role for edit gating.

## 7. Data and component boundaries

`@variscout/ui` should stay props-based for the Project dossier:

- Add a small `ProjectOverviewSignals` or similarly named prop object to `IPDetailPage`, derived by apps.
- Include readonly arrays/counts for hypotheses, findings, measurement plans, and actions only where needed.
- Keep selectors and repository reads in apps, not in shared UI.
- Reuse `groupHypothesesByStatus()` in app or core-side helpers.
- Do not introduce DataContext.
- Do not make `@variscout/ui` import app code.

Implementation should avoid a broad code-internal rename of `IPDetail*` in this slice. The user-facing model is Project; internal names can be retired later when the project store/key migration work is scheduled.

## 8. Documentation deltas

Before code lands, update the implemented docs:

- `docs/01-vision/product-overview.md`: replace active-IP wording in nav bullets with active Project context wording.
- `docs/02-journeys/ia-nav-model.md`: reframe the cascade as active Project context. If code still uses `useActiveIPStore`, note that active-IP is an internal store name, not the user-facing model.
- `docs/02-journeys/personas/lead.md`: replace "active-IP cascade" copy with project selection / active Project context.
- `docs/02-journeys/personas/member.md`: update Project Dashboard link language if it still implies active IP.
- `docs/02-journeys/personas/sponsor.md`: preserve Sponsor read-mostly access and make Project read-only visibility explicit.
- `docs/03-features/workflows/project-dashboard.md`: rewrite from the older Azure dashboard/DataContext framing into the current Project tab dossier contract.
- `docs/03-features/workflows/collaboration.md`: replace active-IP user-facing wording with active Project context while preserving code-internal references where necessary.

If implementation touches agent manifests, update stale Sponsor Report-only language in `apps/azure/CLAUDE.md` after the code behavior changes.

## 9. Implementation outline

Likely code tasks:

1. Add shared status-chip primitives local to `IPDetail` unless an existing chip component cleanly fits.
2. Extend `IPDetailPage` props with read-only project overview signals.
3. Thread signals from PWA and Azure `ProjectsTabView` using data already available in each app.
4. Update `IPDetailHeader`, `IPDetailStageTabs`, `CharterOverview`, `ApproachOverview`, and `ControlOverview` copy and behavior.
5. Replace Sponsor Report-only branch with read-only Project dossier rendering.
6. Keep write affordances gated by role and existing callbacks.
7. Update tests around Charter CTAs, Sponsor visibility, Control closeout copy, and Project wording.

Out of scope for this slice:

- Renaming code-internal `IPDetail*` files and `useActiveIPStore`.
- Re-keying stores from hub/project mirrors.
- Building a new cross-project portfolio dashboard.
- Moving Wall editing into Project.
- Adding new persistence tables.

## 10. Verification plan

Implementation plan: [`docs/superpowers/plans/2026-06-09-project-tab-v1-redesign.md`](../plans/2026-06-09-project-tab-v1-redesign.md).

Focused tests:

- `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`
- `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx`
- `packages/ui/src/components/IPDetail/__tests__/IPDetailHeader.test.tsx`
- `packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx`
- `packages/ui/src/components/IPDetail/stages/__tests__/ApproachOverview.test.tsx`
- `packages/ui/src/components/IPDetail/stages/__tests__/ControlOverview.test.tsx`
- `apps/pwa/src/components/__tests__/ProjectsTabView.test.tsx`
- `apps/azure/src/components/__tests__/ProjectsTabView.test.tsx`

Commands after implementation:

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/ui build
bash scripts/pr-ready-check.sh
```

Use app-specific narrower tests first while iterating, then run the broader package checks before PR prep.
