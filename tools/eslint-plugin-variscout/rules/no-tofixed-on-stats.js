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
 * Required guard pattern (anywhere in same or ancestor block BEFORE the call):
 *   Number.isFinite(x)  where x is the same source text as the receiver
 *
 * Special handling:
 *   - TSNonNullExpression (x!) is unwrapped for text comparison (Issue 1)
 *   - Guards after the call in the same block are rejected (Issue 2)
 *   - BinaryExpression receivers: if any leaf operand matches a guard,
 *     the call is treated as guarded (Issue 3)
 *
 * See ADR-069 for the three-boundary numeric safety policy.
 */

/**
 * Unwrap TSNonNullExpression (TypeScript x!) to get the inner node's source text.
 * For all other node types, return their source text directly.
 */
function normalizeText(node, sourceCode) {
  if (!node) return null;
  if (node.type === 'TSNonNullExpression') {
    return sourceCode.getText(node.expression);
  }
  return sourceCode.getText(node);
}

/**
 * Get the source text of a .toFixed() call's receiver node, with TSNonNull unwrapping.
 * Returns null if we can't determine a sensible receiver text.
 */
function getReceiverText(callNode, sourceCode) {
  const callee = callNode.callee; // MemberExpression
  return normalizeText(callee.object, sourceCode);
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
 * Collect all leaf identifier/member-expression texts from a BinaryExpression tree.
 * Only descends through BinaryExpression nodes with numeric operators (+, -, *, /).
 * Returns a Set of source-text strings for each leaf operand found.
 */
function collectBinaryLeaves(node, sourceCode) {
  const leaves = new Set();
  const NUMERIC_OPS = new Set(['+', '-', '*', '/']);

  function visit(n) {
    if (!n) return;
    if (n.type === 'BinaryExpression' && NUMERIC_OPS.has(n.operator)) {
      visit(n.left);
      visit(n.right);
    } else {
      // Leaf: could be Identifier, MemberExpression, Literal, etc.
      // Only collect non-literal leaves (we want the variable/member names)
      if (n.type !== 'Literal') {
        leaves.add(normalizeText(n, sourceCode));
      }
    }
  }

  visit(node);
  return leaves;
}

/**
 * Walk the AST body array (statements) and collect all Number.isFinite(...)
 * call arguments as source-text strings.
 *
 * If maxPosition is provided (a range start), only collect guards whose
 * top-level statement in this body starts BEFORE maxPosition.
 */
function collectFiniteGuards(bodyNodes, sourceCode, maxPosition) {
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
      guards.add(normalizeText(node.arguments[0], sourceCode));
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
    // If maxPosition is set, only include guards whose statement starts before it
    if (maxPosition !== undefined) {
      if (!stmt.range || stmt.range[0] >= maxPosition) continue;
    }
    visitNode(stmt);
  }

  return guards;
}

/**
 * Walk up the ancestor chain to find the top-level statement within the given
 * block body array that contains the target node. Returns the statement node,
 * or null if not found.
 */
function findTopLevelStatementInBlock(bodyNodes, callNode) {
  // We need to find which statement in bodyNodes is an ancestor of (or is) callNode.
  // We do this by checking range containment.
  if (!callNode.range) return null;
  const callStart = callNode.range[0];
  const callEnd = callNode.range[1];

  for (const stmt of bodyNodes) {
    if (!stmt.range) continue;
    if (stmt.range[0] <= callStart && stmt.range[1] >= callEnd) {
      return stmt;
    }
  }
  return null;
}

/**
 * Collect Number.isFinite guard texts from a single expression node (non-recursive
 * into sub-blocks). Used for scanning conditional test expressions (if/while/ternary).
 */
function collectGuardsFromExpression(exprNode, sourceCode) {
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
      guards.add(normalizeText(node.arguments[0], sourceCode));
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
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

  visitNode(exprNode);
  return guards;
}

/**
 * Check whether the callNode is located inside the "body" side (not condition)
 * of a conditional ancestor (IfStatement, WhileStatement, ConditionalExpression).
 * Returns true if the call is within the body/consequent/alternate of the conditional.
 */
