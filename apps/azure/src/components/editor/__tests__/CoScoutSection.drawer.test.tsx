import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const visualGroundingHighlightMock = vi.hoisted(() => vi.fn());
const capturedCoScoutPanelProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

vi.mock('@variscout/stores', () => ({
  usePreferencesStore: (selector: (s: { aiEnabled: boolean }) => unknown) =>
    selector({ aiEnabled: true }),
  useProjectStore: (selector: (s: { filters: Record<string, unknown[]> }) => unknown) =>
    selector({ filters: {} }),
}));

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFilteredData: () => ({ filteredData: [] }),
    useAnalysisStats: () => ({ stats: null }),
    useVisualGrounding: () => ({ highlight: visualGroundingHighlightMock }),
    useCoScoutProps: ({
      visualGroundingHighlight,
    }: {
      visualGroundingHighlight: (targetType: string, targetId?: string) => void;
    }) => ({
      messages: [],
      onSend: vi.fn(),
      isLoading: false,
      isStreaming: false,
      onStopStreaming: vi.fn(),
      error: null,
      onRetry: vi.fn(),
      onClear: vi.fn(),
      onCopyLastResponse: vi.fn(),
      resizeConfig: { storageKey: 'test-coscout-drawer' },
      suggestedQuestions: [],
      onSuggestedQuestionClick: vi.fn(),
      knowledgeAvailable: false,
      knowledgeSearching: false,
      knowledgeDocuments: [],
      onSearchKnowledge: vi.fn(),
      actionProposals: [],
      onExecuteAction: vi.fn(),
      onDismissAction: vi.fn(),
      onSaveAsNewFinding: vi.fn(),
      onAddCommentToFinding: vi.fn(),
      onAddCommentToHypothesis: vi.fn(),
      insightFindings: [],
      insightQuestions: [],
      onRefActivate: visualGroundingHighlight,
    }),
  };
});

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    CoScoutPanelBase: (props: Record<string, unknown>) => {
      capturedCoScoutPanelProps.current = props;
      if (!props.isOpen) return null;
      return (
        <button
          type="button"
          data-testid="mock-coscout-ref"
          onClick={() => {
            const onRefActivate = props.onRefActivate as
              | ((targetType: string, targetId?: string) => void)
              | undefined;
            onRefActivate?.('finding', 'f1');
          }}
        >
          REF
        </button>
      );
    },
    SessionClosePrompt: () => null,
  };
});

vi.mock('../../../services/aiService', () => ({
  isAIAvailable: () => true,
}));

vi.mock('../../../features/ai/aiStore', () => ({
  useAIStore: {
    getState: () => ({
      shouldShowClosePrompt: () => false,
      resetSessionState: vi.fn(),
      coscoutMessages: [],
      unsavedBookmarks: new Set(),
      actionProposals: [],
    }),
  },
}));

import { usePanelsStore } from '../../../features/panels/panelsStore';
import { CoScoutSection } from '../CoScoutSection';

function makeProps(): React.ComponentProps<typeof CoScoutSection> {
  return {
    aiOrch: {} as never,
    findingsState: {} as never,
    actionProposalsState: {} as never,
    handleSearchKnowledge: vi.fn(),
    handleAddCommentWithAuthor: vi.fn(),
    drawerMode: true,
    selectedObject: { kind: 'finding', id: 'f1', label: 'Temperature spike' },
  };
}

describe('CoScoutSection drawer mode', () => {
  beforeEach(() => {
    usePanelsStore.setState({ isCoScoutOpen: false });
    visualGroundingHighlightMock.mockClear();
    capturedCoScoutPanelProps.current = null;
  });

  it('renders the AW-8 right drawer shell from the existing CoScout section', () => {
    render(<CoScoutSection {...makeProps()} />);

    expect(screen.getByTestId('coscout-drawer-handle')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('coscout-drawer-handle'));

    expect(screen.getByTestId('coscout-right-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('coscout-drawer-object')).toHaveTextContent('Temperature spike');
    expect(screen.getByRole('tab', { name: 'Coach' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Evidence' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Actions' })).toBeInTheDocument();
    expect(capturedCoScoutPanelProps.current?.onRefActivate).toEqual(expect.any(Function));
  });

  it('keeps REF activation wired through the CoScout panel', () => {
    usePanelsStore.setState({ isCoScoutOpen: true });

    render(<CoScoutSection {...makeProps()} />);
    fireEvent.click(screen.getByTestId('mock-coscout-ref'));

    expect(visualGroundingHighlightMock).toHaveBeenCalledWith('finding', 'f1');
  });
});
