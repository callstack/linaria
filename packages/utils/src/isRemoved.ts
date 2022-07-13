import type { NodePath } from '@babel/traverse';

export default function isRemoved(path: NodePath): boolean {
  return path.find((p) => p.removed) !== null;
}
