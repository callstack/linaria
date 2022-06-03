/**
 * This file is a main file of extractor evaluation strategy.
 * It finds __linariaPreval statements starting from the end of the program and
 * invoke RequirementsResolver to get parts of code that needs to be executed in order to evaluate the dependency.
 */

import { traverse, types as t, parseSync, transformSync } from '@babel/core';
import generator from '@babel/generator';
import type { NodePath } from '@babel/traverse';
import type {
  ExpressionStatement,
  MemberExpression,
  Program,
  SequenceExpression,
} from '@babel/types';

import type { Evaluator } from '@linaria/babel-preset';
import { buildOptions } from '@linaria/babel-preset';

import RequirementsResolver from './RequirementsResolver';

function isMemberExpression(
  path: NodePath | NodePath[]
): path is NodePath<MemberExpression> {
  return !Array.isArray(path) && path.isMemberExpression();
}

// Checks that passed node is `exports.__linariaPreval = /* something */`
function isLinariaPrevalExport(
  path: NodePath
): path is NodePath<ExpressionStatement> {
  if (!path.isExpressionStatement()) {
    return false;
  }

  if (
    !(path as NodePath<ExpressionStatement>)
      .get('expression')
      .isAssignmentExpression()
  ) {
    return false;
  }

  const left = path.get('expression.left');

  if (!isMemberExpression(left)) {
    return false;
  }

  const object = left.get('object');
  const property = left.get('property');
  if (
    Array.isArray(property) ||
    !property.isIdentifier() ||
    property.node.name !== '__linariaPreval'
  ) {
    return false;
  }

  return object.isIdentifier() && object.node.name === 'exports';
}

const extractor: Evaluator = (filename, options, text, only = null) => {
  const transformOptions = buildOptions(filename, options);
  transformOptions.presets!.unshift([
    require.resolve('@linaria/preeval'),
    options,
  ]);
  transformOptions.plugins!.unshift([
    require.resolve('@babel/plugin-transform-runtime'),
    { useESModules: false },
  ]);

  // Expressions will be extracted only for __linariaPreval.
  // In all other cases a code will be returned as is.
  let { code } = transformSync(text, transformOptions)!;
  if (!only || only.length !== 1 || only[0] !== '__linariaPreval') {
    return [code!, null];
  }
  // We cannot just use `ast` that was returned by `transformSync`,
  // because there is some kind of cache inside `traverse` which
  // reuses `NodePath` with a wrong scope.
  // There is probably a better solution, but I haven't found it yet.
  const ast = parseSync(code!, { filename: `${filename}.preval` });
  // First of all, let's find a __linariaPreval export
  traverse(ast!, {
    // We know that export has been added to the program body,
    // so we don't need to traverse through the whole tree
    Program(path: NodePath<Program>) {
      const body = path.get('body');
      // Highly likely it has been added in the end
      for (let idx = body.length - 1; idx >= 0; idx--) {
        if (isLinariaPrevalExport(body[idx])) {
          // Here we are!
          const statements = RequirementsResolver.resolve(
            body[idx].get('expression.right')
          );

          // We only need to evaluate the last item in a sequence expression, e.g. (a, b, c)
          body[idx].traverse({
            SequenceExpression(sequence: NodePath<SequenceExpression>) {
              sequence.replaceWith(
                sequence.get('expressions')[
                  sequence.node.expressions.length - 1
                ]
              );
            },
          });

          // We'll wrap each code in a block to avoid collisions in variable names
          const wrapped = statements.reduce(
            (acc, curr) => t.blockStatement([curr, acc]),
            t.blockStatement([body[idx].node])
          );

          // Generate a new code with extracted statements
          code = [
            // Use String.raw to preserve escapes such as '\n' in the code
            String.raw`${generator(wrapped).code}`,
          ].join('\n');
          break;
        }
      }

      path.stop();
    },
  });

  return [code!, null];
};

export default extractor;
