import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Type for html-to-image toBlob function
 */
type ToBlobFn = (
  node: HTMLElement,
  options?: { cacheBust?: boolean; backgroundColor?: string }
) => Promise<Blob | null>;

export interface UseClipboardCopyOptions {
  /** Duration in ms to show success feedback (default: 2000) */
  feedbackDuration?: number;
  /** Background color for image capture (default: '#0f172a' - dark) */
  backgroundColor?: string;
  /**
   * Optional toBlob function from html-to-image.
   * If not provided, will attempt to dynamically import.
   */
  toBlob?: ToBlobFn;
}

export interface UseClipboardCopyReturn {
  /** ID of the chart that was just copied (for showing feedback) */
  copyFeedback: string | null;
  /** Copy a chart element to clipboard as PNG image */
  copyChart: (containerId: string, chartName: string) => Promise<void>;
  /** Check if a specific chart is currently showing feedback */
  isCopied: (chartName: string) => boolean;
}

/**
 * Hook for copying chart elements to clipboard as images.
 *
 * Uses html-to-image to capture chart containers as PNG blobs
 * and writes them to the clipboard. Provides feedback state
 * for showing success indicators.
 *
 * @param options - Configuration options
 * @returns Copy function and feedback state
 *
 * @example
 * ```tsx
 * import { toBlob } from 'html-to-image';
 *
 * const { copyChart, isCopied } = useClipboardCopy({ toBlob });
 *
 * <button onClick={() => copyChart('ichart-card', 'ichart')}>
 *   {isCopied('ichart') ? <Check /> : <Copy />}
 *   Copy
 * </button>
 * ```
 */
export function useClipboardCopy(options: UseClipboardCopyOptions = {}): UseClipboardCopyReturn {
  const { feedbackDuration = 2000, backgroundColor = '#0f172a', toBlob: providedToBlob } = options;

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const copyChart = useCallback(
    async (containerId: string, chartName: string) => {
      const node = document.getElementById(containerId);
      if (!node) {
        console.warn(`Chart container not found: ${containerId}`);
        return;
      }

      // Use provided toBlob function (apps must pass this from their html-to-image import)
      if (!providedToBlob) {
        console.warn(
          'useClipboardCopy: toBlob function not provided. Pass toBlob from html-to-image in options.'
        );
        return;
      }

      try {
        const blob = await providedToBlob(node, {
          cacheBust: true,
          backgroundColor,
        });

        if (blob) {
          // eslint-disable-next-line no-undef
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

          // Show success feedback
          setCopyFeedback(chartName);

          // Clear any existing timeout before setting a new one
          if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
          }
          feedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), feedbackDuration);
        }
      } catch (err) {
        console.error('Failed to copy chart:', err);
      }
    },
    [backgroundColor, feedbackDuration, providedToBlob]
  );

  const isCopied = useCallback((chartName: string) => copyFeedback === chartName, [copyFeedback]);

  return {
    copyFeedback,
    copyChart,
    isCopied,
  };
}

export default useClipboardCopy;
