/**
 * useFilePicker — OneDrive File Picker v8 integration hook.
 *
 * ADR-030: Unified file/folder picker for KB scope, data import,
 * project open/save, and local file browsing.
 *
 * Opens SharePoint-hosted picker popup at /_layouts/15/FilePicker.aspx,
 * communicates via postMessage + MessagePort using the official
 * command/acknowledge/result protocol.
 *
 * Standard plan users get local file browsing only.
 * Team/Team AI users get SharePoint + OneDrive + local browsing.
 *
 * @see https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/
 * @see https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/v8-schema
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { hasTeamFeatures } from '@variscout/core';
import { getGraphToken, getTokenForResource } from '../auth/graphToken';
import { getCachedChannelFolderUrl } from '../services/channelDrive';

// ── Types ──────────────────────────────────────────────────────────────

export type PickerMode = 'files' | 'folders';

export interface FilePickerOptions {
  mode: PickerMode;
  /** File extension filters (e.g., ['.csv', '.xlsx']) */
  filters?: string[];
  /** Allow browsing local device files */
  allowLocalBrowse?: boolean;
  /** Custom button label for the pick action */
  pickLabel?: string;
  /** Starting SharePoint location */
  entryPath?: { web?: string; list?: string; folder?: string };
  /** Starting OneDrive location */
  entryOneDrive?: { folder?: string };
  /** Show only SharePoint (no OneDrive pivot) */
  sharePointOnly?: boolean;
  /** Callback when item(s) are picked */
  onPick?: (items: FilePickerResult[]) => void;
  /**
   * Enable Save As mode — shows a filename input in the picker tray.
   * Only meaningful when mode is 'folders'.
   */
  saveAs?: { fileName?: string };
}

export interface FilePickerResult {
  id: string;
  parentReference: { driveId: string };
  '@sharePoint.endpoint': string;
  webUrl?: string;
  name?: string;
}

