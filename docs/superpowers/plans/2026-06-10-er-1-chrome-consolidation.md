---
tier: living
purpose: build
title: 'ER-1 chrome consolidation sub-plan'
audience: agent
status: active
date: 2026-06-10
layer: spec
topic: [explore, chrome, header, context-line, skeletons, layout, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
implements:
  - docs/03-features/workflows/analysis-flow.md
---

# ER-1 — Chrome Consolidation (5 strips → 2 rows)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Execute from `.worktrees/feat/er-1-chrome-consolidation` on branch `feat/er-1-chrome-consolidation`. One implementer per task, sequential; spec + quality reviewer pair per task; commit per task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Explore's persistent chrome becomes exactly two rows — the compact header and the context line — with the scope ribbon deleted, the framing toolbar gated to the Process tab, chart-generous heights as the only layout, and skeletons covering every render gap (spec §3, D1).

**Architecture (grounded 2026-06-10, post-ER-0 main `267f6f256`):** The "5 strips" are: PWA AppHeader's emergent flex-wrap second row (labels `hidden lg:inline` push wrap), the framing toolbar (mounts on EVERY tab; Azure twin holds only "+ New analyze"), `WorkspaceProjectScopeRibbon` (9 mounts, zero interactive controls), `ProcessHealthBar` (the stats strip — becomes the context line), and Azure's `ScopeChrome` row. Today's grid layout gives the I-Chart a ~118px (Azure) / ~183px (PWA) plot band at 1440×900; chrome consolidation + scroll-default + named height levers reach ≥3× both apps. The 3–5s blank windows are withParentSize's empty first commit + a synchronous main-thread block (sync `computeStats` — workerApi omitted at 4 call sites — plus full-point SVG render; LTTB revival is ER-10's, NOT ours).

**Grounding corrections adopted (vs the master-plan text):** the Cpk number is ALREADY a live button in both apps (switches the I-Chart to the capability metric via `useDashboardInsights`) — ER-1 adds tooltip + disabled affordance and must not regress the wiring; `analysis-flow.md` is already 5-verb — its debt is the pre-redesign anatomy content, not vocabulary; Azure has no Findings toggle/What-If/Export-in-strip — those are net-new on Azure where noted.

**Settled dispositions (do not re-open):**
- **Footer:** the existing PWA `AppFooter` stays as-is; the wireframe's footer is satisfied by it; the ≤2-rows acceptance counts persistent strips between header and chart area. No new footer.
- **Findings icon, Azure:** net-new header icon routing to Analyze with `analyzeViewMode: 'findings'` (panelsStore) + the same `useAnalyzeStore(s => s.findings.length)` badge. PWA keeps its toggle, gains the badge.
- **Tooltips:** native `title` attributes (already the house pattern on every header icon). No new tooltip primitive.
- **Factors(N) interim home (until ER-2):** the I-Chart header-extra "Factors (N)" button — Azure already has it (`azure Dashboard.tsx:1230-1241`); PWA adds the twin in its `ichartHeaderExtra`. Strip button deleted in both (also kills Azure's duplicate-testid hazard).
- **Subgroup lens:** `SubgroupConfigPopover` moves to the context line right cluster; `CapabilityMetricToggle` STAYS in `ichartHeaderExtra` (it is chart identity — ER-10 replaces it with the capability lens).
- **Stages lens:** stage-column + stage-order selects move to the context line right cluster; the staged-stats chips stay with the I-Chart card.
- **Export:** context-line right-cluster Export menu — PWA: Export CSV (existing handler) + Export .vrs (relocated `VrsExportButton` incl. `onExported` reset); Azure: Export CSV only (existing `handleExportCSV` plumbed down — `Editor.tsx:1933` → DashboardSection → Dashboard); Azure .vrs stays absent (status quo; `exportToFile` has zero UI callers — logged, not built).
- **Edit framing:** a small dropdown menu on the context line's measure/scope chip (net-new menu; dropdown precedent = Azure AppHeader project menu / PWA SharePopover). PWA item → `importFlow.openFactorManager`; Azure item → `dataFlow.openFactorManager`.
- **Azure in-app I-Chart branding:** `showBranding={false}` (matches PWA in-app precedent; Report surfaces keep their own branding). Recovers 28px of plot band.
- **Height levers (in order until the ≥3× measurement passes on BOTH apps):** scroll-only layout with the I-Chart block viewport-relative (`h-[calc(100dvh-240px)] min-h-[500px]` — tune the constant at build); slim the in-card header's 44px maximize-button row to a compact icon row; Azure branding off (above); ichart top margin 40→24 in `responsive.ts` (ichart row ONLY — the margins map is shared by 6 chart types).

**Invariants:** Tailwind v4 tokens must exist in `@theme` (the ui token-guard test enforces); no auto-select; P5 language; LTTB/chartWidth untouched (ER-10).

---

### Task 1 — Delete the scope ribbon (ui + both apps)

**Files:** Delete `packages/ui/src/components/WorkspaceProject/WorkspaceProjectScopeRibbon.tsx` + its barrel lines (`WorkspaceProject/index.ts:21-23`). Delete 9 mounts + imports: PWA `Dashboard.tsx:852-858` (import :25), `AppViewSwitch.tsx:215-221` (:9), `views/AnalyzeView.tsx:601-607` (:28), `views/ReportView.tsx:474-480` (:16), `views/ImprovementView.tsx:57-63` (:11); Azure `Dashboard.tsx:868-874` (:47), `editor/EditorViewSwitch.tsx:243-249` (:12), `editor/AnalyzeWorkspace.tsx:995-1001` (:15), `views/ReportView.tsx:1261-1268` (:34). KEEP the `workspaceProjectScope` prop/object (PWA `App.tsx:967`, Azure `Editor.tsx:606`) — OverallProblemHeader, ReportView processName, and capture-model still read it; the label deriver + its test stay.

- [ ] Red: update `apps/pwa/e2e/workspace-project-cascade.spec.ts:37-63` (ribbon assertions → header `workspace-project-chip`/`persistent-scope-chip` testids); drop the ribbon null-mock in `apps/azure/src/__tests__/g1-inflection-binning-flow.test.tsx:169`.
- [ ] Delete component + mounts; `pnpm --filter @variscout/ui build` (catches dangling barrel) + `pnpm --filter @variscout/ui test && pnpm --filter @variscout/pwa test && pnpm --filter @variscout/azure-app test`.
- [ ] Commit `feat(chrome): delete WorkspaceProjectScopeRibbon — header chips are the single scope chrome`. Note in the message: ribbon's project-goal pills (Outcome/Factor/Since) survive on the Project-tab dossier; the header PersistentScopeChip shows the LIVE analysis scope (different entity, intentional).

### Task 2 — Context line: ProcessHealthBar reshape (ui + hooks + both apps)

**Files:** `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` + `types.ts`; `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx:316-388` (lift stage selects out of `ichartControls`; `ichartHeaderExtra` stays); NEW `packages/hooks/src/useDataDateRange.ts` (+ export `rangeOf` from `packages/core/src/matchSummary/classifier.ts:28-44` by MOVING it into `packages/core/src/time.ts` beside `parseTimeValue`, re-import in classifier); both app Dashboards' mount rewiring (PWA `Dashboard.tsx:873-913` + stage props :158-161/:985-989 + subgroup `ichartHeaderExtra` :1065-1087; Azure `Dashboard.tsx:890-929` + :244/:1143-1147 + :1209-1229 + net-new `onExportCSV` plumbing from `pages/Editor.tsx:1933` through `editor/DashboardSection.tsx`).

Target shape (wireframe `explore-redesign-mockup-2026-06-10.html:217-232`, ~34px row): LEFT `N calls · <date range> · x̄ <v> σ <v> Cpk <v> · Filters: <none|n condition(s)>` — date range COMPUTED from the lensed rows' timeColumn (never hardcoded); Cpk keeps `gradeCpk` coloring + the existing `onCpkClick` wiring, gains `title` ("View capability on the I-Chart") and, when prerequisites are missing (no spec), a disabled state whose `title` names what's needed ("Set a spec to compute Cpk"). RIGHT cluster: `Subgroup` (SubgroupConfigPopover relocated) · `Time` (existing TimeLens button+popover — restyle in place) · `Stages` (stage-column + stage-order selects relocated from DashboardLayoutBase) · `Export` (menu per the settled disposition) · the measure/scope chip with the net-new dropdown menu carrying **Edit framing** (PWA → `importFlow.openFactorManager`; Azure → `dataFlow.openFactorManager`). DELETE from the strip: the grid/scroll toggle UI (full retirement is Task 4's), `Factors(N)` button (interim home = Task 3's header-extra), the dead `Present` button (:642-652, zero callers). KEEP: ScopeCoverageBar segment, drill filter chips + Clear + Pin (they render in the Filters segment), capability-mode Pass%→Subgroups% branch, the `/target` inline editor + source chip + `for <column>` chip.

- [ ] Red first: extend `ProcessHealthBar.test.tsx` for the new left-order segments + date range + Cpk disabled-state title + Export menu + chip menu (seed `usePreferencesStore` via setState, per existing tests); new `useDataDateRange` test (hooks); update `Dashboard.lensedSampleCount.test.tsx` if testids move.
- [ ] Implement; keep every existing testid that survives (`stat-cpk`, `btn-time-lens`, `btn-export-csv`) to limit churn.
- [ ] All four suites + ui build green; commit `feat(chrome): ProcessHealthBar becomes the Explore context line`.

### Task 3 — Header compaction + Findings badge (ui + both apps)

**Files:** PWA `apps/pwa/src/components/layout/AppHeader.tsx` (delete the three `hidden lg:inline` label spans :204/:222/:239; remove `flex-wrap` from :132 so one row is deterministic; height `min-h-14` → `h-12`; Findings button gains the count badge); Azure `apps/azure/src/components/AppHeader.tsx` (desktop already one-row h-11 icon-only — ADD the net-new Findings icon+badge routing to Analyze `analyzeViewMode:'findings'`); badge count = `useAnalyzeStore(s => s.findings.length)`; badge styling reuses WorkflowNav's `badgeClass` pill pattern (only `@theme`-declared tokens).

- [ ] Red: update both AppHeader tests (label-text assertions die; badge assertions added: 0 findings → no badge, n>0 → count). Assert no `flex-wrap` on the PWA header container (one-row acceptance is structural, not screenshot-width-dependent — grounding note).
- [ ] Implement; suites + ui build green; commit `feat(chrome): one-row compact header — icon-only tools, Findings count badge (both apps)`.

### Task 4 — Framing-toolbar gating + layout-toggle retirement (core + ui + both apps)

**Files:** PWA `apps/pwa/src/App.tsx:1329` — add `panels.activeView === 'frame' &&` to the toolbar condition (block :1326-1379); relocate `VrsExportButton` mount (:1366-1369 incl. `onExported` → `setHasOwnCaptureSinceExport`) into Task 2's Export menu (this task wires it if Task 2 left the slot). Azure `editor/EditorViewSwitch.tsx:82` — require `activeView === 'frame'` (destructured :33). Layout-toggle retirement: `ProcessHealthBar.tsx:461-491` toggle block + `types.ts:42-45` required props (if Task 2 left them); `DashboardGrid.tsx` — delete `layout` prop + the grid branch (:34-48); scroll branch becomes the unconditional path with the I-Chart wrapper raised per the height levers; `DashboardLayoutBase.tsx:201-203/:282/:495` prop removal; `packages/core/src/ui-types/index.ts:84` delete `DisplayOptions.dashboardLayout` (stale persisted values deserialize harmlessly — verified); both app Dashboards' wiring (PWA :883-884/:985; Azure :914-915/:1164); Azure in-app `showBranding={false}`; in-card header slim + ichart top margin 40→24 (`packages/core/src/responsive.ts:84` ichart row only) IF the measurement needs them.

- [ ] Red: `apps/pwa/src/__tests__/outcomePinMulti.test.tsx:191,198` (toolbar asserted on default Explore — invert: absent on Explore, present on Process); `apps/pwa/e2e/modeB.e2e.spec.ts:102,125,132,205,325` (toolbar-visible proxy → context-line/ProcessHealthBar proxy + separate Process-tab assertion); delete the 3 toggle tests (`ProcessHealthBar.test.tsx:~280-303`).
- [ ] Implement; assert `framing-toolbar` testid absent on Explore + present on Process in BOTH apps (unit level).
- [ ] All suites + ui build + `pnpm --filter @variscout/core test`; commit `feat(chrome): framing toolbar is Process-tab canvas chrome; scroll layout is the only layout`.

### Task 5 — Skeletons + worker-backed stats (ui + both apps)

**Files:** NEW `packages/ui/src/components/ChartSkeleton/` (+ barrel): pulse placeholder per the NarrativeBar pattern (`bg-surface-tertiary rounded animate-pulse` — declared tokens), shaped as axis rail + plot band (not a spinner). `DashboardChartCard.tsx:180-181` + `FocusedChartCard.tsx:123`: optional `isLoading?: boolean` + a one-rAF mount gate (useState + requestAnimationFrame in useEffect) rendering the skeleton until `mounted && !isLoading` — the rAF gate is what guarantees a PAINTED skeleton before the synchronous chart render. Worker pass: change `useAnalysisStats()` → `useAnalysisStats(workerApi)` at the 4 call sites (PWA `Dashboard.tsx:180`, `charts/IChart.tsx:45`; Azure `Dashboard.tsx:262`, `charts/IChart.tsx:42` — `useStatsWorker` singleton already available in both apps); thread `isLoading={!stats || isComputing}` into the chart cards. This also makes the existing dim `isComputing` overlays genuinely paint (today the sync path batches true→false in one commit — they never render).

- [ ] Red: DashboardChartCard/FocusedChartCard render ChartSkeleton when `isLoading` or pre-rAF, children after (rAF mock + fake timers; happy-dom).
- [ ] Implement; WATCH the PWA Nelson-rules effect gating on `stats` (`Dashboard.tsx:600-630`) — stats now arrive async; re-run both app suites fully (timing-sensitive).
- [ ] Suites + ui build green; commit `feat(chrome): chart skeletons + worker-backed stats — no blank render windows`.

Out of scope (ER-10): passing chartWidth into useIChartData (LTTB revival — the duration fix). Out of scope (logged): keeping Dashboard mounted across tab switches (Activity/CSS-hide) — structural change, investigations entry in Task 6.

### Task 6 — ER-DOC: Apply-phase propagation

**Files:** `docs/03-features/workflows/analysis-flow.md`, `apps/pwa/CLAUDE.md`, `docs/ephemeral/investigations.md`, `docs/02-journeys/wireframes/index.md` (pointer check).

- [ ] `analysis-flow.md`: update the Anatomy section (lines ~31-39) to the two-row chrome + context line + scroll layout (vocabulary is ALREADY 5-verb — do not touch the capability-toggle content, that rewrite is ER-10's); add the canonical-wireframe pointer.
- [ ] `apps/pwa/CLAUDE.md`: additive chrome note (two-row contract; context line owns Time/Stages/Subgroup/Export lenses); fix the stale "Hosts the timeline-window picker" sentence (the Time lens now lives on the context line).
- [ ] `investigations.md`: mark sweep items 3 (blank render windows — skeletons + worker pass) and 9 (grid/scroll toggle — retired, scroll default) `[RESOLVED 2026-06-10 via ER-1]`; mark D1 (5 strips ≈205px) resolved via ER-1; new entry: "Dashboard remount on tab switch — recompute cost survives ER-1" (the Activity/CSS-hide option, deliberately not taken; skeletons cover feedback, ER-10 covers duration); note Azure .vrs export remains UI-less (status quo kept).
- [ ] Commit `docs(er-1): analysis-flow anatomy + pwa chrome note + investigations markers`.

### Final gate (constraints, not steps)

- [ ] `bash scripts/pr-ready-check.sh` green from the worktree (link this sub-plan from the master plan to satisfy the inbound-link gate).
- [ ] Both app test suites (already per task).
- [ ] `claude --chrome` walk vs the wireframe at 1440×900, BOTH apps: exactly two persistent chrome rows on Explore; `framing-toolbar` absent on Explore / present on Process; no ribbon anywhere; context line matches the wireframe's left/right composition; **measure the I-Chart plot band** (SVG inner rect) on current main first vs post-change — record both numbers in the PR, require ≥3× both apps; tab-return and maximize paint a skeleton within ~1 frame (no blank cards); every relocation-table row reachable (Factors(N) header-extra both apps, Export menu, Edit framing chip menu, Time/Stages/Subgroup lenses, Set-specs path, filter chips, Pin).
- [ ] Adversarial final review (Opus, whole branch).
- [ ] PR → `gh pr merge --merge --delete-branch`.
