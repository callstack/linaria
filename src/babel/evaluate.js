/* @flow */

// $FlowFixMe
const Module = require('module');
const { dirname } = require('path');
const vm = require('vm');
const dedent = require('dedent');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;

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

    const loc = binding.path.node.loc;

    requirements.push({
      result,
      path: binding.path,
      start: loc.start,
      end: loc.end,
    });

    binding.path.traverse({
      Identifier(path) {
        resolve(path, t, requirements);
      },
    });
  }
};

module.exports = function evaluate(
  path /*: any */,
  t /*: any */,
  filename /*: string */
) {
  const requirements = [];

  if (t.isIdentifier(path)) {
    resolve(path, t, requirements);
  } else {
    path.traverse({
      Identifier(path) {
        resolve(path, t, requirements);
      },
    });
  }

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

  const config = {
    // This is required to properly resolve babelrc
    filename,
    presets: [require.resolve('../babel')],
    // Include this plugin to avoid extra config when using { module: false } for webpack
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  };

  const { code } = babel.transformSync(
    dedent`
    require('@babel/register')(${JSON.stringify(config)});

    ${imports.map(node => generator(node).code).join('\n')}

    ${generator(wrapped).code}
  `,
    config
  );

  const mod = new Module(filename);

  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(dirname(filename));

  vm.runInNewContext(code, {
    module: mod,
    require: id => mod.require(id),
  });

  return mod.exports;
};
