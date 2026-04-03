import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

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
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },
  // React Compiler validation rules (from eslint-plugin-react-hooks v7+)
  // recommended-latest includes purity, immutability, refs, static-components etc.
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/src/**/*.{ts,tsx}'],
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
        { type: 'pwa', pattern: 'apps/pwa/src/**' },
        { type: 'azure', pattern: 'apps/azure/src/**' },
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
            // core → nothing (no internal package imports allowed)
            // charts → core
            { from: { type: 'charts' }, allow: { to: { type: ['core'] } } },
            // hooks → core, data (type import for SampleDataset)
            { from: { type: 'hooks' }, allow: { to: { type: ['core', 'data'] } } },
            // data → core
            { from: { type: 'data' }, allow: { to: { type: ['core'] } } },
            // ui → core, charts, hooks
            { from: { type: 'ui' }, allow: { to: { type: ['core', 'charts', 'hooks'] } } },
            // pwa → core, charts, hooks, ui, data
            { from: { type: 'pwa' }, allow: { to: { type: ['core', 'charts', 'hooks', 'ui', 'data'] } } },
            // azure → core, charts, hooks, ui, data
            { from: { type: 'azure' }, allow: { to: { type: ['core', 'charts', 'hooks', 'ui', 'data'] } } },
            // website → core, charts, hooks, ui, data
            { from: { type: 'website' }, allow: { to: { type: ['core', 'charts', 'hooks', 'ui', 'data'] } } },
            // docs → no source imports from internal packages
          ],
        },
      ],
    },
  },
  prettier,
];
