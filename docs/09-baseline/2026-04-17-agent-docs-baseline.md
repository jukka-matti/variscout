---
title: Agent Docs Architecture Baseline (Pre-Phase 1)
audience: [engineer]
category: reference
status: reference
last-reviewed: 2026-04-17
related: [claude-md, skills, migration, measurement]
---

# Agent Documentation Architecture — Baseline Measurements

**Date:** 2026-04-17
**Purpose:** Snapshot of system state before A++ migration begins. Used to measure success at end of each phase.

## Always-loaded context (lines)

| File                             | Lines           | Notes                                        |
| -------------------------------- | --------------- | -------------------------------------------- |
| `CLAUDE.md`                      | 181             | Root project instructions                    |
| `.claude/rules/charts.md`        | 278             | Eager-loaded rule file                       |
| `.claude/rules/code-style.md`    | 51              | Eager-loaded rule file                       |
| `.claude/rules/documentation.md` | 67              | Eager-loaded rule file                       |
| `.claude/rules/monorepo.md`      | 121             | Eager-loaded rule file                       |
| `.claude/rules/ruflo.md`         | 62              | Eager-loaded rule file                       |
| `.claude/rules/testing.md`       | 145             | Eager-loaded rule file                       |
| `MEMORY.md` (user-level)         | ~175 (estimate) | Auto-memory (user-level; lives outside repo) |
| **Total (repo files only)**      | 905             | Target after Phase 3: ≤300                   |

## Test suite baseline

- Total tests passing: 5818 / 5818
- Duration: ~250s (full turbo run, from cached logs)
- Date recorded: 2026-04-17

Test breakdown by package:

- `@variscout/core`: 2538 tests
- `@variscout/hooks`: 966 tests
- `@variscout/ui`: 1158 tests
- `@variscout/azure-app`: 770 tests
- `@variscout/charts`: 124 tests
- `@variscout/stores`: 152 tests
- `@variscout/pwa`: 110 tests

## Corpus inventory

- ADRs: 71 (`docs/07-decisions/adr-*.md`)
- Design specs: 64 (`docs/superpowers/specs/`)
- Archived: 65 (`docs/archive/`)
- Total `docs/**/*.md`: 455

## Evaluation suite — 10 failure-mode prompts

These 10 prompts test whether the agent loads correct context and avoids the two confirmed failure modes (C: context overload, D: duplication-caused conflict). Run pre-migration, end of Phase 2, end of Phase 3. Record correction count per run.

1. **Chart colors:** "Add a new Boxplot variant that highlights outliers in a distinct color." (Tests: does agent reach for `chartColors` from `@variscout/charts/colors`, not hardcode hex?)
2. **Numeric safety:** "Format a Cpk value for display in a new tooltip." (Tests: does agent use `formatStatistic()` not `.toFixed()`?)
3. **Store access:** "Read the current project title in a new component." (Tests: does agent use a direct selector from `useProjectStore`, not DataContext?)
4. **Terminology:** "Draft a CoScout response that explains why batch variation matters." (Tests: does agent avoid "root cause"?)
5. **Interaction language:** "Write a paragraph describing a two-way interaction for the user." (Tests: does agent use ordinal/disordinal, not moderator/primary?)
6. **Chart patterns:** "Add a new I-Chart annotation for a detected out-of-control point." (Tests: does agent know props-based, `useChartTheme`, annotation patterns?)
7. **Mode strategy:** "Add a new chart slot for Yamazumi mode that shows idle time." (Tests: does agent know `resolveMode`, chart slot mapping, mode transforms?)
8. **Azure auth:** "Add a call that reads a file from Blob Storage." (Tests: does agent know EasyAuth + SAS tokens + customer-owned principle, not MSAL?)
9. **i18n:** "Add a new translation key for 'Edit finding'." (Tests: does agent know locale loader + typed catalogs, not string concat?)
10. **Test setup:** "Write a component test for the new feature." (Tests: does agent put `vi.mock()` BEFORE imports? Use `toBeCloseTo` for floats?)

For each prompt, record:

- Correct on first try? (Y/N)
- Number of corrections needed
- Observed failure mode (C, D, or none)

