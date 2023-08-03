import type { NodePath, PluginObj } from '@babel/core';

import type { Core } from '../babel';

/**
 * The plugin that replaces `import()` with `__linaria_dynamic_import` as Node VM does not support dynamic imports yet.
 */
export default function dynamicImport(babel: Core): PluginObj {
  const { types: t } = babel;

  return {
    name: '@linaria/babel/dynamic-import',
    visitor: {
      CallExpression(path) {
        if (path.get('callee').isImport()) {
          const moduleName = path.get('arguments.0') as NodePath;

          if (!moduleName.isStringLiteral()) {
            throw new Error('Dynamic import argument must be a string literal');
          }

          path.replaceWith(
            t.callExpression(t.identifier('__linaria_dynamic_import'), [
              t.stringLiteral(moduleName.node.value),
            ])
          );
        }
      },
    },
  };
}
