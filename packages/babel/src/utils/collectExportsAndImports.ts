import type { NodePath } from '@babel/traverse';
import type {
  CallExpression,
  ExportNamedDeclaration,
  ExportSpecifier,
  Identifier,
  Import,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  MemberExpression,
  ObjectPattern,
  Program,
  StringLiteral,
  VariableDeclarator,
} from '@babel/types';

import { warn } from '@linaria/logger';
import type {
  ExportDefaultSpecifier,
  ExportNamespaceSpecifier,
} from '@babel/types';

interface IImportSpecifier {
  imported: string | '=' | '*';
  local: NodePath<Identifier | MemberExpression>;
}

export interface IImport extends IImportSpecifier {
  source: string;
}

export interface IExport {
  exported: string;
  local: NodePath;
}

export interface IState {
  imports: IImport[];
  exports: IExport[];
}

const safeResolve = (name: string): string => {
  try {
    return require.resolve(name);
  } catch (e: unknown) {
    return name;
  }
};

function getValue({ node }: { node: Identifier | StringLiteral }): string {
  return node.type === 'Identifier' ? node.name : node.value;
}

// We only need value imports. Type imports can be ignored.
const isExportKindIsValue = <
  T extends { node: { exportKind?: 'value' | unknown } }
>(
  p: T
): p is T & { node: { exportKind: 'value' } } =>
  !p.node.exportKind || p.node.exportKind === 'value';

// We only need value exports. Type exprots can be ignored.
const isImportKindIsValue = <
  T extends { node: { importKind?: 'value' | unknown } }
>(
  p: T
): p is T & { node: { importKind: 'value' } } =>
  !p.node.importKind || p.node.importKind === 'value';

// Force TypeScript to check, that we have implementation for every possible specifier
type SpecifierTypes = ImportDeclaration['specifiers'][number];
const collectors: {
  [K in SpecifierTypes['type']]: (
    path: NodePath<SpecifierTypes & { type: K }>
  ) => IImportSpecifier[];
} = {
  ImportSpecifier(path: NodePath<ImportSpecifier>): IImportSpecifier[] {
    if (!isImportKindIsValue(path)) return [];
    const imported = getValue(path.get('imported'));
    const local = path.get('local');
    return [{ imported, local }];
  },

  ImportDefaultSpecifier(
    path: NodePath<ImportDefaultSpecifier>
  ): IImportSpecifier[] {
    const local = path.get('local');
    return [{ imported: '=', local }];
  },

  ImportNamespaceSpecifier(
    path: NodePath<ImportNamespaceSpecifier>
  ): IImportSpecifier[] {
    const local = path.get('local');
    return [{ imported: '*', local }];
  },
};

function collectFromImportDeclaration(
  path: NodePath<ImportDeclaration>,
  state: IState
): void {
  // If importKind is specified, and it's not a value, ignore that import
  if (!isImportKindIsValue(path)) return;

  const source = safeResolve(getValue(path.get('source')));
  path
    .get('specifiers')
    .forEach(<T extends SpecifierTypes>(specifier: NodePath<T>) => {
      if (specifier.isImportSpecifier() && !isImportKindIsValue(specifier))
        return;

      const collector = collectors[
        specifier.node.type
      ] as typeof collectors[T['type']];

      state.imports.push(
        ...collector(specifier).map((item) => ({ ...item, source }))
      );
    });
}

interface IDestructed {
  what: string | '*';
  as: NodePath<Identifier | MemberExpression>;
}

function whatIsDestructed(path: NodePath<ObjectPattern>): IDestructed[] {
  const destructedProps: IDestructed[] = [];
  const properties = path.get('properties');
  properties.forEach((property) => {
    if (property.isObjectProperty()) {
      const key = property.get('key');
      if (!key.isIdentifier() && !key.isStringLiteral()) return;
      const what = getValue(key);

      const as = property.get('value');
      if (!as.isIdentifier()) return;

      destructedProps.push({ what, as });

      return;
    }

    // If it is not an ObjectProperty, it is a RestElement
    // In such case it is the same as importing the whole namespace
    if (property.isRestElement()) {
      const arg = property.get('argument');
      if (!arg.isIdentifier()) {
        // some unexpected type of argument
        return;
      }

      destructedProps.push({
        as: arg,
        what: '*',
      });

      return;
    }

    warn(
      'evaluator:collectExportsAndImports',
      'Unknown type of property:',
      property.node.type
    );
  });

  return destructedProps;
}

