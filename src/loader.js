/* @flow */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const normalize = require('normalize-path');
const loaderUtils = require('loader-utils');
const enhancedResolve = require('enhanced-resolve/lib/node');
const Module = require('./babel/module');
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

  const resolveOptions = {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  };

  const resolveSync = enhancedResolve.create.sync(
    // this._compilation is a deprecated API
    // However there seems to be no other way to access webpack's resolver
    // There is this.resolve, but it's asynchronous
    // Another option is to read the webpack.config.js, but it won't work for programmatic usage
    // This API is used by many loaders/plugins, so hope we're safe for a while
    this._compilation && this._compilation.options.resolve
      ? {
          ...resolveOptions,
          alias: this._compilation.options.resolve.alias,
        }
      : resolveOptions
  );

  let result;

  const originalResolveFilename = Module._resolveFilename;

  try {
    // Use webpack's resolution when evaluating modules
    Module._resolveFilename = (id, { filename }) =>
      resolveSync(path.dirname(filename), id);

    result = transform(content, {
      filename: this.resourcePath,
      inputSourceMap: inputSourceMap != null ? inputSourceMap : undefined,
      outputFilename,
      pluginOptions: rest,
      preprocessor,
    });
  } finally {
    // Restore original behaviour
    Module._resolveFilename = originalResolveFilename;
  }

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
          const f = resolveSync(path.dirname(this.resourcePath), dep);

          this.addDependency(f);
        } catch (e) {
          console.warn(`[linaria] failed to add dependency for: ${dep}`, e);
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
      `${result.code}\n\nrequire("${normalize(outputFilename)}");`,
      result.sourceMap
    );
    return;
  }

  this.callback(null, result.code, result.sourceMap);
};
