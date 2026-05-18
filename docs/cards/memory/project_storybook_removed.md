---
title: 'Storybook removed'
description: 'Storybook removed from VariScout in 2026-04-30 (PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: aecc3004-2a4e-4e7e-a02a-20d05d9da9ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_storybook_removed.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Storybook (root deps, `.storybook/`, 64 stories) was removed 2026-04-30 in PR #112 (squashed as `3f14b17a`, -3,572 lines net). No workspace package imported `@storybook/*`; removal was surgical.

**Why:** Stories were maintained as a *byproduct of component refactors*, not as a design driver — git log showed stories updated to follow component API changes, never the reverse. Solo-dev workflow uses `pnpm dev` + `claude --chrome` for component testing (higher fidelity than isolated stories). `@variscout/ui` is internal-only, not a published library, so no design-system showroom audience existed. Each dep upgrade (TS, Vite, React) paid a recurring Storybook peer-compat tax — Storybook 10.3.5 had already lagged on TS 5.8.

**A11y testing path forward:** If automated a11y checks are wanted back, use `@axe-core/playwright` in real E2E tests rather than `@storybook/addon-a11y` — same checks against real DOM/CSS instead of isolated stories.

**How to apply (broader rule):** Tools that are touched only as a *byproduct* of work in the codebase, not as *drivers* of work, are carrying weight. When evaluating dep / tool retention, check the git log for which direction the changes flow: tool-driven (commits add to the tool, then the tool drives feature work) vs byproduct (commits to the tool only happen because something else changed). Byproduct-only tools are removal candidates.

**Don't reintroduce Storybook** without a concrete driver use case (published component library, multi-team design system, dedicated visual regression workflow with Chromatic). None of these apply at current scale.
