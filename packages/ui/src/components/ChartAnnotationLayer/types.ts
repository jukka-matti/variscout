import { chartColors, chromeColors } from '@variscout/charts';

/** Highlight color for annotated chart elements */
export type HighlightColor = 'red' | 'amber' | 'green';

/** A text annotation anchored to a chart category */
export interface ChartAnnotation {
  id: string;
  /** Category key this annotation is anchored to */
  anchorCategory: string;
  /** User's note text */
  text: string;
  /** Pixel offset from anchor default position (resets on data change) */
  offsetX: number;
  /** Pixel offset from anchor default position (resets on data change) */
  offsetY: number;
  /** Width of the text box in pixels */
  width: number;
  /** Color of the annotation box */
  color: HighlightColor | 'neutral';
}

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
