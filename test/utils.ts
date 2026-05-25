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
  const hex = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split('')
        .map(c => c + c)
        .join('');
    if (h.length !== 6 && h.length !== 8) return color;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (h.length === 8) {
      const a = parseInt(h.slice(6, 8), 16) / 255;
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}
