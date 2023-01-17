import type core from '@babel/core';
import type { BabelFile, PluginObj, NodePath } from '@babel/core';
import type { Binding } from '@babel/traverse';
import type {
  VariableDeclarator,
  Program,
  Identifier,
  MemberExpression,
} from '@babel/types';

import { createCustomDebug } from '@linaria/logger';
import type { IExport, IReexport, IState } from '@linaria/utils';
import {
  collectExportsAndImports,
  getFileIdx,
  isRemoved,
  removeWithRelated,
  sideEffectImport,
  reference,
  findActionForNode,
  dereference,
  mutate,
} from '@linaria/utils';

import shouldKeepSideEffect from './utils/shouldKeepSideEffect';

type Core = typeof core;

export interface IShakerOptions {
  keepSideEffects?: boolean;
  ifUnknownExport?: 'error' | 'ignore' | 'reexport-all' | 'skip-shaking';
  onlyExports: string[];
}

export interface IShakerMetadata {
  imports: Map<string, string[]>;
}

export interface IMetadata {
  __linariaShaker: IShakerMetadata;
}

interface NodeWithName {
  name: string;
}

export const hasShakerMetadata = (
  metadata: object | undefined
): metadata is IMetadata =>
  metadata !== undefined && '__linariaShaker' in metadata;

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

  return undefined;
}

const withoutRemoved = <T extends { local: NodePath }>(items: T[]): T[] =>
  items.filter(({ local }) => !isRemoved(local));

function rearrangeExports(
  { types: t }: Core,
  root: NodePath<Program>,
  exportRefs: Map<string, NodePath<MemberExpression>[]>,
  exports: IExport[]
): IExport[] {
  let rearranged = [...exports];
  const rootScope = root.scope;
  exportRefs.forEach((refs, name) => {
    if (refs.length <= 1) {
      return;
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

    rearranged = rearranged.map((exp) =>
      exp.exported === name
        ? {
            ...exp,
            local,
          }
        : exp
    );
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

      const collected = collectExportsAndImports(file.path);
      const sideEffectImports = collected.imports.filter(sideEffectImport);
      log(
        'import-and-exports',
        [
          `imports: ${collected.imports.length} (side-effects: ${sideEffectImports.length})`,
          `exports: ${collected.exports.length}`,
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

      collected.exports.forEach(({ local }) => {
        if (local.isAssignmentExpression()) {
          const left = local.get('left');
          if (left.isIdentifier()) {
            // For some reason babel does not mark id in AssignmentExpression as a reference
            // So we need to do it manually
            reference(left, left, true);
          }
        }
      });

      if (
        onlyExports.length === 1 &&
        onlyExports[0] === '__linariaPreval' &&
        !exports.find((i) => i.exported === '__linariaPreval')
      ) {
        // Fast-lane: if only __linariaPreval is requested, and it's not exported,
        // we can just shake out the whole file
        this.imports = [];
        this.exports = [];
        this.reexports = [];

        file.path.get('body').forEach((p) => {
          p.remove();
        });

        return;
      }
      // Hackaround for packages which include a 'default' export without specifying __esModule; such packages cannot be
      // shaken as they will break interopRequireDefault babel helper
      // See example in shaker-plugin.test.ts
      // Real-world example was found in preact/compat npm package
      if (
        onlyExports.includes('default') &&
        exports.find(({ exported }) => exported === 'default') &&
        !collected.isEsModule
      ) {
        this.imports = collected.imports;
        this.exports = exports;
        this.reexports = collected.reexports;
        return;
      }
      if (!onlyExports.includes('*')) {
        const aliveExports = new Set<IExport | IReexport>();
        const importNames = collected.imports.map(({ imported }) => imported);

        exports.forEach((exp) => {
          if (onlyExports.includes(exp.exported)) {
            aliveExports.add(exp);
          } else if (
            importNames.includes((exp.local.node as NodeWithName).name || '')
          ) {
            aliveExports.add(exp);
          } else if (
            [...aliveExports].some((liveExp) => liveExp.local === exp.local)
          ) {
            // It's possible to export multiple values from a single variable initializer, e.g
            // export const { foo, bar } = baz();
            // We need to treat all of them as used if any of them are used, since otherwise
            // we'll attempt to delete the baz() call
            aliveExports.add(exp);
          }
        });

        collected.reexports.forEach((exp) => {
          if (onlyExports.includes(exp.exported)) {
            aliveExports.add(exp);
          }
        });

        const isAllExportsFound = aliveExports.size === onlyExports.length;
        if (!isAllExportsFound && ifUnknownExport !== 'ignore') {
          if (ifUnknownExport === 'error') {
            throw new Error(
              `Unknown export(s) requested: ${onlyExports.join(',')}`
            );
          }

          if (ifUnknownExport === 'reexport-all') {
            // If there are unknown exports, we have keep alive all re-exports.
            exports.forEach((exp) => {
              if (exp.exported === '*') {
                aliveExports.add(exp);
              }
            });

            collected.reexports.forEach((exp) => {
              if (exp.exported === '*') {
                aliveExports.add(exp);
              }
            });
          }

          if (ifUnknownExport === 'skip-shaking') {
            this.imports = collected.imports;
            this.exports = exports;
            this.reexports = collected.reexports;

            return;
          }
        }

        const forDeleting = [...exports, ...collected.reexports]
          .filter((exp) => !aliveExports.has(exp))
          .map((exp) => exp.local);

        if (!keepSideEffects && sideEffectImports.length > 0) {
          // Remove all imports that don't import something explicitly and should not be kept
          sideEffectImports.forEach((i) => {
            if (!shouldKeepSideEffect(i.source)) {
              forDeleting.push(i.local);
            }
          });
        }

        const deleted = new Set<NodePath>();

        const dereferenced: NodePath<Identifier>[] = [];
        let changed = true;
        while (changed && deleted.size < forDeleting.length) {
          changed = false;
          // eslint-disable-next-line no-restricted-syntax
          for (const path of forDeleting) {
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
                mutate(action[1], (p) => {
                  if (isRemoved(p)) return;

                  if (action[0] === 'remove') {
                    p.remove();
                  } else if (action[0] === 'replace') {
                    p.replaceWith(action[2]);
                  }
                });
              } else {
                removeWithRelated([path]);
              }

              deleted.add(path);
              changed = true;
            }
          }
        }

        dereferenced.forEach((path) => {
          // If path is still alive, we need to reference it back
          if (!isRemoved(path)) {
            reference(path);
          }
        });
      }

      this.imports = withoutRemoved(collected.imports);
      this.exports = withoutRemoved(exports);
      this.reexports = withoutRemoved(collected.reexports);
    },
    visitor: {},
    post(file: BabelFile) {
      const log = createCustomDebug('shaker', getFileIdx(file.opts.filename!));

      const imports = new Map<string, string[]>();
      this.imports.forEach(({ imported, source }) => {
        if (!imports.has(source)) {
          imports.set(source, []);
        }

        if (imported) {
          imports.get(source)!.push(imported);
        }
      });

      this.reexports.forEach(({ imported, source }) => {
        if (!imports.has(source)) {
          imports.set(source, []);
        }

        imports.get(source)!.push(imported);
      });

      log('end', `remaining imports: %O`, imports);

      // eslint-disable-next-line no-param-reassign
      (file.metadata as IMetadata).__linariaShaker = {
        imports,
      };
    },
  };
}
