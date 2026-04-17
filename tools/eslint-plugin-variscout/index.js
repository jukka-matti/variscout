// eslint-plugin-variscout — VariScout-specific rules
// Rules are added one-by-one in subsequent tasks.

import noTofixedOnStats from './rules/no-tofixed-on-stats.js';
import noHardcodedChartColors from './rules/no-hardcoded-chart-colors.js';

export default {
  meta: {
    name: 'eslint-plugin-variscout',
    version: '0.1.0',
  },
  rules: {
    'no-tofixed-on-stats': noTofixedOnStats,
    'no-hardcoded-chart-colors': noHardcodedChartColors,
  },
};
