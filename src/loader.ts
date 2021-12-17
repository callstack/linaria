/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';
import loaderUtils from 'loader-utils';
import enhancedResolve from 'enhanced-resolve';
import type { RawSourceMap } from 'source-map';
import * as EvalCache from './babel/eval-cache';
import Module from './babel/module';
import { debug } from './babel/utils/logger';
import transform from './transform';
import { getCacheInstance } from './cache';
import type { Result } from './types';

type LoaderContext = Parameters<typeof loaderUtils.getOptions>[0];

const outputCssLoader = require.resolve('./outputCssLoader');

export default function loader(
  this: LoaderContext,
  content: string,
  inputSourceMap: RawSourceMap | null
) {
  // tell Webpack this loader is async
  this.async();

  debug('loader', this.resourcePath);

  EvalCache.clearForFile(this.resourcePath);

  const {
    sourceMap = undefined,
    preprocessor = undefined,
    extension = '.linaria.css',
    cacheProvider,
    ...rest
  } = loaderUtils.getOptions(this) || {};

  const outputFilename = this.resourcePath.replace(/\.[^.]+$/, extension);

  const resolveOptions = {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  };

  const resolveSync = enhancedResolve.create.sync(
    // this._compilation is a deprecated API
    // However there seems to be no other way to access webpack's resolver
    // There is this.resolve, but it's asynchronous
    // Another option is to read the webpack.config.js, but it won't work for programmatic usage
    // This API is used by many loaders/plugins, so hope we're safe for a while
    this._compilation?.options.resolve
      ? {
          ...resolveOptions,
          alias: this._compilation.options.resolve.alias,
          modules: this._compilation.options.resolve.modules,
        }
      : resolveOptions
  );

  let result: Result;

  const originalResolveFilename = Module._resolveFilename;

  try {
    // Use webpack's resolution when evaluating modules
    Module._resolveFilename = (id, { filename }) => {
      const result = resolveSync(path.dirname(filename), id);
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

    getCacheInstance(cacheProvider)
      .then((cacheInstance) => cacheInstance.set(this.resourcePath, cssText))
      .then(() => {
        const request = `${outputFilename}!=!${outputCssLoader}?cacheProvider=${encodeURIComponent(
          cacheProvider
        )}!${this.resourcePath}`;
        const stringifiedRequest = loaderUtils.stringifyRequest(this, request);

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
}
