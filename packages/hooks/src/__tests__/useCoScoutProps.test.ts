import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoScoutProps } from '../useCoScoutProps';
import type { UseCoScoutPropsOptions } from '../useCoScoutProps';
import type { CoScoutMessage, CoScoutError, ActionProposal } from '@variscout/core';

// ============================================================================
// Helpers / factories
// ============================================================================

function makeMessage(overrides?: Partial<CoScoutMessage>): CoScoutMessage {
  return {
    id: 'msg-1',
    role: 'assistant',
    content: 'Hello',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeProposal(overrides?: Partial<ActionProposal>): ActionProposal {
  return {
    id: 'prop-1',
    tool: 'suggest_save_finding',
    params: { insight_text: 'Proposal text' },
    status: 'pending',
    ...overrides,
  } as ActionProposal;
}

// ---------------------------------------------------------------------------
// Default mock implementations
// ---------------------------------------------------------------------------

const mockSend = vi.fn();
const mockRetry = vi.fn();
const mockClear = vi.fn();
const mockStopStreaming = vi.fn();
const mockCopyLastResponse = vi.fn().mockResolvedValue(true);

const mockCoscout = {
  messages: [] as CoScoutMessage[],
  send: mockSend,
  retry: mockRetry,
  isLoading: false,
  isStreaming: false,
  error: null as CoScoutError | null,
  clear: mockClear,
  stopStreaming: mockStopStreaming,
  copyLastResponse: mockCopyLastResponse,
};

const mockKnowledgeSearch = {
  results: [],
  documents: [],
  isSearching: false,
  isAvailable: true,
  lastSearchTimestamp: undefined,
  search: vi.fn(),
  clear: vi.fn(),
};

const mockResizeConfig = {
  storageKey: 'test-coscout-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

const mockAddFinding = vi.fn();
const mockAddFindingComment = vi.fn();

const mockFindingsState = {
  findings: [{ id: 'f-1', text: 'Finding one' }] as Array<{ id: string; text: string }>,
  addFinding: mockAddFinding,
  editFinding: vi.fn(),
  deleteFinding: vi.fn(),
  getFindingContext: vi.fn(),
  findDuplicate: vi.fn(),
  findDuplicateSource: vi.fn(),
  getChartFindings: vi.fn(),
  setFindingStatus: vi.fn(),
  setFindingTag: vi.fn(),
  addFindingComment: mockAddFindingComment,
  editFindingComment: vi.fn(),
  deleteFindingComment: vi.fn(),
  setFindingAssignee: vi.fn(),
  addPhotoToComment: vi.fn(),
  updatePhotoStatus: vi.fn(),
} as unknown as UseCoScoutPropsOptions['findingsState'];

const mockAddIdea = vi.fn();

const mockQuestionsState = {
  questions: [{ id: 'q-1', text: 'Question one' }],
  addIdea: mockAddIdea,
  addQuestion: vi.fn(),
  editQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  setQuestionStatus: vi.fn(),
  linkFinding: vi.fn(),
  unlinkFinding: vi.fn(),
  createHubFromQuestion: vi.fn(),
  editIdea: vi.fn(),
  deleteIdea: vi.fn(),
  setIdeaStatus: vi.fn(),
  setIdeaCategory: vi.fn(),
} as unknown as UseCoScoutPropsOptions['questionsState'];

const mockHandleExecuteAction = vi.fn();
const mockHandleDismissAction = vi.fn();

const mockActionProposalsState = {
  actionProposals: [makeProposal()],
  handleExecuteAction: mockHandleExecuteAction,
  handleDismissAction: mockHandleDismissAction,
};

const mockVisualGroundingHighlight = vi.fn();
const mockHandleSearchKnowledge = vi.fn();
const mockHandleAddCommentWithAuthor = vi.fn();

function makeOptions(overrides?: Partial<UseCoScoutPropsOptions>): UseCoScoutPropsOptions {
  return {
    aiOrch: {
      coscout: mockCoscout,
      knowledgeSearch: mockKnowledgeSearch,
      suggestedQuestions: ['Question A', 'Question B'],
      resizeConfig: mockResizeConfig,
    },
    findingsState: mockFindingsState,
    questionsState: mockQuestionsState,
    actionProposalsState: mockActionProposalsState,
    filters: { Machine: ['A', 'B'] },
    stats: { mean: 10, median: 9.5, cpk: 1.2 },
    filteredDataLength: 50,
    visualGroundingHighlight: mockVisualGroundingHighlight,
    handleSearchKnowledge: mockHandleSearchKnowledge,
    handleAddCommentWithAuthor: mockHandleAddCommentWithAuthor,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCoScoutProps', () => {
  describe('return shape', () => {
    it('returns an object with all expected keys', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      expect(result.current).toMatchObject({
        messages: expect.any(Array),
        onSend: expect.any(Function),
        isLoading: expect.any(Boolean),
        isStreaming: expect.any(Boolean),
        onStopStreaming: expect.any(Function),
        onRetry: expect.any(Function),
        onClear: expect.any(Function),
        onCopyLastResponse: expect.any(Function),
        resizeConfig: expect.any(Object),
        suggestedQuestions: expect.any(Array),
        onSuggestedQuestionClick: expect.any(Function),
        knowledgeAvailable: expect.any(Boolean),
        knowledgeSearching: expect.any(Boolean),
        knowledgeDocuments: expect.any(Array),
        onSearchKnowledge: expect.any(Function),
        actionProposals: expect.any(Array),
        onExecuteAction: expect.any(Function),
        onDismissAction: expect.any(Function),
        onSaveAsNewFinding: expect.any(Function),
        onAddCommentToFinding: expect.any(Function),
        onAddCommentToHypothesis: expect.any(Function),
        insightFindings: expect.any(Array),
        insightQuestions: expect.any(Array),
        onRefActivate: expect.any(Function),
      });
    });

    it('passes through coscout messages from aiOrch', () => {
      const messages = [makeMessage({ id: 'msg-a' })];
      const { result } = renderHook(() =>
        useCoScoutProps(
          makeOptions({
            aiOrch: { ...makeOptions().aiOrch, coscout: { ...mockCoscout, messages } },
          })
        )
      );
      expect(result.current.messages).toBe(messages);
    });

    it('passes through isLoading, isStreaming from coscout', () => {
      const { result } = renderHook(() =>
        useCoScoutProps(
          makeOptions({
            aiOrch: {
              ...makeOptions().aiOrch,
              coscout: { ...mockCoscout, isLoading: true, isStreaming: true },
            },
          })
        )
      );
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isStreaming).toBe(true);
    });

    it('passes through knowledgeAvailable and knowledgeSearching', () => {
      const { result } = renderHook(() =>
        useCoScoutProps(
          makeOptions({
            aiOrch: {
              ...makeOptions().aiOrch,
              knowledgeSearch: { ...mockKnowledgeSearch, isAvailable: false, isSearching: true },
            },
          })
        )
      );
      expect(result.current.knowledgeAvailable).toBe(false);
      expect(result.current.knowledgeSearching).toBe(true);
    });

    it('maps suggestedQuestions from aiOrch', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      expect(result.current.suggestedQuestions).toEqual(['Question A', 'Question B']);
    });

    it('maps actionProposals from actionProposalsState', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      expect(result.current.actionProposals).toHaveLength(1);
      expect(result.current.actionProposals[0].id).toBe('prop-1');
    });

    it('builds insightFindings from findingsState.findings', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      expect(result.current.insightFindings).toEqual([{ id: 'f-1', text: 'Finding one' }]);
    });

    it('builds insightQuestions from questionsState.questions', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      expect(result.current.insightQuestions).toEqual([{ id: 'q-1', text: 'Question one' }]);
    });

    it('wires onRefActivate to visualGroundingHighlight', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      result.current.onRefActivate('factor', 'Machine');
      expect(mockVisualGroundingHighlight).toHaveBeenCalledWith('factor', 'Machine');
    });

    it('wires onSearchKnowledge to handleSearchKnowledge', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      result.current.onSearchKnowledge();
      expect(mockHandleSearchKnowledge).toHaveBeenCalledOnce();
    });

    it('sets resizeConfig from aiOrch.resizeConfig', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      expect(result.current.resizeConfig).toBe(mockResizeConfig);
    });
  });

  describe('onSend callback', () => {
    it('calls coscout.send with text and normalized images', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onSend('Hello', [{ id: 'img-1', dataUrl: 'data:image/png;base64,...' }]);
      });

      expect(mockSend).toHaveBeenCalledWith('Hello', [
        { id: 'img-1', dataUrl: 'data:image/png;base64,...', mimeType: 'image/png' },
      ]);
    });

    it('defaults mimeType to image/png when not provided', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onSend('Hi', [{ id: 'img-2', dataUrl: 'data:...' }]);
      });

      expect(mockSend).toHaveBeenCalledWith('Hi', [
        { id: 'img-2', dataUrl: 'data:...', mimeType: 'image/png' },
      ]);
    });

    it('passes undefined images when no images provided', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onSend('Text only');
      });

      expect(mockSend).toHaveBeenCalledWith('Text only', undefined);
    });

    it('onSuggestedQuestionClick is the same function as onSend', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      // They should be the same callback reference
      expect(result.current.onSuggestedQuestionClick).toBe(result.current.onSend);
    });
  });

  describe('onSaveAsNewFinding', () => {
    it('calls findingsState.addFinding with text, context, and coscout source', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onSaveAsNewFinding('My insight', 'msg-abc');
      });

      expect(mockAddFinding).toHaveBeenCalledWith(
        'My insight',
        expect.objectContaining({
          activeFilters: { Machine: ['A', 'B'] },
          cumulativeScope: null,
          stats: expect.objectContaining({ mean: 10, median: 9.5, samples: 50 }),
        }),
        expect.objectContaining({ chart: 'coscout', messageId: 'msg-abc' })
      );
    });

    it('passes undefined stats context when stats is null', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions({ stats: null })));

      act(() => {
        result.current.onSaveAsNewFinding('Insight', 'msg-xyz');
      });

      expect(mockAddFinding).toHaveBeenCalledWith(
        'Insight',
        expect.objectContaining({ stats: undefined }),
        expect.any(Object)
      );
    });
  });

  describe('onAddCommentToFinding', () => {
    it('calls findingsState.addFindingComment when no attachment', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onAddCommentToFinding('finding-1', 'Comment text');
      });

      expect(mockAddFindingComment).toHaveBeenCalledWith('finding-1', 'Comment text');
      expect(mockHandleAddCommentWithAuthor).not.toHaveBeenCalled();
    });

    it('routes to handleAddCommentWithAuthor when attachment is provided', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.onAddCommentToFinding('finding-1', 'With photo', file);
      });

      expect(mockHandleAddCommentWithAuthor).toHaveBeenCalledWith('finding-1', 'With photo', file);
      expect(mockAddFindingComment).not.toHaveBeenCalled();
    });
  });

  describe('onAddCommentToHypothesis', () => {
    it('calls questionsState.addIdea with question id and text', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onAddCommentToHypothesis('q-1', 'An idea');
      });

      expect(mockAddIdea).toHaveBeenCalledWith('q-1', 'An idea');
    });
  });

  describe('action proposal callbacks', () => {
    it('wires onExecuteAction to actionProposalsState.handleExecuteAction', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      const proposal = makeProposal();

      act(() => {
        result.current.onExecuteAction(proposal, 'edited text');
      });

      expect(mockHandleExecuteAction).toHaveBeenCalledWith(proposal, 'edited text');
    });

    it('wires onDismissAction to actionProposalsState.handleDismissAction', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));

      act(() => {
        result.current.onDismissAction('prop-1');
      });

      expect(mockHandleDismissAction).toHaveBeenCalledWith('prop-1');
    });
  });

  describe('coscout control callbacks', () => {
    it('wires onStopStreaming to coscout.stopStreaming', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      result.current.onStopStreaming();
      expect(mockStopStreaming).toHaveBeenCalledOnce();
    });

    it('wires onRetry to coscout.retry', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      result.current.onRetry();
      expect(mockRetry).toHaveBeenCalledOnce();
    });

    it('wires onClear to coscout.clear', () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      result.current.onClear();
      expect(mockClear).toHaveBeenCalledOnce();
    });

    it('wires onCopyLastResponse to coscout.copyLastResponse', async () => {
      const { result } = renderHook(() => useCoScoutProps(makeOptions()));
      const copied = await result.current.onCopyLastResponse();
      expect(mockCopyLastResponse).toHaveBeenCalledOnce();
      expect(copied).toBe(true);
    });
  });

  describe('defaults for optional fields', () => {
    it('returns empty array for knowledgeDocuments when documents is undefined', () => {
      const { result } = renderHook(() =>
        useCoScoutProps(
          makeOptions({
            aiOrch: {
              ...makeOptions().aiOrch,
              // @ts-expect-error — testing defensive default
              knowledgeSearch: { ...mockKnowledgeSearch, documents: undefined },
            },
          })
        )
      );
      expect(result.current.knowledgeDocuments).toEqual([]);
    });

    it('returns false for isStreaming when coscout.isStreaming is undefined', () => {
      const { result } = renderHook(() =>
        useCoScoutProps(
          makeOptions({
            aiOrch: {
              ...makeOptions().aiOrch,
              // @ts-expect-error — testing defensive default
              coscout: { ...mockCoscout, isStreaming: undefined },
            },
          })
        )
      );
      expect(result.current.isStreaming).toBe(false);
    });
  });
});
