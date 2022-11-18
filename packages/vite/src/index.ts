/**
 * This file contains a Rollup loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import path from 'path';

import { createFilter } from '@rollup/pluginutils';
import type { FilterPattern } from '@rollup/pluginutils';
import type {
  ModuleNode,
  Plugin,
  ResolvedConfig,
  Update,
  ViteDevServer,
} from 'vite';

import { transform, slugify } from '@linaria/babel-preset';
import type {
  PluginOptions,
  Preprocessor,
  CodeCache,
  Module,
} from '@linaria/babel-preset';
import { createCustomDebug } from '@linaria/logger';
import { getFileIdx } from '@linaria/utils';

type VitePluginOptions = {
  include?: FilterPattern;
  exclude?: FilterPattern;
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
} & Partial<PluginOptions>;

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
  const codeCache: CodeCache = new Map();
  const resolveCache = new Map<string, string>();
  const evalCache = new Map<string, Module>();

  return {
    name: 'linaria',
    // enforce: 'pre',
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(_server) {
      devServer = _server;
    },
    load(id: string) {
      return cssLookup[id];
    },
    /* eslint-disable-next-line consistent-return */
    resolveId(importee: string) {
      if (importee in cssLookup) return importee;
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
    async transform(code: string, id: string) {
      // Remove from cache if file has changed
      codeCache.delete(id);

      // Do not transform ignored and generated files
      if (id.includes('node_modules') || !filter(id) || id in cssLookup) return;

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
        resolveCache,
        codeCache,
        evalCache
      );

      let { cssText, dependencies } = result;

      if (!cssText) return;
      dependencies ??= [];

      const slug = slugify(cssText);

      const cssFilename = `${id.replace(/\.[jt]sx?$/, '')}_${slug}.css`;
      const cssId = `/${path.relative(config.root, cssFilename)}`;

      if (sourceMap && result.cssSourceMapText) {
        const map = Buffer.from(result.cssSourceMapText).toString('base64');
        cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
      }

      cssLookup[cssId] = cssText;

      result.code += `\nimport ${JSON.stringify(cssId)};\n`;
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
        const depModule = await this.resolve(dependencies[i], id, {
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
