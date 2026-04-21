---
title: 'System Limits'
audience: [developer]
category: implementation
status: stable
---

# System Limits

Comprehensive reference for VariScout's data handling limits, classification thresholds, and display boundaries. All computation runs in-browser JavaScript with no server offload.

## Data Import Limits

| Constraint     | Value                          | Location              | Behavior                                                                                     |
| -------------- | ------------------------------ | --------------------- | -------------------------------------------------------------------------------------------- |
| Row hard limit | 50,000 (PWA) / 250,000 (Azure) | `useDataIngestion.ts` | Alert shown, upload rejected. Configurable via `DataIngestionConfig.rowHardLimit`            |
| Row warning    | 5,000 (PWA) / 100,000 (Azure)  | `useDataIngestion.ts` | Confirm dialog, user can proceed. Configurable via `DataIngestionConfig.rowWarningThreshold` |

### Mobile Row Limits (ADR-039)

Mobile devices use lower limits to prevent memory and computation issues on constrained hardware:

| Platform | Desktop Hard Limit | Desktop Warning | Mobile Hard Limit | Mobile Warning |
| -------- | ------------------ | --------------- | ----------------- | -------------- |
| PWA      | 50,000 rows        | 5,000 rows      | 10,000 rows       | 2,000 rows     |
| Azure    | 250,000 rows       | 100,000 rows    | 50,000 rows       | 10,000 rows    |

Mobile detection uses `useIsMobile(640)` in app-level `useDataIngestion` wrappers. The limits are passed as `DataIngestionConfig` overrides — the hook itself is unchanged.

| Constraint                    | Value                 | Location                    | Behavior                                          |
| ----------------------------- | --------------------- | --------------------------- | ------------------------------------------------- |
| Column limit                  | None enforced         | —                           | All columns loaded                                |
| Auto-detected factors         | 3 suggested           | `parser.ts detectColumns()` | `.slice(0, 3)` default suggestion                 |
| Max selectable factors        | 3 (PWA) / 6 (Azure)   | `ColumnMapping`             | Configurable via `maxFactors` prop                |
| Factor change during analysis | Both (PWA 3, Azure 6) | ColumnMapping `mode='edit'` | "Factors" button in nav bar reopens ColumnMapping |

## Categorical Classification

Two thresholds govern whether a string column becomes a selectable factor:

| Threshold                | Value            | Location                      | Purpose                                                                     |
| ------------------------ | ---------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Parser categorical limit | 50 unique values | `parser.ts analyzeColumn()`   | Columns with >50 unique strings classified as `'text'`, excluded as factors |
| Hook categorical limit   | 10 unique values | `useColumnClassification.ts`  | Default for UI factor selection (configurable via `maxCategoricalUnique`)   |
| Stage columns limit      | 10 unique values | `useAvailableStageColumns.ts` | Staged analysis column filtering                                            |

**Design intent:** The parser threshold (50) determines what _could_ be a factor. The hook threshold (10) determines what _should_ be offered by default in the UI. Columns with 11-50 unique values are loaded into the data model but not surfaced as factors unless the threshold is customized.

## Analysis Display Limits

| Chart               | Max Items     | Location                 | Behavior                                                   |
| ------------------- | ------------- | ------------------------ | ---------------------------------------------------------- |
| Performance Boxplot | 5 channels    | `PerformanceBoxplot.tsx` | Shows top 5                                                |
| Performance Pareto  | 20 channels   | `PerformancePareto.tsx`  | Shows top 20                                               |
| Standard Pareto     | No hard limit | `ParetoChart.tsx`        | All groups rendered (bounded by 50-value parser threshold) |
| Standard Boxplot    | No hard limit | `Boxplot.tsx`            | All groups rendered                                        |
| AnovaResults groups | No hard limit | `AnovaResults.tsx`       | All groups shown inline                                    |

## Performance Mode

| Constraint              | Value | Location  |
| ----------------------- | ----- | --------- |
| Enterprise max channels | 1,500 | `tier.ts` |
| Channel warning         | 700   | `tier.ts` |
| Free tier max channels  | 5     | `tier.ts` |

## Realistic Scenario Guidance

What VariScout handles well vs. what requires data pre-aggregation:

| Scenario                                                 | Rows    | Factor Cardinality | Works?                                                                                                    |
| -------------------------------------------------------- | ------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| Single production line, 3 shifts, weekly data for 1 year | ~1,000  | Shift(3), Week(52) | Yes — within all limits. Week column classified as categorical (<=50 unique).                             |
| Pharma fill line, 12 heads, 3 shifts, 1 month            | ~10,000 | Head(12), Shift(3) | Yes — smooth. Both factors well within thresholds.                                                        |
| Multi-SKU packaging, 200 products, daily data            | ~5,000  | Product(200)       | Partially — products classified as `'text'` (>50 unique). Pre-filter to top 20-50 products before import. |
| Supplier quality, 500 suppliers                          | ~10,000 | Supplier(500)      | No direct drill — supplier column excluded. Aggregate by supplier group/region first.                     |
| High-frequency sensor data, 1 reading/sec for 8 hours    | 28,800  | Time-based         | Works for stats, but time column treated as numeric not categorical.                                      |
| Large production dataset (Azure)                         | 200,000 | Head(12), Shift(3) | Azure only — 250K row limit accommodates larger datasets.                                                 |

## Browser Memory

- IndexedDB quotas are browser-dependent (Chrome 60% of disk, Firefox 50%, Safari 1GB)
- All computation is in-browser JavaScript — no server offload
- PWA: 50K rows x 20 columns x ~100 bytes/cell = ~100MB working memory — well within modern browser limits
- Azure: 250K rows x 20 columns x ~100 bytes/cell = ~500MB working memory — acceptable for desktop browsers
- Boxplot uses iterative min/max (no spread operator) to avoid stack-overflow with large outlier arrays

## Worker Transfer Optimization

Stats and ANOVA computation run in a Web Worker via Comlink. For large datasets (100K+ rows),
the data transfer cost from main thread to Worker becomes significant when using structured clone.

VariScout uses Transferable ArrayBuffers (`Float64Array`) for zero-copy transfer of numeric arrays
to the Worker. This makes transfer cost constant (<10ms) regardless of dataset size, compared to
~180ms at 250K rows with structured clone.

- `useAsyncStats` converts values to `Float64Array` and uses `Comlink.transfer()`
- `useDashboardComputedData` transfers ANOVA outcome values the same way
- Factor values (strings) are still cloned — only `ArrayBuffer` supports zero-copy
- The Worker converts `Float64Array` back to `number[]` for d3/KDE compatibility
