---
title: 'Docs Strategy 2026 — Phase 2 (Discipline + Toolbox + Alignment) Implementation Plan'
status: active
date: 2026-05-17
purpose: build
tier: ephemeral
audience: agent
topic: [docs-strategy, validator, toolbox, ax]
related:
  - 2026-05-16-docs-strategy-design
  - 2026-05-16-docs-strategy-memo
  - adr-083-eight-purpose-doc-taxonomy
layer: spec
---

# Docs Strategy 2026 — Phase 2 (Discipline + Toolbox + Alignment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mechanically enforce SSoT-by-doc-type discipline (validator extensions) and ship the docs-toolbox retrieval surface (6 scripts + skill + llms.txt router), plus an alignment pass on stale-refs PR #199 didn't catch.

**Architecture:** Extend `scripts/check-doc-frontmatter.mjs` with filename glob + body banner + git-diff-based checks. Build `scripts/docs-toolbox/*.mjs` operating on the current FLAT corpus (no cards yet — that's Phase 3). Ship `.claude/skills/docs-toolbox/SKILL.md`. Rewrite `docs/llms.txt` from a static catalog to a router. Discipline rules come from `docs/agent-context/doc-discipline.md`; the validator is the mechanical half of that doc.

**Tech Stack:** Node.js (`*.mjs` ESM scripts), the `yaml` parser (already a dep), `execFileSync` (no shell — never `exec`/`execSync` with template strings) for any `git` invocation, ripgrep for find/recent, markdown frontmatter via `--- ... ---` block parsing.

---

## Context (for the implementer)

This is Phase 2 of the docs-strategy-2026 initiative. Phase 1 (PR #199) shipped:

- 8 purposes × 4 tiers schema collapse (ADR-083 → `scripts/docs-frontmatter-schema.mjs`)
- 5 STATUS canonical values (`draft, active, named-future, superseded, archived`)
- `docs/agent-context/doc-discipline.md` — the canonical SSoT-by-doc-type rules (read before implementing)
- 4 Tier 1 agent-context skills under `.claude/skills/`
- The strategy spec at `docs/superpowers/specs/2026-05-16-docs-strategy-design.md`

Phase 2 is the **mechanical half** — the validator that enforces what the discipline doc describes, plus the retrieval surface that lets agents query the corpus. Phase 3 (substrate restructure + atomic cards) and Phase 4 (steward loop + telemetry) come later.

The **wedge-amendment incident (2026-05-17)** is the motivating failure: a side-amendment spec was created (`2026-05-16-improve-tab-amendment-design.md`), forking canonical state without a banner on the parent. Convention alone didn't prevent this. The validator does.

## Worktree

Phase 2 ships from `.claude/worktrees/docs-strategy-2026-discipline` (branch `docs-strategy-2026-discipline`, created from `origin/main` before this plan's execution). All commits land on that branch; one PR at the end.

## Pre-existing scar tissue

One file matches the new HARD-FAIL anti-pattern glob:

- `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md` — status: draft. Documents the wedge V1 Improve-tab restoration. The content is now incorporated into the canonical wedge spec (`2026-05-16-wedge-architecture-design.md`); this side file is the violation the discipline was created to prevent.

**T1 archives this file** to `docs/archive/specs/2026-05-16-improve-tab-amendment-design.md` with a `🗄 Archived` banner pointing at the canonical wedge spec. The filename keeps matching the regex but the scope (`docs/superpowers/specs/` only) means the anti-pattern check no longer fires once the file moves to `docs/archive/`.

Any dangling references to the old path need fixing in T1 — the implementer must `git grep` for the old path and update links. Known refs:

- `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` (the wedge spec itself references the amendment in its banner)
- `docs/llms.txt` (mentions the amendment in the canonical V1 design entry)
- `docs/07-decisions/adr-082-wedge-architecture.md` (amendment banner)
- Possibly others — `git grep -l 'improve-tab-amendment-design'` reveals them all.

## Discipline to dogfood

This plan is itself subject to the discipline it's enforcing. While implementing:

- **DO NOT** create new `*-amendment-*.md` files — edit canonical specs in place + decision-log entry instead.
- **DO** add reader-first banners where appropriate (the validator script itself gets a comment header explaining the rules).
- **DO** log material spec/strategy changes to `docs/decision-log.md` per the discipline doc.

## Shell-safety convention

Every shell-out in scripts/ MUST use `execFileSync('cmd', [...args])` from `node:child_process`. Never `execSync` with a template-string command, never `exec()`. `execFile` doesn't go through a shell, so no command injection risk and no quoting hazards.

---

## File Structure

### Created files

- `scripts/docs-toolbox/find.mjs` — ripgrep + frontmatter filter
- `scripts/docs-toolbox/get.mjs` — full doc by id or path
- `scripts/docs-toolbox/related.mjs` — graph traversal via `related:` + body `[[name]]`
- `scripts/docs-toolbox/recent.mjs` — new docs + decision-log entries since date
- `scripts/docs-toolbox/verify.mjs` — bump `last-verified` + `verified-against-commit`
- `scripts/docs-toolbox/amend.mjs` — append `## Amendment` block to ADRs (HARD-FAILs on design specs)
- `scripts/docs-toolbox/lib/frontmatter.mjs` — shared frontmatter parse/mutate helpers
- `scripts/docs-toolbox/lib/edit-types.mjs` — canonical edit-type vocabulary + decision-log entry parser
- `.docs-discipline-allowlist` — empty allowlist file with header comment explaining usage
- `.claude/skills/docs-toolbox/SKILL.md` — auto-trigger description + tool surface + task kits

### Modified files

- `scripts/check-doc-frontmatter.mjs` — add filename HARD-FAIL + banner checks (T1) + `--diff` mode + decision-log + edit-type checks (T2)
- `scripts/docs-frontmatter-schema.mjs` — export `ANTI_PATTERN_FILENAME_RE`, `BANNER_REGEX`, `EDIT_TYPES` constants (single SoT for the validator)
- `package.json` — add `docs:find / docs:get / docs:related / docs:recent / docs:verify / docs:amend` scripts
- `docs/llms.txt` — rewrite from static catalog → router
- `docs/01-vision/coscout-ax-design.md` — extend § Persona + Voice with 3-user-persona clarification (T6)
- `.claude/skills/agent-context-quickstart/SKILL.md` — fix stale 6-tab ref (T6)
- `docs/decision-log.md` — append entries per T1, T2, T5, T6 spec edits (one entry per material change)

### Moved (archived)

- `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md` → `docs/archive/specs/2026-05-16-improve-tab-amendment-design.md` (with archived banner; T1)

---

## Right-sizing

Per `feedback_subagent_driven_default` + commit `bb296898`:

| Task         | Model      | Reason                                                                  |
| ------------ | ---------- | ----------------------------------------------------------------------- |
| T1           | **Sonnet** | Well-specified script extension + one scar-tissue file move (1-2 files) |
| T2           | **Sonnet** | Same script + diff-mode addition (1 file + 1 helper)                    |
| T3           | **Sonnet** | 4 new self-contained scripts, conventional shape                        |
| T4           | **Sonnet** | 2 new self-contained scripts, frontmatter mutation                      |
| T5           | **Sonnet** | One SKILL.md + one llms.txt rewrite — content authoring, no code        |
| T6           | **Sonnet** | 3 doc edits in canonical homes, low judgment density                    |
| Final review | **Opus**   | Cross-task integration check + dogfood verification                     |

Each task gets a fresh Sonnet implementer + Sonnet spec reviewer + Sonnet quality reviewer (two-stage review). Final pass is one Opus reviewer over the whole branch before PR.

---

## Task 1 — Validator: anti-pattern filenames + banner enforcement

**Files:**

- Modify: `scripts/check-doc-frontmatter.mjs`
- Modify: `scripts/docs-frontmatter-schema.mjs` (add exported constants)
- Create: `.docs-discipline-allowlist` (root)
- Move: `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md` → `docs/archive/specs/2026-05-16-improve-tab-amendment-design.md` (with banner + frontmatter update)
- Modify: `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` (fix dangling ref)
- Modify: `docs/llms.txt` (fix dangling ref)
- Modify: `docs/07-decisions/adr-082-wedge-architecture.md` (fix dangling ref)
- Modify: `docs/decision-log.md` (append entry per discipline)

- [ ] **Step 1.1: Read context.** Read these in order so the rules are clear:
  1. `docs/agent-context/doc-discipline.md` — full discipline rules (esp. §"Reader-first banners" and §"Enforcement")
  2. `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` §2.7 — design rationale
  3. `scripts/check-doc-frontmatter.mjs` — current validator (you're extending it)
  4. `scripts/docs-frontmatter-schema.mjs` — current schema exports

- [ ] **Step 1.2: Verify scar-tissue scope.** Run `find docs/superpowers/specs -name "*-amendment-*.md" -o -name "*-revision-*.md" -o -name "*-update-*.md" -o -name "*-followup-*.md"`. The only match should be `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md`. If anything else surfaces, stop and ask — the plan assumed exactly one file.

- [ ] **Step 1.3: Add constants to `scripts/docs-frontmatter-schema.mjs`.** Append to the file (do NOT replace existing exports):

```js
// === Doc-discipline constants (Phase 2 — Play 2b) ===
// Loaded by check-doc-frontmatter.mjs; kept here so the validator + toolbox
// scripts share a single source of truth.

// Anti-pattern filename glob: forbidden under docs/superpowers/specs/.
// (Archive dir is exempt because the file is no longer canonical-claimant.)
export const ANTI_PATTERN_FILENAME_RE = /(-amendment-|-revision-|-update-|-followup-).*\.md$/;
export const ANTI_PATTERN_SCOPE_PREFIX = 'docs/superpowers/specs/';

// Banner-presence checks: lenient regex against first BANNER_BODY_LINES of body.
// Matches markdown blockquote lines that mention the status keyword.
export const BANNER_BODY_LINES = 15;
export const SUPERSEDED_BANNER_RE = /^>.*\b(SUPERSEDED|Superseded|superseded)\b/m;
export const ARCHIVED_BANNER_RE = /^>.*\b(ARCHIVED|Archived|archived)\b/m;
export const DELIVERED_BANNER_RE = /^>.*\b(Delivered|DELIVERED|delivered)\b/m;

// Canonical edit-type vocabulary for decision-log entries (consumed by T2 + T3).
// Match exactly (case-sensitive) per discipline doc.
export const EDIT_TYPES = [
  'spec edit',
  'ADR amendment',
  'new ADR',
  'supersession',
  'archived',
  'new spec',
];
```

- [ ] **Step 1.4: Add allowlist loader + filename check to `check-doc-frontmatter.mjs`.** Insert the new imports near the top:

```js
import {
  // ...existing imports...
  ANTI_PATTERN_FILENAME_RE,
  ANTI_PATTERN_SCOPE_PREFIX,
  SUPERSEDED_BANNER_RE,
  ARCHIVED_BANNER_RE,
  DELIVERED_BANNER_RE,
  BANNER_BODY_LINES,
} from './docs-frontmatter-schema.mjs';

// === Allowlist loader ===
// .docs-discipline-allowlist at repo root. One path per line; # comments skipped.
// Listed paths are exempt from the filename + banner checks.

function loadAllowlist() {
  const file = join(ROOT, '.docs-discipline-allowlist');
  try {
    const src = readFileSync(file, 'utf8');
    const set = new Set();
    for (const raw of src.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      set.add(line);
    }
    return set;
  } catch {
    return new Set();
  }
}

const ALLOWLIST = loadAllowlist();
```

Add to the `violations` object:

```js
const violations = {
  // ...existing entries...
  antiPatternFilename: [],
  missingSupersededBanner: [],
  missingSupersedesBanner: [],
};
```

Add the `extractBodyHead` helper near `extractFrontmatter`:

```js
function extractBodyHead(src, lineCount) {
  // Skip frontmatter block; return first lineCount lines of body, joined.
  let body = src;
  if (src.startsWith('---\n') || src.startsWith('---\r\n')) {
    const end = src.indexOf('\n---', 4);
    if (end >= 0) body = src.slice(end + 4); // past trailing '\n'
  }
  return body.split('\n').slice(0, lineCount).join('\n');
}
```

In `check(file)`, add the filename + banner checks. Filename check goes before the missingFrontmatter early-return; banner checks go after the enum loop:

```js
function check(file) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf8');

  // Anti-pattern filename HARD-FAIL (skip if allowlisted). Runs first because
  // it doesn't depend on frontmatter being present.
  if (
    rel.startsWith(ANTI_PATTERN_SCOPE_PREFIX) &&
    ANTI_PATTERN_FILENAME_RE.test(rel) &&
    !ALLOWLIST.has(rel)
  ) {
    violations.antiPatternFilename.push(
      `${rel}: anti-pattern filename. Edit the canonical spec in place + add a decision-log entry. See docs/agent-context/doc-discipline.md §Anti-patterns. If genuinely intentional (rare), add the path to .docs-discipline-allowlist with rationale.`
    );
    // Don't return — still validate the rest so the implementer sees all issues at once.
  }

  // ...existing parse logic + required-fields + enum loop...

  // Banner checks (skip if allowlisted).
  if (!ALLOWLIST.has(rel)) {
    const bodyHead = extractBodyHead(src, BANNER_BODY_LINES);
    if (fm.status === 'superseded' && !SUPERSEDED_BANNER_RE.test(bodyHead)) {
      violations.missingSupersededBanner.push(
        `${rel}: status=superseded but no '> SUPERSEDED ...' banner in first ${BANNER_BODY_LINES} body lines. See docs/agent-context/doc-discipline.md §Reader-first banners.`
      );
    }
    if (fm.status === 'archived' && !ARCHIVED_BANNER_RE.test(bodyHead)) {
      violations.missingSupersededBanner.push(
        `${rel}: status=archived but no '> ARCHIVED ...' banner in first ${BANNER_BODY_LINES} body lines.`
      );
    }
    const supersedesList = asArray(fm.supersedes).filter(Boolean);
    if (supersedesList.length > 0) {
      const head = bodyHead.toLowerCase();
      const mentionsSupersedeWord = /\b(supersede|replaces|successor of)\b/.test(head);
      const mentionsPredecessor = supersedesList.some(id =>
        head.includes(String(id).toLowerCase())
      );
      if (!mentionsSupersedeWord && !mentionsPredecessor) {
        violations.missingSupersedesBanner.push(
          `${rel}: supersedes:[${supersedesList.join(', ')}] set but banner doesn't mention what's superseded. See docs/agent-context/doc-discipline.md §Reader-first banners.`
        );
      }
    }
  }
}
```

Update `hardViolationTotal`:

```js
const hardViolationTotal =
  violations.missingFrontmatter.length +
  violations.missingRequired.length +
  violations.unknownEnum.length +
  violations.casingDrift.length +
  violations.malformedYaml.length +
  violations.antiPatternFilename.length +
  violations.missingSupersededBanner.length +
  violations.missingSupersedesBanner.length;
```

In `report()`, add `show(...)` calls for the three new violation lists alongside the existing ones (use the existing `show` helper with `isWarn=false` for HARD-FAILs).

- [ ] **Step 1.5: Create `.docs-discipline-allowlist`** at repo root:

```
# Doc-discipline allowlist
#
# One path per line. Listed paths are exempt from the validator's
# anti-pattern filename + banner checks.
#
# Adding a path requires a decision-log entry citing the rationale
# (see docs/agent-context/doc-discipline.md §Enforcement).
#
# Format: paths are relative to repo root.
#
# (Empty by design — Phase 2 ships with zero entries.)
```

- [ ] **Step 1.6: Run validator to confirm scar-tissue file fails.** From the worktree root:

```bash
node scripts/check-doc-frontmatter.mjs 2>&1 | head -30
```

Expected: HARD-FAIL on `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md` (anti-pattern filename). Any other HARD-FAILs are unexpected — read the output and confirm the rest of the corpus is clean before proceeding.

- [ ] **Step 1.7: Archive the scar-tissue file.** Edit its frontmatter + add banner FIRST, then `git mv`. Edit `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md`:

Change frontmatter:

```yaml
---
title: 'Wedge V1 amendment — Improve as top-level verb tab, Project as singular noun'
status: archived
date: 2026-05-16
last-verified: 2026-05-17
purpose: remember
tier: ephemeral
audience: agent
topic: [wedge, nav, ax]
related:
  - 2026-05-16-wedge-architecture-design
  - adr-082-wedge-architecture
---
```

Add immediately after the H1:

```markdown
> 🗄 **Archived 2026-05-17** — the Improve-tab amendment is now incorporated into the canonical [wedge architecture spec](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) (7-tab nav, Improve as top-level verb tab). This file preserves the point-in-time amendment narrative for institutional knowledge. Phase 2 doc-discipline forbids `*-amendment-*.md` files under `docs/superpowers/specs/`; relocated to `docs/archive/specs/`.
```

Then `git mv`:

```bash
git mv docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md docs/archive/specs/2026-05-16-improve-tab-amendment-design.md
```

- [ ] **Step 1.8: Fix dangling refs to the old path.** Find and update:

```bash
git grep -l 'superpowers/specs/2026-05-16-improve-tab-amendment-design'
```

Expected hits (update each link to `docs/archive/specs/2026-05-16-improve-tab-amendment-design.md`, relative-pathing as needed):

- `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` — the wedge spec's banner mentioning the amendment
- `docs/llms.txt` — canonical V1 design entry
- `docs/07-decisions/adr-082-wedge-architecture.md` — amendment banner
- Any other matches — fix all.

After updating links, run `pnpm docs:check` (full health check) to confirm dead-link check stays green.

- [ ] **Step 1.9: Re-run validator. Expect zero HARD-FAILs.**

```bash
node scripts/check-doc-frontmatter.mjs
```

Expected: `✓ Frontmatter check: N docs validated, no issues.` (or only transitional alias warnings — those are pre-existing).

If anything else fails, stop and investigate — false positives must be fixed before Phase 2 can merge.

- [ ] **Step 1.10: Append decision-log entry.** Edit `docs/decision-log.md`, append a new entry near the top of the chronological list (decision-log is reverse-chronological):

```markdown
- **2026-05-17 — Doc-discipline Play 2b validator extension shipped.** `archived`: `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md` → `docs/archive/specs/` [supersedes: incorporated into canonical wedge spec].
  Why: anti-pattern `*-amendment-*.md` filename in `docs/superpowers/specs/` violates SSoT-by-doc-type discipline (canonical wedge spec is the always-current authority); validator now HARD-FAILs new attempts. Commit: <TBD>. PR: <TBD>. Related: [[2026-05-16-docs-strategy-design]], [[doc-discipline]].
```

(`<TBD>` placeholders get filled in at PR-merge time.)

- [ ] **Step 1.11: Manual scar-tissue test.** Create a throw-away file to confirm the HARD-FAIL fires:

```bash
cat > docs/superpowers/specs/test-amendment-design.md <<'EOF'
---
title: Test
status: draft
---
# Test
EOF
node scripts/check-doc-frontmatter.mjs 2>&1 | grep "anti-pattern" || echo "FAIL — anti-pattern check did not fire"
rm docs/superpowers/specs/test-amendment-design.md
```

Expected: a line mentioning `test-amendment-design.md` and `anti-pattern filename`.

- [ ] **Step 1.12: Commit T1.**

```bash
git add scripts/check-doc-frontmatter.mjs scripts/docs-frontmatter-schema.mjs \
  .docs-discipline-allowlist \
  docs/archive/specs/2026-05-16-improve-tab-amendment-design.md \
  docs/superpowers/specs/2026-05-16-wedge-architecture-design.md \
  docs/llms.txt \
  docs/07-decisions/adr-082-wedge-architecture.md \
  docs/decision-log.md
# git mv was already recorded by the worktree; verify with `git status`
git commit -m "$(cat <<'EOF'
feat(docs-validator): Play 2b — anti-pattern filenames + banner enforcement

Phase 2 T1 of docs-strategy-2026.

- HARD-FAIL filenames matching *-amendment/*-revision/*-update/*-followup-*.md
  under docs/superpowers/specs/ (the violation that produced the
  wedge-amendment incident 2026-05-17).
- HARD-FAIL status:superseded/archived without SUPERSEDED/ARCHIVED banner
  in first 15 body lines.
- HARD-FAIL supersedes:[...] set without banner mentioning predecessor.
- .docs-discipline-allowlist (empty) provides the rare-exception escape hatch.
- Archive 2026-05-16-improve-tab-amendment-design.md (scar tissue: content
  already folded into canonical wedge spec; archived for institutional
  knowledge) + fix dangling refs.

Spec: docs/agent-context/doc-discipline.md §Reader-first banners.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 — Validator: `--diff` mode + decision-log + edit-type vocabulary

**Files:**

- Modify: `scripts/check-doc-frontmatter.mjs` (add `--diff` mode + new checks)
- Create: `scripts/docs-toolbox/lib/edit-types.mjs` (shared parser, used by T2 + T3)
- Modify: `docs/decision-log.md` (append T2 entry)

- [ ] **Step 2.1: Create shared edit-type parser.** New file `scripts/docs-toolbox/lib/edit-types.mjs`:

```js
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
  `\\\`?(${EDIT_TYPES.map(t => t.replace(/ /g, '\\s+')).join('|')})\\\`?\\s*:`
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
```

- [ ] **Step 2.2: Add `--diff` mode to `check-doc-frontmatter.mjs`.** Add to the imports section:

```js
import { execFileSync } from 'node:child_process';
import { parseEntry, isEntryHeaderLine } from './docs-toolbox/lib/edit-types.mjs';

const DIFF_MODE = process.argv.includes('--diff');
const DIFF_BASE = process.env.DIFF_BASE ?? 'origin/main';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
```

Add to the `violations` object:

```js
const violations = {
  // ...existing entries...
  diffWarnDecisionLogOldLine: [],
  diffWarnSpecAmendmentHeading: [],
  diffWarnNonCanonicalEditType: [],
  diffWarnDeliveredNoBanner: [],
};
```

Add the diff-mode block AFTER the per-file loop (`for (const f of files) check(f);`) and before `report()`:

```js
function runDiffChecks() {
  let raw;
  try {
    // execFileSync — no shell, no injection risk. DIFF_BASE is treated as a
    // single argv argument; git resolves it as a rev.
    raw = execFileSync('git', ['diff', '-U0', DIFF_BASE], { encoding: 'utf8' });
  } catch (err) {
    console.error(
      `⚠ --diff mode: could not diff against ${DIFF_BASE} (${err.message}). Skipping diff checks.`
    );
    return;
  }
  parseDiff(raw);
}

function parseDiff(diffText) {
  const today = new Date();
  let currentFile = null;
  for (const line of diffText.split('\n')) {
    const fileMatch = /^diff --git a\/(.+) b\/.+$/.exec(line);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }
    if (!currentFile) continue;

    // Decision-log: WARN on removed (-) lines whose entry date is >7 days old.
    if (currentFile === 'docs/decision-log.md' && line.startsWith('-') && !line.startsWith('---')) {
      const removed = line.slice(1);
      const parsed = parseEntry(removed);
      if (parsed) {
        const entryDate = new Date(parsed.date + 'T00:00:00Z');
        if (today - entryDate > SEVEN_DAYS_MS) {
          violations.diffWarnDecisionLogOldLine.push(
            `${currentFile}: editing decision-log entry from ${parsed.date} ("${parsed.title}") — entries >7 days old are append-only by convention. New supersession entry preferred. See docs/agent-context/doc-discipline.md §Decision-log as temporal index.`
          );
        }
      }
    }

    // Decision-log: WARN on added (+) entries missing canonical edit-type.
    if (currentFile === 'docs/decision-log.md' && line.startsWith('+') && !line.startsWith('+++')) {
      const added = line.slice(1);
      if (isEntryHeaderLine(added)) {
        const parsed = parseEntry(added);
        if (parsed && parsed.editType === null) {
          violations.diffWarnNonCanonicalEditType.push(
            `${currentFile}: new entry "${parsed.title}" missing canonical edit-type vocabulary. Use one of: spec edit | ADR amendment | new ADR | supersession | archived | new spec.`
          );
        }
      }
    }

    // Design specs: WARN on added "## Amendment" headings (allowed for ADRs only).
    if (
      line.startsWith('+## Amendment') &&
      (currentFile.startsWith('docs/superpowers/specs/') ||
        currentFile === 'docs/01-vision/coscout-ax-design.md')
    ) {
      violations.diffWarnSpecAmendmentHeading.push(
        `${currentFile}: added '## Amendment' heading in a design spec. Design specs edit in place; amendment blocks are ADR-only. See docs/agent-context/doc-discipline.md §Edit-in-place mechanics.`
      );
    }
  }
}

if (DIFF_MODE) runDiffChecks();
```

Update `warningTotal`:

```js
const warningTotal =
  violations.aliasedStatus.length +
  violations.aliasedAudience.length +
  violations.diffWarnDecisionLogOldLine.length +
  violations.diffWarnSpecAmendmentHeading.length +
  violations.diffWarnNonCanonicalEditType.length +
  violations.diffWarnDeliveredNoBanner.length;
```

Add `show(...)` calls for the new warning lists in `report()`:

```js
show(
  'Decision-log: edit on entry >7 days old (use new supersession entry)',
  violations.diffWarnDecisionLogOldLine,
  5,
  true
);
show(
  'Decision-log: non-canonical edit-type vocabulary',
  violations.diffWarnNonCanonicalEditType,
  5,
  true
);
show(
  'Design spec: ## Amendment heading added (ADR-only pattern)',
  violations.diffWarnSpecAmendmentHeading,
  5,
  true
);
show(
  'Design spec: delivered-by set without ✅ Delivered banner',
  violations.diffWarnDeliveredNoBanner,
  5,
  true
);
```

- [ ] **Step 2.3: Add the `delivered-by` banner check** (per-file, NOT diff-mode). In the `check(file)` function, after the supersedes banner check:

```js
// Design-spec WARN: delivered-by frontmatter set but no ✅ Delivered banner
const isDesignSpec =
  rel.startsWith('docs/superpowers/specs/') || rel === 'docs/01-vision/coscout-ax-design.md';
if (isDesignSpec && fm['delivered-by'] && !ALLOWLIST.has(rel)) {
  const bodyHead = extractBodyHead(src, BANNER_BODY_LINES);
  if (!DELIVERED_BANNER_RE.test(bodyHead)) {
    violations.diffWarnDeliveredNoBanner.push(
      `${rel}: delivered-by=${fm['delivered-by']} set but no '✅ Delivered' banner in first ${BANNER_BODY_LINES} body lines. See docs/agent-context/doc-discipline.md §Banner templates.`
    );
  }
}
```

(`DELIVERED_BANNER_RE` already imported in T1's Step 1.4 — confirm the import line includes it.)

- [ ] **Step 2.4: Run the validator in both modes.**

```bash
node scripts/check-doc-frontmatter.mjs       # per-file checks (incl. delivered-by)
node scripts/check-doc-frontmatter.mjs --diff # diff-mode checks (against origin/main)
```

Expected: zero new failures. The branch's diff vs `origin/main` should be the T1 + T2 commits — those edits should not trip the new warnings. (T1's decision-log entry uses `archived` as an edit-type so should match — but `archived` is also a STATUS keyword, so confirm the EDIT_TYPE_RE parses it correctly when followed by `:`.)

- [ ] **Step 2.5: Manual edit-type test.** Temporarily append a bad decision-log entry, run validator, then revert:

```bash
cat >> docs/decision-log.md <<'EOF'

- 2026-05-17 — Bogus test entry. bogus-type: somewhere. Why: testing. Commit: deadbeef.
EOF
git add docs/decision-log.md
node scripts/check-doc-frontmatter.mjs --diff 2>&1 | grep "Bogus test entry" || echo "FAIL — non-canonical edit-type check did not fire"
git restore --staged docs/decision-log.md
git checkout docs/decision-log.md
```

Expected: a WARN line mentioning `Bogus test entry`.

- [ ] **Step 2.6: Append T2 decision-log entry.** Append (most-recent first, after T1's entry):

```markdown
- **2026-05-17 — Doc-discipline validator `--diff` mode shipped.** `spec edit`: `scripts/check-doc-frontmatter.mjs` — added decision-log append-only WARN (>7-day-old line edits) + edit-type vocabulary parser + `## Amendment` heading WARN in design specs + `delivered-by` without `✅ Delivered` banner WARN.
  Why: completes the mechanical half of `docs/agent-context/doc-discipline.md` §Decision-log as temporal index + §Edit-in-place mechanics. Pre-commit/pre-push hook `--diff` wiring is a follow-up (out of scope for Phase 2). Commit: <TBD>. PR: <TBD>. Related: [[2026-05-16-docs-strategy-design]], [[doc-discipline]].
```

- [ ] **Step 2.7: Commit T2.**

```bash
git add scripts/check-doc-frontmatter.mjs \
  scripts/docs-toolbox/lib/edit-types.mjs \
  docs/decision-log.md
git commit -m "$(cat <<'EOF'
feat(docs-validator): Play 2b — --diff mode + edit-type vocabulary

Phase 2 T2 of docs-strategy-2026.

- New --diff mode: shells out to `git diff -U0 <base>` (execFileSync, no
  shell) and parses hunks.
- WARN on edits to decision-log lines whose entry date is >7 days old
  (append-only convention; new supersession entry preferred).
- WARN on '## Amendment' headings added in design-spec body diffs
  (allowed for ADRs only; design specs edit in place).
- WARN on new decision-log entries missing canonical edit-type vocabulary
  (spec edit | ADR amendment | new ADR | supersession | archived | new spec).
- WARN on design specs with `delivered-by:` frontmatter but no `✅ Delivered`
  banner in first 15 body lines.
- Shared edit-type parser at scripts/docs-toolbox/lib/edit-types.mjs,
  reused by docs:recent (T3).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3 — Toolbox: find / get / related / recent

**Files:**

- Create: `scripts/docs-toolbox/find.mjs`
- Create: `scripts/docs-toolbox/get.mjs`
- Create: `scripts/docs-toolbox/related.mjs`
- Create: `scripts/docs-toolbox/recent.mjs`
- Create: `scripts/docs-toolbox/lib/frontmatter.mjs` (shared parse helper)
- Modify: `package.json` (add 4 `docs:*` scripts)

- [ ] **Step 3.1: Create the shared frontmatter helper.** New file `scripts/docs-toolbox/lib/frontmatter.mjs`:

```js
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
```

- [ ] **Step 3.2: Create `find.mjs`.** Filter docs by frontmatter fields, return top matches with excerpts.

```js
#!/usr/bin/env node
// find.mjs — search docs/** by frontmatter filters + optional keyword query.
//
// Usage:
//   pnpm docs:find --purpose=design --topic=ax
//   pnpm docs:find --tier=living --status=active --keyword=canvas
//   pnpm docs:find --keyword="response path"
//
// Filters AND together; --keyword does case-insensitive substring match on
// title + body. Output: top-N matches (default 10), each with path + title +
// 1-line excerpt.

import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc } from './lib/frontmatter.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { filters: {}, keyword: null, limit: 10 };
  for (const a of argv) {
    if (a.startsWith('--keyword=')) out.keyword = a.slice(10).toLowerCase();
    else if (a.startsWith('--limit=')) out.limit = Number(a.slice(8));
    else if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 2) out.filters[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  return out;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

function matchesFilters(fm, filters) {
  for (const [key, want] of Object.entries(filters)) {
    const have = fm[key];
    if (have == null) return false;
    if (Array.isArray(have)) {
      if (!have.map(String).includes(want)) return false;
    } else if (String(have) !== want) {
      return false;
    }
  }
  return true;
}

function matchesKeyword(doc, keyword) {
  if (!keyword) return true;
  const haystack = (doc.frontmatter.title ?? '') + ' ' + doc.body;
  return haystack.toLowerCase().includes(keyword);
}

function excerpt(body, keyword) {
  if (!keyword) {
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) continue;
      return trimmed.slice(0, 120);
    }
    return '';
  }
  const idx = body.toLowerCase().indexOf(keyword);
  if (idx < 0) return '';
  const start = Math.max(0, idx - 40);
  return body
    .slice(start, idx + keyword.length + 80)
    .replace(/\s+/g, ' ')
    .slice(0, 140);
}

const files = walk(DOCS);
const hits = [];
for (const f of files) {
  const doc = readDoc(f);
  if (!matchesFilters(doc.frontmatter, args.filters)) continue;
  if (!matchesKeyword(doc, args.keyword)) continue;
  hits.push({
    path: relative(ROOT, f),
    title: doc.frontmatter.title ?? '(no title)',
    excerpt: excerpt(doc.body, args.keyword),
  });
}

const out = hits.slice(0, args.limit);
if (out.length === 0) {
  console.log('No matches.');
  process.exit(0);
}
for (const hit of out) {
  console.log(`${hit.path}`);
  console.log(`  ${hit.title}`);
  if (hit.excerpt) console.log(`  …${hit.excerpt}…`);
  console.log('');
}
if (hits.length > out.length)
  console.log(`(+ ${hits.length - out.length} more — increase --limit to see all)`);
```

- [ ] **Step 3.3: Create `get.mjs`.** Print a full doc by id or path.

```js
#!/usr/bin/env node
// get.mjs — print a full doc by id (basename without .md) or path.
//
// Usage:
//   pnpm docs:get adr-082-wedge-architecture
//   pnpm docs:get docs/superpowers/specs/2026-05-16-docs-strategy-design.md

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm docs:get <id-or-path>');
  process.exit(2);
}

function findById(dir, id, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findById(full, id, out);
    else if (entry === `${id}.md`) out.push(full);
  }
  return out;
}

let target = arg;
if (!existsSync(target)) {
  const matches = findById(DOCS, arg.replace(/\.md$/, ''));
  if (matches.length === 0) {
    console.error(`Not found: ${arg}`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(`Ambiguous id '${arg}' — matches:`);
    for (const m of matches) console.error(`  ${relative(ROOT, m)}`);
    process.exit(1);
  }
  target = matches[0];
}

process.stdout.write(readFileSync(target, 'utf8'));
```

- [ ] **Step 3.4: Create `related.mjs`.** Graph traversal via `related:` frontmatter + body `[[name]]`.

```js
#!/usr/bin/env node
// related.mjs — list docs related to a given id.
//
// Usage:
//   pnpm docs:related adr-082-wedge-architecture
//
// Sources:
//   1. Target's frontmatter `related:` array → forward links.
//   2. Target's body [[wikilinks]] → forward links.
//   3. Any other doc that lists target.id in its `related:` → backward links.
//   4. Any other doc whose body contains [[target-id]] → backward links.

import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc, getDocId, getWikilinks } from './lib/frontmatter.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const id = (process.argv[2] ?? '').replace(/\.md$/, '');
if (!id) {
  console.error('Usage: pnpm docs:related <id>');
  process.exit(2);
}

function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const files = walk(DOCS);
let target = null;
const docs = [];
for (const f of files) {
  const doc = readDoc(f);
  const docId = getDocId(f);
  const entry = { path: relative(ROOT, f), id: docId, doc };
  docs.push(entry);
  if (docId === id) target = entry;
}

if (!target) {
  console.error(`Not found: ${id}`);
  process.exit(1);
}

const forwardFM = new Set();
for (const r of asArray(target.doc.frontmatter.related)) forwardFM.add(String(r));
const forwardBody = new Set(getWikilinks(target.doc.body));

const backwardFM = [];
const backwardBody = [];
for (const d of docs) {
  if (d.id === id) continue;
  const relList = asArray(d.doc.frontmatter.related).map(String);
  if (relList.includes(id)) backwardFM.push(d);
  if (getWikilinks(d.doc.body).includes(id)) backwardBody.push(d);
}

function printGroup(label, items) {
  if (items.length === 0) return;
  console.log(`\n${label} (${items.length}):`);
  for (const it of items) console.log(`  ${typeof it === 'string' ? it : it.path}`);
}

console.log(`Related to: ${target.path}`);
printGroup('→ Forward (frontmatter `related:`)', [...forwardFM]);
printGroup('→ Forward (body [[wikilinks]])', [...forwardBody]);
printGroup('← Backward (other docs cite this in `related:`)', backwardFM);
printGroup('← Backward (other docs [[wikilink]] this)', backwardBody);
```

- [ ] **Step 3.5: Create `recent.mjs`.** New docs + decision-log entries since date.

```js
#!/usr/bin/env node
// recent.mjs — list new docs + decision-log entries since a cutoff date.
//
// Usage:
//   pnpm docs:recent --since=2026-05-10
//   pnpm docs:recent --since=2026-05-10 --amendments
//
// --amendments restricts decision-log output to entries with canonical edit-types.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc } from './lib/frontmatter.mjs';
import { parseEntry } from './lib/edit-types.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const args = parseArgs(process.argv.slice(2));
function parseArgs(argv) {
  const out = { since: null, amendmentsOnly: false };
  for (const a of argv) {
    if (a.startsWith('--since=')) out.since = a.slice(8);
    else if (a === '--amendments') out.amendmentsOnly = true;
  }
  return out;
}

if (!args.since || !/^\d{4}-\d{2}-\d{2}$/.test(args.since)) {
  console.error('Usage: pnpm docs:recent --since=YYYY-MM-DD [--amendments]');
  process.exit(2);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const newDocs = [];
for (const f of walk(DOCS)) {
  const doc = readDoc(f);
  const date = String(doc.frontmatter.date ?? doc.frontmatter['last-verified'] ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= args.since) {
    newDocs.push({
      path: relative(ROOT, f),
      title: doc.frontmatter.title ?? '(no title)',
      date,
    });
  }
}
newDocs.sort((a, b) => b.date.localeCompare(a.date));

console.log(`# Docs added or last-verified since ${args.since} (${newDocs.length})\n`);
for (const d of newDocs.slice(0, 30)) {
  console.log(`- ${d.date} — ${d.path} — ${d.title}`);
}
if (newDocs.length > 30) console.log(`(+ ${newDocs.length - 30} more)`);

const logRaw = readFileSync(join(DOCS, 'decision-log.md'), 'utf8');
const entries = [];
for (const line of logRaw.split('\n')) {
  const e = parseEntry(line);
  if (e && e.date >= args.since) {
    if (args.amendmentsOnly && !e.editType) continue;
    entries.push(e);
  }
}

console.log(`\n# Decision-log entries since ${args.since} (${entries.length})\n`);
for (const e of entries) {
  console.log(`- ${e.date} — ${e.title}${e.editType ? ` [${e.editType}]` : ''}`);
}

if (args.amendmentsOnly && entries.length === 0) {
  console.log(`(Tip: drop --amendments to see all decision-log entries.)`);
}
```

- [ ] **Step 3.6: Wire to `package.json`.** Add to the `scripts` block (alphabetical within `docs:`):

```json
"docs:find": "node scripts/docs-toolbox/find.mjs",
"docs:get": "node scripts/docs-toolbox/get.mjs",
"docs:recent": "node scripts/docs-toolbox/recent.mjs",
"docs:related": "node scripts/docs-toolbox/related.mjs"
```

- [ ] **Step 3.7: Smoke-test each script.**

```bash
pnpm docs:find --purpose=decide --tier=living --limit=3
pnpm docs:get adr-082-wedge-architecture | head -20
pnpm docs:related adr-082-wedge-architecture
pnpm docs:recent --since=2026-05-10 | head -30
pnpm docs:recent --since=2026-05-10 --amendments | head -10
```

Each should produce sane output. If `find` returns 0 hits for `--purpose=decide`, that means few docs have migrated to the new schema — the toolbox operates on current state, so empty output is correct, not a bug.

- [ ] **Step 3.8: Commit T3.**

```bash
git add scripts/docs-toolbox/find.mjs \
  scripts/docs-toolbox/get.mjs \
  scripts/docs-toolbox/related.mjs \
  scripts/docs-toolbox/recent.mjs \
  scripts/docs-toolbox/lib/frontmatter.mjs \
  package.json
git commit -m "$(cat <<'EOF'
feat(docs-toolbox): Play 2c — find/get/related/recent retrieval scripts

Phase 2 T3 of docs-strategy-2026.

- pnpm docs:find — frontmatter filter (--purpose, --tier, --topic, --status,
  --audience, --keyword), top-N with excerpts.
- pnpm docs:get — print full doc by id (basename) or path.
- pnpm docs:related — forward+backward graph traversal via frontmatter
  `related:` and body [[wikilinks]].
- pnpm docs:recent --since=YYYY-MM-DD [--amendments] — new docs + decision-log
  entries since cutoff; --amendments restricts to canonical edit-types.
- Shared parse/wikilink helpers at scripts/docs-toolbox/lib/frontmatter.mjs.
- Operates on the current FLAT corpus (Phase 3 will add the cards substrate).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4 — Toolbox: verify / amend

**Files:**

- Create: `scripts/docs-toolbox/verify.mjs`
- Create: `scripts/docs-toolbox/amend.mjs`
- Modify: `package.json` (add 2 `docs:*` scripts)

- [ ] **Step 4.1: Create `verify.mjs`.** Bump `last-verified` + `verified-against-commit` frontmatter.

```js
#!/usr/bin/env node
// verify.mjs — update last-verified + verified-against-commit on a doc.
//
// Usage:
//   pnpm docs:verify <id-or-path>
//
// Sets last-verified = today (UTC date) and verified-against-commit =
// `git rev-parse HEAD` (short sha). Uses execFileSync — no shell.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm docs:verify <id-or-path>');
  process.exit(2);
}

function findById(dir, id, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findById(full, id, out);
    else if (entry === `${id}.md`) out.push(full);
  }
  return out;
}

let target = arg;
if (!existsSync(target)) {
  const matches = findById(DOCS, arg.replace(/\.md$/, ''));
  if (matches.length !== 1) {
    console.error(`Not found or ambiguous: ${arg} (${matches.length} matches)`);
    process.exit(1);
  }
  target = matches[0];
}

const src = readFileSync(target, 'utf8');
if (!src.startsWith('---\n') && !src.startsWith('---\r\n')) {
  console.error(`${target}: no frontmatter block.`);
  process.exit(1);
}
const end = src.indexOf('\n---', 4);
if (end < 0) {
  console.error(`${target}: malformed frontmatter.`);
  process.exit(1);
}
const fm = src.slice(4, end);
const body = src.slice(end + 4);

const today = new Date().toISOString().slice(0, 10);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim().slice(0, 12);

function upsertField(text, key, value) {
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(text)) return text.replace(re, `${key}: ${value}`);
  return text.replace(/\n*$/, '\n') + `${key}: ${value}\n`;
}

let updated = fm;
updated = upsertField(updated, 'last-verified', today);
updated = upsertField(updated, 'verified-against-commit', sha);

writeFileSync(target, `---\n${updated}\n---${body}`);
console.log(`${relative(ROOT, target)}: last-verified=${today}, verified-against-commit=${sha}`);
```

- [ ] **Step 4.2: Create `amend.mjs`.** Append a dated `## Amendment` block to an ADR.

```js
#!/usr/bin/env node
// amend.mjs — append a "## Amendment — YYYY-MM-DD" block to an ADR.
//
// Usage:
//   pnpm docs:amend <adr-id> "<one-line summary>"
//
// HARD-FAILS if the target is a design spec (those edit in place, not via
// amendment blocks). See docs/agent-context/doc-discipline.md.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const id = process.argv[2];
const summary = process.argv.slice(3).join(' ');
if (!id || !summary) {
  console.error('Usage: pnpm docs:amend <adr-id> "<one-line summary>"');
  process.exit(2);
}

function findById(dir, id, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findById(full, id, out);
    else if (entry === `${id}.md`) out.push(full);
  }
  return out;
}

const matches = findById(DOCS, id.replace(/\.md$/, ''));
if (matches.length !== 1) {
  console.error(`Not found or ambiguous: ${id} (${matches.length} matches)`);
  process.exit(1);
}
const target = matches[0];
const rel = relative(ROOT, target);

const isAdr =
  rel.startsWith('docs/07-decisions/') ||
  rel.startsWith('docs/archive/adrs/') ||
  rel.startsWith('docs/living/decide/');
if (!isAdr) {
  console.error(
    `${rel}: amend.mjs is ADR-only. Design specs edit in place; see docs/agent-context/doc-discipline.md §Edit-in-place mechanics.`
  );
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const src = readFileSync(target, 'utf8');
const sep = src.endsWith('\n') ? '' : '\n';
const block = `${sep}\n## Amendment — ${today}\n\n${summary}\n`;
writeFileSync(target, src + block);
console.log(`${rel}: appended ## Amendment — ${today}`);
```

- [ ] **Step 4.3: Wire to `package.json`.** Add (alphabetical):

```json
"docs:amend": "node scripts/docs-toolbox/amend.mjs",
"docs:verify": "node scripts/docs-toolbox/verify.mjs"
```

- [ ] **Step 4.4: Smoke-test each script.**

```bash
# Verify: choose adr-083 (recent + has frontmatter), then revert
pnpm docs:verify adr-083-eight-purpose-doc-taxonomy
git diff docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md
git checkout docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md

# Amend HARD-FAIL on design spec
pnpm docs:amend 2026-05-16-docs-strategy-design "test amendment — should fail" 2>&1 | grep "ADR-only" && echo "OK — correctly rejected"

# Amend success on an ADR (temp test, then revert)
pnpm docs:amend adr-083-eight-purpose-doc-taxonomy "test amendment — Phase 2 toolbox smoke"
tail -5 docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md
git checkout docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md
```

- [ ] **Step 4.5: Commit T4.**

```bash
git add scripts/docs-toolbox/verify.mjs scripts/docs-toolbox/amend.mjs package.json
git commit -m "$(cat <<'EOF'
feat(docs-toolbox): Play 2c — verify/amend frontmatter mutation scripts

Phase 2 T4 of docs-strategy-2026.

- pnpm docs:verify <id> — bumps last-verified to today + writes
  verified-against-commit = current HEAD short-sha. Uses execFileSync.
- pnpm docs:amend <adr-id> "<summary>" — appends a dated ## Amendment block
  to an ADR. HARD-FAILS on design specs (those edit in place per
  docs/agent-context/doc-discipline.md).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5 — Docs-toolbox skill + `llms.txt` → router

**Files:**

- Create: `.claude/skills/docs-toolbox/SKILL.md`
- Modify: `docs/llms.txt` (rewrite from catalog → router)
- Modify: `docs/decision-log.md` (append T5 entry)

- [ ] **Step 5.1: Create `.claude/skills/docs-toolbox/SKILL.md`.** Match the format of `.claude/skills/agent-context-quickstart/SKILL.md` for tone + length. Auto-trigger description must mention: "search docs", "find related docs", "verify spec freshness", "amend ADR", "retrieve documentation".

````markdown
---
name: 'Docs Toolbox'
description: 'Use when searching the docs corpus, finding related specs/ADRs, listing recent changes, verifying spec freshness, or amending ADRs. Provides the `pnpm docs:find / docs:get / docs:related / docs:recent / docs:verify / docs:amend` retrieval surface so subagents can locate canonical homes for any concept without grep-walking 500+ files.'
---

# Docs Toolbox

## When to use this skill

Use whenever a task needs to:

- **Find** the canonical home for a concept ("where is the wedge spec?", "all CoScout AX docs", "ADRs about response paths")
- **Get** the full body of a doc by id or path
- **Discover related** docs via the bidirectional graph (frontmatter `related:` + body `[[wikilinks]]`)
- **List recent** new docs or decision-log entries since a date (e.g., "what changed since Phase 1 shipped?")
- **Verify** a spec is still current (bump `last-verified` + `verified-against-commit` after re-reading)
- **Amend** an ADR with a dated amendment block (ADR-only — design specs edit in place)

Skip this skill for: editing prose inside a doc you already have open; one-off `grep` you already know the path for.

## Tool surface

| Command                                            | What it does                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm docs:find --purpose=X --topic=Y --tier=Z`    | Filter docs by frontmatter fields. `--keyword=K` adds keyword filter. `--limit=N` caps output. |
| `pnpm docs:get <id-or-path>`                       | Print the full doc.                                                                            |
| `pnpm docs:related <id>`                           | Forward + backward neighbors (frontmatter `related:` + body `[[wikilinks]]`).                  |
| `pnpm docs:recent --since=YYYY-MM-DD`              | New docs + decision-log entries since cutoff.                                                  |
| `pnpm docs:recent --since=YYYY-MM-DD --amendments` | Restrict decision-log to entries with canonical edit-types (spec edit / ADR amendment / etc.). |
| `pnpm docs:verify <id>`                            | Bump `last-verified` + `verified-against-commit` after re-reading.                             |
| `pnpm docs:amend <adr-id> "<summary>"`             | Append a dated `## Amendment` block to an ADR. HARD-FAILS on design specs.                     |

## Task kits

### "Where is the canonical X?"

```bash
pnpm docs:find --keyword="X"                  # broad search
pnpm docs:find --purpose=design --topic=X     # narrow by purpose+topic
pnpm docs:find --purpose=decide --keyword=X   # decisions about X (ADRs + decision-log entries)
```
````

### "What's recently changed?"

```bash
pnpm docs:recent --since=2026-05-10                 # everything since cutoff
pnpm docs:recent --since=2026-05-10 --amendments    # just canonical edit-types
```

### "What's related to Y?"

```bash
pnpm docs:related adr-082-wedge-architecture
```

### "Re-verifying a spec after re-reading"

```bash
pnpm docs:get 2026-05-16-wedge-architecture-design  # read full body
# ...if no changes needed, just:
pnpm docs:verify 2026-05-16-wedge-architecture-design
```

### "Adding an amendment block to an ADR"

```bash
pnpm docs:amend adr-082-wedge-architecture "Nav amended — see [[2026-05-16-improve-tab-amendment]]"
```

(Design specs **do not** get amendment blocks — edit them in place + log to `docs/decision-log.md`. See `docs/agent-context/doc-discipline.md` §Edit-in-place mechanics.)

## Discipline reminders

The toolbox is the retrieval half; `docs/agent-context/doc-discipline.md` is the editing half. Before editing any canonical doc, invoke `agent-context-quickstart` skill and read the discipline doc. The validator (`scripts/check-doc-frontmatter.mjs`) HARD-FAILs:

- `*-amendment-*.md`, `*-revision-*.md`, `*-update-*.md`, `*-followup-*.md` filenames under `docs/superpowers/specs/`
- `status: superseded`/`archived` without the matching banner in first 15 body lines
- `supersedes: [...]` without banner mentioning predecessor

`--diff` mode adds WARNs for stale decision-log edits and design-spec `## Amendment` headings.

## Implementation

Scripts live in `scripts/docs-toolbox/` and are wired via root `package.json`. Shared helpers at `scripts/docs-toolbox/lib/frontmatter.mjs` (parse + wikilinks) and `scripts/docs-toolbox/lib/edit-types.mjs` (decision-log entry parser + canonical edit-type vocabulary). The toolbox operates on the current FLAT corpus; Phase 3 will add `docs/cards/` substrate without breaking these commands.

````

- [ ] **Step 5.2: Rewrite `docs/llms.txt` from catalog → router.** Replace the entire file content with a short router. Run `git grep -l 'docs/llms.txt'` first — there may be inbound links that need to stay alive. Keep the always-load section comprehensive enough that those links resolve.

```markdown
# VariScout

> Structured investigation for process improvement. Browser-based, customer-owned data, local-cache capable. PWA (free) + Azure Marketplace (€120/mo, single SKU per Azure tenant). VariScout Process (enterprise platform) named-future, not announced in V1 marketing.

Entry points for AI agents working in this repo. Humans should start at `docs/index.md`.

## Router: pick the right surface

**Need orientation?** Invoke the `agent-context-quickstart` skill — 5-minute project briefing covering wedge V1 direction, hard invariants, ESLint-enforced rules, common pitfalls.

**Need to find a doc?** Invoke the `docs-toolbox` skill — `pnpm docs:find / docs:get / docs:related / docs:recent` retrieval surface.

**Need to know which package CLAUDE.md to load?** Invoke the `package-router` skill.

**Need to read/write Zustand store state?** Invoke the `store-state-glossary` skill.

**Editing any canonical doc?** Read `docs/agent-context/doc-discipline.md` FIRST. SSoT-by-doc-type rules: design specs edit in place; ADRs append `## Amendment` blocks at bottom; decision-log appends. `*-amendment-*.md` filenames are HARD-FAILed by the validator under `docs/superpowers/specs/`.

## Always-load entry points

- `decision-log.md` — temporal index over canonical doc changes. Read BEFORE re-opening any topic. (Implementer: use real markdown-link syntax in the final llms.txt content; plain-text-only here to keep this plan file's dead-link check green per `feedback_doc_validation_hooks`.)
- `OVERVIEW.md` — what VariScout does + the FRAME → SCOUT → INVESTIGATE → IMPROVE journey.
- `USER-JOURNEYS.md` — V1 single persona (Improvement Specialist) + 3 project-membership roles (Lead / Member / Sponsor).
- `DATA-FLOW.md` — parse → transform → stats → persist → sync → display → AI pipeline.

## Canonical V1 strategic direction

- `superpowers/specs/2026-05-16-wedge-architecture-design.md` — V1 single-SKU design. 7-tab nav (`Home · Project · Process · Explore · Analyze · Improve · Report`). Improve as top-level verb tab with active-IP cascade. 3 personas per Project (Lead/Member/Sponsor). €120/mo single SKU.
- `07-decisions/adr-082-wedge-architecture.md` — V1 architectural record. Partial supersession of ADR-007 + ADR-033.

## Agent-context entry points

- `../AGENTS.md` — Codex entrypoint.
- `../CLAUDE.md` — Claude entrypoint.
- `../packages/*/CLAUDE.md` + `../apps/*/CLAUDE.md` — per-package context, loaded on demand.
- `../.claude/skills/` — task-triggered skills. See router above.
- `../.claude/INVARIANTS.md` — full invariant index with canonical homes + enforcement mechanisms.

## Tooling

- `pnpm docs:check` — diagram health + dead-link scan + frontmatter schema validation.
- `pnpm docs:check:frontmatter` — schema + discipline checks alone.
- `node scripts/check-doc-frontmatter.mjs --diff` — diff-mode checks (decision-log append-only, design-spec `## Amendment`, delivered-by banner).
- See `.claude/skills/docs-toolbox/SKILL.md` for the retrieval surface.
````

- [ ] **Step 5.3: Append T5 decision-log entry.**

```markdown
- **2026-05-17 — Docs-toolbox skill + llms.txt → router transformation.** `new spec`: `.claude/skills/docs-toolbox/SKILL.md`. `spec edit`: `docs/llms.txt` [supersedes prior static catalog].
  Why: subagents need a single auto-triggered skill that surfaces `pnpm docs:find/get/related/recent/verify/amend`; llms.txt becomes a router pointing at the four canonical skills (quickstart, toolbox, package-router, store-state-glossary) + always-load docs. Commit: <TBD>. PR: <TBD>. Related: [[2026-05-16-docs-strategy-design]].
```

- [ ] **Step 5.4: Run `pnpm docs:check`** (full health check).

```bash
pnpm docs:check
```

Expected: green. If dead-link check trips on the new llms.txt content (we removed many catalog refs), every link in the new llms.txt must resolve. Re-add any missing inbound targets to the always-load section.

- [ ] **Step 5.5: Commit T5.**

```bash
git add .claude/skills/docs-toolbox/SKILL.md docs/llms.txt docs/decision-log.md
git commit -m "$(cat <<'EOF'
feat(skills): Play 2d — docs-toolbox skill + llms.txt → router

Phase 2 T5 of docs-strategy-2026.

- New .claude/skills/docs-toolbox/SKILL.md with auto-trigger description
  for doc-retrieval tasks. Tool surface + task kits + discipline reminders.
- docs/llms.txt rewritten from a static catalog of every entry point into
  a router that points subagents at the right skill (agent-context-quickstart
  / docs-toolbox / package-router / store-state-glossary) plus always-load
  canonical docs (decision-log, OVERVIEW, USER-JOURNEYS, DATA-FLOW, wedge
  spec, ADR-082). The toolbox skill is the dynamic retrieval surface for
  everything else.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6 — Alignment pass: CoScout AX persona+voice + atomic-deletion + stale-refs

**Files:**

- Modify: `docs/01-vision/coscout-ax-design.md` (extend § Persona + Voice)
- Modify: `.claude/skills/agent-context-quickstart/SKILL.md` (fix stale 6-tab ref)
- Possibly modify: workflow docs mentioning "atomic deletion-cascade" (verify which surfaces need pointers)
- Modify: `docs/decision-log.md` (append T6 entry)

- [ ] **Step 6.1: Read targets to scope the edits.**

```bash
pnpm docs:get coscout-ax-design | sed -n '14,50p'      # current § Persona + Voice
head -30 .claude/skills/agent-context-quickstart/SKILL.md
git grep -n 'atomic-deletion\|atomic deletion\|deletion-cascade\|atomic_sweep_one_dispatch' docs/ CLAUDE.md AGENTS.md
```

The CoScout AX doc currently has a § "Persona + Voice" (line 20) that describes CoScout's NARRATOR voice ("Investigator, not analyst"). The user prompt says: 3 user personas (Lead/Member/Sponsor) also affect CoScout behavior — but the current doc conflates the narrator voice with project-membership roles. T6 clarifies BOTH: CoScout's narrator persona (unchanged), plus role-aware behavior tweaks per project-membership role.

- [ ] **Step 6.2: Extend CoScout AX-design § Persona + Voice.** Edit `docs/01-vision/coscout-ax-design.md`. Replace the current § Persona + Voice block (through the next `##` heading) with:

```markdown
## Persona + Voice

CoScout has two distinct persona layers — its OWN narrator voice (project-wide constant) and ROLE-AWARE adjustments tuned to the active user's project-membership role. Both layers compose; neither modifies analysis content.

### CoScout's narrator voice (constant)

CoScout is an **investigator, not an analyst**. Voice principles (unchanged from pre-2026-05-17):

- **Calm, structured, hypothesis-driven.** Treats every question as an investigation step; never speculates beyond grounded context.
- **Minimal nudges over proactive interruptions** (per `feedback_ai_proactivity`). CoScout speaks when it has grounded, useful context — not because it can.
- **Plain English over jargon.** Methodology lineage stays internal per `feedback_drop_methodology_bridges`.
- **First-person plural ("we") when narrating shared analyses with the active project's team**, first-person singular when CoScout suggests something speculative.

### Role-aware tone (per active user's project-membership role)

V1 has 3 project-membership roles (Lead / Member / Sponsor — per `2026-05-16-wedge-architecture-design`). CoScout adapts the framing (not the analysis) per role:

| Active role | Tone adjustment                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lead**    | Methodology-coaching tone: surfaces next-step suggestions framed as questions ("Have we checked stability before capability?"); references the three-level methodology model when context allows. |
| **Member**  | Task-completion tone: surfaces actionable next steps in second person ("Pick the Y you care about; I'll wait."); collapses methodology framing into one-line context.                             |
| **Sponsor** | Outcome-framed summaries: leads with "Here's where the project stands" + improvement-magnitude framing; suppresses tool-action prompts (Sponsor is read-only by ACL).                             |

Role-detection is via active `ProjectMember.role` (per ADR-082's ACL model). Default to Member tone if role is ambiguous (e.g., user is viewing a project they don't belong to, read-only paths).

**What stays constant across roles:** the underlying analysis (stats, charts, suspected-cause language), the methodology lineage, the safety boundaries, the response paths. Role only affects WORDING + suggestion priority.

**Voice principle (across all roles):** Minimal nudges over proactive interruptions (per `feedback_ai_proactivity`). CoScout speaks when it has grounded, useful context — not because it can.
```

- [ ] **Step 6.3: Fix the stale 6-tab ref in `agent-context-quickstart` skill.** Edit `.claude/skills/agent-context-quickstart/SKILL.md`. Line ~14 currently says:

```
2. Note the 6-tab nav (`Home · Projects · Process · Analyze · Investigation · Report`) and that "Improve" is a stage inside Projects, not a tab. (Verify against any recent amendments in `docs/decision-log.md` — the wedge area is actively evolving.)
```

Replace with:

```
2. Note the **7-tab nav** (`Home · Project · Process · Explore · Analyze · Improve · Report` — singular "Project") with Improve as a top-level verb tab driven by active-IP cascade. (Verify against any recent amendments in `docs/decision-log.md` — the wedge area is actively evolving.)
```

- [ ] **Step 6.4: Atomic-deletion dispatch pattern reference.** Check whether the carve-out is already documented in surfaces other than the memory file:

```bash
git grep -n 'atomic_sweep_one_dispatch\|atomic deletion-cascade\|deletion-cascade sweep' docs/ CLAUDE.md AGENTS.md .claude/skills/
```

CLAUDE.md root already mentions the slice-cap rule (commit `bb296898`'s sibling line). If the atomic-deletion carve-out isn't yet in CLAUDE.md, add this sentence at the end of the existing "Plan + parallel-write discipline" line:

```
**Carve-out for atomic deletion-cascade sweeps**: when a public-API change forces a tsc-wide breaking change across many consumers, dispatch ONE bigger Opus implementer with Architect → Migration → Validator internal phases + per-category commits, rather than splitting into artificial sub-tasks (per `feedback_atomic_sweep_one_dispatch`).
```

If CLAUDE.md ALREADY covers this (recent commits may have added it), skip — don't double-up.

- [ ] **Step 6.5: Append T6 decision-log entry.**

```markdown
- **2026-05-17 — CoScout AX persona+voice extension + alignment-pass stale-refs.** `spec edit`: `docs/01-vision/coscout-ax-design.md`#Persona-+-Voice — distinguishes CoScout's narrator voice (project-wide constant) from role-aware tone adjustments per project-membership role (Lead / Member / Sponsor). `spec edit`: `.claude/skills/agent-context-quickstart/SKILL.md` — fixed stale "6-tab nav" → "7-tab nav (singular Project, Improve as verb tab)".
  Why: Phase 1 (PR #199) cherry-picked the wedge V1 docs onto fresh main but the agent-context-quickstart skill body was authored before the Improve-tab amendment landed; CoScout AX-design's § Persona + Voice didn't differentiate narrator voice from role-aware tone (3 personas affect tone, not analysis). Closes the gap before subagents read stale guidance. Commit: <TBD>. PR: <TBD>. Related: [[coscout-ax-design]], [[2026-05-16-wedge-architecture-design]].
```

- [ ] **Step 6.6: Run validator + full check.**

```bash
pnpm docs:check
node scripts/check-doc-frontmatter.mjs --diff
```

Expected: zero new HARD-FAILs; any WARNs should be pre-existing or expected (this PR's own decision-log entry additions should NOT trip the >7-day-old line WARN because we're only adding new lines).

- [ ] **Step 6.7: Commit T6.**

```bash
git add docs/01-vision/coscout-ax-design.md \
  .claude/skills/agent-context-quickstart/SKILL.md \
  docs/decision-log.md
# Include CLAUDE.md only if Step 6.4 edited it.
git commit -m "$(cat <<'EOF'
docs: Phase 2 alignment pass — CoScout AX persona + stale-refs

Phase 2 T6 of docs-strategy-2026.

- coscout-ax-design.md § Persona + Voice extended to distinguish CoScout's
  narrator voice (project-wide constant) from role-aware tone adjustments
  per active user's project-membership role (Lead / Member / Sponsor).
  Role affects framing + suggestion priority only; analysis content and
  safety boundaries stay constant across roles.
- agent-context-quickstart skill: fix stale "6-tab nav" → "7-tab nav
  (singular Project, Improve as verb tab)" per the 2026-05-16 amendment
  that PR #199's cherry-pick didn't catch in this surface.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Verification (before final review + PR)

- [ ] **V1: Full validator green.**

```bash
node scripts/check-doc-frontmatter.mjs       # HARD-FAILs section empty
node scripts/check-doc-frontmatter.mjs --diff # WARNs only for this PR's own changes (or pre-existing)
```

- [ ] **V2: Toolbox smoke-tests.**

```bash
pnpm docs:find --purpose=decide --tier=living --limit=3
pnpm docs:get adr-082-wedge-architecture | head -5
pnpm docs:related adr-082-wedge-architecture
pnpm docs:recent --since=2026-05-15
pnpm docs:recent --since=2026-05-15 --amendments
pnpm docs:verify adr-083-eight-purpose-doc-taxonomy && git checkout docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md
pnpm docs:amend 2026-05-16-docs-strategy-design "test" 2>&1 | grep "ADR-only" && echo "OK"
```

- [ ] **V3: Manual anti-pattern + banner test.**

```bash
# Anti-pattern filename → HARD-FAIL
cat > docs/superpowers/specs/test-amendment-design.md <<'EOF'
---
title: Test
status: draft
---
# Test
EOF
node scripts/check-doc-frontmatter.mjs 2>&1 | grep -q "anti-pattern" && echo "OK" || echo "FAIL"
rm docs/superpowers/specs/test-amendment-design.md

# Superseded without banner → HARD-FAIL
cat > docs/superpowers/specs/test-superseded.md <<'EOF'
---
title: Test
status: superseded
---
# Test
No banner.
EOF
node scripts/check-doc-frontmatter.mjs 2>&1 | grep -q "no '> SUPERSEDED" && echo "OK" || echo "FAIL"
rm docs/superpowers/specs/test-superseded.md
```

- [ ] **V4: gen-arch idempotency.**

```bash
pnpm docs:gen-arch
git diff docs/05-technical/architecture-generated.md  # expect: no diff
```

- [ ] **V5: pr-ready-check.**

```bash
bash scripts/pr-ready-check.sh 2>&1 | tail -20
```

Expected: green or only pre-existing warnings.

- [ ] **V6: Branch state.**

```bash
git log --oneline origin/main..HEAD     # expect 6 commits (T1-T6)
git status                              # expect clean
```

---

## Self-review (per writing-plans skill)

- **Spec coverage check**: each Play 2b/2c/2d deliverable in the strategy spec §3 Play 2 maps to a task above (T1 ↔ 2b filename + banner; T2 ↔ 2b diff-mode + edit-type; T3+T4 ↔ 2c toolbox; T5 ↔ 2d skill + llms.txt; T6 ↔ alignment pass). ✓
- **Placeholder scan**: `<TBD>` for commit/PR fields in decision-log entries are intentional (filled in at PR-merge time). No "implement later" placeholders elsewhere. ✓
- **Type consistency**: `EDIT_TYPES`, `ANTI_PATTERN_FILENAME_RE`, `BANNER_BODY_LINES`, etc. exported from `docs-frontmatter-schema.mjs` and imported consistently across T1-T3 task code. ✓
- **Shell safety**: every `git` invocation uses `execFileSync('git', [...args])` — no shell, no injection risk. ✓
- **Discipline dogfood**: this plan file uses frontmatter (purpose: build, tier: ephemeral); no `*-amendment-*.md` files created; all material spec edits get decision-log entries; banner discipline applied to the scar-tissue archive. ✓

---

## Execution handoff

After this plan lands as the first commit on `docs-strategy-2026-discipline`, the orchestrator dispatches Sonnet implementers + reviewer pairs per T1-T6 per `superpowers:subagent-driven-development`. Final Opus review pass covers the cumulative branch before PR.
