import { describe, it, expect, beforeEach } from 'vitest';
import { useAIStore } from '../aiStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useAIStore.setState({
    pendingDashboardQuestion: null,
    narration: null,
    coscoutMessages: [],
    suggestedQuestions: [],
    actionProposals: [],
    aiContextSummary: null,
    kbPermissionWarning: false,
    providerLabel: null,
    resolvedChannelFolderUrl: undefined,
    knowledgeSearchScope: undefined,
    knowledgeSearchTimestamp: undefined,
    knowledgeAvailable: false,
    knowledgeSearching: false,
    knowledgeDocuments: [],
    pendingSaveProposals: 0,
    unsavedBookmarks: [],
    turnCount: 0,
    findingsCreatedThisSession: false,
  });
});

describe('aiStore', () => {
  describe('initial state', () => {
    it('has correct defaults for all 18 fields', () => {
      const s = useAIStore.getState();
      expect(s.pendingDashboardQuestion).toBeNull();
      expect(s.narration).toBeNull();
      expect(s.coscoutMessages).toEqual([]);
      expect(s.suggestedQuestions).toEqual([]);
      expect(s.actionProposals).toEqual([]);
      expect(s.aiContextSummary).toBeNull();
      expect(s.kbPermissionWarning).toBe(false);
      expect(s.providerLabel).toBeNull();
      expect(s.resolvedChannelFolderUrl).toBeUndefined();
      expect(s.knowledgeSearchScope).toBeUndefined();
      expect(s.knowledgeSearchTimestamp).toBeUndefined();
      expect(s.knowledgeAvailable).toBe(false);
      expect(s.knowledgeSearching).toBe(false);
      expect(s.knowledgeDocuments).toEqual([]);
      expect(s.pendingSaveProposals).toBe(0);
      expect(s.unsavedBookmarks).toEqual([]);
      expect(s.turnCount).toBe(0);
      expect(s.findingsCreatedThisSession).toBe(false);
    });
  });

  describe('syncNarration', () => {
    it('sets narration object', () => {
      const narration = {
        narrative: 'Some insight',
        isLoading: false,
        isCached: false,
        error: null,
      };
      useAIStore.getState().syncNarration(narration);
      expect(useAIStore.getState().narration).toEqual(narration);
    });

    it('clears narration with null', () => {
      useAIStore
        .getState()
        .syncNarration({ narrative: 'text', isLoading: false, isCached: false, error: null });
      useAIStore.getState().syncNarration(null);
      expect(useAIStore.getState().narration).toBeNull();
    });
  });

  describe('syncCoScoutMessages', () => {
    it('sets message array', () => {
      const messages = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ];
      useAIStore.getState().syncCoScoutMessages(messages as never[]);
      expect(useAIStore.getState().coscoutMessages).toHaveLength(2);
    });

    it('clears with empty array', () => {
      useAIStore.getState().syncCoScoutMessages([{ role: 'user', content: 'hi' }] as never[]);
      useAIStore.getState().syncCoScoutMessages([]);
      expect(useAIStore.getState().coscoutMessages).toEqual([]);
    });
  });

  describe('syncSuggestedQuestions', () => {
    it('sets questions', () => {
      const questions = ['What is Cpk?', 'Show trends'];
      useAIStore.getState().syncSuggestedQuestions(questions);
      expect(useAIStore.getState().suggestedQuestions).toEqual(questions);
    });

    it('clears with empty array', () => {
      useAIStore.getState().syncSuggestedQuestions(['q1']);
      useAIStore.getState().syncSuggestedQuestions([]);
      expect(useAIStore.getState().suggestedQuestions).toEqual([]);
    });
  });

  describe('syncActionProposals', () => {
    it('sets proposals', () => {
      const proposals = [{ id: 'p1', action: 'filter', label: 'Focus on Head 3' }];
      useAIStore.getState().syncActionProposals(proposals as never[]);
      expect(useAIStore.getState().actionProposals).toHaveLength(1);
    });

    it('clears with empty array', () => {
      useAIStore.getState().syncActionProposals([{ id: 'p1' }] as never[]);
      useAIStore.getState().syncActionProposals([]);
      expect(useAIStore.getState().actionProposals).toEqual([]);
    });
  });

  describe('syncAIContext', () => {
    it('sets context summary object', () => {
      const summary = { stats: 'Cpk=1.2', filterCount: 2, findingCount: 3, phase: 'MEASURE' };
      useAIStore.getState().syncAIContext(summary as never);
      expect(useAIStore.getState().aiContextSummary).toEqual(summary);
    });

    it('clears with null', () => {
      useAIStore.getState().syncAIContext({ stats: 's', filterCount: 0, findingCount: 0 } as never);
      useAIStore.getState().syncAIContext(null);
      expect(useAIStore.getState().aiContextSummary).toBeNull();
    });
  });

  describe('setKbPermissionWarning', () => {
    it('sets to true', () => {
      useAIStore.getState().setKbPermissionWarning(true);
      expect(useAIStore.getState().kbPermissionWarning).toBe(true);
    });

    it('sets back to false', () => {
      useAIStore.getState().setKbPermissionWarning(true);
      useAIStore.getState().setKbPermissionWarning(false);
      expect(useAIStore.getState().kbPermissionWarning).toBe(false);
    });
  });

  describe('setProviderLabel', () => {
    it('sets provider label', () => {
      useAIStore.getState().setProviderLabel('OpenAI GPT-4o');
      expect(useAIStore.getState().providerLabel).toBe('OpenAI GPT-4o');
    });

    it('clears with null', () => {
      useAIStore.getState().setProviderLabel('GPT-4o');
      useAIStore.getState().setProviderLabel(null);
      expect(useAIStore.getState().providerLabel).toBeNull();
    });
  });

  describe('setResolvedChannelFolderUrl', () => {
    it('sets URL', () => {
      useAIStore.getState().setResolvedChannelFolderUrl('https://graph.microsoft.com/folder/123');
      expect(useAIStore.getState().resolvedChannelFolderUrl).toBe(
        'https://graph.microsoft.com/folder/123'
      );
    });

    it('clears with undefined', () => {
      useAIStore.getState().setResolvedChannelFolderUrl('https://example.com');
      useAIStore.getState().setResolvedChannelFolderUrl(undefined);
      expect(useAIStore.getState().resolvedChannelFolderUrl).toBeUndefined();
    });
  });

  describe('setKnowledgeSearchScope', () => {
    it('sets scope string', () => {
      useAIStore.getState().setKnowledgeSearchScope('team');
      expect(useAIStore.getState().knowledgeSearchScope).toBe('team');
    });

    it('clears with undefined', () => {
      useAIStore.getState().setKnowledgeSearchScope('personal');
      useAIStore.getState().setKnowledgeSearchScope(undefined);
      expect(useAIStore.getState().knowledgeSearchScope).toBeUndefined();
    });
  });

  describe('setKnowledgeSearchTimestamp', () => {
    it('sets timestamp', () => {
      useAIStore.getState().setKnowledgeSearchTimestamp(1711234567890);
      expect(useAIStore.getState().knowledgeSearchTimestamp).toBe(1711234567890);
    });

    it('clears with undefined', () => {
      useAIStore.getState().setKnowledgeSearchTimestamp(1711234567890);
      useAIStore.getState().setKnowledgeSearchTimestamp(undefined);
      expect(useAIStore.getState().knowledgeSearchTimestamp).toBeUndefined();
    });
  });

  describe('syncKnowledgeSearch', () => {
    it('maps isAvailable to knowledgeAvailable', () => {
      useAIStore.getState().syncKnowledgeSearch({
        isAvailable: true,
        isSearching: false,
        documents: [],
      });
      expect(useAIStore.getState().knowledgeAvailable).toBe(true);
    });

    it('maps isSearching to knowledgeSearching', () => {
      useAIStore.getState().syncKnowledgeSearch({
        isAvailable: false,
        isSearching: true,
        documents: [],
      });
      expect(useAIStore.getState().knowledgeSearching).toBe(true);
    });

    it('maps documents to knowledgeDocuments', () => {
      const docs = [{ id: 'doc1', title: 'SPC Guide' }];
      useAIStore.getState().syncKnowledgeSearch({
        isAvailable: true,
        isSearching: false,
        documents: docs as never[],
      });
      expect(useAIStore.getState().knowledgeDocuments).toEqual(docs);
    });

    it('sets all three fields simultaneously', () => {
      useAIStore.getState().syncKnowledgeSearch({
        isAvailable: true,
        isSearching: true,
        documents: [{ id: 'd1' }] as never[],
      });
      const s = useAIStore.getState();
      expect(s.knowledgeAvailable).toBe(true);
      expect(s.knowledgeSearching).toBe(true);
      expect(s.knowledgeDocuments).toHaveLength(1);
    });
  });

  describe('setPendingDashboardQuestion', () => {
    it('sets a question', () => {
      useAIStore.getState().setPendingDashboardQuestion('Why is Cpk low?');
      expect(useAIStore.getState().pendingDashboardQuestion).toBe('Why is Cpk low?');
    });

    it('clears with null', () => {
      useAIStore.getState().setPendingDashboardQuestion('question');
      useAIStore.getState().setPendingDashboardQuestion(null);
      expect(useAIStore.getState().pendingDashboardQuestion).toBeNull();
    });
  });
});

