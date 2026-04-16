/**
 * Tests for the question-link prompt wiring.
 *
 * These tests exercise the sessionStore flag that controls whether
 * QuestionLinkPrompt is shown after a chart observation. Full component
 * mounting is deferred (requires heavy App.tsx mocking infrastructure).
 *
 * idb-keyval is mocked so the persist middleware does not hit IndexedDB
 * (unavailable in jsdom). The mock must appear before any store imports
 * so Vitest's static hoisting intercepts the module.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? undefined)),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

import { useSessionStore, getSessionInitialState } from '@variscout/stores';

// Each test resets the store synchronously; the persist middleware writes
// asynchronously via idb-keyval (mocked above) so no IndexedDB errors occur.
function resetStore() {
  useSessionStore.setState(getSessionInitialState());
}

describe('skipQuestionLinkPrompt flag (sessionStore)', () => {
  it('starts as false — prompt shown by default', () => {
    resetStore();
    expect(useSessionStore.getState().skipQuestionLinkPrompt).toBe(false);
  });

  it('setSkipQuestionLinkPrompt(true) suppresses subsequent prompts', () => {
    resetStore();
    useSessionStore.getState().setSkipQuestionLinkPrompt(true);
    expect(useSessionStore.getState().skipQuestionLinkPrompt).toBe(true);
  });

  it('setSkipQuestionLinkPrompt(false) re-enables subsequent prompts', () => {
    resetStore();
    useSessionStore.getState().setSkipQuestionLinkPrompt(true);
    useSessionStore.getState().setSkipQuestionLinkPrompt(false);
    expect(useSessionStore.getState().skipQuestionLinkPrompt).toBe(false);
  });

  it('flag is readable from getState() after mutation — persistence contract', () => {
    resetStore();
    useSessionStore.getState().setSkipQuestionLinkPrompt(true);
    expect(useSessionStore.getState().skipQuestionLinkPrompt).toBe(true);
  });
});
