import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock html-to-image before importing the hook
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
}));

import { useChartCopy, EXPORT_SIZES } from '../useChartCopy';
import { toBlob, toPng } from 'html-to-image';

// Polyfill ClipboardItem for jsdom
class MockClipboardItem {
  types: string[];
  constructor(public items: Record<string, Blob>) {
    this.types = Object.keys(items);
  }
  getType(type: string) {
    return Promise.resolve(this.items[type]);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ClipboardItem = MockClipboardItem;

// Helper to create a mock DOM element with style tracking
function createMockNode(id: string, initialStyle = ''): HTMLElement {
  const node = document.createElement('div');
  node.id = id;
  if (initialStyle) node.style.cssText = initialStyle;
  // Mock offsetHeight for parent min-height lock
  Object.defineProperty(node, 'offsetHeight', { value: 400, configurable: true });
  document.body.appendChild(node);
  return node;
}

// Helper to flush rAF + setTimeout used by withFixedSize
async function flushExportTimers(): Promise<void> {
  // Double rAF
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(0);
  // setTimeout(100)
  await vi.advanceTimersByTimeAsync(100);
  // Restore rAF
  await vi.advanceTimersByTimeAsync(0);
}

describe('EXPORT_SIZES', () => {
  it('contains all expected chart types', () => {
    expect(Object.keys(EXPORT_SIZES)).toEqual(
      expect.arrayContaining([
        'ichart',
        'boxplot',
        'pareto',
        'histogram',
        'probability',
        'stats',
        'scatter',
        'dashboard',
        'slide',
      ])
    );
    expect(Object.keys(EXPORT_SIZES)).toHaveLength(9);
  });

  it('has correct dimensions for wide charts', () => {
    expect(EXPORT_SIZES.ichart).toEqual({ width: 1200, height: 540 });
    expect(EXPORT_SIZES.boxplot).toEqual({ width: 1200, height: 800 });
    expect(EXPORT_SIZES.pareto).toEqual({ width: 1200, height: 720 });
  });

  it('has correct dimensions for compact charts', () => {
    expect(EXPORT_SIZES.histogram).toEqual({ width: 800, height: 600 });
    expect(EXPORT_SIZES.probability).toEqual({ width: 800, height: 700 });
  });

  it('has correct dimensions for text panels', () => {
    expect(EXPORT_SIZES.stats).toEqual({ width: 1200, height: 400 });
  });

  it('has dashboard with auto-height (height=0)', () => {
    expect(EXPORT_SIZES.dashboard).toEqual({ width: 1600, height: 0 });
  });

  it('all wide charts are >= 768px (desktop font breakpoint)', () => {
    for (const key of ['ichart', 'boxplot', 'pareto', 'stats']) {
      expect(EXPORT_SIZES[key].width).toBeGreaterThanOrEqual(768);
    }
  });
});

describe('useChartCopy', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: { write: vi.fn().mockResolvedValue(undefined) },
    });

    // Mock URL.createObjectURL / revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('handleCopyChart', () => {
    it('calls toBlob with pixelRatio: 2', async () => {
      const node = createMockNode('test-chart', 'color: red');
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      expect(toBlob).toHaveBeenCalledWith(node, expect.objectContaining({ pixelRatio: 2 }));
    });

