/**
 * Shared test utilities that handle DOM-impl differences (jsdom vs happy-dom).
 */

/**
 * Normalize a CSS color value to canonical `rgb(r, g, b)` form.
 *
 * jsdom normalizes hex → `rgb()` on read; happy-dom preserves the source format.
 * Tests that read `element.style.color` need this to be DOM-impl-agnostic.
 */
export function normalizeColor(color: string): string {
  if (!color) return color;
  // Handles #rgb and #rrggbb hex — sufficient for current callers.
  // Add an rgba branch only when a caller needs alpha support.
  const hex = color.match(/^#([0-9a-f]{3,6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split('')
        .map(c => c + c)
        .join('');
    }
    if (h.length !== 6) return color;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}
