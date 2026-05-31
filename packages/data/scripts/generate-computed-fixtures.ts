import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { calculateBoxplotStats, calculateStats } from '@variscout/core';
import type { SpecLimits } from '@variscout/core';
import { SAMPLES } from '../src/samples';
import type {
  BoxplotGroup,
  ComputedChartData,
  IChartPoint,
  ParetoItem,
  PrecomputedStats,
} from '../src/types';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDir, '../src/computed/generated.ts');

function computeIChartData(data: Record<string, unknown>[], outcomeKey: string): IChartPoint[] {
  return data
    .map((row, index) => {
      const value = Number(row[outcomeKey]);
      if (Number.isNaN(value)) return null;
      return {
        x: index,
        y: value,
        originalIndex: index,
      };
    })
    .filter((point): point is IChartPoint => point !== null);
}

function computeBoxplotData(
  data: Record<string, unknown>[],
  outcomeKey: string,
  factorKey: string
): BoxplotGroup[] {
  const groups = new Map<string, number[]>();

  for (const row of data) {
    const factor = String(row[factorKey] ?? 'Unknown');
    const value = Number(row[outcomeKey]);
    if (Number.isNaN(value)) continue;

    const values = groups.get(factor) ?? [];
    values.push(value);
    groups.set(factor, values);
  }

  return Array.from(groups.entries()).flatMap(([key, values]) => {
    if (values.length === 0) return [];

    const stats = calculateBoxplotStats({ group: key, values });
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.length > 1
        ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
        : 0;

    return {
      key: stats.key,
      values: stats.values,
      min: stats.min,
      max: stats.max,
      q1: stats.q1,
      median: stats.median,
      q3: stats.q3,
      outliers: stats.outliers,
      mean,
      stdDev: Math.sqrt(variance),
    };
  });
}

function computeParetoData(data: Record<string, unknown>[], factorKey: string): ParetoItem[] {
  const counts = new Map<string, number>();

  for (const row of data) {
    const factor = String(row[factorKey] ?? 'Unknown');
    counts.set(factor, (counts.get(factor) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  let cumulative = 0;

  return sorted.map(([key, value]) => {
    cumulative += value;
    return {
      key,
      value,
      cumulative,
      cumulativePercentage: (cumulative / total) * 100,
    };
  });
}

function computeStats(
  data: Record<string, unknown>[],
  outcomeKey: string,
  specs: SpecLimits
): PrecomputedStats {
  const values = data.map(row => Number(row[outcomeKey])).filter(v => !Number.isNaN(v));

  if (values.length === 0) {
    return {
      n: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      sigmaWithin: 0,
      mrBar: 0,
      min: 0,
      max: 0,
      ucl: 0,
      lcl: 0,
      cp: undefined,
      cpk: undefined,
      outOfSpecPercentage: 0,
    };
  }

  const stats = calculateStats(values, specs.usl, specs.lsl);

  return {
    n: values.length,
    mean: stats.mean,
    median: stats.median,
    stdDev: stats.stdDev,
    sigmaWithin: stats.sigmaWithin,
    mrBar: stats.mrBar,
    min: Math.min(...values),
    max: Math.max(...values),
    ucl: stats.ucl,
    lcl: stats.lcl,
    cp: stats.cp,
    cpk: stats.cpk,
    outOfSpecPercentage: stats.outOfSpecPercentage,
  };
}

export function buildComputedFixtures(): Record<string, ComputedChartData> {
  return Object.fromEntries(
    SAMPLES.map(sample => {
      const { data, config } = sample;
      const { outcome, factors, specs } = config;

      return [
        sample.urlKey,
        {
          urlKey: sample.urlKey,
          ichartData: computeIChartData(data, outcome),
          boxplotData: factors.length > 0 ? computeBoxplotData(data, outcome, factors[0]) : [],
          paretoData: factors.length > 0 ? computeParetoData(data, factors[0]) : [],
          stats: computeStats(data, outcome, specs),
          specs,
        },
      ];
    }).sort(([a], [b]) => a.localeCompare(b))
  );
}

function serializePrimitive(value: string | number | boolean | null | undefined): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return String(value);
  if (Number.isNaN(value)) return 'Number.NaN';
  if (value === Number.POSITIVE_INFINITY) return 'Number.POSITIVE_INFINITY';
  if (value === Number.NEGATIVE_INFINITY) return 'Number.NEGATIVE_INFINITY';
  if (Object.is(value, -0)) return '-0';
  return String(value);
}

export function serializeTypeScriptLiteral(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return serializePrimitive(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(serializeTypeScriptLiteral).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${serializeTypeScriptLiteral(entry)}`)
      .join(',')}}`;
  }

  throw new Error(`Cannot serialize value of type ${typeof value}`);
}

export function renderComputedFixturesModule(fixtures: Record<string, ComputedChartData>): string {
  const entries = Object.entries(fixtures)
    .map(([key, fixture]) => `  ${JSON.stringify(key)}: ${serializeTypeScriptLiteral(fixture)},`)
    .join('\n');

  return `/**
 * AUTO-GENERATED by \`pnpm --filter @variscout/data generate:computed\`.
 * Do not edit by hand.
 */
import type { ComputedChartData } from '../types';

// prettier-ignore
export const COMPUTED_CHART_DATA_BY_KEY: Record<string, ComputedChartData> = {
${entries}
};
`;
}

async function writeComputedFixtures(): Promise<void> {
  const fixtures = buildComputedFixtures();
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderComputedFixturesModule(fixtures), 'utf8');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeComputedFixtures();
}
