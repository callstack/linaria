/* @flow */

const path = require('path');
const babel = require('@babel/core');
const stylis = require('stylis');
const { SourceMapGenerator } = require('source-map');

/* ::
type Location = {
  line: number,
  column: number
}
*/

/* ::
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
  replacements?: Array<{
    original: { start: Location, end: Location },
    length: number
  }>,
}
*/

/* ::
type PluginOptions = {
  evaluate?: boolean,
  displayName?: boolean,
}
*/

const STYLIS_DECLARATION = 1;

module.exports = function transform(
  filename /* :string */,
  content /* :string */,
  options /* :PluginOptions */,
  inputSourceMap /* :?Object */,
  outputFilename /* : ?string */
) /* : Result */ {
  // Check if the file contains `css` or `styled` tag first
  // Otherwise we should skip transforming
  if (!/\b(styled(\([^)]+\)|\.[a-z0-9]+)|css)[\s\n]*`/.test(content)) {
    return { code: content, sourceMap: inputSourceMap };
  }

  const parserOpts = {
    // https://babeljs.io/docs/en/next/babel-parser.html#plugins
    plugins: [
      // ECMAScript proposals
      'asyncGenerators',
      'bigInt',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      ['decorators', { decoratorsBeforeExport: true }],
      'doExpressions',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'functionBind',
      'functionSent',
      'importMeta',
      'logicalAssignment',
      'nullishCoalescingOperator',
      'numericSeparator',
      'objectRestSpread',
      'optionalCatchBinding',
      'optionalChaining',
      ['pipelineOperator', { proposal: 'minimal' }],
      'throwExpressions',

      // Language extensions
      'jsx',
    ],
  };

  if (/\.tsx?/.test(filename)) {
    parserOpts.plugins.push('typescript');
  } else {
    parserOpts.plugins.push('flow');
  }

  const { metadata, code, map } = babel.transformSync(content, {
    filename,
    presets: [[require.resolve('./babel'), options]],
    exclude: /node_modules/,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    sourceFileName: filename,
    inputSourceMap,
    parserOpts,
  });

  const { rules, replacements, dependencies } = metadata.linaria || {};
  const mappings = [];

  let cssText = '';

  stylis.use(null)((context, decl) => {
    if (context === STYLIS_DECLARATION && outputFilename) {
      // When writing to a file, we need to adjust the relative paths inside url(..) expressions
      // It'll allow css-loader to resolve an imported asset properly
      return decl.replace(
        /\b(url\()(\.[^)]+)(\))/,
        (match, p1, p2, p3) =>
          p1 +
          // Replace asset path with new path relative to the output CSS
          path.relative(
            /* $FlowFixMe */
            path.dirname(outputFilename),
            // Get the absolute path to the asset from the path relative to the JS file
            path.resolve(path.dirname(filename), p2)
          ) +
          p3
      );
    }

    return decl;
  });

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
    cssText += `${stylis(selector, rules[selector].cssText)}\n`;
  });

  return {
    code,
    cssText,
    rules,
    replacements,
    dependencies,
    sourceMap: map,

    get cssSourceMapText() {
      if (mappings && mappings.length) {
        const generator = new SourceMapGenerator({
          file: filename.replace(/\.js$/, '.css'),
        });

        mappings.forEach(mapping =>
          generator.addMapping(Object.assign({}, mapping, { source: filename }))
        );

        generator.setSourceContent(filename, content);

        return generator.toString();
      }

      return '';
    },
  };
};
