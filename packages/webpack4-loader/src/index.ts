/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';

import loaderUtils from 'loader-utils';
import type { RawSourceMap } from 'source-map';

import type { Result } from '@linaria/babel-preset';
import { transform } from '@linaria/babel-preset';
import { debug } from '@linaria/logger';

import { getCacheInstance } from './cache';

type LoaderContext = Parameters<typeof loaderUtils.getOptions>[0];

const castSourceMap = <T extends { version: number } | { version: string }>(
  sourceMap: T | null | undefined
) =>
  sourceMap
    ? {
        ...sourceMap,
        version: sourceMap.version.toString(),
      }
    : undefined;

const outputCssLoader = require.resolve('./outputCssLoader');

export default function webpack4Loader(
  this: LoaderContext,
  content: string,
  inputSourceMap: RawSourceMap | null
) {
  // tell Webpack this loader is async
  this.async();

  debug('loader', this.resourcePath);

  const {
    sourceMap = undefined,
    preprocessor = undefined,
    extension = '.linaria.css',
    cacheProvider,
    ...rest
  } = loaderUtils.getOptions(this) || {};

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
      inputSourceMap: inputSourceMap ?? undefined,
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
            cacheProvider ?? ''
          )}!${this.resourcePath}`;
          const stringifiedRequest = loaderUtils.stringifyRequest(
            this,
            request
          );

          return this.callback(
            null,
            `${result.code}\n\nrequire(${stringifiedRequest});`,
            castSourceMap(result.sourceMap)
          );
        })
        .catch((err: Error) => this.callback(err));
      return;
    }

    this.callback(null, result.code, castSourceMap(result.sourceMap));
  });
}
