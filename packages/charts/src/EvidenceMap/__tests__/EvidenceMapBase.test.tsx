import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceMapBase } from '../../index';
import type { ComponentProps } from 'react';
import type {
  CausalEdgeData,
  ConvergencePointData,
  EquationData,
  FactorNodeData,
  OutcomeNodeData,
  RelationshipEdgeData,
} from '../types';

const outcomeNode: OutcomeNodeData = {
  x: 280,
  y: 160,
  radius: 30,
  label: 'Cycle Time',
  mean: 42,
};

const factorNodes: FactorNodeData[] = [
  {
    factor: 'Prep',
    x: 100,
    y: 90,
    radius: 24,
    rSquaredAdj: 0.28,
    levelEffects: [],
    metricLabel: 'R2=0.28',
    effectLabel: '+4 min',
  },
  {
    factor: 'Queue',
    x: 180,
    y: 220,
    radius: 22,
    rSquaredAdj: 0.16,
    levelEffects: [],
    metricLabel: 'R2=0.16',
    effectLabel: '+2 min',
  },
  {
    factor: 'Rework',
    x: 380,
    y: 110,
    radius: 20,
    rSquaredAdj: 0.08,
    levelEffects: [],
    metricLabel: 'R2=0.08',
    effectLabel: '+1 min',
  },
];

const relationshipEdges: RelationshipEdgeData[] = [
  {
    factorA: 'Prep',
    factorB: 'Queue',
    type: 'interactive',
    strength: 0.12,
    ax: 100,
    ay: 90,
    bx: 180,
    by: 220,
  },
  {
    factorA: 'Queue',
    factorB: 'Rework',
    type: 'synergistic',
    strength: 0.07,
    ax: 180,
    ay: 220,
    bx: 380,
    by: 110,
  },
  {
    factorA: 'Setup',
    factorB: 'Audit',
    type: 'overlapping',
    strength: 0.05,
    ax: 20,
    ay: 20,
    bx: 60,
    by: 60,
  },
];

const causalEdges: CausalEdgeData[] = [
  {
    id: 'prep-drives-queue',
    fromFactor: 'Prep',
    toFactor: 'Queue',
    whyStatement: 'handoff delay',
    direction: 'drives',
    evidenceType: 'data',
    questionCount: 2,
    findingCount: 1,
    fromX: 100,
    fromY: 90,
    toX: 180,
    toY: 220,
  },
  {
    id: 'setup-drives-audit',
    fromFactor: 'Setup',
    toFactor: 'Audit',
    whyStatement: 'missing checks',
    direction: 'drives',
    evidenceType: 'expert',
    questionCount: 1,
    findingCount: 1,
    fromX: 20,
    fromY: 20,
    toX: 60,
    toY: 60,
  },
];

const convergencePoints: ConvergencePointData[] = [
  {
    factor: 'Queue',
    x: 180,
    y: 220,
    incomingCount: 2,
    hubName: 'Flow hub',
    hubStatus: 'proposed',
  },
  {
    factor: 'Audit',
    x: 60,
    y: 60,
    incomingCount: 1,
    hubName: 'Control hub',
    hubStatus: 'proposed',
  },
];

const equation: EquationData = {
  factors: ['Prep', 'Queue', 'Rework'],
  rSquaredAdj: 0.46,
  formula: 'y = Prep + Queue + Rework',
};

function renderEvidenceMap(props: Partial<ComponentProps<typeof EvidenceMapBase>> = {}) {
  return render(
    <EvidenceMapBase
      parentWidth={640}
      parentHeight={360}
      outcomeNode={outcomeNode}
      factorNodes={factorNodes}
      relationshipEdges={relationshipEdges}
      causalEdges={causalEdges}
      convergencePoints={convergencePoints}
      equation={equation}
      {...props}
    />
  );
}

describe('EvidenceMapBase', () => {
  it('renders all Evidence Map layers when no stepColumns filter is provided', () => {
    renderEvidenceMap();

    expect(screen.getByLabelText('Evidence Map: 3 factors, 2 causal links')).toBeInTheDocument();
    expect(screen.getByLabelText(/Factor: Prep/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Factor: Queue/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Factor: Rework/)).toBeInTheDocument();
    expect(screen.getByLabelText('Prep and Queue: INTERACTIVE')).toBeInTheDocument();
    expect(screen.getByLabelText('Queue and Rework: SYNERGISTIC')).toBeInTheDocument();
    expect(screen.getByLabelText('Setup and Audit: OVERLAPPING')).toBeInTheDocument();
    expect(screen.getByLabelText('Causal link: Prep drives Queue')).toBeInTheDocument();
    expect(screen.getByLabelText('Causal link: Setup drives Audit')).toBeInTheDocument();
    expect(screen.getByLabelText(/Convergence point: Queue/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Convergence point: Audit/)).toBeInTheDocument();
  });

  it('filters nodes, relationship edges, causal edges, and convergence points by stepColumns', () => {
    renderEvidenceMap({ stepColumns: ['Queue'] });

    expect(screen.getByLabelText('Evidence Map: 1 factors, 0 causal links')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Factor: Prep/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Factor: Queue/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Factor: Rework/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Prep and Queue: INTERACTIVE')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Queue and Rework: SYNERGISTIC')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Setup and Audit: OVERLAPPING')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Causal link: Prep drives Queue')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Causal link: Setup drives Audit')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Convergence point: Queue/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Convergence point: Audit/)).not.toBeInTheDocument();
  });

  it('shows the empty state when stepColumns removes all factor nodes', () => {
    renderEvidenceMap({ stepColumns: ['Missing Step'] });

    expect(screen.getByLabelText('Evidence Map — no data')).toBeInTheDocument();
    expect(screen.getByText('Factor Intelligence not available')).toBeInTheDocument();
  });
});
