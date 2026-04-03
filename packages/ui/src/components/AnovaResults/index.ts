export { default as AnovaResults, type AnovaResultsProps } from './AnovaResults';

/**
 * @deprecated Color scheme is no longer used — component uses semantic Tailwind classes directly.
 * Kept for backward compatibility.
 */
export type AnovaResultsColorScheme = Record<string, string>;
export const anovaDefaultColorScheme: AnovaResultsColorScheme = {};
