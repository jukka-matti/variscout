/**
 * Shared mindmap PNG export utility
 *
 * Extracts the identical toPng() call used in:
 * - PWA MindmapPanel
 * - Azure MindmapPanel
 * - MindmapWindow (popout)
 */

import { toPng } from 'html-to-image';

/**
 * Export a DOM node as a PNG file with consistent settings.
 *
 * @param node - The DOM element to capture (typically the mindmap container ref)
 * @param filename - Optional custom filename (default: investigation-YYYY-MM-DD.png)
 */
export async function exportMindmapPng(node: HTMLElement, filename?: string): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    backgroundColor: '#0f172a',
    pixelRatio: 2,
  });
  const link = document.createElement('a');
  link.download = filename ?? `investigation-${new Date().toISOString().split('T')[0]}.png`;
  link.href = dataUrl;
  link.click();
}
