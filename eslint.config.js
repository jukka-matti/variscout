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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

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
  // Test files configuration
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
          default: 'allow',
          rules: [
            // core cannot import any other internal package
            { from: { type: 'core' }, disallow: { to: { type: ['charts', 'hooks', 'ui', 'data', 'pwa', 'azure', 'website', 'docs'] } } },
            // charts cannot import higher-level packages
            { from: { type: 'charts' }, disallow: { to: { type: ['hooks', 'ui', 'pwa', 'azure', 'website', 'docs'] } } },
            // hooks cannot import ui or apps
            { from: { type: 'hooks' }, disallow: { to: { type: ['ui', 'charts', 'pwa', 'azure', 'website', 'docs'] } } },
            // ui cannot import apps
            { from: { type: 'ui' }, disallow: { to: { type: ['pwa', 'azure', 'website', 'docs'] } } },
            // apps cannot import sibling apps
            { from: { type: 'pwa' }, disallow: { to: { type: ['azure', 'website', 'docs'] } } },
            { from: { type: 'azure' }, disallow: { to: { type: ['pwa', 'website', 'docs'] } } },
            { from: { type: 'website' }, disallow: { to: { type: ['pwa', 'azure', 'docs'] } } },
          ],
        },
      ],
    },
  },
  prettier,
];
