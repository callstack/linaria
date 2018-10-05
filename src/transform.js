/* @flow */

const babel = require('@babel/core');
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
  cssText?: string,
  sourceMap?: ?string,
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

module.exports = function transform(
  filename /* :string */,
  content /* :string */,
  options /* :PluginOptions */
) /* : Result */ {
  // Check if the file contains `css` or `styled` tag first
  // Otherwise we should skip transforming
  if (!/\b(styled(\([^)]+\)|\.[a-z0-9]+)|css)[\s\n]*`/.test(content)) {
    return { code: content };
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

  const { metadata, code } = babel.transformSync(content, {
    filename,
    presets: [[require.resolve('./babel'), options]],
    exclude: /node_modules/,
    babelrc: false,
    configFile: false,
    parserOpts,
  });

  const { cssText, rules, replacements, dependencies, mappings } =
    metadata.linaria || {};

  return {
    code,
    cssText,
    rules,
    replacements,
    dependencies,

    get sourceMap() {
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
