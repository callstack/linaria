import type { TransformOptions } from '@babel/core';

import type { Core } from '../babel';

const cache = new WeakMap<
  Partial<TransformOptions>,
  Map<string, TransformOptions>
>();

const empty = {};

export default function loadBabelOptions(
  babel: Core,
  filename: string,
  overrides: TransformOptions = empty
) {
  const fileCache = cache.get(overrides) ?? new Map<string, TransformOptions>();
  if (fileCache.has(filename)) {
    return fileCache.get(filename)!;
  }

  const babelOptions: TransformOptions =
    babel.loadOptions({
      ...overrides,
      filename,
      caller: { name: 'linaria' },
    }) ?? {};

  fileCache.set(filename, babelOptions);
  cache.set(overrides, fileCache);

  return babelOptions;
}
