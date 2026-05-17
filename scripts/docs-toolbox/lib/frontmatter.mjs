// Shared frontmatter parse for docs-toolbox scripts.
// Differs from check-doc-frontmatter.mjs: that one validates; this one
// returns {frontmatter, body, raw}. SoT for the parse shape.

import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

export function readDoc(absPath) {
  const raw = readFileSync(absPath, 'utf8');
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { frontmatter: {}, body: raw, raw };
  }
  const end = raw.indexOf('\n---', 4);
  if (end < 0) return { frontmatter: {}, body: raw, raw };
  const fmRaw = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  let frontmatter = {};
  try {
    frontmatter = parseYaml(fmRaw) ?? {};
  } catch {
    /* swallow — frontmatter validator catches these */
  }
  return { frontmatter, body, raw, fmRaw };
}

export function getDocId(absPath) {
  // Stable ID: basename without .md extension.
  const base = absPath.split('/').pop() ?? absPath;
  return base.endsWith('.md') ? base.slice(0, -3) : base;
}

export function getWikilinks(body) {
  // Match [[name]] (no spaces, no brackets-in-brackets).
  const out = [];
  const re = /\[\[([^\[\]\n]+?)\]\]/g;
  let m;
  while ((m = re.exec(body)) != null) {
    out.push(m[1].trim());
  }
  return [...new Set(out)];
}