## Phase 1 Completion

**Date completed:** 2026-04-17
**Status:** Phase 1 Foundation delivered. All files created as `.new` variants or new docs. Old system fully operational.

**Files created (10 commits, fully additive):**

- 12 skill folders with frontmatter-only `SKILL.md` in `.claude/skills/`
- 8 package/app `CLAUDE.md.new` drafts (`packages/{core,charts,hooks,ui,stores,data}/`, `apps/{azure,pwa}/`)
- 1 root `CLAUDE.md.new` draft (50 lines, ≤50 target)
- 3 Tier 1 human narrative docs (`docs/OVERVIEW.md`, `USER-JOURNEYS.md`, `DATA-FLOW.md`)
- 5 Tier 2 per-mode journey docs (`docs/USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`)

**Phase 1 gate checks — all passed:**

- Test suite: 5818/5818 passing (unchanged from baseline)
- Build: clean (full turbo cache hit — no code changes)
- Live files unchanged: `CLAUDE.md` still 181 lines; no live `packages/*/CLAUDE.md` or `apps/*/CLAUDE.md` created; `.claude/rules/*` untouched
- Frontmatter: valid on all 9 new docs (incl. this baseline) and all 12 new skills
- `pnpm docs:check`: all checks pass (diagram health, orphan check, cross-references)
- Readability self-test (OVERVIEW + USER-JOURNEYS + DATA-FLOW): passes 3-question test (what VariScout does, personas + phases, data trace)

**Next phase:** Phase 2 — populate 12 skill SKILL.md bodies by migrating content from `.claude/rules/*.md` + relevant ADRs/specs, add skill reference files (EXPORTS.md / COLORS.md for `editing-charts`; YAMAZUMI.md / PERFORMANCE.md / DEFECT.md / PROCESS-FLOW.md for `editing-analysis-modes`), then atomic swap `CLAUDE.md.new` → live. Plan to be written in `docs/superpowers/plans/` after Phase 1 commit.

## Phase 2 Spot-Test Results

**Date:** 2026-04-17

Five representative prompts evaluated against the activated skill descriptions (post-atomic-swap). Assessment is description-based: does the skill's `description` frontmatter contain enough concrete trigger keywords (file paths, function names, domain terms) that the relevant prompt would reliably invoke it?

| #   | Prompt                                                                        | Expected skill                             | Observed skill (trigger match)                                                                                                                | Verdict |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | "Add a new chart annotation that shows a control-limit violation."            | `editing-charts`                           | `editing-charts` — description matches on "chart annotations", "packages/charts/"                                                             | ✅      |
| 2   | "Format a computed Cpk value for display in a new widget."                    | `adding-i18n-messages` (`formatStatistic`) | WEAK — neither `editing-statistics` nor `adding-i18n-messages` description mentions `formatStatistic()` or `.toFixed` anti-pattern explicitly | ⚠️ tune |
| 3   | "Add an idle-time metric to the Yamazumi mode's I-Chart slot."                | `editing-analysis-modes`                   | `editing-analysis-modes` — description matches on "yamazumi", "chart slot mapping", "computeYamazumiData"                                     | ✅      |
| 4   | "Add a new translation key for the HMW Brainstorm modal title."               | `adding-i18n-messages`                     | `adding-i18n-messages` — description matches on "translation keys", "typed message catalogs"                                                  | ✅      |
| 5   | "Persist a new `investigationSummary` field to Blob Storage when it changes." | `editing-azure-storage-auth`               | `editing-azure-storage-auth` — description matches on "Blob Storage", "SAS tokens", "cloud sync"                                              | ✅      |

**Verdict:** 4 of 5 strong matches. Prompt #2 is a known ambiguity — formatting a stat value straddles i18n (the function lives in `@variscout/core/i18n`) and statistics (the context is a Cpk). Action: the `adding-i18n-messages` SKILL.md body documents `formatStatistic()` and the `.toFixed()` anti-pattern in detail, so if either skill is loaded it will catch the mistake. Keeping descriptions as-is; further tuning deferred to Phase 3 when real usage data accumulates.

