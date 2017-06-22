/* @flow */

import type { ImportStatement } from './types';

import requireFromString from 'require-from-string';
import * as babel from 'babel-core';
import { join, extname, dirname } from 'path';

export default function importModule(
  name: string,
  imports: ImportStatement[],
  relativeTo: string
): ?Object {
  const importStatement: ?ImportStatement = imports.find(
    importStatement => importStatement.name === name
  );
  if (!importStatement) {
    return null;
  }

  const { source } =
    imports.find(({ name }) => name === importStatement.source) ||
    importStatement;

  let filePath = join(dirname(relativeTo), source);
  if (!extname(filePath).length) {
    filePath += '.js';
  }

  const { code } = babel.transformFileSync(filePath, {
    plugins: ['transform-es2015-modules-commonjs'],
  });

  const importedModule = requireFromString(code, filePath);

  if (typeof importedModule !== 'object') {
    throw new Error(`${filePath} must export an object`);
  }

  return importedModule;
}
