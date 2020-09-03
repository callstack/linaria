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

import type { Node, Program, Expression } from '@babel/types';
import type { NodePath, Scope, Visitor } from '@babel/traverse';
import { expression, statement } from '@babel/template';
import generator from '@babel/generator';
import evaluate from './evaluators';
import getTemplateProcessor from './evaluators/templateProcessor';
import Module from './module';
import type {
  State,
  StrictOptions,
  LazyValue,
  ExpressionValue,
  ValueCache,
} from './types';
import { ValueType } from './types';
import CollectDependencies from './visitors/CollectDependencies';
import DetectStyledImportName from './visitors/DetectStyledImportName';
import GenerateClassNames from './visitors/GenerateClassNames';
import { debug } from './utils/logger';
import type { Core } from './babel';

function isLazyValue(v: ExpressionValue): v is LazyValue {
  return v.kind === ValueType.LAZY;
}

function isNodePath<T extends Node>(obj: NodePath<T> | T): obj is NodePath<T> {
  return 'node' in obj && obj?.node !== undefined;
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

function unwrapNode<T extends Node>(
  item: NodePath<T> | T | string
): T | string {
  if (typeof item === 'string') {
    return item;
  }

  return isNodePath(item) ? item.node : item;
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
  { types: t }: Core,
  path: NodePath<Program>,
  lazyDeps: Array<Expression | string>
): Program {
  // Constant __linariaPreval with all dependencies
  const wrapName = findFreeName(path.scope, '_wrap');
  const statements = [
    expressionWrapperTpl({ wrapName }),
    exportsLinariaPrevalTpl({
      expressions: t.arrayExpression(
        lazyDeps.map((expression) => expressionTpl({ expression, wrapName }))
      ),
    }),
  ];

  const programNode = path.node;
  return t.program(
    [...programNode.body, ...statements],
    programNode.directives,
    programNode.sourceType,
    programNode.interpreter
  );
}

export default function extract(
  babel: Core,
  options: StrictOptions
): { visitor: Visitor<State> } {
  const process = getTemplateProcessor(babel, options);

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
            ImportDeclaration: (p) => DetectStyledImportName(babel, p, state),
            TaggedTemplateExpression: (p) => {
              GenerateClassNames(babel, p, state, options);
              CollectDependencies(babel, p, state, options);
            },
          });

          const lazyDeps = state.queue.reduce(
            (acc, { expressionValues: values }) => {
              acc.push(...values.filter(isLazyValue));
              return acc;
            },
            [] as LazyValue[]
          );

          const expressionsToEvaluate = lazyDeps.map((v) => unwrapNode(v.ex));
          const originalLazyExpressions = lazyDeps.map((v) =>
            unwrapNode(v.originalEx)
          );

          debug('lazy-deps:count', lazyDeps.length);

          let lazyValues: any[] = [];

          if (expressionsToEvaluate.length > 0) {
            debug(
              'lazy-deps:original-expressions-list',
              originalLazyExpressions.map((node) =>
                typeof node !== 'string' ? generator(node).code : node
              )
            );
            debug(
              'lazy-deps:expressions-to-eval-list',
              expressionsToEvaluate.map((node) =>
                typeof node !== 'string' ? generator(node).code : node
              )
            );

            const program = addLinariaPreval(
              babel,
              path,
              expressionsToEvaluate
            );
            const { code } = generator(program);
            debug('lazy-deps:evaluate', '');
            try {
              const evaluation = evaluate(
                code,
                state.file.opts.filename,
                options
              );
              debug('lazy-deps:sub-files', evaluation.dependencies);

              state.dependencies.push(...evaluation.dependencies);
              lazyValues = evaluation.value.__linariaPreval || [];
              debug('lazy-deps:values', evaluation.value.__linariaPreval);
            } catch (e) {
              throw new Error(
                'An unexpected runtime error ocurred during dependencies evaluation: \n' +
                  e.stack +
                  '\n\nIt may happen when your code or third party module is invalid or uses identifiers not available in Node environment, eg. window. \n' +
                  'Note that line numbers in above stack trace will most likely not match, because Linaria needed to transform your code a bit.\n'
              );
            }
          }

          const valueCache: ValueCache = new Map();
          originalLazyExpressions.forEach((key, idx) =>
            valueCache.set(key, lazyValues[idx])
          );
          state.queue.forEach((item) => process(item, state, valueCache));
        },
        exit(_: any, state: State) {
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
