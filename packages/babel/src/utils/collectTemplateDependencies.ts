/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it makes a list of dependencies, try to evaluate expressions, and if it is not possible, mark them as lazy dependencies.
 */

import generator from '@babel/generator';
import type { NodePath } from '@babel/traverse';
import type {
  Expression,
  Identifier as IdentifierNode,
  TaggedTemplateExpression,
  TemplateElement,
  TSType,
} from '@babel/types';

import { debug } from '@linaria/logger';

import type { Core } from '../babel';
import type { StrictOptions, ExpressionValue, State } from '../types';
import { ValueType } from '../types';

import getSource from './getSource';
import getTagProcessor from './getTagProcessor';
import throwIfInvalid from './throwIfInvalid';

/**
 * Hoist the node and its dependencies to the highest scope possible
 */
function hoist(babel: Core, ex: NodePath<Expression | null>): void {
  const Identifier = (idPath: NodePath<IdentifierNode>) => {
    if (!idPath.isReferencedIdentifier()) {
      return;
    }
    const binding = idPath.scope.getBinding(idPath.node.name);
    if (!binding) return;
    const { scope, path: bindingPath, referencePaths } = binding;
    // parent here can be null or undefined in different versions of babel
    if (!scope.parent) {
      // It's a variable from global scope
      return;
    }

    if (bindingPath.isVariableDeclarator()) {
      const initPath = bindingPath.get('init') as NodePath<Expression | null>;
      hoist(babel, initPath);
      initPath.hoist(scope);
      if (initPath.isIdentifier()) {
        referencePaths.forEach((referencePath) => {
          referencePath.replaceWith(babel.types.identifier(initPath.node.name));
        });
      }
    }
  };

  if (ex.isIdentifier()) {
    Identifier(ex);
    return;
  }

  ex.traverse({
    Identifier,
  });
}

export default function collectTemplateDependencies(
  babel: Core,
  path: NodePath<TaggedTemplateExpression>,
  state: State,
  options: Pick<StrictOptions, 'classNameSlug' | 'displayName' | 'evaluate'>
): [quasis: NodePath<TemplateElement>[], expressionValues: ExpressionValue[]] {
  const { types: t } = babel;
  const quasi = path.get('quasi');
  const quasis = quasi.get('quasis');
  const expressions = quasi.get('expressions');

  debug('template-parse:identify-expressions', expressions.length);

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<Expression | TSType>): ExpressionValue => {
      if (!ex.isExpression()) {
        throw ex.buildCodeFrameError(
          `The expression '${generator(ex.node).code}' is not supported.`
        );
      }

      const result = ex.evaluate();
      let value: unknown;
      if (result.confident) {
        value = result.value;
      } else {
        // @ts-expect-error result has deopt field, but it's not in types
        const { deopt } = result as { deopt: NodePath };
        // At least in some cases deopt contains an expression hidden behind an identifier
        // If it is a TaggedTemplateExpression, we can get class name for it
        if (deopt && deopt.isTaggedTemplateExpression()) {
          const context = getTagProcessor(deopt, state, options);
          if (context?.asSelector) {
            return {
              kind: ValueType.VALUE,
              value: context.asSelector,
              ex,
              source: getSource(ex),
            };
          }
        }
      }

      if (value !== undefined) {
        throwIfInvalid(value, ex);
        return {
          kind: ValueType.VALUE,
          value,
          ex,
          source: getSource(ex),
        };
      }

      if (
        options.evaluate &&
        !(ex.isFunctionExpression() || ex.isArrowFunctionExpression())
      ) {
        // save original expression that may be changed during hoisting
        const originalExNode = t.cloneNode(ex.node);

        hoist(babel, ex as NodePath<Expression | null>);

        // save hoisted expression to be used to evaluation
        const hoistedExNode = t.cloneNode(ex.node);

        // get back original expression to the tree
        ex.replaceWith(originalExNode);

        return {
          kind: ValueType.LAZY,
          ex: hoistedExNode,
          originalEx: ex,
          source: getSource(ex),
        };
      }

      return { kind: ValueType.FUNCTION, ex, source: getSource(ex) };
    }
  );

  debug(
    'template-parse:evaluate-expressions',
    expressionValues.map((expressionValue) =>
      expressionValue.kind === ValueType.VALUE ? expressionValue.value : 'lazy'
    )
  );

  return [quasis, expressionValues];
}
