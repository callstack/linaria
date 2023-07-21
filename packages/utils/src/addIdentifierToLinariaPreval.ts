import type { NodePath, Scope } from '@babel/traverse';
import type {
  ExportNamedDeclaration,
  ExpressionStatement,
  Identifier,
  ObjectExpression,
  ObjectProperty,
  Program,
} from '@babel/types';

import { createId } from './createId';
import { reference } from './scopeHelpers';

export function getOrAddLinariaPreval(
  scope: Scope
): NodePath<ObjectExpression> {
  const rootScope = scope.getProgramParent();
  let object = rootScope.getData('__linariaPreval');
  if (object) {
    return object;
  }

  const programPath = rootScope.path as NodePath<Program>;

  if (programPath.node.sourceType === 'script') {
    // CJS exports.__linariaPreval = {};
    const prevalExport: ExpressionStatement = {
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          computed: false,
          object: createId('exports'),
          property: createId('__linariaPreval'),
          type: 'MemberExpression',
        },
        right: {
          properties: [],
          type: 'ObjectExpression',
        },
      },
      type: 'ExpressionStatement',
    };

    const [inserted] = programPath.pushContainer('body', [prevalExport]);
    object = inserted.get('expression.right') as NodePath<ObjectExpression>;
  } else {
    // ESM export const __linariaPreval = {};
    const prevalExport: ExportNamedDeclaration = {
      declaration: {
        declarations: [
          {
            id: createId('__linariaPreval'),
            init: {
              properties: [],
              type: 'ObjectExpression',
            },
            type: 'VariableDeclarator',
          },
        ],
        kind: 'const',
        type: 'VariableDeclaration',
      },
      specifiers: [],
      type: 'ExportNamedDeclaration',
    };

    const [inserted] = programPath.pushContainer('body', [prevalExport]);
    object = inserted.get(
      'declaration.declarations.0.init'
    ) as NodePath<ObjectExpression>;
  }

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
