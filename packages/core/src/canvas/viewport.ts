export type CanvasLevel = 'l1' | 'l2' | 'l3';

export const LOD_THRESHOLDS = {
  l1ToL2: 0.3,
  l2ToL3: 2.0,
} as const;

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
