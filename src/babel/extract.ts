/* eslint-disable no-param-reassign */

import { types } from '@babel/core';
import { NodePath, Scope } from '@babel/traverse';
import { expression, statement } from '@babel/template';
import generator from '@babel/generator';
import evaluate from './evaluators';
import getTemplateProcessor from './evaluators/templateProcessor';
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

function findFreeName(scope: Scope, name: string): string {
  // By default `name` is used as a name of the function …
  let nextName = name;
  let idx = 0;
  while (scope.hasBinding(nextName, false)) {
    // … but if there is an already defined variable with this name …
    // … we are trying to use a name like wrap_N
    idx += 1;
    nextName = `wrap_${idx}`;
  }

  return nextName;
}

// All exported values will be wrapped with this function
const expressionWrapperTpl = statement(`
  const %%wrapName%% = (fn) => {
    try {
      return fn();
    } catch (e) {
      return e;
    }
  };
`);

const expressionTpl = expression(`%%wrapName%%(() => %%expression%%)`);
const exportsLinariaPrevalTpl = statement(
  `exports.__linariaPreval = %%expressions%%`
);

function addLinariaPreval(
  path: NodePath<types.Program>,
  lazyDeps: Array<types.Expression | string>
): types.Program {
  // Constant __linariaPreval with all dependencies
  const wrapName = findFreeName(path.scope, '_wrap');
  const statements = [
    expressionWrapperTpl({ wrapName }),
    exportsLinariaPrevalTpl({
      expressions: types.arrayExpression(
        lazyDeps.map(expression => expressionTpl({ expression, wrapName }))
      ),
    }),
  ];

  const programNode = path.node;
  return types.program(
    [...programNode.body, ...statements],
    programNode.directives,
    programNode.sourceType,
    programNode.interpreter
  );
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
            // Identifier: p => Identifier(p, state, options),
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

          if (lazyDeps.length > 0) {
            const program = addLinariaPreval(path, lazyDeps);
            const { code } = generator(program);
            const evaluation = evaluate(
              code,
              types,
              state.file.opts.filename,
              options
            );

            state.dependencies.push(...evaluation.dependencies);
            lazyValues = evaluation.value.__linariaPreval || [];
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
