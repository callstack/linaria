import type core from '@babel/core';
import type { BabelFile, PluginObj, NodePath } from '@babel/core';
import type { Binding } from '@babel/traverse';
import type {
  Identifier,
  MemberExpression,
  Program,
  VariableDeclarator,
} from '@babel/types';

import { createCustomDebug } from '@linaria/logger';
import type { Exports, IMetadata, IState } from '@linaria/utils';
import {
  applyAction,
  collectExportsAndImports,
  dereference,
  findActionForNode,
  getFileIdx,
  invalidateTraversalCache,
  isRemoved,
  reference,
  removeWithRelated,
  sideEffectImport,
} from '@linaria/utils';

import shouldKeepSideEffect from './utils/shouldKeepSideEffect';

type Core = typeof core;

export interface IShakerOptions {
  ifUnknownExport?: 'error' | 'ignore' | 'reexport-all' | 'skip-shaking';
  keepSideEffects?: boolean;
  onlyExports: string[];
}

interface NodeWithName {
  name: string;
}

function getBindingForExport(exportPath: NodePath): Binding | undefined {
  if (exportPath.isIdentifier()) {
    return exportPath.scope.getBinding(exportPath.node.name);
  }

  const variableDeclarator = exportPath.findParent((p) =>
    p.isVariableDeclarator()
  ) as NodePath<VariableDeclarator> | undefined;
  if (variableDeclarator) {
    const id = variableDeclarator.get('id');
    if (id.isIdentifier()) {
      return variableDeclarator.scope.getBinding(id.node.name);
    }
  }

  if (exportPath.isAssignmentExpression()) {
    const left = exportPath.get('left');
    if (left.isIdentifier()) {
      return exportPath.scope.getBinding(left.node.name);
    }
  }

  if (exportPath.isFunctionDeclaration() || exportPath.isClassDeclaration()) {
    return exportPath.scope.getBinding(exportPath.node.id!.name);
  }

  return undefined;
}

const withoutRemoved = <T extends { local: NodePath }>(items: T[]): T[] =>
  items.filter(({ local }) => !isRemoved(local));

function rearrangeExports(
  { types: t }: Core,
  root: NodePath<Program>,
  exportRefs: Map<string, NodePath<MemberExpression>[]>,
  exports: Exports
): Exports {
  const rearranged = {
    ...exports,
  };

  const rootScope = root.scope;
  exportRefs.forEach((refs, name) => {
    if (refs.length <= 1) {
      if (refs.length === 1) {
        // Maybe exports is assigned to another variable?
        const declarator = refs[0].findParent((p) =>
          p.isVariableDeclarator()
        ) as NodePath<VariableDeclarator> | undefined;

        if (!declarator) {
          return;
        }
      } else {
        return;
      }
    }

    const uid = rootScope.generateUid(name);
    // Define variable in the beginning
    const [declaration] = root.unshiftContainer('body', [
      t.variableDeclaration('var', [t.variableDeclarator(t.identifier(uid))]),
    ]);

    rootScope.registerDeclaration(declaration);

    // Replace every reference with defined variable
    refs.forEach((ref) => {
      const [replaced] = ref.replaceWith(t.identifier(uid));
      if (replaced.isBindingIdentifier()) {
        rootScope.registerConstantViolation(replaced);
        if (replaced.parentPath?.parentPath?.isVariableDeclarator()) {
          // This is `const foo = exports.foo = "value"` case
          reference(replaced, replaced, true);
        }
      } else {
        reference(replaced);
      }
    });

    // Assign defined variable to the export
    const [pushed] = root.pushContainer('body', [
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(t.identifier('exports'), t.identifier(name)),
          t.identifier(uid)
        )
      ),
    ]);

    const local = pushed.get('expression.right') as NodePath<Identifier>;
    reference(local);

    rearranged[name] = local;
  });

  return rearranged;
}

