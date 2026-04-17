/**
 * Rule: no-tofixed-on-stats
 *
 * Flags .toFixed() calls that are not guarded by a prior Number.isFinite()
 * check on the same receiver within the enclosing block or program.
 *
 * Exempt:
 *   - Numeric literal receivers: (3.14).toFixed(2)
 *   - Variables whose nearest VariableDeclarator initializer is a numeric literal:
 *       const n = 3.14; n.toFixed(2);
 *
 * Required guard pattern (anywhere in same or ancestor block before the call):
 *   Number.isFinite(x)  where x is the same source text as the receiver
 *
 * See ADR-069 for the three-boundary numeric safety policy.
 */

/**
 * Get the source text of a .toFixed() call's receiver node.
 * Returns null if we can't determine a sensible receiver text.
 */
function getReceiverText(callNode, sourceCode) {
  const callee = callNode.callee; // MemberExpression
  return sourceCode.getText(callee.object);
}

/**
 * Returns true if the receiver is a numeric literal, e.g. 3.14 or (3.14).
 */
function isNumericLiteral(node) {
  // Strip parentheses if needed (they show up as the same node type in ESLint)
  if (node.type === 'Literal') {
    return typeof node.value === 'number';
  }
  return false;
}

/**
 * Walk up the ancestor chain to find a VariableDeclarator whose id.name
 * matches the receiver identifier, then check if its init is a numeric literal.
 */
function isVariableInitializedToNumericLiteral(receiverNode, ancestors) {
  if (receiverNode.type !== 'Identifier') return false;
  const name = receiverNode.name;

  // Walk ancestors from innermost outward to find a matching declaration
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    // Look inside BlockStatement or Program bodies
    const body =
      ancestor.type === 'Program'
        ? ancestor.body
        : ancestor.type === 'BlockStatement'
          ? ancestor.body
          : null;
    if (!body) continue;

    for (const stmt of body) {
      if (stmt.type !== 'VariableDeclaration') continue;
      for (const decl of stmt.declarations) {
        if (
          decl.id &&
          decl.id.type === 'Identifier' &&
          decl.id.name === name &&
          decl.init &&
          decl.init.type === 'Literal' &&
          typeof decl.init.value === 'number'
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Walk the AST body array (statements) and collect all Number.isFinite(...)
 * call arguments as source-text strings.
 */
function collectFiniteGuards(bodyNodes, sourceCode) {
  const guards = new Set();

  function visitNode(node) {
    if (!node || typeof node !== 'object') return;

    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'Number' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name === 'isFinite' &&
      node.arguments.length >= 1
    ) {
      guards.add(sourceCode.getText(node.arguments[0]));
    }

    // Recurse into child nodes
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue; // avoid circular
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item.type === 'string') visitNode(item);
        }
      } else if (child && typeof child.type === 'string') {
        visitNode(child);
      }
    }
  }

  for (const stmt of bodyNodes) {
    visitNode(stmt);
  }

  return guards;
}

/**
 * Given the ancestors of a node, collect all Number.isFinite guard texts
 * that appear in enclosing blocks/program, scanning from outermost inward.
 */
function collectAllEnclosingGuards(ancestors, sourceCode) {
  const guards = new Set();

  for (const ancestor of ancestors) {
    const body =
      ancestor.type === 'Program'
        ? ancestor.body
        : ancestor.type === 'BlockStatement'
          ? ancestor.body
          : null;
    if (!body) continue;

    const newGuards = collectFiniteGuards(body, sourceCode);
    for (const g of newGuards) guards.add(g);
  }

  return guards;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Guard stat values with Number.isFinite() before .toFixed() or use formatStatistic().',
      url: 'https://github.com/variscout/variscout/blob/main/docs/07-decisions/adr-069-three-boundary-numeric-safety.md',
    },
    messages: {
      unguarded:
        'Guard with Number.isFinite() before .toFixed(), or use formatStatistic() from @variscout/core/i18n. See ADR-069.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        // Only interested in .toFixed() calls
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'toFixed'
        ) {
          return;
        }

        const receiver = node.callee.object;

        // Exempt: numeric literal receiver e.g. (3.14).toFixed(2)
        if (isNumericLiteral(receiver)) return;

        const ancestors = sourceCode.getAncestors(node);

        // Exempt: variable initialized to numeric literal e.g. const n = 3.14; n.toFixed(2)
        if (isVariableInitializedToNumericLiteral(receiver, ancestors)) return;

        // Check for Number.isFinite guard in any enclosing block
        const receiverText = getReceiverText(node, sourceCode);
        const guards = collectAllEnclosingGuards(ancestors, sourceCode);

        if (!guards.has(receiverText)) {
          context.report({ node, messageId: 'unguarded' });
        }
      },
    };
  },
};
