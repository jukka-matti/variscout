import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isPreviewEnabled, setPreviewEnabled } from '../preview';

// Mock localStorage for Node environment
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  removeItem: vi.fn((key: string) => store.delete(key)),
  clear: vi.fn(() => store.clear()),
  get length() {
    return store.size;
  },
  key: vi.fn((index: number) => [...store.keys()][index] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

describe('preview feature registry', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('returns false by default', () => {
    expect(isPreviewEnabled('knowledge-base')).toBe(false);
  });

  it('returns true after enabling', () => {
    setPreviewEnabled('knowledge-base', true);
    expect(isPreviewEnabled('knowledge-base')).toBe(true);
  });

  it('returns false after disabling', () => {
    setPreviewEnabled('knowledge-base', true);
    setPreviewEnabled('knowledge-base', false);
    expect(isPreviewEnabled('knowledge-base')).toBe(false);
  });

  it('clears storage key on disable', () => {
    setPreviewEnabled('knowledge-base', true);
    expect(store.get('variscout-preview-knowledge-base')).toBe('true');
    setPreviewEnabled('knowledge-base', false);
    expect(store.has('variscout-preview-knowledge-base')).toBe(false);
  });

  it('handles localStorage unavailable for isPreviewEnabled', () => {
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('SecurityError');
    });
    expect(isPreviewEnabled('knowledge-base')).toBe(false);
  });

  it('handles localStorage unavailable for setPreviewEnabled', () => {
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    // Should not throw
    expect(() => setPreviewEnabled('knowledge-base', true)).not.toThrow();
  });
});
