/**
 * Layer-boundary test for `packages/stores/src/`.
 *
 * Scope (locked per F4 spec D7): this test ONLY covers store files in
 * `packages/stores/src/`. Per-app feature stores under `apps/azure/src/features/`
 * and `apps/pwa/src/features/` are explicitly out of F4 scope and NOT enforced
 * here — those stores are allowed to mix layers per current architecture.
 *
 * STORE_LAYER enum has 6 values; today 4 are realised in code:
 *   - 'document' (projectStore, analyzeStore, canvasStore, improvementProjectStore)
 *   - 'annotation-per-hub' (canvasViewportStore)
 *   - 'annotation-per-user' (preferencesStore, useProjectMembershipStore)
 *   - 'view' (viewStore, analysisScopeStore)
 * Reserved for future use (no test coverage today, intentional):
 *   - 'annotation-per-project'
 *   - 'annotation-per-investigation'
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
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

function hasStoreLayer(source: string): boolean {
  return /export\s+const\s+STORE_LAYER\s*=/.test(source);
}

function isStoreLike(source: string): boolean {
  return (
    /from\s+['"]zustand['"]/.test(source) || /export\s+const\s+use[A-Z]\w*Store\b/.test(source)
  );
}

function readSourceTypeScriptFiles(
  dir = SRC,
  prefix = ''
): Array<{ filename: string; source: string }> {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const filename = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '__tests__') return [];
        // R5a feature factories create app-local store instances but are not
        // canonical shared stores in the 10-store layer model.
        if (filename === 'feature-factories') return [];
        return readSourceTypeScriptFiles(path, filename);
      }

      if (!entry.isFile()) return [];
      if (!filename.endsWith('.ts')) return [];
      if (entry.name === 'index.ts') return [];
      if (filename.endsWith('.test.ts')) return [];
      if (filename.endsWith('.spec.ts')) return [];

      return [{ filename, source: readFileSync(path, 'utf-8') }];
    })
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function loadStoreFiles(): StoreFile[] {
  return readSourceTypeScriptFiles()
    .filter(file => {
      if (hasStoreLayer(file.source)) return true;
      if (isStoreLike(file.source)) {
        throw new Error(`${file.filename}: store-like source file missing STORE_LAYER export`);
      }
      return false;
    })
    .map(({ filename, source }) => {
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

  it('matches the ratified 9-store layer model', () => {
    expect(files).toHaveLength(9);
    expect(files.filter(f => f.layer === 'document')).toHaveLength(4);
    expect(files.filter(f => f.layer === 'annotation-per-hub')).toHaveLength(1);
    expect(files.filter(f => f.layer === 'annotation-per-user')).toHaveLength(2);
    expect(files.filter(f => f.layer === 'view')).toHaveLength(2);
  });

  it('view stores do NOT import any middleware from zustand/middleware', () => {
    // Stronger invariant for the View layer: a view store has zero reason to
    // touch zustand/middleware at all (no persist, no devtools, no immer). The
    // broad regex catches all of these — including a future aliased import like
    // `import { persist as p } from 'zustand/middleware'` which would slip past
    // a name-specific pattern. Document and annotation stores legitimately use
    // devtools / immer for canvasStore-style histories, so this strict form
    // applies ONLY to view stores.
    files
      .filter(f => f.layer === 'view')
      .forEach(f => {
        expect(f.source).not.toMatch(/from\s+['"]zustand\/middleware['"]/);
      });
  });

  it('persist-backed annotation-per-user stores DO import persist from zustand/middleware', () => {
    // Two valid persistence patterns for annotation-per-user stores:
    //   (a) Zustand `persist` middleware (preferencesStore)
    //   (b) Manual localStorage with per-user key (useProjectMembershipStore)
    // The manual pattern is required when persistence needs a per-user (or
    // per-user-and-hub) key that isn't known at store-construction time.
    const MANUAL_STORAGE_STORES = new Set(['useProjectMembershipStore.ts']);
    files
      .filter(f => f.layer === 'annotation-per-user' && !MANUAL_STORAGE_STORES.has(f.filename))
      .forEach(f => {
        expect(f.source).toMatch(
          /import\s+\{[^}]*\bpersist\b[^}]*\}\s+from\s+['"]zustand\/middleware['"]/
        );
      });
  });

  it('manual-localStorage annotation-per-user stores use per-key localStorage without Document-layer persistence', () => {
    const MANUAL_STORAGE_STORES = ['useProjectMembershipStore.ts'];
    MANUAL_STORAGE_STORES.forEach(filename => {
      const store = files.find(f => f.filename === filename);
      expect(store).toBeDefined();
      expect(store?.layer).toBe('annotation-per-user');
      expect(store?.source).toMatch(/\blocalStorage\b/);
      expect(store?.source).not.toMatch(/from\s+['"]dexie['"]/);
      expect(store?.source).not.toMatch(/HubAction|dispatch\(/);
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

  it('canvasViewportStore is the only annotation-per-hub store and uses Dexie', () => {
    const annotationPerHub = files.filter(f => f.layer === 'annotation-per-hub');
    expect(annotationPerHub).toHaveLength(1);
    expect(annotationPerHub[0].filename).toBe('canvasViewportStore.ts');
    expect(annotationPerHub[0].source).toMatch(/from\s+['"]dexie['"]/);
  });
});
