/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import normalize from 'normalize-path';
import loaderUtils from 'loader-utils';
import enhancedResolve from 'enhanced-resolve';
import findYarnWorkspaceRoot from 'find-yarn-workspace-root';
import type { RawSourceMap } from 'source-map';
import cosmiconfig from 'cosmiconfig';
import { EvalCache, Module, transform } from '@linaria/babel-preset';
import { debug, notify } from '@linaria/logger';

const workspaceRoot = findYarnWorkspaceRoot();
const lernaConfig = cosmiconfig('lerna', {
  searchPlaces: ['lerna.json'],
}).searchSync();
const lernaRoot =
  lernaConfig !== null ? path.dirname(lernaConfig.filepath) : null;

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

export default function webpack4Loader(
  this: LoaderContext,
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
    cacheDirectory = '.linaria-cache',
    preprocessor = undefined,
    extension = '.linaria.css',
    resolveOptions = {},
    ...rest
  } = loaderUtils.getOptions(this) || {};

  const root = workspaceRoot || lernaRoot || process.cwd();

  const baseOutputFileName = this.resourcePath.replace(/\.[^.]+$/, extension);

  const outputFilename = normalize(
    path.join(
      path.isAbsolute(cacheDirectory)
        ? cacheDirectory
        : path.join(process.cwd(), cacheDirectory),
      this.resourcePath.includes(root)
        ? path.relative(root, baseOutputFileName)
        : baseOutputFileName
    )
  );

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
    ...(this._compilation?.options.resolve ?? {}),
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
      this.addDependency(result);
      return result;
    };

    result = transform(content, {
      filename: path.relative(process.cwd(), this.resourcePath),
      inputSourceMap: inputSourceMap ?? undefined,
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
      `${result.code}\n\nrequire(${loaderUtils.stringifyRequest(
        this,
        outputFilename
      )});`,
      castSourceMap(result.sourceMap)
    );
    return;
  }

  this.callback(null, result.code, castSourceMap(result.sourceMap));
}
