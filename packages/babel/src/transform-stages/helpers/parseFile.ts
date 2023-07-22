import type { File } from '@babel/types';

import { createCustomDebug } from '@linaria/logger';
import type { EvalRule } from '@linaria/utils';
import { buildOptions, getFileIdx } from '@linaria/utils';

import type { Core } from '../../babel';
import type { Options } from '../../types';

import loadLinariaOptions from './loadLinariaOptions';

export function getMatchedRule(
  rules: EvalRule[],
  filename: string,
  code: string
): EvalRule {
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i];
    if (!rule.test) {
      return rule;
    }

    if (typeof rule.test === 'function' && rule.test(filename, code)) {
      return rule;
    }

    if (rule.test instanceof RegExp && rule.test.test(filename)) {
      return rule;
    }
  }

  return { action: 'ignore' };
}

export function parseFile(
  babel: Core,
  filename: string,
  originalCode: string,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>
): [ast: File | 'ignored', code: string] {
  const log = createCustomDebug('transform:parse', getFileIdx(filename));

  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const { action, babelOptions } = getMatchedRule(
    pluginOptions.rules,
    filename,
    originalCode
  );

  if (action === 'ignore' || filename.endsWith('.json')) {
    log(
      'stage-1',
      `${filename} has been ignored because of ${
        action === 'ignore' ? 'rule' : 'extension'
      }`
    );

    return ['ignored', originalCode];
  }

  const parseConfig = buildOptions(pluginOptions?.babelOptions, babelOptions);

  const parseResult = babel.parseSync(originalCode, {
    ...parseConfig,
    sourceMaps: true,
    sourceFileName: filename,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    ast: true,
    filename,
  });
  if (!parseResult) {
    throw new Error(`Failed to parse ${filename}`);
  }

  log('stage-1', `${filename} has been parsed`);

  return [parseResult, originalCode];
}
