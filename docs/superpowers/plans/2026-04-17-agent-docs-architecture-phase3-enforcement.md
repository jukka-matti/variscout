# Agent-Facing Documentation Architecture — Phase 3 (Enforcement + Cleanup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the agent-docs migration by (a) promoting the four text conventions to deterministic ESLint rules, (b) adding 3 new pre-commit hooks + 2 pre-edit advisories, (c) deleting the now-redundant `.claude/rules/` directory, the stale `docs/archive/` corpus, and the `CLAUDE.md.bak` rollback file, and (d) scoping `MEMORY.md` so it owns session state only and no longer duplicates CLAUDE.md routing. After Phase 3, the always-loaded context shrinks from **781 lines (57 root + 724 rules)** to **57 lines (root only)** — a 92.7% reduction.

**Architecture:** Enforcement is additive-first — ship and stabilize the 4 ESLint rules and 3 new hooks BEFORE deleting `.claude/rules/`, so authors still have a live-text reference during the stabilization window. The rules replace or upgrade the existing inline `no-restricted-syntax` rule in `eslint.config.js` (lines 154-163) — we build a proper plugin in `tools/eslint-plugin-variscout/` and migrate the existing warn-level rule into it, widening the file scope in a separate dedicated task so regressions surface gradually. Safety branch `archive-preserved` is pushed to origin before `docs/archive/` deletion.

**Tech Stack:** ESLint 9 flat-config plugin, Node 20+ hooks written as `bash` (to match existing `scripts/check-*.sh` convention), Vitest for plugin rule tests. Pre-commit integration via existing `.husky/pre-commit` and `scripts/check-doc-health.sh`. Pre-edit advisories via `.claude/settings.json` Claude Code hook config.

**Reference spec:** `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md`
**Predecessor plans:**

- Phase 1 — `docs/superpowers/plans/2026-04-17-agent-docs-architecture-phase1-foundation.md` (delivered 2026-04-17)
- Phase 2 — `docs/superpowers/plans/2026-04-17-agent-docs-architecture-phase2-migration.md` (delivered 2026-04-17, final commit `7256af0c`)
  **Baseline doc:** `docs/09-baseline/2026-04-17-agent-docs-baseline.md`

---

## File Structure — Phase 3 deliverables

**New plugin (created):**

- `tools/eslint-plugin-variscout/package.json` (~15 lines) — plugin manifest, pinned workspace-local
- `tools/eslint-plugin-variscout/index.js` (~40 lines) — flat-config export of 4 rules
- `tools/eslint-plugin-variscout/rules/no-tofixed-on-stats.js` (~80 lines) — AST rule: `.toFixed()` without `Number.isFinite()` guard
- `tools/eslint-plugin-variscout/rules/no-hardcoded-chart-colors.js` (~60 lines) — AST rule: hex literals in chart files
- `tools/eslint-plugin-variscout/rules/no-root-cause-language.js` (~60 lines) — AST rule: "root cause" in strings/prompts
- `tools/eslint-plugin-variscout/rules/no-interaction-moderator.js` (~60 lines) — AST rule: "moderator"/"primary" in stats/interaction context
- `tools/eslint-plugin-variscout/rules/__tests__/no-tofixed-on-stats.test.js` (~60 lines) — RuleTester fixtures
- `tools/eslint-plugin-variscout/rules/__tests__/no-hardcoded-chart-colors.test.js` (~50 lines)
- `tools/eslint-plugin-variscout/rules/__tests__/no-root-cause-language.test.js` (~50 lines)
- `tools/eslint-plugin-variscout/rules/__tests__/no-interaction-moderator.test.js` (~50 lines)
- `tools/eslint-plugin-variscout/README.md` (~60 lines) — rule catalog + ADR references

**New hooks (created):**

- `scripts/check-ssot.sh` (~80 lines) — detects content fingerprint duplicates across CLAUDE.md files
- `scripts/check-claude-md-size.sh` (~50 lines) — checks each CLAUDE.md against per-file line budgets
- `scripts/check-dead-links.sh` (~70 lines) — scans `docs/**/*.md` for broken relative `.md` links

**Modified:**

- `eslint.config.js` — register `eslint-plugin-variscout`, remove lines 154-163 inline rule (replaced by plugin), add the 4 new rules with appropriate file-glob scoping
- `package.json` (root) — add `eslint-plugin-variscout` to `devDependencies` via `workspace:*`
- `.husky/pre-commit` — invoke `scripts/check-ssot.sh` + `scripts/check-claude-md-size.sh` + `scripts/check-dead-links.sh` (warn mode initially)
- `.claude/settings.json` — add 2 pre-edit advisory hooks (ADR frontmatter `last-reviewed`, spec/doc missing frontmatter)
- `docs/09-baseline/2026-04-17-agent-docs-baseline.md` — append "Phase 3 Completion" section
- `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md` — update Implementation Plans section with Phase 3 link (this plan)
- `/MEMORY.md` (user-level, at `/Users/jukka-mattiturtiainen/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/MEMORY.md`) — only edited if audit finds doc-routing duplicates (likely no-op per spec drift)

**Deleted:**

- `.claude/rules/charts.md`, `code-style.md`, `documentation.md`, `monorepo.md`, `ruflo.md`, `testing.md` — all 6 files (724 lines)
- `.claude/rules/` — empty directory removal
- `docs/archive/` — 27 files + any sub-folders (verified via `ls docs/archive/ | wc -l` → 27)
- `/CLAUDE.md.bak` — 181-line rollback file at repo root

**Safety branch (created + pushed):**

- `archive-preserved` — branch created from HEAD before Task 10, pushed to origin; tagged `archive-snapshot-2026-04-17`. Never deleted.

---

## Conventions used in this plan

- **Commit message style:** `feat(agent-arch): <what shipped>` for new rules/hooks/tooling; `chore(agent-arch): <housekeeping>` for deletions, branch creation, file renames; `docs(agent-arch): <doc-only change>` for spec + baseline edits. All commits end with the trailer `Co-Authored-By: ruflo <ruv@ruv.net>`.
- **TDD cadence for ESLint rules:**
  1. Write RuleTester test fixtures — passing + failing examples (at least 3 of each)
  2. Verify tests fail against empty rule
  3. Implement rule (AST-first, regex-second)
  4. Verify tests pass
  5. Run rule against full monorepo — surface existing violations
  6. Fix or suppress (with inline `// eslint-disable-next-line` + justification comment)
  7. Commit
- **TDD cadence for hooks:**
  1. Write a tiny bash test fixture (known-good + known-bad inputs in a temp directory)
  2. Invoke the hook with `set -x` to observe behavior
  3. Implement hook
  4. Re-invoke, verify exit codes
  5. Wire into `.husky/pre-commit` or `scripts/check-doc-health.sh`
  6. Commit
- **One commit per task** — matches Phase 2 discipline. Gives per-rule / per-hook revert granularity.
- **Safety first on deletions:** no deletion task proceeds without a preceding snapshot or safety-branch task. `archive-preserved` branch is created and pushed to origin BEFORE any `rm -rf docs/archive/` command is run.
- **Existing vs new for `.toFixed()` rule:** the current `eslint.config.js:154-163` inline rule is scoped to `packages/ui/src/**/*.{ts,tsx}` + `packages/core/src/ai/prompts/**/*.ts` at `warn` level. Task 2 replaces this with a proper plugin rule (AST-based, guard-aware) at the same scope + severity; Task 9 widens the scope to `packages/**` + `apps/**` (excluding tests) and fixes violations.
- **ADR references in error messages:** each plugin rule's message ends with `See ADR-069.` (or the relevant ADR number), matching the existing pattern at `eslint.config.js:160`.

---

## Sequencing strategy

**Enforcement first, deletion second.** The plan ships all 4 ESLint rules, all 3 new hooks, and the 2 pre-edit advisories BEFORE deleting `.claude/rules/`. If a rule misfires or a hook is too strict, authors can still consult `.claude/rules/` during the stabilization window. Deletion (Task 11) only runs after widening + violation-fix (Task 8) has cleaned the codebase and the team has ~1 commit cycle of confidence in the enforcement machinery.

