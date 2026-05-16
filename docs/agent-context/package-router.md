---
title: 'VariScout Package Router'
purpose: agent-context
tier: living
audience: agent
status: active
topic: [ax, routing]
last-verified: 2026-05-16
---

# VariScout Package Router

Routing table: work area → primary CLAUDE.md → related context → ADRs → rules/invariants → suggested skills.

Load the **Primary CLAUDE.md** first. Then load related ones as needed. Always check `docs/decision-log.md` before reopening any decided question.

Package dependency direction (invariant): `core → hooks → ui → apps`. Never import upward.

---

## Routing Table

| Work Area                                  | Primary CLAUDE.md                                                              | Related CLAUDE.mds                                       | Relevant ADRs                      | Rules/Invariants                                                                                                                                      | Suggested Skills       |
| ------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Canvas / FRAME / Process Hub**           | `packages/ui/CLAUDE.md`                                                        | `packages/stores/CLAUDE.md`, `apps/azure/CLAUDE.md`      | ADR-070, ADR-076, ADR-078, ADR-082 | Canvas viewport = state not mechanism (8f); `Canvas` is canonical, `LayeredProcessViewWithCapability` deprecated                                      | `store-state-glossary` |
| **Stats engine / math**                    | `packages/core/CLAUDE.md`                                                      | —                                                        | ADR-067, ADR-069, ADR-073          | `safeMath.ts` required; return `undefined` not NaN; never `Math.random()`; never `.toFixed()` on exported stat values                                 | `writing-tests`        |
| **Chart components**                       | `packages/charts/CLAUDE.md`                                                    | `packages/core/CLAUDE.md`                                | ADR-002, ADR-005, ADR-051          | `.claude/rules/charts.md`; `chartColors` only; `useChartTheme()`; pair `*-400` with `*-700` for labels                                                | —                      |
| **Zustand stores**                         | `packages/stores/CLAUDE.md`                                                    | `apps/pwa/CLAUDE.md`, `apps/azure/CLAUDE.md`             | ADR-041, ADR-064, ADR-078, ADR-080 | Selector required; no bare `useStore()`; 3-layer boundary enforced by `layerBoundary.test.ts`                                                         | `store-state-glossary` |
| **i18n strings / locale**                  | `packages/core/CLAUDE.md`                                                      | —                                                        | ADR-025                            | `.claude/rules/i18n.md`; `registerLocaleLoaders()` before `preloadLocale()`; `formatStatistic()` not `.toFixed()`; `zh-Hans` → `zhHans.ts`            | `writing-tests`        |
| **Azure-specific (storage / auth / sync)** | `apps/azure/CLAUDE.md`                                                         | `packages/stores/CLAUDE.md`                              | ADR-059, ADR-079                   | EasyAuth only (no MSAL); no PII in App Insights; ETag concurrency on hub-blob writes; R13 allow-list for sustainment direct writes                    | `store-state-glossary` |
| **PWA-specific (persistence / Dexie)**     | `apps/pwa/CLAUDE.md`                                                           | `packages/stores/CLAUDE.md`                              | ADR-004, ADR-012, ADR-033, ADR-078 | Session-only by default; opt-in IndexedDB (single Hub-of-one); no cloud sync; no AI in free tier; `@source` directives required                       | `store-state-glossary` |
| **UI primitives / components**             | `packages/ui/CLAUDE.md`                                                        | `packages/charts/CLAUDE.md`                              | ADR-045, ADR-056                   | `*Base` = primitive; `*WrapperBase` = app composition; semantic Tailwind only; no nested `<button>` in `<button>`                                     | —                      |
| **React hooks**                            | `packages/hooks/CLAUDE.md`                                                     | `packages/core/CLAUDE.md`, `packages/stores/CLAUDE.md`   | ADR-041, ADR-045                   | Hooks consume stores, never define them; selectors not `getState()` in render paths; `use` prefix required                                            | `writing-tests`        |
| **CoScout prompts / AI**                   | `packages/core/CLAUDE.md`                                                      | —                                                        | ADR-057, ADR-060, ADR-068, ADR-069 | `.claude/rules/coscout-prompts.md`; `assembleCoScoutPrompt()` is entry point; tier 1 is cache-invariant; REF markers not raw data; never "root cause" | —                      |
| **Response paths**                         | `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` | `packages/stores/CLAUDE.md`, `packages/ui/CLAUDE.md`     | ADR-080                            | 3 canvas response paths (V1 wedge); Sustainment auto-fires on `confirmed` + `implemented`                                                             | `store-state-glossary` |
| **Capability mode (Cpk)**                  | `packages/core/CLAUDE.md`                                                      | `packages/charts/CLAUDE.md`, `packages/ui/CLAUDE.md`     | ADR-047, ADR-074                   | `resolveMode()` produces `'capability'` from `standardIChartMetric`; never persist as `AnalysisMode`; Cpk grades target-relative to user-set target   | `writing-tests`        |
| **Performance mode (multi-channel)**       | `packages/core/CLAUDE.md`                                                      | `packages/charts/CLAUDE.md`                              | ADR-047                            | `analysisMode === 'performance'`; `isPerformanceMode` removed — never re-introduce                                                                    | —                      |
| **Yamazumi mode (cycle-time)**             | `packages/core/CLAUDE.md`                                                      | `packages/charts/CLAUDE.md`                              | ADR-047                            | `computeYamazumiData()` runs BEFORE stats; never call stats engine on raw event-log data                                                              | —                      |
| **Defect mode (events-to-rates)**          | `packages/core/CLAUDE.md`                                                      | `packages/charts/CLAUDE.md`                              | ADR-047                            | `computeDefectRates()` runs BEFORE stats; `PARETO_MAX_CATEGORIES=20` with "Others" aggregation                                                        | —                      |
| **Process-flow / bottleneck mode**         | `packages/core/CLAUDE.md`                                                      | `packages/charts/CLAUDE.md`                              | ADR-074                            | `computeOutputRate`, `computeBottleneck` from `@variscout/core/throughput`                                                                            | —                      |
| **Projects tab / project membership**      | `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`               | `packages/stores/CLAUDE.md`, `apps/azure/CLAUDE.md`      | ADR-082                            | 4 stages: Charter→Approach→Improve→Sustainment; Lead/Member/Sponsor roles; project-membership ACLs                                                    | `store-state-glossary` |
| **Investigation Wall / findings**          | `packages/core/CLAUDE.md`                                                      | `packages/stores/CLAUDE.md`, `packages/charts/CLAUDE.md` | ADR-064, ADR-073                   | `FindingSource` is discriminated union (6 variants, `chart` discriminant); always narrow before accessing; no cross-investigation aggregation         | `store-state-glossary` |
| **Evidence Map**                           | `packages/charts/CLAUDE.md`                                                    | `packages/hooks/CLAUDE.md`, `packages/ui/CLAUDE.md`      | ADR-074, ADR-077                   | `EvidenceMapBase` is props-only; Layer 2+3 are Azure-only; click vs right-click contracts must not swap                                               | —                      |
| **Sample data**                            | `packages/data/CLAUDE.md`                                                      | `packages/core/CLAUDE.md`                                | —                                  | Data only, no logic; all exports from `src/index.ts`                                                                                                  | —                      |

---

## Quick Reference: Package Names

| Import path            | Package             | Location           |
| ---------------------- | ------------------- | ------------------ |
| `@variscout/core`      | Core domain + stats | `packages/core/`   |
| `@variscout/hooks`     | React hooks         | `packages/hooks/`  |
| `@variscout/ui`        | UI components       | `packages/ui/`     |
| `@variscout/charts`    | Chart components    | `packages/charts/` |
| `@variscout/stores`    | Zustand stores      | `packages/stores/` |
| `@variscout/data`      | Sample datasets     | `packages/data/`   |
| `@variscout/pwa`       | Free PWA app        | `apps/pwa/`        |
| `@variscout/azure-app` | Azure paid app      | `apps/azure/`      |

---

## How to Use This Table

1. Identify your work area from the left column.
2. Read the **Primary CLAUDE.md** in full.
3. Skim **Related CLAUDE.mds** for boundary rules.
4. Look up cited **ADRs** in `docs/07-decisions/` when the rationale matters.
5. Check `.claude/rules/` for machine-enforced constraints in the **Rules/Invariants** column.
6. Invoke the suggested skill if listed.

If your work area isn't in the table, start at `CLAUDE.md` (root) and `docs/llms.txt`.
