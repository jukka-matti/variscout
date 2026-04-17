# @variscout/data

Sample datasets with pre-computed chart data. No logic.

## Hard rules

- This package contains data only — no computation, no transforms. Any logic belongs in @variscout/core.
- Export every dataset from `src/index.ts`. One named export per dataset file.

## Invariants

- Current samples: coffee, journey, bottleneck, sachets, manufacturing-defects, nistLongley, weld-defects, injection, and ~16 others. See `packages/data/src/samples/`.
- Pre-computed chart data (if any) lives alongside the dataset in its file; do not recompute at app startup.

## Test command

No tests required for this package (pure data).

## Skills to consult

- `editing-monorepo-structure` — when adding a new sample dataset