**Why `no-tofixed-on-stats` scope widening is a separate task (Task 8, not folded into Task 2):** the existing rule at `eslint.config.js:154-163` is `warn` only and scoped narrowly. Replacing it in-place in Task 2 preserves behavior. Widening in Task 8 will surface existing violations in `packages/charts`, `packages/hooks`, `packages/stores`, and `apps/*` that must be fixed or justified. Separating the tasks isolates "did we introduce a bug in the rule?" from "is there legitimate `.toFixed()` use in the codebase?".

**Safety branch before archive deletion.** Task 10 creates and pushes `archive-preserved` branch before any `rm -rf` runs. Per spec risk table: "Git preserves; create `archive-preserved` safety branch before Phase 3."

**`check-dead-links` in warn mode, fail date fixed.** Per spec: warn 2 weeks, then fail. Task 9 ships the hook in warn mode and the plan specifies the flip date as **2026-05-01** (2 weeks from Phase 3 start date 2026-04-17). Task 13 adds a reminder but does not perform the flip — the flip lives in Phase 4 (out of scope here).

**CI gate is explicitly deferred.** This repo does not currently appear to have a CI config at `.github/workflows/` for doc-lint (confirm during Task 13). Per spec: "Phase 4 ongoing: Weekly skill activation log reviewed." A CI doc-lint stage is best added during Phase 4 once warn→fail transitions are validated locally. Task 13 documents this deferral in the Phase 3 completion note.

---

## Task 1: Scaffold `eslint-plugin-variscout` package

**Files:**

- Create: `tools/eslint-plugin-variscout/package.json`
- Create: `tools/eslint-plugin-variscout/index.js`
- Create: `tools/eslint-plugin-variscout/README.md`
- Modify: `package.json` (root) — add plugin as `workspace:*` devDependency
- Modify: `pnpm-workspace.yaml` (if needed to include `tools/*`)

**Goal:** Set up the empty plugin shell with package manifest, barrel export, and workspace wiring. No rules yet.

- [ ] **Step 1: Verify `tools/` directory already exists and contains only `statusline.cjs`**

```bash
ls /Users/jukka-mattiturtiainen/Projects/VariScout_lite/tools/
```

Expected: `statusline.cjs`. Confirm no pre-existing `eslint-plugin-variscout` directory.

- [ ] **Step 2: Verify current pnpm-workspace.yaml covers `tools/*`**

```bash
cat /Users/jukka-mattiturtiainen/Projects/VariScout_lite/pnpm-workspace.yaml
```

If `tools/*` is not listed, add it as a workspace pattern. If only `packages/*` and `apps/*` are listed, add `tools/*` so pnpm recognizes the new plugin.

- [ ] **Step 3: Create `tools/eslint-plugin-variscout/package.json`**

```json
{
  "name": "eslint-plugin-variscout",
  "version": "0.1.0",
  "description": "VariScout-specific ESLint rules (ADR-069 numeric safety, chart colors, terminology)",
  "main": "index.js",
  "type": "module",
  "private": true,
  "engines": {
    "node": ">=20"
  },
  "peerDependencies": {
    "eslint": "^9.0.0"
  },
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "workspace:*"
  }
}
```

- [ ] **Step 4: Create `tools/eslint-plugin-variscout/index.js`**

```javascript
// eslint-plugin-variscout — VariScout-specific rules
// Rules are added one-by-one in subsequent tasks.

export default {
  meta: {
    name: 'eslint-plugin-variscout',
    version: '0.1.0',
  },
  rules: {
    // Populated in Tasks 2-5.
  },
};
```

- [ ] **Step 5: Create `tools/eslint-plugin-variscout/README.md`**

Content: rule catalog (initially empty, filled in by subsequent tasks), installation note (workspace-local via `eslint-plugin-variscout: workspace:*`), references to ADR-069, P5 contribution principle, and interaction-language feedback memory. Target length: ~60 lines. Sections: `# eslint-plugin-variscout` → `## Installation` → `## Rules` (table, initially TBD — use `<!-- filled in Tasks 2-5 -->` marker that subsequent tasks replace) → `## Development` (how to add a rule, run tests) → `## References`.

**Important:** do NOT use "TBD" as a placeholder in user-facing text; instead write a complete README that says "Rules are being added incrementally; see `index.js` for the current list." — so the file is self-consistent even before all rules land.

- [ ] **Step 6: Add plugin to root `package.json` devDependencies**

Add `"eslint-plugin-variscout": "workspace:*"` to root `package.json` `devDependencies`. Run `pnpm install` to link.

- [ ] **Step 7: Verify plugin loads in eslint.config.js**

Temporarily add this import at top of `eslint.config.js` (will be properly wired in Task 2):

```javascript
import variscoutPlugin from 'eslint-plugin-variscout';
console.log('[variscout-plugin loaded]', Object.keys(variscoutPlugin.rules));
```

Then run:

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite && pnpm lint 2>&1 | grep variscout-plugin
```

Expected: `[variscout-plugin loaded] []` (empty rules array is OK at this stage).

Remove the temporary log before committing.

- [ ] **Step 8: Commit**

```bash
git add tools/eslint-plugin-variscout/ package.json pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(agent-arch): scaffold eslint-plugin-variscout workspace package

Empty plugin shell; rules added in subsequent tasks. Wired into pnpm
workspaces and root devDependencies via workspace:*.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 2: Implement `no-tofixed-on-stats` rule (TDD)

**Files:**

- Create: `tools/eslint-plugin-variscout/rules/no-tofixed-on-stats.js`
- Create: `tools/eslint-plugin-variscout/rules/__tests__/no-tofixed-on-stats.test.js`
- Modify: `tools/eslint-plugin-variscout/index.js` (register rule)
- Modify: `eslint.config.js` (remove lines 154-163 inline rule, add new rule at same scope/severity)

**Goal:** AST-based rule that flags `.toFixed()` calls which are **not** inside a block where `Number.isFinite(arg)` was called first on the same receiver variable (or its ancestor expression). Replaces the existing warn-level inline rule without changing scope or severity yet. Scope widening is Task 8.

- [ ] **Step 1: Write failing fixtures**

Create `rules/__tests__/no-tofixed-on-stats.test.js` using ESLint's `RuleTester`:

Passing fixtures (must NOT be flagged):

- `const x = mean; if (Number.isFinite(x)) { label = x.toFixed(2); }` — guarded
- `const x = internalCompute(); const s = x.toFixed(4); // eslint-disable-next-line -- internal computation per code-style.md` — explicit suppression
- `const n = 3.14159; return n.toFixed(2);` — literal-number target (allowlist: literals and non-stats call chains)
- `formatStatistic(value, 2)` — no `.toFixed()` at all

Failing fixtures (MUST be flagged):

- `const cpk = calculateCpk(data); return cpk.toFixed(2);` — unguarded
- `<div>{stats.mean.toFixed(3)}</div>` — unguarded JSX expression
- `return mean.toFixed(sigma > 0 ? 4 : 2);` — guard on a different variable
- `const s = stats.cp.toFixed(2);` — unguarded property access

Test skeleton:

```javascript
import { RuleTester } from 'eslint';
import rule from '../no-tofixed-on-stats.js';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

ruleTester.run('no-tofixed-on-stats', rule, {
  valid: [
    { code: 'const x = m; if (Number.isFinite(x)) { return x.toFixed(2); }' },
    { code: 'const n = 3.14; return n.toFixed(2);' },
    { code: 'formatStatistic(value, 2);' },
  ],
  invalid: [
    {
      code: 'const cpk = calc(); return cpk.toFixed(2);',
      errors: [{ messageId: 'unguarded' }],
    },
    {
      code: 'return stats.cp.toFixed(2);',
      errors: [{ messageId: 'unguarded' }],
    },
  ],
});
```

Run: `cd tools/eslint-plugin-variscout && pnpm test` → Expect: fail (rule not implemented).

- [ ] **Step 2: Implement rule in `rules/no-tofixed-on-stats.js`**

Rule design (AST-based):

- Visit every `CallExpression` whose `callee.type === 'MemberExpression'` and `callee.property.name === 'toFixed'`
- Walk up AST to find enclosing `BlockStatement` or containing `Program`
- Within that block, scan for any `CallExpression` matching `Number.isFinite(...)` where the argument is structurally equal (by source text) to the receiver of `.toFixed()`
- If no guard found AND the receiver is not a numeric literal AND no `// eslint-disable` suppression is present → report with `messageId: 'unguarded'`
- Exempt receivers: number literals (`3.14.toFixed(2)`), identifiers named `n|num|value` where the nearest declaration is a literal assignment (simple heuristic for internal computation strings)

