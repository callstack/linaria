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

import { types } from '@babel/core';
import { NodePath, Scope } from '@babel/traverse';
import { expression, statement } from '@babel/template';
import { types as t } from '@babel/core';

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
import ImportDeclaration from './visitors/ImportDeclaration';
import { debug } from './utils/logger';

function isLazyValue(v: ExpressionValue): v is LazyValue {
  return v.kind === ValueType.LAZY;
}

function isNodePath(obj: any): obj is NodePath {
  return obj?.node !== undefined;
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

type IdentifierPath = NodePath<t.ThisExpression | t.Identifier>;

const traverseForIdentifiers = (
  identifierPaths: Array<IdentifierPath> = []
) => ({
  MemberExpression: (path: NodePath<types.MemberExpression>) => {
    console.log('Member Expression');
    if (t.isThisExpression(path.node.object)) {
      identifierPaths.push(path.get('node.object') as IdentifierPath);
    } else {
      path.get('object').traverse(traverseForIdentifiers(identifierPaths));
    }
    path.skip();
  },
  ObjectProperty: (path: NodePath<types.ObjectProperty>) => {
    console.log('Object Property');
    path.get('value').traverse(traverseForIdentifiers(identifierPaths));
    path.skip();
  },

  Identifier: (path: NodePath<types.Identifier>) => {
    console.log('identifier', path.node.name);
    identifierPaths.push(path);
  },
});

const predictDependencyResolveError = (
  path: NodePath<types.TaggedTemplateExpression>
) => {
  const identifierPaths: Array<IdentifierPath> = [];
  console.log(generator(path.node).code);
  path.traverse(traverseForIdentifiers(identifierPaths));

  console.log(
    identifierPaths.map(identifierPath =>
      types.isIdentifier(identifierPath)
        ? (identifierPath.node as types.Identifier).name
        : identifierPath.node.type
    )
  );

  const findNonStaticIdentifiers = (identifierPath: IdentifierPath) => {
    if ((identifierPath.node as types.Identifier).name === 'css') {
      return;
    }

    if (types.isThisExpression(identifierPath)) {
      throw new Error('this identifierPath used');
    }
    // Look for params declarations inside functions, methods, conditions, loops
    const parent = identifierPath.findParent((path: NodePath) => {
      // Nodes that have "params" field
      if (
        types.isFunctionDeclaration(path) ||
        types.isFunctionExpression(path) ||
        types.isArrowFunctionExpression(path) ||
        types.isClassMethod(path) ||
        types.isClassPrivateMethod(path) ||
        types.isObjectMethod(path)
      ) {
        console.log('found function declaration');
        const paramPaths: string[] = [];

        path.traverse({
          BlockStatement: (path: NodePath) => {
            path.skip();
          },
          Identifier: (path: NodePath<types.Identifier>) => {
            paramPaths.push(path.node.name);
          },
        });

        return paramPaths.includes(
          (identifierPath.node as types.Identifier).name
        );
      }
      // Nodes that have "test" field

      // if (types.isC(path)) {
      // }
      return false;
    });

    console.log(
      'Illegal param found in',
      parent !== null ? parent.type : false
    );

    throw parent.buildCodeFrameError('Illegal non-static param declaration');
  };
  identifierPaths.forEach(findNonStaticIdentifiers);
};

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
          debug('extraction:start', state.file.opts.filename);

          // Invalidate cache for module evaluation to get fresh modules
          Module.invalidate();

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            ImportDeclaration: p => ImportDeclaration(p, state),
            TaggedTemplateExpression: p =>
              TaggedTemplateExpression(p, state, options),
          });

          // const localLazyDeps = state.queue.filter(
          //   ({ scope }) => scope !== path.scope
          // );

          // localLazyDeps.forEach(({ path }) => {
          //   console.log(path.parent);
          //   console.warn(
          //     'Ability to use Linaria in local scopes will be restricted in next major version. Please move component/class declaration to top-level scope'
          //   );
          //   console.log(path.buildCodeFrameError().message);
          // });

          state.queue.forEach(({ path, expressionValues }) => {
            if (
              expressionValues
                .filter(isLazyValue)
                .map(v => (isNodePath(v.ex) ? v.ex.node : v.ex)).length > 0
            ) {
              console.log('lazy values detected');
              predictDependencyResolveError(path);
            } else {
              console.log('no lazy values detected');
            }
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
          debug('lazy-deps:count', lazyDeps.length);

          let lazyValues: any[] = [];

          if (lazyDeps.length > 0) {
            debug(
              'lazy-deps:list',
              lazyDeps.map(node =>
                typeof node !== 'string' ? generator(node).code : node
              )
            );

            const program = addLinariaPreval(path, lazyDeps);
            const { code } = generator(program);
            debug('lazy-deps:evaluate', '');
            try {
              const evaluation = evaluate(
                code,
                types,
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

          debug('extraction:end', state.file.opts.filename);
        },
      },
    },
  };
}
