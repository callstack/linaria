import type { TransformOptions } from '@babel/core';

import { buildOptions, loadBabelOptions } from '@linaria/utils';
import type { Evaluator, EvaluatorConfig } from '@linaria/utils';

import { hasShakerMetadata } from './plugins/shaker-plugin';

export { default as shakerPlugin } from './plugins/shaker-plugin';

const configCache = new Map<string, TransformOptions>();
const getShakerConfig = (
  evaluatorConfig: EvaluatorConfig | string[] | null
): TransformOptions => {
  const onlyExports =
    evaluatorConfig && 'onlyExports' in evaluatorConfig
      ? evaluatorConfig.onlyExports
      : evaluatorConfig ?? [];
  const deadImports =
    evaluatorConfig && 'deadImports' in evaluatorConfig
      ? evaluatorConfig.deadImports
      : [];

  const keyParts = [
    ...onlyExports,
    ...deadImports.map((i) => `${i.from}:${i.what}`),
  ];

  keyParts.sort();
  const key = keyParts.join('\0');
  if (configCache.has(key)) {
    return configCache.get(key)!;
  }

  const config = {
    ast: true,
    caller: {
      name: 'linaria',
    },
    targets: {
      node: 'current',
      esmodules: false,
    },
    plugins: [
      [
        require.resolve('./plugins/shaker-plugin'),
        {
          deadImports,
          onlyExports,
        },
      ],
      require.resolve('@babel/plugin-transform-modules-commonjs'),
    ],
  };

  configCache.set(key, config);
  return config;
};

const shaker: Evaluator = (filename, options, code, config, babel) => {
  const transformOptions = loadBabelOptions(
    babel,
    filename,
    buildOptions(options?.babelOptions, getShakerConfig(config))
  );

  if (typeof code === 'string') {
    throw new Error('shaker does not support string code');
  }

  const transformed =
    typeof code === 'string'
      ? babel.transformSync(code, transformOptions)
      : babel.transformFromAstSync(...code, transformOptions);

  if (!transformed || !hasShakerMetadata(transformed.metadata)) {
    throw new Error(`${filename} has no shaker metadata`);
  }

  return [
    transformed.ast!,
    transformed.code ?? '',
    transformed.metadata.__linariaShaker.imports,
    transformed.metadata.__linariaShaker.exports,
  ];
};

export default shaker;
