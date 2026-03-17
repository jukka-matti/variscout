import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copySectionAsHTML } from '../copyUtils';

// ---------------------------------------------------------------------------
// ClipboardItem polyfill for jsdom
// ---------------------------------------------------------------------------

class MockClipboardItem {
  types: string[];
  constructor(public items: Record<string, Blob>) {
    this.types = Object.keys(items);
  }
  getType(type: string) {
    return Promise.resolve(this.items[type]);
  }
}

// ---------------------------------------------------------------------------
// Clipboard mocks
// ---------------------------------------------------------------------------

const mockWrite = vi.fn().mockResolvedValue(undefined);
const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ClipboardItem = MockClipboardItem;
  Object.assign(navigator, {
    clipboard: { write: mockWrite, writeText: mockWriteText },
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createElementWithParagraph(text: string): HTMLElement {
  const div = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = text;
  div.appendChild(p);
  return div;
}

function createElementWithHideButton(visibleText: string, hiddenText: string): HTMLElement {
  const div = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = visibleText;
  const btn = document.createElement('button');
  btn.textContent = hiddenText;
  btn.setAttribute('data-export-hide', '');
  div.appendChild(p);
  div.appendChild(btn);
  return div;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('copySectionAsHTML', () => {
  it('returns true on successful copy', async () => {
    const el = createElementWithParagraph('Some content');
    const result = await copySectionAsHTML(el);
    expect(result).toBe(true);
  });

  it('calls navigator.clipboard.write with html and text blobs', async () => {
    const el = createElementWithParagraph('Hello world');
    await copySectionAsHTML(el);
    expect(mockWrite).toHaveBeenCalledTimes(1);
    const args = mockWrite.mock.calls[0][0] as MockClipboardItem[];
    expect(args[0]).toBeInstanceOf(MockClipboardItem);
    expect(args[0].types).toContain('text/html');
    expect(args[0].types).toContain('text/plain');
  });

  it('strips elements marked with data-export-hide before copying', async () => {
    const el = createElementWithHideButton('Visible content', 'Copy button');

    let capturedItems: MockClipboardItem[] | null = null;
    mockWrite.mockImplementation(async (items: MockClipboardItem[]) => {
      capturedItems = items;
    });

    await copySectionAsHTML(el);

    // Read back the HTML blob to verify hidden elements were stripped
    const htmlBlob = await capturedItems![0].getType('text/html');
    const text = await htmlBlob.text();
    expect(text).toContain('Visible content');
    expect(text).not.toContain('Copy button');
  });

  it('does not mutate the original element', async () => {
    const el = createElementWithHideButton('Content', 'Btn');
    await copySectionAsHTML(el);
    // Original element still has the button
    expect(el.querySelector('[data-export-hide]')).not.toBeNull();
  });

  it('falls back to writeText when ClipboardItem is unavailable', async () => {
    // Remove ClipboardItem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).ClipboardItem;

    const el = createElementWithParagraph('Plain text fallback');
    const result = await copySectionAsHTML(el);

    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWrite).not.toHaveBeenCalled();

    // Restore for other tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).ClipboardItem = MockClipboardItem;
  });

  it('returns false when clipboard write throws', async () => {
    mockWrite.mockRejectedValueOnce(new Error('Permission denied'));
    const el = createElementWithParagraph('Content');
    const result = await copySectionAsHTML(el);
    expect(result).toBe(false);
  });

  it('returns false when writeText throws (fallback path)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).ClipboardItem;
    mockWriteText.mockRejectedValueOnce(new Error('Permission denied'));

    const el = createElementWithParagraph('Content');
    const result = await copySectionAsHTML(el);
    expect(result).toBe(false);

    // Restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).ClipboardItem = MockClipboardItem;
  });
});
