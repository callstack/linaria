import type { TransformOptions, PluginItem } from '@babel/core';

import type { Evaluator } from '@linaria/utils';
import { getPluginKey, hasEvaluatorMetadata } from '@linaria/utils';

export { default as shakerPlugin } from './plugins/shaker-plugin';

const hasKeyInList = (plugin: PluginItem, list: string[]): boolean => {
  const pluginKey = getPluginKey(plugin);
  return pluginKey ? list.some((i) => pluginKey.includes(i)) : false;
};

const shaker: Evaluator = (
  evalConfig,
  ast,
  code,
  { highPriorityPlugins, ...config },
  babel
) => {
  const preShakePlugins =
    evalConfig.plugins?.filter((i) => hasKeyInList(i, highPriorityPlugins)) ??
    [];

  const plugins = [
    ...preShakePlugins,
    [require.resolve('./plugins/shaker-plugin'), config],
    ...(evalConfig.plugins ?? []).filter(
      (i) => !hasKeyInList(i, highPriorityPlugins)
    ),
  ];

  const hasCommonjsPlugin = evalConfig.plugins?.some(
    (i) => getPluginKey(i) === 'transform-modules-commonjs'
  );

  if (!hasCommonjsPlugin) {
    plugins.push(require.resolve('@babel/plugin-transform-modules-commonjs'));
  }

  if (
    evalConfig.filename?.endsWith('.ts') ||
    evalConfig.filename?.endsWith('.tsx')
  ) {
    const hasTypescriptPlugin = evalConfig.plugins?.some(
      (i) => getPluginKey(i) === '@babel/plugin-transform-typescript'
    );

    if (!hasTypescriptPlugin) {
      plugins.push(require.resolve('@babel/plugin-transform-typescript'));
    }
  }

  const transformOptions: TransformOptions = {
    ...evalConfig,
    caller: {
      name: 'linaria',
    },
    plugins,
  };

  const transformed = babel.transformFromAstSync(ast, code, transformOptions);

  if (!transformed || !hasEvaluatorMetadata(transformed.metadata)) {
    throw new Error(`${evalConfig.filename} has no shaker metadata`);
  }

  return [
    transformed.ast!,
    transformed.code ?? '',
    transformed.metadata.linariaEvaluator.imports,
  ];
};

export default shaker;
