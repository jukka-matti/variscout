// eslint-plugin-variscout — VariScout-specific rules
// Rules are added one-by-one in subsequent tasks.

import noTofixedOnStats from './rules/no-tofixed-on-stats.js';
import noHardcodedChartColors from './rules/no-hardcoded-chart-colors.js';
import noRootCauseLanguage from './rules/no-root-cause-language.js';
import noInteractionModerator from './rules/no-interaction-moderator.js';

export default {
  meta: {
    name: 'eslint-plugin-variscout',
    version: '0.1.0',
  },
  rules: {
    'no-tofixed-on-stats': noTofixedOnStats,
    'no-hardcoded-chart-colors': noHardcodedChartColors,
    'no-root-cause-language': noRootCauseLanguage,
    'no-interaction-moderator': noInteractionModerator,
  },
};
