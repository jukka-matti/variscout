import { RuleTester } from 'eslint';
import rule from '../no-root-cause-language.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

ruleTester.run('no-root-cause-language', rule, {
  valid: [
    // Preferred phrasing — 'contribution'
    { code: "const msg = 'Likely contribution: factor A';" },
    // 'cause' without 'root' prefix is fine
    { code: "const safe = 'cause-and-effect analysis';" },
    // Generic contributing factor language
    { code: "const ok = 'Major contributing factor';" },
    // Identifier names are NOT flagged (only string values)
    { code: 'const rootCauseLabel = 42;' },
    // Object key as identifier — not a string value
    { code: 'const obj = { rootCause: true };' },
  ],
  invalid: [
    // Plain string — "Root Cause Analysis"
    {
      code: "const label = 'Root Cause Analysis';",
      errors: [{ messageId: 'forbidden' }],
    },
    // Hyphenated variant
    {
      code: "const msg = 'The root-cause is unknown';",
      errors: [{ messageId: 'forbidden' }],
    },
    // Template literal with quasi containing root_cause
    {
      code: 'const t = `Identify the root_cause of the variation`;',
      errors: [{ messageId: 'forbidden' }],
    },
    // Object property value is a Literal
    {
      code: 'const map = { heading: "Root Cause" };',
      errors: [{ messageId: 'forbidden' }],
    },
    // Case-insensitive — all caps
    {
      code: "const s = 'ROOT CAUSE';",
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
