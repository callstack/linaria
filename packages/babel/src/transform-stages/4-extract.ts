import path from 'path';

import type { Mapping } from 'source-map';
import { SourceMapGenerator } from 'source-map';
import stylis from 'stylis';

import type { Artifact, Replacements, Rules } from '@linaria/utils';

import type { Options, PreprocessorFn } from '../types';

const STYLIS_DECLARATION = 1;
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

function extractCssFromAst(
  rules: Rules,
  originalCode: string,
  options: Pick<Options, 'preprocessor' | 'filename' | 'outputFilename'>
) {
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
        stylis.use(null)((context, decl) => {
          const { outputFilename } = options;
          if (context === STYLIS_DECLARATION && outputFilename) {
            // When writing to a file, we need to adjust the relative paths inside url(..) expressions
            // It'll allow css-loader to resolve an imported asset properly
            return decl.replace(
              /\b(url\((["']?))(\.[^)]+?)(\2\))/g,
              (match, p1, p2, p3, p4) =>
                p1 + transformUrl(p3, outputFilename, options.filename) + p4
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
export default function extractStage(
  processors: { artifacts: Artifact[] }[],
  originalCode: string,
  options: Pick<Options, 'preprocessor' | 'filename' | 'outputFilename'>
) {
  let allRules: Rules = {};
  const allReplacements: Replacements = [];
  processors.forEach((processor) => {
    processor.artifacts.forEach((artifact) => {
      if (artifact[0] !== 'css') return;
      const [rules, replacements] = artifact[1] as [
        rules: Rules,
        sourceMapReplacements: Replacements
      ];

      allRules = {
        ...allRules,
        ...rules,
      };

      allReplacements.push(...replacements);
    });
  });

  return {
    ...extractCssFromAst(allRules, originalCode, options),
    replacements: allReplacements,
  };
}
