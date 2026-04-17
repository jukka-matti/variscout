---
title: Sub-Path Exports
audience: [developer]
category: architecture
status: stable
related: [core-package, tree-shaking, bounded-contexts]
---

# Sub-Path Exports

## Why Sub-Path Exports?

`@variscout/core` provides 18 sub-path imports alongside the root barrel. This design serves three purposes:

1. **Tree-shaking**: `import { calculateStats } from '@variscout/core/stats'` only pulls in statistics code, not AI prompts or parser logic
2. **Explicit dependencies**: Import paths declare which domain a module depends on
3. **Bounded contexts**: Each sub-path represents a domain boundary within the core package

## How It Works

The `exports` field in `packages/core/package.json` maps import paths to source files:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./stats": "./src/stats/index.ts",
    "./ai": "./src/ai/index.ts",
    "./findings": "./src/findings/index.ts",
    ...
  }
}
```

When a consumer writes `import { Finding } from '@variscout/core/findings'`, the bundler (Vite) resolves this to `packages/core/src/findings/index.ts` using the exports map. No tsconfig paths or aliases needed — this is standard Node.js package resolution.

## Current Sub-Paths (18)

| Sub-Path                          | Module              | Key Exports                                                               |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `@variscout/core`                 | Root barrel         | Everything (backwards compatible)                                         |
| `@variscout/core/stats`           | stats/              | calculateStats, calculateAnova, calculateBoxplotStats, calculateKDE, lttb |
| `@variscout/core/ai`              | ai/                 | responsesApi, buildAIContext, actionTools, chartInsights                  |
| `@variscout/core/parser`          | parser/             | parseText, detectColumns, validateData                                    |
| `@variscout/core/findings`        | findings/           | Finding types, factories, helpers, migration                              |
| `@variscout/core/variation`       | variation/          | Variation tracking, simulation, suggestions                               |
| `@variscout/core/yamazumi`        | yamazumi/           | Yamazumi aggregation, classification, detection                           |
| `@variscout/core/export`          | export.ts           | CSV export, PDF metadata                                                  |
| `@variscout/core/tier`            | tier.ts             | configureTier, getTier, isPaidTier, feature gates                         |
| `@variscout/core/types`           | types.ts            | All TypeScript domain types                                               |
| `@variscout/core/navigation`      | navigation.ts       | Navigation utilities                                                      |
| `@variscout/core/glossary`        | glossary/           | Knowledge model, term definitions                                         |
| `@variscout/core/responsive`      | responsive.ts       | getResponsiveMargins, getResponsiveFonts, getResponsiveTickCount          |
| `@variscout/core/i18n`            | i18n/               | registerLocaleLoaders, preloadLocale, getMessage, formatMessage           |
| `@variscout/core/performance`     | performance.ts      | Multi-measure performance analysis                                        |
| `@variscout/core/time`            | time.ts             | Time column detection and extraction                                      |
| `@variscout/core/projectMetadata` | projectMetadata.ts  | Project metadata computation                                              |
| `@variscout/core/strategy`        | analysisStrategy.ts | resolveMode, getStrategy, AnalysisModeStrategy (ADR-047)                  |

## When to Use Sub-Paths vs Root

**Use sub-paths when:**

- You need only one domain (e.g., just statistics, just parsing)
- You're in a package that should declare minimal dependencies
- Bundle size matters (app code)

**Use root barrel when:**

- You need types from multiple domains
- You're writing tests that touch many areas
- Convenience outweighs precision

## When to Add a New Sub-Path

Add a new sub-path when:

1. A new domain emerges with 3+ exports that are logically cohesive
2. The domain has clear boundaries (doesn't cross-reference other domains heavily)
3. Consumers would benefit from importing just this domain

**Steps:**

1. Create `src/{domain}/index.ts` (or `src/{domain}.ts` for single-file modules)
2. Add to `exports` in `packages/core/package.json`
3. Add to the Sub-Path Exports table in `.claude/skills/editing-monorepo-structure/SKILL.md`
4. Verify: `pnpm --filter @variscout/core build` (if applicable)

## Related

- [Monorepo Rules](../../../.claude/skills/editing-monorepo-structure/SKILL.md) — Sub-path table maintained here
- [ADR-045: Modular Architecture](../../07-decisions/adr-045-modular-architecture.md) — DDD-lite philosophy