Error message schema:

```javascript
messages: {
  unguarded: "Guard with Number.isFinite() before .toFixed(), or use formatStatistic() from @variscout/core/i18n. See ADR-069.",
}
```

Run: `pnpm test` → Expect: all fixtures pass.

- [ ] **Step 3: Register rule in plugin index**

Edit `tools/eslint-plugin-variscout/index.js`:

```javascript
import noTofixedOnStats from './rules/no-tofixed-on-stats.js';

export default {
  meta: { name: 'eslint-plugin-variscout', version: '0.1.0' },
  rules: {
    'no-tofixed-on-stats': noTofixedOnStats,
  },
};
```

- [ ] **Step 4: Replace inline rule in `eslint.config.js`**

Delete lines 154-163 (the existing inline `no-restricted-syntax` block).

Add, near the top of `eslint.config.js` imports:

```javascript
import variscoutPlugin from 'eslint-plugin-variscout';
```

Add a new config object (preserve scope + severity from old rule):

```javascript
{
  files: ['packages/ui/src/**/*.{ts,tsx}', 'packages/core/src/ai/prompts/**/*.ts'],
  plugins: { variscout: variscoutPlugin },
  rules: {
    'variscout/no-tofixed-on-stats': 'warn',
  },
},
```

Keep severity at `warn` — widening + upgrade to `error` is Task 8.

- [ ] **Step 5: Run monorepo lint**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite && pnpm lint 2>&1 | grep -E "(no-tofixed-on-stats|error|warning)" | head -30
```

Expected: warnings at the same call sites as the previous inline rule flagged. Count should be ≤ prior count (AST is more precise than regex).

- [ ] **Step 6: Commit**

```bash
git add tools/eslint-plugin-variscout/ eslint.config.js
git commit -m "$(cat <<'EOF'
feat(agent-arch): no-tofixed-on-stats ESLint rule (replaces inline rule)

AST-based rule in eslint-plugin-variscout. Scope + severity match the old
inline no-restricted-syntax rule at eslint.config.js:154-163 (now removed).
Scope widening and upgrade to error is a separate task.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 3: Implement `no-hardcoded-chart-colors` rule (TDD)

**Files:**

- Create: `tools/eslint-plugin-variscout/rules/no-hardcoded-chart-colors.js`
- Create: `tools/eslint-plugin-variscout/rules/__tests__/no-hardcoded-chart-colors.test.js`
- Modify: `tools/eslint-plugin-variscout/index.js` (register rule)
- Modify: `eslint.config.js` (add rule scoped to `packages/charts/**`)

**Goal:** AST rule that flags hex color literals (`/^#[0-9a-fA-F]{3,8}$/`) appearing in string literals or JSX attribute values in chart files. Allowlist: imports from `./colors` or `@variscout/charts/colors`.

- [ ] **Step 1: Write failing fixtures**

Passing:

- `import { chartColors } from './colors'; const c = chartColors.pass;`
- `const comment = "# This is not a hex color";` — not a color string
- `const url = 'https://example.com/#fragment';` — fragment, not a color
- `<circle fill={chartColors.mean} />`

Failing:

- `const c = '#22c55e';` → flag
- `<rect fill="#ef4444" />` → flag (JSX string literal)
- `const palette = ['#22c55e', '#ef4444', '#f59e0b'];` → flag all 3
- `color: '#000';` → flag (3-char hex)

Test file path: `tools/eslint-plugin-variscout/rules/__tests__/no-hardcoded-chart-colors.test.js`.

Run: `pnpm test` → fail.

- [ ] **Step 2: Implement rule**

Rule:

- Visit every `Literal` whose `value` is a string matching `/^#[0-9a-fA-F]{3,8}$/`
- Visit every JSX `Literal` in JSXAttribute position whose value matches the same regex
- Skip strings inside `ImportDeclaration` nodes (imports never contain hex strings structurally, but guard anyway)
- Report with `messageId: 'hardcoded'`

Error message:

```javascript
messages: {
  hardcoded: "Use chartColors/chromeColors from @variscout/charts/colors. Hardcoded hex values are forbidden in chart packages.",
}
```

Run tests → pass.

- [ ] **Step 3: Register + wire**

Add to `index.js`:

```javascript
import noHardcodedChartColors from './rules/no-hardcoded-chart-colors.js';
// ...
'no-hardcoded-chart-colors': noHardcodedChartColors,
```

Add to `eslint.config.js`:

```javascript
{
  files: ['packages/charts/**/*.{ts,tsx}'],
  plugins: { variscout: variscoutPlugin },
  rules: {
    'variscout/no-hardcoded-chart-colors': 'error',
    // Allow within the colors module itself
  },
},
{
  files: ['packages/charts/src/colors.ts'],
  rules: {
    'variscout/no-hardcoded-chart-colors': 'off',
  },
},
```

Severity is `error` from day 1 because `packages/charts/` has been using the constants for months; violations should be zero or near-zero.

- [ ] **Step 4: Run lint, fix violations**

```bash
pnpm lint 2>&1 | grep no-hardcoded-chart-colors
```

Expected: 0 errors (codebase already uses constants). If any surface, replace the hex literal with the appropriate `chartColors.*` or `chromeColors.*` constant. Reference: `packages/charts/src/colors.ts` for the canonical palette.

- [ ] **Step 5: Commit**

```bash
git add tools/eslint-plugin-variscout/ eslint.config.js
git commit -m "$(cat <<'EOF'
feat(agent-arch): no-hardcoded-chart-colors ESLint rule

AST rule scoped to packages/charts/** (excluding colors.ts). Error-level
from day 1 since the constants pattern is established. Enforces the
'Never hardcode hex colors in charts' hard rule from root CLAUDE.md.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 4: Implement `no-root-cause-language` rule (TDD)

**Files:**

- Create: `tools/eslint-plugin-variscout/rules/no-root-cause-language.js`
- Create: `tools/eslint-plugin-variscout/rules/__tests__/no-root-cause-language.test.js`
- Modify: `tools/eslint-plugin-variscout/index.js`
- Modify: `eslint.config.js`

**Goal:** AST rule that flags the pattern `/root[\s_-]?cause/i` appearing in string literals or template literals in i18n message catalogs and AI prompt templates. Per user feedback memory (`feedback_contribution_not_causation.md`) and P5: EDA shows contribution, not proof. User-facing strings and AI prompts must use "contribution."

- [ ] **Step 1: Write failing fixtures**

Passing:

- `const msg = 'Likely contribution: factor A';`
- `const comment = '// Historical note: prior versions used "root cause" here';` — regex only matches string/template bodies; JS comments parse as `Comment` nodes, not Literal nodes, so they're exempt by AST
- `const key = 'rootCauseLabel';` — identifier-like text; matches regex but only flag if the Literal is in a user-facing context

Failing:

- `const label = 'Root Cause Analysis';`
- `const prompt = \`Identify the root_cause of the variation\`;` (template literal)
- `const msg = 'The root-cause is unknown';`
- `messages: { rootCauseHeading: "Root Cause" }` — Literal value

- [ ] **Step 2: Implement rule**

Rule:

- Visit every `Literal` whose `value` is a string matching `/root[\s_-]?cause/i`
- Visit every `TemplateLiteral` whose quasis contain the regex match
- Report with `messageId: 'forbidden'`

Identifiers (`rootCauseLabel`) are NOT flagged — this rule targets user-visible text only. Internal variable names can be audited in a Phase 4 follow-up if needed.

Error message:

```javascript
messages: {
  forbidden: "Use 'contribution' (P5). Root cause language is forbidden in user-facing strings and AI prompts. EDA shows contribution, not causation.",
}
```

- [ ] **Step 3: Register + wire**

Plugin index: add `'no-root-cause-language': noRootCauseLanguage`.

`eslint.config.js`:

```javascript
{
  files: [
    'packages/core/src/i18n/**/*.ts',
    'packages/core/src/ai/prompts/**/*.ts',
  ],
  plugins: { variscout: variscoutPlugin },
  rules: {
    'variscout/no-root-cause-language': 'error',
  },
},
```

