import type { NodePath, Scope } from '@babel/traverse';
import type {
  ExpressionStatement,
  Identifier,
  ObjectExpression,
  ObjectProperty,
  Program,
} from '@babel/types';

import { createId } from './createId';
import { reference } from './scopeHelpers';

function getOrAddLinariaPreval(scope: Scope): NodePath<ObjectExpression> {
  const rootScope = scope.getProgramParent();
  let object = rootScope.getData('__linariaPreval');
  if (object) {
    return object;
  }

  const prevalExport: ExpressionStatement = {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: createId('exports'),
        property: createId('__linariaPreval'),
        computed: false,
      },
      right: {
        type: 'ObjectExpression',
        properties: [],
      },
    },
  };

  const programPath = rootScope.path as NodePath<Program>;
  const [inserted] = programPath.pushContainer('body', [prevalExport]);
  object = inserted.get('expression.right') as NodePath<ObjectExpression>;
  rootScope.setData('__linariaPreval', object);
  return object;
}

export function addIdentifierToLinariaPreval(scope: Scope, name: string) {
  const rootScope = scope.getProgramParent();
  const object = getOrAddLinariaPreval(rootScope);
  const newProperty: ObjectProperty = {
    type: 'ObjectProperty',
    key: createId(name),
    value: createId(name),
    computed: false,
    shorthand: false,
  };

  const [inserted] = object.pushContainer('properties', [newProperty]);
  reference(inserted.get('value') as NodePath<Identifier>);
}
