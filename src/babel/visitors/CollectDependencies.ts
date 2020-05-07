/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it makes a list of dependencies, try to evaluate expressions, and if it is not possible, mark them as lazy dependencies.
 */

import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';
import { debug } from '../utils/logger';
import isStyledOrCss from '../utils/isStyledOrCss';

/**
 * Hoist the node and its dependencies to the highest scope possible
 */
function hoist(ex: NodePath<t.Expression | null>) {
  const Identifier = (idPath: NodePath<t.Identifier>) => {
    if (!idPath.isReferencedIdentifier()) {
      return;
    }
    const binding = idPath.scope.getBinding(idPath.node.name);
    if (!binding) return;
    const { scope, path: bindingPath, referencePaths } = binding;
    if (scope.parent === null) {
      // It's a variable from global scope
      return;
    }

    if (bindingPath.isVariableDeclarator()) {
      const initPath = bindingPath.get('init');
      hoist(initPath);
      initPath.hoist(scope);
      if (initPath.isIdentifier()) {
        referencePaths.forEach(referencePath => {
          referencePath.replaceWith(t.identifier(initPath.node.name));
          // referencePath.node.name = initPath.node.name;
        });
      }
    }
  };

  if (ex.isIdentifier()) {
    return Identifier(ex);
  }

  ex.traverse({
    Identifier,
  });
}

export default function CollectDependencies(
  path: NodePath<t.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const styledOrCss = isStyledOrCss(path, state);
  if (!styledOrCss) {
    return;
  }
  const expressions = path.get('quasi').get('expressions');

  debug('template-parse:identify-expressions', expressions.length);

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<t.Expression>) => {
      const result = ex.evaluate();
      if (result.confident) {
        throwIfInvalid(result.value, ex);
        return { kind: ValueType.VALUE, value: result.value };
      }
      if (
        options.evaluate &&
        !(t.isFunctionExpression(ex) || t.isArrowFunctionExpression(ex))
      ) {
        // save original expression that may be changed during hoisting
        const originalExNode = t.cloneNode(ex.node);

        hoist(ex);

        // save hoisted expression to be used to evaluation
        const hoistedExNode = t.cloneNode(ex.node);

        // get back original expression to the tree
        ex.replaceWith(originalExNode);

        return { kind: ValueType.LAZY, ex: hoistedExNode, originalEx: ex };
      }

      return { kind: ValueType.FUNCTION, ex };
    }
  );

  debug(
    'template-parse:evaluate-expressions',
    expressionValues.map(expressionValue =>
      expressionValue.kind === ValueType.VALUE ? expressionValue.value : 'lazy'
    )
  );

  if (styledOrCss !== 'css' && 'name' in styledOrCss.component.node) {
    // It's not a real dependency.
    // It can be simplified because we need just a className.
    expressionValues.push({
      // kind: ValueType.COMPONENT,
      kind: ValueType.LAZY,
      ex: styledOrCss.component.node.name,
      originalEx: styledOrCss.component.node.name,
    });
  }

  state.queue.push({
    styled: styledOrCss !== 'css' ? styledOrCss : undefined,
    path,
    expressionValues,
  });
}
