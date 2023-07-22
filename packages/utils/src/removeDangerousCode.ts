import type { NodePath } from '@babel/core';
import type { Identifier, Program } from '@babel/types';

import { nonType } from './findIdentifiers';
import isUnnecessaryReactCall from './isUnnecessaryReactCall';
import { removeWithRelated } from './scopeHelpers';
import JSXElementsRemover from './visitors/JSXElementsRemover';

const isGlobal = (id: NodePath<Identifier>): boolean => {
  if (!nonType(id)) {
    return false;
  }

  const { scope } = id;
  const { name } = id.node;
  return !scope.hasBinding(name) && scope.hasGlobal(name);
};

const forbiddenGlobals = new Set([
  'XMLHttpRequest',
  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'document',
  'fetch',
  'localStorage',
  'location',
  'navigator',
  'sessionStorage',
  'setImmediate',
  'setInterval',
  'setTimeout',
  'window',
]);

const isBrowserGlobal = (id: NodePath<Identifier>) => {
  return forbiddenGlobals.has(id.node.name) && isGlobal(id);
};

const getPropertyName = (path: NodePath): string | null => {
  if (path.isIdentifier()) {
    return path.node.name;
  }

  if (path.isStringLiteral()) {
    return path.node.value;
  }

  return null;
};

export const removeDangerousCode = (programPath: NodePath<Program>) => {
  programPath.traverse(
    {
      // JSX can be replaced with a dummy value,
      // but we have to do it after we processed template tags.
      CallExpression: {
        enter(p) {
          if (isUnnecessaryReactCall(p)) {
            JSXElementsRemover(p);
          }
        },
      },
      JSXElement: {
        enter: JSXElementsRemover,
      },
      JSXFragment: {
        enter: JSXElementsRemover,
      },
      MemberExpression(p, state) {
        const obj = p.get('object');
        const prop = p.get('property');
        if (!obj.isIdentifier({ name: 'window' })) {
          return;
        }

        const name = getPropertyName(prop);
        if (!name) {
          return;
        }

        state.windowScoped.add(name);
        // eslint-disable-next-line no-param-reassign
        state.globals = state.globals.filter((id) => {
          if (id.node.name === name) {
            removeWithRelated([id]);
            return false;
          }

          return true;
        });
      },
      MetaProperty(p) {
        // Remove all references to `import.meta`
        removeWithRelated([p]);
      },
      Identifier(p, state) {
        if (p.find((parent) => parent.isTSTypeReference())) {
          // don't mess with TS type references
          return;
        }
        if (isBrowserGlobal(p)) {
          if (
            p.find(
              (parentPath) =>
                parentPath.isUnaryExpression({ operator: 'typeof' }) ||
                parentPath.isTSTypeQuery()
            )
          ) {
            // Ignore `typeof window` expressions
            return;
          }

          if (p.parentPath.isClassProperty()) {
            // ignore class property decls
            return;
          }
          if (p.parentPath.isMemberExpression() && p.key === 'property') {
            // ignore e.g this.fetch()
            // window.fetch will be handled by the windowScoped block below
            return;
          }

          removeWithRelated([p]);

          return;
        }

        if (state.windowScoped.has(p.node.name)) {
          removeWithRelated([p]);
        } else if (isGlobal(p)) {
          state.globals.push(p);
        }
      },
    },
    {
      globals: [] as NodePath<Identifier>[],
      windowScoped: new Set<string>(),
    }
  );
};
