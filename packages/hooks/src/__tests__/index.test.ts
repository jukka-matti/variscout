import { describe, it, expect } from 'vitest';

describe('@variscout/hooks', () => {
  it('exports hooks and types', async () => {
    const exports = await import('../index');
    expect(exports).toBeDefined();
    expect(exports.useChartScale).toBeDefined();
    expect(exports.useResponsiveChartMargins).toBeDefined();
    expect(exports.useResponsiveChartFonts).toBeDefined();
    expect(exports.useResponsiveTickCount).toBeDefined();
    expect(exports.useResponsiveBreakpoints).toBeDefined();
    expect(exports.useFilterNavigation).toBeDefined();
    expect(exports.useVariationTracking).toBeDefined();
    expect(exports.useKeyboardNavigation).toBeDefined();
  });
});
