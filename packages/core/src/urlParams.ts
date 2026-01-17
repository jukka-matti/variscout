/**
 * URL parameter utilities for shareable filter states
 *
 * Enables:
 * - Serializing drill filters to URL query parameters
 * - Parsing URL parameters back to filter objects
 * - Building shareable URLs with embedded filter state
 *
 * URL Format:
 * ?filter=Machine:A,B&filter=Shift:Day
 *
 * Multiple filters use multiple `filter` params.
 * Values within a filter are comma-separated.
 */

/**
 * Serialize filters to URLSearchParams
 *
 * @example
 * filtersToSearchParams({ Machine: ['A', 'B'], Shift: ['Day'] })
 * // Returns URLSearchParams with: filter=Machine:A,B&filter=Shift:Day
 */
export function filtersToSearchParams(
  filters: Record<string, (string | number)[]>
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [factor, values] of Object.entries(filters)) {
    if (!values || values.length === 0) continue;

    // Encode values - comma-separated, URL-encoded for special characters
    const encodedValues = values.map(v => encodeURIComponent(String(v))).join(',');
    const encodedFactor = encodeURIComponent(factor);

    // Format: factor:value1,value2
    params.append('filter', `${encodedFactor}:${encodedValues}`);
  }

  return params;
}

/**
 * Parse URLSearchParams back to a filters object
 *
 * @example
 * searchParamsToFilters(new URLSearchParams('filter=Machine:A,B&filter=Shift:Day'))
 * // Returns { Machine: ['A', 'B'], Shift: ['Day'] }
 */
export function searchParamsToFilters(params: URLSearchParams): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  // Get all filter params (can have multiple)
  const filterParams = params.getAll('filter');

  for (const param of filterParams) {
    // Split on first colon (factor:values)
    const colonIndex = param.indexOf(':');
    if (colonIndex === -1) continue;

    const factor = decodeURIComponent(param.slice(0, colonIndex));
    const valuesStr = param.slice(colonIndex + 1);

    if (!factor || !valuesStr) continue;

    // Split values by comma and decode each
    const values = valuesStr
      .split(',')
      .map(v => decodeURIComponent(v))
      .filter(v => v.length > 0);

    if (values.length > 0) {
      filters[factor] = values;
    }
  }

  return filters;
}

/**
 * Build a shareable URL with filters embedded
 *
 * @param baseUrl - The base URL (e.g., window.location.origin + pathname)
 * @param filters - The filters to embed
 * @returns Full URL string with filter params
 *
 * @example
 * buildShareableUrl('https://variscout.app/', { Machine: ['A'] })
 * // Returns 'https://variscout.app/?filter=Machine:A'
 */
export function buildShareableUrl(
  baseUrl: string,
  filters: Record<string, (string | number)[]>
): string {
  const url = new URL(baseUrl);

  // Remove existing filter params
  url.searchParams.delete('filter');

  // Add new filter params
  const filterParams = filtersToSearchParams(filters);
  for (const [key, value] of filterParams.entries()) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

/**
 * Update current URL with new filters (replaceState-friendly)
 * Preserves existing non-filter params like sample, embed, chart
 *
 * @param filters - The filters to set
 * @returns The new URL string
 */
export function updateUrlWithFilters(filters: Record<string, (string | number)[]>): string {
  const url = new URL(window.location.href);

  // Remove existing filter params
  url.searchParams.delete('filter');

  // Add new filter params
  const filterParams = filtersToSearchParams(filters);
  for (const [key, value] of filterParams.entries()) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

/**
 * Get current filters from browser URL
 * Safe to call in browser context
 */
export function getFiltersFromUrl(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  return searchParamsToFilters(new URLSearchParams(window.location.search));
}

/**
 * Check if we're in embed mode (should disable URL sync)
 */
export function isEmbedMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('embed') === 'true';
}
