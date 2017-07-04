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

  const { sourceFile, isEsm, isDefault } =
    imports.find(({ name }) => name === importStatement.sourceFrom) ||
    importStatement;

  if (!sourceFile) {
    throw new Error(
      `Could not find require statement for ${importStatement.sourceFrom || ''}`
    );
  }

  let filePath = join(dirname(relativeTo), sourceFile);
  if (!extname(filePath).length) {
    filePath += '.js';
  }

  const { code } = babel.transformFileSync(filePath, {
    plugins: ['transform-es2015-modules-commonjs'],
  });

  const importedModule = requireFromString(code, filePath);

  if (!Object.keys(importedModule).length) {
    throw new Error(`${filePath} must export an object`);
  }

  importedModule.__useDefault = isEsm && isDefault;

  return importedModule;
}
