/* eslint-disable no-param-reassign */

/**
 * This is an entry point for styles extraction.
 * On enter, It:
 *  - traverse the code using visitors (TaggedTemplateExpression, ImportDeclaration)
 *  - schedule evaluation of lazy dependencies (those who are not simple expressions //TODO does they have it's name?)
 *  - let templateProcessor to save evaluated values in babel state as `replacements`.
 * On exit, It:
 *  - store result of extraction in babel's file metadata
 */

import type { NodePath, Visitor } from '@babel/traverse';
import type { Program } from '@babel/types';

import { debug } from '@linaria/logger';

import type { Core } from './babel';
import getTemplateProcessor from './evaluators/templateProcessor';
import Module from './module';
import type { State, StrictOptions } from './types';
import evaluateExpressions from './utils/evaluateExpressions';
import processTemplateExpression from './utils/processTemplateExpression';

export default function extract(
  babel: Core,
  options: StrictOptions
): { visitor: Visitor<State> } {
  const process = getTemplateProcessor(options);

  return {
    visitor: {
      Program: {
        enter(path: NodePath<Program>, state: State) {
          // Collect all the style rules from the styles we encounter
          state.queue = [];
          state.rules = {};
          state.index = -1;
          state.dependencies = [];
          state.replacements = [];
          debug('extraction:start', state.file.opts.filename);

          // Invalidate cache for module evaluation to get fresh modules
          Module.invalidate();

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            TaggedTemplateExpression: (p) => {
              processTemplateExpression(babel, 'extract', p, state, options);
            },
          });

          const [dependencies, valueCache] = evaluateExpressions(
            babel,
            path,
            state.queue,
            options,
            state.file.opts.filename
          );

          state.dependencies.push(...dependencies);

          state.queue.forEach((item) => process(item, state, valueCache));
        },
        exit(_: unknown, state: State) {
          if (Object.keys(state.rules).length) {
            // Store the result as the file metadata under linaria key
            state.file.metadata.linaria = {
              rules: state.rules,
              replacements: state.replacements,
              dependencies: state.dependencies,
            };
          }

          // Invalidate cache for module evaluation when we're done
          Module.invalidate();

          debug('extraction:end', state.file.opts.filename);
        },
      },
    },
  };
}
