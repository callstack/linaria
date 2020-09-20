import path from 'path';
import type { Mapping } from 'source-map';
import stylis from 'stylis';
import type { Preprocessor, PreprocessorFn, Rules } from './types';

const STYLIS_DECLARATION = 1;
const posixSep = path.posix.sep;

type PreprocessOptions = {
  filename: string;
  preprocessor?: Preprocessor;
  outputFilename?: string | undefined;
};

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

function getPreprocessor({
  preprocessor,
  outputFilename,
  filename,
}: PreprocessOptions): PreprocessorFn {
  if (typeof preprocessor === 'function') {
    return preprocessor;
  }
  switch (preprocessor) {
    case 'none':
      return (selector, text) => `${selector} {${text}}\n`;
    case 'stylis':
    default:
      stylis.use(null)((context, decl) => {
        if (context === STYLIS_DECLARATION && outputFilename) {
          // When writing to a file, we need to adjust the relative paths inside url(..) expressions
          // It'll allow css-loader to resolve an imported asset properly
          return decl.replace(
            /\b(url\((["']?))(\.[^)]+?)(\2\))/g,
            (match, p1, p2, p3, p4) =>
              p1 + transformUrl(p3, outputFilename, filename) + p4
          );
        }

        return decl;
      });

      return stylis as PreprocessorFn;
  }
}

export default function preprocess(
  rules: Rules,
  options: PreprocessOptions
): { mappings: Mapping[]; cssText: string } {
  const preprocessor = getPreprocessor(options);
  const mappings: Mapping[] = [];
  let cssText = '';

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

    cssText += `${preprocessor(selector, rules[selector].cssText)}\n`;
  });

  return { mappings, cssText };
}
