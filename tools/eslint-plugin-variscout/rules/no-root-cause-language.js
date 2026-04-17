/**
 * Rule: no-root-cause-language
 *
 * Flags 'root cause' phrasing in string literals and template literals.
 * Use 'contribution' instead (P5 — "contribution not causation").
 *
 * Scoped to i18n messages + AI prompt files via eslint.config.js.
 * Identifiers (e.g. variable names) are NOT flagged — only string values.
 *
 * See root CLAUDE.md hard rule:
 *   "Never use 'root cause' in user-facing strings or AI prompts —
 *    use 'contribution' (P5)"
 */

const ROOT_CAUSE = /root[\s_-]?cause/i;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Forbid 'root cause' phrasing in user-facing strings and AI prompts.",
    },
    messages: {
      forbidden:
        "Use 'contribution' (P5). Root cause language is forbidden in user-facing strings and AI prompts. EDA shows contribution, not causation.",
    },
    schema: [],
  },

  create(context) {
    function check(node, value) {
      if (typeof value === 'string' && ROOT_CAUSE.test(value)) {
        context.report({ node, messageId: 'forbidden' });
      }
    }

    return {
      // Covers plain string literals AND JSX string attribute values
      Literal(node) {
        check(node, node.value);
      },

      // Covers template literals — check each quasi (static text segment)
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          const text = quasi.value.cooked ?? quasi.value.raw ?? '';
          if (ROOT_CAUSE.test(text)) {
            context.report({ node: quasi, messageId: 'forbidden' });
            return; // one report per template literal is sufficient
          }
        }
      },
    };
  },
};
