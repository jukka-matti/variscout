import { useMemo } from 'react';
import {
  deriveMiniChartConfig,
  type MiniChartConfig,
  type ColumnTypeMap,
} from '@variscout/core/findings';
import type { Hypothesis } from '@variscout/core/findings';

export interface MiniChartData {
  kind: MiniChartConfig['kind'];
  factor?: string;
  outcome?: string;
  reason?: string;
  values?: number[];
  groups?: Array<{ category: string; values: number[] }>;
}

export function useMiniChartData(
  hypothesis: Hypothesis,
  rows: ReadonlyArray<Record<string, unknown>>,
  columnTypes: ColumnTypeMap,
  outcome: string | undefined | null
): MiniChartData {
  return useMemo(() => {
    const cfg = deriveMiniChartConfig(hypothesis, columnTypes, outcome ?? undefined);
    if (cfg.kind === 'placeholder') {
      return { kind: 'placeholder', factor: cfg.factor, reason: cfg.reason };
    }
    if (cfg.kind === 'i-chart') {
      const values: number[] = [];
      for (const row of rows) {
        const v = Number(row[cfg.factor]);
        if (Number.isFinite(v)) values.push(v);
      }
      return { kind: 'i-chart', factor: cfg.factor, outcome: cfg.outcome, values };
    }
    // boxplot
    const map = new Map<string, number[]>();
    for (const row of rows) {
      const cat = row[cfg.factor];
      const yVal = Number(row[cfg.outcome]);
      if (cat == null || !Number.isFinite(yVal)) continue;
      const key = String(cat);
      const arr = map.get(key);
      if (arr) arr.push(yVal);
      else map.set(key, [yVal]);
    }
    const groups = Array.from(map.entries())
      .map(([category, values]) => ({ category, values }))
      .sort((a, b) => a.category.localeCompare(b.category));
    return { kind: 'boxplot', factor: cfg.factor, outcome: cfg.outcome, groups };
  }, [hypothesis, rows, columnTypes, outcome]);
}
