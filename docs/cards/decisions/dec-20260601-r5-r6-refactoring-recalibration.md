---
title: 'R5/R6 refactoring recalibration: thin adapters before document persistence'
purpose: decide
tier: card
status: active
date: 2026-06-01
topic: ['decisions', 'refactoring', 'persistence', 'document-snapshot']
verified-against-commit: fe1b0755
last-verified: 2026-06-01
supersedes: []
---

> **Decision card** — captures the post-PR #277 refactoring roadmap rationale. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# R5/R6 refactoring recalibration: thin adapters before document persistence

Spec edit: recalibrate the refactoring roadmap and persistence architecture docs after R6c.

R5 deliberately stayed thin. The PWA/Azure surfaces had real duplication, but the surrounding app behavior also carried intentional capability policy: Azure owns cloud sync, access, AI, repository adapters, and richer shell behavior while PWA owns local training/browser workflows. The shipped R5 slices therefore extracted construction helpers and lifecycle/action wiring without unifying app shells or moving repository ownership out of `apps/*`.

R6 became the persistence boundary because `DocumentSnapshot` is now the shared unit for portable documents, PWA `.vrs` export/import, and Azure local/cloud project persistence. R6d narrowed the PWA contract to export-only durable persistence: no browser save slot, saved-document list, or reload-from-browser promise. A snapshot is hub-scoped: quick-analysis hubs may carry no formal Project, formalized hubs carry one live `ImprovementProject`, and the multi-hub `projectsById` mirror is not serialized.

Old `.vrs` compatibility was dropped before launch. The product has no external file population to preserve, and keeping the pre-R6 `AnalysisState`/hub/rawData branches would have made save/load behavior harder to reason about just as access-aware Azure persistence was being introduced. The current `.vrs` envelope is snapshot-only: `kind: "variscout.document"`, `version: 1`, optional metadata, and `documentSnapshot`.

R7-R9 are horizons, not committed PR sequences. R7 should revisit store/domain model cleanup only after save semantics settle. R8 should revisit shell/surface convergence only after fresh evidence shows app-specific behavior is accidental. R9 should harden Azure operations, security, compliance, and launch assurance after R6d/R6e define the save and access contracts.

_Pinned 2026-06-01._
