/* @flow */

import type {
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
  BabelVariableDeclarator,
} from './types';

import { resolveExpressions } from './resolvers';
import slugify from '../slugify';

function computeClassName(
  name: string,
  taggedTemplateExpr: BabelTaggedTemplateExpression
): string {
  const classString = taggedTemplateExpr.quasi.quasis
    .reduce((acc: string, quasi): string => {
      return acc.concat(quasi.value.cooked);
    }, '')
    .replace(/(^\s*|\s*$|\s{2,})/g, '');
  return `${name}_${slugify(classString)}`;
}

export default ({ types: t }: { types: BabelTypes }) => ({
  visitor: {
    Program(path: NodePath, state: State) {
      state.filename = state.file.opts.filename;
      state.imports = [];
    },
    ImportDeclaration(path: NodePath, state: State) {
      const source: string = path.node.source.value;
      path.traverse({
        ImportDefaultSpecifier(importPath: NodePath) {
          state.imports.push({
            source,
            isDefault: true,
            name: importPath.node.local.name,
          });
        },
        ImportSpecifier(importPath: NodePath) {
          state.imports.push({
            source,
            isDefault: false,
            name: importPath.node.local
              ? importPath.node.local.name
              : importPath.node.imported.name,
          });
        },
      });
    },
    VariableDeclaration(path: NodePath, state: State) {
      path.node.declarations.forEach((decl: BabelVariableDeclarator) => {
        if (
          t.isCallExpression(decl.init) &&
          decl.init.callee.name === 'require' &&
          decl.init.arguments.length &&
          typeof decl.init.arguments[0].value === 'string'
        ) {
          state.imports.push({
            source: decl.init.arguments[0].value,
            isDefault: t.isIdentifier(decl.id),
            name: decl.id.name,
          });
        } else if (
          t.isCallExpression(decl.init) &&
          decl.init.callee.name === '_interopRequireDefault' &&
          decl.init.arguments.length &&
          typeof decl.init.arguments[0].name === 'string'
        ) {
          const requireImport = decl.init.arguments[0].name;
          if (state.imports.find(({ name }) => name === requireImport)) {
            state.imports.push({
              source: requireImport,
              isDefault: t.isIdentifier(decl.id),
              name: decl.id.name,
              esmInterop: true,
            });
          }
        }
      });
    },
    VariableDeclarator(path: NodePath, state: State) {
      if (
        t.isTaggedTemplateExpression(path.node.init) &&
        path.node.init.tag &&
        path.node.init.tag.name === 'css'
      ) {
        const taggedTemplateExpression: BabelTaggedTemplateExpression = resolveExpressions(
          path.node.init,
          state,
          t
        );

        if (taggedTemplateExpression.quasi.expressions.length) {
          throw new Error(
            'No unresolved expressions in style tagged template literal allowed'
          );
        }

        const className: string = computeClassName(
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
