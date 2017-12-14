/* @flow */

import * as babel from 'babel-core';
import loaderUtils from 'loader-utils';

function shouldRunLinaria(source: string) {
  return (
    (/import .+ from ['"]linaria['"]/g.test(source) ||
      /require\(['"]linaria['"]\)/g.test(source)) &&
    /css(\.named)?`/g.test(source)
  );
}

function transpile(
  source: string,
  map: any,
  filename: string,
  loaderOptions: Object,
  babelLoaderOptions: Object
) {
  const file = new babel.File(
    {
      filename,
      sourceMaps: true,
      inputSourceMap: map,
      ...babelLoaderOptions,
    },
    new babel.Pipeline()
  );

  // `transformFromAst` is synchronous in Babel 6, but async in Babel 7 hence
  // the `transformFromAstSync`.
  return (babel.transformFromAstSync || babel.transformFromAst)(
    file.parse(source),
    source,
    {
      filename,
      sourceMaps: true,
      inputSourceMap: map,
      presets: [[require.resolve('../../babel.js'), loaderOptions]],
      parserOpts: file.parserOpts,
      babelrc: false,
    }
  );
}

function getLinariaParentModules(fs: any, module: any) {
  const parentModules = [];

  function findLinariaModules(reasons) {
    reasons.forEach(reason => {
      if (!reason.module.resource) {
        return;
      }

      const source = fs.readFileSync(reason.module.resource, 'utf8');
      if (shouldRunLinaria(source)) {
        parentModules.push({ source, filename: reason.module.resource });
      }

      findLinariaModules(reason.module.reasons);
    });
  }

  findLinariaModules(module.reasons);

  return parentModules;
}

function getBabelLoaderOptions(loaders: { path: string, options?: Object }[]) {
  const babelLoader = loaders.find(loader =>
    loader.path.includes('babel-loader')
  );
  if (!babelLoader) {
    return {};
  }

  const { cacheDirectory, cacheIdentifier, forceEnv, ...babelCoreOptions } =
    babelLoader.options || {};
  return babelCoreOptions;
}

const builtLinariaModules = [];

export default function linariaLoader(
  source: string,
  inputMap: any,
  meta: any
) {
  const options = loaderUtils.getOptions(this) || {};
  try {
    // If the module has linaria styles, we build it and we're done here.
    if (shouldRunLinaria(source)) {
      const { code, map } = transpile(
        source,
        inputMap,
        this.resourcePath,
        options,
        getBabelLoaderOptions(this.loaders)
      );
      builtLinariaModules.push(this.resourcePath);
      this.callback(null, code, map, meta);
      return;
    }

    // Otherwise, we check for parent modules, which use this one
    // and if they have linaria styles, we build them.
    const parentModuleToTranspile = getLinariaParentModules(
      this.fs.fileSystem,
      this._module
    );

    parentModuleToTranspile.forEach(item => {
      // We only care about modules which was previously built.
      if (builtLinariaModules.indexOf(item.filename) > -1) {
        transpile(
          item.source,
          null,
          item.filename,
          options,
          getBabelLoaderOptions(this.loaders)
        );
      }
    });

    this.callback(null, source, inputMap, meta);
  } catch (error) {
    this.callback(error);
  }
}
