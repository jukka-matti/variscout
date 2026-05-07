/**
 * Layer-boundary test for `packages/stores/src/`.
 *
 * Scope (locked per F4 spec D7): this test ONLY covers store files in
 * `packages/stores/src/`. Per-app feature stores under `apps/azure/src/features/`
 * and `apps/pwa/src/features/` are explicitly out of F4 scope and NOT enforced
 * here — those stores are allowed to mix layers per current architecture.
 *
 * STORE_LAYER enum has 6 values; today 4 are realised in code:
 *   - 'document' (projectStore, investigationStore, canvasStore)
 *   - 'annotation-per-project' (wallLayoutStore)
 *   - 'annotation-per-user' (preferencesStore)
 *   - 'view' (viewStore)
 * Reserved for future use (no test coverage today, intentional):
 *   - 'annotation-per-hub'
 *   - 'annotation-per-investigation'
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..');

const ALLOWED_LAYERS = [
  'document',
  'annotation-per-user',
  'annotation-per-project',
  'annotation-per-hub',
  'annotation-per-investigation',
  'view',
] as const;

interface StoreFile {
  filename: string;
  layer: (typeof ALLOWED_LAYERS)[number];
  source: string;
}

// Note: sessionStore.ts is excluded — it is deletion-pending in F4 Task 9
// and intentionally lacks STORE_LAYER. Once deleted, this comment becomes
// obsolete (no exclusion needed).
function loadStoreFiles(): StoreFile[] {
  const filenames = [
    'projectStore.ts',
    'investigationStore.ts',
    'canvasStore.ts',
    'wallLayoutStore.ts',
    'preferencesStore.ts',
    'viewStore.ts',
  ];
  return filenames.map(filename => {
    const path = resolve(SRC, filename);
    const source = readFileSync(path, 'utf-8');
    const match = source.match(/export\s+const\s+STORE_LAYER\s*=\s*'([^']+)'\s*as\s+const/);
    if (!match) throw new Error(`${filename}: missing STORE_LAYER export`);
    const layer = match[1] as (typeof ALLOWED_LAYERS)[number];
    if (!ALLOWED_LAYERS.includes(layer)) {
      throw new Error(`${filename}: STORE_LAYER='${layer}' not in allowed set`);
    }
    return { filename, layer, source };
  });
}

describe('layer boundary', () => {
  const files = loadStoreFiles();

  it('every store file declares STORE_LAYER from the allowed enum', () => {
    expect(files.length).toBeGreaterThan(0);
    files.forEach(f => {
      expect(ALLOWED_LAYERS).toContain(f.layer);
    });
  });

  it('view stores do NOT import persist from zustand/middleware', () => {
    files
      .filter(f => f.layer === 'view')
      .forEach(f => {
        expect(f.source).not.toMatch(
          /import\s+\{[^}]*\bpersist\b[^}]*\}\s+from\s+['"]zustand\/middleware['"]/
        );
      });
  });

  it('annotation-per-user stores DO import persist from zustand/middleware', () => {
    files
      .filter(f => f.layer === 'annotation-per-user')
      .forEach(f => {
        expect(f.source).toMatch(
          /import\s+\{[^}]*\bpersist\b[^}]*\}\s+from\s+['"]zustand\/middleware['"]/
        );
      });
  });

  it('document stores do NOT import persist from zustand/middleware', () => {
    files
      .filter(f => f.layer === 'document')
      .forEach(f => {
        expect(f.source).not.toMatch(
          /import\s+\{[^}]*\bpersist\b[^}]*\}\s+from\s+['"]zustand\/middleware['"]/
        );
      });
  });

  it('wallLayoutStore is the only annotation-per-project store and uses Dexie', () => {
    const annotationPerProject = files.filter(f => f.layer === 'annotation-per-project');
    expect(annotationPerProject).toHaveLength(1);
    expect(annotationPerProject[0].filename).toBe('wallLayoutStore.ts');
    expect(annotationPerProject[0].source).toMatch(/from\s+['"]dexie['"]/);
  });
});
