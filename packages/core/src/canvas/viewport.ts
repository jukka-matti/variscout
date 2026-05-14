export type CanvasLevel = 'l1' | 'l2' | 'l3';

export const LOD_THRESHOLDS = {
  l1ToL2: 0.3,
  l2ToL3: 2.0,
} as const;

/** Snap boundaries: zoom values stranded in these half-open ranges ease back to the boundary. */
export const LOD_SNAP_BOUNDARIES = {
  /** [L2_OVERVIEW_LOW, l1ToL2) → ease to L2_OVERVIEW_LOW */
  L2_OVERVIEW_LOW: 0.5,
  /** [L2_DETAIL_HIGH, l2ToL3) → ease to L2_DETAIL_HIGH */
  L2_DETAIL_HIGH: 1.8,
} as const;

/** Default placeholder zoom per level used by fitToContent when no explicit fit is supplied. */
export const FIT_TO_CONTENT_ZOOM_BY_LEVEL: Record<CanvasLevel, number> = {
  l1: 0.2,
  l2: 1,
  l3: 2.5,
};

export function inferLevel(zoom: number): CanvasLevel {
  if (zoom < LOD_THRESHOLDS.l1ToL2) {
    return 'l1';
  }

  if (zoom >= LOD_THRESHOLDS.l2ToL3) {
    return 'l3';
  }

  return 'l2';
}

export function isValidLevel(value: unknown): value is CanvasLevel {
  return value === 'l1' || value === 'l2' || value === 'l3';
}