- [ ] **Step 4: Run lint, fix violations**

```bash
pnpm lint 2>&1 | grep no-root-cause-language
```

Expected: 0 errors if the April 2026 terminology migration was complete. If any hit, either:

- Replace the string with the "contribution" variant (prefer)
- If the usage is genuinely historical (e.g., a deprecation-warning message that references the old term), suppress with `// eslint-disable-next-line variscout/no-root-cause-language -- deprecation warning, quoting old term`

- [ ] **Step 5: Commit**

```bash
git add tools/eslint-plugin-variscout/ eslint.config.js
git commit -m "$(cat <<'EOF'
feat(agent-arch): no-root-cause-language ESLint rule

AST rule scoped to i18n messages + AI prompts. Enforces P5 'contribution
not causation' principle from root CLAUDE.md and the constitution.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 5: Implement `no-interaction-moderator` rule (TDD)

**Files:**

- Create: `tools/eslint-plugin-variscout/rules/no-interaction-moderator.js`
- Create: `tools/eslint-plugin-variscout/rules/__tests__/no-interaction-moderator.test.js`
- Modify: `tools/eslint-plugin-variscout/index.js`
- Modify: `eslint.config.js`

**Goal:** AST rule that flags `moderator` or `primary` (as stand-alone role-assignment labels) appearing in string literals within interaction/regression code. Per user feedback memory (`feedback_interaction_language.md`): use geometric terms `ordinal`/`disordinal` for interactions; never assign moderator/primary roles because EDA cannot support such attribution.

- [ ] **Step 1: Write failing fixtures**

Passing:

- `const label = 'ordinal interaction';`
- `const p = 'disordinal';`
- `const comment = 'primary key column';` — "primary" appears but in database-column context, not interaction role. **Rule must be context-aware** (see Step 2 logic).
- `const role = getPrimaryRoleColor();` — identifier, not Literal

Failing:

- `const label = 'moderator variable';`
- `const role = 'primary factor';`
- `messages: { moderatorHint: "Factor X is the moderator" }`
- `const desc = 'The primary driver of variation';` — flagged: "primary driver" in a stats/regression file

**Context filter:** the rule is only active when the file path matches `packages/core/src/stats/**` or the file contains the words `interaction`, `regression`, or `anova` in its basename. This avoids false positives on unrelated "primary" usage (UI primary button color, SQL primary key, etc.).

- [ ] **Step 2: Implement rule**

Rule logic:

- Active only when `context.filename` matches `/packages\/core\/src\/stats\//` OR the basename matches `/(interaction|regression|anova)/i`
- Visit `Literal` + `TemplateLiteral` as in Task 4
- Match `/\b(moderator|primary)\b/i` in the string value
- Report with `messageId: 'forbidden'`

Error message:

```javascript
messages: {
  forbidden: "Use geometric interaction terms (ordinal/disordinal). 'Moderator' and 'primary' role assignments are forbidden — EDA cannot attribute roles. See feedback memory: interaction language.",
}
```

- [ ] **Step 3: Register + wire**

`eslint.config.js`:

```javascript
{
  files: [
    'packages/core/src/stats/**/*.ts',
    'packages/core/src/**/interaction*.ts',
    'packages/core/src/**/regression*.ts',
    'packages/core/src/**/anova*.ts',
  ],
  plugins: { variscout: variscoutPlugin },
  rules: {
    'variscout/no-interaction-moderator': 'error',
  },
},
```

- [ ] **Step 4: Run lint, fix violations**

```bash
pnpm lint 2>&1 | grep no-interaction-moderator
```

Expected: 0 errors if the code-review-caught flakiness fix for interaction tests (per MEMORY.md: "Interaction tests use deterministic PRNG... fixed after code review caught flakiness") also removed the moderator/primary language. If any surface, replace with ordinal/disordinal vocabulary. Expected zero hits since these terms were already culled.

- [ ] **Step 5: Commit**

```bash
git add tools/eslint-plugin-variscout/ eslint.config.js
git commit -m "$(cat <<'EOF'
feat(agent-arch): no-interaction-moderator ESLint rule

