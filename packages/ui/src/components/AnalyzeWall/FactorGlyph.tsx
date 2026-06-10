import React from 'react';

export interface FactorGlyphProps {
  factorKey: string;
  x: number;
  y: number;
  /** Normalized association strength 0..1 (bar width); 0/undefined → no bar. */
  contribution01?: number;
  opacity: number;
  doi: number;
  focused: boolean;
  ariaLabel: string;
  onFocus: (nodeId: string) => void;
  /**
   * CS-13 crossing-back — when provided AND the glyph is focused, renders a →
   * jump button beside the glyph. Fired with the RAW factorKey (never the
   * `factor:`-namespaced DOI node id). Parent gates on data presence.
   */
  onExplore?: (factorKey: string) => void;
  /** Pre-formatted aria label for the → button (`wall.exploreJump.aria`). */
  exploreAriaLabel?: string;
}

const GLYPH_W = 150;
const GLYPH_H = 44;
const BAR_W = GLYPH_W - 24;

/**
 * PR-CS-12 (spec §4.3): a lightweight per-factor node on the Wall's factor
 * band. Label + association-strength bar. The node id in the DOI graph is
 * `factor:${factorKey}` (namespaced — never the raw column name).
 * Color discipline per ui/CLAUDE.md: 50-300 fills, 400-700 strokes/text.
 */
export function FactorGlyph({
  factorKey,
  x,
  y,
  contribution01 = 0,
  opacity,
  doi,
  focused,
  ariaLabel,
  onFocus,
  onExplore,
  exploreAriaLabel,
}: FactorGlyphProps) {
  const nodeId = `factor:${factorKey}`;
  return (
    <g
      data-testid={`factor-glyph-${factorKey}`}
      data-wall-node-id={nodeId}
      data-doi={doi}
      opacity={opacity}
      transform={`translate(${x - GLYPH_W / 2}, ${y - GLYPH_H / 2})`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className="cursor-pointer"
      onClick={() => onFocus(nodeId)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFocus(nodeId);
        }
      }}
    >
      <rect
        width={GLYPH_W}
        height={GLYPH_H}
        rx={8}
        className={
          focused ? 'fill-status-info-soft stroke-status-info' : 'fill-surface stroke-edge'
        }
        strokeWidth={focused ? 2 : 1}
      />
      <text x={12} y={18} className="fill-content text-[12px] font-medium">
        {factorKey.length > 18 ? `${factorKey.slice(0, 17)}…` : factorKey}
      </text>
      {contribution01 > 0 && (
        <>
          <rect x={12} y={28} width={BAR_W} height={6} rx={3} className="fill-surface-secondary" />
          <rect
            x={12}
            y={28}
            width={Math.max(4, BAR_W * Math.min(1, contribution01))}
            height={6}
            rx={3}
            className="fill-status-info"
            data-testid={`factor-glyph-bar-${factorKey}`}
          />
        </>
      )}
      {focused && onExplore && (
        <foreignObject
          x={GLYPH_W + 4}
          y={(GLYPH_H - 24) / 2}
          width={26}
          height={24}
          data-no-wall-pan
        >
          <button
            type="button"
            data-testid={`factor-glyph-explore-${factorKey}`}
            aria-label={exploreAriaLabel}
            className="flex h-full w-full items-center justify-center rounded border border-edge bg-surface-secondary text-xs text-content-muted hover:bg-surface-primary hover:text-content"
            onClick={e => {
              e.stopPropagation();
              onExplore(factorKey);
            }}
          >
            →
          </button>
        </foreignObject>
      )}
    </g>
  );
}
