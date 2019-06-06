/* eslint-disable no-param-reassign */

import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';
import calcExpressionStats from '../utils/calcExpressionStats';

function makeArrow(ex: NodePath<t.Expression>) {
  let loc = ex.node.loc;
  let ident = t.identifier('props');
  let fn = t.arrowFunctionExpression([ident], ex.node);
  fn.loc = loc;
  ex.replaceWith(fn);
}

export default function TaggedTemplateExpression(
  path: NodePath<t.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { tag } = path.node;

  let styled: {
    component: {
      node: t.Expression | NodePath<t.Expression>;
    };
  } | null = null;
  let css: boolean = false;

  if (
    t.isCallExpression(tag) &&
    t.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === 'styled' &&
    hasImport(
      t,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    const tagPath = path.get('tag') as NodePath<t.CallExpression>;
    styled = {
      component: tagPath.get('arguments')[0] as NodePath<t.Expression>,
    };
  } else if (
    t.isMemberExpression(tag) &&
    t.isIdentifier(tag.object) &&
    t.isIdentifier(tag.property) &&
    tag.object.name === 'styled' &&
    hasImport(
      t,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    styled = {
      component: { node: t.stringLiteral(tag.property.name) },
    };
  } else if (
    hasImport(t, path.scope, state.file.opts.filename, 'css', 'linaria')
  ) {
    css = t.isIdentifier(tag) && tag.name === 'css';
  }

  if (!styled && !css) {
    return;
  }

  /**
   *  Transform Styled Components wrapped in an arrow function:
   * `const A = props => styled.a` becomes `const A = styled.a`
   */
  const isArrow = t.isArrowFunctionExpression(path.parentPath);

  // Remove Arrow Function Wrapper
  if (isArrow) {
    path.parentPath.replaceWith(path.node);
    return;
  }
  const expressions = path.get('quasi').get('expressions');
  const quasis = path.get('quasi').get('quasis');
  // Evaluate CSS comment location and nesting depth
  const expMeta = calcExpressionStats(quasis, expressions);
  // Validate and transform all expressions
  expressions.forEach((ex, i) => {
    if (t.isStringLiteral(ex)) {
      return;
    } else if (t.isArrayExpression(ex)) {
      // Validate
      let elements = ex.get('elements') as NodePath<any>[];
      if (elements.length > 2) {
        throw ex.buildCodeFrameError(
          'Property array selectors must contain 1 or 2 elements'
        );
      }

      let el1 = elements[0];
      if (!el1 || !el1.getSource().includes('props.')) {
        throw ex.buildCodeFrameError(
          'Expected property array condition to access props'
        );
      }
      if (!t.isExpression(el1.node)) {
        throw ex.buildCodeFrameError(
          'Expected property array condition to be an expression'
        );
      }

      if (expMeta[i].nestLevel > 0) {
        throw ex.buildCodeFrameError(
          'Property array expression must not be nested.'
        );
      }

      if (expMeta[i].remove) {
        ex.replaceWith(t.stringLiteral(expMeta[i].placeholder));
        return;
        // throw ex.buildCodeFrameError('TEMP: will remove expression in comment');
      }

      if (!expMeta[i].valid) {
        throw ex.buildCodeFrameError(
          'Property array expressions can only be used as a root selector.'
        );
      }

      if (
        !t.isFunctionExpression(el1.node) &&
        !t.isArrowFunctionExpression(el1.node)
      ) {
        makeArrow(el1);
      }

      // Transform to arrow function if props are referenced
    } else if (
      t.isExpression(ex.node) &&
      ex.getSource().includes('props.') &&
      !t.isFunctionExpression(ex.node) &&
      !t.isArrowFunctionExpression(ex.node)
    ) {
      makeArrow(ex);
    }
  });

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
        return { kind: ValueType.LAZY, ex };
      }

      return { kind: ValueType.FUNCTION, ex };
    }
  );

  if (styled && 'name' in styled.component.node) {
    expressionValues.push({
      kind: ValueType.LAZY,
      ex: styled.component.node.name,
    });
  }

  state.queue.push({
    styled: styled || undefined,
    path,
    expressionValues,
  });
}
