/**
 * FactorNode — Individual factor circle in the Evidence Map
 *
 * Shows factor name, R²adj metric, and strongest level effect.
 * Color indicates strength tier: green (>20%), amber (10-20%), grey (<10%).
 *
 * For continuous factors, renders a subtle trend glyph inside the circle:
 *   '/'  → diagonal line (positive linear)
 *   '\\' → diagonal line (negative linear)
 *   '∩'  → arc curving upward (quadratic peak / sweet spot maximum)
 *   '∪'  → arc curving downward (quadratic valley / sweet spot minimum)
 *
 * The '∩' and '∪' glyphs also show a pulsing ring animation to indicate
 * an optimal operating region exists.
 */

import React from 'react';
import { Group } from '@visx/group';
import { chartColors, getChromeColors } from '../colors';
import type { FactorNodeData } from './types';

interface FactorNodeProps {
  node: FactorNodeData;
  isHighlighted: boolean;
  isDark: boolean;
  compact: boolean;
  hideLabels?: boolean;
  onClick?: (factor: string) => void;
  onHover?: (factor: string | null) => void;
  onTap?: (factor: string) => void;
  onContextMenu?: (factor: string, clientX: number, clientY: number) => void;
}

function getNodeColor(rSquaredAdj: number, isDark: boolean, explored?: boolean): string {
  if (explored === false) {
    const chrome = getChromeColors(isDark);
    return chrome.labelMuted;
  }
  if (rSquaredAdj >= 0.2) return chartColors.pass; // green — strong
  if (rSquaredAdj >= 0.1) return chartColors.warning; // amber — moderate
  const chrome = getChromeColors(isDark);
  return chrome.labelMuted; // grey — weak
}

/** Minimum touch target radius (44px diameter / 2) */
const TOUCH_TARGET_RADIUS = 22;

/** Glyph size as a fraction of node radius */
const GLYPH_FRACTION = 0.4;

/**
 * Build the SVG path data for a trend glyph centered at (0,0).
 * The glyph fits within a box of ±g where g = nodeRadius * GLYPH_FRACTION.
 */
function buildGlyphPath(glyph: '/' | '\\' | '∩' | '∪', g: number): string {
  switch (glyph) {
    case '/':
      // Diagonal line from bottom-left to top-right
      return `M ${-g} ${g} L ${g} ${-g}`;
    case '\\':
      // Diagonal line from top-left to bottom-right
      return `M ${-g} ${-g} L ${g} ${g}`;
    case '∩': {
      // Arc that curves upward — cubic bezier from left to right with upward peak
      // Start: (-g, g/2) → End: (g, g/2), peak at (0, -g)
      const cp = g * 1.2;
      return `M ${-g} ${g * 0.5} C ${-g} ${-cp} ${g} ${-cp} ${g} ${g * 0.5}`;
    }
    case '∪': {
      // Arc that curves downward — cubic bezier from left to right with downward valley
      // Start: (-g, -g/2) → End: (g, -g/2), valley at (0, g)
      const cp = g * 1.2;
      return `M ${-g} ${-g * 0.5} C ${-g} ${cp} ${g} ${cp} ${g} ${-g * 0.5}`;
    }
  }
}

/** CSS keyframes for the sweet-spot pulsing ring (injected once). */
const PULSE_STYLE_ID = 'evidence-map-pulse';
function injectPulseStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PULSE_STYLE_ID;
  style.textContent = `
    @keyframes em-node-pulse {
      0%   { opacity: 0.5; r: var(--pulse-r0); }
      70%  { opacity: 0; r: var(--pulse-r1); }
      100% { opacity: 0; r: var(--pulse-r1); }
    }
    .em-pulse-ring {
      animation: em-node-pulse 2s ease-out infinite;
    }
  `;
  document.head.appendChild(style);
}

const FactorNode: React.FC<FactorNodeProps> = ({
  node,
  isHighlighted,
  isDark,
  compact,
  hideLabels = false,
  onClick,
  onHover,
  onTap,
  onContextMenu,
}) => {
  const chrome = getChromeColors(isDark);
  const color = getNodeColor(node.rSquaredAdj, isDark, node.explored);
  const textColor = chrome.labelPrimary;
  const subtextColor = chrome.labelSecondary;
  const highlightStroke = isHighlighted ? chartColors.mean : 'transparent';

  const glyph = node.trendGlyph;
  const hasGlyph = glyph !== null && glyph !== undefined;
  const isQuadratic = glyph === '∩' || glyph === '∪';
  const glyphSize = node.radius * GLYPH_FRACTION;

  // Inject CSS animation for sweet-spot glyphs (no-op if already present)
  if (isQuadratic) {
    injectPulseStyle();
  }

  return (
    <Group
      top={node.y}
      left={node.x}
      style={{ cursor: onClick || onTap ? 'pointer' : 'default' }}
      onClick={() => {
        onClick?.(node.factor);
        onTap?.(node.factor);
      }}
      onMouseEnter={() => onHover?.(node.factor)}
      onMouseLeave={() => onHover?.(null)}
      onContextMenu={e => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(node.factor, e.clientX, e.clientY);
        }
      }}
      role="button"
      aria-label={`Factor: ${node.factor}, ${node.metricLabel}`}
    >
      {/* Transparent touch target (44px min) for compact/mobile mode */}
      {compact && node.radius < TOUCH_TARGET_RADIUS && (
        <circle r={TOUCH_TARGET_RADIUS} fill="transparent" />
      )}

      {/* Sweet-spot pulsing ring — rendered behind the main circle */}
      {isQuadratic && (
        <circle
          className="em-pulse-ring"
          r={node.radius + 8}
          fill="none"
          stroke={chartColors.cpPotential}
          strokeWidth={1.5}
          style={
            {
              '--pulse-r0': `${node.radius + 4}px`,
              '--pulse-r1': `${node.radius + 14}px`,
            } as React.CSSProperties
          }
        />
      )}

      {/* Highlight ring */}
      {isHighlighted && (
        <circle
          r={node.radius + 4}
          fill="none"
          stroke={highlightStroke}
          strokeWidth={2}
          opacity={0.8}
        />
      )}

      {/* Main circle */}
      <circle
        r={node.radius}
        fill={color}
        opacity={node.explored === false ? 0.4 : isHighlighted ? 0.9 : 0.7}
        stroke={color}
        strokeWidth={1.5}
      />

      {/* Trend glyph (continuous factors only) — subtle, inside the circle */}
      {hasGlyph && !compact && (
        <path
          d={buildGlyphPath(glyph as '/' | '\\' | '∩' | '∪', glyphSize)}
          stroke={chrome.labelPrimary}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.3}
          pointerEvents="none"
        />
      )}

      {/* Factor name */}
      {!hideLabels && (
        <text
          textAnchor="middle"
          dy={compact ? 0 : -4}
          fill="white"
          fontSize={compact ? 8 : 11}
          fontWeight="bold"
          pointerEvents="none"
        >
          {node.factor.length > 12 ? node.factor.slice(0, 10) + '...' : node.factor}
        </text>
      )}

      {/* Metric label (R²adj value) */}
      {!compact && !hideLabels && (
        <text textAnchor="middle" dy={10} fill={subtextColor} fontSize={9} pointerEvents="none">
          {node.metricLabel}
        </text>
      )}

      {/* Effect label (±value) */}
      {!compact && !hideLabels && node.effectLabel && (
        <text
          textAnchor="middle"
          dy={22}
          fill={textColor}
          fontSize={8}
          opacity={0.7}
          pointerEvents="none"
        >
          {node.effectLabel}
        </text>
      )}
    </Group>
  );
};

export default FactorNode;
