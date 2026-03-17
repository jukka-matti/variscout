/**
 * Shared prompt utilities — used across all AI prompt domains.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 */

import type { Locale } from '../../i18n/types';
import { LOCALE_NAMES } from '../../i18n/types';

/**
 * Terminology enforcement instruction appended to all AI system prompts.
 * Ensures consistent domain language across narration, CoScout, and chart insights.
 * See docs/05-technical/architecture/aix-design-system.md §1.2
 */
export const TERMINOLOGY_INSTRUCTION = `Terminology rules — always use VariScout terms:
- Say "Contribution %" not "eta squared" or "effect size".
- Say "Progressive stratification" not "drill-down".
- Say "Voice of the Process" not "control limits" and "Voice of the Customer" not "spec limits" or "specification limits".
- Say "characteristic" not "measurement" or "variable".`;

/**
 * Build a locale hint to prepend to system prompts.
 * Returns empty string for English or undefined locale.
 */
export function buildLocaleHint(locale?: Locale): string {
  if (!locale || locale === 'en') return '';
  return `LANGUAGE: Respond in ${LOCALE_NAMES[locale]}. Use the provided terminology definitions in that language when available.`;
}
