# CC-1 Sustainment Comparison

- [x] Add deterministic core tests for `freezeBaseline` and `computeSustainmentComparison` covering live/frozen baseline choice, no-specs, no-timeColumn, no post-improvement rows, phase limits, and defect breakdown.
- [x] Run the comparison test target and record the expected failing red state.
- [x] Implement `packages/core/src/control/comparison.ts` using `applyWindow` and `calculateStats` only.
- [x] Export the comparison types/helpers from the core root barrel.
- [x] Run scoped comparison tests, core build, and the required grep check.
- [x] Commit from the CC-1 worktree after branch guard passes.
