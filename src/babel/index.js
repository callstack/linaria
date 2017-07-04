/* @flow */

import type {
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
  BabelVariableDeclarator,
  BabelVariableDeclaration,
  BabelTaggedTemplateElement,
} from './types';

import { resolveExpressions } from './resolvers';
import extract from './extractStyles';
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

function joinTaggedTemplateElements(
  taggedTemplateExpr: BabelTaggedTemplateExpression
) {
  taggedTemplateExpr.quasi.quasis = [
    taggedTemplateExpr.quasi.quasis
      .slice(0, -1)
      .reverse()
      .reduce(
        (
          elementAcc: BabelTaggedTemplateElement,
          currElement: BabelTaggedTemplateElement
        ): BabelTaggedTemplateElement => {
          return {
            ...elementAcc,
            value: {
              cooked: `${currElement.value.cooked}${elementAcc.value.cooked}`,
              raw: `${currElement.value.cooked}${elementAcc.value.cooked}`,
            },
          };
        },
        taggedTemplateExpr.quasi.quasis[
          taggedTemplateExpr.quasi.quasis.length - 1
        ]
      ),
  ];
  return taggedTemplateExpr;
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
            sourceFile: source,
          });
        },
        ImportSpecifier(importPath: NodePath<*>) {
          state.imports.push({
            name: importPath.node.local
              ? importPath.node.local.name
              : importPath.node.imported.name,
            isEsm: true,
            isDefault: false,
            sourceFile: source,
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
          // $FlowFixMe `decl` is explicitly check for being a call expession
          decl.init.callee.name === 'require' &&
          // $FlowFixMe `decl` is explicitly check for being a call expession
          decl.init.arguments.length &&
          typeof decl.init.arguments[0].value === 'string'
        ) {
          state.imports.push({
            name: decl.id.name,
            isEsm: false,
            isDefault: t.isIdentifier(decl.id),
            // $FlowFixMe `decl` is explicitly check for being a call expession
            sourceFile: decl.init.arguments[0].value,
          });
        } else if (
          t.isCallExpression(decl.init) &&
          // $FlowFixMe `decl` is explicitly check for being a call expession
          decl.init.callee.name === '_interopRequireDefault' &&
          // $FlowFixMe `decl` is explicitly check for being a call expession
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
        // @TODO: resolve from variable
        const taggedTemplateExpression: BabelTaggedTemplateExpression = resolveExpressions(
          // $FlowFixMe `init` is explicitly check for being a tagged template expression
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
          joinTaggedTemplateElements(taggedTemplateExpression)
        );

        taggedTemplateExpression.tag = t.callExpression(
          t.memberExpression(t.identifier('css'), t.identifier('named')),
          [t.stringLiteral(className)]
        );

        extract(taggedTemplateExpression, state);
      }
    },
  },
});
