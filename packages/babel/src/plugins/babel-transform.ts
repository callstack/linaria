import type { BabelFile, PluginObj } from '@babel/core';

import { debug } from '@linaria/logger';
import { syncResolve } from '@linaria/utils';

import type { Core } from '../babel';
import { TransformCacheCollection } from '../cache';
import { transformSync } from '../transform';
import type { ICollectAction, SyncScenarioForAction } from '../transform/types';
import type { IPluginState, PluginOptions } from '../types';

import { collector } from './collector';

export default function babelTransform(
  babel: Core,
  options: Partial<PluginOptions>
): PluginObj<IPluginState> {
  const cache = new TransformCacheCollection();

  return {
    name: '@linaria/babel/babel-transform',
    pre(file: BabelFile) {
      // eslint-disable-next-line require-yield
      function* collect(
        this: ICollectAction<'sync'>
      ): SyncScenarioForAction<ICollectAction<'sync'>> {
        const { valueCache } = this.data;
        const { ast, code, pluginOptions } = this.entrypoint;

        collector(file, pluginOptions, valueCache);

        return {
          ast,
          code,
        };
      }

      debug('babel-transform:start', file.opts.filename);

      transformSync(
        {
          babel,
          cache,
          options: {
            filename: file.opts.filename!,
            root: file.opts.root ?? undefined,
            inputSourceMap: file.opts.inputSourceMap ?? undefined,
            pluginOptions: options,
          },
        },
        file.code,
        syncResolve,
        {
          collect,
        }
      );
    },
    visitor: {},
    post(file: BabelFile) {
      debug('babel-transform:end', file.opts.filename);
    },
  };
}
