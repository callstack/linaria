import path from 'path';
import * as babel from '@babel/core';
import { SourceMapGenerator } from 'source-map';
import loadOptions, { PluginOptions } from './babel/utils/loadOptions';
import { Optional } from './typeUtils';

export type Replacement = {
  original: { start: Location; end: Location };
  length: number;
};

type Location = {
  line: number;
  column: number;
};

type Rules = {
  [className: string]: {
    cssText: string;
    displayName: string;
    start: Location | null;
    isGlobal: boolean;
  };
};

type Result = {
  code: string;
  sourceMap: Object | null | undefined;
  cssText?: string;
  cssSourceMapText?: string;
  dependencies?: string[];
  rules?: Rules;
  replacements?: Replacement[];
};

type LinariaMetadata = {
  rules: Rules;
  replacements: Replacement[];
  dependencies: string[];
};

type Options = {
  filename: string;
  preprocessor?: Preprocessor;
  outputFilename?: string;
  inputSourceMap?: Object;
  pluginOptions?: Optional<PluginOptions>;
};

export type PreprocessorFn = (
  selector: string,
  cssText: string,
  outputLine?: number,
  originalLocation?: Location
) => string;
export type Preprocessor = 'none' | 'stylis' | PreprocessorFn | void;

export default function transform(code: string, options: Options): Result {
  // Check if the file contains `css`, `styled`, or injectGlobal words first
  // Otherwise we should skip transforming
  if (!/\b(styled|css|injectGlobal)/.test(code)) {
    return {
      code,
      sourceMap: options.inputSourceMap,
    };
  }

  const pluginOptions = loadOptions(options.pluginOptions);

  // Parse the code first so babel uses user's babel config for parsing
  // We don't want to use user's config when transforming the code
  const ast = babel.parseSync(code, {
    ...(pluginOptions ? pluginOptions.babelOptions : null),
    filename: options.filename,
    caller: { name: 'linaria' },
  });

  const { metadata, code: transformedCode, map } = babel.transformFromAstSync(
    ast!,
    code,
    {
      filename: options.filename,
      presets: [[require.resolve('./babel'), pluginOptions]],
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
      code,
      sourceMap: options.inputSourceMap,
    };
  }

  const {
    rules,
    replacements,
    dependencies,
  } = (metadata as babel.BabelFileMetadata & {
    linaria: LinariaMetadata;
  }).linaria;

  // Construct a CSS-ish file from the unprocessed style rules
  let cssText = buildCSS(rules);

  // When writing to a file, we need to adjust the relative paths inside url(..) expressions
  // It'll allow css-loader to resolve an imported asset properly
  if (options.outputFilename) {
    cssText = cssText.replace(
      /\b(url\()(\.[^)]+)(\))/g,
      (_, p1, p2, p3) =>
        p1 +
        // Replace asset path with new path relative to the output CSS
        path.relative(
          path.dirname(options.outputFilename!),
          // Get the absolute path to the asset from the path relative to the JS file
          path.resolve(path.dirname(options.filename), p2)
        ) +
        p3
    );
  }
  cssText += '\n';

  return {
    code: transformedCode || '',
    cssText,
    rules,
    replacements,
    dependencies,
    sourceMap: map,

    get cssSourceMapText() {
      const generator = new SourceMapGenerator({
        file: options.filename,
      });
      generator.addMapping({
        generated: {
          line: 1,
          column: 0,
        },
        original: {
          line: 1,
          column: 0,
        },
        source: options.filename,
      });
      generator.setSourceContent(options.filename, code);
      return generator.toString();
    },
  };
}

function buildCSS(rules: Rules) {
  let cssText = '';
  if (!rules) {
    return cssText;
  }
  Object.keys(rules).forEach(selector => {
    const rule = rules[selector];
    // Append new lines until we get to the start line number
    let line = cssText.split('\n').length;
    while (rule.start && line < rule.start.line) {
      cssText += '\n';
      line++;
    }
    if (!rule.isGlobal) {
      cssText += `${selector} {`;
    }
    // Append blank spaces until we get to the start column number
    const last = cssText.split('\n').pop();
    let column = last ? last.length : 0;
    while (rule.start && column < rule.start.column) {
      cssText += ' ';
      column++;
    }
    cssText += rule.cssText;
    if (!rule.isGlobal) {
      cssText += ' }';
    }
  });
  return cssText;
}
