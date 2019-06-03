/* eslint-disable no-param-reassign */

import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';

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
  let ident = t.identifier('props');
  // Remove Arrow Function Wrapper
  if (isArrow) {
    path.parentPath.replaceWith(path.node);
    return;
  }
  const expressions = path.get('quasi').get('expressions');

  expressions.forEach(ex => {
    // Transform to arrow function if props are referenced
    if (t.isMemberExpression(ex)) {
      // Todo, check if props is name
      let obj = ex.get('object');
      if (
        t.isIdentifier(obj) &&
        t.isIdentifier(ex.get('property')) &&
        (obj as any).node.name === 'props'
      ) {
        // replace with arrow function
        let loc = ex.node.loc;
        let fn = t.arrowFunctionExpression([ident], ex.node);
        fn.loc = loc;
        ex.replaceWith(fn);
      }
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