AST rule scoped to packages/core/src/stats/** + interaction/regression/anova
files. Enforces geometric interaction language (ordinal/disordinal) and
bans role attribution (moderator/primary). Per feedback memory.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 6: Implement `check-ssot.sh` pre-commit hook

**Files:**

- Create: `scripts/check-ssot.sh`
- Modify: `.husky/pre-commit` (invoke the new script)

**Goal:** Bash hook that detects content duplication across `CLAUDE.md` files (root + package + app). For each section heading (`^## `) in a CLAUDE.md, fingerprint the section body (strip whitespace, lowercase, first 500 chars) and warn if the same fingerprint appears in ≥2 CLAUDE.mds. This catches "Package invariants" drifting into root or root principles drifting into a package file.

- [ ] **Step 1: Write a test fixture**

Create a temp directory with:

- `test-good/root-claude.md` — `## Hard rules\n- Never use .toFixed()` (root only)
- `test-good/pkg-claude.md` — `## Invariants\n- Must return number | undefined` (pkg only)
- `test-bad/root-claude.md` — `## Hard rules\n- Never hardcode hex colors` (root)
- `test-bad/pkg-claude.md` — `## Hard rules\n- Never hardcode hex colors` (pkg — SSOT violation)

Run script against each directory, verify exit code:

- `test-good/`: exit 0, no warnings
- `test-bad/`: exit 0 (warn mode), stderr mentions the duplicated section pair

- [ ] **Step 2: Implement `scripts/check-ssot.sh`**

```bash
#!/usr/bin/env bash
# check-ssot.sh — detect section duplication across CLAUDE.md files.
# Warn mode: prints duplicates but exits 0. Upgrade to fail mode in Phase 4.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Collect all CLAUDE.md files (root + packages + apps, exclude .bak)
FILES=$(find "$ROOT" -maxdepth 4 -name 'CLAUDE.md' -not -path '*/node_modules/*' -not -name 'CLAUDE.md.bak')

# For each file, extract (file, section-heading, fingerprint) tuples
# Fingerprint = first 500 chars of section body, lowercased, whitespace-collapsed
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

for f in $FILES; do
  awk -v file="$f" '
    /^## / { heading = $0; body = ""; next }
    heading { body = body " " $0 }
    END {
      if (heading) print file "\t" heading "\t" tolower(substr(body, 1, 500))
    }
  ' "$f" >> "$TMP" || true
done

# Find fingerprints appearing in >1 file
DUPES=$(awk -F'\t' '{count[$3]++; lines[$3] = lines[$3] "\n  " $1 ": " $2} END {for (k in count) if (count[k] > 1) print lines[k] "\n---"}' "$TMP")

if [ -n "$DUPES" ]; then
  echo "⚠ SSOT check: duplicate CLAUDE.md sections detected:" >&2
  echo "$DUPES" >&2
  echo "" >&2
  echo "Each fact should live in exactly one CLAUDE.md. Move shared content to the owner per spec Layer 1-5 ownership table." >&2
  # Warn mode: exit 0. Upgrade to exit 1 in Phase 4.
  exit 0
fi

echo "✓ SSOT check: no duplicate CLAUDE.md sections."
```

Make executable: `chmod +x scripts/check-ssot.sh`.

- [ ] **Step 3: Test against known-good state**

```bash
bash /Users/jukka-mattiturtiainen/Projects/VariScout_lite/scripts/check-ssot.sh
```

Expected: `✓ SSOT check: no duplicate CLAUDE.md sections.` (Phase 2 just delivered clean ownership; there should be no duplicates.)

If duplicates surface, investigate and either consolidate or accept (e.g., both package files genuinely need the same "Purpose" boilerplate — in which case tune the fingerprint heuristic to skip sections shorter than N lines).

- [ ] **Step 4: Wire into `.husky/pre-commit`**

Append to existing `.husky/pre-commit` (after `pnpm docs:check`):

```bash
# SSOT check — warn if CLAUDE.md sections duplicate content across files
bash scripts/check-ssot.sh
```

- [ ] **Step 5: Commit**

```bash
git add scripts/check-ssot.sh .husky/pre-commit
git commit -m "$(cat <<'EOF'
feat(agent-arch): check-ssot pre-commit hook (warn mode)

Detects section-fingerprint duplicates across CLAUDE.md files. Warn-only
in Phase 3; upgrade to fail in Phase 4 after confidence period.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 7: Implement `check-claude-md-size.sh` pre-commit hook

**Files:**

- Create: `scripts/check-claude-md-size.sh`
- Modify: `.husky/pre-commit`

**Goal:** Bash hook that checks each CLAUDE.md against a per-file line budget. Warn at 80% of budget, fail at 120%. Budgets match the spec Layer 2 table.

- [ ] **Step 1: Define the budget table**

From spec line 157-166:

| File                        | Budget | Warn at (80%) | Fail at (120%) |
| --------------------------- | ------ | ------------- | -------------- |
| `CLAUDE.md` (root)          | 50     | 40            | 60             |
| `packages/core/CLAUDE.md`   | 80     | 64            | 96             |
| `packages/charts/CLAUDE.md` | 50     | 40            | 60             |
| `packages/hooks/CLAUDE.md`  | 40     | 32            | 48             |
| `packages/ui/CLAUDE.md`     | 50     | 40            | 60             |
| `packages/stores/CLAUDE.md` | 40     | 32            | 48             |
| `packages/data/CLAUDE.md`   | 20     | 16            | 24             |
| `apps/azure/CLAUDE.md`      | 70     | 56            | 84             |
| `apps/pwa/CLAUDE.md`        | 30     | 24            | 36             |

**Current state (measured at plan-write time):** root 57, core 42, charts 38, hooks 34, ui 34, stores 33, data 21, azure 40, pwa 33. All within `fail` ceilings; root is above warn threshold (40). This is acceptable — warn fires, hook exits 0, author knows.

- [ ] **Step 2: Implement script**

```bash
#!/usr/bin/env bash
# check-claude-md-size.sh — enforce CLAUDE.md size budgets per spec Layer 2.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Budgets (lines)
declare -A BUDGETS=(
  ["CLAUDE.md"]=50
  ["packages/core/CLAUDE.md"]=80
  ["packages/charts/CLAUDE.md"]=50
  ["packages/hooks/CLAUDE.md"]=40
  ["packages/ui/CLAUDE.md"]=50
  ["packages/stores/CLAUDE.md"]=40
  ["packages/data/CLAUDE.md"]=20
  ["apps/azure/CLAUDE.md"]=70
  ["apps/pwa/CLAUDE.md"]=30
)

FAILED=0
WARNED=0

for file in "${!BUDGETS[@]}"; do
  path="$ROOT/$file"
  if [ ! -f "$path" ]; then
    echo "⚠ Missing: $file" >&2
    WARNED=$((WARNED + 1))
    continue
  fi
  budget=${BUDGETS[$file]}
  lines=$(wc -l < "$path" | tr -d ' ')
  warn=$((budget * 80 / 100))
  fail=$((budget * 120 / 100))

  if [ "$lines" -gt "$fail" ]; then
    echo "✗ $file: $lines lines exceeds fail threshold ($fail, 120% of $budget)" >&2
    FAILED=$((FAILED + 1))
  elif [ "$lines" -gt "$warn" ]; then
    echo "⚠ $file: $lines lines exceeds warn threshold ($warn, 80% of $budget). Budget: $budget." >&2
    WARNED=$((WARNED + 1))
  fi
done

if [ "$FAILED" -gt 0 ]; then
  echo "" >&2
  echo "CLAUDE.md size fail: $FAILED file(s) exceed 120% of budget. Tighten or split into skills/reference files." >&2
  exit 1
fi

if [ "$WARNED" -gt 0 ]; then
  echo "" >&2
  echo "CLAUDE.md size warn: $WARNED file(s) exceed 80% of budget. Consider tightening before Phase 4." >&2
fi

echo "✓ CLAUDE.md size check OK."
```

Make executable: `chmod +x scripts/check-claude-md-size.sh`.

- [ ] **Step 3: Dry-run**

```bash
bash /Users/jukka-mattiturtiainen/Projects/VariScout_lite/scripts/check-claude-md-size.sh
```

Expected: warn about root CLAUDE.md (57 > 40 warn threshold, under 60 fail). Exit 0.

If any file crosses fail threshold, tighten the file before committing the hook (don't commit a red hook).

- [ ] **Step 4: Wire into `.husky/pre-commit`**

Append:

```bash
# CLAUDE.md size check — fail if >120% of per-file budget
bash scripts/check-claude-md-size.sh
```

- [ ] **Step 5: Commit**

```bash
git add scripts/check-claude-md-size.sh .husky/pre-commit
git commit -m "$(cat <<'EOF'
feat(agent-arch): check-claude-md-size pre-commit hook

Warn at 80%, fail at 120% of per-file budget (root 50, packages 20-80,
apps 30-70). Budgets match spec Layer 2 table.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 8: Widen `no-tofixed-on-stats` scope + fix violations

**Files:**

- Modify: `eslint.config.js` (widen rule scope)
- Potentially modify: any `.ts`/`.tsx` file with unguarded `.toFixed()` on stats

**Goal:** Extend `no-tofixed-on-stats` from its current narrow scope (`packages/ui/src/**` + `packages/core/src/ai/prompts/**`) to `packages/**/*.{ts,tsx}` + `apps/**/*.{ts,tsx}` excluding tests. Surface all existing violations and fix them (or suppress with justification comments per `code-style.md`: "For internal computation strings (e.g., equation builder), `Number.isFinite()` guard + `.toFixed()` is acceptable").

- [ ] **Step 1: Widen rule scope in `eslint.config.js`**

Change the `files:` array in the `variscout/no-tofixed-on-stats` config object to:

```javascript
files: [
  'packages/**/*.{ts,tsx}',
  'apps/**/*.{ts,tsx}',
],
ignores: [
  '**/*.test.{ts,tsx}',
  '**/__tests__/**',
  'packages/charts/src/colors.ts',
],
```

Keep severity at `warn` during migration. Upgrade to `error` at the end of this task after fixing all true-positive violations.

- [ ] **Step 2: Run monorepo lint and count violations**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite && pnpm lint 2>&1 | grep no-tofixed-on-stats | wc -l
```

Record the count. This is the "surface" number.

- [ ] **Step 3: Triage each violation**

For each violation:

1. Is the receiver a stat value (mean, cpk, sigma, etc.)? → **fix** by wrapping with `formatStatistic()` from `@variscout/core/i18n` or adding a `Number.isFinite()` guard
2. Is the receiver an internal computation value (equation-builder strings, coordinate math, time formatting)? → **suppress** with:
   ```javascript
   // eslint-disable-next-line variscout/no-tofixed-on-stats -- internal computation per code-style.md
   const s = x.toFixed(2);
   ```
3. Any ambiguous case → prefer fix over suppress.

For large fix sessions, split into smaller follow-up commits by package.

- [ ] **Step 4: After all true-positives fixed, upgrade severity to `error`**

In `eslint.config.js`, change:

```javascript
'variscout/no-tofixed-on-stats': 'error',
```

Run `pnpm lint` → expect 0 errors from this rule.

- [ ] **Step 5: Run full test suite**

```bash
pnpm test 2>&1 | tail -5
```

Expected: 5818/5818 passing (fixes should be drop-in replacements; no behavior change).

- [ ] **Step 6: Commit**

Single commit if fixes are few; split by package if fixes span many files:

```bash
git add eslint.config.js packages/ apps/
git commit -m "$(cat <<'EOF'
chore(agent-arch): widen no-tofixed-on-stats to full monorepo + fix violations

Rule now scoped to packages/**/*.{ts,tsx} + apps/**/*.{ts,tsx} (excluding
tests), severity upgraded from warn to error. Existing unguarded calls
either replaced with formatStatistic() or suppressed with justification
per code-style.md (internal computation strings exception).

Tests: 5818/5818 passing.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 9: Add `check-dead-links.sh` in warn mode + document cutoff

**Files:**

- Create: `scripts/check-dead-links.sh`
- Modify: `.husky/pre-commit`
- Modify: `docs/09-baseline/2026-04-17-agent-docs-baseline.md` (document cutoff date)

**Goal:** Bash hook that scans `docs/**/*.md` for broken relative `.md` links (e.g., a markdown link targeting `../07-decisions/adr-999.md` when the target file does not exist). Ship in warn mode for 2 weeks; flip to fail on **2026-05-01** (handled in Phase 4, not here).

- [ ] **Step 1: Implement script**

```bash
#!/usr/bin/env bash
# check-dead-links.sh — detect broken relative .md links in docs/.
# Warn mode until 2026-05-01; after that date, exit 1 on failures.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CUTOFF_DATE="2026-05-01"
TODAY=$(date +%Y-%m-%d)

