/* @flow */

import generate from 'babel-generator';

import type { NodePath, BabelTypes, BabelVariableDeclarator } from '../types';

import { getSelfBinding } from './utils';

function getSourceForVariableDeclarationFromAst(
  types: BabelTypes,
  kind: string,
  node: Object
) {
  const program = types.program([types.variableDeclaration(kind, [node])]);
  return generate(program).code;
}

function isLinariaOutput(
  t: BabelTypes,
  path: NodePath<BabelVariableDeclarator<any>>
) {
  const parent = path.parentPath;

  return (
    parent.isVariableDeclaration() &&
    parent.node.leadingComments &&
    parent.node.leadingComments.findIndex(
      comment => comment.value === 'linaria-output'
    ) > -1
  );
}

export default function resolveSource(
  types: BabelTypes,
  path: NodePath<*>
): ?string {
  const binding = getSelfBinding(path);

  if (!binding) {
    throw path.buildCodeFrameError(
      'Linaria css evaluation error:\n' +
        `  Could not find a reference to '${path.node.name}'.\n` +
        '  This might happen if you used some undeclared variable/function or a browser specific API.\n'
    );
  }

  switch (binding.kind) {
    case 'module':
      return binding.path.parentPath.getSource();
    case 'const':
    case 'let':
    case 'var': {
      if (isLinariaOutput(types, binding.path)) {
        return getSourceForVariableDeclarationFromAst(
          types,
          binding.kind,
          binding.path.node
        );
      }

      return binding.path.getSource().length === 0
        ? null
        : `${binding.kind} ${binding.path.getSource()}`;
    }
    default:
      return binding.path.getSource();
  }
}
