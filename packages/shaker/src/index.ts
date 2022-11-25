import type { TransformOptions } from '@babel/core';

import { buildOptions, loadBabelOptions } from '@linaria/utils';
import type { Evaluator } from '@linaria/utils';

import { hasShakerMetadata } from './plugins/shaker-plugin';

export { default as shakerPlugin } from './plugins/shaker-plugin';

const configCache = new Map<string, TransformOptions>();
const getShakerConfig = (only: string[] | null): TransformOptions => {
  const sortedOnly = [...(only ?? [])];
  sortedOnly.sort();
  const key = sortedOnly.join('\0');
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
          onlyExports: sortedOnly,
        },
      ],
      require.resolve('@babel/plugin-transform-modules-commonjs'),
    ],
  };

  configCache.set(key, config);
  return config;
};

const shaker: Evaluator = (filename, options, text, only, babel) => {
  const transformOptions = loadBabelOptions(
    babel,
    filename,
    buildOptions(options?.babelOptions, getShakerConfig(only))
  );

  const transformed = babel.transformSync(text, {
    ...transformOptions,
    filename,
  });

  if (!transformed || !hasShakerMetadata(transformed.metadata)) {
    throw new Error(`${filename} has no shaker metadata`);
  }

  return [transformed.code ?? '', transformed.metadata.__linariaShaker.imports];
};

export default shaker;
