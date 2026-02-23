# Performance Mode

Performance Mode enables multi-channel analysis for comparing multiple measurement points simultaneously.

---

## Purpose

Analyze multiple measurement channels (fill heads, cavities, nozzles) in a single view:

- Compare Cpk across all channels
- Identify the worst performers
- Prioritize improvement efforts

---

## Use Cases

| Industry                | Channels            |
| ----------------------- | ------------------- |
| Filling                 | Multiple fill heads |
| Injection molding       | Multiple cavities   |
| Multi-spindle machining | Multiple spindles   |
| Packaging               | Multiple lanes      |

---

## Performance Charts

| Chart                  | Purpose                           |
| ---------------------- | --------------------------------- |
| Performance I-Chart    | Cpk scatter plot by channel       |
| Performance Boxplot    | Distribution comparison (max 5)   |
| Performance Pareto     | Cpk ranking, worst first (max 20) |
| Performance Capability | Single channel deep-dive          |

---

## Workflow

1. **Detect** - Auto-detect wide-format data with multiple measure columns
2. **Configure** - Select which columns are measurement channels
3. **Overview** - See all channels in Performance Pareto
4. **Drill** - Click worst performer to see details
5. **Analyze** - Use standard tools on filtered data

---

## Data Format

Performance Mode works with wide-format data:

```csv
Timestamp,Head1,Head2,Head3,Head4,Shift
2024-01-01,99.5,100.2,98.8,99.1,Day
2024-01-01,100.1,99.8,99.2,99.5,Day
...
```

---

## Props Pattern

All Performance charts accept:

```typescript
interface PerformanceChartProps {
  channels: ChannelResult[];
  selectedMeasure?: string;
  onChannelClick?: (channel: string) => void;
}
```

---

---

## Technical Reference

VariScout's implementation:

```typescript
// From @variscout/core
import { calculateChannelResults, classifyChannelHealth } from '@variscout/core';

const channels = calculateChannelResults(data, measureColumns, specs);
// Returns: ChannelResult[] with cpk, health classification per channel

// Health classification based on Cpk:
// - 'excellent': Cpk >= 1.67
// - 'good': Cpk >= 1.33
// - 'marginal': Cpk >= 1.0
// - 'poor': Cpk < 1.0
```

**Test coverage:** See `packages/core/src/__tests__/performance.test.ts`.

---

## See Also

- [Chart Design: Performance Mode](../../06-design-system/charts/performance-mode.md)
- [Capability Analysis](capability.md) - Single-channel capability concepts
- [Pareto](pareto.md) - Ranking pattern (Performance Pareto similar)
- [I-Chart](i-chart.md) - Time-series view (Performance I-Chart similar)
- [Feature Parity](../../08-products/feature-parity.md) - Platform availability
- [Glossary: Cpk](../../glossary.md#cpk)
