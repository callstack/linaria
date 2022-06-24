import type { NodePath } from '@babel/traverse';
import type { Node, Identifier, VariableDeclaration } from '@babel/types';

export default function findIdentifiers(
  expressions: NodePath<Node | null | undefined>[]
): NodePath<Identifier>[] {
  const identifiers: NodePath<Identifier>[] = [];

  expressions.forEach((ex) => {
    if (ex.isIdentifier()) {
      identifiers.push(ex);
    } else {
      ex.traverse({
        Identifier(path: NodePath<Identifier>) {
          if (path.isReferenced()) {
            identifiers.push(path);
          }
        },
      });
    }
  });

  return identifiers;
}

export function findAllIdentifiersIn(
  ex: NodePath<VariableDeclaration>,
  key: 'id' | 'init'
) {
  return findIdentifiers(ex.get('declarations').map((d) => d.get(key)));
}
