import * as babel from '@babel/core';
import type { TransformOptions } from '@babel/core';

const cache = new WeakMap<
  Partial<TransformOptions>,
  Map<string, TransformOptions>
>();

const empty = {};

export default function loadBabelOptions(
  filename: string,
  overrides: TransformOptions = empty
) {
  const fileCache = cache.get(overrides) ?? new Map<string, TransformOptions>();
  if (fileCache.has(filename)) {
    return fileCache.get(filename)!;
  }

  const babelOptions: babel.TransformOptions =
    babel.loadOptions({
      ...overrides,
      filename,
      caller: { name: 'linaria' },
    }) ?? {};

  fileCache.set(filename, babelOptions);
  cache.set(overrides, fileCache);

  return babelOptions;
}