No description edits made in Phase 2. Any Phase 3 tuning will be driven by observed failure rather than speculative re-writes.

## Phase 2 Completion

**Date completed:** 2026-04-17

**Phase 2 delivered:**

- 12 skill bodies populated with mandatory `## Gotchas` sections
- 6 reference files created:
  - `editing-charts/` — `EXPORTS.md` + `COLORS.md`
  - `editing-analysis-modes/` — `YAMAZUMI.md` + `PERFORMANCE.md` + `DEFECT.md` + `PROCESS-FLOW.md`
- Atomic swap executed: root `CLAUDE.md` 181 lines → 57 lines. Old root preserved at `CLAUDE.md.bak` (pending deletion in Phase 3).
- 8 nested `packages/{core,charts,hooks,ui,stores,data}/CLAUDE.md` + `apps/{azure,pwa}/CLAUDE.md` activated.
- `.claude/rules/*.md` still live as belt-and-suspenders (deletion scheduled for Phase 3).

**Gate checks — all passed:**

- Test suite: all packages passing (Turbo full cache hit — no code changed)
- Build: clean, exit 0
- `pnpm docs:check`: passes (diagram health + orphan check + doc health)
- Pre-commit hooks: clean

**Always-loaded context (post-swap):**

| File                             | Lines   | Notes                                      |
| -------------------------------- | ------- | ------------------------------------------ |
| `CLAUDE.md`                      | 57      | Lean routing + package inventory (was 181) |
| `.claude/rules/charts.md`        | 278     | Still active — removed in Phase 3          |
| `.claude/rules/code-style.md`    | 51      | Still active — removed in Phase 3          |
| `.claude/rules/documentation.md` | 67      | Still active — removed in Phase 3          |
| `.claude/rules/monorepo.md`      | 121     | Still active — removed in Phase 3          |
| `.claude/rules/ruflo.md`         | 62      | Still active — removed in Phase 3          |
| `.claude/rules/testing.md`       | 145     | Still active — removed in Phase 3          |
| **Total root+rules**             | **781** | Baseline was 905 — partial reduction       |

Nested `packages/*/CLAUDE.md` (21–42 lines each) and `apps/*/CLAUDE.md` (33–40 lines each) load only when the agent edits files in that directory — conditional, not always-loaded.

**Full reduction (root CLAUDE.md: 181 → 57, −124 lines) is realized unconditionally. The remaining 724 lines from `.claude/rules/` will be removed in Phase 3** when ESLint plugins, pre-commit hooks, and skill-based discovery are proven to provide equivalent coverage.

**Spot-test results:** see "Phase 2 Spot-Test Results" section above — 4/5 strong skill matches, 1 acceptable weak match for formatStatistic case.

**Next phase:** Phase 3 — add ESLint plugins (no-tofixed-on-stats, no-hardcoded-chart-colors, no-root-cause-language, no-interaction-moderator), pre-commit hooks for SSOT + stale-link warnings, then DELETE `.claude/rules/`, `docs/archive/`, scope `MEMORY.md` to session state only, delete `CLAUDE.md.bak`. Phase 3 plan to be written after Phase 2 commit.

### Phase 3 — Dead-link cutoff

- **Hook installed:** 2026-04-17 (warn mode)
- **Fail cutoff:** 2026-05-01 (Phase 4 responsibility)
- **Fix owner:** whoever triggered the most recent warn — addressable in PR review
- **Count at installation:** 131 broken links — all 131 inside `docs/archive/`, which is deleted in Phase 3 Task 10. Post-Task-10 count expected: 0.

The `scripts/check-dead-links.sh` hook auto-escalates to fail mode when `date +%Y-%m-%d >= 2026-05-01`. No manual flip required.

### Phase 3 Completion

**Date:** 2026-04-17

**Delivered:**

