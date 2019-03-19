/* @flow */

import path from 'path';
import * as babel from '@babel/core';
import stylis from 'stylis';
import { SourceMapGenerator } from 'source-map';
import merge from 'babel-merge';
import loadOptions, { type PluginOptions } from './babel/utils/loadOptions';

export type Replacement = {
  original: { start: Location, end: Location },
  length: number,
};

type Location = {
  line: number,
  column: number,
};

type Result = {
  code: string,
  sourceMap: ?Object,
  cssText?: string,
  cssSourceMapText?: string,
  dependencies?: string[],
  rules?: {
    [className: string]: {
      cssText: string,
      displayName: string,
      start: ?Location,
    },
  },
  replacements?: Replacement[],
};

type Options = {
  filename: string,
  preprocessor?: Preprocessor,
  outputFilename?: string,
  inputSourceMap?: Object,
  pluginOptions?: PluginOptions,
};

export type Preprocessor =
  | 'none'
  | 'stylis'
  | ((selector: string, cssText: string) => string)
  | void;

const STYLIS_DECLARATION = 1;

module.exports = function transform(code: string, options: Options): Result {
  // Check if the file contains `css` or `styled` words first
  // Otherwise we should skip transforming
  if (!/\b(styled|css)/.test(code)) {
    return {
      code,
      sourceMap: options.inputSourceMap,
    };
  }

  const pluginOptions = loadOptions(options.pluginOptions);

  const { metadata, code: transformedCode, map } = babel.transformSync(
    code,
    merge(
      ...[
        ...(pluginOptions ? [pluginOptions.babelOptions] : []),
        {
          filename: options.filename,
          presets: [[require.resolve('./babel'), pluginOptions]],
          sourceMaps: true,
          sourceFileName: options.filename,
          inputSourceMap: options.inputSourceMap,
        },
      ]
    )
  );

  if (!metadata.linaria) {
    return {
      code,
      sourceMap: options.inputSourceMap,
    };
  }

  const { rules, replacements, dependencies } = metadata.linaria;
  const mappings = [];

  let cssText = '';

  let preprocessor;

  if (typeof options.preprocessor === 'function') {
    // eslint-disable-next-line prefer-destructuring
    preprocessor = options.preprocessor;
  } else {
    switch (options.preprocessor) {
      case 'none':
        preprocessor = (selector, text) => `${selector} {${text}}\n`;
        break;
      case 'stylis':
      default:
        stylis.use(null)((context, decl) => {
          if (context === STYLIS_DECLARATION && options.outputFilename) {
            // When writing to a file, we need to adjust the relative paths inside url(..) expressions
            // It'll allow css-loader to resolve an imported asset properly
            return decl.replace(
              /\b(url\()(\.[^)]+)(\))/g,
              (match, p1, p2, p3) =>
                p1 +
                // Replace asset path with new path relative to the output CSS
                path.relative(
                  /* $FlowFixMe */
                  path.dirname(options.outputFilename),
                  // Get the absolute path to the asset from the path relative to the JS file
                  path.resolve(path.dirname(options.filename), p2)
                ) +
                p3
            );
          }

          return decl;
        });

        preprocessor = stylis;
    }
  }

  Object.keys(rules).forEach((selector, index) => {
    mappings.push({
      generated: {
        line: index + 1,
        column: 0,
      },
      original: rules[selector].start,
      name: selector,
    });

    // Run each rule through stylis to support nesting
    cssText += `${preprocessor(selector, rules[selector].cssText)}\n`;
  });

  return {
    code: transformedCode,
    cssText,
    rules,
    replacements,
    dependencies,
    sourceMap: map,

    get cssSourceMapText() {
      if (mappings && mappings.length) {
        const generator = new SourceMapGenerator({
          file: options.filename.replace(/\.js$/, '.css'),
        });

        mappings.forEach(mapping =>
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
};
