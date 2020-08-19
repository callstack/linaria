/* eslint-disable no-template-curly-in-string */

import path from 'path';
import { transformUrl } from '../preprocess';

describe('transformUrl', () => {
  type TransformUrlArgs = Parameters<typeof transformUrl>;
  const dataset: Record<string, TransformUrlArgs> = {
    '../assets/test.jpg': [
      './assets/test.jpg',
      './.linaria-cache/test.css',
      './test.js',
    ],
    '../a/b/test.jpg': [
      '../a/b/test.jpg',
      './.linaria-cache/test.css',
      './a/test.js',
    ],
  };

  it('should work with posix paths', () => {
    for (const result of Object.keys(dataset)) {
      expect(transformUrl(...dataset[result])).toBe(result);
    }
  });

  it('should work with win32 paths', () => {
    const toWin32 = (p: string) => p.split(path.posix.sep).join(path.win32.sep);
    const win32Dataset = Object.keys(dataset).reduce(
      (acc, key) => ({
        ...acc,
        [key]: [
          dataset[key][0],
          toWin32(dataset[key][1]),
          toWin32(dataset[key][2]),
          path.win32,
        ] as TransformUrlArgs,
      }),
      {} as Record<string, TransformUrlArgs>
    );

    for (const result of Object.keys(win32Dataset)) {
      expect(transformUrl(...win32Dataset[result])).toBe(result);
    }
  });
});
