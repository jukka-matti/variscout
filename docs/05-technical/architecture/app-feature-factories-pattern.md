---
tier: living
purpose: system
title: 'App-Feature Factories — the thin-adapter pattern (R5)'
audience: both
status: active
date: 2026-06-02
last-verified: 2026-06-02
verified-against-commit: 851a9ba4
layer: L4
topic: [architecture, stores, hooks, pwa, azure, refactoring]
related:
  - docs/superpowers/plans/2026-05-31-refactoring-roadmap.md
  - packages/stores/CLAUDE.md
  - packages/hooks/CLAUDE.md
---

# App-Feature Factories — the thin-adapter pattern (R5)

PWA and Azure share a lot of feature-store construction but diverge on real capability. R5 (PRs #270–#274) split that into **two layers** so the _accidental_ duplication is extracted while the _intentional_ delta stays app-owned:

- **Shared, stateless factories/hooks** in `@variscout/stores/feature-factories` + `@variscout/hooks` build the byte-identical construction + lifecycle models.
- **Apps own the singletons + adapters + capability policy** under `apps/*/src/features/`.

A factory is stateless; each app instantiates its own singleton and re-exports the types/helpers.

## The three categories

| Category                          | Shared helper                                                                                                           | App-owned                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Store factories** (R5a)         | `createAnalyzeFeatureStore()`, `createFindingsFeatureStore()`, `buildIdeaImpacts()`                                     | the singleton wrapper (`const useAnalyzeFeatureStore = createAnalyzeFeatureStore()`) |
| **Pure builders** (R5c)           | `createActionItem` / `createProjectActionItem` / `createStepQuickActionItem` in `@variscout/core/findings/factories.ts` | dispatch/persistence wrappers                                                        |
| **Lifecycle hooks** (R5b/R5d/R5e) | `useStoreDataIngestionActions`, `useControlPanelModel`, `useImprovementProjectPanelModel` (`@variscout/hooks`)          | repositories + panel rendering + row limits                                          |

## Shared vs app-owned — the dividing line

The **accidental delta** (duplicated small store factories + repeated action wiring) is what R5 extracts. The **intentional delta** is _capability policy_ and stays app-specific (roadmap decision note, `docs/superpowers/plans/2026-05-31-refactoring-roadmap.md:142–143`): Azure carries share/popout/navigation/AI + inline What-If; PWA is simpler local wiring.

**Example:** both apps call `createAnalyzeFeatureStore()`, but Azure's `useAnalyzeOrchestration.handleProjectIdea` takes an `inline?: boolean` (embedded What-If in the left panel) that the PWA signature omits (no What-If embed in the free tier) — same factory, different capability.

## Boundary rule

Factories are exported **only via the `@variscout/stores/feature-factories` subpath**, never re-exported from the root barrel — enforced by a package test (`packages/stores/src/feature-factories/__tests__/featureFactories.test.ts`). Do not add app-feature factories to the root `@variscout/stores` index.

## See also

- `packages/stores/CLAUDE.md` · `packages/hooks/CLAUDE.md` — the package-level anchors.
- [refactoring roadmap §R5](../../superpowers/plans/2026-05-31-refactoring-roadmap.md) — the R5a–R5e slices + the accidental-vs-intentional-delta rationale.
