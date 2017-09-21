/* @flow */

import generate from 'babel-generator';

import type {
  NodePath,
  BabelTypes,
  BabelVariableDeclarator,
  RequirementSource,
} from '../types';

import { getSelfBinding } from './utils';

function getSourceForVariableDeclarationFromAst(
  types: BabelTypes,
  kind: string,
  node: Object
) {
  const program = types.program([types.variableDeclaration(kind, [node])]);
  return generate(program).code;
}

function isLinariaOutput(path: NodePath<BabelVariableDeclarator<any>>) {
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
): ?RequirementSource {
  const binding = getSelfBinding(path);

  if (!binding) {
    throw path.buildCodeFrameError(
      'Linaria css evaluation error:\n' +
        `  Could not find a reference to '${path.node.name}'.\n` +
        '  This might happen if you used some undeclared variable/function or a browser specific API.\n'
    );
  }

  let code: ?string;
  switch (binding.kind) {
    case 'module':
      code = binding.path.parentPath.getSource();
      break;
    case 'const':
    case 'let':
    case 'var': {
      if (isLinariaOutput(binding.path)) {
        code = getSourceForVariableDeclarationFromAst(
          types,
          binding.kind,
          binding.path.node
        );
      } else {
        code =
          binding.path.getSource().length === 0
            ? null
            : `${binding.kind} ${binding.path.getSource()}`;
      }
      break;
    }
    default:
      code = binding.path.getSource();
      break;
  }

  if (!binding.path.node.loc || !code) {
    return null;
  }

  return {
    code,
    loc: binding.path.node.loc.start,
  };
}
