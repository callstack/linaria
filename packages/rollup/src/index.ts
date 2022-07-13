/**
 * This file contains a Rollup loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';

import { createFilter } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';

import { transform, slugify } from '@linaria/babel-preset';
import type {
  PluginOptions,
  Preprocessor,
  Result,
  CodeCache,
  Module,
} from '@linaria/babel-preset';
import { createCustomDebug } from '@linaria/logger';
import { getFileIdx } from '@linaria/utils';

type RollupPluginOptions = {
  include?: string | string[];
  exclude?: string | string[];
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
} & Partial<PluginOptions>;

type ViteConfig = {
  root: string;
  command: 'serve' | 'build';
};

export default function linaria({
  include,
  exclude,
  sourceMap,
  preprocessor,
  ...rest
}: RollupPluginOptions = {}): Plugin & {
  configResolved: (config: ViteConfig) => void;
} {
  const filter = createFilter(include, exclude);
  const cssLookup: { [key: string]: string } = {};
  let config: ViteConfig;

  const codeCache: CodeCache = new Map();
  const resolveCache = new Map<string, string>();
  const evalCache = new Map<string, Module>();

  return {
    name: 'linaria',
    configResolved(resolvedConfig: ViteConfig) {
      config = resolvedConfig;
    },
    load(id: string) {
      return cssLookup[id];
    },
    /* eslint-disable-next-line consistent-return */
    resolveId(importee: string) {
      if (importee in cssLookup) return importee;
    },
    async transform(
      code: string,
      id: string
    ): Promise<{ code: string; map: Result['sourceMap'] } | undefined> {
      // Do not transform ignored and generated files
      if (!filter(id) || id in cssLookup) return;

      const log = createCustomDebug('rollup', getFileIdx(id));

      log('rollup-init', id);

      const asyncResolve = async (what: string, importer: string) => {
        const resolved = await this.resolve(what, importer);
        if (resolved) {
          log('resolve', "✅ '%s'@'%s -> %O\n%s", what, importer, resolved);
          // Vite adds param like `?v=667939b3` to cached modules
          return resolved.id.split('?')[0];
        }

        log('resolve', "❌ '%s'@'%s", what, importer);
        throw new Error(`Could not resolve ${what}`);
      };

      const result = await transform(
        code,
        {
          filename: id,
          preprocessor,
          pluginOptions: rest,
        },
        asyncResolve,
        {},
        resolveCache,
        codeCache,
        evalCache
      );

      if (!result.cssText) return;

      let { cssText } = result;

      const slug = slugify(cssText);
      const filename = `${id.replace(/\.[jt]sx?$/, '')}_${slug}.css`;

      if (sourceMap && result.cssSourceMapText) {
        const map = Buffer.from(result.cssSourceMapText).toString('base64');
        cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
      }

      cssLookup[filename] = cssText;
      if (config?.command === 'serve' && config?.root) {
        cssLookup[`/${path.posix.relative(config.root, filename)}`] = cssText;
      }

      result.code += `\nimport ${JSON.stringify(filename)};\n`;

      /* eslint-disable-next-line consistent-return */
      return { code: result.code, map: result.sourceMap };
    },
  };
}
