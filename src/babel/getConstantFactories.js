/* @flow */

import type {
  BabelTypes,
  NodePath,
  BabelVariableDeclarator,
  BabelVariableDeclaration,
} from './types';

import generate from 'babel-generator';

export default function getConstantFactories(
  t: BabelTypes,
  path: NodePath<*>
): Object {
  return path.node.body
    .filter(t.isVariableDeclaration)
    .reduce(
      (acc: BabelVariableDeclarator[], element: BabelVariableDeclaration) => {
        return [...acc, ...element.declarations];
      },
      []
    )
    .filter(({ init }) => t.isObjectExpression(init))
    .reduce(
      (acc: Object, element: BabelVariableDeclarator): Object => {
        if (t.isIdentifier(element.id)) {
          return {
            ...acc,
            [element.id.name]: () => {
              if (!acc.__cache[element.id.name]) {
                acc.__cache[element.id.name] = generate(element).code;
              }
              const code = acc.__cache[element.id.name];
              return eval(`(${code})`);
            },
          };
        } else if (t.isObjectPattern(element.id)) {
          // Handle destructurization
          const { code } = generate(element);
          // $FlowFixMe `element.id` is a BabelObjectPattern and has `properties` array
          const keys: string[] = element.id.properties.map(
            prop =>
              t.isIdentifier(prop.value) ? prop.value.name : prop.key.name
          );
          const getConstants = new Function(
            `const ${code}; return { ${keys.join(', ')} }`
          );
          // $FlowFixMe `getConstants` returns a object
          const constants: Object = getConstants();
          const factories = {};
          keys.forEach(key => {
            factories[key] = () => constants[key];
          });

          return {
            ...acc,
            ...factories,
          };
        }
        return acc;
      },
      { __cache: {} }
    );
}
