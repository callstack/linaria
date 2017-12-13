/* @flow */

import * as babel from 'babel-core';

function shouldRunLinaria(source: string) {
  return (
    (/import .+ from ['"]linaria['"]/g.test(source) ||
      /require\(['"]linaria['"]\)/g.test(source)) &&
    /css(\.named)?`/g.test(source)
  );
}

function transpile(source: string, map: any, filename: string) {
  const file = new babel.File(
    {
      filename,
      sourceMaps: true,
      inputSourceMap: map,
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
      presets: [require.resolve('../../babel.js')],
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

      const source = fs.readFileSync(reason.module.resource).toString();
      if (shouldRunLinaria(source)) {
        parentModules.push({ source, filename: reason.module.resource });
      }

      findLinariaModules(reason.module.reasons);
    });
  }

  findLinariaModules(module.reasons);

  return parentModules;
}

const builtLinariaModules = [];

function linariaLoader(source: string, inputMap: any, meta: any) {
  // If the module has linaria styles, we build it and we're done here.
  if (shouldRunLinaria(source)) {
    const { code, map } = transpile(source, inputMap, this.resourcePath);
    builtLinariaModules.push(this.resourcePath);
    return {
      source: code,
      map,
      meta,
    };
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
      transpile(item.source, null, item.filename);
    }
  });

  return {
    source,
    map: inputMap,
    meta,
  };
}

function makeLoaderAdapter(fn) {
  function loaderAdapter(...args: any[]) {
    let error;
    let results;
    try {
      results = fn.call(this, ...args);
    } catch (e) {
      error = e;
    }

    if (results && results instanceof Promise) {
      const callback = this.async();
      results
        .then(({ source, map, meta }) => {
          callback(null, source, map, meta);
        })
        .catch(e => {
          callback(e);
        });
    } else if (results && !error) {
      this.callback(null, results.source, results.map, results.meta);
    } else {
      this.callback(error);
    }
  }

  Object.defineProperty(loaderAdapter, 'name', {
    value: fn.name || loaderAdapter.name,
  });

  return loaderAdapter;
}

export default makeLoaderAdapter(linariaLoader);
