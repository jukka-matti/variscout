// eslint-plugin-variscout — VariScout-specific rules
// Rules are added one-by-one in subsequent tasks.

import noTofixedOnStats from './rules/no-tofixed-on-stats.js';

export default {
  meta: {
    name: 'eslint-plugin-variscout',
    version: '0.1.0',
  },
  rules: {
    'no-tofixed-on-stats': noTofixedOnStats,
  },
};
