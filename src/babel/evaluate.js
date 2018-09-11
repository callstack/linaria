/* @flow */

const vm = require('vm');
const dedent = require('dedent');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;

const found = Symbol('found');

const resolve = (path, requirements) => {
  const binding = path.scope.getBinding(path.node.name);

  if (path.isReferenced() && binding && binding.kind !== 'param') {
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

    if (code && !binding.path[found]) {
      requirements.unshift(code);
      binding.path[found] = true;
      binding.path.traverse({
        Identifier(path) {
          resolve(path, requirements);
        },
      });
    }
  }
};

module.exports = function evaluate(path /*: any */, t /*: any */) {
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
      t.memberExpression(t.thisExpression(), t.identifier('result')),
      path.node
    )
  );

  const { code } = babel.transformSync(dedent`
    require('@babel/register')

    ${requirements.join('\n')}

    ${generator(expression).code}
  `);

  const context = { require, result: undefined };

  vm.runInNewContext(code, context);

  return context.result;
};
