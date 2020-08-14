import generator from '@babel/generator';
import { transformSync } from '@babel/core';
import type { Program } from '@babel/types';
import type { Evaluator, StrictOptions } from '../../types';
import { debug } from '../../utils/logger';
import buildOptions from '../buildOptions';
import shake from './shaker';

function prepareForShake(
  filename: string,
  options: StrictOptions,
  code: string
): Program {
  const transformOptions = buildOptions(filename, options);

  transformOptions.ast = true;
  transformOptions.presets!.unshift([
    '@babel/preset-env',
    {
      targets: 'ie 11',
      // we need this plugin so we list it explicitly, explanation in `evaluators/extractor/index`
      include: ['@babel/plugin-transform-template-literals'],
    },
  ]);
  transformOptions.presets!.unshift([require.resolve('../preeval'), options]);
  transformOptions.plugins!.unshift('transform-react-remove-prop-types');
  transformOptions.plugins!.unshift([
    '@babel/plugin-transform-runtime',
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
