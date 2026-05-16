#!/usr/bin/env node
// gen-arch.mjs — auto-generate docs/05-technical/architecture-generated.md
//
// Reads:
//   - packages/*/package.json + apps/*/package.json  → dependency graph (mermaid)
//   - packages/*/tsconfig.json + apps/*/tsconfig.json → sub-path export/path map
//   - apps/*/src/index.css                            → Tailwind @source directives
//
// Emits:
//   docs/05-technical/architecture-generated.md
//
// Usage: node scripts/docs/gen-arch.mjs
// Wire as: pnpm docs:gen-arch

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'docs', '05-technical', 'architecture-generated.md');

const today = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

/** List direct children of dir that are directories */
function subdirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => {
      try {
        return statSync(join(dir, entry)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((entry) => join(dir, entry));
}

// ---------------------------------------------------------------------------
// 1. Workspace discovery
// ---------------------------------------------------------------------------

const PACKAGE_DIRS = subdirs(join(ROOT, 'packages'));
const APP_DIRS = subdirs(join(ROOT, 'apps'));

// ---------------------------------------------------------------------------
// 2. Dependency graph
// ---------------------------------------------------------------------------

function buildDepGraph() {
  const nodes = [];
  for (const dir of [...PACKAGE_DIRS, ...APP_DIRS]) {
    const pkgJson = readJson(join(dir, 'package.json'));
    if (!pkgJson) continue;
    const name = pkgJson.name;
    if (!name) continue;

    const allDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
      ...pkgJson.peerDependencies,
    };

    const workspaceDeps = Object.keys(allDeps).filter((d) => d.startsWith('@variscout/'));
    const rel = relative(ROOT, dir);
    nodes.push({ name, rel, deps: workspaceDeps });
  }
  return nodes;
}

/** Convert @variscout/foo-bar → FooBar (safe mermaid node ID) */
function toNodeId(name) {
  return name
    .replace('@variscout/', '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function renderDepGraph(nodes) {
  const lines = ['graph LR'];

  const seen = new Set();
  for (const node of nodes) {
    const id = toNodeId(node.name);
    if (!seen.has(id)) {
      const label = node.name.replace('@variscout/', '');
      const isApp = node.rel.startsWith('apps/');
      const shape = isApp ? `["${label} (app)"]` : `["${label}"]`;
      lines.push(`  ${id}${shape}`);
      seen.add(id);
    }
  }

  lines.push('');

  const edgeSeen = new Set();
  for (const node of nodes) {
    const fromId = toNodeId(node.name);
    for (const dep of node.deps) {
      const toId = toNodeId(dep);
      const edgeKey = `${fromId}->${toId}`;
      if (!edgeSeen.has(edgeKey)) {
        lines.push(`  ${fromId} --> ${toId}`);
        edgeSeen.add(edgeKey);
      }
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 3. Sub-path export map
// ---------------------------------------------------------------------------

function buildExportMap() {
  const rows = [];
  for (const dir of [...PACKAGE_DIRS, ...APP_DIRS]) {
    const pkgJson = readJson(join(dir, 'package.json'));
    if (!pkgJson) continue;
    const name = pkgJson.name;
    if (!name) continue;

    const exportsField = pkgJson.exports ?? {};
    let exportKeys;
    if (typeof exportsField === 'string') {
      exportKeys = ['.'];
    } else {
      exportKeys = Object.keys(exportsField).sort();
    }

    const tsconfigPath = join(dir, 'tsconfig.json');
    const tsconfig = readJson(tsconfigPath);
    const pathKeys = Object.keys(tsconfig?.compilerOptions?.paths ?? {}).sort();

    if (exportKeys.length === 0 && pathKeys.length === 0) continue;

    rows.push({
      pkg: name,
      rel: relative(ROOT, dir),
      exports: exportKeys,
      paths: pathKeys,
    });
  }
  return rows;
}

function renderExportMap(rows) {
  const lines = [];
  lines.push('| Package | `package.json` exports | `tsconfig.json` paths |');
  lines.push('|---------|------------------------|----------------------|');

  for (const row of rows) {
    const exportsCell =
      row.exports.length > 0
        ? row.exports.map((e) => `\`${e}\``).join(', ')
        : '_(none)_';
    const pathsCell =
      row.paths.length > 0
        ? row.paths.map((p) => `\`${p}\``).join(', ')
        : '_(none)_';
    lines.push(`| \`${row.pkg}\` | ${exportsCell} | ${pathsCell} |`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 4. Tailwind @source coverage
// ---------------------------------------------------------------------------

const SOURCE_DIRECTIVE_RE = /@source\s+"([^"]+)"/g;

function buildTailwindMap() {
  const rows = [];
  for (const dir of APP_DIRS) {
    const cssPath = join(dir, 'src', 'index.css');
    const src = readText(cssPath);
    const appName = readJson(join(dir, 'package.json'))?.name ?? relative(ROOT, dir);
    const directives = [];
    if (src) {
      let match;
      const re = /@source\s+"([^"]+)"/g;
      while ((match = re.exec(src)) !== null) {
        directives.push(match[1]);
      }
    }
    rows.push({ app: appName, rel: relative(ROOT, dir), directives, hasCss: src !== null });
  }
  return rows;
}

function renderTailwindMap(rows) {
  const lines = [];
  lines.push('| App | `@source` directives in `src/index.css` |');
  lines.push('|-----|------------------------------------------|');

  for (const row of rows) {
    if (!row.hasCss || row.directives.length === 0) {
      const note = !row.hasCss ? '_(no src/index.css — not a Tailwind app)_' : '_(no @source directives)_';
      lines.push(`| \`${row.app}\` | ${note} |`);
    } else {
      const cell = row.directives.map((d) => `\`${d}\``).join('<br>');
      lines.push(`| \`${row.app}\` | ${cell} |`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 5. Assemble document
// ---------------------------------------------------------------------------

const depNodes = buildDepGraph();
const exportRows = buildExportMap();
const tailwindRows = buildTailwindMap();

const mermaidGraph = renderDepGraph(depNodes);
const exportTable = renderExportMap(exportRows);
const tailwindTable = renderTailwindMap(tailwindRows);

const doc = `---
title: 'Architecture (auto-generated)'
purpose: system
tier: living
audience: agent
topic: [architecture, generated]
status: active
last-verified: ${today}
---

> AUTO-GENERATED by \`pnpm docs:gen-arch\` — do not edit by hand. Regenerate after changing \`package.json#dependencies\`, \`tsconfig.json#paths\`, \`package.json#exports\`, or \`apps/*/src/index.css\` \`@source\` directives.

# Architecture (auto-generated)

Generated: ${today}. Source: \`scripts/docs/gen-arch.mjs\`.

---

## Workspace Dependency Graph

Internal workspace dependencies only (edges within the \`@variscout/*\` namespace). External npm dependencies omitted for clarity.

\`\`\`mermaid
${mermaidGraph}
\`\`\`

---

## Sub-Path Export Map

Sub-path exports declared in \`package.json#exports\` and corresponding TypeScript path aliases in \`tsconfig.json#compilerOptions.paths\`. These must be updated together — adding one without the other silently breaks imports. See \`.claude/INVARIANTS.md\` §Sub-path exports.

${exportTable}

---

## Tailwind v4 @source Coverage

Each app must declare \`@source\` directives for every shared package whose class names it uses. Missing a directive silently breaks Tailwind v4 responsive utilities. See \`.claude/INVARIANTS.md\` §\`@source\` directive.

${tailwindTable}
`;

writeFileSync(OUT, doc, 'utf8');
console.log(`docs:gen-arch: wrote ${OUT}`);
