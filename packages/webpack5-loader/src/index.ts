/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';

import type { RawSourceMap } from 'source-map';
import type { RawLoaderDefinitionFunction } from 'webpack';

import type { Result, Preprocessor } from '@linaria/babel-preset';
import { transform } from '@linaria/babel-preset';
import { debug } from '@linaria/logger';

import type { ICache } from './cache';
import { getCacheInstance } from './cache';

const outputCssLoader = require.resolve('./outputCssLoader');

type Loader = RawLoaderDefinitionFunction<{
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
  extension?: string;
  cacheProvider?: string | ICache;
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

  const {
    sourceMap = undefined,
    preprocessor = undefined,
    extension = '.linaria.css',
    cacheProvider,
    ...rest
  } = this.getOptions() || {};

  const outputFileName = this.resourcePath.replace(/\.[^.]+$/, extension);

  const asyncResolve = (token: string, importer: string): Promise<string> => {
    const context = path.isAbsolute(importer)
      ? path.dirname(importer)
      : path.join(process.cwd(), path.dirname(importer));
    return new Promise((resolve, reject) => {
      this.resolve(context, token, (err, result) => {
        if (err) {
          reject(err);
        } else if (result) {
          this.addDependency(result);
          resolve(result);
        } else {
          reject(new Error(`Cannot resolve ${token}`));
        }
      });
    });
  };

  transform(
    content.toString(),
    {
      filename: path.relative(process.cwd(), this.resourcePath),
      inputSourceMap: convertSourceMap(inputSourceMap, this.resourcePath),
      pluginOptions: rest,
      preprocessor,
    },
    asyncResolve
  ).then(async (result: Result) => {
    if (result.cssText) {
      let { cssText } = result;

      if (sourceMap) {
        cssText += `/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
          result.cssSourceMapText || ''
        ).toString('base64')}*/`;
      }

      await Promise.all(
        result.dependencies?.map((dep) =>
          asyncResolve(dep, this.resourcePath)
        ) ?? []
      );

      getCacheInstance(cacheProvider)
        .then((cacheInstance) => cacheInstance.set(this.resourcePath, cssText))
        .then(() => {
          const request = `${outputFileName}!=!${outputCssLoader}?cacheProvider=${encodeURIComponent(
            typeof cacheProvider === 'string' ? cacheProvider : ''
          )}!${this.resourcePath}`;
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
  });
};

export default webpack5Loader;
