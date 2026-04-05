/**
 * Evidence Map types — props interfaces for the layered visualization
 *
 * Data types are canonical in @variscout/core/evidenceMap.
 * This file re-exports them and defines component props.
 */

import type {
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
  CausalEdgeData,
  ConvergencePointData,
} from '@variscout/core/evidenceMap';

export type {
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
  CausalEdgeData,
  ConvergencePointData,
  RelationshipType,
} from '@variscout/core/evidenceMap';

// ============================================================================
// Component props
// ============================================================================

export interface EvidenceMapBaseProps {
  parentWidth: number;
  parentHeight: number;

  // Layer 1: Statistical (always present)
  outcomeNode: OutcomeNodeData | null;
  factorNodes: FactorNodeData[];
  relationshipEdges: RelationshipEdgeData[];
  equation: EquationData | null;

  // Layer 2: Investigation (Azure only, optional)
  causalEdges?: CausalEdgeData[];

  // Layer 3: Synthesis (Azure only, optional)
  convergencePoints?: ConvergencePointData[];

  // Interaction callbacks
  onFactorClick?: (factor: string) => void;
  onFactorHover?: (factor: string | null) => void;
  onFactorContextMenu?: (factor: string, clientX: number, clientY: number) => void;
  onEdgeClick?: (factorA: string, factorB: string) => void;
  onCausalEdgeClick?: (id: string) => void;
  onConvergenceClick?: (factor: string) => void;

  // Visual state
  highlightedFactor?: string | null;
  highlightedEdge?: string | null;
  showEquation?: boolean;

  // Mobile interactions
  enableZoom?: boolean;
  onNodeTap?: (factor: string) => void;
  onEdgeTap?: (factorA: string, factorB: string) => void;

  // Display
  isDark?: boolean;
  compact?: boolean;
}
