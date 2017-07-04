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
  expression: BabelMemberExpression,
  t: BabelTypes
): ?Object {
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
  expression: BabelMemberExpression,
  t: BabelTypes
): string[] {
  const path: string[] = [expression.property.name];
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
  // $FlowFixMe taggedTemplateExpr will be BabelTaggedTemplateExpression
  taggedTemplateExpr: BabelTaggedTemplateExpression,
  state: State,
  t: BabelTypes
) {
  taggedTemplateExpr.quasi.expressions.forEach(
    (expression: BabelMemberExpression | Object, index: number) => {
      if (!t.isMemberExpression(expression)) {
        throw new Error(`Cannot resolve expression ${expression.type}`);
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

      const associatedModule: ?Object = importModule(
        baseObjectIdentifier.name,
        state.imports,
        state.filename
      );

      if (!associatedModule) {
        throw new Error(
          `Could not find ${baseObjectIdentifier.name} import statement`
        );
      }

      const propertyPath: string[] = resolvePropertyPath(expression, t);
      if (associatedModule.__useDefault) {
        propertyPath.unshift('default');
      }
      const value: ?any = resolveValueFromPath(associatedModule, propertyPath);
      taggedTemplateExpr.quasi.quasis.splice(
        index + 1,
        0,
        t.templateElement({ cooked: value, raw: value })
      );
    }
  );
  taggedTemplateExpr.quasi.expressions = [];
  return taggedTemplateExpr;
}
