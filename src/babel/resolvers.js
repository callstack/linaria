/* @flow */

import type {
  BabelTypes,
  State,
  BabelMemberExpression,
  BabelTaggedTemplateExpression,
  BabelIdentifier,
} from './types';

import importModule from './importModule';

/**
 * Resolve base object from member expression chain:
 *   `object.prop1.prop2.prop3` will return `object`
 */
export function resolveBaseObjectIdentifier(
  expression: BabelMemberExpression | BabelIdentifier,
  t: BabelTypes
): ?Object {
  if (t.isIdentifier(expression)) {
    return expression;
  }

  // $FlowFixMe `expression` is a BabelMemberExpression
  let current: BabelMemberExpression | Object = expression.object;
  while (current && t.isMemberExpression(current)) {
    current = current.object;
  }
  return current;
}

/**
 * Resolve path of member expression names to a property:
 *   `object.prop1.prop2.prop3` will return `['prop1', 'prop2', 'prop3']`
 */
export function resolvePropertyPath(
  expression: BabelMemberExpression | BabelIdentifier,
  t: BabelTypes
): string[] {
  if (t.isIdentifier(expression)) {
    return [];
  }

  // $FlowFixMe `expression` is a BabelMemberExpression
  const path: string[] = [expression.property.name];
  // $FlowFixMe `expression` is a BabelMemberExpression
  let current: BabelMemberExpression | Object = expression.object;
  while (current && t.isMemberExpression(current)) {
    path.unshift(current.property.name);
    current = current.object;
  }
  return path;
}

/**
 * Resolve value from a path with given object:
 *   for
 *     object = { prop1: { prop2: { prop3: 'value' } } }
 *     path = ['prop1', 'prop2', 'prop3']
 *   will return 'value'
 */
export function resolveValueFromPath(object: Object, path: string[]): ?any {
  // $FlowFixMe
  return path.reduce((nextObject: Object, propertyKey: string): ?any => {
    return nextObject ? nextObject[propertyKey] : null;
  }, object);
}

/**
 * Resolve tagged template literal with expressions (`${expr}`) to a literal without any
 * expressions.
 */
export function resolveExpressions(
  taggedTemplateExpr: BabelTaggedTemplateExpression,
  state: State,
  t: BabelTypes
) {
  let addedExpressionsLength = 0;
  taggedTemplateExpr.quasi.expressions.forEach(
    (
      expression: BabelMemberExpression | BabelIdentifier | Object,
      index: number
    ) => {
      if (!t.isMemberExpression(expression) && !t.isIdentifier(expression)) {
        throw new Error(
          // $FlowFixMe `expression` is either BabelMemberExpression or BabelIdentifier
          `Cannot resolve expression ${expression.type}:${expression.name ||
            'Unknown'}`
        );
      }

      const baseObjectIdentifier: ?BabelIdentifier = resolveBaseObjectIdentifier(
        expression,
        t
      );

      if (!baseObjectIdentifier) {
        throw new Error(
          'Could not resolve base object, is the template expression a memeber access statement?'
        );
      }

      let associatedModule: ?Object = importModule(
        baseObjectIdentifier.name,
        state.imports,
        state.filename
      );

      if (!associatedModule) {
        const constantsFromObject: ?() => Object =
          state.constants[baseObjectIdentifier.name];
        if (constantsFromObject) {
          associatedModule = constantsFromObject();
        } else {
          throw new Error(
            `Could not find "${baseObjectIdentifier.name}" import statement nor top-level` +
              ' object with constants'
          );
        }
      }

      const propertyPath: string[] = resolvePropertyPath(expression, t);
      if (associatedModule.__useDefault) {
        propertyPath.unshift('default');
      }
      const value: ?any = resolveValueFromPath(associatedModule, propertyPath);
      taggedTemplateExpr.quasi.quasis.splice(
        index + 1 + addedExpressionsLength++,
        0,
        t.templateElement({ cooked: value, raw: value })
      );
    }
  );
  taggedTemplateExpr.quasi.expressions = [];
  return taggedTemplateExpr;
}
