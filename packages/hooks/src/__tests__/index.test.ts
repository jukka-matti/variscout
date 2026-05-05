import { describe, it, expect } from 'vitest';
import * as exports from '../index';

describe('@variscout/hooks', () => {
  it('exports hooks and types', () => {
    expect(exports).toBeDefined();
    expect(exports.useChartScale).toBeDefined();
    expect(exports.useChipDragAndDrop).toBeDefined();
    expect(exports.encodeChipDragId).toBeDefined();
    expect(exports.encodeStepDropId).toBeDefined();
    expect(exports.useResponsiveChartMargins).toBeDefined();
    expect(exports.useResponsiveChartFonts).toBeDefined();
    expect(exports.useResponsiveTickCount).toBeDefined();
    expect(exports.useResponsiveBreakpoints).toBeDefined();
    expect(exports.useFilterNavigation).toBeDefined();
    expect(exports.useKeyboardNavigation).toBeDefined();
  });
});
