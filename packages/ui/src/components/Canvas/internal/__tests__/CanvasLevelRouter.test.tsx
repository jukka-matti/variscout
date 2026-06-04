import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProcessMap } from '@variscout/core/frame';
import type { ProcessHubId } from '@variscout/core/processHub';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

// vi.mock hoisted above component imports — required by project testing rules.
vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual<typeof import('@variscout/hooks')>('@variscout/hooks');
  return {
    ...actual,
    isCanvasLensValidAtLevel: vi.fn(() => true),
    suggestCanvasLevelForLens: vi.fn(() => 'l2' as const),
  };
});

vi.mock('../SystemLevelView', () => ({
  SystemLevelView: () => <div data-testid="mock-system-level-view" />,
}));

vi.mock('../AuthorL3View', () => ({
  AuthorL3View: () => <div data-testid="mock-author-l3-view" />,
}));

vi.mock('../LocalMechanismView', () => ({
  LocalMechanismView: () => <div data-testid="mock-local-mechanism-view" />,
}));

vi.mock('../NoFocalStepPrompt', () => ({
  NoFocalStepPrompt: () => <div data-testid="mock-no-focal-step-prompt" />,
}));

vi.mock('../LODSwitcher', () => ({
  LODSwitcher: ({
    currentLevel,
    l1,
    l2,
    l3,
  }: {
    currentLevel: string;
    l1: React.ReactNode;
    l2: React.ReactNode;
    l3: React.ReactNode;
  }) => (
    <div data-testid="mock-lod-switcher" data-current-level={currentLevel}>
      <div data-testid="lod-l1">{l1}</div>
      <div data-testid="lod-l2">{l2}</div>
      <div data-testid="lod-l3">{l3}</div>
    </div>
  ),
}));

import { isCanvasLensValidAtLevel, suggestCanvasLevelForLens } from '@variscout/hooks';
import { CanvasLevelRouter } from '../CanvasLevelRouter';

const map: ProcessMap = {
  version: 1,
  ctsColumn: 'Fill Weight',
  nodes: [
    { id: 'mix', name: 'Mix', order: 0 },
    { id: 'fill', name: 'Fill', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-13T00:00:00.000Z',
  updatedAt: '2026-05-13T00:00:00.000Z',
};

const baseProps = {
  hubId: h('hub-1'),
  map,
  currentLevel: 'l2' as const,
  focalStepId: 'fill',
  rawLens: 'default' as const,
  resolvedLens: 'default' as const,
  locale: 'en' as const,
  l2Content: <div data-testid="l2-content">L2 content</div>,
  rows: [],
  stepCards: [],
  hypotheses: [],
  findings: [],
  chips: [],
  canPlaceChips: false,
  columnTypes: {},
  resolvedL3Archetype: 'b0' as const,
};

describe('CanvasLevelRouter', () => {
  it('renders LODSwitcher when lens is valid at current level', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(<CanvasLevelRouter {...baseProps} />);

    expect(screen.getByTestId('mock-lod-switcher')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-lens-level-empty-state')).not.toBeInTheDocument();
  });

  it('renders lens-level empty state when lens is invalid at current level', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(false);
    vi.mocked(suggestCanvasLevelForLens).mockReturnValue('l2');

    render(<CanvasLevelRouter {...baseProps} rawLens="process-flow" currentLevel="l1" />);

    expect(screen.getByTestId('canvas-lens-level-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-lod-switcher')).not.toBeInTheDocument();
  });

  it('passes l1 slot with SystemLevelView to LODSwitcher', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(<CanvasLevelRouter {...baseProps} currentLevel="l1" />);

    expect(screen.getByTestId('lod-l1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-system-level-view')).toBeInTheDocument();
  });

  it('passes l2 slot content from l2Content prop to LODSwitcher', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(<CanvasLevelRouter {...baseProps} currentLevel="l2" />);

    expect(screen.getByTestId('l2-content')).toBeInTheDocument();
  });

  it('renders LocalMechanismView in l3 slot when archetype is b0 and focalStepId is set', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(
      <CanvasLevelRouter
        {...baseProps}
        currentLevel="l3"
        resolvedL3Archetype="b0"
        focalStepId="fill"
      />
    );

    expect(screen.getByTestId('mock-local-mechanism-view')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-author-l3-view')).not.toBeInTheDocument();
  });

  it('renders AuthorL3View in l3 slot when archetype is b1 and focalStepId is set', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(
      <CanvasLevelRouter
        {...baseProps}
        currentLevel="l3"
        resolvedL3Archetype="b1"
        focalStepId="fill"
      />
    );

    expect(screen.getByTestId('mock-author-l3-view')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-local-mechanism-view')).not.toBeInTheDocument();
  });

  it('renders NoFocalStepPrompt in l3 slot when focalStepId is undefined', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(
      <CanvasLevelRouter
        {...baseProps}
        currentLevel="l3"
        focalStepId={undefined}
        resolvedL3Archetype="b0"
      />
    );

    expect(screen.getByTestId('mock-no-focal-step-prompt')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-local-mechanism-view')).not.toBeInTheDocument();
  });

  it('passes current level to LODSwitcher', () => {
    vi.mocked(isCanvasLensValidAtLevel).mockReturnValue(true);

    render(<CanvasLevelRouter {...baseProps} currentLevel="l3" />);

    expect(screen.getByTestId('mock-lod-switcher')).toHaveAttribute('data-current-level', 'l3');
  });
});
