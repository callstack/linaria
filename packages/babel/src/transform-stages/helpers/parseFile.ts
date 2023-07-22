import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import { createCustomDebug } from '@linaria/logger';
import type { EvalRule } from '@linaria/utils';
import { getFileIdx } from '@linaria/utils';

import type { Core } from '../../babel';

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
  parseConfig: TransformOptions
): File {
  const log = createCustomDebug('transform:parse', getFileIdx(filename));

  const parseResult = babel.parseSync(originalCode, parseConfig);
  if (!parseResult) {
    throw new Error(`Failed to parse ${filename}`);
  }

  log('stage-1', `${filename} has been parsed`);

  return parseResult;
}
