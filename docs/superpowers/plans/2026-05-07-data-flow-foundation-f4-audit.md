---
title: F4 audit — touch surface verified pre-implementation
audience: [engineer]
category: implementation-plan
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-three-layer-state.md
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
---

# F4 audit replay — 2026-05-07

## Step 1: useSessionStore consumer count

Command: `grep -rn "useSessionStore" apps packages --include="*.ts" --include="*.tsx" -l | sort`

**Result: 31 files total.**

Two are internal to the store package (`packages/stores/src/sessionStore.ts`, `packages/stores/src/index.ts`). External consumers: **29 files** (14 apps + 15 packages).

Prior spec §10 figures of 48/56 came from a different audit scope. 31 is the authoritative count. Spec §10 and plan Task 4 header updated.

Full list (29 external consumers):

```
apps/azure/src/components/ProjectDashboard.tsx
apps/azure/src/components/__tests__/ProjectDashboard.test.tsx
apps/azure/src/components/editor/CoScoutSection.tsx
apps/azure/src/components/editor/EditorDashboardView.tsx
apps/azure/src/components/editor/InvestigationWorkspace.tsx
apps/azure/src/components/settings/SettingsPanel.tsx
apps/azure/src/components/settings/__tests__/SettingsPanel.test.tsx
apps/azure/src/features/ai/useActionProposals.ts
apps/azure/src/features/findings/useFindingsOrchestration.ts
apps/azure/src/pages/Editor.tsx
apps/azure/src/pages/__tests__/Editor.test.tsx
apps/pwa/src/App.tsx
apps/pwa/src/components/__tests__/Dashboard.lensedSampleCount.test.tsx
apps/pwa/src/features/findings/__tests__/findingRestore.test.ts
packages/hooks/src/__tests__/findingSourceLensCapture.test.ts
packages/hooks/src/__tests__/setup.ts
packages/hooks/src/__tests__/timeLensWiring.test.ts
packages/hooks/src/__tests__/useLensedSampleCount.test.ts
packages/hooks/src/findingCreation.ts
packages/hooks/src/useAnalysisStats.ts
packages/hooks/src/useBoxplotData.ts
packages/hooks/src/useCoScoutProps.ts
packages/hooks/src/useIChartData.ts
packages/hooks/src/useLensedSampleCount.ts
packages/hooks/src/useParetoChartData.ts
packages/hooks/src/useProbabilityPlotData.ts
packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx
packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx
packages/stores/src/__tests__/sessionStore.test.ts
```

Note: `apps/azure/src/App.tsx` exists but does NOT contain `useSessionStore` — confirmed absent.

## Step 2: improvementStore production consumers outside stores package

Command: `grep -rn "useImprovementStore" apps packages --include="*.ts" --include="*.tsx" | grep -vE "packages/stores/src/"`

**Result: empty.** No external consumers. Task 6 (improvementStore deletion) scope is unchanged.

## Step 3: focusedQuestionId external consumers

Command: `grep -rn "useInvestigationStore.*focusedQuestionId|investigationStore\.focusedQuestionId" apps packages --include="*.ts" --include="*.tsx"`

**Result: 2 matches, both in `packages/stores/src/__tests__/investigationStore.test.ts`.**

No production consumers outside the store and its test. Task 7 scope is unchanged.

## Step 4: selectedPoints production consumers

Command: `grep -rn "useProjectStore.*selectedPoints|useProjectStore.*selectionIndexMap|setSelectedPoints|setSelectionIndexMap" apps packages --include="*.ts" --include="*.tsx" -l | sort -u`

**Result: 6 files** (4 production + 1 test + 1 store source):

```
apps/azure/src/components/Dashboard.tsx
apps/azure/src/components/charts/IChart.tsx
apps/pwa/src/components/Dashboard.tsx
apps/pwa/src/components/charts/IChart.tsx
packages/stores/src/__tests__/projectStore.test.ts
packages/stores/src/projectStore.ts
```

Exactly the expected 4 production files + test + store. Task 5 scope is unchanged.

## Conclusion

Plan touch-surface assumptions confirmed. Spec §10 consumer count updated (48 → 31 total / 29 external). Plan Task 4 header updated to reflect confirmed file list. No new files to add; no tasks change scope.
