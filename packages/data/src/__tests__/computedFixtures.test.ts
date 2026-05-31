import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getCachedComputedData, getComputedData } from '../computed';
import { COMPUTED_CHART_DATA_BY_KEY } from '../computed/generated';
import { SAMPLES } from '../samples';
import {
  buildComputedFixtures,
  serializeTypeScriptLiteral,
} from '../../scripts/generate-computed-fixtures';

const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');

describe('@variscout/data static computed fixtures', () => {
  it('has exactly one computed fixture for every sample urlKey', () => {
    const sampleKeys = SAMPLES.map(sample => sample.urlKey).sort();
    const uniqueSampleKeys = Array.from(new Set(sampleKeys));
    const fixtureKeys = Object.keys(COMPUTED_CHART_DATA_BY_KEY).sort();

    expect(sampleKeys).toEqual(uniqueSampleKeys);
    expect(fixtureKeys).toEqual(sampleKeys);
  });

  it('matches the generator output', () => {
    expect(serializeTypeScriptLiteral(COMPUTED_CHART_DATA_BY_KEY)).toBe(
      serializeTypeScriptLiteral(buildComputedFixtures())
    );
  });

  it('keeps lookup APIs stable and does not export runtime compute helpers', async () => {
    const firstSample = SAMPLES[0];
    const computed = getComputedData(firstSample.urlKey);

    expect(computed).toEqual(COMPUTED_CHART_DATA_BY_KEY[firstSample.urlKey]);
    expect(getCachedComputedData(firstSample.urlKey)).toBe(computed);
    expect(getCachedComputedData('missing-sample')).toBeUndefined();

    const publicExports = await import('../computed');
    expect(Object.keys(publicExports).sort()).toEqual(['getCachedComputedData', 'getComputedData']);
  });

  it('keeps runtime computed modules lookup-only', async () => {
    const computedDir = path.join(packageRoot, 'src/computed');
    const files = (await readdir(computedDir)).filter(file => file.endsWith('.ts'));

    for (const file of files) {
      const source = await readFile(path.join(computedDir, file), 'utf8');

      expect(source, file).not.toMatch(/@variscout\/core/);
      expect(source, file).not.toMatch(/from\s+['"]\.\.\/samples['"]/);
      expect(source, file).not.toMatch(/\bgetSample\b/);
      expect(source, file).not.toMatch(/\bcalculate[A-Z]\w*\b/);
      expect(source, file).not.toMatch(/\bcompute(?:IChart|Boxplot|Pareto|Stats)\b/);
      expect(source, file).not.toMatch(/\bMath\./);
    }
  });
});
