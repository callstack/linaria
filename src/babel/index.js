/* @flow */

import slugify from '../slugify';

type NodePath = {
  node: Object,
  parent: Object,
  parentPath: NodePath,
};

type BabelTypes = {
  isTaggedTemplateExpression: Function,
  callExpression: Function,
  memberExpression: Function,
  identifier: Function,
  stringLiteral: Function,
};

const computeClassName = (name: string, taggedTemplateExpr): string => {
  const classString = taggedTemplateExpr.quasi.quasis
    .reduce((acc: string, quasi): string => {
      return acc.concat(quasi.value.cooked);
    }, '')
    .replace(/(^\s*|\s*$|\s{2,})/g, '');
  return `${name}_${slugify(classString)}`;
};

export default ({ types: t }: { types: BabelTypes }) => ({
  visitor: {
    VariableDeclarator(path: NodePath) {
      if (
        t.isTaggedTemplateExpression(path.node.init) &&
        path.node.init.tag &&
        path.node.init.tag.name === 'css'
      ) {
        const taggedTemplateExpression = path.node.init;

        if (taggedTemplateExpression.quasi.expressions.length) {
          throw new Error(
            'No unresolved expressions in style tagged template literal allowed'
          );
        }

        const className = computeClassName(
          path.node.id.name,
          taggedTemplateExpression
        );

        taggedTemplateExpression.tag = t.callExpression(
          t.memberExpression(t.identifier('css'), t.identifier('named')),
          [t.stringLiteral(className)]
        );
      }
    },
  },
});
