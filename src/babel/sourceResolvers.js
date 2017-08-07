export function isExcluded(path): boolean {
  const binding = path.scope.getBinding(path.node.name);
  return binding && binding.kind === 'param';
}

export function resolveSource(path): ?string {
  const binding = path.scope.getBinding(path.node.name);
  if (!binding) {
    return null;
  }

  switch (binding.kind) {
    case 'module':
    case 'const':
      return binding.path.parentPath.getSource();
    default:
      return binding.path.getSource();
  }
}
