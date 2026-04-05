/** Map relationship strength (0-1) to a human-readable label */
export const strengthLabel = (s: number): string => {
  if (s >= 0.7) return 'Strong';
  if (s >= 0.3) return 'Moderate';
  return 'Weak';
};
