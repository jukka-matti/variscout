/**
 * Rule: no-interaction-moderator
 *
 * Flags 'moderator' or 'primary' as role-assignment labels in string literals
 * and template literals within interaction/regression/ANOVA code.
 *
 * CONTEXT-AWARE: only active when the file matches
 *   packages/core/src/stats/**  OR  basename contains interaction/regression/anova.
 *
 * Use geometric interaction terms instead: ordinal / disordinal.
 *
 * See feedback memory: interaction language.
 * See CLAUDE.md hard rule:
 *   "Never interpret interactions as 'moderator/primary' —
 *    use geometric terms (ordinal/disordinal)"
 */

const MODERATOR_PRIMARY = /\b(moderator|primary)\b/i;
const STATS_PATH = /packages\/core\/src\/stats\//;
const BASENAME_TRIGGERS = /(interaction|regression|anova)/i;

function isActive(filename) {
  if (!filename || filename === '<input>' || filename === '<text>') return false;
  if (STATS_PATH.test(filename)) return true;
  const basename = filename.split('/').pop() || '';
  return BASENAME_TRIGGERS.test(basename);
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Forbid 'moderator'/'primary' role labels in interaction/regression code; use geometric terms (ordinal/disordinal).",
    },
    messages: {
      forbidden:
        "Use geometric interaction terms (ordinal/disordinal). 'Moderator' and 'primary' role assignments are forbidden — EDA cannot attribute roles. See feedback memory: interaction language.",
    },
    schema: [],
  },

  create(context) {
    const filename =
      (typeof context.getFilename === 'function'
        ? context.getFilename()
        : undefined) ?? context.filename;

    if (!isActive(filename)) {
      return {}; // rule inactive outside scoped paths
    }

    function check(node, value) {
      if (typeof value === 'string' && MODERATOR_PRIMARY.test(value)) {
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
          if (MODERATOR_PRIMARY.test(text)) {
            context.report({ node: quasi, messageId: 'forbidden' });
            return; // one report per template literal is sufficient
          }
        }
      },
    };
  },
};
