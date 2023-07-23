/**
 * This file contains a Rollup loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';

import { createFilter } from '@rollup/pluginutils';
import type { FilterPattern } from '@rollup/pluginutils';
import type { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';

import {
  transform,
  slugify,
  TransformCacheCollection,
} from '@linaria/babel-preset';
import type { PluginOptions, Preprocessor } from '@linaria/babel-preset';
import { createCustomDebug } from '@linaria/logger';
import type { IPerfMeterOptions } from '@linaria/utils';
import { createPerfMeter, getFileIdx, syncResolve } from '@linaria/utils';

type VitePluginOptions = {
  debug?: IPerfMeterOptions | false | null | undefined;
  include?: FilterPattern;
  exclude?: FilterPattern;
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
} & Partial<PluginOptions>;

export { Plugin };

const emptyConfig = {};

export default function linaria({
  debug,
  include,
  exclude,
  sourceMap,
  preprocessor,
  ...rest
}: VitePluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);
  const cssLookup: { [key: string]: string } = {};
  const cssFileLookup: { [key: string]: string } = {};
  let config: ResolvedConfig;
  let devServer: ViteDevServer;

  const { emitter, onDone } = createPerfMeter(debug ?? false);

  // <dependency id, targets>
  const targets: { id: string; dependencies: string[] }[] = [];
  const cache = new TransformCacheCollection();
  return {
    name: 'linaria',
    enforce: 'post',
    buildEnd() {
      onDone(process.cwd());
    },
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(_server) {
      devServer = _server;
    },
    load(url: string) {
      const [id] = url.split('?', 1);
      return cssLookup[id];
    },
    /* eslint-disable-next-line consistent-return */
    resolveId(importeeUrl: string) {
      const [id] = importeeUrl.split('?', 1);
      if (cssLookup[id]) return id;
      return cssFileLookup[id];
    },
    handleHotUpdate(ctx) {
      // it's module, so just transform it
      if (ctx.modules.length) return ctx.modules;

      // Select affected modules of changed dependency
      const affected = targets.filter(
        (x) =>
          // file is dependency of any target
          x.dependencies.some((dep) => dep === ctx.file) ||
          // or changed module is a dependency of any target
          x.dependencies.some((dep) => ctx.modules.some((m) => m.file === dep))
      );
      const deps = affected.flatMap((target) => target.dependencies);

      // eslint-disable-next-line no-restricted-syntax
      for (const depId of deps) {
        cache.invalidateForFile(depId);
      }

      const modules = affected
        .map((target) => devServer.moduleGraph.getModuleById(target.id))
        .concat(ctx.modules)
        .filter((m): m is ModuleNode => !!m);

      return modules;
    },
    async transform(code: string, url: string) {
      const [id] = url.split('?', 1);

      // Do not transform ignored and generated files
      if (url.includes('node_modules') || !filter(url) || id in cssLookup)
        return;

      const log = createCustomDebug('rollup', getFileIdx(id));

      log('rollup-init', id);

      const asyncResolve = async (
        what: string,
        importer: string,
        stack: string[]
      ) => {
        const resolved = await this.resolve(what, importer);
        if (resolved) {
          if (resolved.external) {
            // If module is marked as external, Rollup will not resolve it,
            // so we need to resolve it ourselves with default resolver
            const resolvedId = syncResolve(what, importer, stack);
            log('resolve', "✅ '%s'@'%s -> %O\n%s", what, importer, resolved);
            return resolvedId;
          }

          log('resolve', "✅ '%s'@'%s -> %O\n%s", what, importer, resolved);
          // Vite adds param like `?v=667939b3` to cached modules
          const resolvedId = resolved.id.split('?', 1)[0];

          if (resolvedId.startsWith('\0')) {
            // \0 is a special character in Rollup that tells Rollup to not include this in the bundle
            // https://rollupjs.org/guide/en/#outputexports
            return null;
          }

          return resolvedId;
        }

        log('resolve', "❌ '%s'@'%s", what, importer);
        throw new Error(`Could not resolve ${what}`);
      };

      const result = await transform(
        code,
        {
          filename: id,
          preprocessor,
          pluginOptions: rest,
        },
        asyncResolve,
        emptyConfig,
        cache,
        emitter
      );

      let { cssText, dependencies } = result;

      if (!cssText) return;
      dependencies ??= [];

      const slug = slugify(cssText);

      const cssFilename = path
        .normalize(`${id.replace(/\.[jt]sx?$/, '')}_${slug}.css`)
        .replace(/\\/g, path.posix.sep);

      const cssRelativePath = path
        .relative(config.root, cssFilename)
        .replace(/\\/g, path.posix.sep);

      const cssId = `/${cssRelativePath}`;

      if (sourceMap && result.cssSourceMapText) {
        const map = Buffer.from(result.cssSourceMapText).toString('base64');
        cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
      }

      cssLookup[cssFilename] = cssText;
      cssFileLookup[cssId] = cssFilename;

      result.code += `\nimport ${JSON.stringify(cssFilename)};\n`;
      if (devServer?.moduleGraph) {
        const module = devServer.moduleGraph.getModuleById(cssId);

        if (module) {
          devServer.moduleGraph.invalidateModule(module);
          module.lastHMRTimestamp =
            module.lastInvalidationTimestamp || Date.now();
        }
      }

      for (let i = 0, end = dependencies.length; i < end; i++) {
        // eslint-disable-next-line no-await-in-loop
        const depModule = await this.resolve(dependencies[i], url, {
          isEntry: false,
        });
        if (depModule) dependencies[i] = depModule.id;
      }
      const target = targets.find((t) => t.id === id);
      if (!target) targets.push({ id, dependencies });
      else target.dependencies = dependencies;
      /* eslint-disable-next-line consistent-return */
      return { code: result.code, map: result.sourceMap };
    },
  };
}