export default function shakerPlugin(
  babel: Core,
  {
    keepSideEffects = false,
    ifUnknownExport = 'skip-shaking',
    onlyExports,
  }: IShakerOptions
): PluginObj<IState & { filename: string }> {
  return {
    name: '@linaria/shaker',
    pre(file: BabelFile) {
      this.filename = file.opts.filename!;
      const log = createCustomDebug('shaker', getFileIdx(this.filename));

      log('start', `${this.filename}, onlyExports: ${onlyExports.join(',')}`);
      const onlyExportsSet = new Set(onlyExports);

      const collected = collectExportsAndImports(file.path);
      const sideEffectImports = collected.imports.filter(sideEffectImport);
      log(
        'import-and-exports',
        [
          `imports: ${collected.imports.length} (side-effects: ${sideEffectImports.length})`,
          `exports: ${Object.values(collected.exports).length}`,
          `reexports: ${collected.reexports.length}`,
        ].join(', ')
      );

      // We cannot just throw out exports if they are referred in the code
      // Let's dome some replacements
      const exports = rearrangeExports(
        babel,
        file.path,
        collected.exportRefs,
        collected.exports
      );

      Object.values(exports).forEach((local) => {
        if (local.isAssignmentExpression()) {
          const left = local.get('left');
          if (left.isIdentifier()) {
            // For some reason babel does not mark id in AssignmentExpression as a reference
            // So we need to do it manually
            reference(left, left, true);
          }
        }
      });

      const hasLinariaPreval = exports.__linariaPreval !== undefined;
      const hasDefault = exports.default !== undefined;

      // If __linariaPreval is not exported, we can remove it from onlyExports
      if (onlyExportsSet.has('__linariaPreval') && !hasLinariaPreval) {
        onlyExportsSet.delete('__linariaPreval');
      }

      if (onlyExportsSet.size === 0) {
        // Fast-lane: if there are no exports to keep, we can just shake out the whole file
        this.imports = [];
        this.exports = {};
        this.reexports = [];
        this.deadExports = Object.keys(exports);

        file.path.get('body').forEach((p) => {
          p.remove();
        });

        return;
      }

      const importedAsSideEffect = onlyExportsSet.has('side-effect');
      onlyExportsSet.delete('side-effect');

      // Hackaround for packages which include a 'default' export without specifying __esModule; such packages cannot be
      // shaken as they will break interopRequireDefault babel helper
      // See example in shaker-plugin.test.ts
      // Real-world example was found in preact/compat npm package
      if (
        onlyExportsSet.has('default') &&
        hasDefault &&
        !collected.isEsModule
      ) {
        this.imports = collected.imports;
        this.exports = exports;
        this.reexports = collected.reexports;
        this.deadExports = [];
        return;
      }

      if (!onlyExportsSet.has('*')) {
        // __esModule should be kept alive
        onlyExportsSet.add('__esModule');

        const aliveExports = new Set<NodePath>();
        const importNames = collected.imports.map(({ imported }) => imported);

        Object.entries(exports).forEach(([exported, local]) => {
          if (onlyExportsSet.has(exported)) {
            aliveExports.add(local);
          } else if (
            importNames.includes((local.node as NodeWithName).name || '')
          ) {
            aliveExports.add(local);
          } else if ([...aliveExports].some((alive) => alive === local)) {
            // It's possible to export multiple values from a single variable initializer, e.g
            // export const { foo, bar } = baz();
            // We need to treat all of them as used if any of them are used, since otherwise
            // we'll attempt to delete the baz() call
            aliveExports.add(local);
          }
        });

        collected.reexports.forEach((exp) => {
          if (onlyExportsSet.has(exp.exported)) {
            aliveExports.add(exp.local);
          }
        });

        const exportToPath = new Map<string, NodePath>();
        Object.entries(exports).forEach(([exported, local]) => {
          exportToPath.set(exported, local);
        });

        collected.reexports.forEach((exp) => {
          exportToPath.set(exp.exported, exp.local);
        });

        const notFoundExports = [...onlyExportsSet].filter(
          (exp) =>
            exp !== '__esModule' && !aliveExports.has(exportToPath.get(exp)!)
        );
        exportToPath.clear();

        const isAllExportsFound = notFoundExports.length === 0;
        if (!isAllExportsFound && ifUnknownExport !== 'ignore') {
          if (ifUnknownExport === 'error') {
            throw new Error(
              `Unknown export(s) requested: ${onlyExports.join(',')}`
            );
          }

          if (ifUnknownExport === 'reexport-all') {
            // If there are unknown exports, we have keep alive all re-exports.
            if (exports['*'] !== undefined) {
              aliveExports.add(exports['*']);
            }

            collected.reexports.forEach((exp) => {
              if (exp.exported === '*') {
                aliveExports.add(exp.local);
              }
            });
          }

          if (ifUnknownExport === 'skip-shaking') {
            this.imports = collected.imports;
            this.exports = exports;
            this.reexports = collected.reexports;
            this.deadExports = [];

            return;
          }
        }

        const forDeleting = [
          ...Object.values(exports),
          ...collected.reexports.map((i) => i.local),
        ].filter((exp) => !aliveExports.has(exp));

        if (!keepSideEffects && !importedAsSideEffect) {
          // Remove all imports that don't import something explicitly and should not be kept
          sideEffectImports.forEach((i) => {
            if (!shouldKeepSideEffect(i.source)) {
              forDeleting.push(i.local);
            }
          });
        }

        const deleted = new Set<NodePath>();

        let dereferenced: NodePath<Identifier>[] = [];
        let changed = true;
        while (changed && deleted.size < forDeleting.length) {
          changed = false;
          // eslint-disable-next-line no-restricted-syntax
          for (const path of forDeleting) {
            if (deleted.has(path)) {
              // eslint-disable-next-line no-continue
              continue;
            }

            const binding = getBindingForExport(path);
            const action = findActionForNode(path);
            const parent = action?.[1];
            const outerReferences = (binding?.referencePaths || []).filter(
              (ref) => ref !== parent && !parent?.isAncestor(ref)
            );
            if (outerReferences.length > 0 && path.isIdentifier()) {
              // Temporary deref it in order to simplify further checks.
              dereference(path);
              dereferenced.push(path);
            }

            if (
              !deleted.has(path) &&
              (!binding || outerReferences.length === 0)
            ) {
              if (action) {
                applyAction(action);
              } else {
                removeWithRelated([path]);
              }

              deleted.add(path);
              changed = true;
            }
          }

          dereferenced.forEach((path) => {
            // If path is still alive, we need to reference it back
            if (!isRemoved(path)) {
              reference(path);
            }
          });

          dereferenced = [];
        }
      }

      this.imports = withoutRemoved(collected.imports);
      this.exports = {};
      this.deadExports = [];

      Object.entries(exports).forEach(([exported, local]) => {
        if (isRemoved(local)) {
          this.deadExports.push(exported);
        } else {
          this.exports[exported] = local;
        }
      });

      this.reexports = withoutRemoved(collected.reexports);
    },
    visitor: {},
    post(file: BabelFile) {
      const log = createCustomDebug('shaker', getFileIdx(file.opts.filename!));

      const processedImports = new Set<string>();
      const imports = new Map<string, string[]>();
      const addImport = ({
        imported,
        source,
      }: {
        imported: string;
        source: string;
      }) => {
        if (processedImports.has(`${source}:${imported}`)) {
          return;
        }

        if (!imports.has(source)) {
          imports.set(source, []);
        }

        if (imported) {
          imports.get(source)!.push(imported);
        }

        processedImports.add(`${source}:${imported}`);
      };

      this.imports.forEach(addImport);
      this.reexports.forEach(addImport);

      log('end', `remaining imports: %O`, imports);

      // eslint-disable-next-line no-param-reassign
      (file.metadata as IMetadata).linariaEvaluator = {
        imports,
      };

      invalidateTraversalCache(file.path);
    },
  };
}
