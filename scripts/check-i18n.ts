/**
 * Build-time i18n validation script for VariScout.
 *
 * Checks:
 * 1. Placeholder consistency — {param} placeholders must match English
 * 2. Untranslated detection — values identical to English (warn only)
 * 3. Summary report per locale
 *
 * Usage: npx tsx scripts/check-i18n.ts
 *
 * Exit codes:
 *   0 — all checks pass (untranslated warnings are informational)
 *   1 — placeholder mismatches found (hard error)
 */

import { LOCALES, getMessages } from '../packages/core/src/i18n/index.js';
import type { MessageCatalog } from '../packages/core/src/i18n/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract {param} placeholders from a string */
function extractPlaceholders(value: string): string[] {
  const matches = value.match(/\{[a-zA-Z_]+\}/g);
  return matches ? matches.sort() : [];
}

// ── Main ─────────────────────────────────────────────────────────────────────

const enMessages = getMessages('en');
const enKeys = Object.keys(enMessages) as (keyof MessageCatalog)[];

interface LocaleReport {
  locale: string;
  placeholderErrors: string[];
  untranslated: string[];
}

const reports: LocaleReport[] = [];
let hasErrors = false;

for (const locale of LOCALES) {
  if (locale === 'en') continue;

  const messages = getMessages(locale);
  const report: LocaleReport = {
    locale,
    placeholderErrors: [],
    untranslated: [],
  };

  for (const key of enKeys) {
    const enValue = enMessages[key];
    const localeValue = messages[key];

    // Check placeholder consistency
    const enPlaceholders = extractPlaceholders(enValue);
    const localePlaceholders = extractPlaceholders(localeValue);

    if (enPlaceholders.join(',') !== localePlaceholders.join(',')) {
      report.placeholderErrors.push(
        `  ${key}: expected ${JSON.stringify(enPlaceholders)}, got ${JSON.stringify(localePlaceholders)}`
      );
    }

    // Check for untranslated values (identical to English)
    // Skip very short values (abbreviations like "Q1", "Min", etc.)
    if (localeValue === enValue && enValue.length > 3) {
      report.untranslated.push(key);
    }
  }

  if (report.placeholderErrors.length > 0) {
    hasErrors = true;
  }

  reports.push(report);
}

// ── Output ───────────────────────────────────────────────────────────────────

console.log('\n=== VariScout i18n Validation ===\n');
console.log(`Reference locale: en (${enKeys.length} keys)\n`);

// Summary table header
const col = { locale: 8, errors: 12, warnings: 14 };
console.log(
  'Locale'.padEnd(col.locale) + 'Errors'.padEnd(col.errors) + 'Untranslated'.padEnd(col.warnings)
);
console.log('-'.repeat(col.locale + col.errors + col.warnings));

for (const r of reports) {
  const errStr = r.placeholderErrors.length > 0 ? `${r.placeholderErrors.length}` : '0';
  const warnStr = r.untranslated.length > 0 ? `${r.untranslated.length}` : '0';

  const marker =
    r.placeholderErrors.length > 0 ? ' FAIL' : r.untranslated.length > 0 ? ' warn' : ' ok';

  console.log(
    r.locale.padEnd(col.locale) + errStr.padEnd(col.errors) + warnStr.padEnd(col.warnings) + marker
  );
}

// Detail sections
for (const r of reports) {
  if (r.placeholderErrors.length > 0) {
    console.log(`\n[ERROR] ${r.locale} — placeholder mismatches:`);
    for (const err of r.placeholderErrors) {
      console.log(err);
    }
  }
}

let totalUntranslated = 0;
for (const r of reports) {
  totalUntranslated += r.untranslated.length;
}

if (totalUntranslated > 0) {
  console.log(
    `\n[WARN] ${totalUntranslated} untranslated values across ${reports.filter(r => r.untranslated.length > 0).length} locales (identical to English, >3 chars)`
  );
}

const totalErrors = reports.reduce((sum, r) => sum + r.placeholderErrors.length, 0);

if (hasErrors) {
  console.log(`\nFAILED: ${totalErrors} placeholder error(s) found.\n`);
  process.exit(1);
} else {
  console.log(`\nPASSED: All placeholder checks OK.\n`);
  process.exit(0);
}
