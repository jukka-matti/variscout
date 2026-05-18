---
title: 'Internationalization Architecture'
description: 'ADR-025 i18n infrastructure — typed message catalogs + Intl APIs, lazy-loaded locales (English static, 32 dynamic)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_i18n.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-025 Internationalization Architecture delivered (Phase 0, 2026-03-17). Locale lazy loading added 2026-03-20.

**Why:** EU market expansion (DE/FR/ES/PT). German decimal separators broken with .toFixed(). Lazy loading: 33 static locale imports dominated bundle (~20,900 lines).

**How to apply:**
- `@variscout/core/i18n`: formatStatistic(), formatPercent(), formatDate(), formatInteger() — use instead of .toFixed()
- MessageCatalog interface with 33 locales, English static, 32 lazy-loaded via import.meta.glob
- `preloadLocale(locale)` / `isLocaleLoaded(locale)` — async load + sync check
- Sync API (getMessage, getMessages, formatMessage) falls back to English if locale not loaded
- useLocaleState: calls preloadLocale() before setting data-locale DOM attribute
- useTranslation: reads data-locale via MutationObserver (mirrors useChartTheme pattern)
- manualChunks in PWA + Azure vite configs produce `locale-*.js` chunks
- Service worker runtime-caches locale chunks (StaleWhileRevalidate)
- AI prompts stay English; AI response locale hint planned for future phase
- Phase 1 (future): replace .toFixed() → formatStatistic() across ~51 files
