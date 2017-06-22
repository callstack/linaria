/* @flow */

import type {
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
  BabelVariableDeclarator,
  BabelVariableDeclaration,
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
    Program(path: NodePath<*>, state: State) {
      state.filename = state.file.opts.filename;
      state.imports = [];
    },
    ImportDeclaration(path: NodePath<*>, state: State) {
      // @TODO
      const source: string = path.node.source.value;
      path.traverse({
        ImportDefaultSpecifier(importPath: NodePath<*>) {
          state.imports.push({
            name: importPath.node.local.name,
            isEsm: true,
            isDefault: true,
            sourceFrom: source,
          });
        },
        ImportSpecifier(importPath: NodePath<*>) {
          state.imports.push({
            name: importPath.node.local
              ? importPath.node.local.name
              : importPath.node.imported.name,
            isEsm: true,
            isDefault: false,
            sourceFrom: source,
          });
        },
      });
    },
    VariableDeclaration(
      path: NodePath<BabelVariableDeclaration>,
      state: State
    ) {
      path.node.declarations.forEach((decl: BabelVariableDeclarator) => {
        if (
          t.isCallExpression(decl.init) &&
          decl.init.callee.name === 'require' &&
          decl.init.arguments.length &&
          typeof decl.init.arguments[0].value === 'string'
        ) {
          state.imports.push({
            name: decl.id.name,
            isEsm: false,
            isDefault: t.isIdentifier(decl.id),
            // $FlowFixMe
            sourceFile: decl.init.arguments[0].value,
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
              name: decl.id.name,
              isEsm: false,
              isDefault: t.isIdentifier(decl.id),
              isEsmInterop: true,
              sourceFrom: requireImport,
            });
          }
        }
      });
    },
    VariableDeclarator(path: NodePath<BabelVariableDeclarator>, state: State) {
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
