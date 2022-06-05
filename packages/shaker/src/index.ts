import { transformSync } from '@babel/core';
import generator from '@babel/generator';
import type { Program } from '@babel/types';

import type { Evaluator, StrictOptions } from '@linaria/babel-preset';
import { buildOptions } from '@linaria/babel-preset';
import { debug } from '@linaria/logger';

import shake from './shaker';

export { default as buildDepsGraph } from './graphBuilder';

function prepareForShake(
  filename: string,
  options: StrictOptions,
  code: string
): Program {
  const transformOptions = buildOptions(filename, options);

  transformOptions.ast = true;
  transformOptions.presets!.unshift([
    require.resolve('@babel/preset-env'),
    {
      targets: 'ie 11',
    },
  ]);
  transformOptions.presets!.unshift([
    require.resolve('@linaria/preeval'),
    options,
  ]);
  transformOptions.plugins!.unshift(
    require.resolve('babel-plugin-transform-react-remove-prop-types')
  );
  transformOptions.plugins!.unshift([
    require.resolve('@babel/plugin-transform-runtime'),
    { useESModules: false },
  ]);

  debug(
    'evaluator:shaker:transform',
    `Transform ${filename} with options ${JSON.stringify(
      transformOptions,
      null,
      2
    )}`
  );
  const transformed = transformSync(code, transformOptions);

  if (transformed === null || !transformed.ast) {
    throw new Error(`${filename} cannot be transformed`);
  }

  return transformed.ast.program;
}

const shaker: Evaluator = (filename, options, text, only = null) => {
  const [shaken, imports] = shake(
    prepareForShake(filename, options, text),
    only
  );

  debug('evaluator:shaker:generate', `Generate shaken source code ${filename}`);
  const { code: shakenCode } = generator(shaken!);
  return [shakenCode, imports];
};

export default shaker;
