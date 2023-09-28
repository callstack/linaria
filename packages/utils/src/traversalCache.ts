import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import type { Node } from '@babel/types';

const caches = new WeakMap<
  NodePath,
  Map<string, WeakMap<NodePath | Node, unknown>>
>();

export const getTraversalCache = <
  TValue,
  TKey extends NodePath | Node = NodePath,
>(
  path: NodePath,
  name: string
) => {
  const programPath = path.find((p) => p.isProgram());
  if (!programPath) {
    throw new Error(`Could not find program for ${path.node.type}`);
  }

  if (!caches.has(programPath)) {
    caches.set(programPath, new Map());
  }

  const cache = caches.get(programPath)!;
  if (!cache.has(name)) {
    cache.set(name, new WeakMap());
  }

  return cache.get(name) as WeakMap<TKey, TValue>;
};

const traverseCache = (traverse as unknown as { cache: unknown }).cache;
export const clearBabelTraversalCache = () => {
  (traverseCache as { clear: () => void }).clear();
};

export const invalidateTraversalCache = (path: NodePath) => {
  const programPath = path.find((p) => p.isProgram());
  if (!programPath) {
    throw new Error(`Could not find program for ${path.node.type}`);
  }

  caches.delete(programPath);
};
