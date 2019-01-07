/* @flow */

import type { Options as PluginOptions } from './extract';

const generator = require('@babel/generator').default;
const babel = require('@babel/core');
const Module = require('./module');

const resolve = (path, t, requirements) => {
  const binding = path.scope.getBinding(path.node.name);

  if (
    path.isReferenced() &&
    binding &&
    binding.kind !== 'param' &&
    !requirements.some(req => req.path === binding.path)
  ) {
    let result;

    switch (binding.kind) {
      case 'module':
        if (t.isImportSpecifier(binding.path)) {
          result = t.importDeclaration(
            [binding.path.node],
            binding.path.parentPath.node.source
          );
        } else {
          result = binding.path.parentPath.node;
        }
        break;
      case 'const':
      case 'let':
      case 'var': {
        result = t.variableDeclaration(binding.kind, [binding.path.node]);
        break;
      }
      default:
        result = binding.path.node;
        break;
    }

    const { loc } = binding.path.node;

    requirements.push({
      result,
      path: binding.path,
      start: loc.start,
      end: loc.end,
    });

    binding.path.traverse({
      Identifier(p) {
        resolve(p, t, requirements);
      },
    });
  }
};

module.exports = function evaluate(
  path: any,
  t: any,
  filename: string,
  transformer?: (text: string) => { code: string },
  options?: PluginOptions
) {
  const requirements = [];

  if (t.isIdentifier(path)) {
    resolve(path, t, requirements);
  } else {
    path.traverse({
      Identifier(p) {
        resolve(p, t, requirements);
      },
    });
  }

  // Collect the list of dependencies that we import
  const dependencies = requirements.reduce((deps, req) => {
    if (t.isImportDeclaration(req.path.parentPath)) {
      deps.push(req.path.parentPath.node.source.value);
    } else {
      req.path.traverse({
        CallExpression(p) {
          const { callee, arguments: args } = p.node;

          let name;

          if (callee.name === 'require' && args.length === 1) {
            if (
              args[0].type === 'Literal' ||
              args[0].type === 'StringLiteral'
            ) {
              name = args[0].value;
            } else if (
              args[0].type === 'TemplateLiteral' &&
              args[0].quasis.length === 1
            ) {
              name = args[0].quasis[0].value.cooked;
            }
          }

          if (name) {
            deps.push(name);
          }
        },
      });
    }

    return deps;
  }, []);

  const expression = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.identifier('module'), t.identifier('exports')),
      path.node
    )
  );

  // Preserve source order
  requirements.sort((a, b) => {
    if (a.start.line === b.start.line) {
      return a.start.column - b.start.column;
    }

    return a.start.line - b.start.line;
  });

  // We'll wrap each code in a block to avoid collisions in variable names
  // We separate out the imports since they cannot be inside blocks
  const { imports, others } = requirements.reduce(
    (acc, curr) => {
      if (t.isImportDeclaration(curr.path.parentPath)) {
        acc.imports.push(curr.result);
      } else {
        // Add these in reverse because we'll need to wrap in block statements in reverse
        acc.others.unshift(curr.result);
      }

      return acc;
    },
    { imports: [], others: [] }
  );

  const wrapped = others.reduce(
    (acc, curr) => t.blockStatement([curr, acc]),
    t.blockStatement([expression])
  );

  const m = new Module(filename);

  m.transform =
    typeof transformer !== 'undefined'
      ? transformer
      : function transform(text) {
          if (options && options.ignore && options.ignore.test(this.filename)) {
            return { code: text };
          }

          return babel.transformSync(text, {
            caller: { name: 'linaria', evaluate: true },
            filename: this.filename,
            presets: [[require.resolve('./index'), options]],
            plugins: [
              // Include this plugin to avoid extra config when using { module: false } for webpack
              '@babel/plugin-transform-modules-commonjs',
              '@babel/plugin-proposal-export-namespace-from',
              // We don't support dynamic imports when evaluating, but don't wanna syntax error
              // This will replace dynamic imports with an object that does nothing
              require.resolve('./dynamic-import-noop'),
            ],
          });
        };

  m.evaluate(
    [
      // Use String.raw to preserve escapes such as '\n' in the code
      // Flow doesn't understand template tags: https://github.com/facebook/flow/issues/2616
      /* $FlowFixMe */
      imports.map(node => String.raw`${generator(node).code}`).join('\n'),
      /* $FlowFixMe */
      String.raw`${generator(wrapped).code}`,
    ].join('\n')
  );

  return {
    value: m.exports,
    dependencies,
  };
};
