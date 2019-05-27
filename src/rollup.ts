import { createFilter } from 'rollup-pluginutils';
import transform, { Preprocessor } from './transform';
import slugify from './slugify';
import { PluginOptions } from './babel/utils/loadOptions';
import { Optional } from './typeUtils';

type RollupPluginOptions = {
  include?: string | string[];
  exclude?: string | string[];
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
} & Optional<PluginOptions>;

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
      if (!filter(id)) return;

      const result = transform(code, {
        filename: id,
        preprocessor,
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
}
