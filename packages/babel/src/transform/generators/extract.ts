import path from 'path';

import type { Mapping } from 'source-map';
import { SourceMapGenerator } from 'source-map';
import {
  compile,
  serialize,
  stringify,
  middleware,
  prefixer,
  namespace,
} from 'stylis';

import type { Replacements, Rules } from '@linaria/utils';

import type { Options, PreprocessorFn } from '../../types';
import type { IExtractAction, SyncScenarioForAction } from '../types';

const posixSep = path.posix.sep;

export function transformUrl(
  url: string,
  outputFilename: string,
  sourceFilename: string,
  platformPath: typeof path = path
) {
  // Replace asset path with new path relative to the output CSS
  const relative = platformPath.relative(
    platformPath.dirname(outputFilename),
    // Get the absolute path to the asset from the path relative to the JS file
    platformPath.resolve(platformPath.dirname(sourceFilename), url)
  );

  if (platformPath.sep === posixSep) {
    return relative;
  }

  return relative.split(platformPath.sep).join(posixSep);
}

function createStylisPreprocessor(options: Options) {
  function stylisPreprocess(selector: string, text: string): string {
    return serialize(
      compile(`${selector} {${text}}\n`),
      middleware([
        (element: { return: string; type: string; value: string }) => {
          const { outputFilename } = options;
          if (element.type === 'decl' && outputFilename) {
            // When writing to a file, we need to adjust the relative paths inside url(..) expressions.
            // It'll allow css-loader to resolve an imported asset properly.
            // eslint-disable-next-line no-param-reassign
            element.return = element.value.replace(
              /\b(url\((["']?))(\.[^)]+?)(\2\))/g,
              (match, p1, p2, p3, p4) =>
                p1 + transformUrl(p3, outputFilename, options.filename) + p4
            );
          }
        },
        namespace,
        prefixer,
        stringify,
      ])
    );
  }
  return stylisPreprocess;
}

function extractCssFromAst(
  rules: Rules,
  originalCode: string,
  options: Pick<Options, 'preprocessor' | 'filename' | 'outputFilename'>
): { cssSourceMapText: string; cssText: string; rules: Rules } {
  const mappings: Mapping[] = [];

  let cssText = '';

  let preprocessor: PreprocessorFn;
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
        preprocessor = createStylisPreprocessor(options);
    }
  }

  Object.keys(rules).forEach((selector, index) => {
    mappings.push({
      generated: {
        line: index + 1,
        column: 0,
      },
      original: rules[selector].start!,
      name: selector,
      source: '',
    });

    if (rules[selector].atom) {
      // For atoms, we just directly insert cssText, to give the atomizer full control over the rules
      cssText += `${rules[selector].cssText}\n`;
    } else {
      // Run each rule through stylis to support nesting
      cssText += `${preprocessor(selector, rules[selector].cssText)}\n`;
    }
  });

  return {
    cssText,
    rules,

    get cssSourceMapText() {
      if (mappings?.length) {
        const generator = new SourceMapGenerator({
          file: options.filename.replace(/\.js$/, '.css'),
        });

        mappings.forEach((mapping) =>
          generator.addMapping({ ...mapping, source: options.filename })
        );

        generator.setSourceContent(options.filename, originalCode);

        return generator.toString();
      }

      return '';
    },
  };
}

/**
 * Extract artifacts (e.g. CSS) from processors
 */
// eslint-disable-next-line require-yield
export function* extract(
  this: IExtractAction
): SyncScenarioForAction<IExtractAction> {
  const { options } = this.services;
  const { entrypoint } = this;
  const { processors } = this.data;
  const { loadedAndParsed } = entrypoint;
  if (loadedAndParsed.evaluator === 'ignored') {
    throw new Error('entrypoint was ignored');
  }

  let allRules: Rules = {};
  const allReplacements: Replacements = [];
  processors.forEach((processor) => {
    processor.artifacts.forEach((artifact) => {
      if (artifact[0] !== 'css') return;
      const [rules, replacements] = artifact[1] as [
        rules: Rules,
        sourceMapReplacements: Replacements,
      ];

      allRules = {
        ...allRules,
        ...rules,
      };

      allReplacements.push(...replacements);
    });
  });

  return {
    ...extractCssFromAst(allRules, loadedAndParsed.code, options),
    replacements: allReplacements,
  };
}