BROKEN=0

# Extract (source_file, link_target) tuples from markdown relative links
# Pattern: markdown relative links with .md targets (optionally with #anchor)
while IFS= read -r line; do
  src=$(echo "$line" | cut -d: -f1)
  link=$(echo "$line" | cut -d: -f2- | grep -oE '\]\([^)]+\.md[^)]*\)' | sed 's/^](//;s/)$//')
  [ -z "$link" ] && continue

  # Strip anchor
  path_only="${link%%#*}"

  # Skip absolute URLs
  case "$path_only" in
    http://*|https://*) continue ;;
  esac

  # Resolve relative to source file's directory
  src_dir=$(dirname "$src")
  target="$src_dir/$path_only"

  if [ ! -f "$target" ]; then
    echo "  ✗ $src → $path_only" >&2
    BROKEN=$((BROKEN + 1))
  fi
done < <(grep -rnE '\[[^]]*\]\([^)]+\.md[^)]*\)' "$ROOT/docs" --include='*.md' || true)

if [ "$BROKEN" -gt 0 ]; then
  echo "" >&2
  echo "⚠ Dead-link check: $BROKEN broken relative .md link(s) found." >&2
  echo "Fix or update references. After $CUTOFF_DATE, this hook will fail the commit." >&2

  if [ "$TODAY" \> "$CUTOFF_DATE" ] || [ "$TODAY" = "$CUTOFF_DATE" ]; then
    exit 1
  fi
  exit 0
fi

echo "✓ Dead-link check: no broken .md links."
```

Make executable: `chmod +x scripts/check-dead-links.sh`.

- [ ] **Step 2: Dry-run**

```bash
bash /Users/jukka-mattiturtiainen/Projects/VariScout_lite/scripts/check-dead-links.sh
```

Expected: varies. Record the count of broken links found. These are technical debt — fix the ones that are easy; leave the rest for the 2-week window. The hook is warn-mode so commits still succeed.

- [ ] **Step 3: Wire into `.husky/pre-commit`**

Append:

```bash
# Dead-link check — warn until 2026-05-01, then fail
bash scripts/check-dead-links.sh
```

- [ ] **Step 4: Document the cutoff in baseline doc**

Append a subsection "Phase 3 — Dead-link cutoff" to `docs/09-baseline/2026-04-17-agent-docs-baseline.md`:

```markdown
### Phase 3 — Dead-link cutoff

- **Hook installed:** 2026-04-17 (warn mode)
- **Fail cutoff:** 2026-05-01 (Phase 4 responsibility)
- **Fix owner:** whoever triggered the most recent warn — addressable in PR review
- **Count at installation:** <N> (recorded by Task 9 Step 2)

The `scripts/check-dead-links.sh` hook auto-escalates to fail mode when `date +%Y-%m-%d >= 2026-05-01`. No manual flip required.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/check-dead-links.sh .husky/pre-commit docs/09-baseline/2026-04-17-agent-docs-baseline.md
git commit -m "$(cat <<'EOF'
feat(agent-arch): check-dead-links pre-commit hook (warn until 2026-05-01)

Scans docs/**/*.md for broken relative .md links. Script auto-escalates
to fail mode on 2026-05-01 — no manual flip needed. Cutoff documented
in baseline doc.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 10: Create safety branch, delete `docs/archive/`

**Files:**

- Git branch: create + push `archive-preserved`
- Delete: `docs/archive/` (27 files + subfolders)

**Goal:** Preserve `docs/archive/` in a remote branch for historical access, then delete from HEAD. Git history alone preserves it — but per spec risk table, a named branch pushed to origin is the explicit safety net.

- [ ] **Step 1: Verify current branch + clean working tree**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
git status
git rev-parse --abbrev-ref HEAD
```

Expected: on `agent-docs-arch/phase1-foundation` (Phase 3 continues on this branch), clean working tree (all prior tasks committed).

- [ ] **Step 2: Create + push `archive-preserved` branch from current HEAD**

```bash
git branch archive-preserved
git push -u origin archive-preserved
```

Verify branch exists on remote:

```bash
git ls-remote origin archive-preserved
```

Expected: one line showing SHA + `refs/heads/archive-preserved`.

- [ ] **Step 3: Tag the safety snapshot**

```bash
git tag -a archive-snapshot-2026-04-17 -m "docs/archive/ contents preserved before Phase 3 deletion"
git push origin archive-snapshot-2026-04-17
```

- [ ] **Step 4: Count files to delete (sanity check)**

```bash
find /Users/jukka-mattiturtiainen/Projects/VariScout_lite/docs/archive -type f | wc -l
```

Expected: 27+ files (actual count may be higher including subfolder content — e.g., `archive/plans-2026-03/`, `archive/specs/`, `archive/evaluation-patterns/` per `ls` output). Record the exact count.

- [ ] **Step 5: Delete `docs/archive/`**

```bash
rm -rf /Users/jukka-mattiturtiainen/Projects/VariScout_lite/docs/archive
```

- [ ] **Step 6: Check for broken links**

```bash
bash /Users/jukka-mattiturtiainen/Projects/VariScout_lite/scripts/check-dead-links.sh
```

Expected: the warn count will likely increase. For each new broken link pointing into `docs/archive/`, either:

- Remove the reference entirely (preferred — the archive is being deleted)
- Redirect to the current doc that superseded the archived one

Fix the new breakages before committing. Tests from Task 9 already ran; the hook is in warn mode so commit won't block.

- [ ] **Step 7: Run doc health + tests**

```bash
bash scripts/check-doc-health.sh
pnpm test 2>&1 | tail -5
```

Expected: doc-health passes; 5818/5818 tests passing.

- [ ] **Step 8: Commit**

```bash
git add -A docs/
git commit -m "$(cat <<'EOF'
chore(agent-arch): delete docs/archive/ (preserved in archive-preserved branch)

27+ files removed. Content available at:
- Branch: origin/archive-preserved
- Tag:    archive-snapshot-2026-04-17

Inbound links fixed or removed. Doc health passes; tests 5818/5818.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 11: Delete `.claude/rules/` and `CLAUDE.md.bak`

**Files:**

- Delete: `.claude/rules/charts.md`, `code-style.md`, `documentation.md`, `monorepo.md`, `ruflo.md`, `testing.md` (6 files, 724 lines)
- Delete: `.claude/rules/` (empty directory)
- Delete: `/CLAUDE.md.bak` (181 lines)

**Goal:** Realize the full always-loaded context reduction (781 → 57 lines). Phase 2 ran `.claude/rules/` and root CLAUDE.md in parallel as belt-and-suspenders. Now that all 12 skills are populated, atomic swap is verified, and ESLint rules enforce the hard rules, `.claude/rules/` is redundant.

- [ ] **Step 1: Verify skills are populated**

```bash
for f in /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.claude/skills/*/SKILL.md; do
  if grep -q "^<!-- Body to be populated" "$f"; then
    echo "STILL EMPTY: $f"
  fi
done
```

Expected: no output. (If any skill is still empty, STOP and finish Phase 2 first.)

