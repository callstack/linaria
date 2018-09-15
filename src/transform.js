/* @flow */

const { SourceMapGenerator } = require('source-map');

/* ::
type Result = {
  css: string,
  dependencies: ?string[],
  map: SourceMapGenerator,
}
*/

module.exports = function transform(
  filename /* :string */,
  content /* :string */,
  sourceMap /* : boolean */
) /* : Result */ {
  let css = '';
  let mappings = null;
  let dependencies = null;
  let found = false;
  let comment = false;

  content.split('\n').forEach(line => {
    if (line === '/*') {
      comment = true;
    } else if (line === '*/') {
      comment = false;
    } else if (line === 'CSS OUTPUT TEXT START' && comment) {
      found = true;
    } else if (line === 'CSS OUTPUT TEXT END' && comment) {
      found = false;
    } else if (found) {
      css += `${line}\n`;
    } else if (line.startsWith('CSS OUTPUT MAPPINGS:')) {
      try {
        mappings = JSON.parse(line.substr(20));
      } catch (e) {
        // Ignore
      }
    } else if (line.startsWith('CSS OUTPUT DEPENDENCIES:')) {
      try {
        dependencies = JSON.parse(line.substr(24));
      } catch (e) {
        // Ignore
      }
    }
  });

  let map;

  if (sourceMap && mappings) {
    const generator = new SourceMapGenerator({
      file: filename.replace(/\.js$/, '.css'),
    });

    mappings.forEach(mapping =>
      generator.addMapping(Object.assign(mapping, { source: filename }))
    );

    map = generator;
  }

  return { css, dependencies, map };
};
