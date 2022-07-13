declare module 'babel-merge' {
  import type { TransformOptions } from '@babel/core';

  interface Options {
    arrayMerge?(
      target: unknown[],
      source: unknown[],
      options?: Options
    ): unknown[];
    clone?: boolean;
    customMerge?: (
      key: string,
      options?: Options
    ) => ((x: unknown, y: unknown) => unknown) | undefined;
    isMergeableObject?(value: object): boolean;
  }

  interface BabelMerge {
    (
      source?: TransformOptions,
      overrides?: TransformOptions,
      deepmergeOpts?: Options
    ): TransformOptions;
    all(
      values: (TransformOptions | undefined)[],
      deepmergeOpts?: Options
    ): TransformOptions;
  }

  const babelMerge: BabelMerge;

  export = babelMerge;
}
