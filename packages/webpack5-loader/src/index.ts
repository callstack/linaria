/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';

import enhancedResolve from 'enhanced-resolve';
import type { RawSourceMap } from 'source-map';
import type { RawLoaderDefinitionFunction } from 'webpack';

import type { Result, Preprocessor } from '@linaria/babel-preset';
import { EvalCache, Module, transform } from '@linaria/babel-preset';
import { debug, notify } from '@linaria/logger';

import type { ICache } from './cache';
import { getCacheInstance } from './cache';

const outputCssLoader = require.resolve('./outputCssLoader');

type Loader = RawLoaderDefinitionFunction<{
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
  extension?: string;
  cacheProvider?: string | ICache;
  resolveOptions?: enhancedResolve.ResolveOptions;
}>;

const webpack5Loader: Loader = function webpack5LoaderPlugin(
  content,
  inputSourceMap
) {
  function convertSourceMap(
    value: typeof inputSourceMap,
    filename: string
  ): RawSourceMap | undefined {
    if (typeof value === 'string' || !value) {
      return undefined;
    }

    return {
      ...value,
      file: value.file ?? filename,
      mappings: value.mappings ?? '',
      names: value.names ?? [],
      sources: value.sources ?? [],
      version: value.version ?? 3,
    };
  }

  // tell Webpack this loader is async
  this.async();

  debug('loader', this.resourcePath);

  EvalCache.clearForFile(this.resourcePath);

  const resolveOptionsDefaults = {
    conditionNames: ['require'],
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  };

  const {
    sourceMap = undefined,
    preprocessor = undefined,
    extension = '.linaria.css',
    cacheProvider,
    resolveOptions = {},
    ...rest
  } = this.getOptions() || {};

  const outputFileName = this.resourcePath.replace(/\.[^.]+$/, extension);

  // this._compilation is a deprecated API
  // However there seems to be no other way to access webpack's resolver
  // There is this.resolve, but it's asynchronous
  // Another option is to read the webpack.config.js, but it won't work for programmatic usage
  // This API is used by many loaders/plugins, so hope we're safe for a while
  const webpackResolveOptions = this._compilation?.options.resolve;

  // Resolved configuration contains empty list of extensions as a default value
  // https://github.com/callstack/linaria/issues/855
  if (webpackResolveOptions?.extensions?.length === 0) {
    delete webpackResolveOptions.extensions;
  }

  // Let's try to create a resolver with the webpack config
  let resolveSync = enhancedResolve.create.sync({
    ...resolveOptionsDefaults,
    ...(webpackResolveOptions ?? {}),
    ...resolveOptions,
    mainFields: ['main'],
  });

  try {
    // Try to resolve the current file
    resolveSync(__dirname, __filename);
  } catch (e) {
    // Looks like one of the webpack plugins is async and the whole resolver became async
    notify(
      'The default webpack configuration cannot be used because some of the plugins are asynchronous. All plugins have been ignored. Please override `resolveOptions.plugins` in the Linaria configuration.'
    );

    // Fallback to synchronous resolve
    resolveSync = enhancedResolve.create.sync({
      ...resolveOptionsDefaults,
      ...((webpackResolveOptions && {
        alias: webpackResolveOptions.alias,
        modules: webpackResolveOptions.modules,
      }) ||
        {}),
      ...resolveOptions,
    });
  }

  let result: Result;

  const originalResolveFilename = Module._resolveFilename;

  try {
    // Use webpack's resolution when evaluating modules
    Module._resolveFilename = (id, { filename }) => {
      const res = resolveSync(path.dirname(filename), id);
      if (!res) {
        // enhanced-resolve v4 throws a error when dependency is missed
        throw new Error('No result');
      }

      this.addDependency(res);
      return res;
    };

    result = transform(content.toString(), {
      filename: path.relative(process.cwd(), this.resourcePath),
      inputSourceMap: convertSourceMap(inputSourceMap, this.resourcePath),
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

    if (result.dependencies?.length) {
      result.dependencies.forEach((dep) => {
        try {
          const f = resolveSync(path.dirname(this.resourcePath), dep);
          if (f) {
            this.addDependency(f);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `[linaria] ${dep} cannot be resolved in ${this.resourcePath}`
            );
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[linaria] failed to add dependency for: ${dep}`, e);
        }
      });
    }

    getCacheInstance(cacheProvider)
      .then((cacheInstance) => cacheInstance.set(this.resourcePath, cssText))
      .then(() => {
        const request = `${outputFileName}!=!${outputCssLoader}?cacheProvider=${encodeURIComponent(
          typeof cacheProvider === 'string' ? cacheProvider : ''
        )}!${this.resourcePath}`;
        this.utils.contextify(this.context || this.rootContext, request);
        const stringifiedRequest = JSON.stringify(
          this.utils.contextify(this.context || this.rootContext, request)
        );

        return this.callback(
          null,
          `${result.code}\n\nrequire(${stringifiedRequest});`,
          result.sourceMap ?? undefined
        );
      })
      .catch((err: Error) => this.callback(err));
    return;
  }

  this.callback(null, result.code, result.sourceMap ?? undefined);
};

export default webpack5Loader;
