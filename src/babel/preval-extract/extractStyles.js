/* @flow */

import fs from 'fs';
import path from 'path';

import type { BabelTypes, NodePath } from '../types';

import { getCachedModule } from '../lib/moduleSystem';

const preamble =
  '/* THIS FILE IS AUTOGENERATED. DO NOT EDIT IT DIRECTLY, NOR COMMIT IT TO VERSION CONTROL. */';

function parseCurrentFilename(filename: string, outDir: string = '') {
  const dirname = path.isAbsolute(filename)
    ? path.dirname(filename)
    : path.join(process.cwd(), outDir);
  const basename = /(.+)\..+$/.exec(path.basename(filename))[1];
  return path.join(dirname, `${basename}.css`);
}

function parseFilename(
  filename: string,
  currentFilename: string,
  outDir: string = ''
) {
  const dirname = path.isAbsolute(outDir)
    ? outDir
    : path.join(process.cwd(), outDir);
  const basename = /(.+)\..+$/.exec(path.basename(currentFilename))[1];
  return path.join(dirname, filename.replace('[name]', basename));
}

let stylesCache = {};

function hasCachedStyles(filename: string, styles: string) {
  return stylesCache[filename] && stylesCache[filename] === styles;
}

function createCssFromCache() {
  return Object.keys(stylesCache).reduce(
    (acc, file) => `${acc}\n${stylesCache[file]}`,
    preamble
  );
}

function addRequireForCss(
  types: BabelTypes,
  program: NodePath<*>,
  filename: string
) {
  program.node.body.unshift(
    types.expressionStatement(
      types.callExpression(types.identifier('require'), [
        types.stringLiteral(filename),
      ])
    )
  );
}

export default function extractStyles(
  types: BabelTypes,
  program: NodePath<*>,
  currentFilename: string,
  options: {
    single?: boolean,
    filename?: string,
    outDir?: string,
    cache?: boolean,
    extract?: boolean,
  }
) {
  const { single, filename, cache, extract } = {
    cache: true,
    extract: true,
    single: false,
    ...options,
    filename: options.filename
      ? parseFilename(options.filename, currentFilename, options.outDir)
      : parseCurrentFilename(currentFilename, options.outDir),
  };

  if (!extract) {
    return;
  }

  const sheet = getCachedModule(require.resolve('../../sheet.js'));
  const data = sheet ? sheet.exports.default.dump() : '';

  if (!data.length) {
    return;
  }

  if (cache && hasCachedStyles(filename, data)) {
    if (!single) {
      addRequireForCss(types, program, filename);
    }

    return;
  }

  if (cache) {
    if (single) {
      if (hasCachedStyles(currentFilename, data)) {
        return;
      }
      stylesCache[currentFilename] = data;
    } else {
      if (hasCachedStyles(filename, data)) {
        addRequireForCss(types, program, filename);
        return;
      }
      stylesCache[filename] = data;
    }
  }

  if (single) {
    fs.writeFileSync(filename, createCssFromCache());
  } else {
    fs.writeFileSync(filename, `${preamble}\n${data}`);
    addRequireForCss(types, program, filename);
  }
}

export function clearCache() {
  stylesCache = {};
}
