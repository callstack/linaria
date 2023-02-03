import type { PluginObj, PluginPass } from '@babel/core';
import { declare } from '@babel/helper-plugin-utils';

export interface IShakerOptions {
  onlyExports: string[];
}

const exportMarkerPlugin = declare<IShakerOptions, PluginObj<PluginPass>>(
  (babel, options) => {
    const t = babel.types;

    return {
      name: '@linaria/shaker/export-marker',
      visitor: {
        ExportNamedDeclaration(path) {
          const declaration = path.get('declaration');

          if (declaration.isVariableDeclaration()) {
            declaration.get('declarations').forEach((variableDeclPath) => {
              const identPath = variableDeclPath.get('id');

              if (identPath.isIdentifier()) {
                const variableDeclaration = t.variableDeclaration(
                  declaration.node.kind,
                  [t.cloneNode(variableDeclPath.node, true)]
                );

                if (options.onlyExports.includes(identPath.node.name)) {
                  path.insertBefore([variableDeclaration]);
                } else {
                  path.insertBefore([
                    t.exportNamedDeclaration(variableDeclaration),
                  ]);
                }
              }
            });

            path.remove();
            path.stop();
          }
        },
      },
    };
  }
);

export default exportMarkerPlugin;
