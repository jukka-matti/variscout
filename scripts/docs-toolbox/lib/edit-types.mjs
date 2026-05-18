// Parses decision-log.md entries + recognizes the canonical edit-type vocabulary.
// Used by check-doc-frontmatter.mjs --diff (T2) and docs-toolbox/recent.mjs (T3).
// SoT: docs/agent-context/doc-discipline.md §Standard entry format.

import { EDIT_TYPES } from '../../docs-frontmatter-schema.mjs';

// Decision-log entries look like:
//   - YYYY-MM-DD — <title>. <edit-type>: <doc>#<section> [supersedes <prior>].
//     Why: <reason>. Commit: <sha>. PR: #N. Related: [[id]].
// We detect entries by leading "- YYYY-MM-DD — " (optionally with **bold** wrapper)
// and parse the edit-type from the body of the leading line.

const ENTRY_HEADER_RE = /^-\s*\*?\*?(\d{4}-\d{2}-\d{2})\*?\*?\s+—\s+(.*?)\.\s*(.*)/;
const EDIT_TYPE_RE = new RegExp(
  String.raw`\`?(${EDIT_TYPES.map((t) => t.replace(/ /g, String.raw`\s+`)).join('|')})\`?\s*:`,
);

export function parseEntry(line) {
  const m = ENTRY_HEADER_RE.exec(line);
  if (!m) return null;
  const [, date, title, rest] = m;
  const editTypeMatch = EDIT_TYPE_RE.exec(rest);
  return {
    date,
    title,
    editType: editTypeMatch ? editTypeMatch[1].replace(/\s+/g, ' ') : null,
    rest,
    raw: line,
  };
}

export function isEntryHeaderLine(line) {
  return ENTRY_HEADER_RE.test(line);
}

export function isCanonicalEditType(s) {
  return EDIT_TYPES.includes(s);
}

export { EDIT_TYPES };
