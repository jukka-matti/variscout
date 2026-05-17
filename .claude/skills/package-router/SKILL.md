---
name: "Package Router"
description: "Use when you need to figure out which package's CLAUDE.md, ADRs, rules, and skills to load for a specific work area. Covers: canvas, stats engine, chart components, stores, i18n, Azure-specific (storage/auth/sync), PWA-specific (persistence/Dexie), UI primitives, hooks, CoScout prompts, response paths, capability mode, performance mode, yamazumi mode, defect mode, process-flow mode, projects tab, Investigation Wall, Evidence Map. Use before starting any implementation in an unfamiliar area."
---

# Package Router

## When to Use This Skill

Use when you know *what* you need to do but not *where* to look. Given a work area (e.g., "I need to add a chart", "I need to touch the stores", "I need to fix a canvas bug"), this skill routes you to the right CLAUDE.md, ADRs, and rules before you write a line of code.

## How to Use

1. Find your work area in the routing table at `docs/agent-context/package-router.md`.
2. Read the **Primary CLAUDE.md** in full first.
3. Skim **Related CLAUDE.mds** for boundary rules relevant to your change.
4. Look up the cited **ADRs** in `docs/07-decisions/` when you need the rationale.
5. Check `.claude/rules/` files listed in the Rules column for machine-enforced constraints.
6. Invoke any suggested skill.
7. Check `docs/decision-log.md` before reopening any decided question.

## Quick Reference (Top Work Areas)

| Work Area | Primary CLAUDE.md | Key Constraint |
|---|---|---|
| Canvas / FRAME / Process Hub | `packages/ui/CLAUDE.md` | `Canvas` is canonical; `LayeredProcessViewWithCapability` deprecated |
| Stats engine | `packages/core/CLAUDE.md` | `safeMath.ts`; return `undefined` not NaN; never `Math.random()` |
| Chart components | `packages/charts/CLAUDE.md` | `chartColors` only; `useChartTheme()`; no hex literals |
| Zustand stores | `packages/stores/CLAUDE.md` | Selector required; 3-layer boundary enforced |
| i18n | `packages/core/CLAUDE.md` | `registerLocaleLoaders()` before `preloadLocale()` |
| Azure (storage/auth/sync) | `apps/azure/CLAUDE.md` | EasyAuth only; no PII in telemetry; ETag concurrency |
| PWA (persistence/Dexie) | `apps/pwa/CLAUDE.md` | Session-only by default; no AI in free tier |
| UI primitives | `packages/ui/CLAUDE.md` | `*Base` = primitive; `*WrapperBase` = composition |
| React hooks | `packages/hooks/CLAUDE.md` | Consume stores; never define stores |
| CoScout prompts | `packages/core/CLAUDE.md` | `assembleCoScoutPrompt()`; tier 1 is cache-invariant |
| Projects tab | wedge spec + `apps/azure/CLAUDE.md` | 4 stages: Charter→Approach→Improve→Sustainment |
| Investigation Wall | `packages/core/CLAUDE.md` + `packages/stores/CLAUDE.md` | `FindingSource` discriminated union; no cross-hub aggregation |

## Full Routing Table

The complete table (20 rows with ADRs, rules, and suggested skills per work area) is at:

`docs/agent-context/package-router.md`

Read that doc for the authoritative routing matrix. The quick reference above covers the 80% case.

## Package Dependency Invariant

`core → hooks → ui → apps` — import direction is one-way downward. If your change requires importing upward, you need a different design.

## Sub-path Export Rule

Updating a sub-path in any package requires BOTH `package.json#exports` AND `tsconfig.json#paths` updated together. Missing either causes silent runtime failures.

## Tailwind v4 Rule

Every `apps/*/src/index.css` needs `@source` for each shared package that provides UI (`@source "../../../packages/ui/src/**/*.tsx"`, etc.). Missing `@source` silently breaks responsive utilities.
