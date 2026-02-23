/**
 * Shared mindmap export utilities (PNG + SVG)
 *
 * PNG: Used by PWA, Azure, and MindmapWindow popout
 * SVG: Azure-only (vector export for reports)
 */

import { toPng, toBlob } from 'html-to-image';

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

/**
 * Copy a mindmap DOM node to clipboard as a PNG image.
 *
 * @param node - The DOM element to capture (typically the mindmap container ref)
 * @returns true on success, false on failure
 */
export async function exportMindmapToClipboard(node: HTMLElement): Promise<boolean> {
  try {
    const blob = await toBlob(node, {
      cacheBust: true,
      backgroundColor: '#0f172a',
      pixelRatio: 2,
    });
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch (err) {
    console.error('Failed to copy mindmap to clipboard', err);
    return false;
  }
}

/**
 * Export the SVG element inside a DOM node as an .svg file.
 *
 * Finds the first <svg> child, serializes it via XMLSerializer,
 * and triggers a download.
 *
 * @param node - The DOM element containing the SVG (typically the mindmap container ref)
 * @param filename - Optional custom filename (default: investigation-YYYY-MM-DD.svg)
 */
export function exportMindmapSvg(node: HTMLElement, filename?: string): void {
  const svgElement = node.querySelector('svg');
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = filename ?? `investigation-${new Date().toISOString().split('T')[0]}.svg`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}
