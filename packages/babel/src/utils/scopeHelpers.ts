import type { NodePath } from '@babel/traverse';
import type { Identifier } from '@babel/types';

function getBinding(path: NodePath<Identifier>) {
  const binding = path.scope.getBinding(path.node.name);
  if (!binding) {
    return undefined;
  }

  return binding;
}

export function reference(path: NodePath<Identifier>) {
  const binding = getBinding(path);
  if (!binding) return;

  if (binding.referencePaths.includes(path)) {
    return;
  }

  binding.referenced = true;
  binding.references += 1;
  binding.referencePaths.push(path);
}

export function dereference(path: NodePath<Identifier>) {
  const binding = getBinding(path);
  if (!binding) return;

  if (!binding.referencePaths.includes(path)) {
    return;
  }

  binding.references -= 1;
  binding.referencePaths = binding.referencePaths.filter((i) => i !== path);
  binding.referenced = binding.referencePaths.length > 0;
}

export function dereferenceAll(path: NodePath) {
  path.traverse({
    Identifier(identifierPath) {
      dereference(identifierPath);
    },
  });
}

export function referenceAll(path: NodePath) {
  path.traverse({
    Identifier(identifierPath) {
      reference(identifierPath);
    },
  });
}
