import { chartColors } from '../colors';
import type { MindmapNode } from './types';

export const MIN_NODE_RADIUS = 20;
export const MAX_NODE_RADIUS = 40;
export const CENTER_NODE_RADIUS = 16;
export const PROGRESS_BAR_HEIGHT = 32;
export const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

/**
 * Compute node radius from η² value (area encodes magnitude).
 * Accepts 0–1 range; 0 produces the minimum radius.
 */
export function getNodeRadius(etaSquared: number): number {
  const clamped = Math.max(0, Math.min(1, etaSquared));
  const minArea = Math.PI * MIN_NODE_RADIUS * MIN_NODE_RADIUS;
  const maxArea = Math.PI * MAX_NODE_RADIUS * MAX_NODE_RADIUS;
  const area = minArea + clamped * (maxArea - minArea);
  return Math.sqrt(area / Math.PI);
}

/**
 * Get node fill color based on state
 */
export function getNodeFill(state: MindmapNode['state'], isDark: boolean): string {
  switch (state) {
    case 'active':
      return chartColors.mean; // blue — already drilled
    case 'available':
      return isDark ? '#334155' : '#e2e8f0'; // slate-700 / slate-200
    case 'exhausted':
      return isDark ? '#1e293b' : '#f1f5f9'; // slate-800 / slate-100
  }
}

/**
 * Get node stroke color based on state
 */
export function getNodeStroke(node: MindmapNode, isDark: boolean): string {
  if (node.isSuggested) return chartColors.pass; // green pulse
  if (node.state === 'active') return chartColors.mean;
  return isDark ? '#475569' : '#94a3b8'; // slate-600 / slate-400
}
