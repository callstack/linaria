const path = require('path');
const Module = require('module');
const loaderUtils = require('loader-utils');
const transform = require('../transform');

const cache = {};

let id = 0;

function loader(content) {
  const options = loaderUtils.getOptions(this) || {};
  const { css, dependencies, map } = transform(
    this.resourcePath,
    content,
    options.sourceMap
  );

  let cssText = css;

  if (cssText) {
    if (map) {
      map.setSourceContent(
        this.resourcePath,
        // We need to get the original source before it was processed
        this.fs.readFileSync(this.resourcePath).toString()
      );

      cssText += `/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
        map.toString()
      ).toString('base64')}*/`;
    }

    if (dependencies) {
      dependencies.forEach(dep => {
        try {
          const file = Module._resolveFilename(dep, {
            id: this.resourcePath,
            filename: this.resourcePath,
            paths: Module._nodeModulePaths(path.dirname(this.resourcePath)),
          });

          this.addDependency(file);
        } catch (e) {
          // Ignore
        }
      });
    }

    id++;

    cache[id] = { cssText };

    return `${content}\n\nrequire("!!${require.resolve('./css')}?id=${id}!")`;
  }

  return content;
}

loader.cache = cache;

module.exports = loader;
