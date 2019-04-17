/* eslint-disable no-param-reassign */

import { types } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';

export default function TaggedTemplateExpression(
  path: NodePath<types.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { tag } = path.node;

  let styled: {
    component: {
      node: types.Expression | NodePath<types.Expression>;
    };
  } | null = null;
  let css: boolean = false;

  if (
    types.isCallExpression(tag) &&
    types.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === 'styled' &&
    hasImport(
      types,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    const tagPath = path.get('tag') as NodePath<types.CallExpression>;
    styled = {
      component: tagPath.get('arguments')[0] as NodePath<types.Expression>,
    };
  } else if (
    types.isMemberExpression(tag) &&
    types.isIdentifier(tag.object) &&
    types.isIdentifier(tag.property) &&
    tag.object.name === 'styled' &&
    hasImport(
      types,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    styled = {
      component: { node: types.stringLiteral(tag.property.name) },
    };
  } else if (
    hasImport(types, path.scope, state.file.opts.filename, 'css', 'linaria')
  ) {
    css = types.isIdentifier(tag) && tag.name === 'css';
  }

  if (!styled && !css) {
    return;
  }

  const expressions = path.get('quasi').get('expressions');

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<types.Expression>) => {
      const result = ex.evaluate();
      if (result.confident) {
        throwIfInvalid(result.value, ex);
        return { kind: ValueType.VALUE, value: result.value };
      }

      if (
        options.evaluate &&
        !(types.isFunctionExpression(ex) || types.isArrowFunctionExpression(ex))
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