- [ ] **Step 2: Verify ESLint rules are live**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite && pnpm lint 2>&1 | tail -5
```

Expected: clean or trivial warnings only. No errors from `variscout/*` rules.

- [ ] **Step 3: Delete `.claude/rules/`**

```bash
rm -rf /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.claude/rules
```

- [ ] **Step 4: Delete `CLAUDE.md.bak`**

```bash
rm /Users/jukka-mattiturtiainen/Projects/VariScout_lite/CLAUDE.md.bak
```

- [ ] **Step 5: Check for inbound references to `.claude/rules/`**

```bash
grep -rn "\.claude/rules/" /Users/jukka-mattiturtiainen/Projects/VariScout_lite --include='*.md' --include='*.ts' --include='*.tsx' --include='*.js' 2>&1 | grep -v node_modules | grep -v dist | head -30
```

For each reference, either:

- Update to point to the replacement skill (e.g., `.claude/rules/charts.md` → `.claude/skills/editing-charts/SKILL.md`)
- Delete the reference if it's in a deprecated comment

Historical references in git log, ADRs, or the spec are acceptable — those are immutable records.

- [ ] **Step 6: Check for references to `CLAUDE.md.bak`**

```bash
grep -rn "CLAUDE.md.bak" /Users/jukka-mattiturtiainen/Projects/VariScout_lite --include='*.md' 2>&1 | grep -v node_modules | head -10
```

For each reference: remove or update.

- [ ] **Step 7: Run full gate**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
bash scripts/check-doc-health.sh
bash scripts/check-ssot.sh
bash scripts/check-claude-md-size.sh
bash scripts/check-dead-links.sh
```

Expected: tests 5818/5818, build clean, all hooks green (or warn-only).

- [ ] **Step 8: Measure post-deletion context**

```bash
wc -l /Users/jukka-mattiturtiainen/Projects/VariScout_lite/CLAUDE.md
```

Expected: 57 lines (root only; `.claude/rules/` no longer exists). This is the A++ success metric.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(agent-arch): delete .claude/rules/ and CLAUDE.md.bak

Completes Phase 3 cleanup. Always-loaded context: 781 → 57 lines (92.7%
reduction from post-Phase 2 state). Content migrated to:
- .claude/skills/ (12 skills with bodies + reference files)
- packages/*/CLAUDE.md + apps/*/CLAUDE.md (auto-loaded when editing)
- tools/eslint-plugin-variscout/ (hard rules now deterministic)

Tests: 5818/5818 passing. Build clean.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 12: Add pre-edit advisories in `.claude/settings.json`

**Files:**

- Modify: `.claude/settings.json` (add 2 Claude Code hook entries)

**Goal:** Add lightweight advisory hooks that run inside Claude Code (not git) when the agent is about to edit an ADR or spec file. These are UI-level nudges, not blocking.

- [ ] **Step 1: Read current `.claude/settings.json`**

```bash
cat /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.claude/settings.json
```

Observe the existing structure (hooks + statusline per MEMORY.md).

- [ ] **Step 2: Add pre-edit advisory for ADRs**

Design the hook to trigger when editing `docs/07-decisions/adr-*.md`:

```json
{
  "hooks": {
    "pre-edit": [
      {
        "matcher": "docs/07-decisions/adr-*.md",
        "command": "bash -c 'if ! grep -q \"^last-reviewed:\" \"$CLAUDE_HOOK_FILE\"; then echo \"⚠ ADR missing last-reviewed frontmatter. Update when modifying.\" >&2; fi'",
        "blocking": false
      }
    ]
  }
}
```

(Exact JSON schema depends on Claude Code hook conventions. Consult `.claude/settings.json` existing structure for the correct `hooks.*` field names. If the runtime uses a different field — e.g., `preEdit` or `PreToolUse` — adapt accordingly. This is the only task where the exact hook schema is runtime-dependent and may require a discovery step.)

- [ ] **Step 3: Add pre-edit advisory for specs**

```json
{
  "matcher": "docs/superpowers/specs/*.md",
  "command": "bash -c 'if ! head -10 \"$CLAUDE_HOOK_FILE\" | grep -q \"^---$\"; then echo \"⚠ Spec missing YAML frontmatter. Add title/audience/category/status/related.\" >&2; fi'",
  "blocking": false
}
```

- [ ] **Step 4: Verify hooks load**

Trigger a no-op edit on an ADR to observe the advisory fires. Method depends on Claude Code runtime — simplest is to `touch docs/07-decisions/adr-069-*.md` via the Edit tool in a fresh session and observe stderr.

If the hook format is unfamiliar, fall back to documenting the intent in the baseline doc and deferring implementation to Phase 4.

- [ ] **Step 5: Commit**

```bash
git add .claude/settings.json
git commit -m "$(cat <<'EOF'
feat(agent-arch): pre-edit advisories for ADR + spec frontmatter

Warn when editing an ADR without 'last-reviewed' frontmatter, or a spec
without any frontmatter. Non-blocking; runs inside Claude Code.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 13: Scope MEMORY.md + spec update + Phase 3 completion

**Files:**

- Audit: `/Users/jukka-mattiturtiainen/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/MEMORY.md` (user-level, 92 lines at plan-write time)
- Modify: `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md` (update Implementation Plans section with Phase 3 link)
- Modify: `docs/09-baseline/2026-04-17-agent-docs-baseline.md` (append "Phase 3 Completion" section)

**Goal:** Honestly scope MEMORY.md per the spec's drift: audit rather than mass-delete. The spec says "remove doc-routing entries"; the actual MEMORY.md contains almost no doc-routing entries — it's all session-state/project-state memories organized by category. This task verifies and documents that finding rather than forcing a deletion.

- [ ] **Step 1: Audit MEMORY.md**

```bash
cat "/Users/jukka-mattiturtiainen/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/MEMORY.md"
```

For each entry, classify as:

- **Session state** (user feedback, project state, active feature context) → KEEP
- **Doc routing** (e.g., "for X, read Y.md") that duplicates root CLAUDE.md routing → REMOVE

Record the counts. Per the plan-writer's initial inspection: the file is entirely session/project state — no doc-routing entries exist. **Expected action: no deletion.** Document the audit result.

- [ ] **Step 2: If any doc-routing duplicates found, remove them**

If the audit surfaces any entries that say "see CLAUDE.md for X" or duplicate routing targets already in root CLAUDE.md (lines 124-136), remove those lines from MEMORY.md. Most likely: none exist. Do NOT mass-delete categories; surgical removal only.

- [ ] **Step 3: Update spec's Implementation Plans section**

Edit `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md` lines ~457-463. Replace:

```markdown
- Phase 3: Enforcement + cleanup (ESLint + hooks + rules/ + archive/ deletion) — plan to be written after Phase 2 ships
```

with:

```markdown
- [Phase 3: Enforcement + cleanup](../plans/2026-04-17-agent-docs-architecture-phase3-enforcement.md) — ESLint plugin (4 rules) + pre-commit hooks (ssot, claude-md-size, dead-links) + pre-edit advisories; delete `.claude/rules/` + `docs/archive/` + `CLAUDE.md.bak`; audit MEMORY.md scope. Delivered YYYY-MM-DD (replace with actual completion date).
```

Set the status frontmatter at the top of the spec from `status: draft` → `status: delivered` (per spec-anchored policy: delivered specs stay in place).

- [ ] **Step 4: Append "Phase 3 Completion" section to baseline doc**

Append to `docs/09-baseline/2026-04-17-agent-docs-baseline.md`:

```markdown
### Phase 3 Completion

**Date:** YYYY-MM-DD (fill in at execution time)

**Delivered:**

- `eslint-plugin-variscout` with 4 rules (no-tofixed-on-stats, no-hardcoded-chart-colors, no-root-cause-language, no-interaction-moderator)
- 3 new pre-commit hooks: check-ssot.sh (warn), check-claude-md-size.sh (fail), check-dead-links.sh (warn until 2026-05-01)
- 2 pre-edit advisories in .claude/settings.json (ADR frontmatter, spec frontmatter)
- `no-tofixed-on-stats` scope widened: packages/ui + ai-prompts → full monorepo excluding tests; severity warn → error
- Existing rule violations fixed or suppressed with justification
- `.claude/rules/` deleted (724 lines removed from always-loaded context)
- `docs/archive/` deleted (27+ files; preserved as origin/archive-preserved + tag archive-snapshot-2026-04-17)
- `CLAUDE.md.bak` deleted (181-line rollback file)
- MEMORY.md scope audit complete: no doc-routing duplicates found; file remains session-state-only

**Measured outcomes:**

- Always-loaded context: 781 → 57 lines (92.7% reduction from post-Phase 2 state; 93.7% from pre-Phase 1)
- ESLint violations of new rules: 0
- Broken `.md` links in docs/: <N> at install, trending toward 0 by 2026-05-01 cutoff
- Tests: 5818/5818 passing throughout

**Deferred to Phase 4:**

- `check-ssot.sh` warn → fail escalation
- `check-claude-md-size.sh` warn-count monitoring (root CLAUDE.md 57 > 40 warn threshold)
- CI doc-lint stage (repo does not currently have `.github/workflows/` doc-lint; to be added after warn→fail transitions stabilize)
- Skill activation telemetry review (weekly in first month)
- Promotion of new manual correction patterns to ESLint rules
```

- [ ] **Step 5: Final verification**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
pnpm lint 2>&1 | tail -10
bash scripts/check-doc-health.sh
bash scripts/check-ssot.sh
bash scripts/check-claude-md-size.sh
bash scripts/check-dead-links.sh
wc -l CLAUDE.md
ls .claude/rules 2>&1  # expect "No such file or directory"
ls CLAUDE.md.bak 2>&1  # expect "No such file or directory"
ls docs/archive 2>&1   # expect "No such file or directory"
```

Expected:

- Tests: 5818/5818
- Build: clean
- Lint: 0 errors from `variscout/*` rules
- All hooks: warn-only or green
- `wc -l CLAUDE.md`: 57
- Deleted paths: absent

- [ ] **Step 6: Final commit**

```bash
git add docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md docs/09-baseline/2026-04-17-agent-docs-baseline.md
git commit -m "$(cat <<'EOF'
docs(agent-arch): Phase 3 Enforcement + Cleanup complete

- 4 ESLint rules in eslint-plugin-variscout
- 3 pre-commit hooks (ssot, claude-md-size, dead-links)
- 2 pre-edit advisories
- .claude/rules/ deleted (724 lines) + docs/archive/ deleted (27+ files) + CLAUDE.md.bak deleted (181 lines)
- MEMORY.md audited (no doc-routing duplicates found; session-state only)
- Spec status: draft → delivered; Implementation Plans section updated

Always-loaded context: 781 → 57 lines (92.7% reduction).
Tests: 5818/5818 passing.

Phase 4 (observe + iterate) begins on next session — not covered by this plan.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Phase 3 Summary

**What shipped:**

- `tools/eslint-plugin-variscout/` with 4 AST-based rules: `no-tofixed-on-stats`, `no-hardcoded-chart-colors`, `no-root-cause-language`, `no-interaction-moderator`
- Existing inline `no-restricted-syntax` rule (`eslint.config.js:154-163`) replaced by the plugin rule; scope widened from `packages/ui` + `ai/prompts` to full monorepo; severity upgraded `warn` → `error` after violation fixes
- 3 pre-commit hooks: `check-ssot.sh`, `check-claude-md-size.sh`, `check-dead-links.sh`
- 2 pre-edit advisories in `.claude/settings.json`
- `.claude/rules/` deleted (6 files, 724 lines)
- `docs/archive/` deleted (27+ files) — preserved as `origin/archive-preserved` branch + `archive-snapshot-2026-04-17` tag
- `CLAUDE.md.bak` deleted (181 lines, rollback file)
- MEMORY.md audited: no doc-routing duplicates; no changes needed
- Spec status flipped to `delivered`, Implementation Plans section updated

**Measurable outcomes:**

- Always-loaded context: 781 → 57 lines (92.7% reduction from post-Phase 2 state; 93.7% from pre-Phase 1 baseline of 905)
- ESLint new-rule violations: 0 after Task 8 fixes
- Dead-link count: <N> at Task 9 install, no-regression warn mode until 2026-05-01
- Test pass rate: 5818/5818 throughout

**What didn't ship (deferred to Phase 4):**

- `check-ssot.sh` warn → fail escalation
- `check-dead-links.sh` warn → fail escalation (auto-triggers 2026-05-01)
- CI doc-lint stage (repo lacks `.github/workflows/` doc-lint; add after local warn→fail stabilization)
- Skill activation telemetry review (weekly, first month)
- Stale-ADR periodic review (90-day `last-reviewed` cadence)

**Sign-off criteria:**

- All 13 tasks committed in order
- Task 13 Step 5 verification passes cleanly
- Spec's Implementation Plans section updated + status flipped to `delivered`
- Baseline doc has Phase 3 Completion subsection

---

## Self-Review Notes

Self-reviewed against `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md` Phase 3 scope (lines 342-352) and success metrics table (line 376-384).

**Spec coverage:**

- 4 ESLint plugins: Tasks 1-5 ✓
- 4 pre-commit hooks: `check-spec-index` (already live via `check-doc-health.sh` — noted; no task needed), `check-dead-links` (Task 9), `check-ssot` (Task 6), `check-claude-md-size` (Task 7) ✓
- 2 pre-edit advisories: Task 12 ✓
- Delete `.claude/rules/`: Task 11 ✓
- Delete `docs/archive/` with safety branch: Task 10 ✓
- Scope MEMORY.md: Task 13 Step 1-2 (honest audit, likely no-op per drift) ✓
- Delete `CLAUDE.md.bak`: Task 11 ✓
- Spec status update + Implementation Plans link: Task 13 Step 3 ✓
- Phase 3 completion note: Task 13 Step 4 ✓
- CI gate: explicitly deferred to Phase 4 with rationale (Task 13 completion note) — spec mentions "Add CI gate" in Phase 3 bullet 8, but the repo has no existing doc-lint CI workflow; we document the deferral rather than invent infrastructure

**Ambiguities resolved:**

- **Existing `eslint.config.js:154-163` inline rule:** REPLACED (not upgraded in place). Task 2 deletes the inline block and creates a proper plugin rule at the same narrow scope + warn severity (drop-in behavioral match). Task 8 widens scope and upgrades severity. Rationale: keeping both would be duplicate enforcement; the plugin rule is AST-based and more precise.
- **Pre-edit advisory schema:** Task 12 acknowledges the Claude Code hook schema may differ from the illustrative JSON shown. Plan directs the executor to inspect `.claude/settings.json` existing structure first, and fall back to documenting intent + deferring if the schema is unclear. This preserves plan truth (don't fabricate the runtime interface).
- **MEMORY.md scope:** spec says "remove doc-routing entries"; actual file has none. Task 13 Step 1-2 audits honestly and documents "no deletion needed" rather than forcing a deletion per outdated spec language.

**Drift between spec and repo state captured in this plan:**

- `docs/archive/` count: spec says 65; actual is 27 files (plus subfolders — task records exact count during execution).
- Test count: spec originally wrote 5792; actual is 5818 (used throughout).
- Inline `no-restricted-syntax` rule already exists at `eslint.config.js:154-163`; spec wrote as if blank slate.
- `CLAUDE.md.bak` exists only at root (no per-package `.bak` files — atomic swap didn't create them).

**Placeholder scan:** None in the plan body. Every task has concrete file paths, command invocations, fixture examples (even if named `<N>` for runtime-measured counts), and commit messages. The README for `eslint-plugin-variscout` explicitly avoids "TBD" (Task 1 Step 5 calls this out).

**Type/name consistency:** Rule slug is `variscout/<rule-name>` throughout. Hook script filenames are `check-<purpose>.sh` (consistent with existing `check-doc-health.sh` + `check-diagram-health.sh`). Plugin path is `tools/eslint-plugin-variscout/` throughout. Branch name `archive-preserved` + tag `archive-snapshot-2026-04-17` appear in both Task 10 and Task 11 Step 9 commit message.

**Risks the executor should know about:**

- Task 2's AST-based guard detection is non-trivial. The fixture set in Step 1 is the spec; if real-world patterns don't match, expect iteration. Budget 30-60 minutes for rule tuning.
- Task 8 violation count is unknown until the rule runs. If the count is >50, consider splitting fixes into 3-4 smaller commits by package for review sanity.
- Task 9's dead-link count is unknown. If >20, schedule a dedicated fix pass before 2026-05-01 — don't let it escalate silently.
- Task 12's pre-edit hook schema is runtime-dependent. If unfamiliar, defer to Phase 4 and document intent in baseline doc.
- Task 10's `docs/archive/` deletion will surface new dead links in Task 9 output. Address before Task 10 commit.

**Recommended execution order:** Sequential as numbered. Tasks 1-5 could in principle parallelize, but the plugin scaffold (Task 1) must land first so subsequent tasks can import from it. Tasks 6-7 are independent of each other. Tasks 10-11 MUST be sequential (safety branch before any deletion). Task 13 MUST be last.
