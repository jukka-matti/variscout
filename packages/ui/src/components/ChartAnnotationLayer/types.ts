import { chartColors, chromeColors } from '@variscout/charts';
import type { HighlightColor } from '@variscout/core/ui-types';

export type { HighlightColor } from '@variscout/core/ui-types';

/** Color definition for annotation styling */
export interface AnnotationColorDef {
  fill: string;
  border: string;
  hex: string;
}

/** Convert a hex color to rgba fill and border values for annotations */
function annotationColorDef(hex: string): AnnotationColorDef {
  // Parse hex to RGB for rgba() values
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    hex,
    fill: `rgba(${r},${g},${b},0.12)`,
    border: `rgba(${r},${g},${b},0.3)`,
  };
}

/** Map of annotation colors to their CSS values */
export const annotationColors: Record<HighlightColor | 'neutral', AnnotationColorDef> = {
  red: annotationColorDef(chartColors.fail),
  amber: annotationColorDef(chartColors.warning),
  green: annotationColorDef(chartColors.pass),
  neutral: annotationColorDef(chromeColors.labelSecondary),
};
