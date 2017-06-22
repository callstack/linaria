/* @flow */
import requireFromString from 'require-from-string';
import * as babel from 'babel-core';
import { join, extname, dirname } from 'path';
import slugify from '../slugify';

type NodePath = {
  node: Object,
  parent: Object,
  parentPath: NodePath,
  traverse: (visitor: { [key: string]: Function }) => void,
};

type IsTypeFunction = (value: Object) => boolean;

type BabelTypes = {
  templateElement: Function,
  isTaggedTemplateExpression: Function,
  callExpression: Function,
  isCallExpression: IsTypeFunction,
  memberExpression: Function,
  isMemberExpression: IsTypeFunction,
  identifier: Function,
  isIdentifier: IsTypeFunction,
  stringLiteral: Function,
};

type State = {
  imports: ImportStatement[],
  filename: string,
  file: Object,
};

type ImportStatement = {
  source: string,
  isDefault: boolean,
  name: string,
  esmInterop?: boolean,
};

const importModule = (
  name,
  imports: ImportStatement[],
  relativeTo: string
): ?Object => {
  const importStatement: ?ImportStatement = imports.find(
    importStatement => importStatement.name === name
  );
  if (!importStatement) {
    return null;
  }

  const { source } =
    imports.find(({ name }) => name === importStatement.source) ||
    importStatement;

  debugger;
  let filePath = join(dirname(relativeTo), source);
  if (!extname(filePath).length) {
    filePath += '.js';
  }

  const { code } = babel.transformFileSync(filePath, {
    plugins: ['transform-es2015-modules-commonjs'],
  });
  const importedModule = requireFromString(code, filePath);

  if (typeof importedModule !== 'object') {
    throw new Error(`${filePath} must export an object`);
  }

  return importedModule;
};

const resolveBaseObjectIdentifier = (
  expression: Object,
  t: BabelTypes
): ?Object => {
  let current = expression.object;
  while (current && t.isMemberExpression(current)) {
    current = current.object;
  }
  return current;
};

const resolvePropertyPath = (expression: Object, t: BabelTypes): string[] => {
  const path = [expression.property.name];
  let current = expression.object;
  while (current && t.isMemberExpression(current)) {
    path.unshift(current.property.name);
    current = current.object;
  }
  return path;
};

const resolveValueFromPath = (object: Object, path): ?any => {
  return path.reduce((nextObject: Object, propertyKey: string): ?any => {
    return nextObject ? nextObject[propertyKey] : null;
  }, object);
};

const resolveExpressions = (
  taggedTemplateExpr: Object,
  state: State,
  t: BabelTypes
) => {
  taggedTemplateExpr.quasi.expressions.forEach(
    (expression: Object, index: number) => {
      if (!t.isMemberExpression(expression)) {
        return;
      }
      const baseObjectIdentifier: ?Object = resolveBaseObjectIdentifier(
        expression,
        t
      );
      if (!baseObjectIdentifier) {
        throw new Error(
          'Could not resolve base object, is the template expression a memeber access statement?'
        );
      }

      const associatedModule: ?Object = importModule(
        baseObjectIdentifier.name,
        state.imports,
        state.filename
      );
      if (!associatedModule) {
        throw new Error(
          `Could not find ${baseObjectIdentifier.name} import statement`
        );
      }
      debugger;
      const propertyPath: string[] = resolvePropertyPath(expression, t);
      const value: ?any = resolveValueFromPath(associatedModule, propertyPath);
      taggedTemplateExpr.quasi.quasis.splice(
        index + 1,
        0,
        t.templateElement({ cooked: value, raw: value })
      );
    }
  );
  taggedTemplateExpr.quasi.expressions = [];
  return taggedTemplateExpr;
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
      path.node.declarations.forEach(decl => {
        if (
          t.isCallExpression(decl.init) &&
          decl.init.callee.name === 'require'
        ) {
          state.imports.push({
            source: decl.init.arguments[0].value,
            isDefault: t.isIdentifier(decl.id),
            name: decl.id.name,
          });
        } else if (
          t.isCallExpression(decl.init) &&
          decl.init.callee.name === '_interopRequireDefault'
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
        const taggedTemplateExpression = resolveExpressions(
          path.node.init,
          state,
          t
        );

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
