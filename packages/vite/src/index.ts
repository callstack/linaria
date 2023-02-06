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
import { getFileIdx } from '@linaria/utils';

type VitePluginOptions = {
  include?: FilterPattern;
  exclude?: FilterPattern;
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
} & Partial<PluginOptions>;

export { Plugin };

export default function linaria({
  include,
  exclude,
  sourceMap,
  preprocessor,
  ...rest
}: VitePluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);
  const cssLookup: { [key: string]: string } = {};
  let config: ResolvedConfig;
  let devServer: ViteDevServer;

  // <dependency id, targets>
  const targets: { id: string; dependencies: string[] }[] = [];
  const cache = new TransformCacheCollection();
  const { codeCache, evalCache } = cache;
  return {
    name: 'linaria',
    enforce: 'post',
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(_server) {
      devServer = _server;
    },
    load(url: string) {
      const [id] = url.split('?');
      return cssLookup[id];
    },
    /* eslint-disable-next-line consistent-return */
    resolveId(importeeUrl: string) {
      const [id, qsRaw] = importeeUrl.split('?');
      if (id in cssLookup) {
        if (qsRaw?.length) return importeeUrl;
        return id;
      }
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
        codeCache.delete(depId);
        evalCache.delete(depId);
      }
      const modules = affected
        .map((target) => devServer.moduleGraph.getModuleById(target.id))
        .concat(ctx.modules)
        .filter((m): m is ModuleNode => !!m);

      return modules;
    },
    async transform(code: string, url: string) {
      const [id] = url.split('?');

      // Do not transform ignored and generated files
      if (url.includes('node_modules') || !filter(url) || id in cssLookup)
        return;

      const log = createCustomDebug('rollup', getFileIdx(id));

      log('rollup-init', id);

      const asyncResolve = async (what: string, importer: string) => {
        const resolved = await this.resolve(what, importer);
        if (resolved) {
          log('resolve', "✅ '%s'@'%s -> %O\n%s", what, importer, resolved);
          // Vite adds param like `?v=667939b3` to cached modules
          const resolvedId = resolved.id.split('?')[0];

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

      // TODO: Vite surely has some already transformed modules, solid
      // why would we transform it again?
      // We could provide some thing like `pretransform` and ask Vite to return transformed module
      // (module.transformResult)
      // So we don't need to duplicate babel plugins.
      const result = await transform(
        code,
        {
          filename: id,
          preprocessor,
          pluginOptions: rest,
        },
        asyncResolve,
        {},
        cache
      );

      let { cssText, dependencies } = result;

      if (!cssText) return;
      dependencies ??= [];

      const slug = slugify(cssText);

      const cssFilename = path.normalize(
        `${id.replace(/\.[jt]sx?$/, '')}_${slug}.css`
      );
      const cssRelativePath = path
        .relative(config.root, cssFilename)
        .replace(/\\/g, path.posix.sep);
      const cssId = `/${cssRelativePath}`;

      if (sourceMap && result.cssSourceMapText) {
        const map = Buffer.from(result.cssSourceMapText).toString('base64');
        cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
      }

      cssLookup[cssFilename] = cssText;
      cssLookup[cssId] = cssText;

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
