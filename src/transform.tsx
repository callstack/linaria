import * as babel from "@babel/core";
import path from "path";
import { SourceMapGenerator } from "source-map";
import stylis from "stylis";

import loadOptions, { PluginOptions } from "./babel/utils/loadOptions";

export type Replacement = {
  original: {
    start: Location;
    end: Location;
  };
  length: number;
};

type Location = {
  line: number;
  column: number;
};

type Result = {
  code: string;
  sourceMap: Object | null | undefined;
  cssText?: string;
  cssSourceMapText?: string;
  dependencies?: string[];
  rules?: {
    [className: string]: {
      cssText: string;
      displayName: string;
      start: Location | null | undefined;
    };
  };
  replacements?: Replacement[];
};

type Options = {
  filename: string;
  preprocessor?: Preprocessor;
  outputFilename?: string;
  inputSourceMap?: Object;
  pluginOptions?: PluginOptions;
};

export type Preprocessor =
  | "none"
  | "stylis"
  | ((selector: string, cssText: string) => string);

const STYLIS_DECLARATION = 1;

export default function transform(code: string, options: Options): Result {
  // Check if the file contains `css` or `styled` words first
  // Otherwise we should skip transforming
  if (!/\b(styled|css)/.test(code)) {
    return {
      code,
      sourceMap: options.inputSourceMap
    };
  }

  const pluginOptions = loadOptions(options.pluginOptions);

  // Parse the code first so babel uses user's babel config for parsing
  // We don't want to use user's config when transforming the code
  const ast = babel.parseSync(code, {
    ...(pluginOptions ? pluginOptions.babelOptions : null),
    filename: options.filename,
    caller: { name: "linaria" }
  }) as babel.types.File;

  const { metadata, code: transformedCode, map } = babel.transformFromAstSync(
    ast,
    code,
    {
      filename: options.filename,
      presets: [[require.resolve("./babel"), pluginOptions]],
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      sourceFileName: options.filename,
      inputSourceMap: options.inputSourceMap
    }
  ) as babel.BabelFileResult;

  if (!metadata.linaria) {
    return {
      code,
      sourceMap: options.inputSourceMap
    };
  }

  const { rules, replacements, dependencies } = metadata.linaria;
  const mappings = [];

  let cssText = "";

  let preprocessor: (selector: string, cssText: string) => string;

  if (typeof options.preprocessor === "function") {
    // eslint-disable-next-line prefer-destructuring
    preprocessor = options.preprocessor;
  } else {
    switch (options.preprocessor) {
      case "none":
        preprocessor = (selector, text) => `${selector} {${text}}\n`;
        break;
      case "stylis":
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
        column: 0
      },
      original: rules[selector].start,
      name: selector
    });

    // Run each rule through stylis to support nesting
    cssText += `${preprocessor(selector, rules[selector].cssText)}\n`;
  });

  return {
    code: transformedCode || "",
    cssText,
    rules,
    replacements,
    dependencies,
    sourceMap: map,

    get cssSourceMapText() {
      if (mappings && mappings.length) {
        const generator = new SourceMapGenerator({
          file: options.filename.replace(/\.js$/, ".css")
        });

        mappings.forEach(mapping =>
          generator.addMapping(
            Object.assign({}, mapping, { source: options.filename })
          )
        );

        generator.setSourceContent(options.filename, code);

        return generator.toString();
      }

      return "";
    }
  };
}
