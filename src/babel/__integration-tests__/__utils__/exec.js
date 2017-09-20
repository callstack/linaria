/* @flow */

import childProcess from 'child_process';
import path from 'path';

export function transpile(
  source: string,
  pluginOptions: any = { cache: false, extract: false },
  babelOptions: any = { filename: 'test.js' }
) {
  const PATH_TO_TRANSPILE_BIN = path.join(__dirname, './transpile.js');

  const stdout = childProcess.execSync(
    `node ${PATH_TO_TRANSPILE_BIN} '${JSON.stringify(
      source
    )}' '${JSON.stringify({
      pluginOptions,
      babelOptions,
    })}'`,
    { stdio: 'pipe' }
  );

  const [transpiled, rawStyles] = stdout.toString().split('\n');
  const styles = JSON.parse(rawStyles || '{}');
  return {
    code: JSON.parse(transpiled || '""'),
    styles,
    getCSSForClassName(className: string) {
      return styles[`.${className}`];
    },
  };
}

export function extract(
  source: string,
  pluginOptions: any = { cache: false, extract: true },
  babelOptions: any = { filename: 'test.js' }
) {
  const PATH_TO_EXTRACT_BIN = path.join(__dirname, './extract.js');

  const stdout = childProcess.execSync(
    `node ${PATH_TO_EXTRACT_BIN} '${JSON.stringify(source)}' '${JSON.stringify({
      pluginOptions,
      babelOptions,
    })}'`,
    { stdio: 'pipe' }
  );

  const [data, filenames, transpiled] = stdout.toString().split('\n');
  return {
    data: JSON.parse(data || '""'),
    filenames: JSON.parse(filenames || '[]'),
    transpiled: JSON.parse(transpiled || '""'),
  };
}