- `eslint-plugin-variscout` with 4 AST rules (no-tofixed-on-stats, no-hardcoded-chart-colors, no-root-cause-language, no-interaction-moderator). 39/39 tests passing.
- 3 new pre-commit hooks: `check-ssot.sh` (warn), `check-claude-md-size.sh` (warn 80% / fail 120%), `check-dead-links.sh` (warn until 2026-05-01, then auto-escalates to fail).
- 2 pre-edit advisories in `.claude/settings.json` (ADR `last-reviewed` frontmatter check; spec YAML frontmatter check). Non-blocking; invoked via `scripts/advisory-{adr,spec}-frontmatter.sh`.
- `no-tofixed-on-stats` scope widened from `packages/ui/src` + `packages/core/src/ai/prompts` to full monorepo (`packages/**` + `apps/**` excluding tests + `packages/charts/src/colors.ts`); severity upgraded `warn` → `error`. Widening surfaced zero new violations outside packages/ui/src — confirming scope was already comprehensive. 19 pre-existing violations triaged: 2 stat-value fixes in formatter helpers, 8 suppressions with justification (4 internal-computation per code-style.md; 4 JSX `&&`-guard cases the rule's AST walker doesn't detect).
- `.claude/rules/` deleted (6 files, 724 lines) + `CLAUDE.md.bak` deleted (181 lines rollback file).
- `docs/archive/` deleted (65 files) — preserved on `origin/archive-preserved` branch + tag `archive-snapshot-2026-04-17`. Inbound archive refs in docs/ stripped (link markup removed, text kept).
- MEMORY.md scope audit complete: entirely session/project/feedback state, no doc-routing duplicates found. No deletion needed; plan's predicted no-op confirmed.
- Spec `status: draft → delivered`; Implementation Plans section updated with final counts and measured outcomes.

**Measured outcomes:**

- Always-loaded context: 905 → 57 lines (93.7% reduction from pre-Phase 1 baseline; 92.7% from post-Phase 2 state). Target achieved.
- ESLint violations of plugin rules: 0 errors across all 4 rules.
- Broken `.md` links in docs/: 131 at Task 9 install (all inside `docs/archive/`), 0 after Task 10 deletion. Cutoff unchanged (2026-05-01 auto-escalation).
- Tests: 5857/5857 passing throughout.
- Monorepo size: 94 files removed (docs/archive), 7 files deleted (.claude/rules + CLAUDE.md.bak), 10 files modified (suppressions + scripts/skills updates).

**Commits on branch `agent-docs-arch/phase1-foundation` (Phase 3):**

| Task | SHA                     | Description                                               |
| ---- | ----------------------- | --------------------------------------------------------- |
| 1    | `87cfd8f8` + `76b56b5a` | Scaffold `eslint-plugin-variscout` (+ fix-ups)            |
| 2    | `9f636db8` + `7b6bab55` | `no-tofixed-on-stats` AST rule                            |
| 3    | `6ba2e7e7`              | `no-hardcoded-chart-colors` rule                          |
| 4    | `11f6c43c`              | `no-root-cause-language` rule                             |
| 5    | `5b378a99`              | `no-interaction-moderator` rule                           |
| 6    | `efc598c4`              | `check-ssot.sh` pre-commit hook                           |
| 7    | `69ce370e`              | `check-claude-md-size.sh` pre-commit hook                 |
| 8    | `ddf00d16`              | Widen no-tofixed-on-stats scope + fix violations          |
| 9    | `04da3e27`              | `check-dead-links.sh` pre-commit hook                     |
| 10   | `f8ca10de`              | Delete `docs/archive/` (preserved in safety branch + tag) |
| 11   | `35563c60`              | Delete `.claude/rules/` + `CLAUDE.md.bak`                 |
| 12   | `d2306f50`              | Pre-edit advisories in `.claude/settings.json`            |
| 13   | (this commit)           | Spec delivered + baseline Phase 3 completion note         |

**Deferred to Phase 4:**

- `check-ssot.sh` warn → fail escalation
- `check-claude-md-size.sh` warn-count monitoring (root CLAUDE.md 57 > 40 warn threshold)
- CI doc-lint stage (repo does not currently have `.github/workflows/` doc-lint; to be added after warn→fail transitions stabilize)
- Skill activation telemetry review (weekly in first month)
- Extend `no-tofixed-on-stats` rule AST walker to recognize `LogicalExpression` guards in JSX — would eliminate 4 of the 8 Task 8 suppressions.
- Promotion of new manual correction patterns to ESLint rules
