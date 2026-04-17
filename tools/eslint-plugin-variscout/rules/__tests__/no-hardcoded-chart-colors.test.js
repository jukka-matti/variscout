import { RuleTester } from 'eslint';
import rule from '../no-hardcoded-chart-colors.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

ruleTester.run('no-hardcoded-chart-colors', rule, {
  valid: [
    // Use chartColors constant — not a bare hex literal
    { code: "import { chartColors } from './colors'; const c = chartColors.pass;" },
    // Comment-style string — contains '#' but full string is not JUST a hex color
    { code: "const comment = '# This is not a hex color';" },
    // URL fragment — full string is not JUST a hex color
    { code: "const url = 'https://example.com/#fragment';" },
    // JSX expression using color constant — not a string literal
    { code: "const el = <circle fill={chartColors.mean} />;", languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } } },
  ],
  invalid: [
    // Bare hex literal in variable assignment (6-char)
    {
      code: "const c = '#22c55e';",
      errors: [{ messageId: 'hardcoded' }],
    },
    // Array of hex literals — each one flagged
    {
      code: "const palette = ['#22c55e', '#ef4444', '#f59e0b'];",
      errors: [
        { messageId: 'hardcoded' },
        { messageId: 'hardcoded' },
        { messageId: 'hardcoded' },
      ],
    },
    // 3-char hex
    {
      code: "const c = '#000';",
      errors: [{ messageId: 'hardcoded' }],
    },
    // JSX string attribute
    {
      code: 'const el = <rect fill="#ef4444" />;',
      languageOptions: {
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      errors: [{ messageId: 'hardcoded' }],
    },
  ],
});
