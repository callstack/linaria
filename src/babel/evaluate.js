/* @flow */

// $FlowFixMe
const Module = require('module');
const { dirname } = require('path');
const vm = require('vm');
const dedent = require('dedent');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;

const resolve = (path, requirements) => {
  const binding = path.scope.getBinding(path.node.name);

  if (
    path.isReferenced() &&
    binding &&
    binding.kind !== 'param' &&
    !requirements.some(req => req.path === binding.path)
  ) {
    let code;

    switch (binding.kind) {
      case 'module':
        code = generator(binding.path.parentPath.node).code;
        break;
      case 'const':
      case 'let':
      case 'var': {
        code = `${binding.kind} ${generator(binding.path.node).code}`;
        break;
      }
      default:
        code = generator(binding.path.node).code;
        break;
    }

    if (code) {
      const loc = binding.path.node.loc;

      requirements.push({
        code,
        path: binding.path,
        start: loc.start,
        end: loc.end,
      });

      binding.path.traverse({
        Identifier(path) {
          resolve(path, requirements);
        },
      });
    }
  }
};

module.exports = function evaluate(
  path /*: any */,
  t /*: any */,
  filename /*: string */
) {
  const requirements = [];

  if (t.isIdentifier(path)) {
    resolve(path, requirements);
  } else {
    path.traverse({
      Identifier(path) {
        resolve(path, requirements);
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

  // Separate out the imports since they cannot be inside blocks
  const imports = requirements.filter(req =>
    t.isImportDeclaration(req.path.parentPath)
  );

  // We'll wrap each code in a block to avoid collisions in variable names
  const rest = requirements.filter(
    req => !t.isImportDeclaration(req.path.parentPath)
  );

  const config = {
    // This is required to properly resolve babelrc
    filename,
    cwd: dirname(filename),
    presets: [require.resolve('../babel')],
    // Include this plugin to avoid extra config when using { module: false } for webpack
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  };

  const { code } = babel.transformSync(
    dedent`
    require('@babel/register')(${JSON.stringify(config)});

    ${imports.map(c => c.code).join('\n')}

    ${rest.map(c => '{\n' + c.code).join('\n')}

    ${generator(expression).code}

    ${rest.map(() => '}').join('\n')}
  `,
    config
  );

  const mod = new Module(filename);

  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(dirname(filename));

  const context = {
    module: mod,
    require: id => mod.require(id),
  };

  vm.runInNewContext(code, context);

  return mod.exports;
};
