/* @flow */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const normalize = require('normalize-path');
/* $FlowFixMe */
const Module = require('module');
const loaderUtils = require('loader-utils');
const transform = require('./transform');

module.exports = function loader(content: string, inputSourceMap: ?Object) {
  const {
    sourceMap,
    cacheDirectory = '.linaria-cache',
    preprocessor,
    ...rest
  } = loaderUtils.getOptions(this) || {};

  const outputFilename = path.join(
    path.isAbsolute(cacheDirectory)
      ? cacheDirectory
      : path.join(process.cwd(), cacheDirectory),
    path.relative(
      process.cwd(),
      this.resourcePath.replace(/\.[^.]+$/, '.linaria.css')
    )
  );

  const result = transform(content, {
    filename: this.resourcePath,
    inputSourceMap: inputSourceMap != null ? inputSourceMap : undefined,
    outputFilename,
    pluginOptions: rest,
    preprocessor,
  });

  if (result.cssText) {
    let { cssText } = result;

    if (sourceMap) {
      cssText += `/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
        result.cssSourceMapText || ''
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
      `${result.code}\n\nrequire("${normalize(outputFilename)}")`,
      result.sourceMap
    );
    return;
  }

  this.callback(null, result.code, result.sourceMap);
};
