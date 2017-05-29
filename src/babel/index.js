import slugify from '../slugify';

const computeClassName = (name: string, taggedTemplateExpr): string => {
  const classString = taggedTemplateExpr.quasi.quasis
    .reduce((acc: string, quasi): string => {
      return acc.concat(quasi.value.cooked);
    }, '')
    .replace(/(^\s*|\s*$|\s{2,})/g, '');
  return `${name}_${slugify(classString)}`;
};

export default ({ types: t }) => ({
  visitor: {
    VariableDeclarator(path) {
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
