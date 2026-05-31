# @variscout/data

Sample datasets with static computed chart fixtures. No runtime computation.

## Hard rules

- This package contains data only — no runtime computation, no transforms. Any statistical logic belongs in @variscout/core or package tooling scripts.
- Export every dataset from `src/index.ts`. One named export per dataset file.

## Invariants

- Current samples: coffee, journey, bottleneck, sachets, manufacturing-defects, nistLongley, weld-defects, injection, and ~16 others. See `packages/data/src/samples/`.
- Static computed chart fixtures live in `src/computed/generated.ts` and are regenerated with `pnpm --filter @variscout/data generate:computed`; do not recompute chart/stat data at app startup.
- Runtime `src/computed/` is lookup-only and must not import `@variscout/core`, samples, or chart/stat computation helpers.
- Sample generation is deterministic: use local seeded PRNG helpers, not `Math.random()` or `Date.now()`.
- The fixture generator script is tooling, not runtime package logic.

## Test command

`pnpm --filter @variscout/data test`

Related: new domain types belong with `packages/core/CLAUDE.md`; monorepo structure belongs with root `CLAUDE.md`.
