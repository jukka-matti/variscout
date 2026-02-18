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

/** Map of annotation colors to their CSS values */
export const annotationColors: Record<HighlightColor | 'neutral', AnnotationColorDef> = {
  red: {
    hex: '#ef4444',
    fill: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
  },
  amber: {
    hex: '#f59e0b',
    fill: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
  },
  green: {
    hex: '#22c55e',
    fill: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
  },
  neutral: {
    hex: '#94a3b8',
    fill: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.3)',
  },
};
