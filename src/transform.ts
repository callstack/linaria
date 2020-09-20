/**
 * This file exposes transform function that:
 * - parse the passed code to AST
 * - transforms the AST using Linaria babel preset ('./babel/index.js) and additional config defined in Linaria config file or passed to bundler configuration.
 * - runs generated CSS files through default of user-defined preprocessor
 * - generates source maps for CSS files
 * - return transformed code (without Linaria template literals), generated CSS, source maps and babel metadata from transform step.
 */

import { parseSync, transformFromAstSync } from '@babel/core';
import { SourceMapGenerator } from 'source-map';
import loadOptions from './babel/utils/loadOptions';
import { debug } from './babel/utils/logger';
import preprocess from './preprocess';
import type { LinariaMetadata, Options, Result } from './types';

const babelPreset = require.resolve('./babel');

export default function transform(code: string, options: Options): Result {
  // Check if the file contains `css` or `styled` words first
  // Otherwise we should skip transforming
  if (!/\b(styled|css)/.test(code)) {
    return {
      code,
      sourceMap: options.inputSourceMap,
    };
  }

  debug(
    'transform',
    `${options.filename} to ${options.outputFilename}\n${code}`
  );

  const pluginOptions = loadOptions(options.pluginOptions);
  const babelOptions = pluginOptions?.babelOptions ?? null;

  // Parse the code first so babel uses user's babel config for parsing
  // We don't want to use user's config when transforming the code
  const ast = parseSync(code, {
    ...babelOptions,
    filename: options.filename,
    caller: { name: 'linaria' },
  });

  const { metadata, code: transformedCode, map } = transformFromAstSync(
    ast!,
    code,
    {
      ...(babelOptions?.rootMode ? { rootMode: babelOptions.rootMode } : null),
      filename: options.filename,
      presets: [[babelPreset, pluginOptions]],
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      sourceFileName: options.filename,
      inputSourceMap: options.inputSourceMap,
    }
  )!;

  if (
    !metadata ||
    !(metadata as babel.BabelFileMetadata & { linaria: LinariaMetadata })
      .linaria
  ) {
    return {
      code: transformedCode || '', // if there was only unused code we want to return transformed code which will be later removed by the bundler
      sourceMap: map
        ? {
            ...map,
            version: map.version.toString(),
          }
        : null,
    };
  }

  const {
    rules,
    replacements,
    dependencies,
  } = (metadata as babel.BabelFileMetadata & {
    linaria: LinariaMetadata;
  }).linaria;

  const { mappings, cssText } = preprocess(rules, options);

  return {
    code: transformedCode || '',
    cssText,
    rules,
    replacements,
    dependencies,
    sourceMap: map
      ? {
          ...map,
          version: map.version.toString(),
        }
      : null,

    get cssSourceMapText() {
      if (mappings?.length) {
        const generator = new SourceMapGenerator({
          file: options.filename.replace(/\.js$/, '.css'),
        });

        mappings.forEach((mapping) =>
          generator.addMapping(
            Object.assign({}, mapping, { source: options.filename })
          )
        );

        generator.setSourceContent(options.filename, code);

        return generator.toString();
      }

      return '';
    },
  };
}
