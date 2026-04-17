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