describe('AISessionState', () => {
  beforeEach(() => {
    useAIStore.setState(useAIStore.getInitialState());
  });

  it('tracks pendingSaveProposals', () => {
    useAIStore.getState().incrementPendingSaveProposals();
    expect(useAIStore.getState().pendingSaveProposals).toBe(1);
    useAIStore.getState().decrementPendingSaveProposals();
    expect(useAIStore.getState().pendingSaveProposals).toBe(0);
  });

  it('tracks unsaved bookmarks', () => {
    useAIStore.getState().addUnsavedBookmark('msg-1');
    expect(useAIStore.getState().unsavedBookmarks).toContain('msg-1');
    useAIStore.getState().removeUnsavedBookmark('msg-1');
    expect(useAIStore.getState().unsavedBookmarks).not.toContain('msg-1');
  });

  it('tracks turn count', () => {
    useAIStore.getState().incrementTurnCount();
    useAIStore.getState().incrementTurnCount();
    expect(useAIStore.getState().turnCount).toBe(2);
  });

  it('shouldShowClosePrompt returns true with pending proposals', () => {
    useAIStore.getState().incrementPendingSaveProposals();
    expect(useAIStore.getState().shouldShowClosePrompt()).toBe(true);
  });

  it('shouldShowClosePrompt returns true with unsaved bookmarks', () => {
    useAIStore.getState().addUnsavedBookmark('msg-1');
    expect(useAIStore.getState().shouldShowClosePrompt()).toBe(true);
  });

  it('shouldShowClosePrompt returns true with 5+ turns and no findings', () => {
    for (let i = 0; i < 5; i++) useAIStore.getState().incrementTurnCount();
    expect(useAIStore.getState().shouldShowClosePrompt()).toBe(true);
  });

  it('shouldShowClosePrompt returns false with 5+ turns but findings created', () => {
    for (let i = 0; i < 5; i++) useAIStore.getState().incrementTurnCount();
    useAIStore.getState().markFindingCreatedThisSession();
    expect(useAIStore.getState().shouldShowClosePrompt()).toBe(false);
  });

  it('shouldShowClosePrompt returns false with fresh session', () => {
    expect(useAIStore.getState().shouldShowClosePrompt()).toBe(false);
  });

  it('resetSessionState clears all fields', () => {
    useAIStore.getState().incrementPendingSaveProposals();
    useAIStore.getState().addUnsavedBookmark('msg-1');
    useAIStore.getState().incrementTurnCount();
    useAIStore.getState().markFindingCreatedThisSession();
    useAIStore.getState().resetSessionState();
    expect(useAIStore.getState().pendingSaveProposals).toBe(0);
    expect(useAIStore.getState().unsavedBookmarks).toEqual([]);
    expect(useAIStore.getState().turnCount).toBe(0);
    expect(useAIStore.getState().findingsCreatedThisSession).toBe(false);
  });
});
