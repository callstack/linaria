import type { TransformOptions, PluginItem } from '@babel/core';

import type { Evaluator } from '@linaria/utils';
import { hasEvaluatorMetadata } from '@linaria/utils';

export { default as shakerPlugin } from './plugins/shaker-plugin';

const getKey = (plugin: PluginItem): string | null => {
  if (typeof plugin === 'string') {
    return plugin;
  }

  if (Array.isArray(plugin)) {
    return getKey(plugin[0]);
  }

  if (typeof plugin === 'object' && plugin !== null && 'key' in plugin) {
    return (plugin as { key?: string | null }).key ?? null;
  }

  return null;
};

const hasKeyInList = (plugin: PluginItem, list: string[]): boolean => {
  const pluginKey = getKey(plugin);
  return pluginKey ? list.some((i) => pluginKey.includes(i)) : false;
};

const shaker: Evaluator = (
  babelOptions,
  ast,
  code,
  { highPriorityPlugins, ...config },
  babel
) => {
  const preShakePlugins =
    babelOptions.plugins?.filter((i) => hasKeyInList(i, highPriorityPlugins)) ??
    [];

  const plugins = [
    ...preShakePlugins,
    [require.resolve('./plugins/shaker-plugin'), config],
    ...(babelOptions.plugins ?? []).filter(
      (i) => !hasKeyInList(i, highPriorityPlugins)
    ),
  ];

  const hasCommonjsPlugin = babelOptions.plugins?.some(
    (i) => getKey(i) === 'transform-modules-commonjs'
  );

  if (!hasCommonjsPlugin) {
    plugins.push(require.resolve('@babel/plugin-transform-modules-commonjs'));
  }

  const transformOptions: TransformOptions = {
    ...babelOptions,
    caller: {
      name: 'linaria',
    },
    plugins,
  };

  const transformed = babel.transformFromAstSync(ast, code, transformOptions);

  if (!transformed || !hasEvaluatorMetadata(transformed.metadata)) {
    throw new Error(`${babelOptions.filename} has no shaker metadata`);
  }

  return [
    transformed.ast!,
    transformed.code ?? '',
    transformed.metadata.linariaEvaluator.imports,
  ];
};

export default shaker;
