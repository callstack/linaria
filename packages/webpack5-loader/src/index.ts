/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';
import loaderUtils from 'loader-utils';
import enhancedResolve from 'enhanced-resolve';
import type { RawSourceMap } from 'source-map';
import { EvalCache, Module, transform } from '@linaria/babel-preset';
import { debug, notify } from '@linaria/logger';
import { addFile } from './outputCssLoader';

const outputCssLoader = require.resolve('./outputCssLoader');

export default function webpack5Loader(
  this: any,
  content: string,
  inputSourceMap: RawSourceMap | null
) {
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
  if (webpackResolveOptions.extensions?.length === 0) {
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

  let result;

  const originalResolveFilename = Module._resolveFilename;

  try {
    // Use webpack's resolution when evaluating modules
    Module._resolveFilename = (id, { filename }) => {
      const result = resolveSync(path.dirname(filename), id);
      if (!result) {
        // enhanced-resolve v4 throws a error when dependency is missed
        throw new Error('No result');
      }

      this.addDependency(result);
      return result;
    };

    result = transform(content, {
      filename: path.relative(process.cwd(), this.resourcePath),
      inputSourceMap: inputSourceMap ?? undefined,
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

          this.addDependency(f);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[linaria] failed to add dependency for: ${dep}`, e);
        }
      });
    }

    addFile(this.resourcePath, cssText);

    const request = `${outputFileName}!=!${outputCssLoader}!${this.resourcePath}`;
    const stringifiedRequest = loaderUtils.stringifyRequest(this, request);

    this.callback(
      null,
      `${result.code}\n\nrequire(${stringifiedRequest});`,
      result.sourceMap ?? undefined
    );
    return;
  }

  this.callback(null, result.code, result.sourceMap ?? undefined);
}

export type Webpack5Loader = typeof webpack5Loader;
