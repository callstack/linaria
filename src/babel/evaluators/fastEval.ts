import { NodePath } from '@babel/traverse';
import { types as t } from '@babel/core';

import getLinariaComment from '../utils/getLinariaComment';

const isObjectProperty = (path: NodePath): path is NodePath<t.ObjectProperty> =>
  path.isObjectProperty();

const UNEVALUATED = { confident: false, value: undefined };

/**
 * Tries to calculate the value of expression without real evaluation
 * @param ex
 */
function fastEval(ex: NodePath<t.Expression>) {
  if (ex.isMemberExpression()) {
    const property = ex.get('property');
    let propertyName: string;
    if (!Array.isArray(property) && property.isIdentifier()) {
      propertyName = property.node.name;
    } else {
      return UNEVALUATED;
    }

    const object = ex.get('object');
    const objectId = object.isIdentifier() ? object.node.name : null;
    if (objectId === null) {
      return UNEVALUATED;
    }

    const binding = ex.scope.getBinding(objectId);
    const bindingPath = binding?.path;
    if (bindingPath?.isVariableDeclarator()) {
      const initPath = bindingPath.get('init');
      if (initPath.isObjectExpression()) {
        const property = initPath
          .get('properties')
          .filter(isObjectProperty)
          .find(p => {
            const key = p.get('key');
            if (!Array.isArray(key) && key.isIdentifier()) {
              return key.node.name === propertyName;
            }
          });
        if (!property) {
          return UNEVALUATED;
        }

        const valuePath = property.get('value');
        const [, , className] = getLinariaComment(valuePath, false);
        if (className) {
          // It's known class name, so just use its value
          return { confident: true, value: className };
        }

        return valuePath.evaluate();
      }
    }

    return UNEVALUATED;
  }

  return ex.evaluate();
}

export default fastEval;
