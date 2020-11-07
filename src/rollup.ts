/**
 * This file contains a Rollup loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import { createFilter } from 'rollup-pluginutils';
import transform from './transform';
import slugify from './slugify';
import type { Preprocessor } from './types';
import type { PluginOptions } from './babel/utils/loadOptions';

type RollupPluginOptions = {
  include?: string | string[];
  exclude?: string | string[];
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
} & Partial<PluginOptions>;

export default function linaria({
  include,
  exclude,
  sourceMap,
  preprocessor,
  ...rest
}: RollupPluginOptions = {}) {
  const filter = createFilter(include, exclude);
  const cssLookup: { [key: string]: string } = {};

  return {
    name: 'linaria',
    load(id: string) {
      return cssLookup[id];
    },
    /* eslint-disable-next-line consistent-return */
    resolveId(importee: string) {
      if (importee in cssLookup) return importee;
    },
    transform(code: string, id: string) {
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
      const filename = `${id.replace(/\.js$/, '')}_${slug}.css`;

      if (sourceMap && result.cssSourceMapText) {
        const map = Buffer.from(result.cssSourceMapText).toString('base64');
        cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
      }

      cssLookup[filename] = cssText;

      result.code += `\nimport ${JSON.stringify(filename)};\n`;

      /* eslint-disable-next-line consistent-return */
      return { code: result.code, map: result.sourceMap };
    },
  };
}
