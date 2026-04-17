import { RuleTester } from 'eslint';
import rule from '../no-tofixed-on-stats.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

ruleTester.run('no-tofixed-on-stats', rule, {
  valid: [
    // Guarded with Number.isFinite before .toFixed
    { code: 'function f(m) { const x = m; if (Number.isFinite(x)) { return x.toFixed(2); } }' },
    // Numeric literal target — exempt
    { code: 'function f() { const n = 3.14; return n.toFixed(2); }' },
    // No .toFixed() at all
    { code: 'formatStatistic(value, 2);' },
    // Direct literal — (3.14).toFixed(2)
    { code: 'function f() { return (3.14).toFixed(2); }' },
    // Integer literal
    { code: 'function f() { return (0).toFixed(2); }' },

    // Issue 3: Ternary with arithmetic receiver — guarded var inside BinaryExpression
    { code: 'const r = Number.isFinite(x) ? (x * 100).toFixed(1) : "?";' },
    { code: 'const r = Number.isFinite(x) ? (x / 2).toFixed(2) : "?";' },
  ],
  invalid: [
    // Unguarded call on identifier from function call
    {
      code: 'function f() { const cpk = calc(); return cpk.toFixed(2); }',
      errors: [{ messageId: 'unguarded' }],
    },
    // Unguarded property access on stats object
    {
      code: 'function f() { return stats.cp.toFixed(2); }',
      errors: [{ messageId: 'unguarded' }],
    },
    // Issue 2: Guard placed AFTER the call — must still flag
    {
      code: 'function f(cpk) { const r = cpk.toFixed(2); if (Number.isFinite(cpk)) doSomething(); }',
      errors: [{ messageId: 'unguarded' }],
    },
  ],
});

// --- TypeScript fixtures (require @typescript-eslint/parser) ---

let tsParser;
try {
  tsParser = await import('@typescript-eslint/parser');
} catch {
  // Parser not available — skip TS-specific tests
  tsParser = null;
}

if (tsParser) {
  const tsRuleTester = new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
  });

  tsRuleTester.run('no-tofixed-on-stats (TypeScript)', rule, {
    valid: [
      // Baseline: plain guard without non-null assertion
      { code: 'function f(x: number | undefined) { if (Number.isFinite(x)) { return x.toFixed(2); } }' },
      // Issue 1: Non-null assertion after guard — should NOT flag
      { code: 'function f(x: number | undefined) { if (Number.isFinite(x)) { return x!.toFixed(2); } }' },
    ],
    invalid: [],
  });
}
