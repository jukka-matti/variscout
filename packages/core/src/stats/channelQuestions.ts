/**
 * Channel ranking question generation for Performance mode.
 *
 * Generates investigation questions from channel Cpk rankings, ranked by
 * worst Cpk first (most in need of investigation). Channels that already
 * exceed the excellence threshold (Cpk > 1.67) are auto-answered as
 * 'ruled-out' so analysts can focus on underperforming channels.
 *
 * Used by useQuestionGeneration when mode === 'performance'.
 */

import type { GeneratedQuestion } from './bestSubsets';

// ============================================================================
// Types
// ============================================================================

/**
 * Channel capability input for question generation.
 */
export interface ChannelInput {
  /** Channel name (e.g., "Head 1", "Cavity A") */
  name: string;
  /** Process capability index for this channel */
  cpk: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Cpk threshold above which a channel is considered excellent and auto-ruled-out.
 * Cpk > 1.67 corresponds to a Six Sigma process (≥ 5σ capability).
 */
export const CPK_EXCELLENT = 1.67;

// ============================================================================
// Generator
// ============================================================================

/**
 * Generate investigation questions from channel Cpk rankings.
 *
 * Channels are sorted worst-first (lowest Cpk) so the most critical
 * channels appear at the top of the question list. Channels that already
 * exceed CPK_EXCELLENT are auto-answered as 'ruled-out'.
 *
 * The rSquaredAdj field carries the channel's Cpk as evidence strength —
 * following the same convention as factorEffects.ts which stores eta²
 * and deltaR² in that field.
 *
 * @param channels - Array of channel capability inputs
 * @returns Generated questions sorted by worst Cpk first
 *
 * @example
 * const questions = generateChannelRankingQuestions([
 *   { name: 'Head 1', cpk: 0.85 },
 *   { name: 'Head 2', cpk: 1.92 },
 * ]);
 * // questions[0].text === 'Why does Head 1 have Cpk=0.85?'
 * // questions[1].autoAnswered === true (ruled-out)
 */
export function generateChannelRankingQuestions(channels: ChannelInput[]): GeneratedQuestion[] {
  if (channels.length === 0) return [];

  return [...channels]
    .sort((a, b) => a.cpk - b.cpk) // worst Cpk first
    .map(ch => {
      const isExcellent = ch.cpk > CPK_EXCELLENT;
      return {
        text: `Why does ${ch.name} have Cpk=${ch.cpk.toFixed(2)}?`,
        factors: [ch.name],
        rSquaredAdj: ch.cpk, // Cpk as evidence strength (analogous to R²adj usage in factorEffects.ts)
        autoAnswered: isExcellent,
        ...(isExcellent ? { autoStatus: 'ruled-out' as const } : {}),
        source: 'factor-intel' as const,
        type: 'single-factor' as const,
      };
    });
}
