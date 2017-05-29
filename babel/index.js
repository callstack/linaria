const requireWithInterOp = require('./requireWithInterOp');
const slugify = requireWithInterOp('../build/slugify');

const computeClassName = (name, taggedTemplateExpr) => {
  const classString = taggedTemplateExpr.quasi.quasis
    .reduce((acc, quasi) => {
      return acc.concat(quasi.value.cooked);
    }, '')
    .replace(/(^\s*|\s*$|\s{2,})/g, '');
  debugger;
  return `${name}_${slugify(classString)}`;
};

// const getModulesToRequire = (t, taggedTemplateExpression) =>
//   taggedTemplateExpression.quasi.expressions.filter(
//     expr => t.isMemberExpression(expr) || t.isIdentifier(expr)
//   );

// const requireModules = (t, astBody, modulesToRequire) => {
//   modulesToRequire.forEach(moduleName => {
//     const importDecl = astBody.find(node => {
//       if (!t.isImportDeclaration(node)) {
//         return false;
//       }
//       debugger;
//     });
//   });
// };

module.exports = ({ types: t }) => ({
  visitor: {
    VariableDeclarator(path) {
      if (
        t.isTaggedTemplateExpression(path.node.init) &&
        path.node.init.tag &&
        path.node.init.tag.name === 'css'
      ) {
        const taggedTemplateExpression = path.node.init;
        // const modulesBody = requireModules(
        //   t,
        //   this.file.ast.program.body,
        //   getModulesToRequire(t, taggedTemplateExpression)
        // );

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