export interface UseFilePickerReturn {
  /** Open the picker popup */
  open: () => Promise<void>;
  /** Whether the picker is currently open */
  isOpen: boolean;
  /** Whether SharePoint browsing is available (depends on plan) */
  hasCloudAccess: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getSharePointBaseUrl(): string | null {
  const channelUrl = getCachedChannelFolderUrl();
  if (!channelUrl) return null;
  try {
    const url = new URL(channelUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function isDarkMode(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useFilePicker(options: FilePickerOptions): UseFilePickerReturn {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const portRef = useRef<MessagePort | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cloudAccess = hasTeamFeatures();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const open = useCallback(async () => {
    if (isOpen) return;

    const spBase = getSharePointBaseUrl();
    if (!cloudAccess || !spBase) {
      console.warn('[FilePicker] SharePoint not available');
      return;
    }

    setIsOpen(true);

    try {
      const token = await getGraphToken();
      const opts = optionsRef.current;
      const channelId = `variscout-picker-${Date.now()}`;

      // ── Build picker configuration (v8 schema) ─────────────────────
      const pickerConfig: Record<string, unknown> = {
        sdk: '8.0',
        // Required: enables the picker to request auth tokens from us
        authentication: {},
        messaging: {
          origin: window.location.origin,
          channelId,
        },
        theme: isDarkMode() ? 'dark' : 'default',
        typesAndSources: {
          mode: opts.mode === 'folders' ? 'folders' : 'files',
          pivots: {
            oneDrive: !opts.sharePointOnly,
            recent: opts.mode !== 'folders',
          },
        },
        commands: {
          pick: {
            label: opts.pickLabel || (opts.mode === 'folders' ? 'Select Folder' : 'Select'),
          },
          close: {},
          browseThisDevice: { enabled: opts.allowLocalBrowse !== false },
        },
      };

      // File type filters
      if (opts.filters && opts.filters.length > 0 && opts.mode === 'files') {
        (pickerConfig.typesAndSources as Record<string, unknown>).filters = opts.filters.map(
          ext => ext
        );
      }

      // Save As tray mode (for "Save Here" use case)
      if (opts.saveAs) {
        pickerConfig.tray = {
          prompt: 'save-as',
          saveAs: { fileName: opts.saveAs.fileName ?? '' },
        };
      }

      // Entry point
      if (opts.entryPath?.web) {
        pickerConfig.entry = {
          sharePoint: {
            byPath: {
              web: opts.entryPath.web,
              ...(opts.entryPath.list ? { list: opts.entryPath.list } : {}),
              ...(opts.entryPath.folder ? { folder: opts.entryPath.folder } : {}),
            },
          },
        };
      } else if (opts.entryOneDrive) {
        pickerConfig.entry = {
          oneDrive: {
            files: opts.entryOneDrive.folder ? { folder: opts.entryOneDrive.folder } : {},
          },
        };
      }

      // ── Open popup window ──────────────────────────────────────────
      // Recommended max: 1080x680, min: 250x230
      const width = 1080;
      const height = 680;
      const left = Math.round((screen.width - width) / 2);
      const top = Math.round((screen.height - height) / 2);

      const popup = window.open(
        '',
        'FilePickerPopup',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );
      if (!popup) {
        console.error('[FilePicker] Popup blocked by browser');
        setIsOpen(false);
        return;
      }

      popupRef.current = popup;

      // ── POST config + token to FilePicker.aspx ─────────────────────
      const queryString = new URLSearchParams({
        filePicker: JSON.stringify(pickerConfig),
      });
      const pickerUrl = `${spBase}/_layouts/15/FilePicker.aspx?${queryString}`;

      const form = popup.document.createElement('form');
      form.setAttribute('action', pickerUrl);
      form.setAttribute('method', 'POST');

      const tokenInput = popup.document.createElement('input');
      tokenInput.setAttribute('type', 'hidden');
      tokenInput.setAttribute('name', 'access_token');
      tokenInput.setAttribute('value', token);
      form.appendChild(tokenInput);

      popup.document.body.appendChild(form);
      form.submit();

      // ── Establish postMessage channel ──────────────────────────────
      // The picker sends an 'initialize' message when ready.
      // We respond by creating a MessageChannel and sending 'activate'.
      // All subsequent communication uses the MessagePort.
      let port: MessagePort | null = null;
      let pollInterval: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        window.removeEventListener('message', handleWindowMessage);
        port?.close();
        portRef.current = null;
        if (pollInterval) clearInterval(pollInterval);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        popupRef.current = null;
        cleanupRef.current = null;
        setIsOpen(false);
      };
      cleanupRef.current = cleanup;

      const handleWindowMessage = (event: MessageEvent) => {
        if (event.source !== popup) return;

        const message = event.data;
        if (message?.type === 'initialize' && message.channelId === channelId) {
          // Create MessageChannel for bidirectional communication
          const mc = new MessageChannel();
          port = mc.port1;
          portRef.current = port;

          port.addEventListener('message', handlePortMessage);
          port.start();

          // Tell the picker we're ready
          port.postMessage({ type: 'activate' });
        }
      };

      // ── Handle commands from the picker via MessagePort ────────────
      // Protocol: picker sends { type: "command", id, data: { command, ... } }
      // Host must reply with { type: "acknowledge", id } immediately,
      // then { type: "result", id, data } for the actual response.
      const handlePortMessage = async (event: MessageEvent) => {
        const payload = event.data;

        if (payload.type === 'notification') {
          // Notifications are informational, no response needed
          return;
        }

        if (payload.type !== 'command') return;

        const messageId = payload.id;
        const command = payload.data;

        // Always acknowledge immediately
        port?.postMessage({ type: 'acknowledge', id: messageId });

        switch (command.command) {
          case 'authenticate': {
            // The picker requests a token for a specific resource.
            // command.type is 'SharePoint' or 'Graph'.
            // command.resource is the resource URL (e.g., SharePoint site).
            try {
              let authToken: string;
              if (command.type === 'SharePoint' && command.resource) {
                authToken = await getTokenForResource(command.resource);
              } else {
                authToken = await getGraphToken();
              }
              port?.postMessage({
                type: 'result',
                id: messageId,
                data: { result: 'token', token: authToken },
              });
            } catch (err) {
              console.warn('[FilePicker] Token acquisition failed:', err);
              port?.postMessage({
                type: 'result',
                id: messageId,
                data: {
                  result: 'error',
                  error: {
                    code: 'unableToObtainToken',
                    message: err instanceof Error ? err.message : 'Token acquisition failed',
                  },
                },
              });
            }
            break;
          }

          case 'pick': {
            // User selected items. command.items contains the picked items.
            const items: FilePickerResult[] = (command.items ?? []).map(
              (item: Record<string, unknown>) => ({
                id: item.id as string,
                parentReference: item.parentReference as { driveId: string },
                '@sharePoint.endpoint': item['@sharePoint.endpoint'] as string,
                webUrl: item.webUrl as string | undefined,
                name: item.name as string | undefined,
              })
            );

            // Acknowledge the pick was handled
            port?.postMessage({
              type: 'result',
              id: messageId,
              data: { result: 'success' },
            });

            optionsRef.current.onPick?.(items);
            cleanup();
            break;
          }

          case 'close': {
            cleanup();
            break;
          }

          default: {
            // Unknown command — reply with unsupported error
            port?.postMessage({
              type: 'result',
              id: messageId,
              data: {
                result: 'error',
                error: { code: 'unsupportedCommand', message: command.command },
              },
            });
            break;
          }
        }
      };

      // Monitor popup close (user clicked browser X button)
      pollInterval = setInterval(() => {
        if (popup.closed) {
          cleanup();
        }
      }, 500);

      window.addEventListener('message', handleWindowMessage);
    } catch (err) {
      console.error('[FilePicker] Failed to open:', err);
      setIsOpen(false);
    }
  }, [isOpen, cloudAccess]);

  return { open, isOpen, hasCloudAccess: cloudAccess };
}
