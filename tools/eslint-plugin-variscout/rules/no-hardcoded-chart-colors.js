/**
 * Rule: no-hardcoded-chart-colors
 *
 * Flags hex color literals in chart package files.
 * Use chartColors/chromeColors from @variscout/charts/colors instead.
 *
 * Scoped to packages/charts/** via eslint.config.js.
 * packages/charts/src/colors.ts is exempt (rule set to 'off').
 *
 * See root CLAUDE.md hard rule:
 *   "Never hardcode hex colors in charts — use chartColors/chromeColors
 *    from @variscout/charts/colors"
 */

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded hex color literals in chart packages.',
    },
    messages: {
      hardcoded:
        'Use chartColors/chromeColors from @variscout/charts/colors. Hardcoded hex values are forbidden in chart packages.',
    },
    schema: [],
  },

  create(context) {
    function check(node, value) {
      if (typeof value === 'string' && HEX_COLOR.test(value)) {
        context.report({ node, messageId: 'hardcoded' });
      }
    }

    return {
      // Covers plain string literals AND JSX string attribute values
      // (JSX attribute string values are Literal nodes visited here too).
      Literal(node) {
        check(node, node.value);
      },
    };
  },
};
