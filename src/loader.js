const os = require('os');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const loaderUtils = require('loader-utils');
const slugify = require('./slugify');
const transform = require('./transform');

module.exports = function loader(content) {
  const options = loaderUtils.getOptions(this) || {};
  const { css, dependencies, map } = transform(
    this.resourcePath,
    content,
    options.sourceMap
  );

  let cssText = css;

  if (cssText) {
    const slug = slugify(this.resourcePath);
    const filename = `${path
      .basename(this.resourcePath)
      .replace(/\.js$/, '')}_${slug}.css`;

    const output = path.join(os.tmpdir(), filename.split('/').join('_'));

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

    fs.writeFileSync(output, cssText);

    return `${content}\n\nrequire("${output}")`;
  }

  return content;
};
