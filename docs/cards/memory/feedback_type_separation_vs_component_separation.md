---
title: 'Type-level separation ≠ component-level separation'
description: 'When a spec separates data types (Hub-level vs investigation-level), don''t automatically extrapolate that to parallel UI components — especially when the vision designates one of them as the center piece'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 7b1995be-e8dd-4879-840d-e8f08d98b8e0
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_type_separation_vs_component_separation.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a spec separates two data layers at the **type** level (e.g., framing-layer slice-1 D1: `OutcomeSpec` is new, `AnalysisBrief` stays separate), do NOT automatically read that as a mandate to build **parallel UI components**. The type separation prevents conflated data models; it does not require parallel surfaces. If the product vision designates one layer as the center piece (e.g., "Hub is the center piece"), the natural UI shape is **one canonical surface** that operates on the central layer, with the other layer as a special case (mode flag) of the same component.

**Why:** I caught myself proposing a new `HubStage3Mapping` orchestrator alongside the existing 782-line `ColumnMapping` because slice-1 D1 separated `OutcomeSpec` from `AnalysisBrief`. The user pushed back: *"our vision is to have the hub as the center piece, right? so for me the refactoring something sounded better?"* They were right. Hub-as-center-piece means column-mapping IS Hub-mapping; investigation re-edit is the special case (post-creation tweak of what the Hub declared), not a parallel concept. The slice-1 plan even foreshadowed the refactor: *"the slice-2 refactor will populate outcomes / primaryScopeDimensions from the new Stage 3 mapping rows."* Building a sibling component would have left two near-identical orchestrators behind, violating `feedback_no_backcompat_clean_architecture` (parallel surfaces) and `feedback_bundle_followups_pre_merge` (perpetual cleanup debt).

**How to apply:** Before splitting a UI surface to mirror a type-level separation, ask: which layer does the product vision center? Refactor the central-layer surface to be canonical; treat the other layer as a `mode='edit'`-style branch of the same component, not a parallel sibling. Migrate consumers in the same PR (no compat shim). The "two types, one component" pattern preserves the type-level invariant the spec required while honoring vision-level centrality. Also: when a slice-1 plan tail says "the slice-N refactor will...", that's a refactor, not a new-build — read it literally.
