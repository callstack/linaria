/* @flow */

import type { NodePath } from './types';

import { getSelfBinding } from './utils';

export default function resolveSource(path: NodePath<*>): ?string {
  const binding = getSelfBinding(path);

  switch (binding.kind) {
    case 'module':
      return binding.path.parentPath.getSource();
    case 'const':
    case 'let':
    case 'var':
      return binding.path.getSource().length === 0
        ? null
        : `${binding.kind} ${binding.path.getSource()}`;
    default:
      return binding.path.getSource();
  }
}
