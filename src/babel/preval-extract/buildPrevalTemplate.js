/* @flow */

import prevalPlugin from 'babel-plugin-preval';

import type {
  BabelCore,
  State,
  NodePath,
  BabelTaggedTemplateExpression,
  BabelIdentifier,
  BabelCallExpression,
} from '../types';

/**
 * const header = css`
 *   color: ${header.color};
 * `;
 *
 * const header = preval`
 *   module.exports = css.named('header_slug')`
 *     color: ${header.color}
 *   `;
 * `;
 */

let _prevalPluginInstance = null;

function getPrevalPluginVisitor(babel) {
  if (!_prevalPluginInstance) {
    _prevalPluginInstance = prevalPlugin(babel);
  }

  return _prevalPluginInstance.visitor;
}

function getRelevantModulesCacheKeys(env: ?string) {
  if (env && env === 'production') {
    return [];
  }

  return Object.keys(require.cache).filter(
    moduleId => !/node_modules/.test(moduleId)
  );
}

function clearModulesCache(moduleIds: string[], env: ?string) {
  if (env && env === 'production') {
    return;
  }

  const moduleIdsToRemove = getRelevantModulesCacheKeys().filter(
    moduleId => moduleIds.indexOf(moduleId) === -1
  );

  moduleIdsToRemove.forEach(moduleId => {
    delete require.cache[moduleId];
  });
}

export default function(
  babel: BabelCore,
  path: NodePath<
    BabelTaggedTemplateExpression<BabelIdentifier | BabelCallExpression>
  >,
  state: State,
  requirements: string
) {
  const title = path.parent.id.name;
  const env = process.env.BABEL_ENV || process.env.NODE_ENV;

  const replacement = `
  /* linaria-preval */

  import '${require.resolve('./register')}';
  ${requirements}
  module.exports = ${path
    .getSource()
    .replace(
      /css(?!\.named)/g,
      env === 'production'
        ? `css.named('${title}')`
        : `css.named('${title}', '${state.filename}')`
    )}
  `;

  /* $FlowFixMe */
  path.node.tag.name = 'preval';
  path.node.quasi.quasis[0].value.cooked = replacement;
  path.node.quasi.quasis[0].value.raw = replacement;
  path.node.quasi.quasis = [path.node.quasi.quasis[0]];
  path.node.quasi.expressions = [];

  const moduleIds = getRelevantModulesCacheKeys(env);
  path.parentPath.traverse(getPrevalPluginVisitor(babel), state);
  clearModulesCache(moduleIds, env);

  const variableDeclarationPath = path.findParent(
    babel.types.isVariableDeclaration
  );

  variableDeclarationPath.node.leadingComments = [
    {
      type: 'CommentBlock',
      value: 'linaria-output',
    },
  ];
}
