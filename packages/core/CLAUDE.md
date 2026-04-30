# @variscout/core

Pure TypeScript domain layer. Stats, parser, glossary, tier, i18n, findings, variation, yamazumi, defect, strategy.

## Hard rules

- Never import React, visx, or any UI library. This package must stay pure TS.
- Stats functions must return `number | undefined` — never `NaN` or `Infinity`. Use `safeMath.ts` (safeDivide, safeLog, safeSqrt).
- Never use `Math.random` in code or tests. Tests that need randomness use a deterministic PRNG (see packages/core/src/stats/**tests**/ for examples).
- Never use `.toFixed()` on exported stat values — consumers call `formatStatistic()` from `@variscout/core/i18n`.

## Invariants

- Sub-path exports are public API. Adding a new sub-path requires updating `packages/core/package.json` exports field + `tsconfig.json` paths.
- Available sub-paths: root (barrel), /stats, /ai, /capability, /parser, /findings (incl. `findings/drift.ts`), /variation, /yamazumi, /tier, /types, /i18n, /glossary, /export, /navigation, /responsive, /performance, /time, /timeline (TimelineWindow + applyWindow), /throughput (computeOutputRate, computeBottleneck), /projectMetadata, /strategy, /ui-types, /evidenceMap, /defect.
- `resolveMode()` + `getStrategy()` in `src/analysisStrategy.ts` is the mode dispatch point. New analysis modes must register here.
- The stats engine is the authority for numeric claims. CoScout receives stat results; it does not recompute.
- Numeric safety has three boundaries (ADR-069): B1 parser rejects NaN via `toNumericValue`; B2 stats functions return `undefined`; B3 display uses `formatStatistic`.
- Registering locale loaders (`registerLocaleLoaders`) is an app responsibility — core no longer calls `import.meta.glob` directly.
- The `ai/prompts/coScout/` directory is the canonical CoScout prompt architecture. Entry point is `assembleCoScoutPrompt()` — `buildCoScoutSystemPrompt()` in legacy.ts is deprecated.

## Test command

```bash
pnpm --filter @variscout/core test
```

Float assertions use `toBeCloseTo(expected, precision)`. NIST regression tests in `src/stats/__tests__/nistLongley.test.ts` validate against Minitab/JMP reference outputs.

## Skills to consult

- `editing-statistics` — when touching stats/
- `editing-coscout-prompts` — when touching ai/prompts/
- `editing-analysis-modes` — when touching strategy or mode transforms
- `adding-i18n-messages` — when touching i18n/messages/

## Related

- ADR-045 Modular architecture (DDD-lite)
- ADR-047 Analysis mode strategy pattern
- ADR-067 Unified GLM regression (two-pass best subsets)
- ADR-069 Three-boundary numeric safety
