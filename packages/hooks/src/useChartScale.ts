import { useMemo } from 'react';
import type { ChartScaleContext, ChartScaleResult } from './types';

/**
 * Calculate optimal Y-axis scale for charts based on data and specs
 *
 * Uses context injection pattern - apps pass their data context
 * rather than this hook importing a specific context.
 *
 * @param context - Chart scale context with data, specs, and settings
 * @returns { min, max } scale values
 *
 * @example
 * ```tsx
 * // In PWA app
 * const dataContext = useData();
 * const scale = useChartScale(dataContext);
 *
 * // In Azure app
 * const dataContext = useData();
 * const scale = useChartScale(dataContext);
 * ```
 */
export function useChartScale(context: ChartScaleContext): ChartScaleResult {
  const { filteredData, outcome, specs, grades, axisSettings } = context;

  return useMemo(() => {
    if (!outcome || filteredData.length === 0) {
      return { min: 0, max: 100 }; // Default fallback
    }

    // Return manual override if fully set
    if (axisSettings.min !== undefined && axisSettings.max !== undefined) {
      return { min: axisSettings.min, max: axisSettings.max };
    }

    const values = filteredData.map((d: any) => Number(d[outcome])).filter(v => !isNaN(v));

    // Include specs in range calculation
    if (specs.usl !== undefined) values.push(specs.usl);
    if (specs.lsl !== undefined) values.push(specs.lsl);

    // Include grades smartly (cap infinity)
    if (grades && grades.length > 0) {
      const dataMax = Math.max(...values);
      grades.forEach(g => {
        if (g.max < Math.max(20, dataMax * 1.5)) {
          values.push(g.max);
        }
      });
      // Ensure bottom grade is visible if data is tiny
      if (values.length > 0 && Math.max(...values) < grades[0].max) {
        values.push(grades[0].max);
      }
    }

    let min = Math.min(...values);
    let max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;

    // Apply manual settings if only one is set, otherwise use auto
    const finalMin = axisSettings.min !== undefined ? axisSettings.min : min - padding;
    const finalMax = axisSettings.max !== undefined ? axisSettings.max : max + padding;

    return { min: finalMin, max: finalMax };
  }, [filteredData, outcome, specs, grades, axisSettings]);
}

export default useChartScale;