function isInConsequentOrBody(conditionalNode, callNode) {
  if (!callNode.range) return false;
  const callStart = callNode.range[0];
  const callEnd = callNode.range[1];

  function rangeContains(node) {
    return node && node.range &&
      node.range[0] <= callStart && node.range[1] >= callEnd;
  }

  if (conditionalNode.type === 'IfStatement') {
    return rangeContains(conditionalNode.consequent) ||
           rangeContains(conditionalNode.alternate);
  }
  if (conditionalNode.type === 'WhileStatement' || conditionalNode.type === 'ForStatement') {
    return rangeContains(conditionalNode.body);
  }
  if (conditionalNode.type === 'ConditionalExpression') {
    return rangeContains(conditionalNode.consequent) ||
           rangeContains(conditionalNode.alternate);
  }
  return false;
}

/**
 * Given the ancestors of a node, collect all Number.isFinite guard texts
 * that appear in enclosing blocks/program, scanning from outermost inward.
 *
 * For EACH block level in the ancestor chain, we determine the "entry statement"
 * — the top-level statement within that block which is an ancestor of the call.
 * Only guards whose statement starts BEFORE the entry statement are collected.
 * This prevents guards that appear after the .toFixed() call (in any block level)
 * from being counted.
 *
 * Additionally, for each conditional ancestor (IfStatement, WhileStatement,
 * ConditionalExpression) where the call is in the body/consequent, we collect
 * guards from the test/condition expression — these are always valid because the
 * condition is evaluated before the body executes.
 */
function collectAllEnclosingGuards(ancestors, callNode, sourceCode) {
  const guards = new Set();

  for (let i = 0; i < ancestors.length; i++) {
    const ancestor = ancestors[i];

    // Handle block statements: collect sibling guards that appear BEFORE the call's entry stmt
    const body =
      ancestor.type === 'Program'
        ? ancestor.body
        : ancestor.type === 'BlockStatement'
          ? ancestor.body
          : null;

    if (body) {
      // Find the top-level statement in this block that is an ancestor of (or is) callNode.
      // This is the "entry statement" — guards must start BEFORE it.
      const entryStmt = findTopLevelStatementInBlock(body, callNode);
      const maxPos = entryStmt ? entryStmt.range[0] : undefined;
      const newGuards = collectFiniteGuards(body, sourceCode, maxPos);
      for (const g of newGuards) guards.add(g);
    }

    // Handle conditional ancestors: if call is in consequent/body, collect guards from test
    if (
      (ancestor.type === 'IfStatement' ||
       ancestor.type === 'WhileStatement' ||
       ancestor.type === 'ConditionalExpression') &&
      isInConsequentOrBody(ancestor, callNode)
    ) {
      const testNode =
        ancestor.type === 'ConditionalExpression' ? ancestor.test :
        ancestor.test; // IfStatement and WhileStatement both use .test
      const condGuards = collectGuardsFromExpression(testNode, sourceCode);
      for (const g of condGuards) guards.add(g);
    }
  }

  return guards;
}

/**
 * Check if the receiver of a BinaryExpression has any leaf that matches a guard.
 * This handles patterns like: Number.isFinite(x) ? (x * 100).toFixed(1) : '?'
 */
function isBinaryExpressionGuarded(receiverNode, guards, sourceCode) {
  if (receiverNode.type !== 'BinaryExpression') return false;
  const leaves = collectBinaryLeaves(receiverNode, sourceCode);
  for (const leaf of leaves) {
    if (leaf && guards.has(leaf)) return true;
  }
  return false;
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

        // Unwrap TSNonNullExpression for exemption checks
        const receiverInner =
          receiver.type === 'TSNonNullExpression' ? receiver.expression : receiver;

        // Exempt: numeric literal receiver e.g. (3.14).toFixed(2)
        if (isNumericLiteral(receiverInner)) return;

        const ancestors = sourceCode.getAncestors(node);

        // Exempt: variable initialized to numeric literal e.g. const n = 3.14; n.toFixed(2)
        if (isVariableInitializedToNumericLiteral(receiverInner, ancestors)) return;

        // Check for Number.isFinite guard in any enclosing block (order-aware for innermost)
        const receiverText = getReceiverText(node, sourceCode);
        const guards = collectAllEnclosingGuards(ancestors, node, sourceCode);

        // Direct match
        if (guards.has(receiverText)) return;

        // BinaryExpression: check if any operand leaf matches a guard (Issue 3)
        if (isBinaryExpressionGuarded(receiverInner, guards, sourceCode)) return;

        context.report({ node, messageId: 'unguarded' });
      },
    };
  },
};
