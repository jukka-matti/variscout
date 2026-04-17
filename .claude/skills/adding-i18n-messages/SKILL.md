---
name: adding-i18n-messages
description: Use when adding user-facing strings or new translation keys. Apps call registerLocaleLoaders() at startup, typed message catalogs in packages/core/src/i18n/messages/, Intl API for formatting, no string concatenation (use formatMessage with parameters). Tests must register their own loaders via import.meta.glob.
---

# Adding i18n Messages

## When this skill applies

- Adding any user-facing string to a component
- Adding a new translation key to `MessageCatalog`
- Supporting a new locale
- Using a statistical value in display (must use `formatStatistic`, not `.toFixed()`)

## Locale loader registration

Apps call `registerLocaleLoaders()` **once at startup** before any `preloadLocale()` call. Core never calls `import.meta.glob` directly — the app provides the bundler-specific loader map.

Registration point is the app's `main.tsx`:

```ts
import { registerLocaleLoaders } from '@variscout/core';
import type { MessageCatalog } from '@variscout/core';

registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);
```

English is statically bundled (zero-delay fallback). All other locales are lazy-loaded on demand.

## Typed message catalogs

Catalogs live at `packages/core/src/i18n/messages/{locale}.ts` (e.g., `en.ts`, `de.ts`, `zhHans.ts`).

The `MessageCatalog` interface in `packages/core/src/i18n/types.ts` is the source of truth. Every locale file must satisfy the full interface — the TypeScript compiler enforces this. English (`en.ts`) is the baseline; all 32 locale files must contain every key.

To add a new key:

1. Add the property to `MessageCatalog` in `types.ts`.
2. Add the English string to `messages/en.ts`.
3. Add translated strings to **all** other locale files (`messages/*.ts`). Missing keys cause a type error at build time.

Chinese variants use filename aliases: `zh-Hans` → `zhHans.ts`, `zh-Hant` → `zhHant.ts`.

## Formatting

Use `formatMessage()` for parameterised strings with `{placeholder}` substitution:

```ts
import { formatMessage } from '@variscout/core/i18n';

// Catalog key: 'data.rowsLoaded': '{count} rows loaded'
formatMessage(locale, 'data.rowsLoaded', { count: 150 });
// => "150 rows loaded" (en), "150 Zeilen geladen" (de)
```

Use `getMessage()` for plain (non-parameterised) strings:

```ts
import { getMessage } from '@variscout/core/i18n';
getMessage(locale, 'stats.mean'); // => "Mean" / "Mittelwert" / "平均"
```

**Never concatenate translated substrings.** RTL languages, plurals, and gender agreement require the full sentence to be a single catalog key with `{placeholder}` slots.

## Test setup

Tests that use translations must call `registerLocaleLoaders()` **before** `preloadLocale()`. Without this, the loader map is empty, preload silently falls back to English, and locale-specific assertions pass with wrong output.

Reference pattern from `packages/core/src/i18n/__tests__/index.test.ts`:

```ts
import { registerLocaleLoaders, preloadLocale } from '@variscout/core/i18n';
import type { MessageCatalog } from '@variscout/core';
import { LOCALES } from '@variscout/core/i18n';

// Register BEFORE any preload calls
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>('../messages/*.ts', { eager: false })
);

beforeAll(async () => {
  await Promise.all(LOCALES.map(l => preloadLocale(l)));
});
```

Alternatively, use `registerLocale(locale, catalog)` to inject a catalog directly (useful for unit tests that only need one locale).

## Adding a locale

1. Create `packages/core/src/i18n/messages/{locale}.ts` implementing the full `MessageCatalog` interface.
2. Add the locale to `Locale` union and `LOCALES` array in `types.ts`.
3. Add the BCP47 tag to the `BCP47` map in `format.ts`.
4. Add the human-readable name to `LOCALE_NAMES` in `types.ts`.
5. No changes needed to app `registerLocaleLoaders` globs — the `*.ts` glob picks up new files automatically.

Chinese script variants (`zh-Hans`, `zh-Hant`) use the `LOCALE_TO_FILENAME` map in `index.ts` to resolve filenames (`zhHans.ts`, `zhHant.ts`). Norwegian `no` resolves to `nb`.

## formatStatistic()

`formatStatistic()` is part of `@variscout/core/i18n`. Use it for every statistical value displayed in UI or passed to SVG `<text>` elements.

```ts
import { formatStatistic } from '@variscout/core/i18n';

formatStatistic(1.3333, locale, 2); // "1.33" (en), "1,33" (de)
formatStatistic(NaN);               // "—"  (safe fallback)
```

**Never call `.toFixed()` on statistical values in UI or AI prompt code.** `.toFixed()` always produces English decimal separators and throws on `NaN`/`Infinity`. The only acceptable use of `.toFixed()` is internal computation strings guarded with `Number.isFinite()`.

Also available: `formatPercent()` (fraction 0–1 → locale percent string), `formatInteger()` (thousands separator), `formatDate()`.

## Gotchas

- **Forgetting `registerLocaleLoaders()` before `preloadLocale()` in tests** — loader map is empty, all locales silently fall back to English, locale assertions pass with wrong output. Always call `registerLocaleLoaders` at the top of the test file, outside `beforeAll`.

- **Concatenating translated substrings** — `getMessage(locale, 'prefix') + value + getMessage(locale, 'suffix')` breaks RTL layout and plural/gender agreement. Use a single parameterised key with `{placeholder}` slots.

- **Adding a key to only one locale** — `MessageCatalog` is a concrete interface; missing properties are a TypeScript error. Add the key to `types.ts` **and** every locale file in the same commit.

- **Using `.toFixed()` instead of `formatStatistic()`** — produces English-only output, crashes on `NaN`/`Infinity`, and is caught by the ADR-069 ESLint rule. Use `formatStatistic()`.

- **Hardcoding strings in components** — strings that bypass the catalog cannot be translated and cannot be audited for consistency. Every user-facing string must be a catalog key.

## Reference

- ADR-025: `docs/07-decisions/adr-025-internationalization.md`
- i18n module: `packages/core/src/i18n/`
- Test pattern: `packages/core/src/i18n/__tests__/index.test.ts`
- Format utilities: `packages/core/src/i18n/format.ts`
- Catalog interface: `packages/core/src/i18n/types.ts`
