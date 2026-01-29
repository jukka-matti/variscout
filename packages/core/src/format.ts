/**
 * Formatting utilities for statistical display
 */

/**
 * Format p-value for display
 * Shows "< 0.001" for very small values, otherwise 3 decimal places
 */
export function formatPValue(p: number): string {
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}

/**
 * Get star rating display for strength indicators
 * @param rating - Current rating value
 * @param maxStars - Maximum number of stars (default: 5)
 * @returns String of filled (★) and empty (☆) stars
 */
export function getStars(rating: number, maxStars: number = 5): string {
  const filled = Math.min(Math.max(0, Math.floor(rating)), maxStars);
  return '★'.repeat(filled) + '☆'.repeat(maxStars - filled);
}
