---
title: 'ADR-025: Internationalization Architecture'
---

# ADR-025: Internationalization Architecture

**Status**: Accepted

**Date**: 2026-03-17

## Context

VariScout targets EU markets (English/EU markets first). The primary expansion audience is German, French, Spanish, and Portuguese users. The codebase already has partial i18n:

- Glossary domain terms translated in 4 languages (`packages/core/src/glossary/locales/{de,es,fr,pt}.ts`)
- Website marketing copy in 5 languages (`apps/website/src/i18n/ui.ts`)

However, the apps have ~500-1000 hardcoded English strings and use `.toFixed()` everywhere, which produces incorrect output for German users (should be `1,33` not `1.23`).

We need an i18n architecture that:

1. Fixes number formatting immediately (highest value)
2. Enables incremental string extraction without big-bang refactor
3. Adds zero bundle cost
4. Enforces type safety (compile-time completeness checking)

## Decision

**Custom lightweight solution: typed message catalogs + native `Intl` APIs. No react-intl, no react-i18next.**

### Why not react-intl or react-i18next?

| Option                | Bundle    | Fit                                                            | Verdict |
| --------------------- | --------- | -------------------------------------------------------------- | ------- |
| react-intl (FormatJS) | ~40KB gz  | ICU MessageFormat overkill for labels                          | Skip    |
| react-i18next         | ~40KB gz  | Async loading adds no value (offline-first bundles everything) | Skip    |
| Custom + Intl API     | 0KB added | Mirrors proven theme pattern, TypeScript enforces completeness | **Use** |

### Architecture layers

1. **`@variscout/core/i18n`** — Pure formatting functions (`formatStatistic`, `formatPercent`, `formatDate`) wrapping `Intl.NumberFormat`/`Intl.DateTimeFormat`. Typed `MessageCatalog` interface with flat dot-notation keys. All locale catalogs as TypeScript files, tree-shaken by Vite.

2. **`useLocaleState`** (`@variscout/hooks`) — Follows `useThemeState` pattern exactly: localStorage persistence, `data-locale` DOM attribute, `document.lang` attribute, browser locale auto-detection.

3. **`useTranslation`** (`@variscout/hooks`) — Component-level hook reading `data-locale` via MutationObserver (same pattern as `useChartTheme`). No React Context dependency — works anywhere without provider wrapping. Returns `t()`, `formatNumber()`, `formatStat()`, `formatPct()`.

4. **`useChartTheme`** (`@variscout/charts`) — Extended to also read `data-locale`, exposing `locale` in return value for chart number formatting.

5. **`LocaleProvider`** — Thin context wrapper in each app (like `ThemeProvider`):
   - PWA: auto-detect only (`localeEnabled: false`)
   - Azure: user-selectable (`localeEnabled: true`)

### Message catalog design

Flat dot-notation keys organized by namespace:

- `stats.*`, `chart.*`, `limits.*`, `action.*`, `empty.*`, `error.*`, `settings.*`, `findings.*`, `report.*`, `data.*`

**Not translated** (industry standards): Cpk, Cp, UCL, LCL, USL, LSL, ANOVA, R², σ, η², p-values, mathematical notation, user data values, AI prompts to LLM.

### AI integration

- AI prompts to LLM stay English (best LLM performance)
- AI response language: add locale hint to system prompt when locale ≠ 'en'
- Glossary in CoScout context: existing `GlossaryLocale` system provides locale-aware terms

## Consequences

### Easier

- Number formatting is locale-correct with a single function call
- New translations are type-checked — missing keys are compile errors
- Zero bundle cost (native `Intl` APIs)
- Incremental migration — each component can adopt `useTranslation` independently
- Pattern is already proven (mirrors theme system exactly)

### Harder

- Message catalogs must be kept in sync across 5 languages
- No ICU MessageFormat for complex pluralization (acceptable — VariScout has minimal plural strings)
- Translation QA requires native speakers for each language

## Implementation

Phase 0 (this ADR): Infrastructure — types, formatters, message catalogs, hooks, providers. No visible changes.

Future phases:

1. Replace `.toFixed()` → `formatStatistic()` (~51 files)
2. Chart labels (SpecLimitLine, axes, legends — ~14 files)
3. Stats + Report components (StatsPanelBase, ReportKPIGrid, AnovaResults)
4. UI chrome strings (FindingsPanel, ColumnMapping, etc. — one PR per component family)
5. First non-English language (German `de.ts` catalog + QA)
