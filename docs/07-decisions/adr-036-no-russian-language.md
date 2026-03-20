---
title: 'ADR-036: No Russian Language Support'
---

# ADR-036: No Russian Language Support

**Status**: Accepted

**Date**: 2026-03-20

## Context

VariScout is a quality analysis tool targeting EU manufacturing and engineering markets. As part of
product positioning, the team has established a design principle: **VariScout does not support the
Russian language**.

This is an intentional, deliberate decision — not a gap or oversight. Russian was previously
scaffolded as part of the broad 33-locale i18n expansion (ADR-025), but inclusion was premature and
inconsistent with the product's target audience and values.

## Decision

Russian (`ru`) is removed from the supported locale set:

- The `Locale` type union no longer includes `'ru'`
- `LOCALES` array no longer includes `'ru'`
- `LOCALE_NAMES` record no longer maps `'ru'`
- The BCP47 mapping `ru → ru-RU` is removed from the formatting utilities
- The Russian message catalog (`messages/ru.ts`) is deleted

Russian-speaking users whose browser language is detected as `ru` or `ru-*` will fall back to
English, following the standard `detectLocale()` fallback chain.

## Design Principle

> **VariScout does not support the Russian language.**

This applies to:
- UI localization (message catalogs, translated strings)
- Browser language auto-detection
- Number/date formatting via `Intl` APIs
- AI response locale hints (CoScout will not be instructed to respond in Russian)
- Any future language selector UI

This principle does **not** affect Ukrainian (`uk`), which remains a fully supported locale.

## Consequences

- 32 supported locales (down from 33)
- Russian-browser users see English UI
- Removes ~5 KB lazy-loaded chunk from the production bundle
- Maintains type safety — TypeScript enforces the exhaustive `Record<Locale, string>` pattern,
  so all locale maps stay consistent after removal
