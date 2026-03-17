# @variscout/core

Pure logic package for VariScout — no React dependencies.

## Installation

```json
{
  "dependencies": {
    "@variscout/core": "workspace:*"
  }
}
```

## Modules

| Export Path                  | Description                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@variscout/core`            | Main entry (types, utilities)                                                                                                                                                        |
| `@variscout/core/stats`      | Statistics engine (13 domain modules: basic, anova, boxplot, conformance, distributions, interaction, kde, modelReduction, multiRegression, nelson, probability, regression, staged) |
| `@variscout/core/parser`     | CSV/Excel parsing, validation, keyword detection                                                                                                                                     |
| `@variscout/core/tier`       | Tier configuration (`getTier()`, `isPaidTier()`, channel limits)                                                                                                                     |
| `@variscout/core/navigation` | Navigation types and utilities                                                                                                                                                       |
| `@variscout/core/glossary`   | Glossary terms (~20), concepts (~15), unified knowledge lookup                                                                                                                       |
| `@variscout/core/export`     | Data export utilities                                                                                                                                                                |
| `@variscout/core/responsive` | Responsive breakpoint utilities                                                                                                                                                      |

## Key Files

| File                        | Purpose                                                     |
| --------------------------- | ----------------------------------------------------------- |
| `src/stats/index.ts`        | Statistics barrel (mean, Cp, Cpk, ANOVA, KDE, Nelson rules) |
| `src/parser.ts`             | CSV/Excel parsing with column detection                     |
| `src/tier.ts`               | License tier system (free/individual/team/enterprise)       |
| `src/types.ts`              | Shared TypeScript interfaces                                |
| `src/navigation.ts`         | Filter stack, breadcrumb types                              |
| `src/glossary/terms.ts`     | Glossary content                                            |
| `src/glossary/concepts.ts`  | Methodology concepts (Four Lenses, phases)                  |
| `src/glossary/knowledge.ts` | Unified lookup (getEntry, getRelated)                       |
| `src/ai/`                   | AI context builder, prompt templates, insight builders      |
| `src/variation/`            | Variation decomposition, What-If simulation                 |
| `src/preview.ts`            | Preview feature registry                                    |
| `src/utils/exifStrip.ts`    | Byte-level EXIF/GPS metadata stripping                      |

## Testing

```bash
pnpm --filter @variscout/core test
```

## Related

- [Hooks Package](../hooks/README.md)
- [Charts Package](../charts/README.md)
