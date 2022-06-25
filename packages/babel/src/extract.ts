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

import type { Replacements } from '@linaria/core/processors/types';
import { debug } from '@linaria/logger';

import type { Core } from './babel';
import Module from './module';
import type { Rules, State, StrictOptions } from './types';
import evaluateExpressions from './utils/evaluateExpressions';
import processTemplateExpression from './utils/processTemplateExpression';
import removeUnusedCode from './utils/removeUnusedCode';

export default function extract(
  babel: Core,
  options: StrictOptions
): { visitor: Visitor<State> } {
  return {
    visitor: {
      Program: {
        enter(path: NodePath<Program>, state: State) {
          // Collect all the style rules from the styles we encounter
          state.processors = [];
          debug('extraction:start', state.file.opts.filename);

          // Invalidate cache for module evaluation to get fresh modules
          Module.invalidate();

          // We need our transforms to run before anything else
          // So we traverse here instead of in a visitor
          path.traverse({
            TaggedTemplateExpression: (p) => {
              processTemplateExpression(p, state, options);
            },
          });

          state.dependencies = evaluateExpressions(
            babel,
            path,
            state.processors,
            options,
            state.file.opts.filename
          );
        },
        exit(path: NodePath<Program>, state: State) {
          if (state.processors.length > 0) {
            const metadata = {
              rules: {} as Rules,
              replacements: [] as Replacements,
              dependencies: state.dependencies,
            };

            state.processors.forEach((processor) => {
              processor.artifacts.forEach((artifact) => {
                if (artifact[0] !== 'css') return;
                const [rules, replacements] = artifact[1] as [
                  rules: Rules,
                  sourceMapReplacements: Replacements
                ];

                metadata.rules = {
                  ...metadata.rules,
                  ...rules,
                };

                metadata.replacements.push(...replacements);
              });
            });

            state.file.metadata.linaria = metadata;
          }

          // Invalidate cache for module evaluation when we're done
          Module.invalidate();

          // We have some garbage after extraction. Let's remove it.
          removeUnusedCode(path);

          debug('extraction:end', state.file.opts.filename);
        },
      },
    },
  };
}