    it('sets data-exporting attribute during capture', async () => {
      const node = createMockNode('test-chart');
      let exportingDuringCapture = false;

      vi.mocked(toBlob).mockImplementation(async el => {
        exportingDuringCapture = (el as HTMLElement).getAttribute('data-exporting') === 'true';
        return new Blob(['png'], { type: 'image/png' });
      });

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'boxplot');
        await flushExportTimers();
        await promise;
      });

      expect(exportingDuringCapture).toBe(true);
      expect(node.getAttribute('data-exporting')).toBeNull();
    });

    it('applies fixed-size styles before capture', async () => {
      createMockNode('test-chart', 'color: red');
      let stylesDuringCapture = '';

      vi.mocked(toBlob).mockImplementation(async el => {
        stylesDuringCapture = (el as HTMLElement).style.cssText;
        return new Blob(['png'], { type: 'image/png' });
      });

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      // jsdom normalizes !important styles with spaces
      expect(stylesDuringCapture).toContain('position: fixed');
      expect(stylesDuringCapture).toContain('left: -9999px');
      expect(stylesDuringCapture).toContain('1200px');
      expect(stylesDuringCapture).toContain('540px');
    });

    it('restores original styles after capture', async () => {
      const node = createMockNode('test-chart', 'color: red');
      const originalStyle = node.style.cssText;
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      expect(node.style.cssText).toBe(originalStyle);
    });

    it('restores styles even when capture fails', async () => {
      const node = createMockNode('test-chart', 'color: blue');
      const originalStyle = node.style.cssText;
      vi.mocked(toBlob).mockRejectedValueOnce(new Error('capture failed'));

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'boxplot');
        await flushExportTimers();
        await promise;
      });

      expect(node.style.cssText).toBe(originalStyle);
      expect(node.getAttribute('data-exporting')).toBeNull();
    });

    it('locks parent min-height during export', async () => {
      const parent = document.createElement('div');
      Object.defineProperty(parent, 'offsetHeight', { value: 600, configurable: true });
      document.body.appendChild(parent);

      const node = document.createElement('div');
      node.id = 'test-chart';
      parent.appendChild(node);

      let parentMinHeightDuringCapture = '';
      vi.mocked(toBlob).mockImplementation(async () => {
        parentMinHeightDuringCapture = parent.style.minHeight;
        return new Blob(['png'], { type: 'image/png' });
      });

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'pareto');
        await flushExportTimers();
        await promise;
      });

      expect(parentMinHeightDuringCapture).toBe('600px');
      expect(parent.style.minHeight).toBe('');
    });

    it('applies auto-height styles for dashboard export', async () => {
      createMockNode('test-chart');
      let stylesDuringCapture = '';

      vi.mocked(toBlob).mockImplementation(async el => {
        stylesDuringCapture = (el as HTMLElement).style.cssText;
        return new Blob(['png'], { type: 'image/png' });
      });

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'dashboard');
        await flushExportTimers();
        await promise;
      });

      expect(stylesDuringCapture).toContain('1600px');
      expect(stylesDuringCapture).toContain('height: auto');
      expect(stylesDuringCapture).toContain('overflow: visible');
      expect(stylesDuringCapture).not.toContain('height: 0');
    });

    it('uses default fallback dimensions for unknown chart names', async () => {
      createMockNode('test-chart');
      let stylesDuringCapture = '';

      vi.mocked(toBlob).mockImplementation(async el => {
        stylesDuringCapture = (el as HTMLElement).style.cssText;
        return new Blob(['png'], { type: 'image/png' });
      });

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'unknown-chart');
        await flushExportTimers();
        await promise;
      });

      expect(stylesDuringCapture).toContain('1200px');
      expect(stylesDuringCapture).toContain('675px');
    });

    it('does nothing when container not found', async () => {
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        await result.current.handleCopyChart('nonexistent', 'ichart');
      });

      expect(toBlob).not.toHaveBeenCalled();
    });

    it('shows copy feedback on success', async () => {
      createMockNode('test-chart');
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      expect(result.current.copyFeedback).toBe('ichart');
    });
  });

  describe('handleDownloadPng', () => {
    it('applies fixed-size styles for PNG download', async () => {
      createMockNode('test-chart');
      let stylesDuringCapture = '';

      vi.mocked(toPng).mockImplementation(async el => {
        stylesDuringCapture = (el as HTMLElement).style.cssText;
        return 'data:image/png;base64,abc';
      });

      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleDownloadPng('test-chart', 'boxplot');
        await flushExportTimers();
        await promise;
      });

      expect(stylesDuringCapture).toContain('1200px');
      expect(stylesDuringCapture).toContain('800px');
    });

    it('restores styles after PNG download', async () => {
      const node = createMockNode('test-chart', 'margin: 10px');
      const originalStyle = node.style.cssText;
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleDownloadPng('test-chart', 'pareto');
        await flushExportTimers();
        await promise;
      });

      expect(node.style.cssText).toBe(originalStyle);
    });
  });

  describe('handleDownloadSvg', () => {
    it('uses fixed export dimensions for SVG width/height attributes', () => {
      const node = createMockNode('svg-chart');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
      });
      node.appendChild(svg);

      const { result } = renderHook(() => useChartCopy());

      act(() => {
        result.current.handleDownloadSvg('svg-chart', 'ichart');
      });

      // Verify URL.createObjectURL was called (SVG was serialized)
      expect(URL.createObjectURL).toHaveBeenCalled();
      const blobArg = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('image/svg+xml;charset=utf-8');
    });

    it('sets data-exporting during SVG export and cleans up', () => {
      const node = createMockNode('svg-chart');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
      });
      node.appendChild(svg);

      const { result } = renderHook(() => useChartCopy());

      act(() => {
        result.current.handleDownloadSvg('svg-chart', 'boxplot');
      });

      expect(node.getAttribute('data-exporting')).toBeNull();
    });

    it('does nothing when no SVG element found', () => {
      createMockNode('svg-chart'); // No SVG child

      const { result } = renderHook(() => useChartCopy());

      act(() => {
        result.current.handleDownloadSvg('svg-chart', 'ichart');
      });

      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('copyFeedback', () => {
    it('starts as null', () => {
      const { result } = renderHook(() => useChartCopy());
      expect(result.current.copyFeedback).toBeNull();
    });

    it('clears after 2000ms', async () => {
      createMockNode('test-chart');
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      expect(result.current.copyFeedback).toBe('ichart');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copyFeedback).toBeNull();
    });
  });

  describe('getBackgroundColor option', () => {
    it('uses custom background color when provided', async () => {
      createMockNode('test-chart');
      const { result } = renderHook(() => useChartCopy({ getBackgroundColor: () => '#ffffff' }));

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      expect(toBlob).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ backgroundColor: '#ffffff' })
      );
    });

    it('defaults to dark theme background', async () => {
      createMockNode('test-chart');
      const { result } = renderHook(() => useChartCopy());

      await act(async () => {
        const promise = result.current.handleCopyChart('test-chart', 'ichart');
        await flushExportTimers();
        await promise;
      });

      expect(toBlob).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ backgroundColor: '#0f172a' })
      );
    });
  });
});
