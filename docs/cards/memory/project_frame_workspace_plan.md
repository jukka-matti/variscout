---
title: 'FRAME workspace (umbrella) — 7 PRs MERGED to main 2026-04-18'
description: 'FRAME umbrella fully shipped to main. 7 stacked PRs (#65,'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 0c8c5822-ee08-4a58-b38e-1176d23e520e
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_frame_workspace_plan.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Umbrella plan approved and **fully shipped to main** 2026-04-18 as a 7-PR merge train. Plan file: `/Users/jukka-mattiturtiainen/.claude/plans/i-was-interviewing-greg-dynamic-umbrella.md`. Design spec + ADR-070 live on `main`.

## Merge train (squash-merged to main in sequence, 2026-04-18)

1. **#70** `65f394da` `feat(core): FRAME data model + mode inference + gap detector` — `packages/core/src/frame/` with `ProcessMap` schema (version:1), `inferMode()` (rule table: yamazumi.tripletPresent → defect.typeAndCount → defect.passFail → performance.threeOrMoreChannels → capability.outcomeSpecsAndSubgroups → standard.fallback), `detectGaps()` (required before recommended, step-scoped walks in `order`). ProcessContext gains `processMap?: ProcessMap`. Sub-path export `./frame`. +44 core tests (includes +2 from chrome-walk microcopy polish).
2. **#71** `ddd14121` `feat(ui): ProcessMapBase` — river-styled SIPOC component in `packages/ui/src/components/ProcessMap/`. Props-based, parent owns state. +21 UI tests.
3. **#72** `2c14d3ad` `feat(pwa): FrameView + nav tab` — `apps/pwa/src/components/views/FrameView.tsx` + panelsStore `'frame'` + nav tab.
4. **#73** `b7cbbf3d` `feat(azure): FrameView + nav tab` — Azure mirror. FrameView in `apps/azure/src/components/editor/`, panelsStore + AppHeader + Editor.tsx dispatch.
5. **#74** `bc51ac6c` `feat(capability): wire SubgroupConfigPopover` — `subgroupAxisColumns(map)` helper; Dashboards derive popover candidates from `processMap.subgroupAxes` (falls back to `factors`). Also carries today's chrome-walk fixes (see below).
6. **#65** `c1cc383d` `feat(samples): syringe-barrel demo v2` — adds `subgroupConfig?`, `displayOptions?`, `separateParetoData?` to `SampleConfig`; rational subgroups + defect Pareto + contrast fixes. Merged after FRAME umbrella (required conflict resolution on `useDataIngestion` due to overlapping field additions).
7. **#69** `f73ca82a` `feat(capability): quick wins` — seed `subgroupConfig: { method: 'fixed-size', size: 5 }` on seeded samples; rename `CapabilityMetricToggle` labels to "Measurements / Cpk stability"; `CapabilityCoachingPanel` static component. Cherry-picked onto fresh `main` (avoided re-applying already-squashed #65 commits).

## Chrome-walk fixes shipped in #74

Four issues found during end-to-end browser walk with Fill Weight showcase; all fixed before merge:
1. **`useAppPanels.showFrame` forwarding** — PWA hook wrapped panelsStore but stripped `showFrame` and left `'frame'` out of `activeView` typing. Nav click threw "panels.showFrame is not a function". Hook now forwards both.
2. **`WorkspaceView` type gained `'frame'`** — `packages/core/src/ui-types/index.ts`, `packages/stores/src/sessionStore.ts`, `apps/azure/src/components/AppHeader.tsx` all had a duplicate `'dashboard' | 'analysis' | …` literal missing `'frame'`. Azure build was failing from `c4872d1d`; now clean.
3. **Showcase seeds `processMap`** — `SampleConfig.processMap?` added; `loadSample` writes it to `projectStore.processContext` (merging with any existing context, clearing when loading mapless sample). Fill Weight showcase opens Frame ready-made (Fill step, 4 tributaries, Line as subgroup axis, CTS=Fill_Weight_g, 2 hunches). Gap report drops to 1 recommended (time axis).
4. **Gap microcopy polish** — unnamed steps render as "this step" / "This step has no tributaries" instead of bare `""`. +2 tests.

## Locked decisions (from the plan)

- **Direction**: Explicit FRAME workspace, UI-led, visual map (not a form).
- **Visual shape**: river-styled SIPOC blend — left→right SIPOC spine; tributaries from both banks (Y=f(x)); ocean at right = CTS (Voice of Customer painted on).
- **Entry V1**: data-seeded — columns propose the map; user confirms.
- **CoScout**: optional, not required (Constitution P8, PWA free tier).
- **Default landing view**: unchanged (`'analysis'`). Users opt into FRAME via the tab.

## V2+ deferred (not yet coded; tracked in spec)

- CoScout-drafted maps from conversation; CoScout sidebar critique.
- Template library; bidirectional flow (start without data).
- Freeform drag-and-drop (likely `react-flow`); auto-layout.
- **Fractal subgroups** (within-step Gemba ring).
- **CTQ vs CTS data-model split** as explicit types.
- **Probability-plot inflection detection** (unlocks `feature-backlog` items 1–3).
- **Quality 4.0 positioning claim** (Watson Berlin 2017 lineage) in `positioning.md` + manifesto.

## Test impact

Core: 2580+ (was 2538; +44 from #70 and chrome-walk polish, +6 from #74 subgroupAxes helper). UI: 1179 (was 1158; +21 from #71 + 6 coaching-panel tests from #69). Hooks: 10+ (useDataIngestion). PWA + Azure builds clean post-merge. `pr-ready-check.sh` was green on #74 before merging.

## Merge mechanics (recorded for future stack-merge sessions)

Stacked PRs with non-main bases need rebase + retarget + force-push before squash-merge. Sequence for each PR after its base merges to main: `git fetch origin main && git checkout <branch> && git rebase origin/main` (skipped-cherry-pick warnings are expected when upstream squash-merged), then `gh pr edit N --base main && git push --force-with-lease`, then `gh pr merge N --squash --auto` (or plain `--squash` if auto-merge isn't enabled on the branch ruleset).

When a downstream branch's rebase conflicts because the parent was squash-merged (git sees the parent commits as new work), the clean path is cherry-pick onto fresh main rather than fighting the rebase — used for #69 after #65's squash.

## How to apply (future sessions)

- When working on FRAME-related features, **preserve data-seeded V1** and **CoScout-optional** principles — V2+ layers on top of the deterministic core.
- `modeInference` is a pure function — add new rules by adding to the rule table in `packages/core/src/frame/modeInference.ts` with a stable `ModeInferenceRuleId` + corresponding test fixture in `__tests__/modeInference.test.ts`.
- `detectGaps` is a pure function — add new gaps with a new `GapKind` + severity; required gaps sort before recommended.
- `ProcessMapBase` is props-based; parent (FrameView) owns state. Adding a new map surface means extending `ProcessMap` in `@variscout/core/frame/types.ts` and wiring through `ProcessMapBase` props — not reaching into stores.
- `subgroupAxisColumns(map)` is the canonical way to derive capability-view candidates from the map.
