/* @flow */

import fs from 'fs';
import path from 'path';

import type { BabelTypes, NodePath } from './types';

import sheet from '../sheet';

function parseCurrentFilename(filename, outDir) {
  const dirname = path.isAbsolute(filename)
    ? path.dirname(filename)
    : path.join(process.cwd(), outDir);
  const basename = /(.+)\..+$/.exec(path.basename(filename))[1];
  return path.join(dirname, `${basename}.css`);
}

function parseFilename(filename, currentFilename, outDir) {
  const dirname = path.isAbsolute(outDir)
    ? outDir
    : path.join(process.cwd(), outDir);
  const basename = /(.+)\..+$/.exec(path.basename(currentFilename))[1];
  return path.join(dirname, filename.replace('[name]', basename));
}

export default function extractStyles(
  types: BabelTypes,
  program: NodePath<*>,
  currentFilename: string,
  options: { single?: boolean, filename?: string, outDir?: string },
  { appendFileSync, writeFileSync }: * = fs
) {
  const { single, filename } = {
    single: false,
    ...options,
    filename: options.filename
      ? parseFilename(options.filename, currentFilename, options.outDir || '')
      : parseCurrentFilename(currentFilename, options.outDir || ''),
  };

  /* $FlowFixMe */
  const data = sheet.dump();

  if (single) {
    appendFileSync(filename, data);
  } else {
    writeFileSync(filename, data);
    program.node.body.unshift(
      types.expressionStatement(
        types.callExpression(types.identifier('require'), [
          types.stringLiteral(filename),
        ])
      )
    );
  }
}
