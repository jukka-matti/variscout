import { chartColors } from '../colors';
import type { MindmapNode, MindmapEdge } from './types';

export const MIN_NODE_RADIUS = 20;
export const MAX_NODE_RADIUS = 40;
export const CENTER_NODE_RADIUS = 16;
export const PROGRESS_BAR_HEIGHT = 32;
export const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

export const EDGE_MIN_WIDTH = 1.5;
export const EDGE_MAX_WIDTH = 6;

/**
 * Compute node radius from max category contribution (area encodes magnitude)
 */
export function getNodeRadius(contribution: number): number {
  const clamped = Math.max(0, Math.min(1, contribution));
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

/**
 * Map ΔR² to edge stroke width (linear interpolation)
 */
export function getEdgeWidth(deltaRSquared: number, maxDelta: number): number {
  if (maxDelta <= 0) return EDGE_MIN_WIDTH;
  const t = Math.min(1, deltaRSquared / maxDelta);
  return EDGE_MIN_WIDTH + t * (EDGE_MAX_WIDTH - EDGE_MIN_WIDTH);
}

/**
 * Get edge opacity based on p-value significance
 */
export function getEdgeOpacity(pValue: number): number {
  if (pValue < 0.05) return 1.0;
  if (pValue < 0.1) return 0.4;
  return 0; // not rendered
}

/**
 * Filter edges to only those significant enough to render (p < 0.10)
 */
export function getVisibleEdges(edges: MindmapEdge[]): MindmapEdge[] {
  return edges.filter(e => e.pValue < 0.1);
}
