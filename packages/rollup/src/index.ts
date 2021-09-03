/**
 * This file contains a Rollup loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import { transform, slugify, Result } from '@linaria/babel-preset';
import type { PluginOptions, Preprocessor } from '@linaria/babel-preset';

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
}: RollupPluginOptions = {}) {
  const filter = createFilter(include, exclude);
  const cssLookup: { [key: string]: string } = {};
  let config: ViteConfig;

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
    transform(
      code: string,
      id: string
    ): { code: string; map: Result['sourceMap'] } | undefined {
      // Do not transform ignored and generated files
      if (!filter(id) || id in cssLookup) return;

      const result = transform(code, {
        filename: id,
        preprocessor,
        pluginOptions: rest,
      });

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
        cssLookup['/' + path.posix.relative(config.root, filename)] = cssText;
      }

      result.code += `\nimport ${JSON.stringify(filename)};\n`;

      /* eslint-disable-next-line consistent-return */
      return { code: result.code, map: result.sourceMap };
    },
  };
}
