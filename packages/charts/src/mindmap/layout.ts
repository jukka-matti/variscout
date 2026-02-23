import type { MindmapNode, NarrativeStep } from './types';
import { MARGIN, PROGRESS_BAR_HEIGHT } from './helpers';

/**
 * Arrange nodes in a radial layout around center.
 * For 8+ nodes, uses two concentric rings.
 */
export function computeLayout(
  nodes: MindmapNode[],
  centerX: number,
  centerY: number,
  availableRadius: number
): { factor: string; x: number; y: number }[] {
  if (nodes.length === 0) return [];

  const outerRingMax = 7;
  const positions: { factor: string; x: number; y: number }[] = [];

  if (nodes.length <= outerRingMax) {
    // Single ring
    const radius = availableRadius * 0.65;
    const startAngle = -Math.PI / 2; // start at top
    nodes.forEach((node, i) => {
      const angle = startAngle + (2 * Math.PI * i) / nodes.length;
      positions.push({
        factor: node.factor,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  } else {
    // Two concentric rings: first 6 in outer, rest in inner
    const outerCount = Math.min(6, nodes.length);
    const innerCount = nodes.length - outerCount;
    const outerRadius = availableRadius * 0.7;
    const innerRadius = availableRadius * 0.38;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < outerCount; i++) {
      const angle = startAngle + (2 * Math.PI * i) / outerCount;
      positions.push({
        factor: nodes[i].factor,
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      });
    }
    for (let i = 0; i < innerCount; i++) {
      const angle = startAngle + (2 * Math.PI * i) / innerCount;
      positions.push({
        factor: nodes[outerCount + i].factor,
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle),
      });
    }
  }

  return positions;
}

/**
 * Arrange drilled factor nodes in a horizontal timeline (left → right).
 * Only includes active drill steps — available/exhausted nodes are hidden.
 */
export function computeTimelineLayout(
  steps: NarrativeStep[],
  width: number,
  height: number,
  margin: typeof MARGIN = MARGIN
): { factor: string; x: number; y: number }[] {
  if (steps.length === 0) return [];

  const usableWidth = width - margin.left - margin.right;
  const centerY = margin.top + (height - margin.top - margin.bottom - PROGRESS_BAR_HEIGHT - 20) / 2;

  const positions: { factor: string; x: number; y: number }[] = [];
  const count = steps.length;
  const padding = Math.min(60, usableWidth / (count + 2));

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = margin.left + padding + t * (usableWidth - 2 * padding);
    positions.push({ factor: steps[i].factor, x, y: centerY });
  }

  return positions;
}
