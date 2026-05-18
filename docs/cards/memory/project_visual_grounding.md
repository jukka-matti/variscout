---
title: 'CoScout Visual Grounding'
description: 'ADR-057 — clickable REF markers in CoScout messages highlight chart elements with 3-phase glow'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_visual_grounding.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

CoScout visual grounding (ADR-057, Apr 2026) makes AI text references interactive.

**Why:** When CoScout says "Machine A shows high variation", the analyst had to manually scan charts. Now it's a clickable blue link that glows the chart element.

**How to apply:**
- `[REF:type:id]display text[/REF]` markers in CoScout output — parsed by `parseRefMarkers()` in `@variscout/core/ai`
- `useVisualGrounding` hook manages 3-phase lifecycle: glow (3s) → settled (10s) → clear
- `RefLink` component renders inline clickable links with Lucide icons
- `CoScoutMessages` auto-highlights first REF per message (100ms delay)
- `ActionProposalCard` auto-highlights tool targets on render
- Supported targets: boxplot, ichart, pareto, stats, yamazumi, finding, hypothesis, dashboard, improvement
- CSS: `.coscout-highlight` (glow) + `.coscout-highlight--settled` (faint border), theme-aware
- System prompt instructs CoScout to use 1-3 REF markers per message, sparingly
- `[REF:hypothesis:ID]` navigates to PI panel Questions tab (not old FindingsPanel)
- Blue (#3b82f6) reserved exclusively for visual grounding — distinct from spec colors
