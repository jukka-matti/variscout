---
tier: ephemeral
purpose: build
title: Projects Tab Plan 4 — Report Tab IP-Scoped V1
audience: human
category: implementation
status: active
last-reviewed: 2026-05-15
related:
  - docs/archive/specs/2026-05-14-projects-tab-design.md
layer: spec
---

# Projects Tab Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Plan 4 of the Projects tab redesign: IP-scoped Report Overview/Technical modes, free-roaming Hub portfolio, PDF export, and final decision-log closure.

**Architecture:** Keep domain logic pure and shared: report scope selection and narrative derivation live in `@variscout/core`, presentational report pieces live in `@variscout/ui`, and PWA/Azure wrappers only pass app state and callbacks. Existing active-IP Zustand state remains annotation-per-user; Report reads scope but does not persist document changes.

**Tech Stack:** TypeScript, React, Zustand domain stores, `@variscout/charts`, Vitest, Playwright, pnpm/turbo.

---

### Task 1: Shared Report Scope + Narrative Selectors

**Files:**

- Create: `packages/core/src/report/ipReport.ts`
- Create: `packages/core/src/report/__tests__/ipReport.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json` if adding a subpath export is needed

- [ ] Write failing tests for `selectIPReportScope`, `deriveIPReportNarrative`, `deriveIPCauseRows`, and `deriveHubPortfolioReport`.
- [ ] Implement selectors as pure functions with explicit inputs: `ImprovementProject`, `Hypothesis[]`, `Finding[]`, `Question[]`, `SustainmentRecord[]`, `ControlHandoff[]`, and optional `ProcessHub`.
- [ ] Ensure D13 section titles are exported verbatim and in order.
- [ ] Ensure Hub portfolio uses capability distributions when outcome specs/units differ; do not compute cross-IP mean Cpk in heterogeneous groups.
- [ ] Run `pnpm --filter @variscout/core test -- ipReport`.

### Task 2: Report Mini-Chart Selector

**Files:**

- Modify: `packages/core/src/findings/miniChart.ts`
- Modify: `packages/core/src/findings/index.ts`
- Create or modify: `packages/core/src/findings/__tests__/miniChart.test.ts`
- Modify: `packages/hooks/src/useMiniChartData.ts`
- Modify: `packages/hooks/src/__tests__/useMiniChartData.test.ts`

- [ ] Write failing tests for the Plan 4 chart-type tags: `ichart-factor-target-band`, `boxplot-by-subgroup`, `capability-histogram`, and `ichart-outcome-target-band`.
- [ ] Add `deriveIPReportMiniChartType(...)` as a pure table-driven selector over IP factor controls, hypothesis condition, linked findings, and outcome.
- [ ] Extract hook data shaping into `buildMiniChartData(config, rows)` while preserving existing `useMiniChartData` API.
- [ ] Run targeted core/hooks mini-chart tests.

### Task 3: Report Shell + Audience Toggle

**Files:**

- Modify: `packages/hooks/src/useReportSections.ts`
- Modify: `packages/hooks/src/__tests__/useReportSections.test.ts`
- Modify: `packages/ui/src/components/ReportView/ReportViewBase.tsx`
- Modify: `packages/ui/src/components/ReportView/__tests__/ReportViewBase.test.tsx`
- Modify: `packages/core/src/i18n/messages/en.ts`

- [ ] Write failing tests for `Overview` / `Technical` visible labels, `Reporting on:` header text, PDF action, and paid share-link gate.
- [ ] Extend `AudienceMode` to `overview | technical` for the new Report flow while preserving compatibility for legacy report consumers.
- [ ] Update `ReportViewBase` to accept `reportingOnLabel`, `reportAudienceMode`, `onReportAudienceModeChange`, and optional share-link gate props.
- [ ] Keep controls marked with `data-export-hide`; keep Report sections print-safe.
- [ ] Run targeted hooks/ui tests.

### Task 4: IP Overview Report UI

**Files:**

- Create: `packages/ui/src/components/ReportView/IPOverviewReport.tsx`
- Create: `packages/ui/src/components/ReportView/__tests__/IPOverviewReport.test.tsx`
- Modify: `packages/ui/src/components/ReportView/index.ts`

- [ ] Write failing tests that render all 7 D13 section headings verbatim.
- [ ] Render Executive summary, Where we started, What we aimed for, What we found + what we did, Did it work?, What we standardized + learned, and What's next.
- [ ] Render per-suspected-cause cards using `deriveIPCauseRows` and mini-chart tags; do not implement V1.1 chart customization.
- [ ] Include negative learnings from refuted hypotheses in "What we standardized + learned".
- [ ] Avoid methodology jargon and banned terms in visible UI strings.

### Task 5: Technical Report + Hub Portfolio UI

**Files:**

- Create: `packages/ui/src/components/ReportView/IPTechnicalReport.tsx`
- Create: `packages/ui/src/components/ReportView/HubPortfolioReport.tsx`
- Create tests under `packages/ui/src/components/ReportView/__tests__/`
- Modify: `packages/ui/src/components/ReportView/index.ts`

- [ ] Write failing tests for the §7.3 methodology footnote verbatim and Hub portfolio free-roaming headings.
- [ ] Render 7-10 technical chart slots using existing `@variscout/charts` components only; fall back to empty states when chart inputs are missing.
- [ ] Render Hub portfolio rows with status, day counter, last activity, drift/cadence signals, and distribution summaries.
- [ ] Ensure portfolio mode has no QC-story narrative arc.

### Task 6: PWA + Azure Wiring and Free-Roaming Semantics

**Files:**

- Modify: `apps/pwa/src/components/views/ReportView.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/hooks/useActiveIPContext.ts`
- Modify: `apps/azure/src/components/views/ReportView.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/hooks/useActiveIPContext.ts`
- Add or modify app-level tests near existing report/active-IP tests

- [ ] Write failing tests that clearing active IP stays free-roaming even in a one-IP hub.
- [ ] Pass active IP, full Hub project/sustainment/handoff lists, hypotheses, and report callbacks into ReportView wrappers.
- [ ] Render IP Overview/Technical when scoped; render Hub portfolio when free-roaming.
- [ ] Preserve active-IP scope when chart click-through opens Analyze.
- [ ] Implement PDF filename format `[Hub]-[IP-title]-[Overview|Technical]-[YYYY-MM-DD].pdf`.
- [ ] Keep Azure share-link control inside Report surface and paid-gated; defer signed public URL if not already trivial.

### Task 7: E2E, Docs Closure, and PR Prep

**Files:**

- Modify: `apps/pwa/e2e/active-ip-cascade.spec.ts`
- Modify fixture: `apps/pwa/e2e/fixtures/active-ip-hub.vrs` only if required for approved suspected-cause + sustainment coverage
- Modify: `docs/decision-log.md` after merge readiness

- [ ] Add E2E happy path: pick IP, open Report Overview, switch Technical, Exit IP, see Hub portfolio.
- [ ] Run `pnpm --filter @variscout/core test`, targeted hooks/ui/app tests, `pnpm build`, `pnpm docs:check`, and `bash scripts/pr-ready-check.sh`.
- [ ] Run PWA Playwright report happy path against `active-ip-hub.vrs`.
- [ ] Start app and perform visual walkthrough for Overview, Technical, and Hub portfolio.
- [ ] Dispatch final code-review subagent with STEP 0 checkout of `projects-tab-pt-9-report`.
- [ ] Commit, open PR-PT-9, squash-merge when green, add decision-log completion entry, and remove `.worktrees/projects-tab-pt-plan4`.
