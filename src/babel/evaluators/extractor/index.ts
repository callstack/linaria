/**
 * This file is a main file of extractor evaluation strategy.
 * It finds __linariaPreval statements starting from the end of the program and
 * invoke RequirementsResolver to get parts of code that needs to be executed in order to evaluate the dependency.
 */

import { traverse, types as t } from '@babel/core';
import type {
  ExpressionStatement,
  MemberExpression,
  Program,
  SequenceExpression,
} from '@babel/types';
import { parseSync, transformSync } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import generator from '@babel/generator';

import type { Evaluator } from '../../types';
import buildOptions from '../buildOptions';
import RequirementsResolver from './RequirementsResolver';

function isMemberExpression(
  path: NodePath<any> | NodePath<any>[]
): path is NodePath<MemberExpression> {
  return !Array.isArray(path) && path.isMemberExpression();
}

// Checks that passed node is `exports.__linariaPreval = /* something */`
function isLinariaPrevalExport(
  path: NodePath<any>
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
  transformOptions.presets!.unshift([require.resolve('../preeval'), options]);
  transformOptions.plugins!.unshift([
    '@babel/plugin-transform-runtime',
    { useESModules: false },
  ]);

  // We made a mistake somewhen, and linaria preval was dependent on `plugin-transform-template-literals`
  // Usually it was loaded into preval, because user was using `@babel/preset-env` preset which included that plugin. Internally we used this preset for tests (and previously for everything) - thats why we implemented behavior based on existing of that plugin
  // The ordering is very important here, that's why it is added as a preset, not just as a plugin. It makes this plugin run *AFTER* linaria preset, which is required to make have the current behavior.
  // In preval we have 2 visitors, one for Call Expressions and second for TaggedTemplateLiterals. Babel process TaggedTemplates first for some reason, and we grab only the css`` statements, we skip styled statements at this stage.
  // Then it process TaggedTemplateLiterals with mentioned plugin, which transforms them to CallExpressions (babel seems to apply thw whole set of plugins for particular visitor, then for the next visitor and so on).
  // Then Linaria can identify all `styled` as call expressions, including `styled.h1`, `styled.p` and others.

  // Presets ordering is from last to first, so we add the plugin at the beginning of the list, which persist the order that was established with formerly used `@babel/preset-env`.

  transformOptions.presets!.unshift({
    plugins: ['@babel/plugin-transform-template-literals'],
  });
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
  const ast = parseSync(code!, { filename: filename + '.preval' });
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
