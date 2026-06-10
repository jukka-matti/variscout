---
title: 'VariScout Agent Onboarding Quick Start'
purpose: agent-context
tier: living
audience: agent
status: active
topic: [ax, onboarding]
last-verified: 2026-05-16
---

# VariScout Agent Onboarding Quick Start

5-minute orientation for fresh subagents. Read this before touching any code or docs.

---

## What is VariScout?

VariScout is a **browser-based structured investigation tool for process improvement specialists**. Customer data stays in the customer's Azure tenant (browser-only processing, no server-side compute). The deterministic stats engine is the authority; CoScout (AI) adds context, never recomputes stats. See [positioning.md](../01-vision/positioning.md) for the canonical one-liner and [ADR-082](../07-decisions/adr-082-wedge-architecture.md) for the V1 architectural record.

## Current Strategic Direction (wedge pivot 2026-05-16)

Single-product tool for improvement specialists (the ICP), one SKU (€120/mo Azure tenant-wide). Tier-gating fully retired — no more `isPaidTier()` checks.

**Within each Project, 3 personas** with different access:

- **Lead** — full edit + manages membership
- **Member** — full edit within project surfaces
- **Sponsor** — reads everywhere + edits contributions (2-tier ACL with Member); signoff handled out-of-band

**7-tab workflow nav**: `Home · Project · Process · Explore · Analyze · Improve · Report`

- "Improve" is a **top-level verb tab** scoped to the Workspace's Project (restored from earlier "stage inside Projects" framing per the 2026-05-16 Improve-tab amendment; the active-IP cascade was retired by the Workspace model, PR #358)
- Project stages (inside Projects detail): Charter → Approach → Sustainment (Handoff folded into Sustainment)
- Hub = a single process investigation unit
- Per-project ACLs; no cross-AD-tenant invites
- VariScout Process (enterprise, multi-Hub portfolio, 4-persona) is named-future only — see `docs/01-vision/variscout-process/`

Canonical sources: [wedge spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../07-decisions/adr-082-wedge-architecture.md). Many older docs predate this pivot — treat as historical until Phase C audit.

---

## Where to Look

| Need                          | Go to                                                                   |
| ----------------------------- | ----------------------------------------------------------------------- |
| Strategic direction           | `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`        |
| Architectural decisions (why) | `docs/07-decisions/` (live ADRs) · `docs/archive/adrs/` (superseded)    |
| Product design (what)         | `docs/superpowers/specs/` (active) · `docs/archive/specs/` (historical) |
| Current open decisions        | `docs/decision-log.md` — check here before re-opening any topic         |
| Product overview              | `docs/OVERVIEW.md` · `docs/USER-JOURNEYS.md` · `docs/DATA-FLOW.md`      |
| Package-specific context      | `packages/<pkg>/CLAUDE.md` · `apps/<app>/CLAUDE.md`                     |
| Which package to edit         | See `package-router` skill                                              |
| Store state glossary          | See `store-state-glossary` skill                                        |
| Agent manifest / entry map    | `docs/llms.txt`                                                         |
| Code smells / investigations  | `docs/investigations.md`                                                |

**Package dependency direction**: `core → hooks → ui → apps`. Never import upward.

**Sub-path exports**: updating a sub-path in `@variscout/core` (or any package) requires BOTH `package.json#exports` AND `tsconfig.json#paths` updated together.

---

## Hard Invariants

Violating any of these is a hard error. ESLint enforces the language ones. Full index with canonical homes + enforcement mechanisms: [`.claude/INVARIANTS.md`](../../.claude/INVARIANTS.md).

1. **Browser-only processing** — data never leaves the customer's tenant. No server-side aggregation, no external API calls with row data (ADR-059).
2. **9 Zustand stores across 3 layers** — Document (×4): `useProjectStore`, `useAnalyzeStore`, `useCanvasStore`, `useImprovementProjectStore`; Annotation (×3): `useCanvasViewportStore` (per-hub), `usePreferencesStore` (per-user), `useProjectMembershipStore` (per-user); View (×2): `useViewStore`, `useAnalysisScopeStore`. No DataContext. (`useActiveIPStore` deleted in Workspace migration W3/PR #358.) Authoritative table: `packages/stores/CLAUDE.md`.
3. **No statistical roll-up across heterogeneous units** — distributions, not aggregates; no Cpk arithmetic across different spec limits (ADR-073).
4. **Language**: never write "root cause" — use "contribution" / "suspected cause" / "mechanism". Never call interactions "moderator/primary" — use `'ordinal'` / `'disordinal'`. ESLint rules enforce both.

---

## Common Pitfalls

These cause bugs, test failures, or ESLint errors. Check before committing.

- **`Math.random()` in any code or test** — forbidden everywhere. Use a seeded deterministic PRNG in tests; avoid randomness in production code entirely.
- **Hardcoded hex colors in charts** — use `chartColors` / `chromeColors` from `@variscout/charts/colors`. No hex literals.
- **`text-green-400` (or red/amber-400) without a paired `text-green-700`** — fails light-mode contrast. Always pair.
- **`--no-verify` on commits** — never. Hooks enforce invariants; bypassing them hides real violations.
- **"root cause" language** — ESLint rule `no-root-cause-language` enforces in prompts and comments. Use "contribution".
- **Importing Dexie directly in domain stores** — only `apps/*/src/persistence/` and `apps/*/src/db/` may import Dexie. ESLint P7.2 enforces. R12 exception: `packages/stores/src/canvasViewportStore.ts`.
- **Missing `@source` in `apps/*/src/index.css`** — Tailwind v4 silently breaks responsive utilities for any shared package missing an `@source` directive.
- **Bare `useStore()` calls** — always use selectors: `useProjectStore(s => s.field)`.
- **Single `package.json#exports` update** — sub-path exports need `tsconfig.json#paths` updated too, and vice versa.

---

## Skills to Reach For

| Situation                                                       | Skill                                   |
| --------------------------------------------------------------- | --------------------------------------- |
| Need to know which package/CLAUDE.md to read for your work area | `package-router`                        |
| Need to know what state lives in which store                    | `store-state-glossary`                  |
| Writing or modifying tests                                      | `writing-tests`                         |
| Need to find/query VariScout docs                               | `docs-toolbox` (available after Play 2) |
