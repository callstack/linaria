const os = require('os');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const loaderUtils = require('loader-utils');
const transform = require('./transform');
const slugify = require('./slugify');

module.exports = function loader(
  content /* :string */,
  inputSourceMap /* :?Object */
) {
  const { sourceMap, ...rest } = loaderUtils.getOptions(this) || {};

  const result = transform(this.resourcePath, content, rest, inputSourceMap);

  if (result.cssText) {
    let { cssText } = result;

    const slug = slugify(this.resourcePath);
    const filename = `${path
      .basename(this.resourcePath)
      .replace(/\.js$/, '')}_${slug}.css`;

    if (sourceMap) {
      cssText += `/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
        result.cssSourceMapText
      ).toString('base64')}*/`;
    }

    if (result.dependencies && result.dependencies.length) {
      result.dependencies.forEach(dep => {
        try {
          const f = Module._resolveFilename(dep, {
            id: this.resourcePath,
            filename: this.resourcePath,
            paths: Module._nodeModulePaths(path.dirname(this.resourcePath)),
          });

          this.addDependency(f);
        } catch (e) {
          // Ignore
        }
      });
    }

    const output = path.join(os.tmpdir(), filename.split(path.sep).join('_'));

    fs.writeFileSync(output, cssText);

    this.callback(
      null,
      `${result.code}\n\nrequire("${output}")`,
      result.sourceMap
    );
    return;
  }

  this.callback(null, result.code, result.sourceMap);
};
