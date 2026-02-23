import { useState, useCallback, useRef, useEffect } from 'react';
import { toBlob } from 'html-to-image';

const DEFAULT_BG = '#0f172a';

export interface UseChartCopyOptions {
  /** Return background color for the screenshot. Called at copy time. */
  getBackgroundColor?: () => string;
}

export interface UseChartCopyReturn {
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
}

/**
 * Copy a chart card to clipboard as a PNG image.
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

  const handleCopyChart = useCallback(
    async (containerId: string, chartName: string) => {
      const node = document.getElementById(containerId);
      if (!node) return;

      try {
        const backgroundColor = options?.getBackgroundColor?.() ?? DEFAULT_BG;
        const blob = await toBlob(node, { cacheBust: true, backgroundColor });
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopyFeedback(chartName);
          if (copyFeedbackTimeoutRef.current) {
            clearTimeout(copyFeedbackTimeoutRef.current);
          }
          copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), 2000);
        }
      } catch (err) {
        console.error('Failed to copy chart', err);
      }
    },
    [options?.getBackgroundColor]
  );

  return { copyFeedback, handleCopyChart };
}
