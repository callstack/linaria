/* @flow */

import type { PluginOptions } from './babel/utils/loadOptions';
import type { Preprocessor } from './transform';

const { createFilter } = require('rollup-pluginutils');
const transform = require('./transform');
const slugify = require('./slugify');

type RollupPluginOptions = {
  include?: string | string[],
  exclude?: string | string[],
  sourceMap?: boolean,
  preprocessor?: Preprocessor,
  ...$Shape<PluginOptions>,
};

module.exports = function linaria({
  include,
  exclude,
  sourceMap,
  preprocessor,
  ...rest
}: RollupPluginOptions = {}) {
  const filter = createFilter(include, exclude);
  const cssLookup = {};

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
      if (!filter(id)) return;

      const result = transform(code, {
        filename: id,
        preprocessor: ((preprocessor: any): Preprocessor),
        pluginOptions: rest,
      });

      if (!result.cssText) return;

      let { cssText } = result;

      const slug = slugify(id);
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
};
