import { RuleTester } from 'eslint';
import rule from '../no-interaction-moderator.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

ruleTester.run('no-interaction-moderator', rule, {
  valid: [
    // Preferred geometric terms — ordinal/disordinal
    {
      code: "const label = 'ordinal interaction';",
      filename: '/path/packages/core/src/stats/interactions.ts',
    },
    {
      code: "const p = 'disordinal';",
      filename: '/path/packages/core/src/stats/interactions.ts',
    },
    // Outside scoped paths — rule inactive, must NOT flag
    {
      code: "const role = 'primary factor';",
      filename: '/path/packages/ui/src/Button.tsx',
    },
    {
      code: "const key = 'primary key column';",
      filename: '/path/packages/core/src/db.ts',
    },
    {
      code: "const color = 'var(--primary)';",
      filename: '/path/apps/azure/src/theme.ts',
    },
  ],
  invalid: [
    // Plain string — moderator in stats path
    {
      code: "const label = 'moderator variable';",
      filename: '/path/packages/core/src/stats/interactions.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Plain string — primary in anova stats file
    {
      code: "const role = 'primary factor';",
      filename: '/path/packages/core/src/stats/anovaTypes.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Template literal — moderator in regression stats file
    {
      code: 'const t = `Factor X is the moderator`;',
      filename: '/path/packages/core/src/stats/regression.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Plain string — basename contains 'interaction' triggers scope
    {
      code: "const label = 'moderator variable';",
      filename: '/path/src/interactionHelpers.ts',
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
