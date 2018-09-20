/* @flow */

import path from 'path';
import glob from 'glob';

const files = glob.sync('**/*', {
  ignore: ['node_modules/**/*'],
  absolute: true,
});

function resolvePath(original: string) {
  const {
    config: { single, outDir, filename: cssFilename },
    filename,
    // $FlowFixMe
  } = require('@linaria_provide/env'); // eslint-disable-line

  const absAssetFilename = path.join(path.dirname(filename), original);
  const relativeFilename = path.isAbsolute(filename)
    ? path.relative(process.cwd(), filename)
    : filename;
  const absCssFilename = path.resolve(
    outDir || '.linaria-cache',
    single ? cssFilename : relativeFilename
  );

  if (
    path.isAbsolute(original) ||
    files.indexOf(path.resolve(path.dirname(absCssFilename), original)) > -1
  ) {
    return original;
  }

  return path.relative(path.dirname(absCssFilename), absAssetFilename);
}

function replacePath(input: string, match: string) {
  return input.replace(match, resolvePath(match));
}

export default function stylisResolvePlugin(context: number, content: string) {
  return context === 1 // Apply on property
    ? content.replace(/url\(['"](.+)['"]\)/, replacePath)
    : content;
}
