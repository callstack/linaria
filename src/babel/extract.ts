/* eslint-disable no-param-reassign */

import { types } from '@babel/core';
import { NodePath } from '@babel/traverse';
import getTemplateProcessor from './evaluate/templateProcessor';
import shake from './evaluate/shaker';
import evaluate from './evaluate';
import Module from './module';
import {
  State,
  StrictOptions,
  LazyValue,
  ExpressionValue,
  ValueType,
  ValueCache,
} from './types';
import TaggedTemplateExpression from './visitors/TaggedTemplateExpression';

function isLazyValue(v: ExpressionValue): v is LazyValue {
  return v.kind === ValueType.LAZY;
}

function isNodePath(obj: any): obj is NodePath {
  return obj && obj.node !== undefined;
}

export default function extract(_babel: any, options: StrictOptions) {
  const process = getTemplateProcessor(options);

  return {
    visitor: {
      Program: {
        enter(path: NodePath<types.Program>, state: State) {
          // Collect all the style rules from the styles we encounter
          state.queue = [];
          state.rules = {};
          state.index = -1;
          state.dependencies = [];
          state.replacements = [];

          // Invalidate cache for module evaluation to get fresh modules
          Module.invalidate();

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            TaggedTemplateExpression: p =>
              TaggedTemplateExpression(p, state, options),
          });

          const lazyDeps = state.queue.reduce(
            (acc, { expressionValues: values }) => {
              acc.push(
                ...values
                  .filter(isLazyValue)
                  .map(v => (isNodePath(v.ex) ? v.ex.node : v.ex))
              );
              return acc;
            },
            [] as Array<types.Expression | string>
          );

          let lazyValues: any[] = [];
          if (lazyDeps.length) {
            const [shaken, deps] = shake(path.node, lazyDeps);
            state.dependencies.push(...deps.map(d => d.source));
            const evaluation = evaluate(
              shaken,
              types,
              state.file.opts.filename,
              undefined,
              options
            );

            lazyValues = evaluation.value;
          }

          const valueCache: ValueCache = new Map();
          lazyDeps.forEach((key, idx) => valueCache.set(key, lazyValues[idx]));

          state.queue.forEach(item => process(item, state, valueCache));
        },
        exit(_: any, state: State) {
          if (Object.keys(state.rules).length) {
            // Store the result as the file metadata
            state.file.metadata = {
              linaria: {
                rules: state.rules,
                replacements: state.replacements,
                dependencies: state.dependencies,
              },
            };
          }

          // Invalidate cache for module evaluation when we're done
          Module.invalidate();
        },
      },
    },
  };
}
