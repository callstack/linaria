/* @flow */

import type { BabelTypes, NodePath } from '../types';

type State = {
  programPath: NodePath<*>,
};

const transformTaggedTemplate = (
  t: BabelTypes,
  path: NodePath<*>,
  state: State,
  name: string,
  expression: *
) => {
  if (
    t.isTaggedTemplateExpression(expression) &&
    ((t.isIdentifier(expression.tag) && expression.tag.name === 'css') ||
      (t.isCallExpression(expression.tag) &&
        t.isMemberExpression(expression.tag.callee) &&
        expression.tag.callee.object.name === 'css' &&
        expression.tag.callee.property.name === 'named'))
  ) {
    const className = path.scope.generateUidIdentifier(name);
    state.programPath.node.body.push(
      t.variableDeclaration('var', [
        t.variableDeclarator(t.identifier(className.name), expression),
      ])
    );
    return className;
  }
  return expression;
};

export default function({ types: t }: { types: BabelTypes }) {
  return {
    visitor: {
      Program: {
        enter(path: NodePath<*>, state: State) {
          state.programPath = path;
        },
      },
      JSXOpeningElement(path: NodePath<*>, state: State) {
        path.node.attributes.forEach(attr => {
          if (
            t.isJSXSpreadAttribute(attr) &&
            t.isCallExpression(attr.argument) &&
            attr.argument.callee.name === 'styles'
          ) {
            attr.argument.arguments = attr.argument.arguments.map(arg =>
              transformTaggedTemplate(t, path, state, path.node.name.name, arg)
            );
          } else if (
            t.isJSXIdentifier(attr.name) &&
            t.isJSXExpressionContainer(attr.value) &&
            (attr.name.name === 'class' || attr.name.name === 'className')
          ) {
            attr.value.expression = transformTaggedTemplate(
              t,
              path,
              state,
              path.node.name.name,
              attr.value.expression
            );
          }
        });
      },
      ObjectProperty(path: NodePath<*>, state: State) {
        path.node.value = transformTaggedTemplate(
          t,
          path,
          state,
          path.node.key.name,
          path.node.value
        );
      }
    },
  };
}
