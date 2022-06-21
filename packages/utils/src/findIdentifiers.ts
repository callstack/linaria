import type { NodePath } from '@babel/traverse';
import type { Node, Identifier, JSXIdentifier } from '@babel/types';

type FindType = 'binding' | 'both' | 'referenced';

const checkers: Record<FindType, (ex: NodePath) => boolean> = {
  binding: (ex) => ex.isBindingIdentifier(),
  both: (ex) => ex.isBindingIdentifier() || ex.isReferencedIdentifier(),
  referenced: (ex) => ex.isReferencedIdentifier(),
};

export function nonType(path: NodePath): boolean {
  return !path.find(
    (p) =>
      p.isTSTypeReference() ||
      p.isTSTypeQuery() ||
      p.isFlowType() ||
      p.isFlowDeclaration()
  );
}

export default function findIdentifiers(
  expressions: NodePath<Node | null | undefined>[],
  type: FindType = 'referenced'
): NodePath<Identifier | JSXIdentifier>[] {
  const identifiers: NodePath<Identifier | JSXIdentifier>[] = [];

  expressions.forEach((ex) => {
    const emit = (path: NodePath<Identifier | JSXIdentifier>) => {
      if (!path.node || path.removed || !checkers[type](path)) {
        return;
      }

      if (!nonType(path)) {
        // If skip in TSTypeAnnotation visitor doesn't work
        return;
      }

      // TODO: Is there a better way to check that it's a local variable?

      const binding = path.scope.getBinding(path.node.name);
      if (!binding) {
        return;
      }

      if (type === 'referenced' && ex.isAncestor(binding.path)) {
        // This identifier is declared inside the expression. We don't need it.
        return;
      }

      identifiers.push(path);
    };

    if (ex.isIdentifier() || ex.isJSXIdentifier()) {
      emit(ex);
    } else {
      ex.traverse({
        TSTypeAnnotation(path) {
          // We ignore identifiers in type annotations
          // It will produce broken TS code, but we don't care
          path.skip();
        },
        Identifier(path: NodePath<Identifier>) {
          emit(path);
        },
        JSXIdentifier(path: NodePath<JSXIdentifier>) {
          emit(path);
        },
      });
    }
  });

  return identifiers;
}
