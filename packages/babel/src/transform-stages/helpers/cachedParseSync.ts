import type { ParseResult, TransformOptions } from '@babel/core';

import type { Core } from '../../babel';

const cache = new WeakMap<
  Partial<TransformOptions>,
  Map<string, ParseResult>
>();

export default function cachedParseSync(
  babel: Core,
  code: string,
  babelOptions: TransformOptions
): ParseResult {
  const fileCache = cache.get(babelOptions) ?? new Map<string, ParseResult>();
  if (fileCache.has(code)) {
    return fileCache.get(code)!;
  }

  const file = babel.parseSync(code, babelOptions)!;

  fileCache.set(code, file);
  cache.set(babelOptions, fileCache);

  return file;
}
