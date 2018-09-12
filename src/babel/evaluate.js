/* @flow */

const { resolve: resolvePath, dirname } = require('path');
const vm = require('vm');
const dedent = require('dedent');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;

const VM_EVALUATION_RESULT = '$$_vm_evaluation_result';

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
      t.memberExpression(
        t.identifier(VM_EVALUATION_RESULT),
        t.identifier('value')
      ),
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

  const { code } = babel.transformSync(
    dedent`
    require('@babel/register')

    ${imports.map(c => c.code).join('\n')}

    ${rest.map(c => '{\n' + c.code).join('\n')}

    ${generator(expression).code}

    ${rest.map(() => '}').join('\n')}
  `,
    {
      // This is required to make babelrc work
      filename,
    }
  );

  const context = {
    require: id =>
      /* $FlowFixMe */
      require(id.startsWith('.') ? resolvePath(dirname(filename), id) : id),
    [VM_EVALUATION_RESULT]: {},
  };

  vm.runInNewContext(code, context);

  return context[VM_EVALUATION_RESULT].value;
};
