import { useState, useEffect, useCallback, useRef } from 'react';

// Chart IDs that can be highlighted
export type ChartId = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';

// Highlight intensity/style
export type HighlightIntensity = 'pulse' | 'glow' | 'border';

// Message types sent FROM website TO PWA
export interface EmbedMessage {
  type: 'variscout-embed';
  action: 'highlight-chart' | 'clear-highlight' | 'ping' | 'scroll-to-chart';
  payload?: {
    chartId?: ChartId;
    intensity?: HighlightIntensity;
  };
  messageId: string;
}

// Message types sent FROM PWA TO website
export interface EmbedResponse {
  type: 'variscout-embed-response';
  action: 'ready' | 'pong' | 'chart-clicked' | 'state-update' | 'highlight-applied';
  payload?: {
    chartId?: ChartId;
    success?: boolean;
  };
  messageId?: string;
}

// Hook state returned to component
export interface EmbedMessagingState {
  highlightedChart: ChartId | null;
  highlightIntensity: HighlightIntensity;
  isReady: boolean;
}

// Validate message is from allowed origin (same origin or parent)
function isValidOrigin(origin: string): boolean {
  // In embed mode, accept messages from same origin or parent window
  // For development, we also accept localhost
  const allowedPatterns = [
    window.location.origin,
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/variscout\.com$/,
    /^https?:\/\/(www\.)?variscout\.com$/,
    /^https?:\/\/.*\.variscout\.com$/,
  ];

  return allowedPatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return origin === pattern;
    }
    return pattern.test(origin);
  });
}

// Type guard for EmbedMessage
function isEmbedMessage(data: unknown): data is EmbedMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === 'variscout-embed' &&
    typeof msg.action === 'string' &&
    typeof msg.messageId === 'string'
  );
}

/**
 * Hook for handling postMessage communication in embed mode.
 * Listens for messages from parent window and manages chart highlighting.
 *
 * @param isEmbedMode - Whether the app is in embed mode
 * @returns EmbedMessagingState with highlight info and helper methods
 */
export function useEmbedMessaging(isEmbedMode: boolean) {
  const [highlightedChart, setHighlightedChart] = useState<ChartId | null>(null);
  const [highlightIntensity, setHighlightIntensity] = useState<HighlightIntensity>('pulse');
  const [isReady, setIsReady] = useState(false);
  const parentOriginRef = useRef<string | null>(null);

  // Send message to parent window
  const sendToParent = useCallback(
    (message: EmbedResponse) => {
      if (!isEmbedMode || !window.parent || window.parent === window) {
        return;
      }

      try {
        // Send to parent window
        window.parent.postMessage(message, '*');
      } catch (err) {
        console.error('[EmbedMessaging] Failed to send message:', err);
      }
    },
    [isEmbedMode]
  );

  // Notify parent that chart was clicked (for bidirectional sync)
  const notifyChartClicked = useCallback(
    (chartId: ChartId) => {
      sendToParent({
        type: 'variscout-embed-response',
        action: 'chart-clicked',
        payload: { chartId },
      });
    },
    [sendToParent]
  );

  // Clear highlight programmatically
  const clearHighlight = useCallback(() => {
    setHighlightedChart(null);
  }, []);

  // Handle incoming messages
  useEffect(() => {
    if (!isEmbedMode) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (!isValidOrigin(event.origin)) {
        console.warn('[EmbedMessaging] Rejected message from:', event.origin);
        return;
      }

      // Store parent origin for responses
      if (!parentOriginRef.current) {
        parentOriginRef.current = event.origin;
      }

      // Validate message structure
      if (!isEmbedMessage(event.data)) {
        return; // Not a VaRiScout embed message, ignore
      }

      const message = event.data;

      switch (message.action) {
        case 'ping':
          // Respond with pong to confirm iframe is ready
          sendToParent({
            type: 'variscout-embed-response',
            action: 'pong',
            messageId: message.messageId,
          });
          break;

        case 'highlight-chart':
          if (message.payload?.chartId) {
            setHighlightedChart(message.payload.chartId);
            setHighlightIntensity(message.payload.intensity || 'pulse');
            sendToParent({
              type: 'variscout-embed-response',
              action: 'highlight-applied',
              payload: {
                chartId: message.payload.chartId,
                success: true,
              },
              messageId: message.messageId,
            });
          }
          break;

        case 'clear-highlight':
          setHighlightedChart(null);
          sendToParent({
            type: 'variscout-embed-response',
            action: 'highlight-applied',
            payload: { success: true },
            messageId: message.messageId,
          });
          break;

        case 'scroll-to-chart':
          // Scroll the specified chart into view
          if (message.payload?.chartId) {
            const chartElement = document.querySelector(
              `[data-chart-id="${message.payload.chartId}"]`
            );
            if (chartElement) {
              chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
          break;

        default:
          console.warn('[EmbedMessaging] Unknown action:', message.action);
      }
    };

    // Add listener
    window.addEventListener('message', handleMessage);

    // Send ready message to parent
    setIsReady(true);
    sendToParent({
      type: 'variscout-embed-response',
      action: 'ready',
    });

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isEmbedMode, sendToParent]);

  // Handle Escape key to clear highlights
  useEffect(() => {
    if (!isEmbedMode || !highlightedChart) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearHighlight();
        sendToParent({
          type: 'variscout-embed-response',
          action: 'highlight-applied',
          payload: { success: true },
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEmbedMode, highlightedChart, clearHighlight, sendToParent]);

  return {
    highlightedChart,
    highlightIntensity,
    isReady,
    clearHighlight,
    notifyChartClicked,
  };
}
