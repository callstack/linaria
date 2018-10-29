const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Module = require('module');
const loaderUtils = require('loader-utils');
const transform = require('./transform');

module.exports = function loader(content, inputSourceMap) {
  const { sourceMap, cacheDirectory = '.linaria-cache', ...rest } =
    loaderUtils.getOptions(this) || {};

  const outputFilename = path.join(
    path.isAbsolute(cacheDirectory)
      ? cacheDirectory
      : path.join(process.cwd(), cacheDirectory),
    path.relative(
      process.cwd(),
      this.resourcePath.replace(/\.[^.]+$/, '.linaria.css')
    )
  );

  const result = transform(
    this.resourcePath,
    content,
    rest,
    inputSourceMap,
    outputFilename
  );

  if (result.cssText) {
    let { cssText } = result;

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

    // Read the file first to compare the content
    // Write the new content only if it's changed
    // This will prevent unnecessary WDS reloads
    let currentCssText;

    try {
      currentCssText = fs.readFileSync(outputFilename, 'utf-8');
    } catch (e) {
      // Ignore error
    }

    if (currentCssText !== cssText) {
      mkdirp.sync(path.dirname(outputFilename));
      fs.writeFileSync(outputFilename, cssText);
    }

    this.callback(
      null,
      `${result.code}\n\nrequire("${outputFilename}")`,
      result.sourceMap
    );
    return;
  }

  this.callback(null, result.code, result.sourceMap);
};
