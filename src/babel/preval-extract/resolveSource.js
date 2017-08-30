/* @flow */

import generate from 'babel-generator';

import type { NodePath, BabelTypes } from '../types';

import { getSelfBinding } from './utils';

function getSourceForVariableDeclarationFromAst(
  types: BabelTypes,
  kind: string,
  node: Object
) {
  const program = types.program([types.variableDeclaration(kind, [node])]);
  return generate(program).code;
}

export default function resolveSource(
  types: BabelTypes,
  path: NodePath<*>
): ?string {
  const binding = getSelfBinding(path);

  switch (binding.kind) {
    case 'module':
      return binding.path.parentPath.getSource();
    case 'const':
    case 'let':
    case 'var': {
      const sourceFromAst = getSourceForVariableDeclarationFromAst(
        types,
        binding.kind,
        binding.path.node
      );

      const originalSource =
        binding.path.getSource().length === 0
          ? ''
          : `${binding.kind} ${binding.path.getSource()}`;

      return /[a-zA-Z0-9_]+_[a-zA-Z0-9]+/.test(sourceFromAst) &&
      /css(`|\.named\([^)]+\)`)/.test(originalSource)
        ? sourceFromAst
        : originalSource;
    }
    default:
      return binding.path.getSource();
  }
}
