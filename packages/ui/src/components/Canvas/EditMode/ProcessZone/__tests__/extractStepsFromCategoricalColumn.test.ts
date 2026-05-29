import { describe, it } from 'vitest';

// IM-0b: extractStepsFromCategoricalColumn was retired. The step-id pre-mint
// (step-${columnName}-${idx}) it produced was discarded by handleStepsReplace
// before ever being persisted. The canonical id scheme (step-${slug}-${seq})
// is now minted solely by addStepsFromColumn in canvasStore.
//
// Drop routing tests live in handleProcessStructureDrop.test.ts (guard + happy
// path) and handleEditModeDragEnd.test.ts (route short-circuit).
describe('extractStepsFromCategoricalColumn (retired IM-0b)', () => {
  it('function is retired — routing coverage lives in handleProcessStructureDrop.test.ts', () => {
    // No-op. Kept so vitest finds a valid suite in this file.
  });
});