function fromVariableDeclarator(
  path: NodePath<VariableDeclarator>,
  isSync: boolean
): IDestructed[] {
  const id = path.get('id');
  if (id.isIdentifier()) {
    // It's the simplest case when the full namespace is imported
    return [
      {
        as: id,
        what: '*',
      },
    ];
  }

  if (!isSync) {
    // Something went wrong
    // Is it something like `const { … } = import(…)`?
    warn('evaluator:collectExportsAndImports', '`import` should be awaited');
    return [];
  }

  if (id.isObjectPattern()) {
    return whatIsDestructed(id);
  }

  // What else it can be?
  warn(
    'evaluator:collectExportsAndImports',
    'Unknown type of id',
    id.node.type
  );

  return [];
}

function collectFromDynamicImport(path: NodePath<Import>, state: IState): void {
  const { parentPath: callExpression } = path;
  if (!callExpression.isCallExpression()) {
    // It's wrong `import`
    return;
  }

  const [sourcePath] = callExpression.get('arguments');
  if (!sourcePath || !sourcePath.isStringLiteral()) {
    // Import should have at least one argument, and it should be StringLiteral
    return;
  }

  const source = safeResolve(sourcePath.node.value);

  let { parentPath: container, key } = callExpression;
  let isAwaited = false;

  if (container.isAwaitExpression()) {
    // If it's not awaited import, it imports the full namespace
    isAwaited = true;
    key = container.key;
    container = container.parentPath!;
  }

  // Is it `const something = await import("something")`?
  if (key === 'init' && container.isVariableDeclarator()) {
    fromVariableDeclarator(container, isAwaited).map((prop) =>
      state.imports.push({ imported: prop.what, local: prop.as, source })
    );

    return;
  }
}

function getImportTypeByInteropFunction(
  path: NodePath<CallExpression>
): '*' | '=' | undefined {
  const callee = path.get('callee');
  if (!callee.isIdentifier()) {
    return;
  }

  const { name } = callee.node;
  if (name.startsWith('_interopRequireDefault')) {
    return '=';
  }

  if (name.startsWith('_interopRequireWildcard')) {
    return '*';
  }

  return;
}

function collectFromRequire(path: NodePath<Identifier>, state: IState): void {
  if (path.node.name !== 'require') return;
  const binding = path.scope.getBinding('require');
  if (binding) {
    // It is not global require
    return;
  }

  const { parentPath: callExpression } = path;
  if (!callExpression.isCallExpression()) {
    // It's wrong `require`
    return;
  }

  const [sourcePath] = callExpression.get('arguments');
  if (!sourcePath || !sourcePath.isStringLiteral()) {
    // Import should have at least one argument, and it should be StringLiteral
    return;
  }

  const source = safeResolve(sourcePath.node.value);

  const { parentPath: container, key } = callExpression;

  if (container.isCallExpression() && key === 0) {
    // It may be transpiled import such as
    // `var _atomic = _interopRequireDefault(require("@linaria/atomic"));`
    const imported = getImportTypeByInteropFunction(container);
    if (!imported) {
      // It's not a transpiled import.
      // TODO: Can we guess that it's a namespace import?
      warn(
        'evaluator:collectExportsAndImports',
        'Unknown wrapper of require',
        container.node.callee
      );
      return;
    }

    const { parentPath: variableDeclarator } = container;
    if (!variableDeclarator.isVariableDeclarator()) {
      // TODO: Where else it can be?
      warn(
        'evaluator:collectExportsAndImports',
        'Unexpected require inside',
        variableDeclarator.node.type
      );
      return;
    }

    const id = variableDeclarator.get('id');
    if (!id.isIdentifier()) {
      warn(
        'evaluator:collectExportsAndImports',
        'Id should be Identifier',
        variableDeclarator.node.type
      );
      return;
    }

    state.imports.push({
      imported,
      local: id,
      source,
    });
  }

  // Is it `const something = require("something")`?
  if (key === 'init' && container.isVariableDeclarator()) {
    fromVariableDeclarator(container, true).map((prop) =>
      state.imports.push({ imported: prop.what, local: prop.as, source })
    );

    return;
  }
}

