import type { NodePath } from '@babel/core';
import type { Identifier, Program } from '@babel/types';

import { nonType } from './findIdentifiers';
import { isUnnecessaryReactCall } from './isUnnecessaryReactCall';
import { applyAction, removeWithRelated } from './scopeHelpers';
import JSXElementsRemover from './visitors/JSXElementsRemover';

const isGlobal = (id: NodePath<Identifier>): boolean => {
  if (!nonType(id)) {
    return false;
  }

  const { scope } = id;
  const { name } = id.node;
  return !scope.hasBinding(name) && scope.hasGlobal(name);
};

const ssrCheckFields = new Set([
  'document',
  'location',
  'navigator',
  'sessionStorage',
  'localStorage',
  'window',
]);

const forbiddenGlobals = new Set([
  ...ssrCheckFields,
  '$RefreshReg$',
  'XMLHttpRequest',
  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'fetch',
  'navigator',
  'setImmediate',
  'setInterval',
  'setTimeout',
]);

const isBrowserGlobal = (id: NodePath<Identifier>) => {
  return forbiddenGlobals.has(id.node.name) && isGlobal(id);
};

const isSSRCheckField = (id: NodePath<Identifier>) => {
  return ssrCheckFields.has(id.node.name) && isGlobal(id);
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

      // Since we can use happy-dom, typical SSR checks may not work as expected.
      // We need to detect them and replace with an "undefined" literal.
      UnaryExpression(p) {
        if (p.node.operator !== 'typeof') {
          return;
        }
        const arg = p.get('argument');
        if (!arg.isIdentifier() || !isSSRCheckField(arg)) {
          return;
        }

        applyAction([
          'replace',
          p,
          { type: 'StringLiteral', value: 'undefined' },
        ]);
      },
    },
    {
      globals: [] as NodePath<Identifier>[],
      windowScoped: new Set<string>(),
    }
  );
};
