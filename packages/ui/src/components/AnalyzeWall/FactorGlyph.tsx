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
          focused ? 'fill-status-info-soft stroke-status-info' : 'fill-surface-primary stroke-edge'
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
    </g>
  );
}