function unfoldNamespaceImports(imports: IImport[]): IImport[] {
  const result: IImport[] = [];
  for (const importItem of imports) {
    if (importItem.imported === '*') {
      const { local } = importItem;
      if (!local.isIdentifier()) {
        // TODO: handle it
        result.push(importItem);
        continue;
      }

      const binding = local.scope.getBinding(local.node.name);
      if (!binding?.referenced) {
        // Imported namespace is not referenced and probably not used,
        // but it can have side effects, so we should keep it as is
        result.push(importItem);
        continue;
      }

      for (const referencePath of binding!.referencePaths ?? []) {
        const { parentPath } = referencePath;
        if (
          parentPath?.isMemberExpression() &&
          referencePath.key === 'object'
        ) {
          const property = parentPath.get('property');
          if (property.isIdentifier()) {
            const name = property.node.name;
            result.push({
              ...importItem,
              imported: name === 'default' ? '=' : name,
              local: parentPath, // TODO: try to resolve identifier
            });

            continue;
          }

          // Otherwise, we can't predict usage and import it as is
          result.push(importItem);
          break;
        }

        if (
          parentPath?.isVariableDeclarator() &&
          referencePath.key === 'init'
        ) {
          fromVariableDeclarator(parentPath, true).map((prop) =>
            result.push({ ...importItem, ...prop })
          );

          continue;
        }

        // Otherwise, we can't predict usage and import it as is
        // TODO: handle more cases
        warn(
          'evaluator:unfoldNamespaceImports',
          'Unknown reference',
          referencePath.node.type
        );
        result.push(importItem);
        break;
      }
    } else {
      result.push(importItem);
    }
  }

  return result;
}

function collectFromExportSpecifier(
  path: NodePath<
    ExportSpecifier | ExportDefaultSpecifier | ExportNamespaceSpecifier
  >,
  state: IState
): void {
  if (path.isExportSpecifier()) {
    const local = path.get('local');
    const exported = getValue(path.get('exported'));
    state.exports.push({ local, exported });
    return;
  }

  // TODO: handle other cases
  warn(
    'evaluator:collectExportsAndImports',
    'Unprocessed ExportSpecifier',
    path.node.type
  );
}

function collectFromExportNamedDeclaration(
  path: NodePath<ExportNamedDeclaration>,
  state: IState
): void {
  if (!isExportKindIsValue(path)) return;

  const specifiers = path.get('specifiers');
  if (specifiers) {
    specifiers.forEach((specifier) =>
      collectFromExportSpecifier(specifier, state)
    );
  }

  const declaration = path.get('declaration');
  if (declaration.isVariableDeclaration()) {
    declaration.get('declarations').forEach((declarator) => {
      fromVariableDeclarator(declarator, true).forEach((prop) => {
        // What is defined
        state.exports.push({ exported: prop.what, local: prop.as });
      });
    });
  }
}

export default function collectExportsAndImports(program: NodePath<Program>) {
  const state: IState = {
    imports: [],
    exports: [],
  };

  program.traverse(
    {
      ExportNamedDeclaration: collectFromExportNamedDeclaration,
      ImportDeclaration: collectFromImportDeclaration,
      Import: collectFromDynamicImport,
      Identifier: collectFromRequire,
    },
    state
  );

  state.imports = unfoldNamespaceImports(state.imports);

  return state;
}
