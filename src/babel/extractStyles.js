/* @flow */

import fs from 'fs';
import path from 'path';

import type { BabelTypes, NodePath } from './types';

import sheet from '../sheet';

function withCssExtension(filename) {
  const dirname = path.dirname(filename);
  const basename = path.basename(filename, '.js');
  const file = /\.css$/.test(basename) ? basename : `${basename}.css`;
  return path.join(dirname, file);
}

export default function extractStyles(
  types: BabelTypes,
  program: NodePath<*>,
  currentFilename: string,
  options: { single?: boolean, filename?: string },
  { appendFileSync, writeFileSync }: * = fs
) {
  const { single, filename } = {
    single: false,
    ...options,
    filename: withCssExtension(options.filename || currentFilename),
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
