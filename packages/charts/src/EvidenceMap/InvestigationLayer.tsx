/**
 * InvestigationLayer — Layer 2 of the Evidence Map
 *
 * Renders causal link edges with evidence badges and gap markers.
 * Azure only — not rendered in PWA.
 */

import React from 'react';
import { Group } from '@visx/group';
import CausalEdge from './CausalEdge';
import type { CausalEdgeData } from './types';

interface InvestigationLayerProps {
  causalEdges: CausalEdgeData[];
  highlightedEdge: string | null;
  isDark: boolean;
  onCausalEdgeClick?: (id: string) => void;
}

const InvestigationLayer: React.FC<InvestigationLayerProps> = ({
  causalEdges,
  highlightedEdge,
  isDark,
  onCausalEdgeClick,
}) => {
  if (causalEdges.length === 0) return null;

  return (
    <Group>
      {causalEdges.map(edge => (
        <CausalEdge
          key={edge.id}
          edge={edge}
          isHighlighted={highlightedEdge === edge.id}
          isDark={isDark}
          onClick={onCausalEdgeClick}
        />
      ))}
    </Group>
  );
};

export default InvestigationLayer;
