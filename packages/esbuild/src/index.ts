/**
 * This file contains an esbuild loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import fs from 'fs';
import path from 'path';

import type { Plugin, TransformOptions, Loader } from 'esbuild';
import { transformSync } from 'esbuild';

import type { PluginOptions, Preprocessor } from '@linaria/babel-preset';
import { slugify, transform } from '@linaria/babel-preset';

type EsbuildPluginOptions = {
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
  esbuildOptions?: TransformOptions;
} & Partial<PluginOptions>;

const nodeModulesRegex = /^(?:.*[\\/])?node_modules(?:[\\/].*)?$/;

export default function linaria({
  sourceMap,
  preprocessor,
  esbuildOptions,
  ...rest
}: EsbuildPluginOptions = {}): Plugin {
  let options = esbuildOptions;
  return {
    name: 'linaria',
    setup(build) {
      const cssLookup = new Map<string, string>();

      const asyncResolve = async (
        token: string,
        importer: string
      ): Promise<string> => {
        const context = path.isAbsolute(importer)
          ? path.dirname(importer)
          : path.join(process.cwd(), path.dirname(importer));

        const result = await build.resolve(token, {
          resolveDir: context,
          kind: 'import-statement',
        });

        if (result.errors.length > 0) {
          throw new Error(`Cannot resolve ${token}`);
        }

        return result.path;
      };

      build.onResolve({ filter: /\.linaria\.css$/ }, (args) => {
        return {
          namespace: 'linaria',
          path: args.path,
        };
      });

      build.onLoad({ filter: /.*/, namespace: 'linaria' }, (args) => {
        return {
          contents: cssLookup.get(args.path),
          loader: 'css',
          resolveDir: path.basename(args.path),
        };
      });

      build.onLoad({ filter: /\.(js|jsx|ts|tsx)$/ }, async (args) => {
        const rawCode = fs.readFileSync(args.path, 'utf8');
        const { ext, name: filename } = path.parse(args.path);
        const loader = ext.replace(/^\./, '') as Loader;

        if (nodeModulesRegex.test(args.path)) {
          return {
            loader,
            contents: rawCode,
          };
        }

        if (!options) {
          options = {};
          if ('jsxFactory' in build.initialOptions) {
            options.jsxFactory = build.initialOptions.jsxFactory;
          }
          if ('jsxFragment' in build.initialOptions) {
            options.jsxFragment = build.initialOptions.jsxFragment;
          }
        }

        const transformed = transformSync(rawCode, {
          ...options,
          sourcefile: args.path,
          sourcemap: sourceMap,
          loader,
        });
        let { code } = transformed;

        if (sourceMap) {
          const esbuildMap = Buffer.from(transformed.map).toString('base64');
          code += `/*# sourceMappingURL=data:application/json;base64,${esbuildMap}*/`;
        }

        const result = await transform(
          code,
          {
            filename: args.path,
            preprocessor,
            pluginOptions: rest,
          },
          asyncResolve
        );

        if (!result.cssText) {
          return {
            contents: code,
            loader,
            resolveDir: path.dirname(args.path),
          };
        }

        let { cssText } = result;

        const slug = slugify(cssText);
        const cssFilename = `${filename}_${slug}.linaria.css`;

        let contents = `import ${JSON.stringify(cssFilename)}; ${result.code}`;

        if (sourceMap && result.cssSourceMapText) {
          const map = Buffer.from(result.cssSourceMapText).toString('base64');
          cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
          const linariaMap = Buffer.from(
            JSON.stringify(result.sourceMap)
          ).toString('base64');
          contents += `/*# sourceMappingURL=data:application/json;base64,${linariaMap}*/`;
        }

        cssLookup.set(cssFilename, cssText);

        return {
          contents,
          loader,
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}
