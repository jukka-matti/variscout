/**
 * usePopoutChannel — BroadcastChannel-based cross-window sync for pop-out windows.
 *
 * Enables communication between the main VariScout window and pop-out
 * windows (evidence map, findings board, etc.) using the BroadcastChannel API.
 *
 * Messages are filtered by target: if a message has a `target` field that
 * doesn't match our `windowId`, it is silently ignored.
 *
 * Falls back to no-op when BroadcastChannel is not available (e.g., older browsers,
 * non-secure contexts).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/** A message sent between VariScout windows via BroadcastChannel. */
export interface PopoutMessage {
  /** Message type (e.g., 'highlight-factor', 'sync-filter', 'selection-changed') */
  type: string;
  /** Window ID of the sender */
  source: string;
  /** Optional target window ID — if set, only that window processes the message */
  target?: string;
  /** Arbitrary payload data */
  payload?: unknown;
}

export interface UsePopoutChannelOptions {
  /** Unique window identifier (e.g., 'main', 'evidence-map', 'findings') */
  windowId: string;
  /** Whether the channel is active (default: true) */
  enabled?: boolean;
}

export interface UsePopoutChannelReturn {
  /** Send a message to other windows. Source is added automatically. */
  sendMessage: (msg: Omit<PopoutMessage, 'source'>) => void;
  /** The last received message (filtered by target), or null */
  lastMessage: PopoutMessage | null;
  /** Whether the BroadcastChannel is connected */
  isConnected: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_NAME = 'variscout-sync';

// ============================================================================
// Hook
// ============================================================================

export function usePopoutChannel(options: UsePopoutChannelOptions): UsePopoutChannelReturn {
  const { windowId, enabled = true } = options;

  const [lastMessage, setLastMessage] = useState<PopoutMessage | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Set up and tear down the BroadcastChannel
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Check for BroadcastChannel support
    if (typeof BroadcastChannel === 'undefined') {
      if (import.meta.env?.DEV) {
        console.warn(
          '[usePopoutChannel] BroadcastChannel not available — cross-window sync disabled.'
        );
      }
      return;
    }

    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      // BroadcastChannel constructor can throw in some restricted contexts
      return;
    }

    channelRef.current = channel;

    const handleMessage = (event: MessageEvent<PopoutMessage>) => {
      const msg = event.data;
      if (!msg || typeof msg.type !== 'string' || typeof msg.source !== 'string') {
        return; // Ignore malformed messages
      }

      // Skip messages from ourselves
      if (msg.source === windowId) return;

      // Skip targeted messages not meant for us
      if (msg.target && msg.target !== windowId) return;

      setLastMessage(msg);
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [windowId, enabled]);

  // Stable sendMessage callback
  const sendMessage = useCallback(
    (msg: Omit<PopoutMessage, 'source'>) => {
      const channel = channelRef.current;
      if (!channel) return;

      const fullMessage: PopoutMessage = {
        ...msg,
        source: windowId,
      };

      try {
        channel.postMessage(fullMessage);
      } catch {
        // Channel may be closed or in an error state — silently ignore
      }
    },
    [windowId]
  );

  const isConnected = enabled && typeof BroadcastChannel !== 'undefined';
  return { sendMessage, lastMessage, isConnected };
}
