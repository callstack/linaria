import { buildOptions, Evaluator } from '@linaria/babel-preset';
import { debug } from '@linaria/logger';
import { parseSync } from '@babel/core';
import generator from '@babel/generator';
import shake from './shaker';

const shaker: Evaluator = (filename, options, text, only = null) => {
  const transformOptions = buildOptions(filename, options);
  transformOptions.ast = true;

  const parsed = parseSync(text, transformOptions);
  if (parsed === null) {
    throw new Error(`${filename} cannot be transformed`);
  }

  const [shaken, imports] = shake(parsed, only, options);

  debug('evaluator:shaker:generate', `Generate shaken source code ${filename}`);
  const { code: shakenCode } = generator(shaken!);
  return [shakenCode, imports];
};

export default shaker;
