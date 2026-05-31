import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
const srcRoot = path.join(packageRoot, 'src');

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return entry.name === '__tests__' ? [] : collectSourceFiles(fullPath);
      }
      return entry.isFile() && fullPath.endsWith('.ts') ? [fullPath] : [];
    })
  );
  return nested.flat();
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, entry) =>
    entry === undefined ? '__VARISCOUT_UNDEFINED__' : entry
  );
}

async function sampleFingerprint(): Promise<string> {
  vi.resetModules();
  const { SAMPLES } = await import('../samples');
  return createHash('sha256').update(stableStringify(SAMPLES)).digest('hex');
}

describe('@variscout/data deterministic sample guard', () => {
  it('does not use runtime nondeterminism APIs in source files', async () => {
    const files = await collectSourceFiles(srcRoot);
    const offenders: string[] = [];

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const relative = path.relative(packageRoot, file);
      if (/\bMath\.random\s*\(/.test(source)) offenders.push(`${relative}: Math.random()`);
      if (/\bDate\.now\s*\(/.test(source)) offenders.push(`${relative}: Date.now()`);
    }

    expect(offenders).toEqual([]);
  });

  it('produces identical sample fingerprints across fresh module loads', async () => {
    const first = await sampleFingerprint();
    const second = await sampleFingerprint();

    expect(second).toBe(first);
  }, 60_000);
});
