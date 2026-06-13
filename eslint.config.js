import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import variscoutPlugin from 'eslint-plugin-variscout';

// Test globals (Vitest)
const testGlobals = {
  describe: 'readonly',
  it: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  vi: 'readonly',
};

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.config.js', '**/*.config.ts'],
  },
  // React Compiler validation rules (from eslint-plugin-react-hooks v7+)
  // recommended-latest includes purity, immutability, refs, static-components etc.
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/src/**/*.{ts,tsx}', 'apps/*/e2e/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // React Compiler rules — warn for now, upgrade to error incrementally
      // These rules validate React Compiler compatibility (purity, refs, memoization)
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/globals': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': 'off', // Let TypeScript handle this
    },
  },
  // Test files configuration (browser environment — most tests)
  {
    files: ['**/src/**/*.test.{ts,tsx}', '**/src/**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...testGlobals,
      },
    },
  },
  // Node.js test files — integration tests that run in the Node environment
  // (marked with // @vitest-environment node, e.g. server integration tests)
  {
    files: ['**/src/**/__tests__/**/*.integration.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...testGlobals,
      },
    },
  },
  // TypeScript tooling scripts run in Node and must be parsed as TypeScript.
  {
    files: ['scripts/**/*.ts', 'packages/*/scripts/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  // Package-level boundary rules (ADR-045: DDD-Lite + FSD)
  // Prevents circular dependencies and upward imports in the monorepo.
  // Uses eslint-plugin-boundaries v6 with object-based selector syntax.
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'core', pattern: 'packages/core/src/**' },
        { type: 'charts', pattern: 'packages/charts/src/**' },
        { type: 'hooks', pattern: 'packages/hooks/src/**' },
        { type: 'ui', pattern: 'packages/ui/src/**' },
        { type: 'data', pattern: 'packages/data/src/**' },
        { type: 'stores', pattern: 'packages/stores/src/**' },
        { type: 'pwa', pattern: 'apps/pwa/src/**' },
        { type: 'website', pattern: 'apps/website/src/**' },
        { type: 'docs', pattern: 'apps/docs/src/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          // Allowlist pattern: everything is forbidden unless explicitly permitted.
          // Adding a new internal dependency requires a deliberate allow rule here.
          default: 'disallow',
          rules: [
            // Ratified graph:
            // core → nothing (no internal package imports allowed)
            // data/charts/stores → core
            { from: { type: 'charts' }, allow: { to: { type: ['core'] } } },
            { from: { type: 'data' }, allow: { to: { type: ['core'] } } },
            { from: { type: 'stores' }, allow: { to: { type: ['core'] } } },
            // hooks → core, data, stores
            { from: { type: 'hooks' }, allow: { to: { type: ['core', 'data', 'stores'] } } },
            // ui → core, charts, hooks, stores
            // ui → stores is the documented exception for shared state selectors/actions.
            { from: { type: 'ui' }, allow: { to: { type: ['core', 'charts', 'hooks', 'stores'] } } },
            // pwa → core, charts, hooks, ui, data, stores
            { from: { type: 'pwa' }, allow: { to: { type: ['core', 'charts', 'hooks', 'ui', 'data', 'stores'] } } },
            // website → core, charts, ui, data (manifest has no stores dependency)
            { from: { type: 'website' }, allow: { to: { type: ['core', 'charts', 'ui', 'data'] } } },
            // docs → no source imports from internal packages
          ],
        },
      ],
    },
  },
  // Boundary 3: prevent unguarded .toFixed() on statistical values (ADR-069)
  {
    files: ['packages/**/*.{ts,tsx}', 'apps/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**/*',
      'packages/charts/src/colors.ts',
    ],
    plugins: { variscout: variscoutPlugin },
    rules: {
      'variscout/no-tofixed-on-stats': 'error',
    },
  },
  // Hard rule: never hardcode hex colors in chart packages — use chartColors/chromeColors
  {
    files: ['packages/charts/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**/*',
    ],
    plugins: { variscout: variscoutPlugin },
    rules: {
      'variscout/no-hardcoded-chart-colors': 'error',
    },
  },
  // Exempt the colors source file itself (defines the constants)
  {
    files: ['packages/charts/src/colors.ts'],
    rules: {
      'variscout/no-hardcoded-chart-colors': 'off',
    },
  },
  // Hard rule: never use 'root cause' in user-facing strings or AI prompts — use 'contribution' (P5)
  {
    files: [
      'packages/core/src/i18n/**/*.ts',
      'packages/core/src/ai/prompts/**/*.ts',
    ],
    plugins: { variscout: variscoutPlugin },
    rules: {
      'variscout/no-root-cause-language': 'error',
    },
  },
  // Hard rule: never use 'moderator'/'primary' role labels in interaction/regression/ANOVA code
  // Use geometric terms: ordinal / disordinal (feedback memory: interaction language)
  {
    files: [
      'packages/core/src/stats/**/*.ts',
      'packages/core/src/**/interaction*.ts',
      'packages/core/src/**/regression*.ts',
      'packages/core/src/**/anova*.ts',
    ],
    plugins: { variscout: variscoutPlugin },
    rules: {
      'variscout/no-interaction-moderator': 'error',
    },
  },
  // Hard rule: never Math.random() in tests — tests must be deterministic.
  // Use mulberry32(seed) from packages/core/src/__tests__/helpers/stressDataGenerator.ts
  // (or copy the 9-line helper inline). See .claude/rules/testing.md.
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Tests must be deterministic — use mulberry32(seed) from packages/core/src/__tests__/helpers/stressDataGenerator.ts instead of Math.random().',
        },
      ],
    },
  },
  // Persistence boundary guard (F1+F2 P7.2, audit R12):
  // Domain stores and non-persistence app code must not import `dexie` directly.
  // Persistence access is via @variscout/core HubRepository (pwaHubRepository
  // .dispatch). Exception: documented R12 (canvasViewportStore separate DB).
  // Also blocks direct `db` imports from app db/schema modules (same policy).
  {
    files: ['packages/stores/**/*.ts', 'apps/*/src/**/*.{ts,tsx}'],
    ignores: [
      // R12: canvasViewportStore operates a separate Dexie DB for cross-app UI state
      'packages/stores/src/canvasViewportStore.ts',
      // R13 / persistence layer: all files under persistence/ and db/ are the designated home
      'apps/*/src/persistence/**',
      'apps/*/src/db/**',
      // Test files: mocks routinely import db/dexie for setup
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: 'dexie',
            message:
              'Persistence access is via @variscout/core HubRepository. Use pwaHubRepository.dispatch or see apps/<app>/src/persistence/ for the implementation.',
          },
        ],
        patterns: [
          {
            group: ['**/db/schema'],
            message:
              'Direct `db` access from db/schema bypasses the repository dispatch boundary. Use pwaHubRepository.dispatch or a service in apps/<app>/src/persistence/.',
          },
        ],
      }],
    },
  },
  // Tier-gating retirement guard (ADR-082, wedge V1):
  // Prevents reintroduction of retired tier/plan functions and types.
  // Use canAccess(userId, members, action) from @variscout/core/projectMembership
  // for role-based access; otherwise just delete the conditional.
  {
    files: ['packages/**/*.{ts,tsx}', 'apps/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@variscout/core',
              importNames: [
                'isPaidTier',
                'hasTeamFeatures',
                'shouldShowBranding',
                'getBrandingText',
                'getSignatureText',
                'hasKnowledgeBase',
                'isTeamPlan',
                'configureTier',
                'configurePlan',
                'getTier',
                'getPlan',
                'getMaxChannels',
                'getTierLimits',
                'isChannelLimitExceeded',
                'shouldShowChannelWarning',
                'getTierDescription',
                'getUpgradeUrl',
                'isUpgradeUrlPlaceholder',
                'BRANDING_COLORS',
                'DEFAULT_PLAN',
                'DEFAULT_TIER',
                'TIER_LIMITS',
                'LicenseTier',
                'MarketplacePlan',
              ],
              message:
                'Tier gating retired in wedge V1 (ADR-082). Use canAccess(userId, members, action) from @variscout/core/projectMembership for role-based access; otherwise just delete the conditional.',
            },
            {
              name: '@variscout/hooks',
              importNames: ['useTier'],
              message:
                'useTier hook retired in wedge V1. Use direct MAX_CHANNELS / validateChannelCount imports from @variscout/core if you need channel-limit info.',
            },
          ],
        },
      ],
    },
  },
  prettier,
];
