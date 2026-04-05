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
 *
 * Features:
 * - Generic message typing for type-safe contracts
 * - localStorage hydration on mount (for initial state before channel is ready)
 * - Lifecycle messages (window-opened, window-closing) auto-sent
 * - Optional heartbeat interval
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
  /** localStorage key for initial hydration state (read on mount) */
  hydrationKey?: string;
  /** Heartbeat interval in ms — if provided, sends periodic heartbeat messages */
  heartbeatInterval?: number;
}

export interface UsePopoutChannelReturn<T extends PopoutMessage = PopoutMessage> {
  /** Send a message to other windows. Source is added automatically. */
  sendMessage: (msg: Omit<T, 'source'>) => void;
  /** The last received message (filtered by target), or null */
  lastMessage: T | null;
  /** Whether the BroadcastChannel is connected */
  isConnected: boolean;
  /** Initial state read from localStorage on mount (null if no hydrationKey or parse failed) */
  hydrationData: unknown | null;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_NAME = 'variscout-sync';

// ============================================================================
// Static helpers
// ============================================================================

/**
 * Write hydration data to localStorage for a popout window to read on mount.
 * Call this from the main window BEFORE opening the popup.
 */
export function writeHydrationData(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silently ignore (quota exceeded, private mode, etc.)
  }
}

/**
 * Read and parse hydration data from localStorage.
 * Returns null if key is missing or JSON.parse fails.
 */
function readHydrationData(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function usePopoutChannel<T extends PopoutMessage = PopoutMessage>(
  options: UsePopoutChannelOptions
): UsePopoutChannelReturn<T> {
  const { windowId, enabled = true, hydrationKey, heartbeatInterval } = options;

  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Read hydration data once on mount
  const [hydrationData] = useState<unknown | null>(() => {
    if (!hydrationKey) return null;
    return readHydrationData(hydrationKey);
  });

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

    const handleMessage = (event: MessageEvent<T>) => {
      try {
        const msg = event.data;
        if (!msg || typeof msg.type !== 'string' || typeof msg.source !== 'string') {
          return; // Ignore malformed messages
        }

        // Skip messages from ourselves
        if (msg.source === windowId) return;

        // Skip targeted messages not meant for us
        if (msg.target && msg.target !== windowId) return;

        setLastMessage(msg);
      } catch {
        // Ignore messages that fail validation
      }
    };

    channel.addEventListener('message', handleMessage);

    // Send lifecycle: window-opened
    try {
      channel.postMessage({ type: 'window-opened', source: windowId });
    } catch {
      // Channel may already be in error state
    }

    return () => {
      // Send lifecycle: window-closing (best-effort)
      try {
        channel.postMessage({ type: 'window-closing', source: windowId });
      } catch {
        // Ignore — channel may already be closed
      }

      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [windowId, enabled]);

  // Heartbeat interval
  useEffect(() => {
    if (!enabled || !heartbeatInterval || heartbeatInterval <= 0) {
      return;
    }

    const timer = setInterval(() => {
      const channel = channelRef.current;
      if (!channel) return;
      try {
        channel.postMessage({ type: 'heartbeat', source: windowId });
      } catch {
        // Ignore — channel may be closed
      }
    }, heartbeatInterval);

    return () => clearInterval(timer);
  }, [windowId, enabled, heartbeatInterval]);

  // Stable sendMessage callback
  const sendMessage = useCallback(
    (msg: Omit<T, 'source'>) => {
      const channel = channelRef.current;
      if (!channel) return;

      const fullMessage = {
        ...msg,
        source: windowId,
      } as T;

      try {
        channel.postMessage(fullMessage);
      } catch {
        // Channel may be closed or in an error state — silently ignore
      }
    },
    [windowId]
  );

  const isConnected = enabled && typeof BroadcastChannel !== 'undefined';
  return { sendMessage, lastMessage, isConnected, hydrationData };
}
