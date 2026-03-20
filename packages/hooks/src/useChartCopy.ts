import { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_BG = '#0f172a';

/** Fixed export dimensions for presentation-ready output (PowerPoint-optimized). */
export const EXPORT_SIZES: Record<string, { width: number; height: number }> = {
  ichart: { width: 1200, height: 540 },
  boxplot: { width: 1200, height: 800 },
  pareto: { width: 1200, height: 720 },
  histogram: { width: 800, height: 600 },
  probability: { width: 800, height: 700 },
  stats: { width: 1200, height: 400 },
  scatter: { width: 1200, height: 800 },
  yamazumi: { width: 1200, height: 800 },
  dashboard: { width: 1600, height: 0 }, // height=0 → auto (capture full scrollHeight)
  slide: { width: 1920, height: 1080 },
};

const DEFAULT_EXPORT_SIZE = { width: 1200, height: 675 };

export interface UseChartCopyOptions {
  /** Return background color for the screenshot. Called at copy time. */
  getBackgroundColor?: () => string;
}

export interface UseChartCopyReturn {
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadSvg: (containerId: string, chartName: string) => void;
}

/** Set data-exporting attribute and return cleanup function */
function prepareForExport(node: HTMLElement): void {
  node.setAttribute('data-exporting', 'true');
}

function cleanupAfterExport(node: HTMLElement): void {
  node.removeAttribute('data-exporting');
}

function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Temporarily resize element to fixed export dimensions, wait for visx
 * ResizeObserver + React re-render, run capture, then restore original styles.
 */
async function withFixedSize<T>(
  node: HTMLElement,
  chartName: string,
  capture: (node: HTMLElement) => Promise<T>
): Promise<T> {
  const size = EXPORT_SIZES[chartName] ?? DEFAULT_EXPORT_SIZE;
  const savedStyle = node.style.cssText;
  const parent = node.parentElement;
  const savedParentMinHeight = parent?.style.minHeight ?? '';
  if (parent) parent.style.minHeight = `${parent.offsetHeight}px`;

  const heightCss =
    size.height > 0
      ? `height:${size.height}px!important;`
      : 'height:auto!important; overflow:visible!important;';
  node.style.cssText = `${savedStyle}; position:fixed!important; left:-9999px!important; top:0!important; width:${size.width}px!important; ${heightCss}`;

  // Wait for visx ResizeObserver + React re-render
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  await new Promise<void>(r => setTimeout(r, 100));

  try {
    return await capture(node);
  } finally {
    node.style.cssText = savedStyle;
    if (parent) parent.style.minHeight = savedParentMinHeight;
    // Allow layout to settle after restore
    await new Promise<void>(r => requestAnimationFrame(() => r()));
  }
}

/**
 * Copy a chart card to clipboard as a PNG image, or download as PNG/SVG.
 * All exports temporarily resize the chart to fixed dimensions for
 * identical output from any view (dashboard card or focused).
 *
 * @param options.getBackgroundColor - Callback to determine background color at copy time.
 *   Defaults to dark theme (#0f172a).
 */
export function useChartCopy(options?: UseChartCopyOptions): UseChartCopyReturn {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const showFeedback = useCallback((chartName: string) => {
    setCopyFeedback(chartName);
    if (copyFeedbackTimeoutRef.current) {
      clearTimeout(copyFeedbackTimeoutRef.current);
    }
    copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const handleCopyChart = useCallback(
    async (containerId: string, chartName: string) => {
      const node = document.getElementById(containerId);
      if (!node) return;

      prepareForExport(node);
      try {
        const backgroundColor = options?.getBackgroundColor?.() ?? DEFAULT_BG;
        const { toBlob } = await import('html-to-image');
        const blob = await withFixedSize(node, chartName, async el => {
          return toBlob(el, { cacheBust: true, backgroundColor, pixelRatio: 2 });
        });
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showFeedback(chartName);
        }
      } catch (err) {
        console.error('Failed to copy chart', err);
      } finally {
        cleanupAfterExport(node);
      }
    },
    [options?.getBackgroundColor, showFeedback]
  );

  const handleDownloadPng = useCallback(
    async (containerId: string, chartName: string) => {
      const node = document.getElementById(containerId);
      if (!node) return;

      prepareForExport(node);
      try {
        const backgroundColor = options?.getBackgroundColor?.() ?? DEFAULT_BG;
        const { toPng } = await import('html-to-image');
        const dataUrl = await withFixedSize(node, chartName, async el => {
          return toPng(el, { cacheBust: true, backgroundColor, pixelRatio: 2 });
        });
        const link = document.createElement('a');
        link.download = `variscout-${chartName}-${dateStamp()}.png`;
        link.href = dataUrl;
        link.click();
        showFeedback(chartName);
      } catch (err) {
        console.error('Failed to download chart PNG', err);
      } finally {
        cleanupAfterExport(node);
      }
    },
    [options?.getBackgroundColor, showFeedback]
  );

  const handleDownloadSvg = useCallback(
    (containerId: string, chartName: string) => {
      const node = document.getElementById(containerId);
      if (!node) return;

      prepareForExport(node);
      try {
        const size = EXPORT_SIZES[chartName] ?? DEFAULT_EXPORT_SIZE;
        const svgElement = node.querySelector('svg');
        if (!svgElement) return;

        const clone = svgElement.cloneNode(true) as SVGSVGElement;
        clone.setAttribute('width', String(size.width));
        clone.setAttribute('height', String(size.height));
        clone.setAttribute(
          'viewBox',
          `0 0 ${svgElement.getBoundingClientRect().width} ${svgElement.getBoundingClientRect().height}`
        );

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `variscout-${chartName}-${dateStamp()}.svg`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        showFeedback(chartName);
      } finally {
        cleanupAfterExport(node);
      }
    },
    [showFeedback]
  );

  return { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg };
}
