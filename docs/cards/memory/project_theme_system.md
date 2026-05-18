---
title: 'Theme System — Simplified Architecture'
description: 'Color system simplified 2026-03-19: removed company accent, executive chart mode, colorScheme pattern; 2 user options (theme + font scale)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_theme_system.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Color system simplified 2026-03-19 to reduce complexity while maintaining all user-facing functionality.

**Removed:**
- Company accent color (ACCENT_PRESETS, color picker, `--accent-hex` variable, hex→RGB conversion)
- Executive chart mode (`executiveColors`, `executiveChrome`, ~55 `isExecutive` conditionals in 6 chart files)
- colorScheme pattern from 5 priority components (CoScoutPanelBase, FindingsPanelBase, StatsPanelBase, ErrorBoundary, FilterContextBar)
- `packages/ui/src/colors.ts` (unused, deleted)

**User-facing options (2):**
- Theme (light/dark/system) — Settings toggle
- Chart font scale (compact/normal/large) — Settings toggle

**Architecture (3 layers):**
1. CSS tokens (theme.css) — ~20 semantic variables × 2 themes (light/dark)
2. Tailwind semantic classes — bg-surface, text-content, border-edge
3. Chart colors (colors.ts) — data colors (15 values), chrome colors (dark + light), operator/series palette (8)

**Why:** Quality professionals don't need accent customization or executive chart modes. The colorScheme pattern had 29 interfaces but 0 app-level overrides — semantic Tailwind classes already handle theming.

**How to apply:**
- `useChartTheme()` returns `{ isDark, chrome, colors, fontScale, locale, formatStat, formatPct }` — no `mode`
- `getChromeColors(isDark)` / `getChartColors()` — no `mode` parameter
- `ThemeConfig` has `mode` and `chartFontScale` — no `companyAccent`
- Remaining ~24 components still have colorScheme pattern — remove gradually as they're touched
- High-contrast mode planned for future (Teams certification requirement)
